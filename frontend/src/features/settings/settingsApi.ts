import { api } from "../../lib/apiClient";
import type { OrderType, PaymentMethod } from "../orders/types";

export interface Settings {
  name: string;
  phone: string;
  address: string;
  currency: string;
  taxRate: number;
  orderTypes: OrderType[];
  deliveryFee: number;
  paymentMethods: PaymentMethod[];
  lowStockMinimum: number;
}

export async function getSettings(): Promise<Settings> {
  return api.get<Settings>("/settings");
}

export async function updateSettings(body: Partial<Settings>): Promise<Settings> {
  return api.patch<Settings>("/settings", body);
}
