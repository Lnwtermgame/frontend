"use client";

import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { PackageOption } from "@/components/products/PackageOption";
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
    <div
      role="radiogroup"
      aria-label={t("select_package")}
      className="grid grid-cols-1 md:grid-cols-2 gap-2.5"
    >
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
    </div>
  );
}
