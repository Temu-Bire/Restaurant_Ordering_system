import type { Order } from "../features/orders/types";

export const orders: Order[] = [
  {
    id: "ORD-1001",
    date: "2026-11-10",
    type: "dine-in",
    status: "preparing",
    table: "T2",
    total: 21.98,
    lines: [
      { name: "Margherita Pizza", quantity: 1, price: 12.99 },
      { name: "Chicken Burger", quantity: 1, price: 8.99 },
    ],
    payment: { method: "cash", paid: true },
  },
  {
    id: "ORD-0990",
    date: "2026-11-08",
    type: "takeaway",
    status: "completed",
    total: 27.5,
    lines: [
      { name: "Pepperoni Pizza", quantity: 1, price: 14.99 },
      { name: "Caesar Salad", quantity: 1, price: 7.99 },
      { name: "Iced Coffee", quantity: 1, price: 3.99 },
    ],
    payment: { method: "card", paid: true },
  },
  {
    id: "ORD-0975",
    date: "2026-11-02",
    type: "delivery",
    status: "completed",
    total: 14.99,
    lines: [{ name: "Pepperoni Pizza", quantity: 1, price: 14.99 }],
    payment: { method: "mobile", paid: true },
  },
  {
    id: "ORD-0961",
    date: "2026-10-28",
    type: "dine-in",
    status: "cancelled",
    table: "T1",
    total: 18.0,
    lines: [
      { name: "Chicken Burger", quantity: 1, price: 8.99 },
      { name: "French Fries", quantity: 1, price: 3.99 },
    ],
    payment: { method: "cash", paid: false },
  },
];