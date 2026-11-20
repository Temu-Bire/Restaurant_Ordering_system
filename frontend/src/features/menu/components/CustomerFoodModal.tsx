import Modal from "../../../shared/components/ui/Modal";
import Button from "../../../shared/components/ui/Button";
import Badge from "../../../shared/components/ui/Badge";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import type { FoodItem } from "../types";

interface CustomerFoodModalProps {
  food: FoodItem | null;
  onClose: () => void;
  onAdd: (food: FoodItem) => void;
}

export default function CustomerFoodModal({ food, onClose, onAdd }: CustomerFoodModalProps) {
  if (!food) return null;

  return (
    <Modal open onClose={onClose} title={food.name}>
      <div className="space-y-4">
        {/* Large Food Image */}
        <div className="relative h-56 w-full overflow-hidden rounded-2xl border border-border bg-surface-secondary">
          <img
            src={food.imageUrl || "/default-food.png"}
            alt={food.name}
            className="size-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/default-food.png";
            }}
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur-xs capitalize">
              {food.category}
            </span>
            <Badge variant={food.available ? "active" : "disabled"}>
              {food.available ? "Available" : "Unavailable"}
            </Badge>
          </div>
        </div>

        {/* Dish Info */}
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-foreground">{food.name}</h3>
            <span className="text-xl font-black text-primary">
              {formatCurrency(food.price)}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            {food.description || "Freshly prepared by our culinary team with premium local ingredients."}
          </p>
        </div>

        {/* Availability notice if unavailable */}
        {!food.available && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-semibold text-rose-500">
            ⚠️ This item is currently unavailable and cannot be added to your order.
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            disabled={!food.available}
            onClick={() => {
              onAdd(food);
              onClose();
            }}
          >
            {food.available ? "+ Add to Cart" : "Unavailable"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
