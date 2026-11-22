import { useState, useEffect } from "react";
import { AlertCircle, X } from "lucide-react";

import PageHeader from "../../../shared/components/layout/PageHeader";
import Badge from "../../../shared/components/ui/Badge";
import Button from "../../../shared/components/ui/Button";
import Card from "../../../shared/components/ui/Card";
import DataTable, { type Column } from "../../../shared/components/ui/DataTable";
import FilterTabs from "../../../shared/components/ui/FilterTabs";
import OrderDetailsModal from "../components/OrderDetailsModal";
import OrderRow from "../components/OrderRow";
import {
  ORDER_STATUS_LABEL,
  ORDER_TYPE_LABEL,
  PAYMENT_STATUS_LABEL,
  type Order,
  type OrderStatus,
} from "../types";
import { listOrders, updateOrderStatus } from "../api/ordersApi";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import { formatTimeAgo } from "../../../shared/utils/formatTimeAgo";

type Filter = "all" | OrderStatus;

export default function OrdersPage({ role }: { role: "staff" | "admin" }) {
  const { t } = useTranslation();
  const [list, setList] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [search, setSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function fetchOrders() {
    try {
      const orders = await listOrders();
      setList(orders);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchOrders();
    // Poll for incoming orders every 8 seconds
    const timer = setInterval(() => {
      void fetchOrders();
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const count = (s: OrderStatus) => list.filter((o) => o.status === s).length;
  const q = search.trim().replace(/^#/, "").toLowerCase();
  const visible = list.filter(
    (o) =>
      (filter === "all" || o.status === filter) &&
      (o.id.toLowerCase().includes(q) ||
        (o.customerName ?? "").toLowerCase().includes(q) ||
        (o.table ?? "").toLowerCase().includes(q) ||
        ORDER_TYPE_LABEL[o.type].toLowerCase().includes(q))
  );

  async function updateStatus(id: string, status: OrderStatus) {
    try {
      const updated = await updateOrderStatus(id, status);
      setList((prev) => prev.map((o) => (o.id === id ? updated : o)));
      if (selected && selected.id === id) {
        setSelected(updated);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : "Failed to update order status");
    }
  }

  const adminColumns: Column<Order>[] = [
    { header: "Order ID", cell: (o) => <span className="font-mono font-bold">#{o.id}</span> },
    { header: "Customer", cell: (o) => <span className="font-semibold text-foreground">{o.customerName || "Customer"}</span> },
    { header: "Type", cell: (o) => ORDER_TYPE_LABEL[o.type] },
    {
      header: "Fulfillment",
      cell: (o) => {
        if (o.type === "dine-in") return o.table ? `Table ${o.table}` : "Dine-in";
        if (o.type === "takeaway") return "Takeaway";
        return o.deliveryDistanceKm ? `${o.deliveryDistanceKm} km` : "Delivery";
      },
    },
    { header: t("itemsOrdered"), cell: (o) => `${o.lines.reduce((s, l) => s + l.quantity, 0)} items` },
    { header: t("total"), cell: (o) => <span className="font-bold text-foreground">{formatCurrency(o.total)}</span> },
    {
      header: "Payment",
      cell: (o) => (
        <Badge variant={o.payment.paid ? "active" : "inactive"} className="text-[11px] font-bold">
          {PAYMENT_STATUS_LABEL[o.payment.status ?? (o.payment.paid ? "paid" : "unpaid")]}
        </Badge>
      ),
    },
    {
      header: t("status"),
      cell: (o) => (
        <Badge variant={o.status} className="capitalize text-xs font-bold">
          {ORDER_STATUS_LABEL[o.status] ?? o.status}
        </Badge>
      ),
    },
    { header: "Time", cell: (o) => formatTimeAgo(o.date) },
    {
      header: "",
      className: "text-right",
      cell: (o) => (
        <Button size="sm" variant="outline" onClick={() => setSelected(o)}>
          View
        </Button>
      ),
    },
  ];

  if (loading) return <p className="py-10 text-center text-muted">{t("loading")}</p>;

  return (
    <>
      <PageHeader
        title={t("navOrders")}
        description={
          role === "admin"
            ? "View customer orders, fulfillment history, and sales (Read-Only)"
            : "Incoming orders, kitchen preparation, and customer handovers"
        }
        search={{ value: search, onChange: setSearch }}
      />

      {errorMessage && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs font-medium text-danger">
          <span className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            {errorMessage}
          </span>
          <button onClick={() => setErrorMessage("")} className="hover:opacity-75" aria-label="Dismiss error">
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="mb-5 overflow-x-auto pb-1">
        <FilterTabs
          value={filter}
          onChange={setFilter}
          tabs={[
            { value: "all", label: t("all") },
            { value: "pending", label: "Pending", count: count("pending") },
            { value: "confirmed", label: "Confirmed", count: count("confirmed") },
            { value: "preparing", label: "Preparing", count: count("preparing") },
            { value: "ready", label: "Ready", count: count("ready") },
            { value: "served", label: "Served", count: count("served") },
            { value: "picked_up", label: "Picked Up", count: count("picked_up") },
            { value: "out_for_delivery", label: "Out for Delivery", count: count("out_for_delivery") },
            { value: "delivered", label: "Delivered", count: count("delivered") },
            { value: "completed", label: "Completed" },
            { value: "cancelled", label: "Cancelled" },
          ]}
        />
      </div>

      {role === "admin" ? (
        <Card className="rounded-2xl shadow-xs overflow-hidden">
          <DataTable
            columns={adminColumns}
            data={visible}
            getRowKey={(o) => o.id}
            emptyMessage="No orders found."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((order) => (
            <OrderRow key={order.id} order={order} onClick={() => setSelected(order)} />
          ))}
          {visible.length === 0 && (
            <div className="rounded-2xl border border-border bg-surface py-12 text-center text-muted">
              <p className="text-sm">No orders in this status.</p>
            </div>
          )}
        </div>
      )}

      {selected && (
        <OrderDetailsModal
          key={selected.id}
          order={selected}
          readOnly={role === "admin"}
          onClose={() => setSelected(null)}
          onSave={role === "staff" ? updateStatus : undefined}
          onOrderUpdated={(updated) => {
            setList((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
            setSelected(updated);
          }}
        />
      )}
    </>
  );
}
