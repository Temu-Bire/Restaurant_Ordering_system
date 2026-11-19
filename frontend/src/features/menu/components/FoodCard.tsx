import { useState } from "react";
import { cn } from "../../../lib/cn";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import type { FoodItem } from "../types";

interface FoodCardProps {
  food: FoodItem;
  onAdd: (food: FoodItem) => void;
  onViewDetails?: (food: FoodItem) => void;
}

export default function FoodCard({ food, onAdd, onViewDetails }: FoodCardProps) {
  const { t } = useTranslation();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAdd(food);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <article
      className={cn(
        "group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md",
        !food.available && "opacity-60"
      )}
    >
      {/* Food Image */}
      <div
        className="relative h-40 sm:h-44 w-full overflow-hidden bg-surface-secondary flex items-center justify-center cursor-pointer"
        onClick={() => onViewDetails && onViewDetails(food)}
      >
        <img
          src={food.imageUrl || "/default-food.png"}
          alt={food.name}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/default-food.png";
          }}
        />
        {food.category && (
          <div className="absolute top-2.5 left-2.5 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs capitalize">
            {food.category}
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 flex flex-1 flex-col justify-between">
        <h3
          onClick={() => onViewDetails && onViewDetails(food)}
          className="text-sm sm:text-base font-bold text-foreground line-clamp-1 cursor-pointer hover:text-orange-500 transition-colors"
        >
          {food.name}
        </h3>

        <div className="mt-4 pt-3 space-y-2 border-t border-border/60">
          {/* Full-width Add to Cart button */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={!food.available}
            aria-label={`${t("addToCart")}: ${food.name}`}
            className="w-full flex items-center justify-center gap-1.5 rounded-full bg-orange-500 hover:bg-orange-600 disabled:bg-muted py-2 text-xs font-bold text-white shadow-xs transition-all active:scale-95"
          >
            {added ? (
              <>
                <span>✓</span>
                <span>Added to Cart</span>
              </>
            ) : (
              <>
                <span>+</span>
                <span>{t("addToCart")}</span>
              </>
            )}
          </button>

          {/* Row below Add to Cart: Price on left, View Details on right */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm sm:text-base font-black text-orange-500">
              {food.available ? formatCurrency(food.price) : t("unavailable")}
            </span>

            {onViewDetails && (
              <button
                type="button"
                onClick={() => onViewDetails(food)}
                className="rounded-full border border-border bg-surface-secondary px-3 py-1 text-[11px] font-semibold text-foreground hover:border-orange-500 hover:text-orange-500 transition-colors"
              >
                {t("viewDetails")}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
