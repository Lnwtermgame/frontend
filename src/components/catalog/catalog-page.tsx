"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts } from "@/lib/query/hooks";
import { ShelfTile } from "@/components/product/shelf-tile";
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

type SortKey = "sales" | "priceAsc" | "priceDesc" | "newest";

/* เรียงราคาไม่มีใน API — ใช้ยอดขายเป็นฐาน fetch แล้วเรียงฝั่ง client จาก minPrice */
const SORTS: Record<SortKey, { sortBy: "salesCount" | "createdAt"; sortOrder: "asc" | "desc" }> = {
  sales: { sortBy: "salesCount", sortOrder: "desc" },
  priceAsc: { sortBy: "salesCount", sortOrder: "desc" },
  priceDesc: { sortBy: "salesCount", sortOrder: "desc" },
  newest: { sortBy: "createdAt", sortOrder: "desc" },
};

type PriceBand = "lt50" | "50to200" | "gt200";

function minPrice(p: Product): number | null {
  const types = p.types ?? [];
  return types.length ? Math.min(...types.map((t) => t.displayPrice)) : null;
}

function inBand(price: number | null, band: PriceBand) {
  if (price === null) return false;
  if (band === "lt50") return price < 50;
  if (band === "50to200") return price >= 50 && price <= 200;
  return price > 200;
}

function CatalogInner({ mode }: { mode: CatalogMode }) {
  const t = useTranslations("catalog");
  const copy = COPY_BY_MODE[mode];
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") ?? "";
  const [search, setSearch] = useState(urlSearch);
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("sales");
  const [priceBand, setPriceBand] = useState<PriceBand | null>(null);

  const products = useProducts({
    search: urlSearch || undefined,
    limit: 100,
    sortBy: SORTS[sort].sortBy,
    sortOrder: SORTS[sort].sortOrder,
  });

  const byType = useMemo(
    () => (products.data ?? []).filter((p) => p.productType === TYPE_BY_MODE[mode]),
    [products.data, mode],
  );

  /* หมวดใน sidebar สร้างจากสินค้าที่แสดงจริง (group by p.category + ตัวนับ) —
     endpoint /products/categories คืนหมวดแม่ที่สินค้าไม่ได้ผูกด้วยตรง ๆ (filter แล้วได้ 0) */
  const derivedCategories = useMemo(() => {
    const map = new Map<string, { slug: string; name: string; count: number }>();
    for (const p of byType) {
      if (!p.category) continue;
      const cur = map.get(p.category.slug);
      if (cur) cur.count += 1;
      else map.set(p.category.slug, { slug: p.category.slug, name: p.category.name, count: 1 });
    }
    return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [byType]);

  const filtered = useMemo(() => {
    let out = categorySlug ? byType.filter((p) => p.category?.slug === categorySlug) : byType;
    if (priceBand) out = out.filter((p) => inBand(minPrice(p), priceBand));
    if (sort === "priceAsc")
      out = [...out].sort((a, b) => (minPrice(a) ?? Infinity) - (minPrice(b) ?? Infinity));
    if (sort === "priceDesc")
      out = [...out].sort((a, b) => (minPrice(b) ?? -Infinity) - (minPrice(a) ?? -Infinity));
    return out;
  }, [byType, categorySlug, priceBand, sort]);

  const countFor = (slug: string | null) =>
    slug === null ? byType.length : byType.filter((p) => p.category?.slug === slug).length;

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.history.replaceState(null, "", `?search=${encodeURIComponent(search)}`);
  };

  const sortItem = (key: SortKey, label: string) => (
    <button
      type="button"
      onClick={() => setSort(key)}
      className={`w-full rounded-[8px] px-2.5 py-[7px] text-left text-[13px] font-semibold transition-colors ${
        sort === key
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-card hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="grid gap-7 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* sidebar — sticky บนเดสก์ท็อป, แถบเลื่อนแนวนอนบนมือถือ */}
        <aside className="min-w-0 self-start lg:sticky lg:top-[76px]">
          <div className="flex gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:block lg:overflow-visible lg:pb-0">
            <div className="mb-5 min-w-[180px] flex-none lg:min-w-0">
              <h4 className="mb-2 text-[11.5px] font-bold tracking-wider text-muted-foreground/70 uppercase">
                {t("sidebarCategories")}
              </h4>
              <button
                type="button"
                onClick={() => setCategorySlug(null)}
                className={`flex w-full items-center justify-between rounded-[8px] px-2.5 py-[7px] text-[13px] font-semibold transition-colors ${
                  categorySlug === null
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-card hover:text-foreground"
                }`}
              >
                {t("filterAll")}
                <span className="num text-[11px] text-muted-foreground/70">{countFor(null)}</span>
              </button>
              {derivedCategories.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setCategorySlug(c.slug)}
                  className={`flex w-full items-center justify-between rounded-[8px] px-2.5 py-[7px] text-[13px] font-semibold transition-colors ${
                    categorySlug === c.slug
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-card hover:text-foreground"
                  }`}
                >
                  {c.name}
                  <span className="num text-[11px] text-muted-foreground/70">{c.count}</span>
                </button>
              ))}
            </div>

            <div className="mb-5 min-w-[180px] flex-none lg:min-w-0">
              <h4 className="mb-2 text-[11.5px] font-bold tracking-wider text-muted-foreground/70 uppercase">
                {t("sidebarSort")}
              </h4>
              {sortItem("sales", t("sortSales"))}
              {sortItem("priceAsc", t("sortPriceAsc"))}
              {sortItem("priceDesc", t("sortPriceDesc"))}
              {sortItem("newest", t("sortNewest"))}
            </div>

            <div className="min-w-[180px] flex-none lg:min-w-0">
              <h4 className="mb-2 text-[11.5px] font-bold tracking-wider text-muted-foreground/70 uppercase">
                {t("sidebarPrice")}
              </h4>
              <button
                type="button"
                onClick={() => setPriceBand(null)}
                className={`w-full rounded-[8px] px-2.5 py-[7px] text-left text-[13px] font-semibold transition-colors ${
                  priceBand === null
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-card hover:text-foreground"
                }`}
              >
                {t("filterAll")}
              </button>
              {(
                [
                  ["lt50", t("priceLt50")],
                  ["50to200", t("price50to200")],
                  ["gt200", t("priceGt200")],
                ] as Array<[PriceBand, string]>
              ).map(([band, label]) => (
                <button
                  key={band}
                  type="button"
                  onClick={() => setPriceBand(band)}
                  className={`w-full rounded-[8px] px-2.5 py-[7px] text-left text-[13px] font-semibold transition-colors ${
                    priceBand === band
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-card hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* เนื้อหา */}
        <div className="min-w-0">
          <h1 className="text-[22px] font-extrabold tracking-tight">{t(copy.titleKey)}</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">{t(copy.subKey)}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <form onSubmit={submitSearch} className="min-w-0 max-w-[320px] flex-1">
              <div className="flex h-10 items-center gap-2.5 rounded-[10px] border border-input bg-card px-3 text-muted-foreground/70 transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/25">
                <Search className="size-4 shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("searchInCategory")}
                  className="h-full min-w-0 flex-1 bg-transparent text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground/70"
                />
              </div>
            </form>
            {products.isSuccess && (
              <span className="num text-xs text-muted-foreground/70">
                {t("foundCount", { count: filtered.length })}
              </span>
            )}
          </div>

          <div className="mt-6">
            {products.isLoading ? (
              <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <Skeleton className="aspect-square rounded-xl" />
                    <Skeleton className="h-4 w-3/4 rounded-md" />
                    <Skeleton className="h-3.5 w-1/2 rounded-md" />
                  </div>
                ))}
              </div>
            ) : products.isError ? (
              <div className="rounded-[14px] border bg-card p-10 text-center">
                <p className="font-semibold">{t("error")}</p>
                <Button variant="outline" className="mt-3" onClick={() => products.refetch()}>
                  {t("retry")}
                </Button>
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">{t("emptyTitle")}</p>
            ) : (
              <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-5">
                {filtered.map((p) => (
                  <ShelfTile key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
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
