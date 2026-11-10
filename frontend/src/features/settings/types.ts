import type { OrderType, PaymentMethod } from "../orders/types";

export interface RestaurantInfo {
  name: string;
  phone: string;
  address: string;
  currency: string;
  taxRate: number; // percent
}

export interface Operations {
  orderTypes: OrderType[];
  deliveryFee: number;
  paymentMethods: PaymentMethod[];
  lowStockMinimum: number; // kg
}