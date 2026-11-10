import type { Operations, RestaurantInfo } from "../features/settings/types";

export const restaurantInfo: RestaurantInfo = {
  name: "RestroGo",
  phone: "+251 11 XXX XXXX",
  address: "Bole, Addis Ababa",
  currency: "USD",
  taxRate: 5,
};

export const operations: Operations = {
  orderTypes: ["dine-in", "takeaway", "delivery"],
  deliveryFee: 2,
  paymentMethods: ["cash"],
  lowStockMinimum: 5,
};