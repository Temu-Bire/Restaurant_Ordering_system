import { Payment } from '@prisma/client';
import {
  orderCode,
  toApiPaymentMethod,
  toApiPaymentStatus,
} from '../../common/api-enums.js';

export interface PaymentResponse {
  id: string;
  receipt: string | null;
  orderId: string;
  customerId?: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  paid: boolean;
  provider?: string;
  transactionId?: string;
  txRef?: string;
  checkoutUrl?: string;
  verifiedAt?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentWithOrderNumber = Payment & {
  order: {
    number: number;
  };
};

export const toPaymentResponse = (
  payment: PaymentWithOrderNumber,
): PaymentResponse => ({
  id: payment.id,
  receipt: payment.receipt,
  orderId: orderCode(payment.order.number),
  customerId: payment.customerId ?? undefined,
  amount: payment.amount.toNumber(),
  currency: payment.currency ?? 'ETB',
  method: toApiPaymentMethod(payment.method),
  status: toApiPaymentStatus(payment.status),
  paid: payment.paid,
  provider: payment.provider ?? undefined,
  transactionId: payment.transactionId ?? undefined,
  txRef: payment.txRef ?? undefined,
  checkoutUrl: payment.checkoutUrl ?? payment.paymentUrl ?? undefined,
  verifiedAt: payment.verifiedAt?.toISOString(),
  date: payment.updatedAt.toISOString(),
  createdAt: payment.createdAt.toISOString(),
  updatedAt: payment.updatedAt.toISOString(),
});
