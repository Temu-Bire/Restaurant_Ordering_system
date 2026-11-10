import { useState } from "react";

import PageHeader from "../../components/layout/PageHeader";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import DataTable, { type Column } from "../../components/ui/DataTable";
import FilterTabs from "../../components/ui/FilterTabs";
import OrderDetailsModal from "../../features/orders/components/OrderDetailsModal";
import OrderRow from "../../features/orders/components/OrderRow";
import {
  ORDER_TYPE_LABEL,
  type Order,
  type OrderStatus,
} from "../../features/orders/types";
import { allOrders } from "../../mocks/allOrders";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatTimeAgo } from "../../utils/formatTimeAgo";

type Filter = "all" | OrderStatus;

export default function OrdersPage({ role }: { role: "staff" | "admin" }) {
  const [list, setList] = useState<Order[]>(allOrders);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Order | null>(null);

  const count = (s: OrderStatus) => list.filter((o) => o.status === s).length;
  const visible = list.filter((o) => filter === "all" || o.status === filter);

  // TEMP: local update. Later this calls ordersApi.updateStatus()
  const updateStatus = (id: string, status: OrderStatus) =>
    setList((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));

  const adminColumns: Column<Order>[] = [
    { header: "Order", cell: (o) => `#${o.id}` },
    { header: "Type", cell: (o) => ORDER_TYPE_LABEL[o.type] },
    { header: "Table", cell: (o) => o.table ?? "—" },
    { header: "Items", cell: (o) => o.lines.reduce((s, l) => s + l.quantity, 0) },
    { header: "Total", cell: (o) => formatCurrency(o.total) },
    {
      header: "Status",
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

  return (
    <>
      <PageHeader
        title="Orders"
        description={role === "admin" ? "All orders and history" : "Incoming orders"}
      />

      <div className="mb-4">
        <FilterTabs
          value={filter}
          onChange={setFilter}
          tabs={[
            { value: "all", label: "All" },
            { value: "pending", label: "Pending", count: count("pending") },
            { value: "confirmed", label: "Confirmed", count: count("confirmed") },
            { value: "preparing", label: "Preparing", count: count("preparing") },
            { value: "ready", label: "Ready", count: count("ready") },
            { value: "completed", label: "Completed" },
            { value: "cancelled", label: "Cancelled" },
          ]}
        />
      </div>

      {role === "admin" ? (
        <Card>
          <DataTable columns={adminColumns} data={visible} getRowKey={(o) => o.id} />
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((order) => (
            <OrderRow key={order.id} order={order} onClick={() => setSelected(order)} />
          ))}
          {visible.length === 0 && (
            <p className="py-10 text-center text-muted">No orders in this status.</p>
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