"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";
import {
  Gamepad2,
  Search,
  Clock,
  Zap,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CreditCard,
  ShieldCheck,
  Headphones,
  Gift,
  Star,
  Flame,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { productApi, Product } from "@/lib/services/product-api";
import { cmsApi, NewsArticleListItem } from "@/lib/services/cms-api";
import { usePublicSettings } from "@/lib/context/public-settings-context";
import { useTranslations } from "next-intl";

interface FeaturedProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  publisher: string;
  mainImage: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  region: string;
  autoDelivery: boolean;
  salesCount: number;
  isBestseller: boolean;
  isFeatured: boolean;
  productType: "CARD" | "DIRECT_TOPUP" | "MOBILE_RECHARGE";
}

function getCategoryIcon(category: string) {
  const key = category?.toLowerCase() || "";
  if (key.includes("popular") || key.includes("hot"))
    return <Flame size={14} className="text-brutal-pink" />;
  if (key.includes("fps") || key.includes("shooter"))
    return <Gamepad2 size={14} className="text-brutal-blue" />;
  if (key.includes("moba"))
    return <Gamepad2 size={14} className="text-brutal-green" />;
  if (key.includes("card") || key.includes("gift"))
    return <CreditCard size={14} className="text-brutal-yellow" />;
  return <Gamepad2 size={14} className="text-gray-500" />;
}

function transformProductToFeatured(product: Product): FeaturedProduct {
  const types = product.types || [];

  const validPrices = types
    .filter((t) => t.displayPrice && Number(t.displayPrice) > 0)
    .map((t) => Number(t.displayPrice));
  const startingPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;

  const originPrices = types
    .filter((t) => t.originPrice && Number(t.originPrice) > 0)
    .map((t) => Number(t.originPrice));
  const originalPrice =
    originPrices.length > 0 ? Math.max(...originPrices) : undefined;

  const discountRates = types
    .map((t) =>
      typeof t.discountRate === "number" ? Number(t.discountRate) : undefined,
    )
    .filter((v): v is number => v !== undefined && !Number.isNaN(v));
  const discountPercent =
    discountRates.length > 0 ? Math.max(...discountRates) : undefined;

  const category = product.category?.name || product.category?.slug || "Game";
  const publisher =
    product.gameDetails?.publisher ||
    product.gameDetails?.developer ||
    category;
  const region = product.gameDetails?.region || "Global";

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category,
    publisher,
    mainImage:
      product.imageUrl ||
      `https://placehold.co/400x400?text=${encodeURIComponent(product.name)}`,
    price: startingPrice,
    originalPrice:
      originalPrice && originalPrice > startingPrice
        ? originalPrice
        : undefined,
    discountPercent,
    region,
    autoDelivery: product.gameDetails?.autoDelivery ?? true,
    salesCount: product.salesCount || 0,
    isBestseller: product.isBestseller || false,
    isFeatured: product.isFeatured || false,
    productType: product.productType,
  };
}

const QUICK_ACTION_ICON_MAP = {
  "credit-card": CreditCard,
  gift: Gift,
  star: Star,
  headphones: Headphones,
} as const;
const QUICK_ACTION_COLOR_MAP = {
  yellow: "bg-brutal-yellow",
  pink: "bg-brutal-pink",
  green: "bg-brutal-green",
  blue: "bg-brutal-blue",
} as const;
const TRUST_BADGE_ICON_MAP = {
  shield: ShieldCheck,
  headphones: Headphones,
  zap: Zap,
} as const;

export default function HomePage() {
  const t = useTranslations("Home");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeCategory, setActiveCategory] = useState("all");
  const { settings: publicSettings, loading: settingsLoading } =
    usePublicSettings();
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>(
    [],
  );
  const [newsArticles, setNewsArticles] = useState<NewsArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const heroSlides = useMemo(() => {
    if (publicSettings?.homepage?.heroSlides?.length) {
      return publicSettings.homepage.heroSlides;
    }
    return [
      {
        id: "hero-default-1",
        title: t("hero.default_1_title"),
        subtitle: t("hero.default_1_subtitle"),
        image: "https://placehold.co/1200x400/FFD93D/000000?text=Promotion",
        link: "/promotions/1",
        color: "yellow",
        badgeText: t("hero.badge_promo"),
      },
      {
        id: "hero-default-2",
        title: t("hero.default_2_title"),
        subtitle: t("hero.default_2_subtitle"),
        image: "https://placehold.co/1200x400/FF6B9D/ffffff?text=Extra+Credit",
        link: "/promotions/2",
        color: "pink",
        badgeText: t("hero.badge_promo"),
      },
    ];
  }, [publicSettings, t]);

  const categoryTabs = useMemo(
    () =>
      publicSettings?.homepage?.categoryTabs?.length
        ? publicSettings.homepage.categoryTabs
        : [
            { id: "all", label: t("categories.all"), icon: "gamepad" as const },
            { id: "hot", label: t("categories.hot"), icon: "flame" as const },
            { id: "cards", label: t("categories.cards"), icon: "card" as const },
          ],
    [publicSettings, t],
  );

  const quickActions = useMemo(
    () =>
      publicSettings?.homepage?.quickActions?.length
        ? publicSettings.homepage.quickActions
        : [
            {
              id: "qa-default-1",
              icon: "credit-card" as const,
              label: t("quick_actions.topup"),
              href: "/games",
              color: "yellow" as const,
            },
            {
              id: "qa-default-2",
              icon: "gift" as const,
              label: t("quick_actions.cards"),
              href: "/card",
              color: "pink" as const,
            },
            {
              id: "qa-default-3",
              icon: "star" as const,
              label: t("quick_actions.promo"),
              href: "/?promo=true",
              color: "green" as const,
            },
            {
              id: "qa-default-4",
              icon: "headphones" as const,
              label: t("quick_actions.support"),
              href: "/support",
              color: "blue" as const,
            },
          ],
    [publicSettings, t],
  );

  const trustBadges = useMemo(
    () =>
      publicSettings?.homepage?.trustBadges?.length
        ? publicSettings.homepage.trustBadges
        : [
            {
              id: "tb-default-1",
              icon: "shield" as const,
              title: t("trust.secure_title"),
              description: t("trust.secure_desc"),
            },
            {
              id: "tb-default-2",
              icon: "headphones" as const,
              title: t("trust.support_title"),
              description: t("trust.support_desc"),
            },
            {
              id: "tb-default-3",
              icon: "zap" as const,
              title: t("trust.delivery_title"),
              description: t("trust.delivery_desc"),
            },
          ],
    [publicSettings, t],
  );

  const promoCards = useMemo(
    () =>
      publicSettings?.homepage?.promoCards?.length
        ? publicSettings.homepage.promoCards
        : [
            {
              id: "promo-1",
              badge: "Latest",
              title: t("promo.ai_title"),
              description: t("promo.ai_desc"),
              ctaText: t("promo.ai_cta"),
              href: "/support",
              theme: "blue" as const,
            },
            {
              id: "promo-2",
              badge: "HOT",
              title: t("promo.extra_credits_title"),
              description: t("promo.extra_credits_desc"),
              ctaText: t("promo.extra_credits_cta"),
              href: "/promotions",
              theme: "pink" as const,
            },
          ],
    [publicSettings, t],
  );

  const sectionLabels = useMemo(
    () => ({
      featuredProductsTitle:
        publicSettings?.homepage.sectionLabels?.featuredProductsTitle ||
        t("sections.featured"),
      specialsTitle:
        publicSettings?.homepage.sectionLabels?.specialsTitle || t("sections.specials"),
      newsTitle: publicSettings?.homepage.sectionLabels?.newsTitle || t("sections.news"),
      viewAllText:
        publicSettings?.homepage.sectionLabels?.viewAllText || t("sections.view_all"),
      heroButtonText:
        publicSettings?.homepage.sectionLabels?.heroButtonText || t("sections.details"),
    }),
    [publicSettings, t],
  );

  const newsItems = useMemo(
    () =>
      publicSettings?.homepage?.newsItems?.length
        ? publicSettings.homepage.newsItems
        : [],
    [publicSettings],
  );

  const promotionsEnabled = publicSettings?.features.enablePromotions ?? true;
  const supportTicketsEnabled =
    publicSettings?.features.enableSupportTickets ?? true;
  const visibleQuickActions = useMemo(
    () =>
      quickActions.filter((action) => {
        if (
          !promotionsEnabled &&
          (action.icon === "star" || action.href.includes("promo"))
        ) {
          return false;
        }
        if (!supportTicketsEnabled && action.href.startsWith("/support")) {
          return false;
        }
        return true;
      }),
    [quickActions, promotionsEnabled, supportTicketsEnabled],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);

        const response = await productApi.getBestsellerProducts(20);

        if (response.success && response.data) {
          const transformed = response.data
            .filter(
              (p) =>
                p.productType === "DIRECT_TOPUP" || p.productType === "CARD",
            )
            .map(transformProductToFeatured);
          setFeaturedProducts(transformed.slice(0, 12));
        }
      } catch (error) {
        console.error("Failed to fetch featured products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  // Fetch news from CMS API
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await cmsApi.getNewsArticles(1, 6);
        if (response.success && response.data) {
          setNewsArticles(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch news:", error);
      }
    };

    fetchNews();
  }, []);

  const nextSlide = () =>
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () =>
    setCurrentSlide(
      (prev) => (prev - 1 + heroSlides.length) % heroSlides.length,
    );

  const filteredProducts = featuredProducts.filter((product) => {
    if (activeCategory === "all") return true;
    if (activeCategory === "hot")
      return product.isBestseller || product.discountPercent !== undefined;
    if (activeCategory === "cards") return product.productType === "CARD";
    return true;
  });

  if (settingsLoading || loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div
          className="w-full max-w-md border-[3px] border-black bg-white p-8 text-center"
          style={{ boxShadow: "6px 6px 0 0 #000000" }}
        >
          <div className="mx-auto mb-4 flex w-fit items-center gap-2">
            <motion.div
              className="h-3 w-3 rounded-full bg-brutal-pink border-[2px] border-black"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
            <motion.div
              className="h-3 w-3 rounded-full bg-brutal-yellow border-[2px] border-black"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.12 }}
            />
            <motion.div
              className="h-3 w-3 rounded-full bg-brutal-blue border-[2px] border-black"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.24 }}
            />
          </div>
          <p className="text-base font-black text-black">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Hero Slider */}
      <section className="relative w-full overflow-hidden">
        <div className="relative aspect-[16/9] md:aspect-[24/8] lg:aspect-[32/10] w-full max-w-7xl mx-auto overflow-hidden md:border-[4px] border-black bg-zinc-100 md:shadow-[8px_8px_0_0_#000]">
          {heroSlides.map(
            (slide, index) =>
              index === currentSlide && (
                <motion.div
                  key={slide.id}
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent md:bg-gradient-to-r md:from-black/80 md:via-black/40 md:to-transparent" />

                  <div className="absolute inset-0 flex items-end md:items-center">
                    <div className="w-full p-5 md:p-12 lg:p-16">
                      <div className="max-w-xl">
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] md:text-xs font-black mb-3 border-[2px] border-black uppercase tracking-wider ${
                            slide.color === "pink"
                              ? "bg-brutal-pink text-white"
                              : "bg-brutal-yellow text-black"
                          }`}
                          style={{ boxShadow: "3px 3px 0 0 #000000" }}
                        >
                          <Zap size={12} className="fill-current" />
                          {slide.badgeText || "Promotion"}
                        </motion.div>

                        <motion.h2
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black text-white mb-1.5 leading-tight drop-shadow-[3px_3px_0_rgba(0,0,0,0.8)]"
                        >
                          {slide.title}
                        </motion.h2>

                        <motion.p
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="text-white/90 text-xs md:text-base lg:text-lg mb-4 font-bold max-w-md line-clamp-2 md:line-clamp-none"
                        >
                          {slide.subtitle}
                        </motion.p>

                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          <Link href={slide.link || "/promotions"}>
                            <Button
                              size="sm"
                              className={`font-black text-xs md:text-base px-5 py-2.5 h-auto border-[3px] border-black group/hero transition-all ${
                                slide.color === "pink"
                                  ? "bg-white text-black hover:bg-zinc-100"
                                  : "bg-brutal-yellow text-black hover:bg-yellow-400"
                              }`}
                              style={{ boxShadow: "3px 3px 0 0 #000000" }}
                            >
                              {sectionLabels.heroButtonText}
                              <ChevronRight
                                size={16}
                                className="ml-1.5 group-hover/hero:translate-x-1 transition-transform"
                              />
                            </Button>
                          </Link>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ),
          )}

          {/* Slider Pagination */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-3 z-10 md:left-auto md:right-8 md:bottom-8 md:translate-x-0">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 border-[2px] border-black transition-all ${
                  index === currentSlide
                    ? "bg-brutal-yellow scale-125 rotate-45"
                    : "bg-white/50 hover:bg-white"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions - Mobile */}
      <section className="px-4 pt-6 pb-2 md:hidden">
        <div className="grid grid-cols-4 gap-3">
          {visibleQuickActions.map((action) => {
            const ActionIcon =
              QUICK_ACTION_ICON_MAP[action.icon as keyof typeof QUICK_ACTION_ICON_MAP] ||
              QUICK_ACTION_ICON_MAP["credit-card"];
            const actionColor =
              QUICK_ACTION_COLOR_MAP[action.color as keyof typeof QUICK_ACTION_COLOR_MAP] ||
              QUICK_ACTION_COLOR_MAP.yellow;
            return (
              <Link key={action.id || action.label} href={action.href}>
                <motion.div
                  className={`flex flex-col items-center justify-center aspect-square ${actionColor} border-[3px] border-black rounded-none`}
                  style={{ boxShadow: "4px 4px 0 0 #000000" }}
                  whileTap={{
                    scale: 0.95,
                    x: 2,
                    y: 2,
                    boxShadow: "0px 0px 0 0 #000",
                  }}
                >
                  <ActionIcon size={24} className="text-black mb-1.5" />
                  <span className="text-[11px] font-black text-black text-center leading-tight">
                    {action.label}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="container mx-auto px-4 space-y-8 md:space-y-12 mt-4 md:mt-10">
        {/* Search Bar - Mobile */}
        <section className="md:hidden">
          <div className="relative group">
            <div className="absolute inset-0 bg-black translate-x-1 translate-y-1 transition-transform group-focus-within:translate-x-1.5 group-focus-within:translate-y-1.5" />
            <Input
              placeholder={t("sections.featured")}
              icon={<Search size={20} className="text-black" />}
              className="relative bg-white border-[3px] border-black rounded-none h-14 text-base font-bold placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:border-brutal-pink transition-colors"
            />
          </div>
        </section>

        {/* Featured Promotion Cards */}
        {promotionsEnabled && (
          <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {promoCards.slice(0, 3).map((card, index) => {
              const isPrimary = index === 0;
              const cardClass =
                card.theme === "pink"
                  ? "bg-brutal-pink text-white"
                  : card.theme === "yellow"
                    ? "bg-brutal-yellow text-black"
                    : card.theme === "green"
                      ? "bg-brutal-green text-black"
                      : "bg-brutal-blue text-white";

              const badgeClass =
                card.theme === "yellow" || card.theme === "green"
                  ? "bg-black text-white"
                  : "bg-white text-black";

              const btnClass =
                card.theme === "yellow" || card.theme === "green"
                  ? "bg-black text-white hover:bg-zinc-800"
                  : "bg-white text-black hover:bg-zinc-100";

              return (
                <motion.div
                  key={card.id}
                  className={`${
                    isPrimary
                      ? "md:col-span-7 lg:col-span-8"
                      : "md:col-span-5 lg:col-span-4"
                  } ${cardClass} border-[3px] border-black p-6 sm:p-8 relative overflow-hidden group min-h-[220px] md:min-h-[260px] flex flex-col justify-between`}
                  style={{ boxShadow: "8px 8px 0 0 #000000" }}
                  whileHover={{
                    y: -4,
                    x: -2,
                    boxShadow: "10px 10px 0 0 #000000",
                  }}
                >
                  <div className="relative z-10">
                    {card.badge && (
                      <div
                        className={`inline-flex items-center gap-1.5 ${badgeClass} text-[10px] md:text-xs uppercase tracking-widest px-2.5 py-1 font-black border-[2px] border-black mb-4 self-start shadow-[2px_2px_0_0_#000]`}
                      >
                        <Sparkles size={14} />
                        {card.badge}
                      </div>
                    )}
                    <h3
                      className={`font-black text-2xl sm:text-3xl md:text-4xl mb-3 leading-[1.1] ${
                        card.theme === "yellow" || card.theme === "green"
                          ? "text-black"
                          : "text-white"
                      } drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)]`}
                    >
                      {card.title}
                    </h3>
                    {card.description && (
                      <p
                        className={`text-sm md:text-base mb-6 max-w-md font-bold leading-relaxed ${
                          card.theme === "yellow" || card.theme === "green"
                            ? "text-black/80"
                            : "text-white/90"
                        }`}
                      >
                        {card.description}
                      </p>
                    )}
                  </div>

                  <div className="relative z-10 flex items-center justify-between mt-auto">
                    <Link href={card.href || "/promotions"}>
                      <Button
                        className={`${btnClass} border-[3px] border-black font-black text-sm md:text-base px-6 py-3 h-auto flex items-center gap-2 group/btn transition-all`}
                        style={{ boxShadow: "4px 4px 0 0 #000000" }}
                      >
                        {card.ctaText || t("sections.details")}
                        <ChevronRight
                          size={18}
                          className="group-hover/btn:translate-x-1 transition-transform"
                        />
                      </Button>
                    </Link>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute right-[-30px] bottom-[-30px] opacity-10 group-hover:opacity-20 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 ease-out">
                    <Gamepad2 size={isPrimary ? 240 : 180} />
                  </div>
                  <div className="absolute top-6 right-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Zap size={60} />
                  </div>
                </motion.div>
              );
            })}
          </section>
        )}

        {/* Categories - Horizontal Scroll */}
        {promotionsEnabled && (
          <section>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              {categoryTabs.map((category) => (
                <motion.button
                  key={category.id}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold whitespace-nowrap border-[3px] transition-all flex-shrink-0 ${
                    activeCategory === category.id
                      ? "bg-brutal-yellow border-black text-black"
                      : "bg-white border-gray-300 text-gray-700 hover:border-black"
                  }`}
                  style={
                    activeCategory === category.id
                      ? { boxShadow: "3px 3px 0 0 #000000" }
                      : undefined
                  }
                  onClick={() => setActiveCategory(category.id)}
                  whileTap={{ scale: 0.95 }}
                >
                  {category.icon === "flame" ? (
                    <Flame size={16} />
                  ) : category.icon === "card" ? (
                    <CreditCard size={16} />
                  ) : (
                    <Gamepad2 size={16} />
                  )}
                  <span>{category.label}</span>
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {/* Featured Games - From Database */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-black text-black flex items-center">
              <span className="w-1.5 h-5 sm:h-6 bg-brutal-pink mr-2"></span>
              {sectionLabels.featuredProductsTitle}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({filteredProducts.length})
              </span>
            </h2>
            <Link
              href="/games"
              className="text-brutal-pink text-sm font-bold hover:underline flex items-center"
            >
              {sectionLabels.viewAllText}
              <ChevronRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-brutal-pink animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                >
                  <Link href={`/games/${product.slug}`}>
                    <div
                      className="relative overflow-hidden bg-white border-[3px] border-black transition-all hover:-translate-y-1 group"
                      style={{ boxShadow: "4px 4px 0 0 #000000" }}
                    >
                      {product.discountPercent && (
                        <div
                          className="absolute top-2 left-2 z-10 bg-brutal-pink px-2 py-1 text-[10px] font-bold text-white border-[2px] border-black"
                          style={{ boxShadow: "2px 2px 0 0 #000000" }}
                        >
                          -{product.discountPercent}%
                        </div>
                      )}

                      <div className="relative aspect-square w-full overflow-hidden">
                        <img
                          src={product.mainImage}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-70" />

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div
                            className="bg-brutal-yellow text-black px-3 py-1.5 text-xs sm:text-sm font-bold border-[2px] border-black translate-y-4 group-hover:translate-y-0 transition-transform"
                            style={{ boxShadow: "3px 3px 0 0 #000000" }}
                          >
                            {t("sections.details")}
                          </div>
                        </div>

                        {/* Auto delivery icon */}
                        {product.autoDelivery && (
                          <div
                            className="absolute bottom-2 right-2 z-10"
                            title="Auto Delivery"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 512 512"
                              className="h-5 w-5 sm:h-6 sm:w-6 drop-shadow-[2px_2px_0_rgba(0,0,0,0.6)]"
                              role="img"
                              aria-label="Auto Delivery"
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
                        <p className="text-gray-900 text-[10px] sm:text-xs font-bold line-clamp-1 mb-1 group-hover:text-brutal-pink transition-colors">
                          {product.name}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {getCategoryIcon(product.category)}
                            <span className="text-gray-500 text-[8px] sm:text-[10px] ml-1 truncate max-w-[40px] sm:max-w-[60px]">
                              {product.publisher}
                            </span>
                          </div>
                          {product.price > 0 ? (
                            <div className="text-[10px] sm:text-xs text-black font-black">
                              ฿{product.price}
                            </div>
                          ) : product.isBestseller ? (
                            <>
                              <Flame
                                size={14}
                                className="text-brutal-pink sm:hidden"
                              />
                              <div className="hidden sm:block text-[8px] sm:text-[10px] font-bold text-white bg-brutal-pink px-1.5 py-0.5 border border-black">
                                HOT
                              </div>
                            </>
                          ) : (
                            <div className="text-[8px] sm:text-[10px] font-bold text-gray-500 truncate max-w-[50px]">
                              {product.publisher}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Gamepad2 size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-bold">No games found</p>
            </div>
          )}
        </section>

        {/* Trust Badges */}
        <section className="grid grid-cols-3 gap-2 sm:gap-4">
          {trustBadges.map((badge, i) => {
            const BadgeIcon =
              TRUST_BADGE_ICON_MAP[badge.icon as keyof typeof TRUST_BADGE_ICON_MAP] || TRUST_BADGE_ICON_MAP.shield;
            return (
              <div
                key={badge.id || i}
                className="bg-white border-[2px] border-black p-3 sm:p-4 text-center"
                style={{ boxShadow: "3px 3px 0 0 #000000" }}
              >
                <BadgeIcon size={24} className="mx-auto text-black mb-2" />
                <p className="text-xs sm:text-sm font-bold text-black">
                  {badge.title}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">
                  {badge.description}
                </p>
              </div>
            );
          })}
        </section>

        {/* News Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-black text-black flex items-center">
              <span className="w-1.5 h-5 sm:h-6 bg-brutal-blue mr-2"></span>
              {sectionLabels.newsTitle}
            </h2>
            <Link
              href="/news"
              className="text-brutal-pink text-sm font-bold hover:underline flex items-center"
            >
              {sectionLabels.viewAllText}
              <ChevronRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {newsArticles.length > 0
              ? newsArticles.map((item) => (
                  <Link key={item.id} href={`/news/${item.slug}`}>
                    <motion.div
                      className="bg-white border-[3px] border-black overflow-hidden hover:-translate-y-1 transition-all h-full"
                      style={{ boxShadow: "4px 4px 0 0 #000000" }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="relative aspect-video">
                        <img
                          src={
                            (item as any).featuredImage ||
                            (item as any).imageUrl ||
                            (item as any).coverImage ||
                            "https://placehold.co/600x400?text=News"
                          }
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-brutal-blue text-white text-[10px] font-bold px-2 py-1 border-[2px] border-black">
                          {(item.category as any)?.name ||
                            (item.category as any) ||
                            "News"}
                        </div>
                      </div>
                      <div className="p-3 sm:p-4">
                        <p className="text-[10px] text-gray-500 mb-1 font-bold">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                        <h3 className="text-sm sm:text-base font-black text-black line-clamp-2 leading-snug">
                          {item.title}
                        </h3>
                      </div>
                    </motion.div>
                  </Link>
                ))
              : newsItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border-[3px] border-black overflow-hidden"
                    style={{ boxShadow: "4px 4px 0 0 #000000" }}
                  >
                    <div className="relative aspect-video">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3 sm:p-4">
                      <p className="text-[10px] text-gray-500 mb-1">
                        {item.date}
                      </p>
                      <h3 className="text-sm sm:text-base font-black text-black">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                ))}
          </div>
        </section>
      </div>
    </div>
  );
}
