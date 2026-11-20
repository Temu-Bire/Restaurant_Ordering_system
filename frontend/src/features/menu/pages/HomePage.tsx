import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import PageHeader from "../../../shared/components/layout/PageHeader";
import Badge from "../../../shared/components/ui/Badge";
import Card from "../../../shared/components/ui/Card";
import FoodCard from "../components/FoodCard";
import CustomerFoodModal from "../components/CustomerFoodModal";
import type { FoodItem } from "../types";
import type { Order } from "../../orders/types";
import { useCart } from "../../cart/hooks/useCart";
import { useAuth } from "../../auth/hooks/useAuth";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import { listFoods, listCategories, mapApiFoodToFoodItem, type ApiCategory } from "../api/menuApi";
import { listMyOrders } from "../../orders/api/ordersApi";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import { formatTimeAgo } from "../../../shared/utils/formatTimeAgo";

export default function HomePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { addItem, count, subtotal } = useCart();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  useEffect(() => {
    listFoods()
      .then((items) => setFoods(items.map(mapApiFoodToFoodItem)))
      .catch(console.error);

    listCategories().then(setCategories).catch(console.error);

    listMyOrders()
      .then((orders) => setRecentOrders(orders.slice(0, 3)))
      .catch(console.error);
  }, []);

  const popular = foods.slice(0, 4);
  const firstName = user?.name ? user.name.split(" ")[0] : "Friend";

  return (
    <>
      <PageHeader
        title={t("navHome")}
        description={`${t("welcomeBack")}, ${firstName}! Browse our menu and track your active orders.`}
      />

      {/* Hero banner & Quick Overview */}
      <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-surface to-surface-secondary p-6 sm:p-8 shadow-xs">
          <div className="relative z-10 max-w-sm">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              Fresh & Fast
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black leading-tight text-foreground tracking-tight">
              Delicious Meals, Ready for You
            </h2>
            <p className="mt-2 text-[13px] text-muted">
              Choose Dine-in or Takeaway with live kitchen order tracking.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <Link
                to="/customer/menu"
                className="inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-xs transition-colors hover:bg-primary-hover"
              >
                {t("browseMenu")} →
              </Link>
              <Link
                to="/customer/orders"
                className="inline-block rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-secondary transition-colors"
              >
                My Orders
              </Link>
            </div>
          </div>
          <div className="absolute -right-16 top-1/2 hidden size-64 -translate-y-1/2 rounded-full bg-gradient-to-br from-red-500 to-amber-300 opacity-60 sm:block blur-2xl" />
        </section>

        {/* Quick Cart & Profile Card */}
        <div className="space-y-4">
          {/* Cart Widget */}
          <Card className="rounded-3xl shadow-xs p-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Your Cart</span>
              <span className="text-xs font-semibold text-primary">{count} items</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted">Current Subtotal</p>
                <p className="text-lg font-black text-foreground">{formatCurrency(subtotal)}</p>
              </div>
              <Link
                to="/customer/cart"
                className="rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-hover transition-colors"
              >
                View Cart →
              </Link>
            </div>
          </Card>

          {/* Profile Shortcut */}
          <Card className="rounded-3xl shadow-xs p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-sm">
                  {firstName[0]?.toUpperCase() ?? "U"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{user?.name ?? "Customer"}</p>
                  <p className="text-[11px] text-muted truncate">{user?.email}</p>
                </div>
              </div>
              <Link
                to="/customer/profile"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Profile →
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Categories */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-bold text-foreground">{t("categories")}</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/customer/menu"
            className="rounded-full border border-border bg-surface px-4 py-1.5 text-[13px] font-semibold text-foreground transition-all hover:bg-surface-secondary shadow-xs"
          >
            All Items
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/customer/menu?category=${encodeURIComponent(c.name.toLowerCase())}`}
              className="rounded-full border border-border bg-surface px-4 py-1.5 text-[13px] font-medium text-foreground transition-all hover:bg-surface-secondary hover:border-primary/40 shadow-xs"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Dishes */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">{t("popularDishes")}</h2>
          <Link to="/customer/menu" className="text-[13px] font-semibold text-primary hover:underline">
            {t("viewAll")} →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popular.map((food) => (
            <FoodCard
              key={food.id}
              food={food}
              onAdd={addItem}
              onViewDetails={setSelectedFood}
            />
          ))}
        </div>
      </section>

      {/* Recent Orders & Live Tracking */}
      {recentOrders.length > 0 && (
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Recent Orders & Status</h2>
            <Link to="/customer/orders" className="text-[13px] font-semibold text-primary hover:underline">
              View All Orders →
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-4 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-foreground">#{order.id}</span>
                    <Badge variant={order.status} className="capitalize text-xs">
                      {order.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {order.lines.reduce((sum, l) => sum + l.quantity, 0)} items · {order.table ? `Table ${order.table}` : order.type}
                  </p>
                  <p className="mt-1 text-sm font-bold text-foreground">
                    {formatCurrency(order.total)}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-[11px] text-muted">{formatTimeAgo(order.date)}</span>
                  <Link
                    to={`/customer/orders/${order.id}/track`}
                    className="rounded-lg bg-surface-secondary px-3 py-1 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-colors"
                  >
                    Track Status →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {selectedFood && (
        <CustomerFoodModal
          food={selectedFood}
          onClose={() => setSelectedFood(null)}
          onAdd={addItem}
        />
      )}
    </>
  );
}
