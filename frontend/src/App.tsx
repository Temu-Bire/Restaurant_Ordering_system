import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Badge, { type BadgeVariant } from "./components/ui/Badge";
import Button from "./components/ui/Button";
import Card from "./components/ui/Card";
import DataTable, { type Column } from "./components/ui/DataTable";
import FilterTabs from "./components/ui/FilterTabs";
import Modal from "./components/ui/Modal";
import StatCard from "./components/ui/StatCard";
import DashboardLayout from "./components/layout/DashboardLayout";
import PageHeader from "./components/layout/PageHeader";

const staffNav = [
  { label: "Dashboard", to: "/staff/dashboard" },
  { label: "Orders", to: "/staff/orders" },
];
const user = { name: "Sara T.", role: "Waiter / Staff" };

interface Order {
  id: string;
  type: string;
  total: string;
  status: BadgeVariant;
}

const orders: Order[] = [
  { id: "#ORD-1001", type: "Dine-in", total: "$16.98", status: "pending" },
  { id: "#ORD-1000", type: "Takeaway", total: "$8.99", status: "preparing" },
  { id: "#ORD-0999", type: "Dine-in", total: "$24.50", status: "ready" },
];

function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="Today · Nov 10, 2026" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="New Orders" value={12} tone="primary" />
        <StatCard label="Completed" value={8} tone="success" />
        <StatCard label="Preparing" value={3} tone="info" />
        <StatCard label="Tables Occupied" value={5} tone="purple" />
      </div>
    </>
  );
}

function OrdersPage() {
  const [filter, setFilter] = useState<"all" | "pending" | "preparing">("all");
  const [selected, setSelected] = useState<Order | null>(null);

  const visible = orders.filter((o) => filter === "all" || o.status === filter);

  const columns: Column<Order>[] = [
    { header: "Order", cell: (o) => <span className="font-semibold">{o.id}</span> },
    { header: "Type", cell: (o) => o.type },
    { header: "Total", cell: (o) => o.total },
    {
      header: "Status",
      cell: (o) => <Badge variant={o.status} className="capitalize">{o.status}</Badge>,
    },
    {
      header: "",
      cell: (o) => (
        <Button size="sm" variant="outline" onClick={() => setSelected(o)}>
          Details
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Orders" description="Incoming orders" />

      <div className="mb-4">
        <FilterTabs
          value={filter}
          onChange={setFilter}
          tabs={[
            { value: "all", label: "All" },
            { value: "pending", label: "Pending", count: 1 },
            { value: "preparing", label: "Preparing", count: 1 },
          ]}
        />
      </div>

      <Card>
        <DataTable columns={columns} data={visible} getRowKey={(o) => o.id} />
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Order Details">
        <p className="text-xl font-bold">{selected?.id}</p>
        <p className="mt-1 text-muted">
          {selected?.type} · {selected?.total}
        </p>
      </Modal>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/staff/dashboard" replace />} />
        <Route path="/staff" element={<DashboardLayout navItems={staffNav} user={user} />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}