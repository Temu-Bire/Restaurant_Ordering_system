import { useState } from "react";
import { Check, Plus } from "lucide-react";
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
    if (!food.available) return;
    onAdd(food);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <article
      className={cn(
        "group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md",
        !food.available && "opacity-80 border-border/60"
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
          className={cn(
            "size-full object-cover transition-transform duration-300 group-hover:scale-105",
            !food.available && "grayscale"
          )}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/default-food.png";
          }}
        />

        {food.category && (
          <div className="absolute top-2.5 left-2.5 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs capitalize">
            {food.category}
          </div>
        )}

        <div className="absolute top-2.5 right-2.5">
          {food.available ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
              <span className="size-1.5 rounded-full bg-white" />
              {t("active")}
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-rose-600/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
              <span className="size-1.5 rounded-full bg-white" />
              {t("unavailable")}
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex flex-1 flex-col justify-between">
        <div>
          <h3
            onClick={() => onViewDetails && onViewDetails(food)}
            className="text-sm sm:text-base font-bold text-foreground line-clamp-1 cursor-pointer hover:text-primary transition-colors"
          >
            {food.name}
          </h3>
          {food.description && (
            <p className="mt-1 text-xs text-muted line-clamp-2">
              {food.description}
            </p>
          )}
        </div>

        <div className="mt-4 pt-3 space-y-2 border-t border-border/60">
          {/* Full-width Add to Cart button */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={!food.available}
            aria-label={`${t("addToCart")}: ${food.name}`}
            className={cn(
              "w-full flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold shadow-xs transition-all",
              food.available
                ? "bg-primary hover:bg-primary-hover text-white active:scale-95 cursor-pointer"
                : "bg-surface-secondary text-muted border border-border cursor-not-allowed opacity-80"
            )}
          >
            {added ? (
              <>
                <Check className="size-3.5" />
                <span>{t("addedToCart")}</span>
              </>
            ) : food.available ? (
              <>
                <Plus className="size-3.5" />
                <span>{t("addToCart")}</span>
              </>
            ) : (
              <span>{t("unavailable")}</span>
            )}
          </button>

          {/* Row below Add to Cart: Price on left, View Details on right */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm sm:text-base font-black text-foreground">
              {formatCurrency(food.price)}
            </span>

            {onViewDetails && (
              <button
                type="button"
                onClick={() => onViewDetails(food)}
                className="rounded-full border border-border bg-surface-secondary px-3 py-1 text-[11px] font-semibold text-foreground hover:border-primary hover:text-primary transition-colors"
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
