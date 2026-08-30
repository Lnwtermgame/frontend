"use client";

import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { PackageOption } from "@/components/products/PackageOption";
import { Grid } from "@/components/ui/Grid";
import { Sheet } from "@/components/ui/Sheet";
import { EmptyState } from "@/components/ui/EmptyState";
import type { TopUpOption } from "./types";

export function PackageSelector({
  options,
  selectedId,
  onSelect,
}: {
  options: TopUpOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations("ProductDetail");

  if (options.length === 0) {
    return (
      <EmptyState
        icon={AlertCircle}
        message={t("no_options")}
        description={t("no_options_desc")}
      />
    );
  }

  return (
    <div className="hidden md:block space-y-4">
      <p className="text-site-dim font-bold text-xs uppercase">
        {t("select_package")}
      </p>
      <div role="radiogroup" aria-label={t("select_package")}>
        <Grid cols={2} md={3} gap={3}>
          {options.map((option) => (
            <PackageOption
              key={option.id}
              option={option}
              selected={selectedId === option.id}
              onSelect={onSelect}
              popularLabel={t("popular_badge")}
              soldOut={option.hasStock === false}
              soldOutLabel={t("out_of_stock")}
              size="lg"
            />
          ))}
        </Grid>
      </div>
    </div>
  );
}

export function PackageSheet({
  open,
  onOpenChange,
  options,
  selectedId,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: TopUpOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations("ProductDetail");
  return (
    <Sheet
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={t("select_package")}
    >
      <div
        role="radiogroup"
        aria-label={t("select_package")}
        className="grid grid-cols-2 gap-3 pb-8"
      >
        {options.map((option) => (
          <PackageOption
            key={option.id}
            option={option}
            selected={selectedId === option.id}
            onSelect={(id) => {
              onSelect(id);
              onOpenChange(false);
            }}
            popularLabel={t("popular_badge")}
            soldOut={option.hasStock === false}
            soldOutLabel={t("out_of_stock")}
            size="sm"
          />
        ))}
      </div>
    </Sheet>
  );
}
