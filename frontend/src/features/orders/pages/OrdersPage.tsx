import { useState, useEffect } from "react";

import PageHeader from "../../../shared/components/layout/PageHeader";
import Badge from "../../../shared/components/ui/Badge";
import Button from "../../../shared/components/ui/Button";
import Card from "../../../shared/components/ui/Card";
import DataTable, { type Column } from "../../../shared/components/ui/DataTable";
import FilterTabs from "../../../shared/components/ui/FilterTabs";
import OrderDetailsModal from "../components/OrderDetailsModal";
import OrderRow from "../components/OrderRow";
import {
  ORDER_TYPE_LABEL,
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

  useEffect(() => {
    listOrders()
      .then(setList)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const count = (s: OrderStatus) => list.filter((o) => o.status === s).length;
  const q = search.trim().replace(/^#/, "").toLowerCase();
  const visible = list.filter(
    (o) =>
      (filter === "all" || o.status === filter) &&
      (o.id.toLowerCase().includes(q) ||
        (o.table ?? "").toLowerCase().includes(q) ||
        ORDER_TYPE_LABEL[o.type].toLowerCase().includes(q))
  );

  async function updateStatus(id: string, status: OrderStatus) {
    try {
      const updated = await updateOrderStatus(id, status);
      setList((prev) => prev.map((o) => (o.id === id ? updated : o)));
    } catch (err) {
      console.error(err);
    }
  }

  const adminColumns: Column<Order>[] = [
    { header: "Order", cell: (o) => `#${o.id}` },
    { header: "Type", cell: (o) => ORDER_TYPE_LABEL[o.type] },
    { header: t("tableNumber"), cell: (o) => o.table ?? "—" },
    { header: t("itemsOrdered"), cell: (o) => o.lines.reduce((s, l) => s + l.quantity, 0) },
    { header: t("total"), cell: (o) => formatCurrency(o.total) },
    {
      header: t("status"),
      cell: (o) => (
        <Badge variant={o.status} className="capitalize">
          {o.status}
        </Badge>
      ),
    },
    { header: "Time", cell: (o) => formatTimeAgo(o.date) },
    {
      header: "",
      className: "text-right",
      cell: (o) => (
        <Button size="sm" variant="outline" onClick={() => setSelected(o)}>
          Details
        </Button>
      ),
    },
  ];

  if (loading) return <p className="py-10 text-center text-muted">{t("loading")}</p>;

  return (
    <>
      <PageHeader
        title={t("navOrders")}
        description={role === "admin" ? "All orders and history" : "Incoming kitchen orders"}
        search={{ value: search, onChange: setSearch }}
      />

      <div className="mb-5 overflow-x-auto pb-1">
        <FilterTabs
          value={filter}
          onChange={setFilter}
          tabs={[
            { value: "all", label: t("all") },
            { value: "pending", label: t("statusPending"), count: count("pending") },
            { value: "confirmed", label: t("statusConfirmed"), count: count("confirmed") },
            { value: "preparing", label: t("statusPreparing"), count: count("preparing") },
            { value: "ready", label: t("statusReady"), count: count("ready") },
            { value: "completed", label: t("statusCompleted") },
            { value: "cancelled", label: t("statusCancelled") },
          ]}
        />
      </div>

      {role === "admin" ? (
        <Card className="rounded-2xl shadow-xs overflow-hidden">
          <DataTable columns={adminColumns} data={visible} getRowKey={(o) => o.id} />
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
          onClose={() => setSelected(null)}
          onSave={updateStatus}
        />
      )}
    </>
  );
}
