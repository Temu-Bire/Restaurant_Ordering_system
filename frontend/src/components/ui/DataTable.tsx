import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

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
}

export default function DataTable<T>({
  columns,
  data,
  getRowKey,
  emptyMessage = "Nothing to show yet.",
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.header}
                className={cn("px-3 py-3 font-semibold text-muted", col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row) => (
            <tr
              key={getRowKey(row)}
              className="border-b border-border last:border-0"
            >
              {columns.map((col) => (
                <td key={col.header} className={cn("px-3 py-3", col.className)}>
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {data.length === 0 && (
        <p className="py-10 text-center text-muted">{emptyMessage}</p>
      )}
    </div>
  );
}