import { useState, useEffect } from "react";
import {
  Banknote,
  Receipt,
  Package,
  Star,
  Truck,
  Download,
  Printer,
  Utensils,
  BarChart3,
  CheckCircle2,
  Zap,
  XCircle,
  Trash2,
  AlertTriangle,
  MapPin,
  ShoppingBag,
} from "lucide-react";

import PageHeader from "../../../shared/components/layout/PageHeader";
import Badge from "../../../shared/components/ui/Badge";
import Button from "../../../shared/components/ui/Button";
import Card from "../../../shared/components/ui/Card";
import FilterTabs from "../../../shared/components/ui/FilterTabs";
import Select from "../../../shared/components/ui/Select";
import StatCard from "../../../shared/components/ui/StatCard";
import { getAnalytics, type AnalyticsData, type AnalyticsFilterParams } from "../api/reportsApi";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import { formatCurrency, formatCurrencyWhole } from "../../../shared/utils/formatCurrency";

type ReportTab = "sales" | "orders" | "inventory" | "popular" | "delivery";

export default function ReportsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ReportTab>("sales");
  const [period, setPeriod] = useState<"today" | "yesterday" | "week" | "month" | "year" | "custom">("week");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [orderTypeFilter, setOrderTypeFilter] = useState("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const filters: AnalyticsFilterParams = {
        period,
        startDate: period === "custom" && startDate ? startDate : undefined,
        endDate: period === "custom" && endDate ? endDate : undefined,
        orderType: orderTypeFilter !== "all" ? orderTypeFilter : undefined,
        orderStatus: orderStatusFilter !== "all" ? orderStatusFilter : undefined,
        paymentStatus: paymentStatusFilter !== "all" ? paymentStatusFilter : undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
      };
      const res = await getAnalytics(filters);
      setData(res);
    } catch (err) {
      console.error("Failed to load analytics", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchAnalytics();
  }, [period, orderTypeFilter, orderStatusFilter, paymentStatusFilter, categoryFilter]);

  function handleCustomDateApply() {
    if (startDate && endDate) {
      void fetchAnalytics();
    }
  }

  // Export CSV Functionality
  function exportCSV() {
    if (!data) return;
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `restaurant_report_${activeTab}_${period}.csv`;

    if (activeTab === "sales") {
      headers = ["Category", "Orders Count", "Paid Revenue (ETB)"];
      rows = data.sales.salesByCategory.map((c) => [c.category, c.count, c.revenue]);
      rows.push(["", "", ""]);
      rows.push(["Order Type", "Orders Count", "Paid Revenue (ETB)"]);
      data.sales.salesByOrderType.forEach((t) => rows.push([t.type, t.count, t.revenue]));
    } else if (activeTab === "orders") {
      headers = ["Metric / Status", "Count"];
      rows = [
        ["Total Orders", data.orders.totalOrders],
        ["Completed Orders", data.orders.completedOrders],
        ["Cancelled Orders", data.orders.cancelledOrders],
        ["Pending Orders", data.orders.pendingOrders],
        ...data.orders.byStatus.map((s) => [`Status: ${s.status}`, s.count]),
      ];
    } else if (activeTab === "inventory") {
      headers = ["Item Name", "SKU", "Category", "Stock", "Unit", "Min Threshold", "Unit Cost (ETB)", "Total Valuation (ETB)"];
      rows = data.inventory.items.map((i) => [
        i.name,
        i.sku || "",
        i.category,
        i.stock,
        i.unit,
        i.minimum,
        i.unitCost,
        i.totalValue,
      ]);
    } else if (activeTab === "popular") {
      headers = ["Dish Name", "Category", "Quantity Sold", "Revenue (ETB)"];
      rows = data.popularItems.bestSelling.map((b) => [b.name, b.category, b.quantity, b.revenue]);
    } else if (activeTab === "delivery") {
      headers = ["Delivery Metric", "Value"];
      rows = [
        ["Total Delivery Orders", data.delivery.totalDeliveryOrders],
        ["Delivery Fees Collected (ETB)", data.delivery.deliveryFeesCollected],
        ["Average Distance (km)", data.delivery.averageDistanceKm],
        ...data.delivery.byStatus.map((s) => [`Status: ${s.status}`, s.count]),
      ];
    }

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.map((val) => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const periodOptions = [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "year", label: "This Year" },
    { value: "custom", label: "Custom Date Range" },
  ];

  const reportTabs: { value: ReportTab; label: string }[] = [
    { value: "sales", label: "Sales Reports" },
    { value: "orders", label: "Order Reports" },
    { value: "inventory", label: "Inventory Reports" },
    { value: "popular", label: "Popular Items" },
    { value: "delivery", label: "Delivery Reports" },
  ];

  return (
    <>
      <PageHeader
        title={t("navReports")}
        description="Admin reports: verified sales, item consumption, delivery fees, and order analytics"
      />

      {/* Top Filter and Actions Bar */}
      <div className="mb-6 space-y-4 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="overflow-x-auto pb-1">
            <FilterTabs value={activeTab} onChange={(val) => setActiveTab(val as ReportTab)} tabs={reportTabs} />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={exportCSV}
              disabled={!data || loading}
              className="inline-flex items-center gap-1.5"
            >
              <Download className="size-4" />
              <span>Export CSV</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="print:hidden inline-flex items-center gap-1.5"
              onClick={() => window.print()}
            >
              <Printer className="size-4" />
              <span>Print / PDF</span>
            </Button>
          </div>
        </div>

        {/* Date and Secondary Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-bold text-muted block mb-1">Time Period</label>
            <Select
              id="period-select"
              value={period}
              options={periodOptions}
              onChange={(e) => setPeriod(e.target.value as any)}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted block mb-1">Order Type</label>
            <Select
              id="type-select"
              value={orderTypeFilter}
              options={[
                { value: "all", label: "All Order Types" },
                { value: "dine-in", label: "Dine-in" },
                { value: "takeaway", label: "Takeaway" },
                { value: "delivery", label: "Delivery" },
              ]}
              onChange={(e) => setOrderTypeFilter(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted block mb-1">Payment Status</label>
            <Select
              id="pay-select"
              value={paymentStatusFilter}
              options={[
                { value: "all", label: "All Payment Statuses" },
                { value: "paid", label: "Paid Only" },
                { value: "pending", label: "Pending" },
                { value: "failed", label: "Failed" },
                { value: "cancelled", label: "Cancelled" },
              ]}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted block mb-1">Order Status</label>
            <Select
              id="status-select"
              value={orderStatusFilter}
              options={[
                { value: "all", label: "All Order Statuses" },
                { value: "completed", label: "Completed" },
                { value: "served", label: "Served" },
                { value: "delivered", label: "Delivered" },
                { value: "picked_up", label: "Picked Up" },
                { value: "cancelled", label: "Cancelled" },
              ]}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted block mb-1">Category</label>
            <Select
              id="cat-select"
              value={categoryFilter}
              options={[
                { value: "all", label: "All Categories" },
                { value: "ingredients", label: "Ingredients" },
                { value: "beverages", label: "Beverages" },
                { value: "dry_goods", label: "Dry Goods" },
                { value: "packaging", label: "Packaging" },
                { value: "supplies", label: "Supplies" },
              ]}
              onChange={(e) => setCategoryFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Custom Date Range Picker */}
        {period === "custom" && (
          <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-border">
            <div>
              <label className="text-[11px] font-bold text-muted block mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-muted block mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-foreground"
              />
            </div>
            <Button size="sm" onClick={handleCustomDateApply}>
              Apply Dates
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <Card className="py-16 text-center text-sm text-muted rounded-2xl shadow-xs">
          Loading report calculations...
        </Card>
      ) : !data ? (
        <Card className="py-16 text-center text-sm text-muted rounded-2xl shadow-xs">
          No report data available for this range.
        </Card>
      ) : (
        <div className="space-y-6">
          {/* ───────────────────────── TAB 1: SALES REPORTS ───────────────────────── */}
          {activeTab === "sales" && (
            <>
              {/* Sales KPI Cards */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Paid Revenue (Verified)"
                  value={formatCurrencyWhole(data.sales.paidRevenue)}
                  icon={<Banknote className="size-6" />}
                  tone="primary"
                />
                <StatCard
                  label="Food & Beverage Sales"
                  value={formatCurrencyWhole(data.sales.foodSales)}
                  icon={<Utensils className="size-6" />}
                  tone="success"
                />
                <StatCard
                  label="Delivery Fees Collected"
                  value={formatCurrencyWhole(data.sales.deliveryFeesCollected)}
                  icon={<Truck className="size-6" />}
                  tone="info"
                />
                <StatCard
                  label="Average Order Value"
                  value={formatCurrency(data.sales.averageOrderValue)}
                  icon={<BarChart3 className="size-6" />}
                  tone="purple"
                />
              </div>

              <div className="grid items-start gap-6 lg:grid-cols-2">
                {/* Sales by Order Type */}
                <Card title="Sales by Order Type" className="rounded-2xl shadow-xs">
                  <div className="space-y-4">
                    {data.sales.salesByOrderType.map((item) => (
                      <div key={item.type} className="space-y-1 text-xs">
                        <div className="flex justify-between font-bold text-foreground">
                          <span className="capitalize">{item.type}</span>
                          <span className="font-mono text-primary">{formatCurrency(item.revenue)}</span>
                        </div>
                        <div className="flex justify-between text-muted text-[11px]">
                          <span>{item.count} orders</span>
                          <span>
                            {data.sales.paidRevenue > 0
                              ? Math.round((item.revenue / data.sales.paidRevenue) * 100)
                              : 0}
                            % of revenue
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-surface-secondary overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${data.sales.paidRevenue > 0 ? (item.revenue / data.sales.paidRevenue) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Sales by Menu Category */}
                <Card title="Sales by Food Category" className="rounded-2xl shadow-xs">
                  <div className="space-y-3">
                    {data.sales.salesByCategory.map((cat) => (
                      <div key={cat.category} className="flex justify-between items-center py-2 border-b border-border/50 text-xs">
                        <div>
                          <span className="font-bold text-foreground block">{cat.category}</span>
                          <span className="text-[11px] text-muted">{cat.count} items sold</span>
                        </div>
                        <span className="font-mono font-bold text-foreground">
                          {formatCurrency(cat.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </>
          )}

          {/* ───────────────────────── TAB 2: ORDER REPORTS ───────────────────────── */}
          {activeTab === "orders" && (
            <>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total Orders" value={data.orders.totalOrders} icon={<Receipt className="size-6" />} tone="info" />
                <StatCard label="Completed Orders" value={data.orders.completedOrders} icon={<CheckCircle2 className="size-6" />} tone="success" />
                <StatCard label="Pending Orders" value={data.orders.pendingOrders} icon={<Zap className="size-6" />} tone="primary" />
                <StatCard label="Cancelled Orders" value={data.orders.cancelledOrders} icon={<XCircle className="size-6" />} tone="danger" />
              </div>

              <div className="grid items-start gap-6 lg:grid-cols-2">
                <Card title="Orders by Fulfillment Status" className="rounded-2xl shadow-xs">
                  <div className="space-y-3">
                    {data.orders.byStatus.map((s) => (
                      <div key={s.status} className="flex justify-between items-center py-2 border-b border-border/50 text-xs">
                        <Badge variant={s.status as any} className="capitalize text-xs font-bold">
                          {s.status}
                        </Badge>
                        <span className="font-bold font-mono text-foreground text-sm">
                          {s.count} orders
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="Orders by Fulfillment Type" className="rounded-2xl shadow-xs">
                  <div className="space-y-3">
                    {data.orders.byType.map((t) => (
                      <div key={t.type} className="flex justify-between items-center py-2.5 border-b border-border/50 text-xs">
                        <span className="font-bold text-foreground capitalize text-sm inline-flex items-center gap-1.5">
                          {t.type === "dine-in" ? (
                            <>
                              <Utensils className="size-4 text-primary" />
                              <span>Dine-in</span>
                            </>
                          ) : t.type === "takeaway" ? (
                            <>
                              <ShoppingBag className="size-4 text-amber-500" />
                              <span>Takeaway</span>
                            </>
                          ) : (
                            <>
                              <Truck className="size-4 text-blue-500" />
                              <span>Delivery</span>
                            </>
                          )}
                        </span>
                        <span className="font-bold font-mono text-primary text-sm">
                          {t.count} orders
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </>
          )}

          {/* ───────────────────────── TAB 3: INVENTORY REPORTS ───────────────────────── */}
          {activeTab === "inventory" && (
            <>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Total Stock Valuation"
                  value={formatCurrencyWhole(data.inventory.totalInventoryValue)}
                  icon={<Banknote className="size-6" />}
                  tone="primary"
                />
                <StatCard
                  label="Stock Received Value"
                  value={formatCurrencyWhole(data.inventory.stockReceivedValue)}
                  icon={<Package className="size-6" />}
                  tone="success"
                />
                <StatCard
                  label="Waste / Spoilage Loss"
                  value={formatCurrencyWhole(data.inventory.wasteValue)}
                  icon={<Trash2 className="size-6" />}
                  tone="danger"
                />
                <StatCard
                  label="Low / Out of Stock Items"
                  value={`${data.inventory.lowStockCount + data.inventory.outOfStockCount} items`}
                  icon={<AlertTriangle className="size-6" />}
                  tone="primary"
                />
              </div>

              {/* Current Stock Levels Table */}
              <Card title="Current Inventory Valuation & Stock Levels" className="rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-secondary/70 text-muted font-bold border-b border-border">
                      <tr>
                        <th className="py-2.5 px-3">Item Name</th>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Stock on Hand</th>
                        <th className="py-2.5 px-3">Min Threshold</th>
                        <th className="py-2.5 px-3">Unit Cost</th>
                        <th className="py-2.5 px-3 text-right">Total Valuation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.inventory.items.map((i) => (
                        <tr key={i.id} className="hover:bg-surface-secondary/30">
                          <td className="py-2.5 px-3 font-semibold text-foreground">{i.name}</td>
                          <td className="py-2.5 px-3 font-mono text-muted">{i.sku || "—"}</td>
                          <td className="py-2.5 px-3 capitalize text-muted">{i.category}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                            {i.stock} {i.unit}
                          </td>
                          <td className="py-2.5 px-3 text-muted">{i.minimum} {i.unit}</td>
                          <td className="py-2.5 px-3 font-mono">{formatCurrency(i.unitCost)}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-primary text-right">
                            {formatCurrency(i.totalValue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Movement History Table */}
              <Card title="Recent Stock Movements & Consumptions" className="rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-secondary/70 text-muted font-bold border-b border-border">
                      <tr>
                        <th className="py-2.5 px-3">Item</th>
                        <th className="py-2.5 px-3">Movement Type</th>
                        <th className="py-2.5 px-3">Quantity Changed</th>
                        <th className="py-2.5 px-3">Reason</th>
                        <th className="py-2.5 px-3">Staff / System</th>
                        <th className="py-2.5 px-3 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.inventory.recentMovements.map((m) => (
                        <tr key={m.id} className="hover:bg-surface-secondary/30">
                          <td className="py-2.5 px-3 font-semibold text-foreground">{m.ingredientName}</td>
                          <td className="py-2.5 px-3 font-bold text-muted">{m.type}</td>
                          <td className="py-2.5 px-3 font-mono font-bold">
                            <span className={m.delta > 0 ? "text-emerald-600" : "text-rose-500"}>
                              {m.delta > 0 ? `+${m.delta}` : m.delta} {m.unit}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-muted truncate max-w-[200px]">{m.reason}</td>
                          <td className="py-2.5 px-3">{m.userName}</td>
                          <td className="py-2.5 px-3 text-right text-muted">
                            {new Date(m.date).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {/* ───────────────────────── TAB 4: POPULAR ITEMS ───────────────────────── */}
          {activeTab === "popular" && (
            <div className="grid items-start gap-6 lg:grid-cols-2">
              <Card
                title="Top 10 Best-Selling Menu Items"
                action={
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
                    <Star className="size-3.5 fill-amber-500" />
                    <span>Best Sellers</span>
                  </span>
                }
                className="rounded-2xl shadow-xs"
              >
                <div className="space-y-3">
                  {data.popularItems.bestSelling.map((item, idx) => (
                    <div key={item.name} className="flex justify-between items-center py-2.5 border-b border-border/50 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="size-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-foreground text-sm block">{item.name}</span>
                          <span className="text-[11px] text-muted">{item.category}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-foreground block">{item.quantity} sold</span>
                        <span className="font-mono font-bold text-primary text-xs">{formatCurrency(item.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Least-Selling Menu Items" className="rounded-2xl shadow-xs">
                <div className="space-y-3">
                  {data.popularItems.leastSelling.map((item) => (
                    <div key={item.name} className="flex justify-between items-center py-2.5 border-b border-border/50 text-xs">
                      <div>
                        <span className="font-bold text-foreground block">{item.name}</span>
                        <span className="text-[11px] text-muted">{item.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-muted block">{item.quantity} sold</span>
                        <span className="font-mono text-muted text-xs">{formatCurrency(item.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ───────────────────────── TAB 5: DELIVERY REPORTS ───────────────────────── */}
          {activeTab === "delivery" && (
            <>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <StatCard
                  label="Total Delivery Orders"
                  value={data.delivery.totalDeliveryOrders}
                  icon={<Truck className="size-6" />}
                  tone="primary"
                />
                <StatCard
                  label="Delivery Fees Collected"
                  value={formatCurrencyWhole(data.delivery.deliveryFeesCollected)}
                  icon={<Banknote className="size-6" />}
                  tone="success"
                />
                <StatCard
                  label="Average Courier Distance"
                  value={`${data.delivery.averageDistanceKm} km`}
                  icon={<MapPin className="size-6" />}
                  tone="info"
                />
              </div>

              <Card title="Delivery Status Breakdown" className="rounded-2xl shadow-xs">
                <div className="space-y-3">
                  {data.delivery.byStatus.map((s) => (
                    <div key={s.status} className="flex justify-between items-center py-2 border-b border-border/50 text-xs">
                      <span className="font-bold text-foreground capitalize">{s.status}</span>
                      <span className="font-mono font-bold text-primary text-sm">{s.count} orders</span>
                    </div>
                  ))}
                  {data.delivery.byStatus.length === 0 && (
                    <p className="text-xs text-muted py-4 text-center">No delivery orders in this period.</p>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
      )}
    </>
  );
}
