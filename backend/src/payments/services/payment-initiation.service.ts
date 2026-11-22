import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';
import { orderNumberFromCode } from '../../common/api-enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ChapaGateway } from '../gateways/chapa.gateway.js';
import {
  PaymentResponse,
  toPaymentResponse,
} from '../helpers/payment-response.mapper.js';

@Injectable()
export class PaymentInitiationService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly chapa?: ChapaGateway,
    @Optional() private readonly config?: ConfigService,
  ) {}

  async initiate(
    orderId: string,
    provider: string = 'Chapa',
    actorId?: string,
    actorRole?: string,
  ): Promise<PaymentResponse> {
    const number = orderNumberFromCode(orderId);
    const order = await this.prisma.order.findUnique({
      where: number === null ? { id: orderId } : { number },
      include: { payment: true },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (actorRole === 'CUSTOMER' && actorId && order.customerId !== actorId) {
      throw new BadRequestException('You can only initiate payment for your own orders');
    }
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Order has already been paid');
    }
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cancelled orders cannot be paid');
    }

    const txRef = `ARIF-${order.number}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const normalizedProvider = 'Chapa';

    let checkoutUrl: string | undefined = undefined;

    if (this.chapa) {
      const appUrl = this.config?.get<string>('appUrl') || 'http://localhost:3000';
      const frontendUrl =
        this.config?.get<string>('frontendUrl') || 'http://localhost:5173';

      const customer = order.customerId
        ? await this.prisma.user.findUnique({ where: { id: order.customerId } })
        : null;

      const customerNames = (customer?.fullName ?? 'Customer').split(' ');
      const firstName = customerNames[0] || 'Customer';
      const lastName = customerNames.slice(1).join(' ') || 'Guest';

      const chapaInit = await this.chapa.initialize({
        amount: order.total.toNumber(),
        currency: 'ETB',
        email: customer?.email || 'customer@ariffood.com',
        firstName,
        lastName,
        phoneNumber: customer?.phone || undefined,
        txRef,
        callbackUrl: `${appUrl}/api/payments/webhook/chapa`,
        returnUrl: `${frontendUrl}/customer/orders/${order.id}/track?tx_ref=${txRef}`,
        customization: {
          title: 'Arif Food Order Checkout',
          description: `Payment for Order #${order.number}`,
        },
      });

      checkoutUrl = chapaInit.checkoutUrl;
    }

    const payment = await this.prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        customerId: order.customerId,
        amount: order.total,
        currency: 'ETB',
        method: PaymentMethod.MOBILE,
        status: PaymentStatus.PENDING,
        provider: normalizedProvider,
        transactionId: txRef,
        txRef,
        checkoutUrl,
        paymentUrl: checkoutUrl,
        paid: false,
      },
      update: {
        customerId: order.customerId,
        amount: order.total,
        currency: 'ETB',
        provider: normalizedProvider,
        transactionId: txRef,
        txRef,
        checkoutUrl,
        paymentUrl: checkoutUrl,
        status: PaymentStatus.PENDING,
        paid: false,
      },
      include: { order: { select: { number: true } } },
    });

    return toPaymentResponse(payment);
  }
}
