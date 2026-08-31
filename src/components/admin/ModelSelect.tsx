"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedModelObj = useMemo(
    () => models.find((m) => m.id === value),
    [models, value]
  );
  const displayLabel = selectedModelObj
    ? selectedModelObj.name || selectedModelObj.id
    : value;

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

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setQuery("");
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild disabled={disabled || loading}>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label="AI Model"
          disabled={disabled || loading}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            !displayLabel && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate text-left flex-1">
            {displayLabel ||
              (loading ? t("ai.loading_models") : t("ai.select_model"))}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[280px] p-0 overflow-hidden"
      >
        <div className="bg-popover p-2 border-b border-border-soft">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-site-dim pointer-events-none"
            />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setOpen(false);
                  return;
                }
                // Prevent dropdown menu keyboard navigation from stealing typing events
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
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
        <div className="max-h-[300px] overflow-y-auto p-1">
          {visible.length === 0 ? (
            <p className="py-4 text-center text-xs text-site-dim">
              {t("ai.no_models")}
            </p>
          ) : (
            visible.map((m) => {
              const isSelected = m.id === value;
              return (
                <DropdownMenuItem
                  key={m.id}
                  onSelect={() => {
                    onValueChange(m.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between text-xs py-2 px-2.5 cursor-pointer rounded-sm",
                    isSelected && "bg-accent text-accent-foreground font-medium"
                  )}
                >
                  <span className="truncate mr-2">{m.name || m.id}</span>
                  {isSelected && (
                    <Check size={14} className="text-site-accent shrink-0" />
                  )}
                </DropdownMenuItem>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
