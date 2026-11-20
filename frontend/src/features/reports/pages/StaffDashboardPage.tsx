import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import PageHeader from "../../../shared/components/layout/PageHeader";
import Card from "../../../shared/components/ui/Card";
import StatCard from "../../../shared/components/ui/StatCard";
import OrderRow from "../../orders/components/OrderRow";
import OrderDetailsModal from "../../orders/components/OrderDetailsModal";
import StaffAvailabilityControls from "../../menu/components/StaffAvailabilityControls";
import { getStaffDashboard, type StaffDashboardData } from "../api/reportsApi";
import { updateOrderStatus } from "../../orders/api/ordersApi";
import { updateTableStatus } from "../../tables/api/tablesApi";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import { formatTimeAgo } from "../../../shared/utils/formatTimeAgo";
import type { Order, OrderStatus } from "../../orders/types";

export default function StaffDashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [tableNotice, setTableNotice] = useState("");

  async function loadDashboard() {
    try {
      const res = await getStaffDashboard();
      setData(res);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    void loadDashboard();
    const interval = setInterval(() => {
      void loadDashboard();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  async function handleUpdateStatus(id: string, status: OrderStatus) {
    try {
      await updateOrderStatus(id, status);
      await loadDashboard();
      setSelectedOrder(null);
    } catch (err) {
      console.error("Failed to update status", err);
    }
  }

  async function handleQuickTableAction(tableId: string, status: "cleaning" | "available") {
    try {
      await updateTableStatus(tableId, status);
      setTableNotice(`Table marked as ${status}`);
      await loadDashboard();
      setTimeout(() => setTableNotice(""), 3000);
    } catch (err) {
      console.error(err);
    }
  }

  if (!data) return <p className="py-10 text-center text-muted">{t("loading")}</p>;

  const counts = data.operationalCounts ?? {
    actionRequired: (data.pending ?? 0) + (data.confirmed ?? 0),
    preparing: data.preparing ?? 0,
    readyForServingOrPickup: data.ready ?? 0,
    awaitingDeliveryHandover: 0,
    completedToday: data.completed ?? 0,
  };

  const tables = data.tables ?? {
    total: 0,
    available: 0,
    occupied: data.occupiedTables ?? 0,
    cleaning: 0,
    reserved: 0,
    list: [],
  };

  const stockAlerts = data.stockAlerts ?? {
    lowStock: [],
    outOfStock: [],
  };

  return (
    <>
      <PageHeader
        title={t("staffDashboardTitle")}
        description={`Operational dispatch & live kitchen management · ${today}`}
      />

      {tableNotice && (
        <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs font-semibold text-success">
          ✓ {tableNotice}
        </div>
      )}

      {/* Stock Alerts Notice for Kitchen */}
      {(stockAlerts.outOfStock.length > 0 || stockAlerts.lowStock.length > 0) && (
        <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs font-semibold text-amber-700 dark:text-amber-400 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <div>
              <span className="font-bold">Kitchen Supply Notice: </span>
              {stockAlerts.outOfStock.length > 0 && (
                <span className="text-rose-600 font-bold">
                  {stockAlerts.outOfStock.map((i) => i.name).join(", ")} OUT OF STOCK.{" "}
                </span>
              )}
              {stockAlerts.lowStock.length > 0 && (
                <span>
                  Low: {stockAlerts.lowStock.map((i) => i.name).join(", ")}.
                </span>
              )}
            </div>
          </div>
          <Link to="/staff/inventory" className="text-xs font-bold underline">
            Record Receiving / Stock →
          </Link>
        </div>
      )}

      {/* 5 Operational Action Counters (No Financial Info!) */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Action Required"
          value={counts.actionRequired}
          tone="primary"
          icon="⚡"
        />
        <StatCard
          label="In Preparation"
          value={counts.preparing}
          tone="purple"
          icon="🍳"
        />
        <StatCard
          label="Ready for Serving"
          value={counts.readyForServingOrPickup}
          tone="info"
          icon="🍽"
        />
        <StatCard
          label="Awaiting Handover"
          value={counts.awaitingDeliveryHandover}
          tone="primary"
          icon="🛵"
        />
        <StatCard
          label="Completed Today"
          value={counts.completedToday}
          tone="success"
          icon="✅"
        />
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left Column: Incoming & Active Orders */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Active Orders Requiring Action</h2>
            <Link
              to="/staff/orders"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Order Management Board →
            </Link>
          </div>

          <div className="space-y-3">
            {!data.orders?.recent || data.orders.recent.length === 0 ? (
              <Card className="py-8 text-center text-sm text-muted rounded-2xl">
                No active orders at the moment.
              </Card>
            ) : (
              data.orders.recent.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  onClick={() => setSelectedOrder(order)}
                />
              ))
            )}
          </div>
        </section>

        {/* Right Column: Tables, Turnaround & Food Availability Controls */}
        <section className="space-y-6">
          {/* Floor & Table Status Card */}
          <Card
            title="Floor Tables & Turnaround"
            action={
              <Link to="/staff/tables" className="text-xs font-semibold text-primary hover:underline">
                Table View →
              </Link>
            }
            className="rounded-2xl shadow-xs space-y-3"
          >
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <span className="text-[10px] text-muted block">Available</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {tables.available}
                </span>
              </div>
              <div className="rounded-lg bg-rose-500/10 p-2">
                <span className="text-[10px] text-muted block">Occupied</span>
                <span className="font-black text-rose-600 dark:text-rose-400">
                  {tables.occupied}
                </span>
              </div>
              <div className="rounded-lg bg-blue-500/10 p-2">
                <span className="text-[10px] text-muted block">Cleaning</span>
                <span className="font-black text-blue-600 dark:text-blue-400">
                  {tables.cleaning}
                </span>
              </div>
              <div className="rounded-lg bg-amber-500/10 p-2">
                <span className="text-[10px] text-muted block">Reserved</span>
                <span className="font-black text-amber-600 dark:text-amber-400">
                  {tables.reserved}
                </span>
              </div>
            </div>

            {/* Quick table turn actions */}
            <div className="space-y-1.5 border-t border-border pt-3">
              <span className="text-[11px] font-bold uppercase text-muted block">
                Quick Table Clearing
              </span>
              {tables.list && tables.list.filter((t) => t.status === "occupied" || t.status === "cleaning").length > 0 ? (
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {tables.list
                    .filter((t) => t.status === "occupied" || t.status === "cleaning")
                    .slice(0, 5)
                    .map((tbl) => (
                      <div
                        key={tbl.id}
                        className="flex items-center justify-between text-xs py-1 border-b border-border/40"
                      >
                        <span className="font-bold text-foreground">
                          {tbl.name} ({tbl.seats}s)
                        </span>
                        {tbl.status === "occupied" && (
                          <button
                            type="button"
                            onClick={() => handleQuickTableAction(tbl.id, "cleaning")}
                            className="rounded bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 text-[10px] font-bold"
                          >
                            🧹 Mark Cleaning
                          </button>
                        )}
                        {tbl.status === "cleaning" && (
                          <button
                            type="button"
                            onClick={() => handleQuickTableAction(tbl.id, "available")}
                            className="rounded bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 text-[10px] font-bold"
                          >
                            ✓ Mark Available
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted">All tables are clean and available.</p>
              )}
            </div>
          </Card>

          {/* Quick Menu Food Availability Switcher */}
          <StaffAvailabilityControls />

          {/* Recent Operational Activity */}
          <Card title="Recent Kitchen & Inventory Activity" className="rounded-2xl shadow-xs">
            <div className="space-y-2 text-xs">
              {data.recentActivity && data.recentActivity.length > 0 ? (
                data.recentActivity.map((act) => (
                  <div key={act.id} className="flex justify-between items-center py-1 border-b border-border/40 text-[11px]">
                    <div>
                      <span className="font-bold text-foreground block">{act.item}</span>
                      <span className="text-muted">{act.type} by {act.user}</span>
                    </div>
                    <span className="text-[10px] text-muted font-mono">
                      {formatTimeAgo(act.time)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted py-2">No recent movements.</p>
              )}
            </div>
          </Card>
        </section>
      </div>

      {selectedOrder && (
        <OrderDetailsModal
          key={selectedOrder.id}
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onSave={handleUpdateStatus}
        />
      )}
    </>
  );
}
