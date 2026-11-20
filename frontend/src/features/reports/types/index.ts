import type { Order } from "../../orders/types";
import type { RestaurantTable } from "../../tables/types";

export type Period = "daily" | "weekly" | "monthly";

export interface ReportData {
  chartTitle: string;
  labels: string[];
  values: number[];
  orders: number;
  completedPercent: number;
  revenueTrend: number;
  ordersTrend: number;
  popular: { name: string; sold: number }[];
}

export interface AdminDashboardData {
  report: ReportData;
  customers: number;
  popularItems: number;
  pendingOrders: number;
  totalOrders?: number;
  totalMenuItems?: number;
  availableFoodItems?: number;
  unavailableFoodItems?: number;
  recentOrders?: Order[];
  lowStock: { id: string; name: string; stock: number; minimum: number }[];
}

export interface StaffDashboardData {
  pending: number;
  confirmed: number;
  preparing: number;
  ready: number;
  completed: number;
  occupiedTables: number;
  recentOrders: Order[];
  tables: RestaurantTable[];
}
