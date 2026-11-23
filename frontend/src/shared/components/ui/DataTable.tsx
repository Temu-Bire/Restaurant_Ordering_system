import type { ReactNode } from "react";
import { cn } from "../../../lib/cn";

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  getRowKey: (row: T) => string | number;
  emptyMessage?: string;
  minWidth?: string;
  loading?: boolean;
}

export default function DataTable<T>({
  columns,
  data,
  getRowKey,
  emptyMessage = "Nothing to show yet.",
  minWidth = "min-w-[600px]",
  loading = false,
}: DataTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-surface [-webkit-overflow-scrolling:touch]">
      <table className={cn("w-full text-left text-[13px]", minWidth)}>
        <thead>
          <tr className="border-b border-border bg-surface-secondary/50">
            {columns.map((col) => (
              <th
                key={col.header}
                className={cn("px-3.5 py-3 font-semibold text-muted text-xs uppercase tracking-wider", col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <tr key={idx} className="animate-pulse">
                {columns.map((_, cIdx) => (
                  <td key={cIdx} className="px-3.5 py-3.5">
                    <div className="h-4 w-3/4 rounded-md bg-muted/20" />
                  </td>
                ))}
              </tr>
            ))
          ) : (
            data.map((row) => (
              <tr
                key={getRowKey(row)}
                className="transition-colors hover:bg-surface-secondary/40"
              >
                {columns.map((col) => (
                  <td key={col.header} className={cn("px-3.5 py-3", col.className)}>
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {!loading && data.length === 0 && (
        <p className="py-10 text-center text-xs font-medium text-muted">{emptyMessage}</p>
      )}
    </div>
  );
}