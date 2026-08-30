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
 * One selectable package card. A real <button> with radio semantics so the
 * purchase path is keyboard-accessible (the three render sites previously
 * duplicated non-focusable <div onClick> cards).
 */
export function PackageOption({
  option,
  selected,
  onSelect,
  popularLabel,
  soldOut,
  soldOutLabel,
  size = "sm",
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
    sm: {
      card: "p-3 min-h-[90px] gap-1.5",
      title: "text-[12px]",
      price: "text-sm",
      original: "text-[10px]",
      badge: "-top-2.5 text-[9px]",
      check: "bottom-1.5 right-1.5",
    },
    md: {
      card: "p-3 min-h-[100px] gap-1.5",
      title: "text-[12px]",
      price: "text-sm",
      original: "text-[10px]",
      badge: "-top-2.5 text-[9px]",
      check: "bottom-1.5 right-1.5",
    },
    lg: {
      card: "p-3 md:p-4 min-h-[100px] md:min-h-[120px] gap-2",
      title: "text-[13px] md:text-base",
      price: "text-sm md:text-base",
      original: "text-[10px] md:text-xs",
      badge: "-top-3 text-[9px] md:text-[10px]",
      check: "bottom-2 right-2",
    },
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
      className={`relative border ${sizing.card} transition-colors flex flex-col justify-center items-center rounded-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent/60 ${
        soldOut
          ? "opacity-50 cursor-not-allowed bg-site-surface border-site-border-soft"
          : selected
            ? "bg-site-accent/10 border-site-accent cursor-pointer"
            : "bg-site-raised/60 border-site-border-soft hover:border-site-border cursor-pointer"
      }`}
    >
      {soldOut ? (
        <span
          className={`absolute ${sizing.badge} left-0 right-0 flex justify-center z-10`}
        >
          <Badge variant="neutral" className="gap-1">
            {soldOutLabel}
          </Badge>
        </span>
      ) : option.isPopular ? (
        <span
          className={`absolute ${sizing.badge} left-0 right-0 flex justify-center z-10`}
        >
          <Badge variant="danger" className={`gap-1 ${size === "lg" ? "" : "text-[9px]"}`}>
            <Flame size={10} className="fill-current" />
            {popularLabel}
          </Badge>
        </span>
      ) : null}

      <h4
        className={`text-site-text font-semibold text-center leading-tight line-clamp-2 ${sizing.title}`}
      >
        {option.title}
      </h4>

      <div className="text-center tabular-nums">
        {option.originalPrice > option.price ? (
          <div className="flex flex-col items-center">
            <span className={`line-through text-site-dim ${sizing.original}`}>
              ฿{Number(option.originalPrice || 0).toFixed(2)}
            </span>
            <span className={`font-bold text-site-accent ${sizing.price}`}>
              ฿{Number(option.price || 0).toFixed(2)}
            </span>
          </div>
        ) : (
          <span className={`font-bold text-site-accent ${sizing.price}`}>
            ฿{Number(option.price || 0).toFixed(2)}
          </span>
        )}
      </div>

      {selected && (
        <span className={`absolute ${sizing.check} text-site-accent`}>
          <Check size={14} className={size === "lg" ? "md:w-4 md:h-4" : ""} />
        </span>
      )}
    </button>
  );
}
