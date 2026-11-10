import { useState } from "react";
import { Link } from "react-router-dom";

import AreaChart from "../../components/charts/AreaChart";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import Select from "../../components/ui/Select";
import StatCard from "../../components/ui/StatCard";
import { isLow } from "../../features/inventory/types";
import { allOrders } from "../../mocks/allOrders";
import { ingredients } from "../../mocks/inventory";
import {
  CUSTOMER_COUNT,
  POPULAR_ITEM_COUNT,
  periodOptions,
  reports,
  totalRevenue,
  type Period,
} from "../../mocks/reports";
import { formatCurrencyWhole } from "../../utils/formatCurrency";

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<Period>("weekly");

  const report = reports[period];
  const lowStock = ingredients.filter(isLow);
  const pending = allOrders.filter((o) => o.status === "pending").length;

  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        description="Manage your restaurant efficiently"
      />

      <div className="mb-4 flex justify-end">
        <div className="w-44">
          <Select
            aria-label="Period"
            value={period}
            options={periodOptions}
            onChange={(e) => setPeriod(e.target.value as Period)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrencyWhole(totalRevenue(report))}
          icon="💰"
          tone="primary"
          trend={{ value: `${report.revenueTrend}%`, positive: true }}
        />
        <StatCard
          label="Total Orders"
          value={report.orders.toLocaleString("en-US")}
          icon="🧾"
          tone="info"
          trend={{ value: `${report.ordersTrend}%`, positive: true }}
        />
        <StatCard
          label="Popular Items"
          value={POPULAR_ITEM_COUNT}
          icon="⭐"
          tone="success"
        />
        <StatCard
          label="Customers"
          value={CUSTOMER_COUNT.toLocaleString("en-US")}
          icon="👥"
          tone="purple"
        />
      </div>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[1fr_380px]">
        <Card
          title="Sales Overview"
          action={
            <Link
              to="/admin/reports"
              className="text-[13px] font-semibold text-primary"
            >
              View Report →
            </Link>
          }
        >
          <AreaChart labels={report.labels} values={report.values} />
        </Card>

        <div className="space-y-5">
          <Card
            title="Low Stock Alerts"
            action={
              <Link
                to="/admin/inventory"
                className="text-[13px] font-semibold text-primary"
              >
                View All →
              </Link>
            }
          >
            {lowStock.length === 0 ? (
              <p className="text-[13px] text-muted">All stock levels are fine.</p>
            ) : (
              <ul className="space-y-3">
                {lowStock.map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <span className="size-8 shrink-0 rounded-full bg-danger" />
                    <span className="flex-1 text-[13px]">{item.name}</span>
                    <span className="text-[13px] text-muted">
                      &lt; {item.minimum} kg
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Pending Orders">
            <p className="text-3xl font-bold">{pending}</p>
          </Card>
        </div>
      </div>
    </>
  );
}