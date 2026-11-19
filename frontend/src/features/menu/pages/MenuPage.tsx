import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";

import PageHeader from "../../../shared/components/layout/PageHeader";
import FilterTabs from "../../../shared/components/ui/FilterTabs";
import FoodCard from "../components/FoodCard";
import type { FoodItem } from "../types";
import { useCart } from "../../cart/hooks/useCart";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import { listFoods, listCategories, mapApiFoodToFoodItem, type ApiCategory } from "../api/menuApi";

export default function MenuPage() {
  const { addItem } = useCart();
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);

  useEffect(() => {
    listFoods()
      .then((foods) =>
        setItems(foods.filter((f) => f.isAvailable).map(mapApiFoodToFoodItem))
      )
      .catch(console.error);

    listCategories()
      .then(setCategories)
      .catch(console.error);
  }, []);

  const tabs = [
    { value: "all", label: t("all") },
    ...categories.map((c) => ({ value: c.name.toLowerCase(), label: c.name })),
  ];

  const raw = (params.get("category") ?? "").toLowerCase();
  const filter = tabs.some((c) => c.value === raw) ? raw : "all";

  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();

  const visible = items.filter(
    (f) =>
      (filter === "all" || f.category.toLowerCase() === filter) &&
      f.name.toLowerCase().includes(q)
  );

  return (
    <>
      <PageHeader
        title={t("navMenu")}
        description={t("chooseFromCategories")}
        search={{ value: search, onChange: setSearch }}
      />

      <div className="mb-6 overflow-x-auto pb-1">
        <FilterTabs
          tabs={tabs}
          value={filter}
          onChange={(v) => setParams(v === "all" ? {} : { category: v })}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((food) => (
          <FoodCard key={food.id} food={food} onAdd={addItem} />
        ))}

        {visible.length === 0 && (
          <div className="col-span-full rounded-2xl border border-border bg-surface py-12 text-center text-muted">
            <p className="text-base font-medium">{t("noDishesFound")}</p>
          </div>
        )}
      </div>
    </>
  );
}
