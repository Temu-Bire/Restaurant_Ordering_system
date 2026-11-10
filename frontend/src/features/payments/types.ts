import type { PaymentMethod } from "../orders/types";

export interface Payment {
  id: string;
  receipt: string | null; // null until the payment is recorded as paid
  orderId: string;
  amount: number;
  method: PaymentMethod;
  paid: boolean;
  date: string; // ISO
}

export const paymentStatusOptions = [
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
];