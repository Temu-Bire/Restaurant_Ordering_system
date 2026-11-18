import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import PageHeader from "../../components/layout/PageHeader";
import FoodCard from "../../features/menu/components/FoodCard";
import type { FoodItem } from "../../features/menu/types";
import { useCart } from "../../features/cart/useCart";
import { useAuth } from "../../features/auth/useAuth";
import { listFoods, listCategories, type ApiCategory } from "../../features/menu/menuApi";

export default function HomePage() {
  const { user } = useAuth();
  const { addItem } = useCart();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);

  useEffect(() => {
    listFoods()
      .then((items) =>
        setFoods(
          items.filter((f) => f.isAvailable).map((f) => ({
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

    listCategories().then(setCategories).catch(console.error);
  }, []);

  const popular = foods.slice(0, 4);
  const firstName = user?.name ? user.name.split(" ")[0] : "Friend";

  return (
    <>
      <PageHeader title="Home" description={`Welcome back, ${firstName}`} />

      {/* Hero banner */}
      <section className="relative mb-6 overflow-hidden rounded-xl border border-border bg-surface p-8">
        <div className="relative z-10 max-w-sm">
          <h2 className="text-3xl font-extrabold leading-tight">
            Delicious Food,
            <br />
            Great Experience!
          </h2>
          <p className="mt-2 text-[13px] text-muted">
            Order your favorite meals easily
          </p>
          <Link
            to="/customer/menu"
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Browse Menu →
          </Link>
        </div>
        <div className="absolute -right-16 top-1/2 hidden size-72 -translate-y-1/2 rounded-full bg-gradient-to-br from-red-500 to-amber-300 sm:block" />
      </section>

      {/* Popular dishes */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Popular Dishes</h2>
        <Link to="/customer/menu" className="text-[13px] font-semibold text-primary">
          View All →
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {popular.map((food) => (
          <FoodCard key={food.id} food={food} onAdd={addItem} />
        ))}
      </div>

      {/* Categories */}
      <h2 className="mb-3 text-lg font-bold">Categories</h2>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <Link
            key={c.id}
            to={`/customer/menu?category=${encodeURIComponent(c.name.toLowerCase())}`}
            className="rounded-full border border-border bg-surface px-4 py-1.5 text-[13px] font-medium transition-colors hover:bg-surface-secondary"
          >
            {c.name}
          </Link>
        ))}
      </div>
    </>
  );
}