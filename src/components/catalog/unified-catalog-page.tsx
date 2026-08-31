"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Check,
  CreditCard,
  Filter,
  Gamepad2,
  Globe,
  Monitor,
  PackageOpen,
  Search,
  Signal,
  Smartphone,
} from "lucide-react";
import { productApi, Product } from "@/lib/services/product-api";
import { productImage } from "@/lib/product-image";
import { Sheet } from "@/components/ui/Sheet";
import { BrandIcon } from "@/components/ui/brand-icon";
import { CountryFlag, getCountryFlagCode } from "@/components/ui/country-flag";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { SkeletonGameTile } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslations } from "next-intl";

type CatalogMode = "games" | "mobile-recharge" | "mobile" | "card";

type FilterOption = {
  id: string;
  name: string;
  count: number;
  icon?: React.ReactNode;
  brandIcon?: "ais" | "dtac" | "true";
};

type CatalogItem = {
  id: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  discountPercent?: number;
  autoDelivery?: boolean;
  country: string;
  category: string;
  publisher: string;
  operator: string;
  platforms: string[];
};

type ModeCopy = {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  gridTitle: string;
  primaryTitle: string;
  secondaryTitle?: string;
};

function getProductType(mode: CatalogMode): Product["productType"] {
  if (mode === "games") return "DIRECT_TOPUP";
  if (mode === "mobile-recharge" || mode === "mobile") return "MOBILE_RECHARGE";
  return "CARD";
}

function toCountry(regionRaw: string, categoryName: string): string {
  const raw = (regionRaw || categoryName || "Global").toLowerCase();
  const countryMap: Record<string, string> = {
    th: "Thailand",
    my: "Malaysia",
    sg: "Singapore",
    id: "Indonesia",
    ph: "Philippines",
    vn: "Vietnam",
    cn: "China",
    us: "United States",
    global: "Global",
    world: "Global",
    thailand: "Thailand",
    malaysia: "Malaysia",
    singapore: "Singapore",
    indonesia: "Indonesia",
    philippines: "Philippines",
    vietnam: "Vietnam",
    china: "China",
    "united states": "United States",
    "mobile-recharge-th": "Thailand",
    "mobile-recharge-my": "Malaysia",
    "mobile-recharge-sg": "Singapore",
    "mobile-recharge-id": "Indonesia",
    "mobile-recharge-ph": "Philippines",
    "mobile-recharge-vn": "Vietnam",
    "mobile-recharge-cn": "China",
  };

  return (
    countryMap[raw] ||
    countryMap[raw.replace(/\(.*\)/, "").trim()] ||
    regionRaw ||
    categoryName ||
    "Global"
  );
}

function transformProduct(product: Product): CatalogItem {
  const types = product.types || [];
  const validPrices = types
    .filter((t) => t.displayPrice && Number(t.displayPrice) > 0)
    .map((t) => Number(t.displayPrice));
  const startingPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;

  const discountRates = types
    .map((t) =>
      typeof t.discountRate === "number" ? Number(t.discountRate) : undefined,
    )
    .filter((v): v is number => v !== undefined && !Number.isNaN(v));

  return {
    id: product.id,
    slug: product.slug,
    title: product.name,
    image: productImage(product.name, product.imageUrl),
    price: startingPrice,
    discountPercent:
      discountRates.length > 0 ? Math.max(...discountRates) : undefined,
    autoDelivery: product.gameDetails?.autoDelivery ?? true,
    country: toCountry(
      product.gameDetails?.region || "",
      product.category?.name || "",
    ),
    category: product.category?.name || "General",
    publisher:
      product.gameDetails?.publisher ||
      product.gameDetails?.developer ||
      product.category?.name ||
      "Unknown",
    operator: product.name.split("(")[0]?.trim() || product.name,
    platforms: product.gameDetails?.platforms || [],
  };
}

function sortThailandFirst<T extends { id: string; name: string }>(
  items: T[],
): T[] {
  const clone = [...items];

  // Pin Global right after "all" (position 1)
  const globalIdx = clone.findIndex(
    (item) =>
      item.name.toLowerCase() === "global" ||
      item.id.toLowerCase() === "global",
  );
  if (globalIdx > 1) {
    const [globalItem] = clone.splice(globalIdx, 1);
    clone.splice(1, 0, globalItem);
  }

  // Pin Thailand right after Global (position 2)
  const thaiIdx = clone.findIndex(
    (item) =>
      item.name.toLowerCase().includes("thailand") ||
      item.id.toLowerCase().includes("thailand"),
  );
  if (thaiIdx > 2) {
    const [thaiItem] = clone.splice(thaiIdx, 1);
    clone.splice(2, 0, thaiItem);
  }
  return clone;
}

function getItemLink(mode: CatalogMode, slug: string): string {
  if (mode === "games") return `/games/${slug}`;
  if (mode === "mobile-recharge" || mode === "mobile")
    return `/mobile-recharge/${slug}`;
  return `/card/${slug}`;
}

export function UnifiedCatalogPage({ mode }: { mode: CatalogMode }) {
  const t = useTranslations("Catalog");

  const modeCopy: Record<string, ModeCopy> = {
    games: {
      title: t("games.title"),
      subtitle: t("games.subtitle"),
      searchPlaceholder: t("search_placeholder"),
      gridTitle: t("games.title"),
      primaryTitle: t("filter_category"),
      secondaryTitle: t("filter_category"),
    },
    "mobile-recharge": {
      title: t("mobile.title"),
      subtitle: t("mobile.subtitle"),
      searchPlaceholder: t("search_placeholder"),
      gridTitle: t("mobile.title"),
      primaryTitle: t("filter_category"),
      secondaryTitle: t("filter_category"),
    },
    mobile: {
      title: t("mobile.title"),
      subtitle: t("mobile.subtitle"),
      searchPlaceholder: t("search_placeholder"),
      gridTitle: t("mobile.title"),
      primaryTitle: t("filter_category"),
      secondaryTitle: t("filter_category"),
    },
    card: {
      title: t("card.title"),
      subtitle: t("card.subtitle"),
      searchPlaceholder: t("search_placeholder"),
      gridTitle: t("card.title"),
      primaryTitle: t("filter_category"),
      secondaryTitle: undefined,
    },
  };

  const copy = modeCopy[mode] || modeCopy["games"];
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") || "";
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [selectedPrimary, setSelectedPrimary] = useState("all");
  const [selectedSecondary, setSelectedSecondary] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        // Search hits the server so results are never capped to one page.
        const response = await productApi.getProducts({
          isActive: true,
          search: urlSearch || undefined,
          limit: 100,
          sortBy: "salesCount",
          sortOrder: "desc",
        });

        if (!response.success) {
          setItems([]);
          return;
        }

        const mapped = response.data
          .filter((p) => p.productType === getProductType(mode))
          .map(transformProduct);

        setItems(mapped);
      } catch (error) {
        console.error(`Failed to fetch ${mode} catalog:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [mode, urlSearch]);

  useEffect(() => {
    const query = searchParams.get("search");
    if (query !== null) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  const primaryOptions = useMemo(() => {
    if (mode === "games") {
      return [
        {
          id: "all",
          name: t("sort.all"),
          count: items.length,
          icon: <Gamepad2 size={16} />,
        },
        {
          id: "mobile",
          name: t("mobile.title"),
          count: items.filter((g) =>
            g.platforms.some((p) => ["Mobile", "Android", "iOS"].includes(p)),
          ).length,
          icon: <Smartphone size={16} className="text-site-accent" />,
        },
        {
          id: "pc",
          name: "PC",
          count: items.filter((g) =>
            g.platforms.some((p) => ["PC", "Mac"].includes(p)),
          ).length,
          icon: <Monitor size={16} className="text-site-text" />,
        },
        {
          id: "console",
          name: "Console",
          count: items.filter((g) =>
            g.platforms.some((p) =>
              ["Console", "PS4", "PS5", "Xbox"].includes(p),
            ),
          ).length,
          icon: <Gamepad2 size={16} className="text-site-muted" />,
        },
      ];
    }

    if (mode === "mobile-recharge" || mode === "mobile") {
      return [
        {
          id: "all",
          name: t("sort.all"),
          count: items.length,
          icon: <Signal size={16} />,
        },
        {
          id: "ais",
          name: "AIS",
          count: items.filter((p) => p.operator.toLowerCase().includes("ais"))
            .length,
          icon: <Smartphone size={16} className="text-status-success" />,
          brandIcon: "ais" as const,
        },
        {
          id: "dtac",
          name: "DTAC",
          count: items.filter((p) => p.operator.toLowerCase().includes("dtac"))
            .length,
          icon: <Smartphone size={16} className="text-status-info" />,
          brandIcon: "dtac" as const,
        },
        {
          id: "true",
          name: "TrueMove",
          count: items.filter((p) => p.operator.toLowerCase().includes("true"))
            .length,
          icon: <Smartphone size={16} className="text-status-danger" />,
          brandIcon: "true" as const,
        },
      ];
    }

    const categoryCounts = items.reduce(
      (acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return sortThailandFirst([
      {
        id: "all",
        name: t("sort.all"),
        count: items.length,
        icon: <CreditCard size={16} />,
      },
      ...Object.entries(categoryCounts).map(([name, count]) => ({
        id: name.toLowerCase(),
        name,
        count,
        icon: getCountryFlagCode(name) ? (
          <CountryFlag code={getCountryFlagCode(name)} size="M" />
        ) : (
          <CreditCard size={16} className="text-site-dim" />
        ),
      })),
    ]);
  }, [mode, items, t]);

  const secondaryOptions = useMemo(() => {
    if (mode === "games") {
      const categoryCounts = items.reduce(
        (acc, item) => {
          acc[item.category] = (acc[item.category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );
      return sortThailandFirst([
        { id: "all", name: t("sort.all"), count: items.length },
        ...Object.entries(categoryCounts).map(([name, count]) => ({
          id: name.toLowerCase(),
          name,
          count,
        })),
      ]);
    }

    if (mode === "mobile-recharge" || mode === "mobile") {
      const countryCounts = items.reduce(
        (acc, item) => {
          acc[item.country] = (acc[item.country] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      return sortThailandFirst([
        { id: "all", name: t("sort.all"), count: items.length },
        ...Object.entries(countryCounts).map(([name, count]) => ({
          id: name,
          name,
          count,
        })),
      ]);
    }

    return [];
  }, [mode, items, t]);

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesSearch =
          !searchQuery ||
          item.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPrimary = filterItemByPrimary(
          mode as any,
          item,
          selectedPrimary,
        );
        const matchesSecondary = filterItemBySecondary(
          mode as any,
          item,
          selectedSecondary,
        );
        return matchesSearch && matchesPrimary && matchesSecondary;
      }),
    [items, mode, searchQuery, selectedPrimary, selectedSecondary],
  );

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-6 min-w-0">
        {/* Desktop sidebar */}
        <div className="hidden lg:block w-64 lg:min-w-[256px] shrink-0">
          <div className="bg-site-raised rounded-8 overflow-hidden mb-5 border border-site-border-soft pb-2">
            <div className="p-4 border-b border-site-border-soft">
              <h3 className="text-site-muted font-medium text-[13px] tracking-wide">
                {t("filter_category")}
              </h3>
            </div>

            <div className="py-2 flex flex-col gap-0.5">
              {primaryOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedPrimary(option.id)}
                  aria-pressed={selectedPrimary === option.id}
                  className={`w-full flex justify-between items-center text-left px-5 py-2.5 transition-colors group ${selectedPrimary === option.id
                    ? "bg-site-surface border-l-[3px] border-site-accent text-site-text"
                    : "bg-transparent border-l-[3px] border-transparent text-site-muted hover:bg-site-surface hover:text-site-text"
                    }`}
                >
                  <span className="flex items-center gap-3 text-[13px] font-medium">
                    {renderOptionIcon(option, selectedPrimary === option.id)}
                    {option.name}
                  </span>
                  <span
                    className={`text-[12px] font-medium ${selectedPrimary === option.id
                      ? "text-site-muted"
                      : "text-site-dim group-hover:text-site-muted"
                      }`}
                  >
                    {option.count}
                  </span>
                </button>
              ))}
            </div>

            {copy.secondaryTitle && secondaryOptions.length > 0 && (
              <>
                <div className="mx-4 my-2 border-t border-site-border-soft"></div>
                <div className="p-4 pb-2">
                  <h3 className="text-site-muted font-medium text-[13px] tracking-wide">
                    {copy.secondaryTitle}
                  </h3>
                </div>

                <div className="py-1 flex flex-col gap-0.5">
                  {secondaryOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedSecondary(option.id)}
                      aria-pressed={selectedSecondary === option.id}
                      className={`w-full flex justify-between items-center text-left px-5 py-2.5 transition-colors group ${selectedSecondary === option.id
                        ? "bg-site-surface border-l-[3px] border-site-accent text-site-text"
                        : "bg-transparent border-l-[3px] border-transparent text-site-muted hover:bg-site-surface hover:text-site-text"
                        }`}
                    >
                      <span className="flex items-center gap-3 text-[13px] font-medium">
                        {getCountryFlagCode(option.name) && (
                          <CountryFlag
                            code={getCountryFlagCode(option.name)}
                            size="M"
                          />
                        )}
                        {option.name}
                      </span>
                      <span
                        className={`text-[12px] font-medium ${selectedSecondary === option.id
                          ? "text-site-muted"
                          : "text-site-dim group-hover:text-site-muted"
                          }`}
                      >
                        {option.count}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {/* Breadcrumb */}
          <div className="flex items-center text-[12px] text-site-dim mb-4 sm:mb-6 pl-1 font-medium">
            <Link href="/" className="hover:text-site-text transition-colors cursor-pointer">Lnwtermgame</Link>
            <span className="mx-2">/</span>
            <span className="text-site-text truncate">{copy.title}</span>
          </div>

          {/* Page header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 bg-site-raised border border-site-border-soft rounded-8 p-6 mb-6">
            <div>
              <SectionHeader level={1} title={copy.title} />
              <p className="text-site-muted text-[13px] md:text-[14px] leading-relaxed max-w-lg">{copy.subtitle}</p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  placeholder={copy.searchPlaceholder}
                  aria-label={copy.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="site-input !h-9 w-full pl-11 pr-4 text-[13px]"
                />
                <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-site-dim" />
              </div>

              <button
                onClick={() => setIsFilterOpen(true)}
                className="lg:hidden shrink-0 bg-site-surface text-site-muted hover:text-site-text rounded-6 text-sm px-4 py-2 flex items-center gap-2 transition-colors font-semibold border border-site-border-soft"
              >
                <Filter size={18} />
              </button>
            </div>
          </div>

          {/* Mobile filter chips */}
          <div className="lg:hidden mt-2 -mx-5 px-5 space-y-2 mb-4">
            <div className="overflow-x-auto scrollbar-hide flex gap-2 pb-1">
              {primaryOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedPrimary(option.id)}
                  aria-pressed={selectedPrimary === option.id}
                  className={`whitespace-nowrap px-3 py-1.5 text-[12px] font-semibold transition-colors flex items-center gap-2 rounded-6 border ${selectedPrimary === option.id
                    ? "bg-site-accent text-site-bg border-transparent"
                    : "bg-site-surface text-site-muted border-site-border-soft hover:text-site-text"
                    }`}
                >
                  {renderOptionIcon(
                    option,
                    selectedPrimary === option.id,
                    true,
                  )}
                  {option.name}
                </button>
              ))}
            </div>

            {copy.secondaryTitle && secondaryOptions.length > 0 && (
              <div className="overflow-x-auto scrollbar-hide flex gap-2 pb-1">
                {secondaryOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedSecondary(option.id)}
                    aria-pressed={selectedSecondary === option.id}
                    className={`whitespace-nowrap px-3 py-1.5 text-[12px] font-semibold transition-colors flex items-center gap-2 rounded-6 border ${selectedSecondary === option.id
                      ? "bg-site-accent text-site-bg border-transparent"
                      : "bg-site-surface text-site-muted border-site-border-soft hover:text-site-text"
                      }`}
                  >
                    {(mode === "mobile-recharge" || mode === "mobile") &&
                      option.id === "all" ? (
                      <>
                        <Globe size={14} />
                        {option.name}
                      </>
                    ) : (
                      <>
                        {getCountryFlagCode(option.name) && (
                          <CountryFlag
                            code={getCountryFlagCode(option.name)}
                            size="S"
                          />
                        )}
                        {option.name}
                      </>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Grid section */}
          <div className="mt-6 md:mt-8">
            <div className="flex items-center gap-3 mb-4 md:mb-5">
              <SectionHeader level={2} title={copy.gridTitle} />
              <Badge variant="neutral">{filteredItems.length}</Badge>
            </div>

            {loading && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <SkeletonGameTile key={i} />
                ))}
              </div>
            )}

            {!loading && filteredItems.length === 0 && (
              <EmptyState icon={PackageOpen} message={t("no_results")} description={t("no_results_desc")} />
            )}

            {!loading && filteredItems.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                {filteredItems.map((item) => (
                  <div key={item.id} className="min-w-0">
                    <Link href={getItemLink(mode as any, item.slug)} className="group block">
                      <div className="flex flex-col items-center">
                        <div className="relative w-full aspect-square rounded-8 overflow-hidden bg-site-raised border border-site-border-soft">
                          {item.discountPercent ? (
                            <div className="absolute top-2 left-2 z-10">
                              <Badge variant="success">-{item.discountPercent}%</Badge>
                            </div>
                          ) : null}

                          <img
                            src={item.image}
                            alt={mode === "mobile-recharge" || mode === "mobile" ? item.operator : item.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>

                        <h3 className="mt-2 text-[13px] text-center text-site-text font-bold line-clamp-2 group-hover:text-site-accent transition-colors">
                          {mode === "mobile-recharge" || mode === "mobile" ? item.operator : item.title}
                        </h3>

                        <div className="flex items-center gap-1 text-[11px] text-site-dim text-center mt-0.5">
                          <CountryFlag code={getCountryFlagCode(item.country)} size="S" />
                          <span className="truncate">{mode === "games" ? item.publisher : mode === "card" ? item.category : item.country}</span>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Sheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title={t("filter_category")}
      >
        <div className="space-y-6">
          <div>
            <h3 className="font-bold mb-3 text-site-text">{copy.primaryTitle}</h3>
            <div className="space-y-2">
              {primaryOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setSelectedPrimary(option.id);
                    setIsFilterOpen(false);
                  }}
                  aria-pressed={selectedPrimary === option.id}
                  className={`w-full flex items-center justify-between p-3.5 rounded-6 border font-bold transition-colors ${selectedPrimary === option.id
                    ? "bg-site-surface border-site-accent text-site-accent"
                    : "bg-site-raised border-site-border-soft text-site-muted hover:text-site-text"
                    }`}
                >
                  <span className="flex items-center gap-2">
                    {renderOptionIcon(
                      option,
                      selectedPrimary === option.id,
                      true,
                    )}
                    {option.name}
                  </span>
                  <span className="text-sm text-site-dim">
                    ({option.count})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {copy.secondaryTitle && secondaryOptions.length > 0 && (
            <div>
              <h3 className="font-bold mb-3 text-site-text">{copy.secondaryTitle}</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {secondaryOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSelectedSecondary(option.id);
                      setIsFilterOpen(false);
                    }}
                    aria-pressed={selectedSecondary === option.id}
                    className={`w-full flex items-center justify-between p-3.5 rounded-6 border font-bold transition-colors ${selectedSecondary === option.id
                      ? "bg-site-surface border-site-accent text-site-accent"
                      : "bg-site-raised border-site-border-soft text-site-muted hover:text-site-text"
                      }`}
                  >
                    <span className="flex items-center gap-2">
                      {getCountryFlagCode(option.name) && (
                        <CountryFlag
                          code={getCountryFlagCode(option.name)}
                          size="S"
                        />
                      )}
                      {option.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-site-dim">
                        ({option.count})
                      </span>
                      {selectedSecondary === option.id && <Check size={16} />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Sheet>
    </div>
  );
}

function filterItemByPrimary(
  mode: CatalogMode,
  item: CatalogItem,
  selected: string,
): boolean {
  if (selected === "all") return true;

  if (mode === "games") {
    if (selected === "mobile") {
      return item.platforms.some((p) =>
        ["Mobile", "Android", "iOS"].includes(p),
      );
    }
    if (selected === "pc") {
      return item.platforms.some((p) => ["PC", "Mac"].includes(p));
    }
    if (selected === "console") {
      return item.platforms.some((p) =>
        ["Console", "PS4", "PS5", "Xbox"].includes(p),
      );
    }
    return true;
  }

  if (mode === "mobile-recharge" || mode === "mobile") {
    return item.operator.toLowerCase().includes(selected);
  }

  return item.category.toLowerCase() === selected.toLowerCase();
}

function filterItemBySecondary(
  mode: CatalogMode,
  item: CatalogItem,
  selected: string,
): boolean {
  if (selected === "all") return true;
  if (mode === "games")
    return item.category.toLowerCase() === selected.toLowerCase();
  if (mode === "mobile-recharge" || mode === "mobile")
    return item.country === selected;
  return true;
}

function renderOptionIcon(
  option: FilterOption,
  isActive: boolean,
  compact = false,
): React.ReactNode {
  const brandSize = compact ? 20 : 39;

  if (option.brandIcon) {
    return (
      <BrandIcon
        brand={option.brandIcon}
        size={brandSize}
        fallbackIcon={option.icon}
      />
    );
  }

  if (!option.icon) return null;
  return (
    <span className={isActive ? "text-site-accent" : "text-site-muted group-hover:text-site-text"}>
      {option.icon}
    </span>
  );
}
