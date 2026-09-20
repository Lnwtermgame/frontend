"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { formatTHB } from "@/lib/pricing";
import { minActivePrice } from "@/lib/mobile-recharge";
import type { Product } from "@/lib/api/products";

/**
 * ขั้น 3 — เลือกผู้ให้บริการ
 * การ์ดแนวตั้ง 1 คอลัมน์: ชื่อ + "จาก ฿XX" (ถูกสุดของนิยามที่ยังขายได้)
 * การ์ดที่ขายไม่ได้ทั้งหมด = disabled + ป้าย ไม่พร้อมขายชั่วคราว
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
    <div className="flex flex-col gap-2" role="radiogroup" aria-label={t("stepOperator")}>
      {operators.map((op) => {
        const price = minActivePrice(op);
        const sellable = price !== null;
        const selected = op.id === selectedId;
        return (
          <button
            key={op.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={!sellable}
            onClick={() => onSelect(op)}
            className={`flex min-h-11 items-center justify-between gap-3 rounded-[10px] border px-3.5 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 lg:min-h-0 ${
              !sellable
                ? "border-border/40 bg-muted/30"
                : selected
                  ? "border-primary bg-primary/10"
                  : "border-border/60 bg-muted/20 hover:border-border"
            }`}
          >
            <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-foreground">
              {op.name}
            </span>
            {sellable ? (
              <span className="num shrink-0 text-[13px] font-bold text-primary">
                {t("fromPrice", { price: formatTHB(price) })}
              </span>
            ) : (
              <Badge variant="secondary" className="shrink-0">
                {t("temporarilyUnavailable")}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}
