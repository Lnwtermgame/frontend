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

type CatalogMode = "games" | "mobile-recharge" | "card";

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

const modeCopy: Record<CatalogMode, ModeCopy> = {
  games: {
    title: "เติมเกมโดยตรง",
    subtitle: "เติมเกมโปรดของคุณได้ทันที",
    searchPlaceholder: "ค้นหาเกม...",
    gridTitle: "เกมทั้งหมด",
    cta: "เติมเกมเลย",
    primaryTitle: "แพลตฟอร์ม",
    secondaryTitle: "หมวดหมู่",
    heroIcon: (
      <Zap size={24} className="text-brutal-yellow mr-2" fill="currentColor" />
    ),
    primaryHeaderClass: "bg-brutal-blue",
    secondaryHeaderClass: "bg-brutal-yellow",
    ctaBgClass: "bg-brutal-yellow text-black",
    hoverNameClass: "group-hover:text-brutal-pink",
    promoClass: "bg-brutal-green",
    promoTitle: "โบนัสเติมเกม",
    promoDescription: "รับโบนัสพิเศษสำหรับการเติมครั้งแรก",
  },
  "mobile-recharge": {
    title: "เติมเงินมือถือ",
    subtitle: "เติมได้ทุกเครือข่าย รวดเร็วและปลอดภัย",
    searchPlaceholder: "ค้นหาเครือข่าย...",
    gridTitle: "เครือข่ายทั้งหมด",
    cta: "เติมเงิน",
    primaryTitle: "เครือข่าย",
    secondaryTitle: "ประเทศ",
    heroIcon: <Smartphone size={24} className="text-brutal-green mr-2" />,
    primaryHeaderClass: "bg-brutal-blue",
    secondaryHeaderClass: "bg-brutal-green",
    ctaBgClass: "bg-brutal-green text-black",
    hoverNameClass: "group-hover:text-brutal-green",
    promoClass: "bg-brutal-yellow",
    promoTitle: "เติมด่วน",
    promoDescription: "ระบบเติมเงินอัตโนมัติภายในไม่กี่นาที",
  },
  card: {
    title: "บัตรเติมเงิน & Gift Card",
    subtitle: "เลือกซื้อบัตรได้ทันที",
    searchPlaceholder: "ค้นหาบัตร...",
    gridTitle: "บัตรทั้งหมด",
    cta: "ซื้อบัตร",
    primaryTitle: "ประเภทบัตร",
    secondaryTitle: undefined,
    heroIcon: <CreditCard size={24} className="text-brutal-pink mr-2" />,
    primaryHeaderClass: "bg-brutal-yellow",
    secondaryHeaderClass: "bg-brutal-yellow",
    ctaBgClass: "bg-brutal-pink text-white",
    hoverNameClass: "group-hover:text-brutal-pink",
    promoClass: "bg-brutal-pink",
    promoTitle: "โปรโมชันบัตร",
    promoDescription: "ดีลพิเศษสำหรับบัตรเกมและบัตรเติมเงิน",
  },
};

function getProductType(mode: CatalogMode): Product["productType"] {
  if (mode === "games") return "DIRECT_TOPUP";
  if (mode === "mobile-recharge") return "MOBILE_RECHARGE";
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
  const idx = clone.findIndex(
    (item) =>
      item.name.toLowerCase().includes("thailand") ||
      item.id.toLowerCase().includes("thailand"),
  );
  if (idx > 1) {
    const [thaiItem] = clone.splice(idx, 1);
    clone.splice(1, 0, thaiItem);
  }
  return clone;
}

function createPrimaryOptions(
  mode: CatalogMode,
  items: CatalogItem[],
): FilterOption[] {
  if (mode === "games") {
    return [
      {
        id: "all",
        name: "ทุกแพลตฟอร์ม",
        count: items.length,
        icon: <Gamepad2 size={16} />,
      },
      {
        id: "mobile",
        name: "มือถือ",
        count: items.filter((g) =>
          g.platforms.some((p) => ["Mobile", "Android", "iOS"].includes(p)),
        ).length,
        icon: <Smartphone size={16} className="text-brutal-green" />,
      },
      {
        id: "pc",
        name: "PC",
        count: items.filter((g) =>
          g.platforms.some((p) => ["PC", "Mac"].includes(p)),
        ).length,
        icon: <Monitor size={16} className="text-brutal-blue" />,
      },
      {
        id: "console",
        name: "Console",
        count: items.filter((g) =>
          g.platforms.some((p) =>
            ["Console", "PS4", "PS5", "Xbox"].includes(p),
          ),
        ).length,
        icon: <Gamepad2 size={16} className="text-brutal-pink" />,
      },
    ];
  }

  if (mode === "mobile-recharge") {
    return [
      {
        id: "all",
        name: "ทุกเครือข่าย",
        count: items.length,
        icon: <Signal size={16} />,
      },
      {
        id: "ais",
        name: "AIS",
        count: items.filter((p) => p.operator.toLowerCase().includes("ais"))
          .length,
        icon: <Smartphone size={16} className="text-brutal-blue" />,
        brandIcon: "ais",
      },
      {
        id: "dtac",
        name: "DTAC",
        count: items.filter((p) => p.operator.toLowerCase().includes("dtac"))
          .length,
        icon: <Smartphone size={16} className="text-brutal-pink" />,
        brandIcon: "dtac",
      },
      {
        id: "true",
        name: "TrueMove",
        count: items.filter((p) => p.operator.toLowerCase().includes("true"))
          .length,
        icon: <Smartphone size={16} className="text-brutal-yellow" />,
        brandIcon: "true",
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

  return [
    {
      id: "all",
      name: "บัตรทั้งหมด",
      count: items.length,
      icon: <CreditCard size={16} />,
    },
    ...Object.entries(categoryCounts).map(([name, count]) => ({
      id: name.toLowerCase(),
      name,
      count,
      icon: <CreditCard size={16} className="text-gray-500" />,
    })),
  ];
}

function createSecondaryOptions(
  mode: CatalogMode,
  items: CatalogItem[],
): FilterOption[] {
  if (mode === "games") {
    const categoryCounts = items.reduce(
      (acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    return [
      { id: "all", name: "เกมทั้งหมด", count: items.length },
      ...Object.entries(categoryCounts).map(([name, count]) => ({
        id: name.toLowerCase(),
        name,
        count,
      })),
    ];
  }

  if (mode === "mobile-recharge") {
    const countryCounts = items.reduce(
      (acc, item) => {
        acc[item.country] = (acc[item.country] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return sortThailandFirst([
      { id: "all", name: "ทุกประเทศ", count: items.length },
      ...Object.entries(countryCounts).map(([name, count]) => ({
        id: name,
        name,
        count,
      })),
    ]);
  }

  return [];
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

  if (mode === "mobile-recharge") {
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
  if (mode === "mobile-recharge") return item.country === selected;
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
    <span className={isActive ? "text-black" : "text-gray-500"}>
      {option.icon}
    </span>
  );
}

function getItemLink(mode: CatalogMode, slug: string): string {
  if (mode === "games") return `/games/${slug}`;
  if (mode === "mobile-recharge") return `/mobile-recharge/${slug}`;
  return `/card/${slug}`;
}

export function UnifiedCatalogPage({ mode }: { mode: CatalogMode }) {
  const copy = modeCopy[mode];
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

  const primaryOptions = useMemo(
    () => createPrimaryOptions(mode, items),
    [mode, items],
  );
  const secondaryOptions = useMemo(
    () => createSecondaryOptions(mode, items),
    [mode, items],
  );

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesSearch =
          !searchQuery ||
          item.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPrimary = filterItemByPrimary(mode, item, selectedPrimary);
        const matchesSecondary = filterItemBySecondary(
          mode,
          item,
          selectedSecondary,
        );
        return matchesSearch && matchesPrimary && matchesSecondary;
      }),
    [items, mode, searchQuery, selectedPrimary, selectedSecondary],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6 min-w-0">
        <motion.div
          className="hidden lg:block w-64 lg:min-w-[256px] shrink-0"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div
            className="bg-white border-[3px] border-black overflow-hidden mb-4"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div
              className={`p-4 border-b-[3px] border-black ${copy.primaryHeaderClass}`}
            >
              <h3 className="text-black font-black text-base flex items-center">
                {mode === "mobile-recharge" ? (
                  <Signal size={18} className="mr-2" />
                ) : (
                  <Filter size={18} className="mr-2" />
                )}
                {copy.primaryTitle}
              </h3>
            </div>

            <div className="p-3 space-y-1">
              {primaryOptions.map((option) => (
                <motion.button
                  key={option.id}
                  onClick={() => setSelectedPrimary(option.id)}
                  className={`w-full flex justify-between items-center text-left p-3 transition-all border-[2px] ${
                    selectedPrimary === option.id
                      ? "bg-brutal-blue border-black text-black"
                      : "bg-white border-transparent text-gray-700 hover:border-gray-300"
                  }`}
                  style={
                    selectedPrimary === option.id
                      ? { boxShadow: "3px 3px 0 0 #000000" }
                      : undefined
                  }
                  whileHover={{ x: 3 }}
                >
                  <span className="flex items-center gap-3 text-sm font-bold">
                    {renderOptionIcon(option, selectedPrimary === option.id)}
                    {option.name}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold border-[2px] border-black ${
                      selectedPrimary === option.id
                        ? "bg-white text-black"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {option.count}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {copy.secondaryTitle && (
            <div
              className="bg-white border-[3px] border-black overflow-hidden mb-4"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
            >
              <div
                className={`p-4 border-b-[3px] border-black ${copy.secondaryHeaderClass}`}
              >
                <h3 className="text-black font-black text-base flex items-center">
                  <Globe size={18} className="mr-2" />
                  {copy.secondaryTitle}
                </h3>
              </div>

              <div className="p-3 space-y-1">
                {secondaryOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    onClick={() => setSelectedSecondary(option.id)}
                    className={`w-full flex justify-between items-center text-left p-3 transition-all border-[2px] ${
                      selectedSecondary === option.id
                        ? "bg-brutal-yellow border-black text-black"
                        : "bg-white border-transparent text-gray-700 hover:border-gray-300"
                    }`}
                    style={
                      selectedSecondary === option.id
                        ? { boxShadow: "3px 3px 0 0 #000000" }
                        : undefined
                    }
                    whileHover={{ x: 3 }}
                  >
                    <span className="flex items-center gap-3 text-sm font-bold">
                      {getCountryFlagCode(option.name) && (
                        <CountryFlag
                          code={getCountryFlagCode(option.name)}
                          size="M"
                        />
                      )}
                      {option.name}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold border-[2px] border-black ${
                        selectedSecondary === option.id
                          ? "bg-white text-black"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {option.count}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          <div
            className={`${copy.promoClass} border-[3px] border-black p-4`}
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap size={18} className="text-black" />
              <span className="font-black text-black text-sm">
                {copy.promoTitle}
              </span>
            </div>
            <p className="text-black/80 text-xs mb-3">
              {copy.promoDescription}
            </p>
            <button
              className="w-full bg-black text-white px-3 py-2 text-xs font-bold border-[2px] border-black"
              style={{ boxShadow: "3px 3px 0 0 #000000" }}
            >
              {copy.cta}
            </button>
          </div>
        </motion.div>

        <div className="flex-1 min-w-0 space-y-6">
          <motion.div
            className="bg-white border-[3px] border-black p-5"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-gray-900 text-2xl font-black flex items-center">
                  {copy.heroIcon}
                  {copy.title}
                </h1>
                <p className="text-gray-500 text-sm mt-1">{copy.subtitle}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={copy.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full md:w-64 bg-gray-50 border-[2px] border-gray-300 pl-10 pr-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-black transition-all"
                  />
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>

                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="lg:hidden bg-white text-gray-700 hover:text-black border-[2px] border-gray-300 hover:border-black text-sm px-4 py-2.5 flex items-center gap-1.5 transition-all font-bold"
                >
                  <Filter size={16} /> ตัวกรอง
                </button>
              </div>
            </div>

            <div className="lg:hidden mt-4 -mx-5 px-5 space-y-2">
              <div className="overflow-x-auto scrollbar-hide flex gap-2 pb-1">
                {primaryOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedPrimary(option.id)}
                    className={`whitespace-nowrap px-3 py-2 text-xs font-bold border-[2px] border-black transition-all flex items-center gap-1.5 ${
                      selectedPrimary === option.id
                        ? "bg-brutal-blue text-black"
                        : "bg-white text-gray-700"
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
                      className={`whitespace-nowrap px-3 py-2 text-xs font-bold border-[2px] border-black transition-all flex items-center gap-1.5 ${
                        selectedSecondary === option.id
                          ? "bg-brutal-yellow text-black"
                          : "bg-white text-gray-700"
                      }`}
                    >
                      {mode === "mobile-recharge" && option.id === "all" ? (
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
          </motion.div>

          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h2 className="text-gray-900 text-lg font-black flex items-center">
              {copy.gridTitle}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({filteredItems.length})
              </span>
            </h2>

            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-2.5">
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                  className="min-w-0"
                >
                  <Link href={getItemLink(mode, item.slug)}>
                    <div
                      className="relative overflow-hidden bg-white border-[2px] sm:border-[3px] border-black transition-all hover:-translate-y-1 group h-full"
                      style={{ boxShadow: "3px 3px 0 0 #000000" }}
                    >
                      {item.discountPercent ? (
                        <div
                          className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10 bg-brutal-pink px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold text-white border-[2px] border-black"
                          style={{ boxShadow: "1px 1px 0 0 #000000" }}
                        >
                          -{item.discountPercent}%
                        </div>
                      ) : null}

                      <div className="relative aspect-square w-full overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-70" />

                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div
                            className={`${copy.ctaBgClass} px-4 py-2 text-sm font-bold border-[2px] border-black translate-y-4 group-hover:translate-y-0 transition-transform`}
                            style={{ boxShadow: "3px 3px 0 0 #000000" }}
                          >
                            {copy.cta}
                          </div>
                        </div>

                        {item.autoDelivery && (
                          <div
                            className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 z-10"
                            title="จัดส่งอัตโนมัติหลังชำระเงิน"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 512 512"
                              className="h-5 w-5 sm:h-6 sm:w-6 drop-shadow-[2px_2px_0_rgba(0,0,0,0.6)]"
                              role="img"
                              aria-label="จัดส่งอัตโนมัติหลังชำระเงิน"
                            >
                              <g clipRule="evenodd" fillRule="evenodd">
                                <circle
                                  cx="256"
                                  cy="256"
                                  r="256"
                                  fill="#ffc107"
                                />
                                <path
                                  fill="#fff"
                                  d="M360.475 221.824 267.348 221.823l83.575-146.861-117.011-.003-82.386 194.624 102.683-.001-68.057 187.46z"
                                />
                              </g>
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="p-2 sm:p-2.5">
                        <p
                          className={`text-gray-900 text-[11px] sm:text-xs font-bold ${
                            mode === "card"
                              ? "line-clamp-2 sm:line-clamp-1"
                              : "line-clamp-1"
                          } mb-1 transition-colors ${copy.hoverNameClass}`}
                        >
                          {mode === "mobile-recharge"
                            ? item.operator
                            : item.title}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <CountryFlag
                              code={getCountryFlagCode(item.country)}
                              size="S"
                            />
                            <span className="text-gray-500 text-[10px] ml-1 truncate max-w-[70px]">
                              {mode === "games"
                                ? item.publisher
                                : mode === "card"
                                  ? item.category
                                  : item.country}
                            </span>
                          </div>
                          <div className="text-xs sm:text-[13px] text-black font-black">
                            ฿{item.price}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {filteredItems.length === 0 && !loading && (
              <div className="text-center py-12">
                <Globe size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-bold">ไม่พบข้อมูลที่ค้นหา</p>
                <p className="text-gray-400 text-sm mt-1">
                  ลองค้นหาคำอื่น หรือปรับตัวกรอง
                </p>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 text-brutal-pink animate-spin" />
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <Sheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="ตัวกรอง"
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
                  className={`w-full flex items-center justify-between p-3 border-[2px] border-black font-bold transition-all ${
                    selectedPrimary === option.id
                      ? "bg-brutal-blue text-black shadow-[2px_2px_0_0_#000]"
                      : "bg-white text-gray-700"
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
                    className={`w-full flex items-center justify-between p-3 border-[2px] border-black font-bold transition-all ${
                      selectedSecondary === option.id
                        ? "bg-brutal-yellow text-black shadow-[2px_2px_0_0_#000]"
                        : "bg-white text-gray-700"
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
    </div>
  );
}
