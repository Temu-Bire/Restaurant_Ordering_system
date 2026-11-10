import { cn } from "../../../lib/cn";
import { TABLE_STATUS_LABEL, type RestaurantTable, type TableStatus } from "../types";

const tones: Record<TableStatus, string> = {
  free: "border-success/30 bg-success/10 text-success",
  occupied: "border-danger/30 bg-danger/10 text-danger",
  reserved: "border-pending/30 bg-pending/10 text-pending",
};

interface TableTileProps {
  table: RestaurantTable;
  detailed?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function TableTile({
  table,
  detailed = false,
  onEdit,
  onDelete,
}: TableTileProps) {
  return (
    <div className={cn("rounded-xl border px-3 py-4 text-center", tones[table.status])}>
      <p className="text-lg font-bold">{table.name}</p>
      <p className="text-xs">
        {detailed && `${table.seats} seats · `}
        {TABLE_STATUS_LABEL[table.status]}
      </p>

      {(onEdit || onDelete) && (
        <div className="mt-2 flex justify-center gap-4 text-xs text-muted">
          {onEdit && (
            <button onClick={onEdit} className="hover:text-foreground">
              ✎ Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              aria-label={`Delete ${table.name}`}
              className="hover:text-danger"
            >
              🗑
            </button>
          )}
        </div>
      )}
    </div>
  );
}