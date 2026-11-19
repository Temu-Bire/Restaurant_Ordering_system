import { api } from "../../../lib/apiClient";
import type { RestaurantTable } from "../types";

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

export async function createTable(
  input: { name: string; seats: number } | string,
  seatsArg?: number
): Promise<RestaurantTable> {
  const payload = typeof input === "string" ? { name: input, seats: seatsArg ?? 4 } : input;
  const raw = await api.post<{ id: string; name: string; seats: number; status: string }>("/tables", payload);
  return mapTable(raw);
}

export async function updateTable(
  id: string,
  input: { name: string; seats?: number } | string,
  seatsArg?: number
): Promise<RestaurantTable> {
  const payload = typeof input === "string" ? { name: input, seats: seatsArg } : input;
  const raw = await api.patch<{ id: string; name: string; seats: number; status: string }>(`/tables/${id}`, payload);
  return mapTable(raw);
}

export async function deleteTable(id: string): Promise<void> {
  await api.delete(`/tables/${id}`);
}
