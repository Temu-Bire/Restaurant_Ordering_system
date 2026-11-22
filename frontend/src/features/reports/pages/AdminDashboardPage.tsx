import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Package,
  AlertTriangle,
  Zap,
  Flame,
  Banknote,
  Receipt,
  CheckCircle2,
  UtensilsCrossed,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";

import AreaChart from "../components/AreaChart";
import PageHeader from "../../../shared/components/layout/PageHeader";
import Badge from "../../../shared/components/ui/Badge";
import Button from "../../../shared/components/ui/Button";
import Card from "../../../shared/components/ui/Card";
import Select from "../../../shared/components/ui/Select";
import StatCard from "../../../shared/components/ui/StatCard";
import OrderDetailsModal from "../../orders/components/OrderDetailsModal";
import { getAdminDashboard, type AdminDashboardData, type Period } from "../api/reportsApi";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import { formatCurrency, formatCurrencyWhole } from "../../../shared/utils/formatCurrency";
import { formatTimeAgo } from "../../../shared/utils/formatTimeAgo";
import type { Order } from "../../orders/types";

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

  const today = data.today;
  const inventory = data.inventory;
  const tables = data.tables;
  const delivery = data.delivery;
  const report = data.report;

  return (
    <>
      <PageHeader
        title={t("adminDashboardTitle")}
        description="Comprehensive real-time restaurant performance, sales, inventory, and operations"
      />

      {/* Top Controls: Period selector + Quick Reports Button */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link to="/admin/reports">
            <Button size="sm" className="inline-flex items-center gap-1.5">
              <BarChart3 className="size-4" />
              <span>View Full Admin Reports →</span>
            </Button>
          </Link>
          <Link to="/admin/inventory">
            <Button variant="secondary" size="sm" className="inline-flex items-center gap-1.5">
              <Package className="size-4" />
              <span>Manage Inventory</span>
            </Button>
          </Link>
        </div>

        <div className="w-full sm:w-56">
          <Select
            aria-label="Period"
            value={period}
            options={periodOptions}
            onChange={(e) => setPeriod(e.target.value as Period)}
          />
        </div>
      </div>

      {/* Critical Operational Alerts */}
      {(inventory.outOfStockCount > 0 || inventory.lowStockCount > 0 || today.activeOrders > 0) && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {inventory.outOfStockCount > 0 && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between">
              <div className="flex items-start gap-2">
                <AlertTriangle className="size-4 shrink-0 text-rose-500 mt-0.5" />
                <div>
                  <p className="font-bold">{inventory.outOfStockCount} Items Out of Stock</p>
                  <p className="text-[11px] opacity-80">Immediate restocking required for recipes</p>
                </div>
              </div>
              <Link to="/admin/inventory" className="font-bold underline text-xs">
                Restock →
              </Link>
            </div>
          )}

          {inventory.lowStockCount > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-700 dark:text-amber-400 flex items-center justify-between">
              <div className="flex items-start gap-2">
                <Zap className="size-4 shrink-0 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-bold">{inventory.lowStockCount} Items Low on Stock</p>
                  <p className="text-[11px] opacity-80">Approaching minimum reorder threshold</p>
                </div>
              </div>
              <Link to="/admin/inventory" className="font-bold underline text-xs">
                Review →
              </Link>
            </div>
          )}

          <div className="rounded-xl border border-primary/30 bg-primary/10 p-3.5 text-xs text-foreground flex items-center justify-between">
            <div className="flex items-start gap-2">
              <Flame className="size-4 shrink-0 text-primary mt-0.5" />
              <div>
                <p className="font-bold">{today.activeOrders} Orders In Progress</p>
                <p className="text-[11px] text-muted">Kitchen preparation and fulfillment active</p>
              </div>
            </div>
            <Link to="/admin/orders" className="font-bold text-primary underline text-xs">
              Live Orders →
            </Link>
          </div>
        </div>
      )}

      {/* Primary KPI Row: Today's Orders, Paid Revenue, Active, Completed */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today's Paid Revenue"
          value={formatCurrencyWhole(today.paidRevenue)}
          icon={<Banknote className="size-6" />}
          tone="primary"
          trend={{ value: `${report.revenueTrend}%`, positive: report.revenueTrend >= 0 }}
        />
        <StatCard
          label="Today's Total Orders"
          value={today.totalOrders.toLocaleString("en-US")}
          icon={<Receipt className="size-6" />}
          tone="info"
          trend={{ value: `${report.ordersTrend}%`, positive: report.ordersTrend >= 0 }}
        />
        <StatCard
          label="Active Kitchen Orders"
          value={today.activeOrders}
          icon={<Flame className="size-6" />}
          tone="purple"
        />
        <StatCard
          label="Completed Orders Today"
          value={today.completedOrders}
          icon={<CheckCircle2 className="size-6" />}
          tone="success"
        />
      </div>

      {/* Middle Grid: Revenue Trend Chart & Operational Summaries */}
      <div className="mt-6 grid items-start gap-6 grid-cols-1 lg:grid-cols-[1fr_360px]">
        {/* Left Column: Revenue Trend Chart + Today's Order Types Breakdown */}
        <div className="space-y-6">
          <Card
            title={report.chartTitle}
            action={
              <Link
                to="/admin/reports"
                className="text-[13px] font-semibold text-primary hover:underline"
              >
                Detailed Reports →
              </Link>
            }
            className="rounded-2xl shadow-xs"
          >
            <div className="w-full overflow-hidden">
              <AreaChart labels={report.labels} values={report.values} />
            </div>

            {/* Orders By Type Cards */}
            <div className="mt-6 border-t border-border pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
                Today's Orders by Type
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border bg-surface-secondary/40 p-3 text-center">
                  <UtensilsCrossed className="size-5 mx-auto text-primary mb-1" />
                  <p className="text-xs font-semibold text-muted">Dine-in</p>
                  <p className="text-base font-black text-foreground">{today.ordersByType.dineIn}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface-secondary/40 p-3 text-center">
                  <ShoppingBag className="size-5 mx-auto text-amber-500 mb-1" />
                  <p className="text-xs font-semibold text-muted">Takeaway</p>
                  <p className="text-base font-black text-foreground">{today.ordersByType.takeaway}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface-secondary/40 p-3 text-center">
                  <Truck className="size-5 mx-auto text-blue-500 mb-1" />
                  <p className="text-xs font-semibold text-muted">Delivery</p>
                  <p className="text-base font-black text-foreground">{today.ordersByType.delivery}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Top Selling Dishes Today */}
          <Card
            title="Top Selling Menu Dishes (Today)"
            action={
              <Link to="/admin/menu" className="text-xs font-semibold text-primary hover:underline">
                Menu Management →
              </Link>
            }
            className="rounded-2xl shadow-xs"
          >
            {data.topSelling.length === 0 ? (
              <p className="text-xs text-muted py-4 text-center">No dishes sold yet today.</p>
            ) : (
              <div className="divide-y divide-border">
                {data.topSelling.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between py-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="size-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-foreground">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted">{item.quantity} sold</span>
                      <span className="font-mono font-bold text-primary">
                        {formatCurrency(item.revenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Tables, Delivery, and Inventory Alerts */}
        <div className="space-y-6">
          {/* Table Availability Overview */}
          <Card
            title="Table Availability"
            action={
              <Link to="/admin/tables" className="text-xs font-semibold text-primary hover:underline">
                Tables →
              </Link>
            }
            className="rounded-2xl shadow-xs"
          >
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5">
                <span className="text-muted block text-[11px]">Available</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {tables.available} / {tables.total}
                </span>
              </div>
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5">
                <span className="text-muted block text-[11px]">Occupied</span>
                <span className="text-lg font-black text-rose-600 dark:text-rose-400">
                  {tables.occupied}
                </span>
              </div>
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-2.5">
                <span className="text-muted block text-[11px]">Cleaning</span>
                <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                  {tables.cleaning}
                </span>
              </div>
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5">
                <span className="text-muted block text-[11px]">Reserved</span>
                <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                  {tables.reserved}
                </span>
              </div>
            </div>
          </Card>

          {/* Delivery Operations Overview */}
          <Card
            title="Delivery Overview (Today)"
            action={
              <Link to="/admin/settings" className="text-xs font-semibold text-primary hover:underline">
                Configure →
              </Link>
            }
            className="rounded-2xl shadow-xs"
          >
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted">Total Delivery Orders:</span>
                <span className="font-bold text-foreground">{delivery.totalToday}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted">Active Deliveries:</span>
                <span className="font-bold text-primary">{delivery.activeDeliveries}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted">Completed Deliveries:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {delivery.deliveredToday}
                </span>
              </div>
              <div className="flex justify-between py-1 pt-2">
                <span className="text-muted font-bold">Delivery Fees Collected:</span>
                <span className="font-bold text-primary font-mono">
                  {formatCurrency(delivery.feesCollectedToday)}
                </span>
              </div>
            </div>
          </Card>

          {/* Low Stock Alerts */}
          <Card
            title={t("lowStockAlerts")}
            action={
              <Link
                to="/admin/inventory"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Inventory →
              </Link>
            }
            className="rounded-2xl shadow-xs"
          >
            {inventory.lowStockItems.length === 0 && inventory.outOfStockItems.length === 0 ? (
              <p className="text-xs text-muted py-2">{t("allStockOk")}</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {inventory.outOfStockItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between text-rose-500">
                    <span className="font-bold truncate max-w-[160px] inline-flex items-center gap-1.5">
                      <XCircle className="size-3.5 shrink-0" />
                      <span>{item.name}</span>
                    </span>
                    <span className="font-bold">OUT OF STOCK</span>
                  </li>
                ))}
                {inventory.lowStockItems.slice(0, 4).map((item) => (
                  <li key={item.id} className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                    <span className="font-semibold truncate max-w-[160px] inline-flex items-center gap-1.5">
                      <AlertTriangle className="size-3.5 shrink-0" />
                      <span>{item.name}</span>
                    </span>
                    <span>{item.stock} / {item.min} {item.unit}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Recent Inventory Movement Activity */}
          <Card title="Recent Stock Movements" className="rounded-2xl shadow-xs">
            <div className="space-y-2 text-xs">
              {data.recentActivity.map((act) => (
                <div key={act.id} className="flex justify-between items-center py-1 border-b border-border/50 text-[11px]">
                  <div>
                    <span className="font-bold text-foreground block">{act.item}</span>
                    <span className="text-muted">{act.type} by {act.user}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-bold ${act.delta > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                      {act.delta > 0 ? `+${act.delta}` : act.delta}
                    </span>
                    <span className="block text-[10px] text-muted">{formatTimeAgo(act.time)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Orders Section (Read-Only) */}
      <section className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Recent Customer Orders</h2>
            <p className="text-xs text-muted">Read-only overview of incoming and active restaurant orders</p>
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
                    <span className="text-sm font-bold text-foreground font-mono">
                      {formatCurrency(order.total)}
                    </span>
                    <Badge variant={order.status} className="capitalize text-xs font-bold">
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
