import type { FoodItem } from "../../menu/types";

export interface CartItem extends FoodItem {
  quantity: number;
}

export interface CartContextType {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (food: FoodItem) => void;
  increase: (id: string) => void;
  decrease: (id: string) => void;
  removeItem: (id: string) => void;
  clear: () => void;
}
