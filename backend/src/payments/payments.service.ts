import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Payment, Prisma } from '@prisma/client';
import { orderCode, orderNumberFromCode, toApiPaymentMethod } from '../common/api-enums.js';
import { isPrismaError } from '../common/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RecordPaymentDto } from './dto/record-payment.dto.js';

const toPaymentResponse = (payment: Payment & { order: { number: number } }) => ({
  id: payment.id,
  receipt: payment.receipt,
  orderId: orderCode(payment.order.number),
  amount: payment.amount.toNumber(),
  method: toApiPaymentMethod(payment.method),
  paid: payment.paid,
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
          receipt,
          recordedById,
        },
        create: {
          orderId: order.id,
          amount,
          method: dto.method,
          paid: dto.paid,
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

  private async nextReceipt() {
    const latest = await this.prisma.payment.findMany({
      where: { receipt: { not: null } },
      select: { receipt: true },
    });
    const max = latest.reduce((highest, payment) => {
      const value = Number(payment.receipt?.replace(/^R-/, ''));
      return Number.isFinite(value) ? Math.max(highest, value) : highest;
    }, 0);
    return `R-${max + 1}`;
  }
}
