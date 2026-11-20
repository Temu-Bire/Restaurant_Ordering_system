import { api } from "../../../lib/apiClient";
import type {
  CreateInventoryItemInput,
  Ingredient,
  RecipeLine,
  StockMovement,
} from "../types";

export async function listIngredients(params?: {
  search?: string;
  category?: string;
  stockStatus?: string;
  status?: string;
}): Promise<Ingredient[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.category) query.set("category", params.category);
  if (params?.stockStatus) query.set("stockStatus", params.stockStatus);
  if (params?.status) query.set("status", params.status);

  const qs = query.toString();
  return api.get<Ingredient[]>(`/inventory${qs ? `?${qs}` : ""}`);
}

export async function getIngredient(id: string): Promise<Ingredient> {
  return api.get<Ingredient>(`/inventory/${id}`);
}

export async function createIngredient(
  data: CreateInventoryItemInput
): Promise<Ingredient> {
  return api.post<Ingredient>("/inventory", data);
}

export async function updateIngredient(
  id: string,
  data: Partial<CreateInventoryItemInput>
): Promise<Ingredient> {
  return api.patch<Ingredient>(`/inventory/${id}`, data);
}

export async function deleteIngredient(id: string): Promise<void> {
  await api.delete(`/inventory/${id}`);
}

export async function toggleIngredientStatus(id: string): Promise<Ingredient> {
  return api.patch<Ingredient>(`/inventory/${id}/status`, {});
}

export async function receiveStock(
  id: string,
  data: { quantity: number; costPerUnit?: number; notes?: string }
): Promise<Ingredient> {
  return api.post<Ingredient>(`/inventory/${id}/receive`, data);
}

export async function recordWaste(
  id: string,
  data: { quantity: number; reason: string; notes?: string }
): Promise<Ingredient> {
  return api.post<Ingredient>(`/inventory/${id}/waste`, data);
}

export async function stockCount(
  id: string,
  data: { countedStock: number; notes?: string }
): Promise<Ingredient> {
  return api.post<Ingredient>(`/inventory/${id}/count`, data);
}

export async function manualAdjustment(
  id: string,
  data: { newStock: number; reason: string }
): Promise<Ingredient> {
  return api.post<Ingredient>(`/inventory/${id}/adjust`, data);
}

export async function listStockMovements(params?: {
  ingredientId?: string;
  type?: string;
  limit?: number;
}): Promise<StockMovement[]> {
  const query = new URLSearchParams();
  if (params?.ingredientId) query.set("ingredientId", params.ingredientId);
  if (params?.type) query.set("type", params.type);
  if (params?.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  return api.get<StockMovement[]>(`/inventory/movements${qs ? `?${qs}` : ""}`);
}

// Backwards-compatible alias
export async function updateStock(id: string, stock: number): Promise<Ingredient> {
  return manualAdjustment(id, { newStock: stock, reason: "Stock update" });
}

export async function listRecipes(): Promise<Record<string, RecipeLine[]>> {
  return api.get<Record<string, RecipeLine[]>>("/inventory/recipes");
}

export async function saveRecipe(
  foodId: string,
  lines: RecipeLine[]
): Promise<{ foodId: string; lines: RecipeLine[] }> {
  return api.put<{ foodId: string; lines: RecipeLine[] }>(
    `/inventory/recipes/${foodId}`,
    { lines }
  );
}
