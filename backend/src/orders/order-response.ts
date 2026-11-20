import { Address, Order, OrderItem, Payment, RestaurantTable, User } from '@prisma/client';
import {
  orderCode,
  toApiOrderStatus,
  toApiOrderType,
  toApiPaymentMethod,
  toApiPaymentStatus,
} from '../common/api-enums.js';

export type OrderRecord = Order & {
  items: OrderItem[];
  payment: Payment | null;
  table: RestaurantTable | null;
  customer?: Partial<User> | null;
  address?: Address | null;
  handoverStaff?: Partial<User> | null;
};

export const orderInclude = {
  items: true,
  payment: true,
  table: true,
  address: true,
  handoverStaff: {
    select: {
      id: true,
      fullName: true,
    },
  },
  customer: {
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
    },
  },
} as const;

export const toOrderResponse = (order: OrderRecord) => ({
  id: orderCode(order.number),
  uuid: order.id,
  date: order.createdAt.toISOString(),
  type: toApiOrderType(order.type),
  status: toApiOrderStatus(order.status),
  paymentStatus: toApiPaymentStatus(order.paymentStatus),
  partySize: order.partySize ?? undefined,
  prepTimeMinutes: order.prepTimeMinutes ?? undefined,
  table: order.table?.name ?? order.tableLabel ?? undefined,
  tableCapacity: order.table?.seats ?? undefined,
  customerName: order.customer?.fullName ?? 'Customer',
  customerPhone: order.customer?.phone ?? undefined,
  deliveryAddress:
    order.deliveryAddressText ??
    (order.address
      ? `${order.address.street}, ${order.address.area}, ${order.address.city}${order.address.landmark ? ` (Near ${order.address.landmark})` : ''}`
      : undefined),
  deliveryDistanceKm: order.deliveryDistanceKm?.toNumber() ?? undefined,
  pickupInstructions: order.pickupInstructions ?? undefined,
  subtotal: order.subtotal.toNumber(),
  deliveryFee: order.deliveryFee.toNumber(),
  tax: order.tax.toNumber(),
  total: order.total.toNumber(),
  lines: order.items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    price: item.unitPrice.toNumber(),
  })),
  handover: order.handoverAt
    ? {
        staffName: order.handoverStaff?.fullName ?? 'Staff',
        at: order.handoverAt.toISOString(),
        notes: order.handoverNotes ?? undefined,
      }
    : undefined,
  payment: {
    id: order.payment?.id,
    method: toApiPaymentMethod(order.payment?.method ?? 'MOBILE'),
    status: toApiPaymentStatus(order.payment?.status ?? 'UNPAID'),
    paid: order.payment?.paid ?? false,
    provider: order.payment?.provider ?? undefined,
    transactionId: order.payment?.transactionId ?? undefined,
  },
});
