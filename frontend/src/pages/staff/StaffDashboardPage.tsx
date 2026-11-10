import PageHeader from "../../components/layout/PageHeader";
import StatCard from "../../components/ui/StatCard";
import OrderRow from "../../features/orders/components/OrderRow";
import TableTile from "../../features/tables/components/TableTile";
import { allOrders } from "../../mocks/allOrders";
import { tables } from "../../mocks/tables";

export default function StaffDashboardPage() {
  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  const count = (status: string) =>
    allOrders.filter((o) => o.status === status).length;

  return (
    <>
      <PageHeader title="Dashboard" description={`Today · ${today}`} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="New Orders" value={count("pending")} tone="primary" />
        <StatCard label="Completed" value={count("completed")} tone="success" />
        <StatCard label="Preparing" value={count("preparing")} tone="info" />
        <StatCard
          label="Tables Occupied"
          value={tables.filter((t) => t.status === "occupied").length}
          tone="purple"
        />
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        <section>
          <h2 className="mb-3 text-lg font-bold">Recent Orders</h2>
          <div className="space-y-3">
            {allOrders.slice(0, 3).map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold">Restaurant Tables</h2>
          <div className="grid grid-cols-3 gap-3">
            {tables.slice(0, 6).map((table) => (
              <TableTile key={table.id} table={table} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}