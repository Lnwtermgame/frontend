"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts } from "@/lib/query/hooks";
import { ShelfTile } from "@/components/product/shelf-tile";
import { PlatformIcon } from "@/components/catalog/platform-icons";
import type { GameType, Product } from "@/lib/api/products";

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

/* à¹€à¸£à¸µà¸¢à¸‡à¸£à¸²à¸„à¸²à¹„à¸¡à¹ˆà¸¡à¸µà¹ƒà¸™ API â€” à¹ƒà¸Šà¹‰à¸¢à¸­à¸”à¸‚à¸²à¸¢à¹€à¸›à¹‡à¸™à¸à¸²à¸™ fetch à¹à¸¥à¹‰à¸§à¹€à¸£à¸µà¸¢à¸‡à¸à¸±à¹ˆà¸‡ client à¸ˆà¸²à¸ minPrice */
const SORTS: Record<SortKey, { sortBy: "salesCount" | "createdAt"; sortOrder: "asc" | "desc" }> = {
  sales: { sortBy: "salesCount", sortOrder: "desc" },
  priceAsc: { sortBy: "salesCount", sortOrder: "desc" },
  priceDesc: { sortBy: "salesCount", sortOrder: "desc" },
  newest: { sortBy: "createdAt", sortOrder: "desc" },
};

type PriceBand = "lt50" | "50to200" | "gt200";

/* à¸¥à¸³à¸”à¸±à¸šà¹à¸žà¸¥à¸•à¸Ÿà¸­à¸£à¹Œà¸¡à¸•à¸²à¸¡à¸„à¸§à¸²à¸¡à¸™à¸´à¸¢à¸¡ */
const PLATFORM_ORDER: GameType[] = ["MOBILE", "PC", "STEAM", "PLAYSTATION", "XBOX", "NINTENDO", "WEBGAME"];

/* i18n key à¸‚à¸­à¸‡à¹à¸•à¹ˆà¸¥à¸°à¹à¸žà¸¥à¸•à¸Ÿà¸­à¸£à¹Œà¸¡ */
function platformLabelKey(type: GameType): string {
  switch (type) {
    case "PC": return "platformPc";
    case "MOBILE": return "platformMobile";
    case "STEAM": return "platformSteam";
    case "PLAYSTATION": return "platformPlaystation";
    case "XBOX": return "platformXbox";
    case "NINTENDO": return "platformNintendo";
    case "WEBGAME": return "platformWebgame";
  }
}

/** à¸­à¹ˆà¸²à¸™à¸„à¹ˆà¸² ?platform= à¸ˆà¸²à¸ URL â€” URL à¹€à¸à¹‡à¸šà¹€à¸›à¹‡à¸™à¸•à¸±à¸§à¸žà¸´à¸¡à¸žà¹Œà¹€à¸¥à¹‡à¸ à¸•à¹‰à¸­à¸‡ normalize à¹€à¸›à¹‡à¸™ GameType à¸à¹ˆà¸­à¸™à¹€à¸—à¸µà¸¢à¸š */
function parsePlatformParam(raw: string | null): GameType | null {
  if (!raw) return null;
  const upper = raw.toUpperCase();
  return (PLATFORM_ORDER as string[]).includes(upper) ? (upper as GameType) : null;
}

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
  const urlPlatform = searchParams.get("platform");
  const [search, setSearch] = useState(urlSearch);
  const [gameTypeFilter, setGameTypeFilter] = useState<GameType | null>(() => parsePlatformParam(urlPlatform));
  const [sort, setSort] = useState<SortKey>("sales");
  const [priceBand, setPriceBand] = useState<PriceBand | null>(null);

  /* sync à¹€à¸¡à¸·à¹ˆà¸­ URL à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸ˆà¸²à¸à¸ à¸²à¸¢à¸™à¸­à¸ (à¸à¸” back/forward à¸«à¸£à¸·à¸­à¸¥à¸´à¸‡à¸à¹Œ) */
  useEffect(() => {
    setGameTypeFilter(parsePlatformParam(urlPlatform));
  }, [urlPlatform]);

  const products = useProducts({
    search: urlSearch || undefined,
    limit: 100,
    sortBy: SORTS[sort].sortBy,
    sortOrder: SORTS[sort].sortOrder,
  });

  /* à¸ªà¸´à¸™à¸„à¹‰à¸²à¸•à¸²à¸¡à¹‚à¸«à¸¡à¸” + à¸¡à¸µ gameType à¹€à¸—à¹ˆà¸²à¸™à¸±à¹‰à¸™ (à¸ªà¸´à¸™à¸„à¹‰à¸²à¹„à¸£à¹‰à¸›à¸£à¸°à¹€à¸ à¸—à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸žà¸£à¹‰à¸­à¸¡à¹à¸ªà¸”à¸‡) */
  const byType = useMemo(
    () => (products.data ?? []).filter((p) => p.productType === TYPE_BY_MODE[mode] && p.gameType),
    [products.data, mode],
  );

  /* à¹à¸žà¸¥à¸•à¸Ÿà¸­à¸£à¹Œà¸¡à¹ƒà¸™ sidebar â€” group by p.gameType à¸™à¸±à¸šà¸ˆà¸²à¸à¸ªà¸´à¸™à¸„à¹‰à¸²à¸—à¸µà¹ˆà¹à¸ªà¸”à¸‡à¸ˆà¸£à¸´à¸‡ */
  const platformCounts = useMemo(() => {
    const counts = new Map<GameType, number>();
    for (const p of byType) {
      const gt = p.gameType!;
      counts.set(gt, (counts.get(gt) ?? 0) + 1);
    }
    // à¹€à¸£à¸µà¸¢à¸‡à¸•à¸²à¸¡à¸¥à¸³à¸”à¸±à¸šà¸—à¸µà¹ˆà¸à¸³à¸«à¸™à¸” à¹à¸¥à¸°à¹à¸ªà¸”à¸‡à¹€à¸‰à¸žà¸²à¸°à¹à¸žà¸¥à¸•à¸Ÿà¸­à¸£à¹Œà¸¡à¸—à¸µà¹ˆà¸¡à¸µà¸ªà¸´à¸™à¸„à¹‰à¸²
    return PLATFORM_ORDER.filter((gt) => counts.get(gt)).map((gt) => ({
      type: gt,
      count: counts.get(gt)!,
    }));
  }, [byType]);

  const filtered = useMemo(() => {
    let out = gameTypeFilter ? byType.filter((p) => p.gameType === gameTypeFilter) : byType;
    if (priceBand) out = out.filter((p) => inBand(minPrice(p), priceBand));
    if (sort === "priceAsc")
      out = [...out].sort((a, b) => (minPrice(a) ?? Infinity) - (minPrice(b) ?? Infinity));
    if (sort === "priceDesc")
      out = [...out].sort((a, b) => (minPrice(b) ?? -Infinity) - (minPrice(a) ?? -Infinity));
    return out;
  }, [byType, gameTypeFilter, priceBand, sort]);

  const countFor = (type: GameType | null) =>
    type === null ? byType.length : byType.filter((p) => p.gameType === type).length;

  /** à¸­à¸±à¸›à¹€à¸”à¸• query param à¹‚à¸”à¸¢à¹„à¸¡à¹ˆà¸—à¸±à¸šà¸•à¸±à¸§à¸­à¸·à¹ˆà¸™ (platform à¸à¸±à¸š search à¸­à¸¢à¸¹à¹ˆà¸£à¹ˆà¸§à¸¡à¸à¸±à¸™à¹„à¸”à¹‰) */
  const updateUrlParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(window.location.search);
    if (value) params.set(key, value);
    else params.delete(key);
    const q = params.toString();
    window.history.replaceState(null, "", q ? `?${q}` : window.location.pathname);
  };

  const selectPlatform = (type: GameType | null) => {
    setGameTypeFilter(type);
    updateUrlParam("platform", type ? type.toLowerCase() : null);
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParam("search", search.trim() || null);
  };

  const sortItem = (key: SortKey, label: string) => (
    <button
      type="button"
      onClick={() => setSort(key)}
      className={`flex min-h-11 w-full items-center rounded-[8px] px-2.5 py-[7px] text-left text-[13px] font-semibold transition-colors lg:min-h-0 ${
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
        {/* sidebar â€” sticky à¸šà¸™à¹€à¸”à¸ªà¸à¹Œà¸—à¹‡à¸­à¸›, à¹à¸–à¸šà¹€à¸¥à¸·à¹ˆà¸­à¸™à¹à¸™à¸§à¸™à¸­à¸™à¸šà¸™à¸¡à¸·à¸­à¸–à¸·à¸­ */}
        <aside className="min-w-0 self-start lg:sticky lg:top-[76px]">
          <div className="flex gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:block lg:overflow-visible lg:pb-0">
            <div className="mb-5 min-w-[180px] flex-none lg:min-w-0">
              <h4 className="mb-2 text-[11.5px] font-bold tracking-wider text-muted-foreground/70 uppercase">
                {t("sidebarPlatform")}
              </h4>
              <button
                type="button"
                onClick={() => selectPlatform(null)}
                className={`flex min-h-11 w-full items-center justify-between rounded-[8px] px-2.5 py-[7px] text-[13px] font-semibold transition-colors lg:min-h-0 ${
                  gameTypeFilter === null
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-card hover:text-foreground"
                }`}
              >
                {t("filterAll")}
                <span className="num text-xs text-muted-foreground/70">{countFor(null)}</span>
              </button>
              {platformCounts.map(({ type, count }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => selectPlatform(type)}
                  className={`flex min-h-11 w-full items-center justify-between rounded-[8px] px-2.5 py-[7px] text-[13px] font-semibold transition-colors lg:min-h-0 ${
                    gameTypeFilter === type
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-card hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <PlatformIcon type={type} className="size-[15px] opacity-80" />
                    {t(platformLabelKey(type))}
                  </span>
                  <span className="num text-xs text-muted-foreground/70">{count}</span>
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
                className={`flex min-h-11 w-full items-center rounded-[8px] px-2.5 py-[7px] text-left text-[13px] font-semibold transition-colors lg:min-h-0 ${
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
                  className={`flex min-h-11 w-full items-center rounded-[8px] px-2.5 py-[7px] text-left text-[13px] font-semibold transition-colors lg:min-h-0 ${
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

        {/* à¹€à¸™à¸·à¹‰à¸­à¸«à¸² */}
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
              <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-6">
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
