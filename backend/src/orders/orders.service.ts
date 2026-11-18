import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  OrderType,
  Prisma,
  Role,
  TableStatus,
} from '@prisma/client';
import { orderNumberFromCode } from '../common/api-enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { AssignTableDto } from './dto/assign-table.dto.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
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
  OrderStatus.PREPARING,
];

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
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
    if (!settings.paymentMethods.includes(dto.paymentMethod.toLowerCase())) {
      throw new BadRequestException('That payment method is not available');
    }

    const merged = this.mergeItems(dto.items);
    const foodIds = merged.map((item) => item.foodId);

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

      const deliveryFee =
        dto.type === OrderType.DELIVERY
          ? new Prisma.Decimal(settings.deliveryFee)
          : new Prisma.Decimal(0);
      const tax = subtotal.mul(settings.taxRate).div(100).toDecimalPlaces(2);
      const total = subtotal.add(deliveryFee).add(tax).toDecimalPlaces(2);

      const table = await this.resolveTable(tx, dto);

      await this.adjustStock(tx, lines, 'deduct');

      const order = await tx.order.create({
        data: {
          customerId,
          type: dto.type,
          tableId: table?.id,
          tableLabel: table?.name ?? dto.table?.trim() ?? null,
          subtotal: subtotal.toDecimalPlaces(2),
          deliveryFee,
          tax,
          total,
          stockAdjusted: true,
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
              method: dto.paymentMethod,
              paid: false,
            },
          },
        },
        include: orderInclude,
      });

      if (table) {
        await tx.restaurantTable.update({
          where: { id: table.id },
          data: { status: TableStatus.OCCUPIED },
        });
      }

      return toOrderResponse(order);
    });
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    actor: { id: string; role: Role },
  ) {
    const order = await this.findRecord(id);
    if (actor.role === Role.CUSTOMER) {
      throw new ForbiddenException('Only staff can update order status');
    }
    return this.changeStatus(order.id, dto.status);
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
    if (table.status !== TableStatus.FREE && table.id !== order.tableId) {
      throw new BadRequestException('That table is not free');
    }

    const previousTableId = order.tableId;
    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: { tableId: table.id, tableLabel: table.name },
      include: orderInclude,
    });
    await this.prisma.restaurantTable.update({
      where: { id: table.id },
      data: { status: TableStatus.OCCUPIED },
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

      const closing = status === OrderStatus.CANCELLED || status === OrderStatus.COMPLETED;
      const wasOpen = OPEN_STATUSES.includes(order.status) || order.status === OrderStatus.PENDING;

      if (status === OrderStatus.CANCELLED && order.stockAdjusted) {
        await this.adjustStock(
          tx,
          order.items.map((item) => ({
            food: item.food,
            quantity: item.quantity,
          })),
          'restore',
        );
      }

      if (order.status === OrderStatus.CANCELLED && status !== OrderStatus.CANCELLED && !order.stockAdjusted) {
        await this.adjustStock(
          tx,
          order.items.map((item) => ({
            food: item.food,
            quantity: item.quantity,
          })),
          'deduct',
        );
      }

      const updated = await tx.order.update({
        where: { id },
        data: {
          status,
          stockAdjusted: status === OrderStatus.CANCELLED ? false : true,
        },
        include: orderInclude,
      });

      if (closing && wasOpen && order.tableId) {
        await this.releaseTable(order.tableId, tx);
      }
      if (!closing && order.tableId) {
        await tx.restaurantTable.update({
          where: { id: order.tableId },
          data: { status: TableStatus.OCCUPIED },
        });
      }

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

  private async resolveTable(
    tx: Prisma.TransactionClient,
    dto: CreateOrderDto,
  ) {
    if (dto.type !== OrderType.DINE_IN) return null;
    const name = dto.table?.trim();
    if (!name) throw new BadRequestException('Table number is required');

    let table = await tx.restaurantTable.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (!table) {
      // Allow prefix matches (e.g. "Table 3" matches "Table 3 - Gondar")
      table = await tx.restaurantTable.findFirst({
        where: { name: { startsWith: name, mode: 'insensitive' } },
      });
    }

    if (!table) {
      // Allow shorthand table numbers (e.g. "3" or "T3" matches "Table 3 - ...")
      const match = /^T?(\d+)$/i.exec(name);
      if (match) {
        table = await tx.restaurantTable.findFirst({
          where: { name: { startsWith: `Table ${match[1]}`, mode: 'insensitive' } },
        });
      }
    }

    if (!table) throw new BadRequestException('That table was not found');
    if (table.status !== TableStatus.FREE) {
      throw new BadRequestException('That table is not free');
    }
    return table;
  }

  private async adjustStock(
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

  private async releaseTable(tableId: string, tx: Prisma.TransactionClient = this.prisma) {
    const stillOpen = await tx.order.count({
      where: { tableId, status: { in: OPEN_STATUSES } },
    });
    if (stillOpen === 0) {
      await tx.restaurantTable.update({
        where: { id: tableId },
        data: { status: TableStatus.FREE },
      });
    }
  }
}
