import { useState, useEffect } from "react";

import PageHeader from "../../components/layout/PageHeader";
import StatCard from "../../components/ui/StatCard";
import OrderRow from "../../features/orders/components/OrderRow";
import TableTile from "../../features/tables/components/TableTile";
import { getStaffDashboard, type StaffDashboardData } from "../../features/reports/reportsApi";
import { useTranslation } from "../../hooks/useTranslation";

export default function StaffDashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<StaffDashboardData | null>(null);

  useEffect(() => {
    getStaffDashboard().then(setData).catch(console.error);
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  if (!data) return <p className="py-10 text-center text-muted">{t("loading")}</p>;

  return (
    <>
      <PageHeader
        title={t("staffDashboardTitle")}
        description={`${t("staffDashboardDesc")} · ${today}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("statusPending")} value={data.pending} tone="primary" />
        <StatCard label={t("statusCompleted")} value={data.completed} tone="success" />
        <StatCard label={t("statusPreparing")} value={data.preparing} tone="info" />
        <StatCard
          label={t("occupiedTables")}
          value={data.occupiedTables}
          tone="purple"
        />
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        <section>
          <h2 className="mb-3 text-lg font-bold">{t("recentOrders")}</h2>
          <div className="space-y-3">
            {data.recentOrders.slice(0, 3).map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold">{t("navTables")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.tables.slice(0, 6).map((table) => (
              <TableTile key={table.id} table={table} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
