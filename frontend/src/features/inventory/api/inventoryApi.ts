import { api } from "../../../lib/apiClient";
import type { Ingredient, RecipeLine } from "../types";

export async function listIngredients(): Promise<Ingredient[]> {
  return api.get<Ingredient[]>("/inventory");
}

export async function updateStock(id: string, stock: number): Promise<Ingredient> {
  return api.patch<Ingredient>(`/inventory/${id}`, { stock });
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
