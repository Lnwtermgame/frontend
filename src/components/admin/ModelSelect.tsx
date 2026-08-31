"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, ChevronDown, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AIModel } from "@/lib/services/ai-api";

/**
 * Model picker for large gateway catalogs (OmniRoute exposes 2,800+ models —
 * rendering them all in one dropdown freezes the page). Shows the curated
 * `auto/*` combos by default and reveals the rest through search; only the
 * visible slice is ever mounted in the DOM.
 */

const CURATED_PREFIX = "auto/";
const VISIBLE_CAP = 120;

interface ModelSelectProps {
  models: AIModel[];
  value: string;
  onValueChange: (id: string) => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function ModelSelect({
  models,
  value,
  onValueChange,
  disabled,
  loading,
  className,
}: ModelSelectProps) {
  const t = useTranslations("Admin");
  const [query, setQuery] = useState("");

  const { visible, total } = useMemo(() => {
    const sorted = [...models].sort((a, b) => {
      const aAuto = a.id.startsWith(CURATED_PREFIX) ? 0 : 1;
      const bAuto = b.id.startsWith(CURATED_PREFIX) ? 0 : 1;
      return aAuto - bAuto || a.id.localeCompare(b.id);
    });
    const q = query.trim().toLowerCase();
    const matched = q
      ? sorted.filter((m) => m.id.toLowerCase().includes(q))
      : sorted.filter((m) => m.id.startsWith(CURATED_PREFIX));
    const capped = matched.slice(0, VISIBLE_CAP);
    // Always keep the current selection visible
    if (value && !capped.some((m) => m.id === value)) {
      const current = models.find((m) => m.id === value);
      if (current) capped.unshift(current);
    }
    return { visible: capped, total: models.length };
  }, [models, query, value]);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={cn("w-full", className)} aria-label="AI Model">
        <SelectValue placeholder={loading ? t("ai.loading_models") : t("ai.select_model")} />
        <ChevronDown className="h-4 w-4 opacity-50" />
      </SelectTrigger>
      <SelectContent>
        <div className="sticky top-0 z-10 bg-popover p-2 border-b border-border-soft">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-site-dim pointer-events-none"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                // Keep typing in the search box; Escape still closes via Radix
                if (e.key !== "Escape") e.stopPropagation();
              }}
              placeholder={t("ai.search_models")}
              className="w-full h-8 pl-7 pr-2 bg-background border border-input rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
            />
          </div>
          <p className="text-[10px] text-site-dim mt-1.5 px-0.5">
            {t("ai.model_count", {
              visible: visible.length,
              total,
            })}
          </p>
        </div>
        <div className="max-h-[320px] overflow-y-auto">
          {visible.length === 0 ? (
            <p className="py-4 text-center text-xs text-site-dim">
              {t("ai.no_models")}
            </p>
          ) : (
            visible.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                <span className="flex items-center gap-2 text-xs">
                  {m.id === value && <Check size={12} className="text-site-accent" />}
                  <span className="truncate">{m.name || m.id}</span>
                </span>
              </SelectItem>
            ))
          )}
        </div>
      </SelectContent>
    </Select>
  );
}
