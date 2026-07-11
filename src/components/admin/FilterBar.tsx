"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  key: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

interface FilterBarProps {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  filters?: FilterOption[];
  onReset?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export function FilterBar({
  search,
  filters = [],
  onReset,
  actions,
  className,
}: FilterBarProps) {
  const hasActiveReset = !!onReset;

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row gap-3 md:items-center md:justify-between p-4 bg-site-surface border border-site-border-soft rounded-12",
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row gap-3 flex-1 min-w-0">
        {search && (
          <div className="relative flex-1 min-w-0 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-site-dim pointer-events-none" />
            <input
              type="text"
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              placeholder={search.placeholder ?? "ค้นหา..."}
              className="w-full h-9 pl-9 pr-3 bg-site-raised border border-site-border rounded-lg text-sm text-site-text placeholder:text-site-dim focus:outline-none focus:border-site-accent transition-colors"
            />
          </div>
        )}
        {filters.map((f) => (
          <select
            key={f.key}
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            className="h-9 px-3 bg-site-raised border border-site-border rounded-lg text-sm font-medium text-site-text focus:outline-none focus:border-site-accent transition-colors cursor-pointer"
          >
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ))}
        {hasActiveReset && (
          <button
            onClick={onReset}
            className="h-9 px-3 inline-flex items-center gap-1.5 text-xs font-medium text-site-muted hover:text-site-text border border-site-border rounded-lg hover:bg-site-raised transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            ล้างตัวกรอง
          </button>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
