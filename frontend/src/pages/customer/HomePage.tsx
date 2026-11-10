import { Link } from "react-router-dom";

import PageHeader from "../../components/layout/PageHeader";
import FoodCard from "../../features/menu/components/FoodCard";
import { CATEGORIES } from "../../features/menu/types";
import { useCart } from "../../features/cart/useCart";
import { menuItems } from "../../mocks/menu";

export default function HomePage() {
  const { addItem } = useCart();
  const popular = menuItems.slice(0, 4);

  return (
    <>
      <PageHeader title="Home" description="Welcome back, John" />

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
        {CATEGORIES.map((c) => (
          <Link
            key={c.value}
            to={`/customer/menu?category=${c.value}`}
            className="rounded-full border border-border bg-surface px-4 py-1.5 text-[13px] font-medium transition-colors hover:bg-surface-secondary"
          >
            {c.label}
          </Link>
        ))}
      </div>
    </>
  );
}