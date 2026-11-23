import {
  InventoryCategory,
  MovementType,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  TableStatus,
} from '@prisma/client';

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
  served: OrderStatus.SERVED,
  picked_up: OrderStatus.PICKED_UP,
  'picked-up': OrderStatus.PICKED_UP,
  out_for_delivery: OrderStatus.OUT_FOR_DELIVERY,
  'out-for-delivery': OrderStatus.OUT_FOR_DELIVERY,
  delivered: OrderStatus.DELIVERED,
  completed: OrderStatus.COMPLETED,
  cancelled: OrderStatus.CANCELLED,
  PENDING: OrderStatus.PENDING,
  CONFIRMED: OrderStatus.CONFIRMED,
  PREPARING: OrderStatus.PREPARING,
  READY: OrderStatus.READY,
  SERVED: OrderStatus.SERVED,
  PICKED_UP: OrderStatus.PICKED_UP,
  OUT_FOR_DELIVERY: OrderStatus.OUT_FOR_DELIVERY,
  DELIVERED: OrderStatus.DELIVERED,
  COMPLETED: OrderStatus.COMPLETED,
  CANCELLED: OrderStatus.CANCELLED,
};

const PAYMENT_STATUSES: Record<string, PaymentStatus> = {
  unpaid: PaymentStatus.UNPAID,
  pending: PaymentStatus.PENDING,
  paid: PaymentStatus.PAID,
  failed: PaymentStatus.FAILED,
  expired: PaymentStatus.EXPIRED,
  refunded: PaymentStatus.REFUNDED,
  UNPAID: PaymentStatus.UNPAID,
  PENDING: PaymentStatus.PENDING,
  PAID: PaymentStatus.PAID,
  FAILED: PaymentStatus.FAILED,
  EXPIRED: PaymentStatus.EXPIRED,
  REFUNDED: PaymentStatus.REFUNDED,
};

const TABLE_STATUSES: Record<string, TableStatus> = {
  available: TableStatus.AVAILABLE,
  free: TableStatus.AVAILABLE,
  reserved: TableStatus.RESERVED,
  occupied: TableStatus.OCCUPIED,
  cleaning: TableStatus.CLEANING,
  AVAILABLE: TableStatus.AVAILABLE,
  FREE: TableStatus.AVAILABLE,
  RESERVED: TableStatus.RESERVED,
  OCCUPIED: TableStatus.OCCUPIED,
  CLEANING: TableStatus.CLEANING,
};

export const parseOrderType = (value: unknown) =>
  typeof value === 'string' ? (ORDER_TYPES[value] ?? value) : value;

export const parsePaymentMethod = (value: unknown) =>
  typeof value === 'string' ? (PAYMENT_METHODS[value] ?? value) : value;

export const parseOrderStatus = (value: unknown) =>
  typeof value === 'string' ? (ORDER_STATUSES[value] ?? value) : value;

export const parsePaymentStatus = (value: unknown) =>
  typeof value === 'string' ? (PAYMENT_STATUSES[value] ?? value) : value;

export const parseTableStatus = (value: unknown) =>
  typeof value === 'string' ? (TABLE_STATUSES[value] ?? value) : value;

export const toApiOrderType = (type: OrderType) => {
  if (type === OrderType.DINE_IN) return 'dine-in';
  if (type === OrderType.TAKEAWAY) return 'takeaway';
  return 'delivery';
};

export const toApiPaymentMethod = (method: PaymentMethod) => method.toLowerCase();

export const toApiOrderStatus = (status: OrderStatus) => status.toLowerCase();

export const toApiPaymentStatus = (status: PaymentStatus) => status.toLowerCase();

export const toApiTableStatus = (status: TableStatus) => {
  if (status === TableStatus.FREE || status === TableStatus.AVAILABLE) return 'available';
  return status.toLowerCase();
};

export const orderCode = (number: number) => `ORD-${number}`;

export const orderNumberFromCode = (id: string) => {
  const match = /^ORD-(\d+)$/i.exec(id.trim());
  return match ? Number(match[1]) : null;
};

const INVENTORY_CATEGORIES: Record<string, InventoryCategory> = {
  ingredients: InventoryCategory.INGREDIENTS,
  beverages: InventoryCategory.BEVERAGES,
  dry_goods: InventoryCategory.DRY_GOODS,
  'dry-goods': InventoryCategory.DRY_GOODS,
  packaging: InventoryCategory.PACKAGING,
  supplies: InventoryCategory.SUPPLIES,
  INGREDIENTS: InventoryCategory.INGREDIENTS,
  BEVERAGES: InventoryCategory.BEVERAGES,
  DRY_GOODS: InventoryCategory.DRY_GOODS,
  PACKAGING: InventoryCategory.PACKAGING,
  SUPPLIES: InventoryCategory.SUPPLIES,
};

export const parseInventoryCategory = (value: unknown) =>
  typeof value === 'string' ? (INVENTORY_CATEGORIES[value] ?? value) : value;

export const toApiInventoryCategory = (category: InventoryCategory) =>
  category.toLowerCase();

export const parseMovementType = (value: unknown) => {
  if (typeof value !== 'string') return value;
  const upper = value.toUpperCase();
  if (upper in MovementType) return upper as MovementType;
  return value;
};

