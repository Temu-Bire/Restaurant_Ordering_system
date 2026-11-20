import { api } from "../../../lib/apiClient";
import type { RestaurantTable, TableStatus } from "../types";

function mapTable(raw: {
  id: string;
  name: string;
  seats: number;
  status: string;
  section?: string;
  activeOrderId?: string;
}): RestaurantTable {
  return {
    id: raw.id,
    name: raw.name,
    seats: raw.seats,
    status: raw.status.toLowerCase() as RestaurantTable["status"],
    section: raw.section,
    activeOrderId: raw.activeOrderId,
  };
}

export async function listTables(): Promise<RestaurantTable[]> {
  const raw = await api.get<{
    id: string;
    name: string;
    seats: number;
    status: string;
    section?: string;
    activeOrderId?: string;
  }[]>("/tables");
  return raw.map(mapTable);
}

export async function createTable(
  input: { name: string; seats: number; section?: string; status?: TableStatus } | string,
  seatsArg?: number
): Promise<RestaurantTable> {
  const payload =
    typeof input === "string"
      ? { name: input, seats: seatsArg ?? 4 }
      : input;
  const raw = await api.post<{
    id: string;
    name: string;
    seats: number;
    status: string;
    section?: string;
    activeOrderId?: string;
  }>("/tables", payload);
  return mapTable(raw);
}

export async function updateTable(
  id: string,
  input: { name: string; seats?: number; section?: string; status?: TableStatus } | string,
  seatsArg?: number
): Promise<RestaurantTable> {
  const payload =
    typeof input === "string" ? { name: input, seats: seatsArg } : input;
  const raw = await api.patch<{
    id: string;
    name: string;
    seats: number;
    status: string;
    section?: string;
    activeOrderId?: string;
  }>(`/tables/${id}`, payload);
  return mapTable(raw);
}

export async function updateTableStatus(
  id: string,
  status: TableStatus
): Promise<RestaurantTable> {
  const raw = await api.patch<{
    id: string;
    name: string;
    seats: number;
    status: string;
    section?: string;
    activeOrderId?: string;
  }>(`/tables/${id}/status`, { status });
  return mapTable(raw);
}

export async function deleteTable(id: string): Promise<void> {
  await api.delete(`/tables/${id}`);
}
