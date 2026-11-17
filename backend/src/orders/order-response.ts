import { Order, OrderItem, Payment, RestaurantTable } from '@prisma/client';
import {
  orderCode,
  toApiOrderStatus,
  toApiOrderType,
  toApiPaymentMethod,
} from '../common/api-enums.js';

export type OrderRecord = Order & {
  items: OrderItem[];
  payment: Payment | null;
  table: RestaurantTable | null;
};

export const orderInclude = {
  items: true,
  payment: true,
  table: true,
} as const;

export const toOrderResponse = (order: OrderRecord) => ({
  id: orderCode(order.number),
  date: order.createdAt.toISOString(),
  type: toApiOrderType(order.type),
  status: toApiOrderStatus(order.status),
  table: order.table?.name ?? order.tableLabel ?? undefined,
  total: order.total.toNumber(),
  lines: order.items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    price: item.unitPrice.toNumber(),
  })),
  payment: {
    method: toApiPaymentMethod(order.payment?.method ?? 'CASH'),
    paid: order.payment?.paid ?? false,
  },
});
