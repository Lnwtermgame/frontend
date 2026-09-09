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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {types.map((type) => {
        const selected = type.id === selectedId;
        return (
          <button
            key={type.id}
            type="button"
            disabled={!type.hasStock}
            onClick={() => onSelect(type)}
            aria-pressed={selected}
            className={`flex flex-col gap-1 rounded-[14px] border bg-card p-3.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              selected ? "border-primary" : "hover:border-primary/50"
            }`}
          >
            <span className="text-sm font-semibold leading-snug">{type.name}</span>
            <span className="num text-lg font-bold text-primary">
              {formatTHB(type.displayPrice)}
            </span>
            {type.originPrice && type.originPrice > type.displayPrice ? (
              <span className="num text-xs text-muted-foreground line-through">
                {formatTHB(type.originPrice)}
              </span>
            ) : null}
            {!type.hasStock ? (
              <Badge variant="secondary" className="w-fit">
                {t("outOfStock")}
              </Badge>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
