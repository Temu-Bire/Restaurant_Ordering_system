import { OrderStatus, OrderType, PaymentMethod, TableStatus } from '@prisma/client';

const ORDER_TYPES: Record<string, OrderType> = {
  'dine-in': OrderType.DINE_IN,
  takeaway: OrderType.TAKEAWAY,
  delivery: OrderType.DELIVERY,
  DINE_IN: OrderType.DINE_IN,
  TAKEAWAY: OrderType.TAKEAWAY,
  DELIVERY: OrderType.DELIVERY,
};

const PAYMENT_METHODS: Record<string, PaymentMethod> = {
  cash: PaymentMethod.CASH,
  card: PaymentMethod.CARD,
  mobile: PaymentMethod.MOBILE,
  CASH: PaymentMethod.CASH,
  CARD: PaymentMethod.CARD,
  MOBILE: PaymentMethod.MOBILE,
};

const ORDER_STATUSES: Record<string, OrderStatus> = {
  pending: OrderStatus.PENDING,
  confirmed: OrderStatus.CONFIRMED,
  preparing: OrderStatus.PREPARING,
  ready: OrderStatus.READY,
  completed: OrderStatus.COMPLETED,
  cancelled: OrderStatus.CANCELLED,
  PENDING: OrderStatus.PENDING,
  CONFIRMED: OrderStatus.CONFIRMED,
  PREPARING: OrderStatus.PREPARING,
  READY: OrderStatus.READY,
  COMPLETED: OrderStatus.COMPLETED,
  CANCELLED: OrderStatus.CANCELLED,
};

export const parseOrderType = (value: unknown) =>
  typeof value === 'string' ? (ORDER_TYPES[value] ?? value) : value;

export const parsePaymentMethod = (value: unknown) =>
  typeof value === 'string' ? (PAYMENT_METHODS[value] ?? value) : value;

export const parseOrderStatus = (value: unknown) =>
  typeof value === 'string' ? (ORDER_STATUSES[value] ?? value) : value;

export const toApiOrderType = (type: OrderType) => {
  if (type === OrderType.DINE_IN) return 'dine-in';
  if (type === OrderType.TAKEAWAY) return 'takeaway';
  return 'delivery';
};

export const toApiPaymentMethod = (method: PaymentMethod) => method.toLowerCase();

export const toApiOrderStatus = (status: OrderStatus) => status.toLowerCase();

export const toApiTableStatus = (status: TableStatus) => status.toLowerCase();

export const orderCode = (number: number) => `ORD-${number}`;

export const orderNumberFromCode = (id: string) => {
  const match = /^ORD-(\d+)$/i.exec(id.trim());
  return match ? Number(match[1]) : null;
};
