import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import PageHeader from "../../../shared/components/layout/PageHeader";
import Badge from "../../../shared/components/ui/Badge";
import Card from "../../../shared/components/ui/Card";
import DataTable, { type Column } from "../../../shared/components/ui/DataTable";
import { ORDER_TYPE_LABEL, type Order } from "../types";
import { listMyOrders } from "../api/ordersApi";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import { formatDate } from "../../../shared/utils/formatDate";

export default function MyOrdersPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    listMyOrders().then(setOrders).catch(console.error);
  }, []);

  const q = search.trim().replace(/^#/, "").toLowerCase();

  const visible = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(q) ||
      ORDER_TYPE_LABEL[o.type].toLowerCase().includes(q)
  );

  const columns: Column<Order>[] = [
    { header: "Order", cell: (o) => `#${o.id}` },
    { header: "Date", cell: (o) => formatDate(o.date) },
    {
      header: t("itemsOrdered"),
      cell: (o) => o.lines.reduce((sum, l) => sum + l.quantity, 0),
    },
    { header: t("orderType"), cell: (o) => ORDER_TYPE_LABEL[o.type] },
    { header: t("total"), cell: (o) => formatCurrency(o.total) },
    {
      header: t("status"),
      cell: (o) => (
        <Badge variant={o.status} className="capitalize">
          {o.status}
        </Badge>
      ),
    },
    {
      header: "",
      className: "text-right",
      cell: (o) => {
        if (o.status === "cancelled") return null;

        const isDone = o.status === "completed";
        return (
          <Link
            to={`/customer/orders/${o.id}/${isDone ? "receipt" : "track"}`}
            className="font-semibold text-primary hover:underline"
          >
            {isDone ? t("receipt") : "Track →"}
          </Link>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title={t("navMyOrders")}
        description="Your order history"
        search={{ value: search, onChange: setSearch }}
      />

      <Card className="rounded-2xl shadow-xs overflow-hidden">
        <DataTable
          columns={columns}
          data={visible}
          getRowKey={(o) => o.id}
          emptyMessage="No orders placed yet."
        />
      </Card>
    </>
  );
}
