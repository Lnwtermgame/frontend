"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { formatTHB } from "@/lib/pricing";
import { minActivePrice } from "@/lib/mobile-recharge";
import type { Product } from "@/lib/api/products";

/**
 * ขั้น 3 — เลือกผู้ให้บริการ (SEAGM-style)
 * การ์ด grid 2 คอลัมน์: โลโก้ 60×60 (เติมอักษรแรกถ้าไม่มีรูป) + ชื่อ + "จาก ฿XX"
 * การ์ดที่เลือก = ขอบ inset 2px สี primary (แบบเดียวกับ SEAGM)
 */
export function OperatorList({
  operators,
  selectedId,
  onSelect,
}: {
  operators: Product[];
  selectedId: string | null;
  onSelect: (p: Product) => void;
}) {
  const t = useTranslations("mobileRecharge");

  return (
    <div
      className="grid grid-cols-2 gap-2.5"
      role="radiogroup"
      aria-label={t("stepOperator")}
    >
      {operators.map((op) => {
        const price = minActivePrice(op);
        const sellable = price !== null;
        const selected = op.id === selectedId;
        const initial = op.name.trim().charAt(0).toUpperCase() || "?";
        return (
          <button
            key={op.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={!sellable}
            onClick={() => onSelect(op)}
            className={`flex items-center gap-3 rounded-[6px] p-2.5 text-left transition-shadow disabled:cursor-not-allowed disabled:opacity-50 ${
              !sellable
                ? "bg-muted/30"
                : selected
                  ? "bg-muted/60 ring-2 ring-primary ring-inset"
                  : "bg-muted/60 hover:bg-muted"
            }`}
          >
            {op.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={op.imageUrl}
                alt=""
                width={48}
                height={48}
                loading="lazy"
                className="size-12 shrink-0 rounded-[6px] bg-background object-contain"
              />
            ) : (
              <span
                aria-hidden
                className="grid size-12 shrink-0 place-items-center rounded-[6px] bg-primary/10 text-[18px] font-extrabold text-primary"
              >
                {initial}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-bold">
                {op.name}
              </span>
              {sellable ? (
                <span className="num block text-[12px] font-semibold text-primary">
                  {t("fromPrice", { price: formatTHB(price) })}
                </span>
              ) : (
                <Badge variant="secondary" className="mt-1">
                  {t("temporarilyUnavailable")}
                </Badge>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
