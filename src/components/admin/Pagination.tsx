"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/Button";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

// shadcn button idiom (outline + icon base) rescaled to the compact admin
// pager metrics and pinned to the dark admin tokens.
const NAV_BUTTON = cn(
  buttonVariants({ variant: "outline", size: "icon" }),
  "h-7 w-7 rounded-lg bg-site-surface p-1.5 text-site-muted hover:text-site-text disabled:opacity-40",
);

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
          className={NAV_BUTTON}
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
          className={NAV_BUTTON}
          aria-label={t("pagination.next")}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
