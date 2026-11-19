import { api, API_BASE_URL } from "../../../lib/apiClient";
import { getToken } from "../../../lib/session";

export interface ApiCategory {
  id: string;
  name: string;
}

export interface ApiFood {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  categoryId: string;
  category: ApiCategory;
}

export async function listCategories(): Promise<ApiCategory[]> {
  return api.get<ApiCategory[]>("/categories");
}

export async function createCategory(name: string): Promise<ApiCategory> {
  return api.post<ApiCategory>("/categories", { name });
}

export async function listFoods(): Promise<ApiFood[]> {
  return api.get<ApiFood[]>("/menu");
}

export async function createFood(body: {
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  isAvailable: boolean;
}): Promise<ApiFood> {
  return api.post<ApiFood>("/menu", body);
}

export async function updateFood(
  id: string,
  body: Partial<{
    name: string;
    description: string;
    price: number;
    categoryId: string;
    isAvailable: boolean;
  }>
): Promise<ApiFood> {
  return api.patch<ApiFood>(`/menu/${id}`, body);
}

export async function deleteFood(id: string): Promise<void> {
  await api.delete(`/menu/${id}`);
}

export async function uploadFoodImage(id: string, file: File): Promise<ApiFood> {
  const formData = new FormData();
  formData.append("image", file);
  const token = getToken();
  const res = await fetch(
    `${API_BASE_URL}/menu/${id}/image`,
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }
  );
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message ?? "Image upload failed");
  }
  return res.json() as Promise<ApiFood>;
}

export function mapApiFoodToFoodItem(f: ApiFood): import("../types").FoodItem {
  return {
    id: f.id,
    name: f.name,
    price: f.price,
    category: f.category.name.toLowerCase(),
    description: f.description,
    gradient: "from-orange-400 to-orange-600",
    available: f.isAvailable,
    imageUrl: f.imageUrl ? f.imageUrl.replace(/^http:\/\/localhost:3000/, "") : "/default-food.png",
  };
}
