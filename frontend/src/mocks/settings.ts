import type { Operations, RestaurantInfo } from "../features/settings/types";

export const restaurantInfo: RestaurantInfo = {
  name: "Arif Food",
  phone: "+251 9 123 4567",
  address: "Addis Ababa, Ethiopia",
  currency: "ETB",
  taxRate: 5,
};

export const operations: Operations = {
  orderTypes: ["dine-in", "takeaway", "delivery"],
  deliveryFee: 2,
  paymentMethods: ["cash"],
  lowStockMinimum: 5,
};