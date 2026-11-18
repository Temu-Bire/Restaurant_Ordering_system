import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import AreaChart from "../../components/charts/AreaChart";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import Select from "../../components/ui/Select";
import StatCard from "../../components/ui/StatCard";
import { getAdminDashboard, type AdminDashboardData, type Period } from "../../features/reports/reportsApi";
import { useTranslation } from "../../hooks/useTranslation";
import { formatCurrencyWhole } from "../../utils/formatCurrency";

const totalRevenue = (values: number[]) => values.reduce((sum, v) => sum + v, 0);

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>("weekly");
  const [data, setData] = useState<AdminDashboardData | null>(null);

  const periodOptions: { value: Period; label: string }[] = [
    { value: "daily", label: "This Week" },
    { value: "weekly", label: "This Month" },
    { value: "monthly", label: "Last 6 Months" },
  ];

  useEffect(() => {
    getAdminDashboard(period).then(setData).catch(console.error);
  }, [period]);

  if (!data) return <p className="py-10 text-center text-muted">{t("loading")}</p>;

  const report = data.report;
  const revenue = totalRevenue(report.values);

  return (
    <>
      <PageHeader
        title={t("adminDashboardTitle")}
        description={t("adminDashboardDesc")}
      />

      <div className="mb-5 flex justify-start sm:justify-end">
        <div className="w-full sm:w-48">
          <Select
            aria-label="Period"
            value={period}
            options={periodOptions}
            onChange={(e) => setPeriod(e.target.value as Period)}
          />
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("totalRevenue")}
          value={formatCurrencyWhole(revenue)}
          icon="💰"
          tone="primary"
          trend={{ value: `${report.revenueTrend}%`, positive: true }}
        />
        <StatCard
          label={t("totalOrders")}
          value={report.orders.toLocaleString("en-US")}
          icon="🧾"
          tone="info"
          trend={{ value: `${report.ordersTrend}%`, positive: true }}
        />
        <StatCard
          label={t("popularItems")}
          value={data.popularItems}
          icon="⭐"
          tone="success"
        />
        <StatCard
          label={t("customers")}
          value={data.customers.toLocaleString("en-US")}
          icon="👥"
          tone="purple"
        />
      </div>

      <div className="mt-6 grid items-start gap-6 grid-cols-1 lg:grid-cols-[1fr_360px]">
        <Card
          title={t("salesOverview")}
          action={
            <Link
              to="/admin/reports"
              className="text-[13px] font-semibold text-primary hover:underline"
            >
              {t("viewAll")}
            </Link>
          }
          className="rounded-2xl shadow-xs"
        >
          <div className="w-full overflow-hidden">
            <AreaChart labels={report.labels} values={report.values} />
          </div>
        </Card>

        <div className="space-y-6">
          <Card
            title={t("lowStockAlerts")}
            action={
              <Link
                to="/admin/inventory"
                className="text-[13px] font-semibold text-primary hover:underline"
              >
                {t("viewAll")}
              </Link>
            }
            className="rounded-2xl shadow-xs"
          >
            {data.lowStock.length === 0 ? (
              <p className="text-[13px] text-muted">{t("allStockOk")}</p>
            ) : (
              <ul className="space-y-3">
                {data.lowStock.map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <span className="size-2.5 shrink-0 rounded-full bg-danger" />
                    <span className="flex-1 truncate text-[13px] font-medium text-foreground">{item.name}</span>
                    <span className="text-xs text-muted">
                      &lt; {item.minimum} kg
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={t("pendingOrders")} className="rounded-2xl shadow-xs">
            <p className="text-3xl font-black text-primary">{data.pendingOrders}</p>
          </Card>
        </div>
      </div>
    </>
  );
}
