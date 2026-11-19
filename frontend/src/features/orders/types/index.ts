export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export type OrderType = "dine-in" | "takeaway" | "delivery";
export type PaymentMethod = "cash" | "card" | "mobile";

export interface OrderLine {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string; // "ORD-1001" (the # is added when displaying)
  date: string; // ISO date
  type: OrderType;
  status: OrderStatus;
  table?: string;
  total: number;
  lines: OrderLine[];
  payment: { method: PaymentMethod; paid: boolean };
}

export const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  "dine-in": "Dine-in",
  takeaway: "Takeaway",
  delivery: "Delivery",
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  mobile: "Mobile",
};

// Ready-made options for pickers and selects
export const orderTypeOptions = (
  Object.keys(ORDER_TYPE_LABEL) as OrderType[]
).map((value) => ({ value, label: ORDER_TYPE_LABEL[value] }));

export const paymentOptions = (
  Object.keys(PAYMENT_LABEL) as PaymentMethod[]
).map((value) => ({ value, label: PAYMENT_LABEL[value] }));

export const statusOptions = (
  [
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "completed",
    "cancelled",
  ] as OrderStatus[]
).map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}));