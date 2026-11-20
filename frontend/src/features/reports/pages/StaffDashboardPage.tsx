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
import { useTranslation } from "../../../shared/hooks/useTranslation";
import type { Order, OrderStatus } from "../../orders/types";

export default function StaffDashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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

  if (!data) return <p className="py-10 text-center text-muted">{t("loading")}</p>;

  return (
    <>
      <PageHeader
        title={t("staffDashboardTitle")}
        description={`${t("staffDashboardDesc")} · ${today}`}
      />

      {/* 5 Status Counters */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label={t("statusPending")} value={data.pending} tone="primary" />
        <StatCard label={t("statusConfirmed")} value={data.confirmed ?? 0} tone="info" />
        <StatCard label={t("statusPreparing")} value={data.preparing} tone="purple" />
        <StatCard label={t("statusReady")} value={data.ready ?? 0} tone="primary" />
        <StatCard label={t("statusCompleted")} value={data.completed} tone="success" />
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left Column: Incoming Orders */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Incoming & Active Orders</h2>
            <Link
              to="/staff/orders"
              className="text-xs font-semibold text-primary hover:underline"
            >
              View All Orders →
            </Link>
          </div>

          <div className="space-y-3">
            {data.recentOrders.length === 0 ? (
              <Card className="py-8 text-center text-sm text-muted rounded-2xl">
                No active orders at the moment.
              </Card>
            ) : (
              data.recentOrders.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  onClick={() => setSelectedOrder(order)}
                />
              ))
            )}
          </div>
        </section>

        {/* Right Column: Quick Table Status & Shortcuts */}
        <section className="space-y-4">
          <Card title="Quick Overview" className="rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-sm text-muted">Occupied Tables</span>
              <span className="text-base font-bold text-foreground">{data.occupiedTables}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Available Menu Items</span>
              <Link
                to="/staff/menu"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Open Menu Manager →
              </Link>
            </div>
          </Card>
        </section>
      </div>

      {/* Menu Availability Controls Section on Dashboard */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Menu Availability Controls</h2>
            <p className="text-xs text-muted">
              Toggle dishes between Available and Unavailable instantly
            </p>
          </div>
          <Link
            to="/staff/menu"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Full Menu View →
          </Link>
        </div>

        <Card className="rounded-2xl shadow-xs p-4 sm:p-6">
          <StaffAvailabilityControls compact={true} />
        </Card>
      </section>

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
