"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProducts, useCategories } from "@/lib/query/hooks";
import { ProductGrid, ProductGridSkeleton, GridEmptyState } from "@/components/product/product-grid";
import type { Product } from "@/lib/api/products";

export type CatalogMode = "games" | "card" | "mobile";

const TYPE_BY_MODE: Record<CatalogMode, Product["productType"]> = {
  games: "DIRECT_TOPUP",
  card: "CARD",
  mobile: "MOBILE_RECHARGE",
};

const COPY_BY_MODE = {
  games: { titleKey: "gamesTitle", subKey: "gamesSubtitle" },
  card: { titleKey: "cardTitle", subKey: "cardSubtitle" },
  mobile: { titleKey: "mobileTitle", subKey: "mobileSubtitle" },
} as const;

function CatalogInner({ mode }: { mode: CatalogMode }) {
  const t = useTranslations("catalog");
  const copy = COPY_BY_MODE[mode];
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") ?? "";
  const [search, setSearch] = useState(urlSearch);
  const [categorySlug, setCategorySlug] = useState<string | null>(null);

  const products = useProducts({
    search: urlSearch || undefined,
    limit: 100,
    sortBy: "salesCount",
    sortOrder: "desc",
  });
  const categories = useCategories();

  const filtered = useMemo(() => {
    const byType = (products.data ?? []).filter((p) => p.productType === TYPE_BY_MODE[mode]);
    if (!categorySlug) return byType;
    return byType.filter((p) => p.category?.slug === categorySlug);
  }, [products.data, mode, categorySlug]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.history.replaceState(null, "", `?search=${encodeURIComponent(search)}`);
    products.refetch();
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">{t(copy.titleKey)}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t(copy.subKey)}</p>

      <form onSubmit={submitSearch} className="mt-5 flex max-w-md gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
        />
        <Button type="submit" variant="secondary">
          {t("searchPlaceholder")}
        </Button>
      </form>

      {categories.data?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={categorySlug === null ? "default" : "outline"}
            onClick={() => setCategorySlug(null)}
          >
            {t("filterAll")}
          </Button>
          {categories.data.map((c) => (
            <Button
              key={c.id}
              size="sm"
              variant={categorySlug === c.slug ? "default" : "outline"}
              onClick={() => setCategorySlug(c.slug)}
            >
              {c.name}
            </Button>
          ))}
        </div>
      ) : null}

      <div className="mt-6">
        {products.isLoading ? (
          <ProductGridSkeleton count={10} />
        ) : products.isError ? (
          <GridEmptyState title={t("error")} description="" />
        ) : filtered.length === 0 ? (
          <GridEmptyState title={t("emptyTitle")} description={t("emptyDesc")} />
        ) : (
          <ProductGrid products={filtered} />
        )}
      </div>
    </div>
  );
}

export function CatalogPage({ mode }: { mode: CatalogMode }) {
  return (
    <Suspense fallback={null}>
      <CatalogInner mode={mode} />
    </Suspense>
  );
}
