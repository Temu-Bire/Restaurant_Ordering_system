import type { FoodItem } from "../features/menu/types";

export const menuItems: FoodItem[] = [
  { id: "1", name: "Margherita Pizza", price: 12.99, category: "pizza", gradient: "from-red-500 to-orange-300", available: true },
  { id: "2", name: "Pepperoni Pizza", price: 14.99, category: "pizza", gradient: "from-red-700 to-orange-500", available: true },
  { id: "3", name: "Chicken Burger", price: 8.99, category: "burger", gradient: "from-amber-700 to-lime-600", available: true },
  { id: "4", name: "Caesar Salad", price: 7.99, category: "salad", gradient: "from-green-600 to-lime-300", available: true },
  { id: "5", name: "French Fries", price: 3.99, category: "sides", gradient: "from-yellow-400 to-yellow-200", available: true },
  { id: "6", name: "Iced Coffee", price: 3.99, category: "drinks", gradient: "from-amber-900 to-amber-500", available: true },
  { id: "7", name: "Chocolate Cake", price: 5.99, category: "desserts", gradient: "from-stone-900 to-amber-700", available: false },
  { id: "8", name: "Orange Juice", price: 3.49, category: "drinks", gradient: "from-orange-500 to-amber-300", available: true },
];