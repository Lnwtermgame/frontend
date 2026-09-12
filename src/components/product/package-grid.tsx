"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { formatTHB } from "@/lib/pricing";
import type { ProductTypePublic } from "@/lib/api/products";

/**
 * แถวแพ็กเกจแบบ SEAGM (port จาก legacy PackageOption):
 * กล่องเลือกซ้าย · ชื่อแพ็กเกจ · ส่วนลด · ราคาเดิมขีดฆ่า + ราคาขายส้มขวา
 * เรียงเป็นตาราง 2 คอลัมน์บนจอกว้าง
 */
export function PackageGrid({
  types,
  selectedId,
  onSelect,
}: {
  types: ProductTypePublic[];
  selectedId: string | null;
  onSelect: (t: ProductTypePublic) => void;
}) {
  const t = useTranslations("product");
  return (
    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2" role="radiogroup">
      {types.map((type) => {
        const selected = type.id === selectedId;
        const hasDiscount =
          type.originPrice && Math.round(type.originPrice) > Math.round(type.displayPrice);
        const pct = hasDiscount
          ? `-${Math.round((1 - type.displayPrice / type.originPrice!) * 100)}%`
          : null;
        return (
          <button
            key={type.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={!type.hasStock}
            onClick={() => onSelect(type)}
            className={`flex items-center gap-3 rounded-[10px] border px-3.5 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 md:px-4 md:py-3 ${
              !type.hasStock
                ? "border-border/40 bg-muted/30"
                : selected
                  ? "border-primary bg-primary/10"
                  : "border-border/60 bg-muted/20 hover:border-border"
            }`}
          >
            {/* กล่องเลือก */}
            <span
              aria-hidden
              className={`flex size-[18px] shrink-0 items-center justify-center rounded border transition-colors ${
                selected ? "border-primary bg-primary" : "border-border bg-background/60"
              }`}
            >
              {selected ? <Check size={12} strokeWidth={3} className="text-primary-foreground" /> : null}
            </span>

            {/* ชื่อแพ็กเกจ */}
            <span
              className={`min-w-0 flex-1 truncate text-left text-[13px] leading-snug ${
                type.hasStock ? "font-medium text-foreground" : "font-medium text-muted-foreground line-through"
              }`}
            >
              {type.name}
            </span>

            {!type.hasStock ? (
              <Badge variant="secondary" className="shrink-0">
                {t("outOfStock")}
              </Badge>
            ) : pct ? (
              <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9.5px] font-extrabold text-primary">
                {pct}
              </span>
            ) : null}

            {/* ราคา: เดิมขีดฆ่า + ขายส้ม */}
            <span className="num ml-1 flex shrink-0 items-baseline justify-end gap-1.5 tabular-nums">
              {hasDiscount ? (
                <s className="text-[11px] font-medium text-muted-foreground/70">
                  {formatTHB(type.originPrice!)}
                </s>
              ) : null}
              <span
                className={`text-sm font-bold ${
                  type.hasStock ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {formatTHB(type.displayPrice)}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
