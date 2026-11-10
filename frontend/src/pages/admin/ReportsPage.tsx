import { useState } from "react";

import BarChart from "../../components/charts/BarChart";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import FilterTabs from "../../components/ui/FilterTabs";
import StatCard from "../../components/ui/StatCard";
import {
  reports,
  reportTabs,
  totalRevenue,
  type Period,
} from "../../mocks/reports";
import { formatCurrency, formatCurrencyWhole } from "../../utils/formatCurrency";

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("daily");

  const report = reports[period];
  const revenue = totalRevenue(report);
  const maxSold = Math.max(...report.popular.map((p) => p.sold), 1);

  return (
    <>
      <PageHeader title="Reports" description="Daily, weekly and monthly sales" />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs value={period} onChange={setPeriod} tabs={reportTabs} />
        {/* The print dialog has a "Save as PDF" option */}
        <Button variant="secondary" onClick={() => window.print()}>
          Export PDF
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue" value={formatCurrencyWhole(revenue)} icon="💰" tone="primary" />
        <StatCard label="Orders" value={report.orders.toLocaleString("en-US")} icon="🧾" tone="info" />
        <StatCard label="Avg. Order" value={formatCurrency(revenue / report.orders)} icon="📊" tone="success" />
        <StatCard label="Completed" value={`${report.completedPercent}%`} icon="✅" tone="purple" />
      </div>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-2">
        <Card title={report.chartTitle}>
          <BarChart labels={report.labels} values={report.values} />
        </Card>

        <Card title="Popular Food Items">
          <ul className="space-y-4">
            {report.popular.map((item) => (
              <li key={item.name}>
                <div className="mb-1.5 flex justify-between text-[13px]">
                  <span>{item.name}</span>
                  <span className="font-semibold">{item.sold.toLocaleString("en-US")}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-secondary">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(item.sold / maxSold) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}