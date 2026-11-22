import { useState, useEffect } from "react";
import { X, CheckCircle, XCircle } from "lucide-react";
import Input from "../../../shared/components/ui/Input";
import FilterTabs from "../../../shared/components/ui/FilterTabs";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import {
  listFoods,
  listCategories,
  updateFoodAvailability,
  mapApiFoodToFoodItem,
  type ApiCategory,
} from "../api/menuApi";
import type { FoodItem } from "../types";
import { cn } from "../../../lib/cn";

interface StaffAvailabilityControlsProps {
  compact?: boolean;
}

export default function StaffAvailabilityControls({ compact = false }: StaffAvailabilityControlsProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [filter, setFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available" | "unavailable">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      const [foods, cats] = await Promise.all([listFoods(), listCategories()]);
      setItems(foods.map(mapApiFoodToFoodItem));
      setCategories(cats);
    } catch (err) {
      console.error("Failed to load menu items", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function toggleAvailability(food: FoodItem) {
    const next = !food.available;
    setUpdatingId(food.id);
    // Optimistic update
    setItems((prev) =>
      prev.map((item) => (item.id === food.id ? { ...item, available: next } : item))
    );

    try {
      await updateFoodAvailability(food.id, next);
      setBanner(`"${food.name}" is now marked as ${next ? "Available" : "Unavailable"}.`);
      setTimeout(() => setBanner(null), 3000);
    } catch (err) {
      // Revert on error
      setItems((prev) =>
        prev.map((item) => (item.id === food.id ? { ...item, available: !next } : item))
      );
      setBanner(err instanceof Error ? err.message : "Failed to update availability");
    } finally {
      setUpdatingId(null);
    }
  }

  const categoryTabs = [
    { value: "all", label: "All Categories" },
    ...categories.map((c) => ({ value: c.name.toLowerCase(), label: c.name })),
  ];

  const q = search.trim().toLowerCase();
  const visible = items.filter((f) => {
    const matchesCategory = filter === "all" || f.category === filter;
    const matchesAvailability =
      availabilityFilter === "all" ||
      (availabilityFilter === "available" && f.available) ||
      (availabilityFilter === "unavailable" && !f.available);
    const matchesSearch = f.name.toLowerCase().includes(q);
    return matchesCategory && matchesAvailability && matchesSearch;
  });

  const availableCount = items.filter((f) => f.available).length;
  const unavailableCount = items.length - availableCount;

  return (
    <div className="space-y-4">
      {banner && (
        <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/10 px-4 py-2.5 text-xs font-semibold text-primary">
          <span>{banner}</span>
          <button onClick={() => setBanner(null)} className="hover:opacity-75">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAvailabilityFilter("all")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              availabilityFilter === "all"
                ? "bg-foreground text-background"
                : "bg-surface-secondary text-muted hover:text-foreground"
            )}
          >
            {t("all")} ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setAvailabilityFilter("available")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              availabilityFilter === "available"
                ? "bg-emerald-600 text-white"
                : "bg-surface-secondary text-muted hover:text-foreground"
            )}
          >
            {t("active")} ({availableCount})
          </button>
          <button
            type="button"
            onClick={() => setAvailabilityFilter("unavailable")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              availabilityFilter === "unavailable"
                ? "bg-rose-600 text-white"
                : "bg-surface-secondary text-muted hover:text-foreground"
            )}
          >
            {t("unavailable")} ({unavailableCount})
          </button>
        </div>

        <div className="w-full sm:w-64">
          <Input
            id="staff-food-search"
            label="Search Dishes"
            placeholder="Search dishes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {!compact && (
        <div className="overflow-x-auto pb-1">
          <FilterTabs tabs={categoryTabs} value={filter} onChange={setFilter} />
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-sm text-muted">{t("loading")}</div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface py-10 text-center text-sm text-muted">
          {t("noDishesFound")}
        </div>
      ) : (
        <div className={cn("grid gap-3", compact ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")}>
          {visible.map((f) => {
            const isUpdating = updatingId === f.id;
            return (
              <div
                key={f.id}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-2xl border bg-surface p-3.5 shadow-xs transition-all",
                  f.available ? "border-border" : "border-rose-500/30 bg-rose-500/[0.02]"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-12 shrink-0 rounded-xl overflow-hidden border border-border bg-surface-secondary">
                    <img
                      src={f.imageUrl || "/default-food.png"}
                      alt={f.name}
                      className={cn("size-full object-cover", !f.available && "grayscale opacity-75")}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/default-food.png";
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{f.name}</p>
                    <p className="text-xs text-muted">
                      {formatCurrency(f.price)} · <span className="capitalize">{f.category}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => toggleAvailability(f)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all shadow-xs active:scale-95",
                      f.available
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                        : "bg-rose-500 hover:bg-rose-600 text-white"
                    )}
                    title={f.available ? "Mark as Unavailable" : "Mark as Available"}
                  >
                    {f.available ? (
                      <>
                        <CheckCircle className="size-3" />
                        <span>{t("active")}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="size-3" />
                        <span>{t("unavailable")}</span>
                      </>
                    )}
                  </button>
                  <span className="text-[10px] text-muted">
                    {f.available ? "Click to disable" : "Click to enable"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
