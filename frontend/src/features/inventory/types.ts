export interface Ingredient {
  id: string;
  name: string;
  stock: number; // in kg
  minimum: number; // in kg
}

export interface RecipeLine {
  ingredientId: string;
  quantity: number; // kg used per dish
}

// Your design marks "2 kg in stock, 2 kg minimum" as Low, so equal counts as low
export const isLow = (i: Ingredient) => i.stock <= i.minimum;