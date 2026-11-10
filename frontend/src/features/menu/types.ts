export type Category = string;

export interface FoodItem {
  id: string;
  name: string;
  price: number;
  category: Category;
  description?: string;
  gradient: string; // placeholder for a photo, until real images exist
  available: boolean;
}

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "pizza", label: "Pizza" },
  { value: "burger", label: "Burger" },
  { value: "salad", label: "Salad" },
  { value: "drinks", label: "Drinks" },
  { value: "desserts", label: "Desserts" },
  { value: "sides", label: "Sides" },
];