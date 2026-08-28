"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import {
  ChevronRight,
  ChevronLeft,
  Zap,
  ShieldCheck,
  Award,
  Headphones,
  PackageOpen,
  Newspaper,
  Tag,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePublicSettings } from "@/lib/context/public-settings-context";
import { cmsApi, type NewsArticle } from "@/lib/services/cms-api";
import { productApi, type Product } from "@/lib/services/product-api";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { OfferCard, type Deal } from "@/components/ui/OfferCard";
import { GameTile } from "@/components/ui/GameTile";
import { PanelCard } from "@/components/ui/PanelCard";
import { ListRow } from "@/components/ui/ListRow";
import { TrustStrip, type TrustItem } from "@/components/ui/TrustStrip";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  SkeletonHero,
  SkeletonOfferCard,
  SkeletonGameTile,
  SkeletonListRow,
} from "@/components/ui/Skeleton";

const gameImg = (label: string) =>
  `https://placehold.co/500x500/22262a/74807f?text=${encodeURIComponent(label)}&font=montserrat`;

export default function HomePage() {
  const t = useTranslations();
  const { settings, loading: settingsLoading } = usePublicSettings();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [newsItems, setNewsItems] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [cardProducts, setCardProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [discountedProducts, setDiscountedProducts] = useState<Deal[]>([]);
  const [dealsLoading, setDealsLoading] = useState(true);

  const defaultSlides = [
    {
      id: "1",
      title: "Zenless Zone Zero",
      subtitle: t("hero_zzz_subtitle"),
      highlightText: t("hero_zzz_highlight_text"),
      highlight: "30%",
      image:
        "https://placehold.co/800x600/22262a/74807f?text=ZZZ+Character+Art",
      btnText: t("hero_btn_text"),
      href: "/games/zzz",
    },
    {
      id: "2",
      title: "Genshin Impact",
      subtitle: t("hero_genshin_subtitle"),
      highlightText: t("hero_genshin_highlight_text"),
      highlight: "20%",
      image:
        "https://placehold.co/800x600/22262a/74807f?text=Genshin+Character+Art",
      btnText: t("hero_btn_text"),
      href: "/games/genshin",
    },
  ];

  const heroSlides = settings?.homepage?.heroSlides?.length
    ? settings.homepage.heroSlides.map((slide) => ({
        id: slide.id,
        title: slide.title,
        subtitle: slide.subtitle || "",
        highlightText: slide.badgeText ? "HOT" : "",
        highlight: slide.badgeText || "",
        image: slide.image,
        btnText:
          settings.homepage.sectionLabels?.heroButtonText ||
          t("hero_btn_text"),
        href: slide.link || "/games",
      }))
    : defaultSlides;

  // Icon map for trust badges from settings
  const trustIconMap: Record<string, LucideIcon> = {
    shield: ShieldCheck,
    headphones: Headphones,
    zap: Zap,
    award: Award,
  };

  const trustItems: TrustItem[] = settings?.homepage?.trustBadges?.length
    ? settings.homepage.trustBadges.map((badge) => ({
        icon: trustIconMap[badge.icon] || ShieldCheck,
        title: badge.title,
        desc: badge.description || "",
      }))
    : [
        {
          icon: ShieldCheck,
          title: t("trust_secure_title"),
          desc: t("trust_secure_desc"),
        },
        {
          icon: Zap,
          title: t("trust_fast_title"),
          desc: t("trust_fast_desc"),
        },
        {
          icon: Award,
          title: t("trust_price_title"),
          desc: t("trust_price_desc"),
        },
        {
          icon: Headphones,
          title: t("trust_support_title"),
          desc: t("trust_support_desc"),
        },
      ];

  // Carousel auto-advance
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // Fetch news
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setNewsLoading(true);
        const response = await cmsApi.getRecentNews(8);
        if (response.success && response.data) {
          setNewsItems(response.data);
        }
      } catch (error) {
        console.error("[HomePage] Failed to fetch news:", error);
      } finally {
        setNewsLoading(false);
      }
    };
    fetchNews();
  }, []);

  // Fetch products (DIRECT_TOPUP + CARD from same response)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        const response = await productApi.getProducts({
          isActive: true,
          limit: 100,
          sortBy: "salesCount",
          sortOrder: "desc",
        });
        if (response.success && response.data) {
          const directTopUp = response.data.filter(
            (p) => p.productType === "DIRECT_TOPUP",
          );
          setProducts(directTopUp.slice(0, 12));

          const cards = response.data.filter(
            (p) => p.productType === "CARD",
          );
          setCardProducts(cards.slice(0, 6));
        }
      } catch (error) {
        console.error("[HomePage] Failed to fetch products:", error);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Fetch deals
  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setDealsLoading(true);
        const response = await productApi.getProducts({
          isActive: true,
          limit: 50,
        });
        if (response.success && response.data) {
          const deals = response.data
            .map((p) => {
              const discountedType = p.types
                ?.filter(
                  (t) => t.discountRate != null && t.discountRate > 0,
                )
                .sort(
                  (a, b) => (b.discountRate || 0) - (a.discountRate || 0),
                )[0];
              if (!discountedType) return null;
              return {
                id: p.id,
                slug: p.slug,
                name: p.name,
                typeName: discountedType.name,
                discount: discountedType.discountRate!,
                img:
                  p.imageUrl ||
                  gameImg(p.name.substring(0, 6)),
              };
            })
            .filter(Boolean) as Deal[];
          deals.sort((a, b) => b.discount - a.discount);
          setDiscountedProducts(deals.slice(0, 10));
        }
      } catch (error) {
        console.error("[HomePage] Failed to fetch deals:", error);
      } finally {
        setDealsLoading(false);
      }
    };
    fetchDeals();
  }, []);

  const isPageReady =
    !settingsLoading && !newsLoading && !productsLoading && !dealsLoading;

  // Format date for news subtitle
  const formatDate = (dateStr: string | null | undefined): string | undefined => {
    if (!dateStr) return undefined;
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return undefined;
    }
  };

  // ═══════ LOADING SKELETON ═══════
  if (!isPageReady) {
    return (
      <div className="space-y-8 py-2 pb-16">
        <SkeletonHero />

        <section>
          <SectionHeader title={t("special_offers")} sublabel="SPECIAL PROMOTIONS" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonOfferCard key={i} />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader title={t("popular_games")} sublabel="GAME TOP-UP POPULAR" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonGameTile key={i} />
            ))}
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="site-card p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonListRow key={i} />
            ))}
          </div>
          <div className="site-card p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonListRow key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ═══════ READY RENDER ═══════
  return (
    <div className="space-y-8 py-2 pb-16">
      {/* ════════════════ HERO SLIDER ════════════════ */}
      <section className="relative overflow-hidden rounded-8 border border-site-border-soft bg-site-surface">
        <div
          className="flex flex-nowrap w-full transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {heroSlides.map((slide) => (
            <div
              key={slide.id}
              className="w-full flex-[0_0_100%] relative h-[180px] md:h-[220px]"
            >
              {/* Background image */}
              <img
                src={slide.image}
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-cover opacity-30"
              />
              {/* Flat overlay */}
              <div className="absolute inset-0 bg-site-surface/70" />
              {/* Content */}
              <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-10">
                <h2 className="text-xl md:text-2xl font-extrabold text-site-text">
                  {slide.title}
                </h2>
                <p className="text-[13px] text-site-muted mt-1">
                  {slide.subtitle}
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  {slide.highlightText && (
                    <span className="text-sm text-site-muted">
                      {slide.highlightText}
                    </span>
                  )}
                  <span className="text-2xl md:text-3xl font-black text-site-accent">
                    {slide.highlight}
                  </span>
                </div>
                <Link
                  href={slide.href}
                  className="site-btn w-fit mt-3 text-[12px] md:text-sm"
                >
                  {slide.btnText}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={() =>
            setCurrentSlide(
              (p) => (p - 1 + heroSlides.length) % heroSlides.length,
            )
          }
          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-site-raised/90 border border-site-border rounded-6 flex items-center justify-center text-site-text transition-colors z-10"
          aria-label="Previous slide"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() =>
            setCurrentSlide((p) => (p + 1) % heroSlides.length)
          }
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-site-raised/90 border border-site-border rounded-6 flex items-center justify-center text-site-text transition-colors z-10"
          aria-label="Next slide"
        >
          <ChevronRight size={16} />
        </button>

        {/* Slide Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentSlide
                  ? "w-6 bg-site-accent"
                  : "w-1.5 bg-site-border hover:bg-site-muted"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ════════════════ SPECIAL OFFERS ════════════════ */}
      <section>
        <SectionHeader
          title={t("special_offers")}
          sublabel="SPECIAL PROMOTIONS"
          actionHref="/games"
          actionLabel={t("view_all")}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {discountedProducts.length === 0 ? (
            <EmptyState icon={Tag} message={t("no_deals")} />
          ) : (
            discountedProducts.map((deal) => (
              <OfferCard
                key={deal.id}
                deal={deal}
                href={`/games/${deal.slug}`}
              />
            ))
          )}
        </div>
      </section>

      {/* ════════════════ POPULAR GAMES ════════════════ */}
      <section>
        <SectionHeader
          title={t("popular_games")}
          sublabel="GAME TOP-UP POPULAR"
          actionHref="/games"
          actionLabel={t("view_all")}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {products.length === 0 ? (
            <EmptyState icon={PackageOpen} message={t("no_products")} />
          ) : (
            products.map((game) => (
              <GameTile
                key={game.id}
                slug={game.slug}
                name={game.name}
                image={game.imageUrl || gameImg(game.name.substring(0, 6))}
                instant={game.gameDetails?.autoDelivery}
              />
            ))
          )}
        </div>
      </section>

      {/* ════════════════ TWO-COLUMN PANELS ════════════════ */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Prepaid Card Panel */}
        <PanelCard
          title={t("nav_prepaid_card")}
          sublabel="DIGITAL CARD"
          actionHref="/card"
          actionLabel={t("view_all")}
        >
          {cardProducts.length === 0 ? (
            <EmptyState icon={CreditCard} message={t("no_products")} />
          ) : (
            cardProducts.map((p) => (
              <ListRow
                key={p.id}
                href={`/card/${p.slug}`}
                title={p.name}
                subtitle={p.category?.name}
                icon={p.imageUrl || undefined}
              />
            ))
          )}
        </PanelCard>

        {/* News Panel */}
        <PanelCard
          title={t("news_title")}
          sublabel="NEWS"
          actionHref="/news"
          actionLabel={t("view_all")}
        >
          {newsItems.length === 0 ? (
            <EmptyState icon={Newspaper} message={t("no_news")} />
          ) : (
            newsItems.slice(0, 6).map((news) => (
              <ListRow
                key={news.id}
                href={`/news/${news.slug}`}
                title={news.title}
                subtitle={formatDate(news.publishedAt || news.createdAt)}
              />
            ))
          )}
        </PanelCard>
      </div>

      {/* ════════════════ TRUST STRIP ════════════════ */}
      <TrustStrip items={trustItems} />
    </div>
  );
}
