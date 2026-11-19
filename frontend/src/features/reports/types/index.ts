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
  lowStock: { id: string; name: string; stock: number; minimum: number }[];
}

export interface StaffDashboardData {
  pending: number;
  completed: number;
  preparing: number;
  occupiedTables: number;
  recentOrders: Order[];
  tables: RestaurantTable[];
}
