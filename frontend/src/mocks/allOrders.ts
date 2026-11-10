import type { Order } from "../features/orders/types";

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

export const allOrders: Order[] = [
  {
    id: "ORD-1001",
    date: minutesAgo(2),
    type: "dine-in",
    status: "pending",
    table: "T2",
    total: 16.98,
    lines: [
      { name: "Margherita Pizza", quantity: 1, price: 12.99 },
      { name: "Iced Coffee", quantity: 1, price: 3.99 },
    ],
    payment: { method: "cash", paid: false },
  },
  {
    id: "ORD-1000",
    date: minutesAgo(5),
    type: "takeaway",
    status: "preparing",
    total: 8.99,
    lines: [{ name: "Chicken Burger", quantity: 1, price: 8.99 }],
    payment: { method: "card", paid: true },
  },
  {
    id: "ORD-0999",
    date: minutesAgo(10),
    type: "dine-in",
    status: "ready",
    table: "T4",
    total: 24.5,
    lines: [
      { name: "Caesar Salad", quantity: 1, price: 7.99 },
      { name: "Pepperoni Pizza", quantity: 1, price: 14.99 },
      { name: "Orange Juice", quantity: 1, price: 3.49 },
    ],
    payment: { method: "cash", paid: false },
  },
  {
    id: "ORD-0998",
    date: minutesAgo(15),
    type: "delivery",
    status: "completed",
    total: 3.99,
    lines: [{ name: "French Fries", quantity: 1, price: 3.99 }],
    payment: { method: "mobile", paid: true },
  },
  {
    id: "ORD-0997",
    date: minutesAgo(22),
    type: "dine-in",
    status: "cancelled",
    table: "T1",
    total: 12.0,
    lines: [
      { name: "Chocolate Cake", quantity: 1, price: 5.99 },
      { name: "Iced Coffee", quantity: 1, price: 3.99 },
    ],
    payment: { method: "cash", paid: false },
  },
];