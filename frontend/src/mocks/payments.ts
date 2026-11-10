import type { Payment } from "../features/payments/types";

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

export const payments: Payment[] = [
  { id: "p1", receipt: "R-2201", orderId: "ORD-1001", amount: 16.98, method: "cash", paid: true, date: minutesAgo(2) },
  { id: "p2", receipt: "R-2200", orderId: "ORD-1000", amount: 8.99, method: "card", paid: true, date: minutesAgo(9) },
  { id: "p3", receipt: null, orderId: "ORD-0999", amount: 24.5, method: "cash", paid: false, date: minutesAgo(10) },
  { id: "p4", receipt: "R-2198", orderId: "ORD-0998", amount: 3.99, method: "mobile", paid: true, date: minutesAgo(15) },
];