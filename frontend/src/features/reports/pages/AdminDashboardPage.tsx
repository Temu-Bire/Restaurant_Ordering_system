import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import AreaChart from "../components/AreaChart";
import PageHeader from "../../../shared/components/layout/PageHeader";
import Badge from "../../../shared/components/ui/Badge";
import Card from "../../../shared/components/ui/Card";
import Select from "../../../shared/components/ui/Select";
import StatCard from "../../../shared/components/ui/StatCard";
import OrderDetailsModal from "../../orders/components/OrderDetailsModal";
import { getAdminDashboard, type AdminDashboardData, type Period } from "../api/reportsApi";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import { formatCurrency, formatCurrencyWhole } from "../../../shared/utils/formatCurrency";
import { formatTimeAgo } from "../../../shared/utils/formatTimeAgo";
import type { Order } from "../../orders/types";

const totalRevenue = (values: number[]) => values.reduce((sum, v) => sum + v, 0);

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>("weekly");
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const periodOptions: { value: Period; label: string }[] = [
    { value: "daily", label: "This Week (Daily)" },
    { value: "weekly", label: "This Month (Weekly)" },
    { value: "monthly", label: "Last 6 Months (Monthly)" },
  ];

  useEffect(() => {
    getAdminDashboard(period).then(setData).catch(console.error);
  }, [period]);

  if (!data) return <p className="py-10 text-center text-muted">{t("loading")}</p>;

  const report = data.report;
  const revenue = totalRevenue(report.values);

  return (
    <>
      <PageHeader
        title={t("adminDashboardTitle")}
        description="Restaurant overview, sales summaries, and menu metrics"
      />

      <div className="mb-5 flex justify-start sm:justify-end">
        <div className="w-full sm:w-56">
          <Select
            aria-label="Period"
            value={period}
            options={periodOptions}
            onChange={(e) => setPeriod(e.target.value as Period)}
          />
        </div>
      </div>

      {/* Top Stat Cards: Sales, Orders, Menu Items, Availability */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label={t("totalRevenue")}
          value={formatCurrencyWhole(revenue)}
          icon="💰"
          tone="primary"
          trend={{ value: `${report.revenueTrend}%`, positive: report.revenueTrend >= 0 }}
        />
        <StatCard
          label={t("totalOrders")}
          value={report.orders.toLocaleString("en-US")}
          icon="🧾"
          tone="info"
          trend={{ value: `${report.ordersTrend}%`, positive: report.ordersTrend >= 0 }}
        />
        <StatCard
          label="Total Menu Items"
          value={data.totalMenuItems ?? 0}
          icon="🍽"
          tone="purple"
        />
        <StatCard
          label="Available Items"
          value={data.availableFoodItems ?? 0}
          icon="🟢"
          tone="success"
        />
        <StatCard
          label="Unavailable Items"
          value={data.unavailableFoodItems ?? 0}
          icon="⚪"
          tone="primary"
        />
      </div>

      {/* Middle Section: Sales Overview Chart and Secondary Stats */}
      <div className="mt-6 grid items-start gap-6 grid-cols-1 lg:grid-cols-[1fr_360px]">
        <Card
          title={t("salesOverview")}
          action={
            <Link
              to="/admin/reports"
              className="text-[13px] font-semibold text-primary hover:underline"
            >
              {t("viewAll")} →
            </Link>
          }
          className="rounded-2xl shadow-xs"
        >
          <div className="w-full overflow-hidden">
            <AreaChart labels={report.labels} values={report.values} />
          </div>
        </Card>

        <div className="space-y-6">
          <Card
            title={t("lowStockAlerts")}
            action={
              <Link
                to="/admin/inventory"
                className="text-[13px] font-semibold text-primary hover:underline"
              >
                {t("viewAll")} →
              </Link>
            }
            className="rounded-2xl shadow-xs"
          >
            {data.lowStock.length === 0 ? (
              <p className="text-[13px] text-muted">{t("allStockOk")}</p>
            ) : (
              <ul className="space-y-3">
                {data.lowStock.slice(0, 5).map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <span className="size-2.5 shrink-0 rounded-full bg-danger" />
                    <span className="flex-1 truncate text-[13px] font-medium text-foreground">{item.name}</span>
                    <span className="text-xs text-muted">
                      &lt; {item.minimum} kg
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Active Customers & Orders" className="rounded-2xl shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs text-muted">Registered Customers</span>
              <span className="text-base font-bold text-foreground">{data.customers}</span>
            </div>
            <div className="flex items-center justify-between pt-3">
              <span className="text-xs text-muted">Pending Orders</span>
              <span className="text-base font-bold text-primary">{data.pendingOrders}</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Orders Section (Read-Only) */}
      <section className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Recent Orders</h2>
            <p className="text-xs text-muted">Read-only overview of recent customer orders</p>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs font-semibold text-primary hover:underline"
          >
            View All Orders →
          </Link>
        </div>

        <Card className="rounded-2xl shadow-xs overflow-hidden">
          <div className="divide-y divide-border">
            {!data.recentOrders || data.recentOrders.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted">No recent orders found.</p>
            ) : (
              data.recentOrders.map((order: Order) => (
                <div
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-surface-secondary/40 transition-colors cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-sm font-bold text-foreground">#{order.id}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {order.customerName || "Customer"}
                      </p>
                      <p className="text-xs text-muted">
                        {order.lines.reduce((s: number, l) => s + l.quantity, 0)} items · {order.table ? `Table ${order.table}` : order.type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-foreground">
                      {formatCurrency(order.total)}
                    </span>
                    <Badge variant={order.status} className="capitalize">
                      {order.status}
                    </Badge>
                    <span className="text-xs text-muted hidden sm:inline">
                      {formatTimeAgo(order.date)}
                    </span>
                    <button
                      type="button"
                      className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-muted hover:text-foreground"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      {/* Read-only order details modal for Admin */}
      {selectedOrder && (
        <OrderDetailsModal
          key={selectedOrder.id}
          order={selectedOrder}
          readOnly={true}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </>
  );
}
