import { createContext, useState, type ReactNode } from "react";
import type { FoodItem } from "../menu/types";

export interface CartItem extends FoodItem {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (food: FoodItem) => void;
  increase: (id: string) => void;
  decrease: (id: string) => void;
  removeItem: (id: string) => void;
  clear: () => void;
}

export const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (food: FoodItem) =>
    setItems((prev) => {
      const existing = prev.find((i) => i.id === food.id);
      if (existing) {
        return prev.map((i) =>
          i.id === food.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...food, quantity: 1 }];
    });

  const increase = (id: string) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: i.quantity + 1 } : i))
    );

  // Going below 1 removes the item
  const decrease = (id: string) =>
    setItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const clear = () => setItems([]);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, count, subtotal, addItem, increase, decrease, removeItem, clear }}
    >
      {children}
    </CartContext.Provider>
  );
}