"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { UnifiedCatalogPage } from "@/components/catalog/unified-catalog-page";
import { useTranslations } from "next-intl";

export default function CardPage() {
  const t = useTranslations("Catalog");

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-transparent flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
            <span className="text-gray-900 font-bold">{t("loading")}</span>
          </div>
        </div>
      }
    >
      <UnifiedCatalogPage mode="card" />
    </Suspense>
  );
}
