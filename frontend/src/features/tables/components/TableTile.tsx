import { Sparkles, CheckCircle2, Users, Pencil, Trash2 } from "lucide-react";
import { cn } from "../../../lib/cn";
import { TABLE_STATUS_LABEL, type RestaurantTable, type TableStatus } from "../types";

const tones: Record<TableStatus, string> = {
  available: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  free: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  occupied: "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  reserved: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  cleaning: "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

interface TableTileProps {
  table: RestaurantTable;
  detailed?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onChangeStatus?: (newStatus: TableStatus) => void;
}

export default function TableTile({
  table,
  detailed = false,
  onEdit,
  onDelete,
  onChangeStatus,
}: TableTileProps) {
  const normalizedStatus = table.status === "free" ? "available" : table.status;

  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-2xl border px-3 py-4 text-center shadow-xs transition-all",
        tones[table.status] ?? tones.available
      )}
    >
      <div>
        <div className="flex items-center justify-between mb-1">
          {table.section ? (
            <span className="text-[10px] uppercase font-bold text-muted bg-surface/60 px-1.5 py-0.5 rounded">
              {table.section}
            </span>
          ) : (
            <span />
          )}
          <span className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-surface/80 shadow-2xs">
            {TABLE_STATUS_LABEL[table.status] ?? table.status}
          </span>
        </div>

        <p className="text-base sm:text-lg font-bold text-foreground mt-1">{table.name}</p>
        <p className="mt-0.5 text-xs font-semibold text-muted">
          {detailed && `${table.seats} seats`}
        </p>
      </div>

      {/* Staff Status Action Workflow */}
      <div className="mt-3 pt-2 border-t border-border/40 space-y-2">
        {onChangeStatus && (
          <div className="flex flex-col gap-1.5">
            {normalizedStatus === "occupied" && (
              <button
                type="button"
                onClick={() => onChangeStatus("cleaning")}
                className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-1 transition-colors inline-flex items-center justify-center gap-1"
              >
                <Sparkles className="size-3.5" />
                <span>Mark Cleaning</span>
              </button>
            )}

            {normalizedStatus === "cleaning" && (
              <button
                type="button"
                onClick={() => onChangeStatus("available")}
                className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-1 transition-colors inline-flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="size-3.5" />
                <span>Mark Available</span>
              </button>
            )}

            {normalizedStatus === "available" && (
              <button
                type="button"
                onClick={() => onChangeStatus("occupied")}
                className="w-full rounded-lg bg-surface hover:bg-surface-secondary border border-border text-foreground text-[11px] font-bold py-1 transition-colors inline-flex items-center justify-center gap-1"
              >
                <Users className="size-3.5" />
                <span>Seat Guests (Occupied)</span>
              </button>
            )}

            {normalizedStatus === "reserved" && (
              <button
                type="button"
                onClick={() => onChangeStatus("occupied")}
                className="w-full rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold py-1 transition-colors inline-flex items-center justify-center gap-1"
              >
                <Users className="size-3.5" />
                <span>Confirm Seated</span>
              </button>
            )}
          </div>
        )}

        {(onEdit || onDelete) && (
          <div className="flex justify-center gap-3 text-xs text-muted pt-1">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="font-medium hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                <Pencil className="size-3" />
                <span>Edit</span>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                aria-label={`Delete ${table.name}`}
                className="font-medium text-danger hover:opacity-80 transition-colors inline-flex items-center gap-1"
              >
                <Trash2 className="size-3" />
                <span>Delete</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
