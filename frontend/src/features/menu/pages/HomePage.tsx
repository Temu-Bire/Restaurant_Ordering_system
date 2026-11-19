import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import PageHeader from "../../../shared/components/layout/PageHeader";
import FoodCard from "../components/FoodCard";
import type { FoodItem } from "../types";
import { useCart } from "../../cart/hooks/useCart";
import { useAuth } from "../../auth/hooks/useAuth";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import { listFoods, listCategories, mapApiFoodToFoodItem, type ApiCategory } from "../api/menuApi";

export default function HomePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { addItem } = useCart();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);

  useEffect(() => {
    listFoods()
      .then((items) =>
        setFoods(items.filter((f) => f.isAvailable).map(mapApiFoodToFoodItem))
      )
      .catch(console.error);

    listCategories().then(setCategories).catch(console.error);
  }, []);

  const popular = foods.slice(0, 4);
  const firstName = user?.name ? user.name.split(" ")[0] : "Friend";

  return (
    <>
      <PageHeader
        title={t("navHome")}
        description={`${t("welcomeBack")}, ${firstName}`}
      />

      {/* Hero banner */}
      <section className="relative mb-6 overflow-hidden rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
        <div className="relative z-10 max-w-sm">
          <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight text-foreground tracking-tight">
            {t("heroTitle")}
          </h2>
          <p className="mt-2 text-[13px] text-muted">
            {t("brandTagline")}
          </p>
          <Link
            to="/customer/menu"
            className="mt-4 inline-block rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-primary-hover"
          >
            {t("browseMenu")}
          </Link>
        </div>
        <div className="absolute -right-16 top-1/2 hidden size-72 -translate-y-1/2 rounded-full bg-gradient-to-br from-red-500 to-amber-300 opacity-80 sm:block" />
      </section>

      {/* Popular dishes */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">{t("popularDishes")}</h2>
        <Link to="/customer/menu" className="text-[13px] font-semibold text-primary hover:underline">
          {t("viewAll")}
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {popular.map((food) => (
          <FoodCard key={food.id} food={food} onAdd={addItem} />
        ))}
      </div>

      {/* Categories */}
      <h2 className="mb-3 text-lg font-bold text-foreground">{t("categories")}</h2>
      <div className="flex flex-wrap gap-2">
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
    </>
  );
}
