import { cn } from "../../../lib/cn";
import { isLow, type Ingredient } from "../types";

export default function StockBar({ ingredient }: { ingredient: Ingredient }) {
  const { stock, minimum } = ingredient;
  const percent =
    minimum > 0 ? Math.min(100, (stock / (minimum * 3)) * 100) : 100;

  return (
    <div
      role="img"
      aria-label={`${stock} kg in stock, minimum ${minimum} kg`}
      className="h-1.5 w-32 overflow-hidden rounded-full bg-surface-secondary"
    >
      <div
        className={cn(
          "h-full rounded-full",
          isLow(ingredient) ? "bg-danger" : "bg-primary"
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}