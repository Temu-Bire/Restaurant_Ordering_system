export type TableStatus = "free" | "occupied" | "reserved";

export interface RestaurantTable {
  id: string;
  name: string;
  seats: number;
  status: TableStatus;
}

export const TABLE_STATUS_LABEL: Record<TableStatus, string> = {
  free: "Free",
  occupied: "Occupied",
  reserved: "Reserved",
};