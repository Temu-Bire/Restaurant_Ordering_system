export type TableStatus = "available" | "free" | "occupied" | "reserved" | "cleaning";

export interface RestaurantTable {
  id: string;
  name: string;
  seats: number;
  status: TableStatus;
  section?: string;
  activeOrderId?: string;
}

export const TABLE_STATUS_LABEL: Record<TableStatus, string> = {
  available: "Available",
  free: "Available",
  occupied: "Occupied",
  reserved: "Reserved",
  cleaning: "Cleaning",
};
