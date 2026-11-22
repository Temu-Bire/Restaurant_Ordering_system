import { OrderStatus } from '@prisma/client';

export const COMPLETED_STATUS_GROUP: OrderStatus[] = [
  OrderStatus.COMPLETED,
  OrderStatus.SERVED,
  OrderStatus.PICKED_UP,
  OrderStatus.DELIVERED,
];

export const PENDING_STATUS_GROUP: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
];

export const ACTIVE_DELIVERY_STATUS_GROUP: OrderStatus[] = [
  OrderStatus.READY,
  OrderStatus.OUT_FOR_DELIVERY,
];

export function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function roundTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}
