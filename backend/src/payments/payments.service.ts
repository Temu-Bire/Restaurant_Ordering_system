import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  OrderType,
  Payment,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  TableStatus,
} from '@prisma/client';
import {
  orderCode,
  orderNumberFromCode,
  toApiOrderStatus,
  toApiPaymentMethod,
  toApiPaymentStatus,
} from '../common/api-enums.js';
import { isPrismaError } from '../common/prisma-errors.js';
import { adjustOrderStock } from '../orders/orders.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RecordPaymentDto } from './dto/record-payment.dto.js';
import { PaymentVerificationOutcome, VerifyPaymentDto } from './dto/verify-payment.dto.js';

export const toPaymentResponse = (payment: Payment & { order: { number: number } }) => ({
  id: payment.id,
  receipt: payment.receipt,
  orderId: orderCode(payment.order.number),
  amount: payment.amount.toNumber(),
  method: toApiPaymentMethod(payment.method),
  status: toApiPaymentStatus(payment.status),
  paid: payment.paid,
  provider: payment.provider ?? undefined,
  transactionId: payment.transactionId ?? undefined,
  verifiedAt: payment.verifiedAt?.toISOString(),
  date: payment.updatedAt.toISOString(),
});

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const payments = await this.prisma.payment.findMany({
      include: { order: { select: { number: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return payments.map(toPaymentResponse);
  }

  async record(dto: RecordPaymentDto, recordedById: string) {
    const number = orderNumberFromCode(dto.orderId);
    const order = await this.prisma.order.findUnique({
      where: number === null ? { id: dto.orderId } : { number },
      include: { payment: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cancelled orders cannot be paid');
    }

    const amount = new Prisma.Decimal(dto.amount).toDecimalPlaces(2);
    const receipt = dto.paid
      ? (order.payment?.receipt ?? (await this.nextReceipt()))
      : null;

    try {
      const payment = await this.prisma.payment.upsert({
        where: { orderId: order.id },
        update: {
          amount,
          method: dto.method,
          paid: dto.paid,
          status: dto.paid ? PaymentStatus.PAID : PaymentStatus.PENDING,
          receipt,
          recordedById,
        },
        create: {
          orderId: order.id,
          amount,
          method: dto.method,
          paid: dto.paid,
          status: dto.paid ? PaymentStatus.PAID : PaymentStatus.PENDING,
          receipt,
          recordedById,
        },
        include: { order: { select: { number: true } } },
      });
      return toPaymentResponse(payment);
    } catch (error) {
      if (isPrismaError(error, 'P2002')) {
        throw new BadRequestException('Could not generate a unique receipt. Try again.');
      }
      throw error;
    }
  }

  async initiate(orderId: string, provider: string = 'Telebirr') {
    const number = orderNumberFromCode(orderId);
    const order = await this.prisma.order.findUnique({
      where: number === null ? { id: orderId } : { number },
      include: { payment: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Order has already been paid');
    }
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cancelled orders cannot be paid');
    }

    const transactionId = `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const payment = await this.prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        amount: order.total,
        method: PaymentMethod.MOBILE,
        status: PaymentStatus.PENDING,
        provider,
        transactionId,
        paid: false,
      },
      update: {
        provider,
        transactionId,
        status: PaymentStatus.PENDING,
        paid: false,
      },
      include: { order: { select: { number: true } } },
    });

    return toPaymentResponse(payment);
  }

  async verify(paymentIdOrOrderId: string, dto: VerifyPaymentDto) {
    const number = orderNumberFromCode(paymentIdOrOrderId);

    // Locate payment by payment ID, order UUID, or order number
    let payment = await this.prisma.payment.findFirst({
      where: {
        OR: [
          { id: paymentIdOrOrderId },
          { orderId: paymentIdOrOrderId },
          ...(number !== null ? [{ order: { number } }] : []),
        ],
      },
      include: {
        order: {
          include: {
            items: { include: { food: { include: { recipes: true } } } },
            table: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    const order = payment.order;
    const isSuccess = dto.outcome === PaymentVerificationOutcome.SUCCESS;

    return this.prisma.$transaction(async (tx) => {
      let receipt: string | null = null;
      let targetPaymentStatus: PaymentStatus;
      let targetOrderStatus: OrderStatus;

      if (isSuccess) {
        receipt = payment.receipt ?? (await this.nextReceipt());
        targetPaymentStatus = PaymentStatus.PAID;
        targetOrderStatus = OrderStatus.CONFIRMED;

        // Deduct inventory stock if not already deducted
        if (!order.stockAdjusted) {
          await adjustOrderStock(
            tx,
            order.items.map((item) => ({
              food: item.food,
              quantity: item.quantity,
            })),
            'deduct',
          );
        }

        // Confirm table reservation for dine-in
        if (order.type === OrderType.DINE_IN && order.tableId) {
          await tx.restaurantTable.update({
            where: { id: order.tableId },
            data: {
              status: TableStatus.OCCUPIED,
              activeOrderId: order.id,
              heldUntil: null,
            },
          });
        }
      } else {
        targetPaymentStatus =
          dto.outcome === PaymentVerificationOutcome.EXPIRED
            ? PaymentStatus.EXPIRED
            : PaymentStatus.FAILED;
        targetOrderStatus = OrderStatus.CANCELLED;

        // Release temporary table hold
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

        // Restore stock if it was previously deducted
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
      }

      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: targetPaymentStatus,
          paid: isSuccess,
          receipt,
          transactionId: dto.transactionRef || payment.transactionId,
          verifiedAt: isSuccess ? new Date() : null,
        },
        include: { order: { select: { number: true } } },
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: targetOrderStatus,
          paymentStatus: targetPaymentStatus,
          stockAdjusted: isSuccess,
          heldUntil: null,
        },
      });

      return {
        success: isSuccess,
        outcome: dto.outcome,
        orderStatus: toApiOrderStatus(targetOrderStatus),
        paymentStatus: toApiPaymentStatus(targetPaymentStatus),
        payment: toPaymentResponse(updatedPayment),
      };
    });
  }

  private async nextReceipt(): Promise<string> {
    const recent = await this.prisma.payment.findMany({
      where: { receipt: { not: null } },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: { receipt: true },
    });
    const max = recent.reduce((highest, payment) => {
      const value = Number(payment.receipt?.replace(/^R-/, ''));
      return Number.isFinite(value) ? Math.max(highest, value) : highest;
    }, 0);
    return `R-${max + 1}`;
  }
}
