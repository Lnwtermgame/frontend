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
  Loader2,
  Monitor,
  Search,
  Signal,
  Smartphone,
  Zap,
} from "lucide-react";
import { motion } from "@/lib/framer-exports";
import { productApi, Product } from "@/lib/services/product-api";
import { Sheet } from "@/components/ui/Sheet";
import { BrandIcon } from "@/components/ui/brand-icon";
import { CountryFlag, getCountryFlagCode } from "@/components/ui/country-flag";
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
  cta: string;
  primaryTitle: string;
  secondaryTitle?: string;
  heroIcon: React.ReactNode;
  primaryHeaderClass: string;
  secondaryHeaderClass: string;
  ctaBgClass: string;
  hoverNameClass: string;
  promoClass: string;
  promoTitle: string;
  promoDescription: string;
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
    image:
      product.imageUrl ||
      `https://placehold.co/400x400?text=${encodeURIComponent(product.name)}`,
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
  const tCommon = useTranslations("Common");

  const modeCopy: Record<string, ModeCopy> = {
    games: {
      title: t("games.title"),
      subtitle: t("games.subtitle"),
      searchPlaceholder: t("search_placeholder"),
      gridTitle: t("games.title"),
      cta: t("cta_topup"),
      primaryTitle: t("filter_category"),
      secondaryTitle: t("filter_category"),
      heroIcon: (
        <Zap
          size={24}
          className="text-site-accent mr-2 drop-shadow-[0_0_8px_rgba(103,176,186,0.6)]"
          fill="currentColor"
        />
      ),
      primaryHeaderClass: "bg-[#1A1C1E]",
      secondaryHeaderClass: "bg-[#1A1C1E]",
      ctaBgClass: "bg-site-accent text-[#1A1C1E]",
      hoverNameClass: "group-hover:text-site-accent",
      promoClass: "bg-site-accent/5 border-site-accent/20",
      promoTitle: t("games.title"),
      promoDescription: t("games.subtitle"),
    },
    "mobile-recharge": {
      title: t("mobile.title"),
      subtitle: t("mobile.subtitle"),
      searchPlaceholder: t("search_placeholder"),
      gridTitle: t("mobile.title"),
      cta: t("cta_topup"),
      primaryTitle: t("filter_category"),
      secondaryTitle: t("filter_category"),
      heroIcon: <Smartphone size={24} className="text-site-accent mr-2" />,
      primaryHeaderClass: "bg-[#1A1C1E]",
      secondaryHeaderClass: "bg-[#1A1C1E]",
      ctaBgClass: "bg-site-accent text-[#1A1C1E]",
      hoverNameClass: "group-hover:text-site-accent",
      promoClass: "bg-site-accent/5 border-site-accent/20",
      promoTitle: t("mobile.title"),
      promoDescription: t("mobile.subtitle"),
    },
    mobile: {
      title: t("mobile.title"),
      subtitle: t("mobile.subtitle"),
      searchPlaceholder: t("search_placeholder"),
      gridTitle: t("mobile.title"),
      cta: t("cta_topup"),
      primaryTitle: t("filter_category"),
      secondaryTitle: t("filter_category"),
      heroIcon: <Smartphone size={24} className="text-site-accent mr-2" />,
      primaryHeaderClass: "bg-[#1A1C1E]",
      secondaryHeaderClass: "bg-[#1A1C1E]",
      ctaBgClass: "bg-site-accent text-[#1A1C1E]",
      hoverNameClass: "group-hover:text-site-accent",
      promoClass: "bg-site-accent/5 border-site-accent/20",
      promoTitle: t("mobile.title"),
      promoDescription: t("mobile.subtitle"),
    },
    card: {
      title: t("card.title"),
      subtitle: t("card.subtitle"),
      searchPlaceholder: t("search_placeholder"),
      gridTitle: t("card.title"),
      cta: t("cta_buy"),
      primaryTitle: t("filter_category"),
      secondaryTitle: undefined,
      heroIcon: <CreditCard size={24} className="text-site-accent mr-2" />,
      primaryHeaderClass: "bg-[#1A1C1E]",
      secondaryHeaderClass: "bg-[#1A1C1E]",
      ctaBgClass: "bg-site-accent text-[#1A1C1E]",
      hoverNameClass: "group-hover:text-site-accent",
      promoClass: "bg-site-accent/5 border-site-accent/20",
      promoTitle: t("card.title"),
      promoDescription: t("card.subtitle"),
    },
  };

  const copy = modeCopy[mode] || modeCopy["games"];
  const searchParams = useSearchParams();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const [selectedPrimary, setSelectedPrimary] = useState("all");
  const [selectedSecondary, setSelectedSecondary] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await productApi.getProducts({
          isActive: true,
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
  }, [mode]);

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
          icon: <Monitor size={16} className="text-white" />,
        },
        {
          id: "console",
          name: "Console",
          count: items.filter((g) =>
            g.platforms.some((p) =>
              ["Console", "PS4", "PS5", "Xbox"].includes(p),
            ),
          ).length,
          icon: <Gamepad2 size={16} className="text-gray-400" />,
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
          icon: <Smartphone size={16} className="text-green-400" />,
          brandIcon: "ais" as const,
        },
        {
          id: "dtac",
          name: "DTAC",
          count: items.filter((p) => p.operator.toLowerCase().includes("dtac"))
            .length,
          icon: <Smartphone size={16} className="text-blue-400" />,
          brandIcon: "dtac" as const,
        },
        {
          id: "true",
          name: "TrueMove",
          count: items.filter((p) => p.operator.toLowerCase().includes("true"))
            .length,
          icon: <Smartphone size={16} className="text-red-400" />,
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
          <CreditCard size={16} className="text-gray-500" />
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
        <motion.div
          className="hidden lg:block w-64 lg:min-w-[256px] shrink-0"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div
            className="bg-[#212328] rounded-[16px] overflow-hidden mb-5 border border-white/5 pb-2"
          >
            <div
              className={`p-4 border-b border-white/5`}
            >
              <h3 className="text-[#a1a1aa] font-medium text-[13px] tracking-wide">
                หมวดหมู่
              </h3>
            </div>

            <div className="py-2 flex flex-col gap-0.5">
              {primaryOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedPrimary(option.id)}
                  className={`w-full flex justify-between items-center text-left px-5 py-2.5 transition-colors group ${selectedPrimary === option.id
                    ? "bg-[#292B30] border-l-[3px] border-site-accent text-white"
                    : "bg-transparent border-l-[3px] border-transparent text-[#a1a1aa] hover:bg-[#292B30] hover:text-white"
                    }`}
                >
                  <span className="flex items-center gap-3 text-[13px] font-medium">
                    {renderOptionIcon(option, selectedPrimary === option.id)}
                    {option.name}
                  </span>
                  <span
                    className={`text-[12px] font-medium ${selectedPrimary === option.id
                      ? "text-gray-300"
                      : "text-gray-500 group-hover:text-gray-400"
                      }`}
                  >
                    {option.count}
                  </span>
                </button>
              ))}
            </div>

            {copy.secondaryTitle && secondaryOptions.length > 0 && (
              <>
                <div className="mx-4 my-2 border-t border-white/5"></div>
                <div className={`p-4 pb-2 border-white/5`}>
                  <h3 className="text-[#a1a1aa] font-medium text-[13px] tracking-wide">
                    {copy.secondaryTitle}
                  </h3>
                </div>

                <div className="py-1 flex flex-col gap-0.5">
                  {secondaryOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedSecondary(option.id)}
                      className={`w-full flex justify-between items-center text-left px-5 py-2.5 transition-colors group ${selectedSecondary === option.id
                        ? "bg-[#292B30] border-l-[3px] border-site-accent text-white"
                        : "bg-transparent border-l-[3px] border-transparent text-[#a1a1aa] hover:bg-[#292B30] hover:text-white"
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
                          ? "text-gray-300"
                          : "text-gray-500 group-hover:text-gray-400"
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
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center text-[13px] text-gray-400 mb-4 sm:mb-6 pl-1 font-medium">
            <Link href="/" className="hover:text-white transition-colors cursor-pointer">Lnwtermgame</Link>
            <span className="mx-2">/</span>
            <span className="text-white truncate">{copy.title}</span>
          </div>

          <motion.div
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 bg-[#212328] border border-white/5 rounded-2xl p-6 relative overflow-hidden mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative z-10">
              <h1 className="text-white text-xl md:text-2xl font-bold flex items-center tracking-tight mb-1">
                {copy.heroIcon}
                {copy.title}
              </h1>
              <p className="text-[#a1a1aa] text-[13px] md:text-[14px] leading-relaxed max-w-lg">{copy.subtitle}</p>
            </div>

            <div className="flex items-center gap-3 relative z-10 w-full md:w-auto">
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  placeholder={copy.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#181A1D] border border-transparent hover:border-white/10 text-white text-[13px] rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-site-accent transition-all placeholder:text-gray-600"
                />
                <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
              </div>

              <button
                onClick={() => setIsFilterOpen(true)}
                className="lg:hidden shrink-0 bg-[#181A1D] text-gray-300 hover:text-white rounded-xl text-sm px-4 py-3 flex items-center gap-2 transition-all font-semibold"
              >
                <Filter size={18} />
              </button>
            </div>
          </motion.div>

          <div className="lg:hidden mt-2 -mx-5 px-5 space-y-2 mb-4">
            <div className="overflow-x-auto scrollbar-hide flex gap-2 pb-1">
              {primaryOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedPrimary(option.id)}
                  className={`whitespace-nowrap px-4 py-2 text-xs font-medium transition-all flex items-center gap-2 rounded-xl ${selectedPrimary === option.id
                    ? "bg-[#292B30] border-b-2 border-site-accent text-white shadow-sm"
                    : "bg-[#212328] border-b-2 border-transparent text-[#a1a1aa] hover:text-white"
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
                    className={`whitespace-nowrap px-4 py-2 text-xs font-medium transition-all flex items-center gap-2 rounded-xl ${selectedSecondary === option.id
                      ? "bg-[#292B30] border-b-2 border-site-accent text-white shadow-sm"
                      : "bg-[#212328] border-b-2 border-transparent text-[#a1a1aa] hover:text-white"
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

          <motion.div
            className="mt-6 md:mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h2 className="text-white text-[15px] font-bold flex items-center mb-4 md:mb-5">
              {copy.gridTitle}
              <span className="ml-3 text-[13px] font-medium text-[#a1a1aa] bg-[#292B30] px-2 py-0.5 rounded-full">
                {filteredItems.length}
              </span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                  className="min-w-0"
                >
                  <Link href={getItemLink(mode as any, item.slug)}>
                    {/* The SEAGM specific grid card design */}
                    <div className="group flex flex-col cursor-pointer transition-all h-full bg-[#1C1E22] hover:bg-[#292B2E] rounded-[16px] p-2.5 pb-4 border border-white/5 transition-colors">
                      <div className="relative w-full aspect-square object-cover mb-3 rounded-[12px] overflow-hidden bg-[#181A1D]">

                        {item.discountPercent ? (
                          <div className="absolute top-2 left-2 bg-site-accent px-1.5 py-0.5 rounded text-[10px] font-bold text-[#1A1C1E] shadow-sm z-10 transition-opacity">
                            -{item.discountPercent}%
                          </div>
                        ) : null}

                        <img
                          src={item.image}
                          alt={mode === "mobile-recharge" || mode === "mobile" ? item.operator : item.title}
                          className="w-full h-full object-cover text-[0px] text-transparent transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>

                      <div className="flex flex-col flex-1 px-1 justify-between">
                        <h3 className={`text-white text-[12px] sm:text-[13px] font-medium leading-[1.4] break-words ${mode === "card" ? "line-clamp-2" : "line-clamp-2"}`}>
                          {mode === "mobile-recharge" || mode === "mobile" ? item.operator : item.title}
                        </h3>

                        {/* SEAGM Subtitle Line: Icons + Text */}
                        <div className="flex items-center text-[#a1a1aa] text-[10px] sm:text-[11px] mt-1.5 line-clamp-1 gap-1.5 pt-1">
                          <div className="shrink-0 flex items-center justify-center">
                            <CountryFlag code={getCountryFlagCode(item.country)} size="S" />
                          </div>
                          <span className="truncate">{mode === "games" ? item.publisher : mode === "card" ? item.category : item.country}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {filteredItems.length === 0 && !loading && (
              <div className="text-center py-16 bg-[#222427] border border-site-border rounded-2xl w-full">
                <Globe size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-300 font-bold text-lg">{t("no_results")}</p>
                <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">
                  {t("no_results_desc")}
                </p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center p-20 bg-[#222427] border border-site-border rounded-2xl">
                <Loader2 className="w-10 h-10 text-site-accent animate-spin mb-4" />
                <p className="text-gray-400 font-medium text-sm tracking-wide uppercase">{t("loading")}</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <Sheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title={t("filter_category")}
      >
        <div className="space-y-6">
          <div>
            <h3 className="font-bold mb-3">{copy.primaryTitle}</h3>
            <div className="space-y-2">
              {primaryOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setSelectedPrimary(option.id);
                    setIsFilterOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border font-bold transition-all ${selectedPrimary === option.id
                    ? "bg-[#1A1C1E] border-site-accent text-site-accent shadow-sm"
                    : "bg-[#222427] border-site-border text-gray-400 hover:text-white"
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
                  <span className="text-sm text-gray-500">
                    ({option.count})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {copy.secondaryTitle && secondaryOptions.length > 0 && (
            <div>
              <h3 className="font-bold mb-3">{copy.secondaryTitle}</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {secondaryOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSelectedSecondary(option.id);
                      setIsFilterOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border font-bold transition-all ${selectedSecondary === option.id
                      ? "bg-[#1A1C1E] border-site-accent text-site-accent shadow-sm"
                      : "bg-[#222427] border-site-border text-gray-400 hover:text-white"
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
                      <span className="text-sm text-gray-500">
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
    </div >
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
    <span className={isActive ? "text-site-accent" : "text-gray-400 group-hover:text-gray-300"}>
      {option.icon}
    </span>
  );
}
