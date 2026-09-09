"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { formatTHB } from "@/lib/pricing";
import type { ProductTypePublic } from "@/lib/api/products";

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
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
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
            disabled={!type.hasStock}
            onClick={() => onSelect(type)}
            aria-pressed={selected}
            className={`relative rounded-[10px] border bg-card px-3 py-3 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              selected
                ? "border-primary bg-primary/10"
                : "border-border/60 hover:border-border"
            }`}
          >
            {pct ? (
              <span className="absolute -top-1.5 -right-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-extrabold text-primary-foreground">
                {pct}
              </span>
            ) : null}
            <span className="block truncate text-[13px] font-bold">{type.name}</span>
            <span className="num mt-1 block text-[13.5px] font-bold text-primary">
              {formatTHB(type.displayPrice)}
              {hasDiscount ? (
                <s className="num ml-1.5 text-[10.5px] font-semibold text-muted-foreground/70">
                  {formatTHB(type.originPrice!)}
                </s>
              ) : null}
            </span>
            {!type.hasStock ? (
              <Badge variant="secondary" className="mt-1.5">
                {t("outOfStock")}
              </Badge>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
