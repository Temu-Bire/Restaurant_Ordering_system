import { cn } from "../../../lib/cn";
import { formatCurrency } from "../../../utils/formatCurrency";
import type { FoodItem } from "../types";

interface FoodCardProps {
  food: FoodItem;
  onAdd: (food: FoodItem) => void;
}

export default function FoodCard({ food, onAdd }: FoodCardProps) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-surface",
        !food.available && "opacity-60"
      )}
    >
      <div className={cn("relative h-28 bg-gradient-to-br", food.gradient)}>
        <button
          onClick={() => onAdd(food)}
          disabled={!food.available}
          aria-label={`Add ${food.name} to cart`}
          className="absolute bottom-2 right-2 flex size-7 items-center justify-center rounded-lg bg-primary font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-muted"
        >
          +
        </button>
      </div>

      <div className="p-3">
        <h3 className="text-[13px] font-bold">{food.name}</h3>
        <p className="mt-0.5 text-[13px] font-bold">
          {food.available ? formatCurrency(food.price) : "Unavailable"}
        </p>
      </div>
    </article>
  );
}