import type { Ingredient, RecipeLine } from "../features/inventory/types";

export const ingredients: Ingredient[] = [
  { id: "tomato", name: "Tomato", stock: 4, minimum: 5 },
  { id: "cheese", name: "Cheese", stock: 2, minimum: 2 },
  { id: "chicken", name: "Chicken", stock: 3, minimum: 3 },
  { id: "flour", name: "Flour", stock: 25, minimum: 10 },
  { id: "lettuce", name: "Lettuce", stock: 9, minimum: 4 },
  { id: "potatoes", name: "Potatoes", stock: 30, minimum: 10 },
];

// Keyed by food id from mocks/menu.ts ("1" = Margherita Pizza)
export const recipes: Record<string, RecipeLine[]> = {
  "1": [
    { ingredientId: "flour", quantity: 0.25 },
    { ingredientId: "tomato", quantity: 0.1 },
    { ingredientId: "cheese", quantity: 0.15 },
  ],
};