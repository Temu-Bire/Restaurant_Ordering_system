import { api } from "../../lib/apiClient";
import type { RestaurantTable } from "../../features/tables/types";

function mapTable(raw: { id: string; name: string; seats: number; status: string }): RestaurantTable {
  return {
    id: raw.id,
    name: raw.name,
    seats: raw.seats,
    status: raw.status.toLowerCase() as RestaurantTable["status"],
  };
}

export async function listTables(): Promise<RestaurantTable[]> {
  const raw = await api.get<{ id: string; name: string; seats: number; status: string }[]>("/tables");
  return raw.map(mapTable);
}

export async function createTable(name: string, seats: number): Promise<RestaurantTable> {
  const raw = await api.post<{ id: string; name: string; seats: number; status: string }>("/tables", { name, seats });
  return mapTable(raw);
}

export async function updateTable(id: string, name: string, seats: number): Promise<RestaurantTable> {
  const raw = await api.patch<{ id: string; name: string; seats: number; status: string }>(`/tables/${id}`, { name, seats });
  return mapTable(raw);
}

export async function deleteTable(id: string): Promise<void> {
  await api.delete(`/tables/${id}`);
}
