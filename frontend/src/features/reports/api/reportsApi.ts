import { api } from "../../../lib/apiClient";
import type {
  AdminDashboardData,
  AnalyticsData,
  AnalyticsFilterParams,
  Period,
  ReportData,
  StaffDashboardData,
} from "../types";

export type {
  AdminDashboardData,
  AnalyticsData,
  AnalyticsFilterParams,
  Period,
  ReportData,
  StaffDashboardData,
};

export async function getReport(period: Period): Promise<ReportData> {
  return api.get<ReportData>(`/reports?period=${period}`);
}

export async function getAdminDashboard(period: Period = "weekly"): Promise<AdminDashboardData> {
  return api.get<AdminDashboardData>(`/dashboard/admin?period=${period}`);
}

export async function getStaffDashboard(): Promise<StaffDashboardData> {
  return api.get<StaffDashboardData>("/dashboard/staff");
}

export async function getAnalytics(filters: AnalyticsFilterParams): Promise<AnalyticsData> {
  const query = new URLSearchParams();
  if (filters.period) query.set("period", filters.period);
  if (filters.startDate) query.set("startDate", filters.startDate);
  if (filters.endDate) query.set("endDate", filters.endDate);
  if (filters.orderType) query.set("orderType", filters.orderType);
  if (filters.orderStatus) query.set("orderStatus", filters.orderStatus);
  if (filters.paymentStatus) query.set("paymentStatus", filters.paymentStatus);
  if (filters.category) query.set("category", filters.category);

  const qs = query.toString();
  return api.get<AnalyticsData>(`/reports/analytics${qs ? `?${qs}` : ""}`);
}
