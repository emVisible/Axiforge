import type { ReactNode } from "react";

import EmptyState from "./EmptyState";
import { cn } from "./formStyles";
import LoadingSpinner from "./LoadingSpinner";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  emptyTitle = "暂无数据",
  emptyDescription,
  className = "",
}: DataTableProps<T>) {
  if (loading) return <LoadingSpinner />;
  if (!rows.length) {
    return (
      <div className={cn("rounded-2xl border border-border bg-surface", className)}>
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm",
        className,
      )}
    >
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-xs text-ink-muted">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn("px-4 py-3 font-medium", col.headerClassName)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-b border-border/60 transition-colors last:border-0 hover:bg-canvas/60"
            >
              {columns.map((col) => (
                <td key={col.key} className={cn("px-4 py-3 align-middle", col.className)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
