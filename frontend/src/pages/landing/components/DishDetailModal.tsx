import { useState } from "react";
import { type DishItem } from "./landingData";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import { useTranslation } from "../../../shared/hooks/useTranslation";

interface DishDetailModalProps {
  dish: DishItem | null;
  onClose: () => void;
  onAddToCart: (dish: DishItem, quantity: number) => void;
}

export default function DishDetailModal({
  dish,
  onClose,
  onAddToCart,
}: DishDetailModalProps) {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);

  if (!dish) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 flex size-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xs transition-colors hover:bg-orange-500"
        >
          <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Dish Image */}
        <div className="relative h-60 w-full overflow-hidden bg-stone-900">
          <img
            src={dish.imageUrl}
            alt={dish.name}
            className="size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-6 right-6">
            <span className="rounded-full bg-orange-500/90 px-3 py-1 text-[11px] font-bold text-white uppercase tracking-wider backdrop-blur-xs">
              {dish.subtitle}
            </span>
            <h3 className="mt-1 text-2xl font-black text-white">
              {dish.name}
            </h3>
          </div>
        </div>

        {/* Dish Details */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted leading-relaxed">
            {dish.description}
          </p>

          {/* Ingredients List */}
          {dish.ingredients && dish.ingredients.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                {t("ingredients")}:
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {dish.ingredients.map((ing) => (
                  <span
                    key={ing}
                    className="rounded-lg border border-border bg-surface-secondary px-2.5 py-1 text-xs text-muted"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Price & Quantity & Add to Cart */}
          <div className="pt-2 flex items-center justify-between border-t border-border">
            <div>
              <span className="text-xs text-muted block">Price</span>
              <span className="text-xl font-black text-orange-500">
                {formatCurrency(dish.price * quantity)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Quantity selector */}
              <div className="flex items-center rounded-full border border-border bg-surface-secondary px-2 py-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="size-7 flex items-center justify-center rounded-full text-foreground hover:bg-border text-sm font-bold"
                >
                  −
                </button>
                <span className="w-8 text-center text-xs font-bold text-foreground">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="size-7 flex items-center justify-center rounded-full text-foreground hover:bg-border text-sm font-bold"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  onAddToCart(dish, quantity);
                  onClose();
                }}
                className="rounded-full bg-orange-500 px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-orange-600 active:scale-95"
              >
                {t("addToCart")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
