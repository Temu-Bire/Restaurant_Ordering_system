import { api } from "../../lib/apiClient";
import type { Payment } from "../../features/payments/types";
import type { PaymentMethod } from "../../features/orders/types";

export async function listPayments(): Promise<Payment[]> {
  return api.get<Payment[]>("/payments");
}

export async function recordPayment(body: {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  paid: boolean;
}): Promise<Payment> {
  return api.post<Payment>("/payments", body);
}
