import { cn } from "../../../lib/cn";
import { formatCurrency } from "../../../utils/formatCurrency";
import { useTranslation } from "../../../hooks/useTranslation";
import type { FoodItem } from "../types";

interface FoodCardProps {
  food: FoodItem;
  onAdd: (food: FoodItem) => void;
}

export default function FoodCard({ food, onAdd }: FoodCardProps) {
  const { t } = useTranslation();

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-surface shadow-xs transition-all hover:shadow-sm",
        !food.available && "opacity-60"
      )}
    >
      <div className="relative h-32 sm:h-36 overflow-hidden bg-surface-secondary flex items-center justify-center">
        <img
          src={food.imageUrl || "/default-food.png"}
          alt={food.name}
          className="size-full object-cover transition-transform duration-300 hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/default-food.png";
          }}
        />
        <button
          onClick={() => onAdd(food)}
          disabled={!food.available}
          aria-label={`${t("addToCart")}: ${food.name}`}
          title={t("addToCart")}
          className="absolute bottom-2.5 right-2.5 flex size-8 items-center justify-center rounded-xl bg-primary text-base font-bold text-white shadow-md transition-all hover:bg-primary-hover hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:bg-muted"
        >
          +
        </button>
      </div>

      <div className="p-3.5">
        <h3 className="text-sm font-bold text-foreground line-clamp-1">{food.name}</h3>
        {food.description && (
          <p className="mt-1 text-xs text-muted line-clamp-2">{food.description}</p>
        )}
        <p className="mt-2 text-sm font-bold text-primary">
          {food.available ? formatCurrency(food.price) : t("unavailable")}
        </p>
      </div>
    </article>
  );
}
