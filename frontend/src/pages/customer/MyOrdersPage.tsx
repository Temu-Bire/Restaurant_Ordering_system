import { Link } from "react-router-dom";

import PageHeader from "../../components/layout/PageHeader";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import DataTable, { type Column } from "../../components/ui/DataTable";
import { ORDER_TYPE_LABEL, type Order } from "../../features/orders/types";
import { orders } from "../../mocks/orders";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";

const columns: Column<Order>[] = [
  { header: "Order", cell: (o) => `#${o.id}` },
  { header: "Date", cell: (o) => formatDate(o.date) },
  {
    header: "Items",
    cell: (o) => o.lines.reduce((sum, l) => sum + l.quantity, 0),
  },
  { header: "Type", cell: (o) => ORDER_TYPE_LABEL[o.type] },
  { header: "Total", cell: (o) => formatCurrency(o.total) },
  {
    header: "Status",
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
          className="font-semibold text-primary"
        >
          {isDone ? "Receipt" : "Track"}
        </Link>
      );
    },
  },
];

export default function MyOrdersPage() {
  return (
    <>
      <PageHeader title="My Orders" description="Order history" />
      <Card>
        <DataTable columns={columns} data={orders} getRowKey={(o) => o.id} />
      </Card>
    </>
  );
}