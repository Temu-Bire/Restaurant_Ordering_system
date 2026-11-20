import { api } from "../../../lib/apiClient";
import type { Order, OrderStatus, OrderType, PaymentMethod, PaymentStatus } from "../types";

export interface CreateOrderInput {
  type: OrderType;
  table?: string;
  partySize?: number;
  addressId?: string;
  pickupInstructions?: string;
  paymentMethod: PaymentMethod;
  paymentProvider?: string;
  items: { foodId: string; quantity: number }[];
}

export interface VerifyPaymentResponse {
  success: boolean;
  outcome: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  payment: {
    id: string;
    receipt?: string;
    orderId: string;
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
    paid: boolean;
    provider?: string;
    transactionId?: string;
    date: string;
  };
}

export async function listOrders(): Promise<Order[]> {
  return api.get<Order[]>("/orders");
}

export async function listMyOrders(): Promise<Order[]> {
  return api.get<Order[]>("/orders/mine");
}

export async function getOrder(id: string): Promise<Order> {
  return api.get<Order>(`/orders/${id}`);
}

export async function createOrder(body: CreateOrderInput): Promise<Order> {
  return api.post<Order>("/orders", body);
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  return api.patch<Order>(`/orders/${id}/status`, { status });
}

export async function handoverOrder(id: string, notes?: string): Promise<Order> {
  return api.patch<Order>(`/orders/${id}/handover`, { notes });
}

export async function cancelOrder(id: string): Promise<Order> {
  return api.post<Order>(`/orders/${id}/cancel`);
}

export async function assignTable(id: string, tableId: string): Promise<Order> {
  return api.patch<Order>(`/orders/${id}/table`, { tableId });
}

export async function initiatePayment(orderId: string, provider: string = "Telebirr") {
  return api.post(`/payments/order/${orderId}/initiate`, { provider });
}

export async function verifyPayment(
  paymentIdOrOrderId: string,
  outcome: "SUCCESS" | "FAILED" | "CANCELLED" | "EXPIRED",
  transactionRef?: string,
): Promise<VerifyPaymentResponse> {
  return api.post<VerifyPaymentResponse>(`/payments/${paymentIdOrOrderId}/verify`, {
    outcome,
    transactionRef,
  });
}
