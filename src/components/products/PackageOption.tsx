"use client";

import { Check, Flame } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export interface PackageOptionData {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  isPopular?: boolean;
}

/**
 * One selectable package — a slim SEAGM-style row: selection box, name,
 * then struck-through original + accent price on the right. A real
 * <button> with radio semantics so the purchase path stays keyboard-
 * accessible.
 */
export function PackageOption({
  option,
  selected,
  onSelect,
  popularLabel,
  soldOut,
  soldOutLabel,
  size = "lg",
}: {
  option: PackageOptionData;
  selected: boolean;
  onSelect: (id: string) => void;
  popularLabel: string;
  soldOut?: boolean;
  soldOutLabel?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizing = {
    sm: "px-3 py-2 gap-2.5",
    md: "px-3.5 py-2.5 gap-3",
    lg: "px-3.5 py-2.5 md:px-4 md:py-3 gap-3",
  }[size];

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-disabled={soldOut || undefined}
      onClick={() => {
        if (!soldOut) onSelect(option.id);
      }}
      className={`relative border ${sizing} transition-colors flex items-center rounded-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent/60 ${
        soldOut
          ? "opacity-50 cursor-not-allowed bg-site-surface border-site-border-soft"
          : selected
            ? "bg-site-accent/10 border-site-accent cursor-pointer"
            : "bg-site-raised/60 border-site-border-soft hover:border-site-border cursor-pointer"
      }`}
    >
      {/* Selection box */}
      <span
        aria-hidden="true"
        className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-4 border transition-colors ${
          selected
            ? "bg-site-accent border-site-accent"
            : "bg-site-deep border-site-border"
        }`}
      >
        {selected && (
          <Check size={12} strokeWidth={3} className="text-site-bg" />
        )}
      </span>

      {/* Name */}
      <h4
        className={`flex-1 min-w-0 text-left truncate text-[13px] leading-snug ${
          soldOut ? "text-site-muted line-through" : "text-site-text font-medium"
        }`}
      >
        {option.title}
      </h4>

      {/* Compact inline badges */}
      {soldOut ? (
        <Badge variant="neutral" className="flex-shrink-0">
          {soldOutLabel}
        </Badge>
      ) : (
        option.isPopular && (
          <Badge variant="danger" className="flex-shrink-0 gap-1 text-[9px]">
            <Flame size={10} className="fill-current" />
            {popularLabel}
          </Badge>
        )
      )}

      {/* Prices — original struck through, current in accent */}
      <div className="flex items-baseline justify-end gap-2 flex-shrink-0 tabular-nums ml-1">
        {option.originalPrice > option.price && (
          <span className="line-through text-site-dim text-[11px]">
            ฿{Number(option.originalPrice || 0).toFixed(2)}
          </span>
        )}
        <span
          className={`font-bold text-sm ${
            soldOut ? "text-site-muted" : "text-site-accent"
          }`}
        >
          ฿{Number(option.price || 0).toFixed(2)}
        </span>
      </div>
    </button>
  );
}
