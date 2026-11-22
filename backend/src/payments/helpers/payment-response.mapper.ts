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
  amount: number;
  method: string;
  status: string;
  paid: boolean;
  provider?: string;
  transactionId?: string;
  verifiedAt?: string;
  date: string;
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
  amount: payment.amount.toNumber(),
  method: toApiPaymentMethod(payment.method),
  status: toApiPaymentStatus(payment.status),
  paid: payment.paid,
  provider: payment.provider ?? undefined,
  transactionId: payment.transactionId ?? undefined,
  verifiedAt: payment.verifiedAt?.toISOString(),
  date: payment.updatedAt.toISOString(),
});
