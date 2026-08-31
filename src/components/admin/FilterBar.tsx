"use client";

import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const t = useTranslations("Admin");
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
            <Input
              size="sm"
              type="text"
              icon={<Search className="h-4 w-4" />}
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              placeholder={search.placeholder ?? t("actions.search")}
              className="h-9 bg-site-raised border-site-border text-site-text placeholder:text-site-dim focus-visible:outline-none focus-visible:ring-0 focus-visible:border-site-accent/60"
            />
          </div>
        )}
        {filters.map((f) => (
          <Select
            key={f.key}
            value={f.value}
            onValueChange={(value) => f.onChange(value)}
          >
            <SelectTrigger className="h-9 w-full sm:w-auto sm:min-w-[9rem] bg-site-raised border-site-border rounded-lg text-sm font-medium text-site-text focus:outline-none focus:ring-0 focus-visible:border-site-accent/60 cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-site-surface border-site-border">
              {f.options.map((o) => (
                <SelectItem
                  key={o.value}
                  value={o.value}
                  className="text-sm text-site-text focus:bg-site-raised focus:text-site-text"
                >
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        {hasActiveReset && (
          <button
            onClick={onReset}
            className="h-9 px-3 inline-flex items-center gap-1.5 text-xs font-medium text-site-muted hover:text-site-text border border-site-border rounded-lg hover:bg-site-raised transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            {t("actions.clear_filters")}
          </button>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
