"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useMemo, useState } from "react";

import { BulkActions } from "@/components/admin/bulk-actions";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
};

export function DataTable<T>({
  data,
  columns,
  getRowId,
  loading = false,
  emptyTitle,
  emptyMessage,
  sort,
  order,
  onSort,
  bulkActions = [],
}: {
  data: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  loading?: boolean;
  emptyTitle: string;
  emptyMessage: string;
  sort?: string;
  order?: "asc" | "desc";
  onSort?: (key: string) => void;
  bulkActions?: Array<{
    label: string;
    onClick: (ids: string[]) => void;
    disabled?: boolean;
  }>;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const rowIds = useMemo(() => data.map((row) => getRowId(row)), [data, getRowId]);
  const visibleSelectedIds = useMemo(
    () => selectedIds.filter((id) => rowIds.includes(id)),
    [rowIds, selectedIds],
  );

  const allSelected = useMemo(
    () => Boolean(rowIds.length) && rowIds.every((id) => visibleSelectedIds.includes(id)),
    [rowIds, visibleSelectedIds],
  );

  if (loading) {
    return (
      <div className="admin-panel rounded-[24px] overflow-hidden">
        <div className="divide-y divide-black/5 dark:divide-white/8">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="grid grid-cols-4 gap-4 px-4 py-4">
              {Array.from({ length: 4 }).map((__, innerIndex) => (
                <div key={innerIndex} className="h-4 animate-pulse rounded bg-black/5 dark:bg-white/8" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="admin-panel rounded-[24px] px-6 py-12 text-center">
        <h3 className="text-lg font-semibold text-[color:var(--admin-text)]">{emptyTitle}</h3>
        <p className="mt-2 text-sm admin-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <BulkActions
        selectedCount={visibleSelectedIds.length}
        actions={bulkActions.map((action) => ({
          label: action.label,
          disabled: action.disabled,
          onClick: () => action.onClick(visibleSelectedIds),
        }))}
        onClear={() => setSelectedIds([])}
      />
      <div className="admin-panel admin-scrollbar overflow-x-auto rounded-[24px]">
        <table className="min-w-full text-left">
          <thead className="border-b border-black/5 dark:border-white/8">
            <tr>
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(event) => {
                    setSelectedIds((current) => {
                      if (event.target.checked) {
                        const next = new Set(current);
                        rowIds.forEach((id) => next.add(id));
                        return Array.from(next);
                      }

                      return current.filter((id) => !rowIds.includes(id));
                    });
                  }}
                />
              </th>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] admin-muted">
                  {column.sortable && onSort ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 transition hover:text-[color:var(--admin-text)]"
                      onClick={() => onSort(column.key)}
                    >
                      {column.header}
                      {sort === column.key ? (
                        order === "asc" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />
                      ) : null}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/8">
            {data.map((row) => {
              const rowId = getRowId(row);
              return (
                <tr key={rowId} className="transition hover:bg-black/3 dark:hover:bg-white/3">
                  <td className="px-4 py-4 align-top">
                    <input
                      type="checkbox"
                      checked={visibleSelectedIds.includes(rowId)}
                      onChange={(event) => {
                        setSelectedIds((current) =>
                          event.target.checked
                            ? [...current, rowId]
                            : current.filter((item) => item !== rowId),
                        );
                      }}
                    />
                  </td>
                  {columns.map((column) => (
                    <td key={column.key} className={cn("px-4 py-4 align-top text-sm text-[color:var(--admin-text)]", column.className)}>
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
