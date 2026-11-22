import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { orderNumberFromCode } from '../../common/api-enums.js';
import { isPrismaError } from '../../common/prisma-errors.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RecordPaymentDto } from '../dto/record-payment.dto.js';
import { VerifyPaymentDto } from '../dto/verify-payment.dto.js';
import {
  PaymentResponse,
  toPaymentResponse,
} from '../helpers/payment-response.mapper.js';
import { PaymentInitiationService } from './payment-initiation.service.js';
import {
  PaymentVerificationService,
  VerifyPaymentResult,
} from './payment-verification.service.js';
import { ReceiptService } from './receipt.service.js';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentInitiation: PaymentInitiationService,
    private readonly paymentVerification: PaymentVerificationService,
    private readonly receiptService: ReceiptService,
  ) {}

  async findAll(): Promise<PaymentResponse[]> {
    const payments = await this.prisma.payment.findMany({
      include: { order: { select: { number: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return payments.map(toPaymentResponse);
  }

  async record(dto: RecordPaymentDto, recordedById: string): Promise<PaymentResponse> {
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
      ? (order.payment?.receipt ?? (await this.receiptService.nextReceipt()))
      : null;

    try {
      const payment = await this.prisma.payment.upsert({
        where: { orderId: order.id },
        update: {
          customerId: order.customerId,
          amount,
          currency: 'ETB',
          method: dto.method,
          paid: dto.paid,
          status: dto.paid ? PaymentStatus.PAID : PaymentStatus.PENDING,
          receipt,
          recordedById,
        },
        create: {
          orderId: order.id,
          customerId: order.customerId,
          amount,
          currency: 'ETB',
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

  async initiate(orderId: string, provider: string = 'Chapa'): Promise<PaymentResponse> {
    return this.paymentInitiation.initiate(orderId, provider);
  }

  async verify(
    paymentIdOrOrderId: string,
    dto: VerifyPaymentDto,
  ): Promise<VerifyPaymentResult> {
    return this.paymentVerification.verify(paymentIdOrOrderId, dto);
  }

  async handleWebhook(payload: any, signature?: string) {
    return this.paymentVerification.handleWebhook(payload, signature);
  }
}
