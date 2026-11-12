import { useSearchParams } from "react-router-dom";
import { useState } from "react";

import PageHeader from "../../components/layout/PageHeader";
import FilterTabs from "../../components/ui/FilterTabs";
import FoodCard from "../../features/menu/components/FoodCard";
import { CATEGORIES, type Category } from "../../features/menu/types";
import { useCart } from "../../features/cart/useCart";
import { menuItems } from "../../mocks/menu";

type Filter = "all" | Category;

const tabs = [{ value: "all" as Filter, label: "All" }, ...CATEGORIES];

export default function MenuPage() {
  const { addItem } = useCart();
  const [params, setParams] = useSearchParams();

  const raw = params.get("category");
  const filter: Filter = CATEGORIES.some((c) => c.value === raw)
    ? (raw as Category)
    : "all";

  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();

  const visible = menuItems.filter(
    (f) =>
      (filter === "all" || f.category === filter) &&
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