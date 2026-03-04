"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { UnifiedCatalogPage } from "@/components/catalog/unified-catalog-page";
import { useTranslations } from "next-intl";

export default function DirectTopupPage() {
  const t = useTranslations("Catalog");

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brutal-gray flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader2 className="w-8 h-8 text-brutal-pink animate-spin" />
            <span className="text-gray-900 font-bold">{t("loading")}</span>
          </div>
        </div>
      }
    >
      <UnifiedCatalogPage mode="games" />
    </Suspense>
  );
}
