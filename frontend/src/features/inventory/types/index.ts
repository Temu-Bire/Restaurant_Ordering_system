export type InventoryCategory =
  | "ingredients"
  | "beverages"
  | "dry_goods"
  | "packaging"
  | "supplies";

export type InventoryStatus = "active" | "inactive";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export type MovementType =
  | "RECEIVE"
  | "WASTE"
  | "COUNT"
  | "ADJUSTMENT"
  | "ORDER_CONSUMPTION";

export interface Ingredient {
  id: string;
  name: string;
  category: InventoryCategory;
  sku: string;
  stock: number;
  minimum: number;
  unit: string;
  unitCost: number;
  expiryDate?: string | null;
  storageLocation?: string | null;
  status: InventoryStatus;
  stockStatus: StockStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  ingredientId: string;
  ingredientName: string;
  sku?: string;
  unit: string;
  type: MovementType;
  quantityChanged: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  userName: string;
  userRole: string;
  date: string;
}

export interface RecipeLine {
  ingredientId: string;
  quantity: number; // kg or unit used per dish
}

export interface CreateInventoryItemInput {
  name: string;
  category?: InventoryCategory;
  sku?: string;
  stock?: number;
  minimum?: number;
  unit?: string;
  unitCost?: number;
  expiryDate?: string;
  storageLocation?: string;
  status?: InventoryStatus;
}

export const INVENTORY_CATEGORY_LABEL: Record<InventoryCategory, string> = {
  ingredients: "Ingredients",
  beverages: "Beverages",
  dry_goods: "Dry Goods",
  packaging: "Packaging",
  supplies: "Supplies",
};

export const MOVEMENT_TYPE_LABEL: Record<MovementType, string> = {
  RECEIVE: "Stock Received",
  WASTE: "Waste / Spoilage",
  COUNT: "Physical Count",
  ADJUSTMENT: "Manual Correction",
  ORDER_CONSUMPTION: "Order Prepared",
};

export const isLow = (i: Ingredient) => i.stock <= i.minimum;
