import { type DishItem } from "./landingData";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import { useTranslation } from "../../../shared/hooks/useTranslation";

interface PopularDishesSectionProps {
  dishes: DishItem[];
  addedIds: Record<string, boolean>;
  onSelectDish: (dish: DishItem) => void;
  onAddToCart: (dish: DishItem) => void;
  onSeeFullMenu: () => void;
}

export default function PopularDishesSection({
  dishes,
  addedIds,
  onSelectDish,
  onAddToCart,
  onSeeFullMenu,
}: PopularDishesSectionProps) {
  const { t } = useTranslation();

  return (
    <section id="menu" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className="h-0.5 w-10 sm:w-16 bg-orange-500/70 rounded-full" />
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {t("popularDishes")}
          </h2>
          <div className="h-0.5 w-10 sm:w-16 bg-orange-500/70 rounded-full" />
        </div>
        <p className="text-sm text-muted">
          {t("popularSubtitle")}
        </p>
      </div>

      {/* Signature Dishes Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {dishes.map((dish) => {
          const isAdded = addedIds[dish.id];

          return (
            <article
              key={dish.id}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg"
            >
              {/* Dish Image */}
              <div
                className="relative h-44 w-full overflow-hidden bg-stone-100 dark:bg-stone-800 cursor-pointer"
                onClick={() => onSelectDish(dish)}
              >
                <img
                  src={dish.imageUrl}
                  alt={dish.name}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-108"
                />
                <div className="absolute top-2.5 left-2.5 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                  {dish.subtitle}
                </div>
              </div>

              {/* Dish Info & Actions */}
              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <h3
                    onClick={() => onSelectDish(dish)}
                    className="text-base font-bold text-foreground cursor-pointer hover:text-orange-500 transition-colors line-clamp-1"
                  >
                    {dish.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-orange-500/90 font-medium">
                    {dish.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-3 space-y-2.5 border-t border-border/60">
                  {/* Full-width Add to Cart button */}
                  <button
                    type="button"
                    onClick={() => onAddToCart(dish)}
                    className={`w-full flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-bold text-white transition-all active:scale-95 shadow-xs ${
                      isAdded
                        ? "bg-green-600 scale-[1.02]"
                        : "bg-orange-500 hover:bg-orange-600"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <span>✓</span>
                        <span>Added to Cart</span>
                      </>
                    ) : (
                      <>
                        <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>

                  {/* Price & View Details */}
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-base font-black text-orange-500">
                      {formatCurrency(dish.price)}
                    </span>

                    <button
                      type="button"
                      onClick={() => onSelectDish(dish)}
                      className="rounded-full border border-border bg-surface-secondary px-3.5 py-1 text-xs font-semibold text-foreground hover:border-orange-500 hover:text-orange-500 transition-colors"
                    >
                      {t("viewDetails")}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* View Full Menu Button */}
      <div className="mt-12 text-center">
        <button
          type="button"
          onClick={onSeeFullMenu}
          className="inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-orange-500/10 px-8 py-3 text-sm font-bold text-orange-500 transition-all hover:bg-orange-500 hover:text-white"
        >
          <span>{t("seeFullMenu")}</span>
          <span>→</span>
        </button>
      </div>
    </section>
  );
}
