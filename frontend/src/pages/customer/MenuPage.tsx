import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";

import PageHeader from "../../components/layout/PageHeader";
import FilterTabs from "../../components/ui/FilterTabs";
import FoodCard from "../../features/menu/components/FoodCard";
import type { FoodItem } from "../../features/menu/types";
import { useCart } from "../../features/cart/useCart";
import { listFoods, listCategories, type ApiCategory } from "../../features/menu/menuApi";

export default function MenuPage() {
  const { addItem } = useCart();
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);

  useEffect(() => {
    listFoods()
      .then((foods) =>
        setItems(
          foods
            .filter((f) => f.isAvailable)
            .map((f) => ({
              id: f.id,
              name: f.name,
              price: f.price,
              category: f.category.name.toLowerCase(),
              description: f.description,
              gradient: "from-orange-400 to-orange-600",
              available: f.isAvailable,
            }))
        )
      )
      .catch(console.error);

    listCategories()
      .then(setCategories)
      .catch(console.error);
  }, []);

  const tabs = [
    { value: "all", label: "All" },
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
        title="Our Menu"
        description="Choose from our categories"
        search={{ value: search, onChange: setSearch }}
      />

      <div className="mb-5">
        <FilterTabs
          tabs={tabs}
          value={filter}
          onChange={(v) => setParams(v === "all" ? {} : { category: v })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {visible.map((food) => (
          <FoodCard key={food.id} food={food} onAdd={addItem} />
        ))}

        {visible.length === 0 && (
          <p className="py-10 text-center text-muted">No dishes match your search.</p>
        )}
      </div>
    </>
  );
}
