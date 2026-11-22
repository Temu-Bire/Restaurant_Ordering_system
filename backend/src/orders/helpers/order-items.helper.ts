import { OrderStatus, OrderType } from '@prisma/client';

export const OPEN_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
];

export const CUSTOMER_CANCELLABLE_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
];

export function mergeItems(
  items: { foodId: string; quantity: number }[],
): { foodId: string; quantity: number }[] {
  const quantities = new Map<string, number>();
  for (const item of items) {
    quantities.set(item.foodId, (quantities.get(item.foodId) ?? 0) + item.quantity);
  }
  return [...quantities.entries()].map(([foodId, quantity]) => ({ foodId, quantity }));
}

export function calculatePrepTimeMinutes(totalQuantity: number): number {
  return Math.min(45, Math.max(15, 15 + (totalQuantity - 1) * 2));
}

export function formatApiOrderType(type: OrderType): 'dine-in' | 'takeaway' | 'delivery' {
  if (type === OrderType.DINE_IN) return 'dine-in';
  if (type === OrderType.TAKEAWAY) return 'takeaway';
  return 'delivery';
}
