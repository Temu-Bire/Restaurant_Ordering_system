export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "served"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "completed"
  | "cancelled";

export type PaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "failed"
  | "expired"
  | "refunded";

export type OrderType = "dine-in" | "takeaway" | "delivery";
export type PaymentMethod = "cash" | "card" | "mobile";

export interface OrderLine {
  id?: string; // orderItemId
  foodId?: string;
  name: string;
  quantity: number;
  price: number;
  review?: {
    id: string;
    rating: number;
    comment?: string | null;
  } | null;
}

export interface Order {
  id: string; // "ORD-1001"
  uuid?: string;
  date: string; // ISO date
  type: OrderType;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  partySize?: number;
  prepTimeMinutes?: number;
  table?: string;
  tableCapacity?: number;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryDistanceKm?: number;
  pickupInstructions?: string;
  subtotal?: number;
  deliveryFee?: number;
  tax?: number;
  total: number;
  lines: OrderLine[];
  handover?: {
    staffName: string;
    at: string;
    notes?: string;
  };
  payment: {
    id?: string;
    method: PaymentMethod;
    status?: PaymentStatus;
    paid: boolean;
    provider?: string;
    transactionId?: string;
  };
}

export const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  "dine-in": "Dine-in",
  takeaway: "Takeaway",
  delivery: "Delivery",
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  mobile: "Mobile Payment",
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending Payment",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  picked_up: "Picked Up",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  expired: "Expired",
  refunded: "Refunded",
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
    "served",
    "picked_up",
    "out_for_delivery",
    "delivered",
    "completed",
    "cancelled",
  ] as OrderStatus[]
).map((value) => ({
  value,
  label: ORDER_STATUS_LABEL[value] ?? value,
}));
