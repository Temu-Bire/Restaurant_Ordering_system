import type { Order } from "../../orders/types";
import type { RestaurantTable } from "../../tables/types";

export type Period = "daily" | "weekly" | "monthly";

export interface ReportData {
  chartTitle: string;
  labels: string[];
  values: number[];
  orders: number;
  completedPercent?: number;
  revenueTrend: number;
  ordersTrend: number;
  popular: { name: string; sold: number }[];
}

export interface AdminDashboardData {
  today: {
    totalOrders: number;
    paidRevenue: number;
    activeOrders: number;
    completedOrders: number;
    ordersByType: {
      dineIn: number;
      takeaway: number;
      delivery: number;
    };
  };
  inventory: {
    lowStockCount: number;
    outOfStockCount: number;
    lowStockItems: { id: string; name: string; stock: number; min: number; unit: string }[];
    outOfStockItems: { id: string; name: string; unit: string }[];
  };
  menu: {
    totalMenuItems: number;
    availableFoodItems: number;
    unavailableFoodItems: number;
  };
  tables: {
    total: number;
    available: number;
    occupied: number;
    reserved: number;
    cleaning: number;
  };
  delivery: {
    totalToday: number;
    activeDeliveries: number;
    deliveredToday: number;
    feesCollectedToday: number;
  };
  topSelling: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
  recentOrders: Order[];
  recentActivity: {
    id: string;
    item: string;
    type: string;
    delta: number;
    user: string;
    time: string;
  }[];
  report: ReportData;

  // Backwards compatibility
  customers?: number;
  popularItems?: number;
  pendingOrders?: number;
  totalOrders?: number;
  totalMenuItems?: number;
  availableFoodItems?: number;
  unavailableFoodItems?: number;
  lowStock?: { id: string; name: string; stock: number; minimum: number }[];
}

export interface StaffDashboardData {
  operationalCounts: {
    actionRequired: number;
    preparing: number;
    readyForServingOrPickup: number;
    awaitingDeliveryHandover: number;
    completedToday: number;
  };
  orders: {
    pending: Order[];
    preparing: Order[];
    ready: Order[];
    outForDelivery: Order[];
    recent: Order[];
  };
  tables: {
    total: number;
    available: number;
    occupied: number;
    cleaning: number;
    reserved: number;
    list: RestaurantTable[];
  };
  stockAlerts: {
    lowStock: { id: string; name: string; stock: number; min: number; unit: string }[];
    outOfStock: { id: string; name: string; unit: string }[];
  };
  recentActivity: {
    id: string;
    item: string;
    type: string;
    delta: number;
    user: string;
    time: string;
  }[];

  // Backwards compatibility fields
  pending?: number;
  confirmed?: number;
  preparing?: number;
  ready?: number;
  completed?: number;
  occupiedTables?: number;
  recentOrders?: Order[];
}

export interface AnalyticsFilterParams {
  period?: "today" | "yesterday" | "week" | "month" | "year" | "custom";
  startDate?: string;
  endDate?: string;
  orderType?: string;
  orderStatus?: string;
  paymentStatus?: string;
  category?: string;
}

export interface AnalyticsData {
  period: string;
  dateRange: { start: string; end: string };
  sales: {
    totalSales: number;
    paidRevenue: number;
    foodSales: number;
    deliveryFeesCollected: number;
    taxCollected: number;
    ordersCount: number;
    averageOrderValue: number;
    salesByOrderType: { type: string; count: number; revenue: number }[];
    salesByCategory: { category: string; count: number; revenue: number }[];
  };
  orders: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    pendingOrders: number;
    byStatus: { status: string; count: number }[];
    byType: { type: string; count: number }[];
  };
  inventory: {
    totalInventoryValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    stockReceivedQty: number;
    stockReceivedValue: number;
    ingredientConsumedQty: number;
    wasteQty: number;
    wasteValue: number;
    items: {
      id: string;
      name: string;
      sku?: string;
      category: string;
      stock: number;
      minimum: number;
      unit: string;
      unitCost: number;
      totalValue: number;
      status: string;
    }[];
    recentMovements: {
      id: string;
      ingredientName: string;
      type: string;
      delta: number;
      unit: string;
      reason: string;
      userName: string;
      date: string;
    }[];
  };
  popularItems: {
    bestSelling: { name: string; category: string; quantity: number; revenue: number }[];
    leastSelling: { name: string; category: string; quantity: number; revenue: number }[];
  };
  delivery: {
    totalDeliveryOrders: number;
    deliveryFeesCollected: number;
    byStatus: { status: string; count: number }[];
    averageDistanceKm: number;
  };
}
