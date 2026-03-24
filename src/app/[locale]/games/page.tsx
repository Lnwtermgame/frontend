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
        <div className="min-h-[60vh] bg-transparent flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-site-accent animate-spin" />
            <span className="text-gray-400 font-medium tracking-wide uppercase text-sm">{t("loading")}</span>
          </div>
        </div>
      }
    >
      <UnifiedCatalogPage mode="games" />
    </Suspense>
  );
}
