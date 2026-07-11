"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pagination } from "./Pagination";
import { EmptyState } from "./EmptyState";
import { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortAccessor?: (row: T) => string | number;
  width?: string;
  align?: "left" | "right" | "center";
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
    pageSize: number;
  };
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  empty?: { icon?: LucideIcon; title: string; description?: string };
}

type SortDir = "asc" | "desc" | null;

const ALIGN: Record<string, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  pagination,
  onPageChange,
  onRowClick,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  empty,
}: DataTableProps<T>) {
  const t = useTranslations("Admin");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortAccessor) return data;
    const accessor = col.sortAccessor;
    return [...data].sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDir, columns]);

  const handleSort = (col: Column<T>) => {
    if (!col.sortable) return;
    if (sortKey !== col.key) {
      setSortKey(col.key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else if (sortDir === "desc") {
      setSortKey(null);
      setSortDir(null);
    } else {
      setSortDir("asc");
    }
  };

  const allSelected = selectable && data.length > 0 && data.every((row) => selectedIds.includes(rowKey(row)));
  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map(rowKey));
    }
  };
  const toggleRow = (id: string) => {
    if (!onSelectionChange) return;
    onSelectionChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id],
    );
  };

  return (
    <div className="bg-site-surface border border-site-border-soft rounded-12 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-site-border-soft">
              {selectable && (
                <th className="px-4 py-2.5 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-site-border"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col)}
                  className={cn(
                    "px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-site-dim select-none",
                    ALIGN[col.align ?? "left"],
                    col.sortable && "cursor-pointer hover:text-site-text",
                    col.width,
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable &&
                      (sortKey === col.key && sortDir === "asc" ? (
                        <ChevronUp className="w-3 h-3 text-site-accent" />
                      ) : sortKey === col.key && sortDir === "desc" ? (
                        <ChevronDown className="w-3 h-3 text-site-accent" />
                      ) : (
                        <ChevronsUpDown className="w-3 h-3 opacity-40" />
                      ))}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-site-border-soft">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="py-12"
                >
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-site-accent animate-spin" />
                  </div>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="py-2"
                >
                  <EmptyState
                    icon={empty?.icon}
                    title={empty?.title ?? t("table.empty")}
                    description={empty?.description}
                  />
                </td>
              </tr>
            ) : (
              sortedData.map((row) => {
                const id = rowKey(row);
                const selected = selectedIds.includes(id);
                return (
                  <tr
                    key={id}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      "text-xs transition-colors",
                      onRowClick && "cursor-pointer",
                      selected ? "bg-site-accent/5" : "hover:bg-site-raised/50",
                    )}
                  >
                    {selectable && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleRow(id)}
                          className="rounded border-site-border"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 py-3 text-site-text",
                          ALIGN[col.align ?? "left"],
                        )}
                      >
                        {col.render ? col.render(row) : String((row as any)[col.key] ?? "")}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {pagination && onPageChange && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          pageSize={pagination.pageSize}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
