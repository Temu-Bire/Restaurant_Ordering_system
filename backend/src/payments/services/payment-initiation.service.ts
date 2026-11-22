import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';
import { orderNumberFromCode } from '../../common/api-enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  PaymentResponse,
  toPaymentResponse,
} from '../helpers/payment-response.mapper.js';

@Injectable()
export class PaymentInitiationService {
  constructor(private readonly prisma: PrismaService) {}

  async initiate(orderId: string, provider: string = 'Telebirr'): Promise<PaymentResponse> {
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
}
