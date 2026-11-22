import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import {
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  TableStatus,
} from '@prisma/client';
import { DeliveryService } from '../../delivery/delivery.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SettingsService } from '../../settings/settings.service.js';
import { TablesService } from '../../tables/tables.service.js';
import { CreateOrderDto } from '../dto/create-order.dto.js';
import {
  calculatePrepTimeMinutes,
  formatApiOrderType,
  mergeItems,
} from '../helpers/order-items.helper.js';
import {
  orderInclude,
  OrderResponse,
  toOrderResponse,
} from '../helpers/order-response.mapper.js';

@Injectable()
export class OrderCheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly delivery: DeliveryService,
    private readonly tables: TablesService,
  ) {}

  async create(customerId: string, dto: CreateOrderDto): Promise<OrderResponse> {
    const settings = await this.settings.get();
    if (!settings.orderTypes.includes(formatApiOrderType(dto.type))) {
      throw new BadRequestException('That order type is not available');
    }

    // Customer checkout requires Mobile Payment
    if (dto.paymentMethod !== PaymentMethod.MOBILE) {
      throw new BadRequestException(
        'Customer checkout requires Mobile Payment (e.g. Telebirr, CBE Birr, Chapa)',
      );
    }

    const merged = mergeItems(dto.items);
    const foodIds = merged.map((item) => item.foodId);

    const totalQuantity = merged.reduce((acc, curr) => acc + curr.quantity, 0);
    const prepTimeMinutes = calculatePrepTimeMinutes(totalQuantity);

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

        const table = await this.tables.findAvailableForParty(partySize);
        tableId = table.id;
        tableLabel = table.name;

        // Hold table for 15 minutes during payment
        heldUntil = new Date(Date.now() + 15 * 60 * 1000);

        // Atomic conditional reservation to prevent race conditions
        const reserved = await tx.restaurantTable.updateMany({
          where: {
            id: table.id,
            OR: [
              { status: TableStatus.AVAILABLE },
              { status: TableStatus.FREE },
              {
                status: TableStatus.RESERVED,
                heldUntil: { lt: new Date() },
                activeOrderId: null,
              },
            ],
          },
          data: {
            status: TableStatus.RESERVED,
            heldUntil,
          },
        });

        if (reserved.count === 0) {
          throw new ConflictException(
            'The selected table was just reserved by another guest. Please try again.',
          );
        }
      } else if (dto.type === OrderType.TAKEAWAY) {
        pickupInstructions =
          dto.pickupInstructions?.trim() ||
          'Please show your order ID at the restaurant takeaway counter.';
      } else if (dto.type === OrderType.DELIVERY) {
        if (!dto.addressId) {
          throw new BadRequestException('A delivery address is required for delivery orders');
        }

        // Fixed customerId -> userId schema relation
        const address = await tx.address.findFirst({
          where: { id: dto.addressId, userId: customerId },
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
}
