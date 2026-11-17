import { api } from "../../lib/apiClient";
import type { Order, OrderStatus, OrderType, PaymentMethod } from "../../features/orders/types";

export async function listOrders(): Promise<Order[]> {
  return api.get<Order[]>("/orders");
}

export async function listMyOrders(): Promise<Order[]> {
  return api.get<Order[]>("/orders/mine");
}

export async function getOrder(id: string): Promise<Order> {
  return api.get<Order>(`/orders/${id}`);
}

export async function createOrder(body: {
  type: OrderType;
  table?: string;
  paymentMethod: PaymentMethod;
  items: { foodId: string; quantity: number }[];
}): Promise<Order> {
  return api.post<Order>("/orders", body);
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  return api.patch<Order>(`/orders/${id}/status`, { status });
}

export async function cancelOrder(id: string): Promise<Order> {
  return api.post<Order>(`/orders/${id}/cancel`);
}

export async function assignTable(id: string, tableId: string): Promise<Order> {
  return api.patch<Order>(`/orders/${id}/table`, { tableId });
}
