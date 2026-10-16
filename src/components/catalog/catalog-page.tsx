"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn } from "@/components/ui/skeleton-region";
import { ShelfGridSkeleton } from "@/components/skeletons";
import { useProducts } from "@/lib/query/hooks";
import { ShelfTile } from "@/components/product/shelf-tile";
import { PlatformIcon } from "@/components/catalog/platform-icons";
import type { GameType, Product } from "@/lib/api/products";

type CatalogMode = "games" | "card" | "mobile";

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

/* คำนามของจำนวนผลลัพธ์ตามหมวด — หน้าบัตร/มือถือไม่ใช่ "เกม" (แปลผ่าน catalog.foundCount/foundItems) */
const FOUND_KEY_BY_MODE: Record<CatalogMode, "foundCount" | "foundItems"> = {
  games: "foundCount",
  card: "foundItems",
  mobile: "foundItems",
};

type SortKey = "sales" | "newest";

const SORTS: Record<SortKey, { sortBy: "salesCount" | "createdAt"; sortOrder: "asc" | "desc" }> = {
  sales: { sortBy: "salesCount", sortOrder: "desc" },
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
  /* platform filter: URL เป็น source of truth + override ที่ผูกกับค่า param ที่ตั้งล่าสุด —
     กด chip ใช้ override ทันที (replaceState ไม่ trigger re-render), ส่วน back/forward
     (urlPlatform เปลี่ยนจากภายนอก) override เก่าหมดอายุ ตกไป parse จาก URL ใหม่เอง */
  const [platformOverride, setPlatformOverride] = useState<{
    forParam: string | null;
    value: GameType | null;
  } | null>(null);
  const gameTypeFilter =
    platformOverride && platformOverride.forParam === urlPlatform
      ? platformOverride.value
      : parsePlatformParam(urlPlatform);
  const [sort, setSort] = useState<SortKey>("sales");
  const [priceBand, setPriceBand] = useState<PriceBand | null>(null);

  const products = useProducts(
    {
      search: urlSearch || undefined,
      limit: 100,
      sortBy: SORTS[sort].sortBy,
      sortOrder: SORTS[sort].sortOrder,
    },
    { keepPrevious: true },
  );

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
    return out;
  }, [byType, gameTypeFilter, priceBand]);

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
    const param = type ? type.toLowerCase() : null;
    setPlatformOverride({ forParam: param, value: type });
    updateUrlParam("platform", param);
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParam("search", search.trim() || null);
  };

  /** ล้างตัวกรองทั้งหมด — รวม search/platform ใน URL กลับเป็นค่าว่าง */
  const resetFilters = () => {
    setSearch("");
    setSort("sales");
    setPriceBand(null);
    setPlatformOverride({ forParam: null, value: null });
    updateUrlParam("search", null);
    updateUrlParam("platform", null);
  };

  const sortItem = (key: SortKey, label: string) => (
    <button
      type="button"
      onClick={() => setSort(key)}
      aria-pressed={sort === key}
      className={`inline-flex min-h-11 items-center rounded-full border px-3.5 text-left text-sm font-semibold transition-colors lg:w-full lg:rounded-[8px] lg:border-transparent lg:px-2.5 lg:py-[7px] ${
        sort === key
          ? "border-primary/40 bg-primary/10 text-primary lg:border-transparent"
          : "border-border/60 text-muted-foreground hover:text-foreground lg:border-transparent lg:hover:bg-card"
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
          <div className="flex flex-col gap-4 lg:block">
            {/* flex-col gap-1 — ปุ่มแนบกันแล้วพื้น active/hover ชนขอบมุมโค้งกันเป็นก้อนเดียว */}
            <div className="flex flex-wrap gap-2 lg:mb-5 lg:min-w-0 lg:flex-col lg:gap-1">
              <h2 className="w-full text-2xs font-bold tracking-wider text-muted-foreground-strong uppercase lg:mb-2">
                {t("sidebarPlatform")}
              </h2>
              <button
                type="button"
                onClick={() => selectPlatform(null)}
                aria-pressed={gameTypeFilter === null}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition-colors lg:w-full lg:justify-between lg:rounded-[8px] lg:border-transparent lg:px-2.5 lg:py-[7px] ${
                  gameTypeFilter === null
                    ? "border-primary/40 bg-primary/10 text-primary lg:border-transparent"
                    : "border-border/60 text-muted-foreground hover:text-foreground lg:border-transparent lg:hover:bg-card"
                }`}
              >
                {t("filterAll")}
                {products.isLoading ? (
                  <Skeleton className="h-3 w-5 rounded-full" />
                ) : (
                  <span className="num text-xs text-muted-foreground-strong">{countFor(null)}</span>
                )}
              </button>
              {platformCounts.map(({ type, count }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => selectPlatform(type)}
                  aria-pressed={gameTypeFilter === type}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition-colors lg:w-full lg:justify-between lg:rounded-[8px] lg:border-transparent lg:px-2.5 lg:py-[7px] ${
                    gameTypeFilter === type
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-card hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <PlatformIcon type={type} className="size-[15px] opacity-80" />
                    {t(platformLabelKey(type))}
                  </span>
                  <span className="num text-xs text-muted-foreground-strong">{count}</span>
                </button>
              ))}
              {/* จองที่แถวแพลตฟอร์มระหว่างโหลด — กันกลุ่ม "เรียงตาม/ราคา" ถูกดันลงตอนข้อมูลมา */}
              {products.isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      aria-hidden
                      className="flex h-11 items-center justify-between gap-2 rounded-full border border-border/60 px-3.5 lg:w-full lg:rounded-[8px] lg:border-transparent lg:px-2.5 lg:py-[7px]"
                    >
                      <span className="flex h-[21px] items-center gap-2">
                        <Skeleton className="size-[15px] rounded-sm" />
                        <Skeleton className={`h-3 rounded-full ${i % 2 ? "w-14" : "w-20"}`} />
                      </span>
                      <Skeleton className="hidden h-3 w-4 rounded-full lg:block" />
                    </div>
                  ))
                : null}
            </div>

            <div className="flex flex-wrap gap-2 lg:mb-5 lg:min-w-0 lg:flex-col lg:gap-1">
              <h2 className="w-full text-2xs font-bold tracking-wider text-muted-foreground-strong uppercase lg:mb-2">
                {t("sidebarSort")}
              </h2>
              {sortItem("sales", t("sortSales"))}
              {sortItem("newest", t("sortNewest"))}
            </div>

            <div className="flex flex-wrap gap-2 lg:mb-5 lg:min-w-0 lg:flex-col lg:gap-1">
              <h2 className="w-full text-2xs font-bold tracking-wider text-muted-foreground-strong uppercase lg:mb-2">
                {t("sidebarPrice")}
              </h2>
              <button
                type="button"
                onClick={() => setPriceBand(null)}
                aria-pressed={priceBand === null}
                className={`inline-flex min-h-11 items-center rounded-full border px-3.5 text-left text-sm font-semibold transition-colors lg:w-full lg:rounded-[8px] lg:border-transparent lg:px-2.5 lg:py-[7px] ${
                  priceBand === null
                    ? "border-primary/40 bg-primary/10 text-primary lg:border-transparent"
                    : "border-border/60 text-muted-foreground hover:text-foreground lg:border-transparent lg:hover:bg-card"
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
                  aria-pressed={priceBand === band}
                  className={`inline-flex min-h-11 items-center rounded-full border px-3.5 text-left text-sm font-semibold transition-colors lg:w-full lg:rounded-[8px] lg:border-transparent lg:px-2.5 lg:py-[7px] ${
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
          <h1 className="text-[22px] font-bold tracking-tight">{t(copy.titleKey)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t(copy.subKey)}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <form onSubmit={submitSearch} className="min-w-0 max-w-[320px] flex-1">
              <div className="flex h-10 items-center gap-2.5 rounded-[10px] border border-input bg-card px-3 text-muted-foreground/70 transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/25">
                <Search className="size-4 shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("searchInCategory")}
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
                />
              </div>
            </form>
            {products.isSuccess ? (
              <span className="num text-xs text-muted-foreground-strong">
                {t(FOUND_KEY_BY_MODE[mode], { count: filtered.length })}
              </span>
            ) : products.isLoading ? (
              <Skeleton className="h-3 w-20 rounded-full" />
            ) : null}
          </div>

          <div className="mt-6">
            {products.isLoading ? (
              // grid เดียวกับผลลัพธ์จริง (lg 6 คอลัมน์) · 12 ชิ้น = เต็ม 2 แถวพอดีทุก breakpoint
              <ShelfGridSkeleton
                count={12}
                className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-6"
              />
            ) : products.isError ? (
              <div className="rounded-[14px] border bg-card p-10 text-center">
                <p className="font-semibold">{t("error")}</p>
                <Button variant="outline" className="mt-3" onClick={() => products.refetch()}>
                  {t("retry")}
                </Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm font-semibold text-foreground">{t("emptyTitle")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("emptyDesc")}</p>
                <Button variant="outline" className="mt-4" onClick={resetFilters}>
                  {t("clearFilters")}
                </Button>
              </div>
            ) : (
              // เปลี่ยน sort/ค้นหา = ผลเดิมจางลงระหว่างโหลดชุดใหม่ (keepPreviousData) แทนกลับไปเป็น skeleton
              <FadeIn
                className={`grid grid-cols-3 gap-x-3 gap-y-5 transition-opacity duration-150 ease-soft sm:grid-cols-4 lg:grid-cols-6 ${
                  products.isPlaceholderData ? "pointer-events-none opacity-60" : ""
                }`}
              >
                {filtered.map((p) => (
                  <ShelfTile key={p.id} product={p} />
                ))}
              </FadeIn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Suspense fallback (useSearchParams ยัง resolve ไม่เสร็จตอน prerender) — โครงเดียวกับ CatalogInner
 *  หัวข้อ/หัวกลุ่มเป็นข้อความจริง เดิม fallback=null ทำให้ HTML แรกว่างทั้งหน้าจน hydrate */
function CatalogFallback({ mode }: { mode: CatalogMode }) {
  const t = useTranslations("catalog");
  const copy = COPY_BY_MODE[mode];
  const group = (title: string, rows: number) => (
    <div className="flex flex-wrap gap-2 lg:mb-5 lg:min-w-0 lg:flex-col lg:gap-1">
      <h2 className="w-full text-2xs font-bold tracking-wider text-muted-foreground-strong uppercase lg:mb-2">
        {title}
      </h2>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          aria-hidden
          className="flex h-11 w-24 items-center rounded-full border border-border/60 px-3.5 lg:w-full lg:rounded-[8px] lg:border-transparent lg:px-2.5 lg:py-[7px]"
        >
          <span className="flex h-[21px] items-center">
            <Skeleton className={`h-3 rounded-full ${i % 2 ? "w-14" : "w-20"}`} />
          </span>
        </div>
      ))}
    </div>
  );
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="grid gap-7 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="min-w-0 self-start">
          <div className="flex flex-col gap-4 lg:block">
            {group(t("sidebarPlatform"), 4)}
            {group(t("sidebarSort"), 2)}
            {group(t("sidebarPrice"), 4)}
          </div>
        </aside>
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold tracking-tight">{t(copy.titleKey)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t(copy.subKey)}</p>
          <div className="mt-4 flex items-center gap-3">
            <Skeleton className="h-10 max-w-[320px] flex-1 rounded-[10px]" />
          </div>
          <div className="mt-6">
            <ShelfGridSkeleton
              count={12}
              className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-6"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CatalogPage({ mode }: { mode: CatalogMode }) {
  return (
    <Suspense fallback={<CatalogFallback mode={mode} />}>
      <CatalogInner mode={mode} />
    </Suspense>
  );
}
