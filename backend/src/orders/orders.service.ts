import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  Role,
  TableStatus,
} from '@prisma/client';
import { orderNumberFromCode } from '../common/api-enums.js';
import { DeliveryService } from '../delivery/delivery.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { TablesService } from '../tables/tables.service.js';
import { AssignTableDto } from './dto/assign-table.dto.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { HandoverOrderDto } from './dto/handover-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { orderInclude, toOrderResponse } from './order-response.js';

const OPEN_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
];

const CUSTOMER_CAN_CANCEL: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
];

export async function adjustOrderStock(
  tx: Prisma.TransactionClient,
  lines: { food: { name: string; recipes: { ingredientId: string; quantity: Prisma.Decimal }[] }; quantity: number }[],
  direction: 'deduct' | 'restore',
) {
  const needed = new Map<string, Prisma.Decimal>();
  for (const line of lines) {
    for (const recipe of line.food.recipes) {
      const amount = new Prisma.Decimal(recipe.quantity).mul(line.quantity);
      needed.set(
        recipe.ingredientId,
        (needed.get(recipe.ingredientId) ?? new Prisma.Decimal(0)).add(amount),
      );
    }
  }

  for (const [ingredientId, amount] of needed) {
    if (direction === 'restore') {
      await tx.ingredient.update({
        where: { id: ingredientId },
        data: { stock: { increment: amount } },
      });
      continue;
    }

    const updated = await tx.ingredient.updateMany({
      where: { id: ingredientId, stock: { gte: amount } },
      data: { stock: { decrement: amount } },
    });
    if (updated.count !== 1) {
      const ingredient = await tx.ingredient.findUnique({ where: { id: ingredientId } });
      throw new BadRequestException(
        `Not enough ${ingredient?.name ?? 'stock'} for this order`,
      );
    }
  }
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly delivery: DeliveryService,
    private readonly tables: TablesService,
  ) {}

  async findAll() {
    const orders = await this.prisma.order.findMany({
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(toOrderResponse);
  }

  async findMine(customerId: string) {
    const orders = await this.prisma.order.findMany({
      where: { customerId },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(toOrderResponse);
  }

  async findOne(id: string, actor: { id: string; role: Role }) {
    const order = await this.findRecord(id);
    if (actor.role === Role.CUSTOMER && order.customerId !== actor.id) {
      throw new ForbiddenException('You can only view your own orders');
    }
    return toOrderResponse(order);
  }

  async create(customerId: string, dto: CreateOrderDto) {
    const settings = await this.settings.get();
    if (!settings.orderTypes.includes(this.apiType(dto.type))) {
      throw new BadRequestException('That order type is not available');
    }

    // Customer checkout is Mobile Payment only
    if (dto.paymentMethod !== PaymentMethod.MOBILE) {
      throw new BadRequestException('Customer checkout requires Mobile Payment (e.g. Telebirr, CBE Birr, Chapa)');
    }

    const merged = this.mergeItems(dto.items);
    const foodIds = merged.map((item) => item.foodId);

    // Calculate estimated prep time guidance (base 15 min + ~2 min per item, max 45 min)
    const totalQuantity = merged.reduce((acc, curr) => acc + curr.quantity, 0);
    const prepTimeMinutes = Math.min(45, Math.max(15, 15 + (totalQuantity - 1) * 2));

    return this.prisma.$transaction(async (tx) => {
      const foods = await tx.food.findMany({
        where: { id: { in: foodIds } },
        include: { recipes: true },
      });
      if (foods.length !== foodIds.length) {
        throw new BadRequestException('One or more dishes are no longer on the menu');
      }

      const foodById = new Map(foods.map((food) => [food.id, food]));
      let subtotal = new Prisma.Decimal(0);
      const lines = merged.map((item) => {
        const food = foodById.get(item.foodId)!;
        if (!food.isAvailable) {
          throw new BadRequestException(`${food.name} is unavailable`);
        }
        const unitPrice = new Prisma.Decimal(food.price);
        subtotal = subtotal.add(unitPrice.mul(item.quantity));
        return { food, quantity: item.quantity, unitPrice };
      });

      let deliveryFee = new Prisma.Decimal(0);
      let deliveryDistanceKm: Prisma.Decimal | null = null;
      let deliveryAddressText: string | null = null;
      let addressId: string | null = null;

      let tableId: string | null = null;
      let tableLabel: string | null = null;
      let partySize: number | null = null;
      let heldUntil: Date | null = null;

      let pickupInstructions: string | null = null;

      if (dto.type === OrderType.DINE_IN) {
        partySize = dto.partySize ?? 2;
        if (partySize < 1) {
          throw new BadRequestException('Please specify a valid party size for dine-in');
        }

        // Auto-assign the smallest available table accommodating the party size
        const table = await this.tables.findAvailableForParty(partySize);
        tableId = table.id;
        tableLabel = table.name;

        // Hold table for 15 minutes during payment
        heldUntil = new Date(Date.now() + 15 * 60 * 1000);
        await tx.restaurantTable.update({
          where: { id: table.id },
          data: {
            status: TableStatus.RESERVED,
            heldUntil,
          },
        });
      } else if (dto.type === OrderType.TAKEAWAY) {
        pickupInstructions =
          dto.pickupInstructions?.trim() ||
          'Please show your order ID at the restaurant takeaway counter.';
      } else if (dto.type === OrderType.DELIVERY) {
        if (!dto.addressId) {
          throw new BadRequestException('A delivery address is required for delivery orders');
        }

        const address = await tx.address.findFirst({
          where: { id: dto.addressId, customerId },
        });
        if (!address) {
          throw new BadRequestException('Selected delivery address was not found');
        }

        const quote = await this.delivery.calculateQuote({
          latitude: address.latitude.toNumber(),
          longitude: address.longitude.toNumber(),
          subtotal: subtotal.toNumber(),
        });

        if (!quote.eligible) {
          throw new BadRequestException(quote.message);
        }

        addressId = address.id;
        deliveryDistanceKm = new Prisma.Decimal(quote.distanceKm);
        deliveryFee = new Prisma.Decimal(quote.fee);
        deliveryAddressText = `${address.recipientName} (${address.phone}) - ${address.building ? address.building + ', ' : ''}${address.street}, ${address.area}, ${address.city}${address.landmark ? ' (Near ' + address.landmark + ')' : ''}`;
      }

      const tax = subtotal.mul(settings.taxRate).div(100).toDecimalPlaces(2);
      const total = subtotal.add(deliveryFee).add(tax).toDecimalPlaces(2);

      const order = await tx.order.create({
        data: {
          customerId,
          type: dto.type,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          partySize,
          prepTimeMinutes,
          tableId,
          tableLabel,
          heldUntil,
          addressId,
          deliveryDistanceKm,
          deliveryAddressText,
          pickupInstructions,
          subtotal: subtotal.toDecimalPlaces(2),
          deliveryFee,
          tax,
          total,
          stockAdjusted: false, // Stock deducted only upon successful payment verification
          items: {
            create: lines.map((line) => ({
              foodId: line.food.id,
              name: line.food.name,
              unitPrice: line.unitPrice,
              quantity: line.quantity,
            })),
          },
          payment: {
            create: {
              amount: total,
              method: PaymentMethod.MOBILE,
              status: PaymentStatus.PENDING,
              paid: false,
              provider: dto.paymentProvider || 'Telebirr',
              transactionId: `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            },
          },
        },
        include: orderInclude,
      });

      return toOrderResponse(order);
    });
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    actor: { id: string; role: Role },
  ) {
    if (actor.role !== Role.STAFF) {
      throw new ForbiddenException('Only staff can update order status');
    }
    const order = await this.findRecord(id);
    return this.changeStatus(order.id, dto.status);
  }

  async handover(id: string, actor: { id: string; role: Role }, dto: HandoverOrderDto) {
    if (actor.role !== Role.STAFF) {
      throw new ForbiddenException('Only staff can process order handover');
    }

    const order = await this.findRecord(id);

    let nextStatus: OrderStatus;
    if (order.type === OrderType.DINE_IN) {
      if (order.status !== OrderStatus.READY && order.status !== OrderStatus.PREPARING) {
        throw new BadRequestException('Order must be ready or preparing to confirm serving');
      }
      nextStatus = OrderStatus.SERVED;
    } else if (order.type === OrderType.TAKEAWAY) {
      if (order.status !== OrderStatus.READY) {
        throw new BadRequestException('Order must be ready before customer pickup');
      }
      nextStatus = OrderStatus.PICKED_UP;
    } else {
      // DELIVERY
      if (order.status === OrderStatus.READY) {
        nextStatus = OrderStatus.OUT_FOR_DELIVERY;
      } else if (order.status === OrderStatus.OUT_FOR_DELIVERY) {
        nextStatus = OrderStatus.DELIVERED;
      } else {
        throw new BadRequestException('Order must be ready or out for delivery to confirm handover');
      }
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: nextStatus,
        handoverStaffId: actor.id,
        handoverAt: new Date(),
        handoverNotes: dto.notes?.trim() || null,
      },
      include: orderInclude,
    });

    return toOrderResponse(updated);
  }

  async cancel(id: string, customerId: string) {
    const order = await this.findRecord(id);
    if (order.customerId !== customerId) {
      throw new ForbiddenException('You can only cancel your own orders');
    }
    if (!CUSTOMER_CAN_CANCEL.includes(order.status)) {
      throw new BadRequestException('This order can no longer be cancelled');
    }
    return this.changeStatus(order.id, OrderStatus.CANCELLED);
  }

  async assignTable(id: string, dto: AssignTableDto) {
    const order = await this.findRecord(id);
    if (order.type !== OrderType.DINE_IN) {
      throw new BadRequestException('Only dine-in orders can be assigned to a table');
    }
    if (!OPEN_STATUSES.includes(order.status)) {
      throw new BadRequestException('This order can no longer be assigned');
    }

    const table = await this.prisma.restaurantTable.findUnique({
      where: { id: dto.tableId },
    });
    if (!table) throw new NotFoundException('Table not found');
    if (
      table.status !== TableStatus.FREE &&
      table.status !== TableStatus.AVAILABLE &&
      table.id !== order.tableId
    ) {
      throw new BadRequestException('That table is not available');
    }

    const previousTableId = order.tableId;
    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: { tableId: table.id, tableLabel: table.name },
      include: orderInclude,
    });
    await this.prisma.restaurantTable.update({
      where: { id: table.id },
      data: { status: TableStatus.OCCUPIED, activeOrderId: order.id },
    });
    if (previousTableId && previousTableId !== table.id) {
      await this.releaseTable(previousTableId);
    }
    return toOrderResponse(updated);
  }

  private async changeStatus(id: string, status: OrderStatus) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: { include: { food: { include: { recipes: true } } } } },
      });
      if (!order) throw new NotFoundException('Order not found');
      if (order.status === status) {
        const current = await tx.order.findUnique({ where: { id }, include: orderInclude });
        return toOrderResponse(current!);
      }

      if (status === OrderStatus.CANCELLED) {
        if (order.stockAdjusted) {
          await adjustOrderStock(
            tx,
            order.items.map((item) => ({
              food: item.food,
              quantity: item.quantity,
            })),
            'restore',
          );
        }

        // If cancelled and table was held or reserved, release table hold
        if (order.tableId) {
          await tx.restaurantTable.update({
            where: { id: order.tableId },
            data: {
              status: TableStatus.AVAILABLE,
              heldUntil: null,
              activeOrderId: null,
            },
          });
        }
      }

      const updated = await tx.order.update({
        where: { id },
        data: {
          status,
          stockAdjusted: status === OrderStatus.CANCELLED ? false : order.stockAdjusted,
        },
        include: orderInclude,
      });

      return toOrderResponse(updated);
    });
  }

  private async findRecord(id: string) {
    const number = orderNumberFromCode(id);
    const order = await this.prisma.order.findUnique({
      where: number === null ? { id } : { number },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  private mergeItems(items: CreateOrderDto['items']) {
    const quantities = new Map<string, number>();
    for (const item of items) {
      quantities.set(item.foodId, (quantities.get(item.foodId) ?? 0) + item.quantity);
    }
    return [...quantities.entries()].map(([foodId, quantity]) => ({ foodId, quantity }));
  }

  private apiType(type: OrderType) {
    if (type === OrderType.DINE_IN) return 'dine-in';
    if (type === OrderType.TAKEAWAY) return 'takeaway';
    return 'delivery';
  }

  private async releaseTable(tableId: string, tx: Prisma.TransactionClient = this.prisma) {
    const stillOpen = await tx.order.count({
      where: { tableId, status: { in: OPEN_STATUSES } },
    });
    if (stillOpen === 0) {
      await tx.restaurantTable.update({
        where: { id: tableId },
        data: { status: TableStatus.AVAILABLE, activeOrderId: null, heldUntil: null },
      });
    }
  }
}
