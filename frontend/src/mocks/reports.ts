export type Period = "daily" | "weekly" | "monthly";

export interface ReportData {
  chartTitle: string;
  labels: string[];
  values: number[]; // revenue per label
  orders: number;
  completedPercent: number;
  revenueTrend: number;
  ordersTrend: number;
  popular: { name: string; sold: number }[];
}

export const reports: Record<Period, ReportData> = {
  daily: {
    chartTitle: "Revenue by Day",
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    values: [330, 410, 380, 470, 450, 560, 400],
    orders: 205,
    completedPercent: 95,
    revenueTrend: 5,
    ordersTrend: 3,
    popular: [
      { name: "Margherita Pizza", sold: 41 },
      { name: "Chicken Burger", sold: 35 },
      { name: "French Fries", sold: 32 },
      { name: "Caesar Salad", sold: 22 },
      { name: "Iced Coffee", sold: 19 },
    ],
  },
  weekly: {
    chartTitle: "Revenue by Week",
    labels: ["Wk 1", "Wk 2", "Wk 3", "Wk 4"],
    values: [2800, 3100, 3300, 3250],
    orders: 842,
    completedPercent: 96,
    revenueTrend: 12,
    ordersTrend: 8,
    popular: [
      { name: "Margherita Pizza", sold: 312 },
      { name: "Chicken Burger", sold: 268 },
      { name: "French Fries", sold: 241 },
      { name: "Caesar Salad", sold: 170 },
      { name: "Iced Coffee", sold: 144 },
    ],
  },
  monthly: {
    chartTitle: "Revenue by Month",
    labels: ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"],
    values: [9800, 10400, 11200, 10900, 11800, 12450],
    orders: 4380,
    completedPercent: 96,
    revenueTrend: 9,
    ordersTrend: 6,
    popular: [
      { name: "Margherita Pizza", sold: 1580 },
      { name: "Chicken Burger", sold: 1340 },
      { name: "French Fries", sold: 1210 },
      { name: "Caesar Salad", sold: 860 },
      { name: "Iced Coffee", sold: 720 },
    ],
  },
};

export const totalRevenue = (r: ReportData) =>
  r.values.reduce((sum, v) => sum + v, 0);

// Dashboard dropdown
export const periodOptions: { value: Period; label: string }[] = [
  { value: "daily", label: "This Week" },
  { value: "weekly", label: "This Month" },
  { value: "monthly", label: "Last 6 Months" },
];

// Reports page tabs
export const reportTabs: { value: Period; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export const CUSTOMER_COUNT = 1250;
export const POPULAR_ITEM_COUNT = 128;