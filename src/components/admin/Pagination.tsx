"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: PaginationProps) {
  const t = useTranslations("Admin");
  const canPrev = page > 1;
  const canNext = page < totalPages;

  if (total === 0) {
    return (
      <div className="px-4 py-3 border-t border-site-border-soft text-xs text-site-dim">
        {t("pagination.empty")}
      </div>
    );
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="px-4 py-3 border-t border-site-border-soft flex flex-col sm:flex-row gap-2 justify-between items-center">
      <div className="text-xs text-site-muted">
        {t("pagination.showing", { start, end, total })}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => canPrev && onPageChange(page - 1)}
          disabled={!canPrev}
          className="p-1.5 rounded-lg border border-site-border bg-site-surface text-site-muted hover:bg-site-raised hover:text-site-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label={t("pagination.prev")}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-site-accent text-site-bg min-w-[32px] text-center">
          {page}
        </span>
        <span className="text-xs text-site-dim px-1">/ {totalPages}</span>
        <button
          onClick={() => canNext && onPageChange(page + 1)}
          disabled={!canNext}
          className="p-1.5 rounded-lg border border-site-border bg-site-surface text-site-muted hover:bg-site-raised hover:text-site-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label={t("pagination.next")}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
