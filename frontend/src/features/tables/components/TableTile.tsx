import { cn } from "../../../lib/cn";
import { useTranslation } from "../../../hooks/useTranslation";
import type { RestaurantTable, TableStatus } from "../types";

const tones: Record<TableStatus, string> = {
  free: "border-success/40 bg-success/10 text-success",
  occupied: "border-danger/40 bg-danger/10 text-danger",
  reserved: "border-pending/40 bg-pending/10 text-pending",
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
  const { t } = useTranslation();

  const statusLabel: Record<TableStatus, string> = {
    free: t("free"),
    occupied: t("occupied"),
    reserved: t("reserved"),
  };

  return (
    <div className={cn("rounded-2xl border px-3 py-4 text-center shadow-xs transition-all", tones[table.status])}>
      <p className="text-base sm:text-lg font-bold text-foreground">{table.name}</p>
      <p className="mt-1 text-xs font-medium">
        {detailed && `${table.seats} seats · `}
        {statusLabel[table.status]}
      </p>

      {(onEdit || onDelete) && (
        <div className="mt-3 flex justify-center gap-3 text-xs text-muted border-t border-border/40 pt-2">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="font-medium hover:text-foreground transition-colors"
            >
              ✎ {t("edit")}
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Delete ${table.name}`}
              className="font-medium text-danger hover:opacity-80 transition-colors"
            >
              🗑 {t("delete")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
