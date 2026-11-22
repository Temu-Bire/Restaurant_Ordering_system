import { Ingredient, MovementType, Prisma, RecipeLine } from '@prisma/client';
import { toApiInventoryCategory } from '../../common/api-enums.js';
import { calculateStockStatus } from './stock-calculation.helper.js';

export interface InventoryItemResponse {
  id: string;
  name: string;
  category: string;
  sku: string;
  stock: number;
  minimum: number;
  unit: string;
  unitCost: number;
  expiryDate: string | null;
  storageLocation: string | null;
  status: string;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  createdAt: string;
  updatedAt: string;
}

export interface StockMovementResponse {
  id: string;
  ingredientId: string;
  ingredientName: string;
  sku: string | null;
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

export const toInventoryResponse = (item: Ingredient): InventoryItemResponse => {
  const stock = item.stock.toNumber();
  const minimum = item.minimum.toNumber();
  return {
    id: item.id,
    name: item.name,
    category: toApiInventoryCategory(item.category),
    sku: item.sku ?? `ING-${item.id.slice(0, 6).toUpperCase()}`,
    stock,
    minimum,
    unit: item.unit,
    unitCost: item.unitCost.toNumber(),
    expiryDate: item.expiryDate?.toISOString() ?? null,
    storageLocation: item.storageLocation ?? null,
    status: item.status.toLowerCase(),
    stockStatus: calculateStockStatus(stock, minimum),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
};

export type StockMovementWithRelations = {
  id: string;
  ingredientId: string;
  type: MovementType;
  quantityChanged: Prisma.Decimal;
  previousQuantity: Prisma.Decimal;
  newQuantity: Prisma.Decimal;
  reason: string | null;
  createdAt: Date;
  ingredient: {
    id: string;
    name: string;
    unit: string;
    sku: string | null;
  };
  user: {
    id: string;
    fullName: string;
    role: string;
  } | null;
};

export const toStockMovementResponse = (
  m: StockMovementWithRelations,
): StockMovementResponse => ({
  id: m.id,
  ingredientId: m.ingredientId,
  ingredientName: m.ingredient.name,
  sku: m.ingredient.sku,
  unit: m.ingredient.unit,
  type: m.type,
  quantityChanged: m.quantityChanged.toNumber(),
  previousQuantity: m.previousQuantity.toNumber(),
  newQuantity: m.newQuantity.toNumber(),
  reason: m.reason ?? '',
  userName: m.user?.fullName ?? 'System / Automatic Order',
  userRole: m.user?.role?.toLowerCase() ?? 'system',
  date: m.createdAt.toISOString(),
});

export const toRecipeLineResponse = (line: RecipeLine) => ({
  ingredientId: line.ingredientId,
  quantity: line.quantity.toNumber(),
});
