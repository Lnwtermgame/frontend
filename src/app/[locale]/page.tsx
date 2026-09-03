"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import {
  ChevronRight, Zap,
  ShieldCheck,
  Award, Headphones, PackageOpen, Newspaper, Tag,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePublicSettings } from "@/lib/context/public-settings-context";
import { cmsApi, type NewsArticle } from "@/lib/services/cms-api";
import { productApi, type Product } from "@/lib/services/product-api";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

const gameImg = (label: string, bg: string, fg: string, w = 500, h = 500) =>
  `https://placehold.co/${w}x${h}/${bg}/${fg}?text=${encodeURIComponent(label)}&font=montserrat`;

// Slide CTAs must never land on a missing route: links outside the real
// storefront prefixes (e.g. admin-typed "/promotions/1") fall back to /games.
const HERO_LINK_ALLOWLIST = ["/games", "/card", "/mobile-recharge", "/news", "/support"];
function safeHeroLink(link?: string): string {
  const path = (link || "").split("?")[0];
  return HERO_LINK_ALLOWLIST.some((p) => path === p || path.startsWith(p + "/"))
    ? path
    : "/games";
}

export default function HomePage() {
  const t = useTranslations();
  const { settings, loading: settingsLoading } = usePublicSettings();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [newsItems, setNewsItems] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [discountedProducts, setDiscountedProducts] = useState<Array<{
    id: string; slug: string; name: string; typeName: string;
    discount: number; img: string;
  }>>([]);
  const [dealsLoading, setDealsLoading] = useState(true);

  const defaultSlides = [
    {
      id: "1",
      title: "Zenless Zone Zero",
      subtitle: t("hero_zzz_subtitle"),
      highlightText: t("hero_zzz_highlight_text"),
      highlight: "30%",
      image: "/images/placeholder-hero.svg",
      btnText: t("hero_btn_text"),
      href: "/games",
    },
    {
      id: "2",
      title: "Genshin Impact",
      subtitle: t("hero_genshin_subtitle"),
      highlightText: t("hero_genshin_highlight_text"),
      highlight: "20%",
      image: "/images/placeholder-hero.svg",
      btnText: t("hero_btn_text"),
      href: "/games",
    },
  ];

  const heroSlides = settings?.homepage?.heroSlides?.length
    ? settings.homepage.heroSlides.map((slide) => {
      return {
        id: slide.id,
        title: slide.title,
        subtitle: slide.subtitle || "",
        highlightText: slide.badgeText ? "HOT" : "",
        highlight: slide.badgeText || "",
        image: slide.image,
        btnText: settings.homepage.sectionLabels?.heroButtonText || t("hero_btn_text"),
        href: safeHeroLink(slide.link),
      };
    })
    : defaultSlides;



  // Deal cards: same steel base for every card — the discount % is the color.
  // (Former per-card pastel gradients fought the Steel + Red Signal palette.)
  const dealColors = [
    "from-[#232630] via-[#1c1f24] to-[#1c1f24]",
  ];




  // Icon map for trust badges from settings
  const trustIconMap: Record<string, React.ComponentType<any>> = {
    shield: ShieldCheck,
    headphones: Headphones,
    zap: Zap,
    award: Award,
  };

  const trustItems = settings?.homepage?.trustBadges?.length
    ? settings.homepage.trustBadges.map((badge) => ({
      icon: trustIconMap[badge.icon] || ShieldCheck,
      title: badge.title,
      desc: badge.description || "",
    }))
    : [
      { icon: ShieldCheck, title: t("trust_secure_title"), desc: t("trust_secure_desc") },
      { icon: Zap, title: t("trust_fast_title"), desc: t("trust_fast_desc") },
      { icon: Award, title: t("trust_price_title"), desc: t("trust_price_desc") },
      { icon: Headphones, title: t("trust_support_title"), desc: t("trust_support_desc") },
    ];



  // Embla api drives dots/arrows; autoplay handled by the plugin
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  // Ticker rail under the hero — assembled from data the page already
  // fetches: discounted products + latest news. No extra requests.
  type TickerItem = { label: string; title: string; meta?: string; href: string };
  const tickerItems: TickerItem[] = [
    ...discountedProducts.slice(0, 5).map((deal) => ({
      label: t("ticker_promo"),
      title: deal.name,
      meta: `-${deal.discount}%`,
      href: `/games/${deal.slug}`,
    })),
    ...newsItems.slice(0, 5).map((news) => ({
      label: t("ticker_news"),
      title: news.title,
      href: `/news/${news.slug}`,
    })),
  ];

  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => setCurrentSlide(carouselApi.selectedScrollSnap());
    carouselApi.on("select", onSelect);
    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  // Embla measures on init — re-measure once mounted and after slides settle
  useEffect(() => {
    if (!carouselApi) return;
    carouselApi.reInit();
    const raf = requestAnimationFrame(() => carouselApi.reInit());
    return () => cancelAnimationFrame(raf);
  }, [carouselApi, heroSlides.length]);

  // Fetch real news articles from CMS
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

  // Fetch products from API
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
          const directTopUp = response.data.filter((p) =>
            p.productType === "DIRECT_TOPUP"
          );
          setProducts(directTopUp.slice(0, 12));
        }
      } catch (error) {
        console.error("[HomePage] Failed to fetch products:", error);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Fetch discounted products from API
  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setDealsLoading(true);
        const response = await productApi.getProducts({ isActive: true, limit: 50 });
        if (response.success && response.data) {
          const deals = response.data
            .map((p) => {
              // Find the type with the best discount
              const discountedType = p.types
                ?.filter((t) => t.discountRate != null && t.discountRate > 0)
                .sort((a, b) => (b.discountRate || 0) - (a.discountRate || 0))[0];
              if (!discountedType) return null;
              return {
                id: p.id,
                slug: p.slug,
                name: p.name,
                typeName: discountedType.name,
                discount: discountedType.discountRate!,
                img: p.imageUrl || gameImg(p.name.substring(0, 6), "1A1C20", "555555"),
              };
            })
            .filter(Boolean) as typeof discountedProducts;
          // Sort by highest discount first
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

  const isPageReady = !settingsLoading && !newsLoading && !productsLoading && !dealsLoading;

  // ═══════ GLOBAL LOADING SKELETON ═══════
  if (!isPageReady) {
    return (
      <div className="legacy-home space-y-6 py-6 pb-20 animate-pulse">
        {/* Hero skeleton */}
        <div className="w-full h-[260px] sm:h-[300px] md:h-[350px] lg:h-[400px] bg-site-surface rounded-[20px]" />



        {/* Special offers skeleton */}
        <div className="bg-site-surface border border-transparent p-5 md:p-6 rounded-[16px] shadow-[0_16px_44px_-26px_rgba(0,0,0,0.85)]">
          <div className="h-6 w-40 bg-[#2A2C30] rounded mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-[16px] gap-y-[20px]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[80px] bg-[#2A2C30] rounded-[14px]" />
            ))}
          </div>
        </div>

        {/* Games skeleton */}
        <div className="pt-16 pb-6">
          <div className="h-5 w-32 bg-[#2A2C30] rounded mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-[32px]">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i}>
                <div className="w-full aspect-square bg-[#2A2C30] rounded-[16px] mb-3" />
                <div className="h-4 bg-[#2A2C30] rounded w-3/4 mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* News skeleton */}
        <div className="pt-16 pb-6">
          <div className="h-5 w-24 bg-[#2A2C30] rounded mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-[24px] gap-y-[32px]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="w-full aspect-[16/9] bg-[#2A2C30] rounded-[8px] mb-3" />
                <div className="h-4 bg-[#2A2C30] rounded w-3/4 mb-2" />
                <div className="h-3 bg-[#2A2C30] rounded w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Trust badges skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-20">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="py-6 px-4 bg-site-surface border border-transparent rounded-[16px] flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-[#2A2C30] mb-4" />
              <div className="h-4 w-24 bg-[#2A2C30] rounded mb-2" />
              <div className="h-3 w-32 bg-[#2A2C30] rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="legacy-home space-y-6 py-6 pb-20 animate-[fadeIn_0.3s_ease-in-out]">
      {/* ════════════════ HERO — SPOTLIGHT ════════════════ */}
      {/* Spotlight hero: full-bleed slide art crossfading behind a centered
          headline + paired CTAs, with a live ticker rail along the bottom.
          Embla still drives autoplay + dot sync; the fade itself is CSS
          opacity keyed on selectedScrollSnap. */}
      <section className="relative w-full isolate">
        {/* Soft Shadow skin: hero floats on a deep diffuse shadow */}
        <div className="relative h-[440px] sm:h-[460px] md:h-[500px] rounded-[20px] overflow-hidden bg-[#0e1015] shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)]">
          {/* Inner slide artwork — strictly terminates at bottom-[44px] so artwork NEVER reaches or bleeds into the bottom corners */}
          {heroSlides.map((slide, i) => (
            <div
              key={slide.id}
              aria-hidden={i !== currentSlide}
              className={`absolute inset-x-0 top-0 bottom-[44px] overflow-hidden rounded-t-[20px] transition-opacity duration-700 ease-out ${i === currentSlide ? "opacity-100 z-[1]" : "opacity-0 z-0 pointer-events-none"}`}
            >
              <img
                src={slide.image}
                alt={i === currentSlide ? slide.title : ""}
                className="w-full h-full object-cover object-center"
              />
            </div>
          ))}

          {/* Embla instance kept as the slide timer + dot driver; visually
              hidden because the spotlight paints the active slide itself. */}
          <div className="hidden" aria-hidden="true">
            <Carousel
              opts={{ loop: true }}
              plugins={[Autoplay({ delay: 6000, stopOnInteraction: false, stopOnMouseEnter: true })]}
              setApi={setCarouselApi}
            >
              <CarouselContent className="m-0">
                {heroSlides.map((slide) => (
                  <CarouselItem key={`embla-${slide.id}`}>
                    <span>{slide.title}</span>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>

          {/* Spotlight dim — light at the top center, heavy near the bottom edge
              so copy always reads. */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 bottom-[44px] z-[2] rounded-t-[20px]"
            style={{
              background:
                "radial-gradient(90% 80% at 50% 0%, rgba(14,16,19,0.10) 0%, rgba(14,16,19,0.55) 55%, rgba(14,16,19,0.86) 85%, rgba(14,16,19,0.95) 100%)",
            }}
          />

          {/* Centered copy — bound to the active slide, vertically centered in the artwork viewport */}
          <div className="absolute inset-x-0 top-0 bottom-[44px] z-[4] flex flex-col items-center justify-center text-center px-5">
            <span className="font-bold text-[11px] sm:text-xs tracking-[0.22em] uppercase text-site-accent mb-3 md:mb-4">
              {heroSlides[currentSlide]?.highlightText || t("hero_kicker")}
            </span>
            <h2 className="font-extrabold text-white text-2xl sm:text-3xl md:text-4xl lg:text-[44px] leading-[1.12] tracking-tight max-w-[20ch] drop-shadow-[0_2px_24px_rgba(0,0,0,0.55)] mb-2 md:mb-3">
              {heroSlides[currentSlide]?.title}
            </h2>
            <p className="text-sm sm:text-base text-site-muted max-w-[52ch] mb-5 md:mb-7">
              {heroSlides[currentSlide]?.subtitle}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href={heroSlides[currentSlide]?.href || "/games"}
                className="inline-flex items-center gap-2.5 bg-site-accent hover:bg-site-accent-hover text-white font-bold text-sm md:text-[15px] px-7 md:px-8 py-3 rounded-[10px] transition-all duration-200 hover:-translate-y-px shadow-[0_10px_30px_-10px_rgba(245,130,32,0.45)]"
              >
                {heroSlides[currentSlide]?.btnText || t("hero_btn_text")}
                <ChevronRight size={17} strokeWidth={2.6} />
              </Link>
              <Link
                href="/games"
                className="inline-flex items-center gap-2 text-sm md:text-[15px] font-semibold text-site-text border border-white/20 hover:border-white/50 hover:text-white bg-site-bg/40 backdrop-blur-sm px-6 py-3 rounded-[10px] transition-colors duration-200"
              >
                {t("hero_browse_games")}
              </Link>
            </div>
          </div>

          {/* Slide dots — right edge, vertical, quiet */}
          <div className="absolute right-4 md:right-5 top-1/2 -translate-y-1/2 z-[5] hidden sm:flex flex-col gap-2">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => carouselApi?.scrollTo(i)}
                aria-label={t("hero_go_to_slide", { index: i + 1 })}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === currentSlide ? "bg-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.6)]" : "bg-white/30 hover:bg-white/60"}`}
              />
            ))}
          </div>

          {/* Ticker rail — real deals + news, marquee along the bottom edge.
              Solid background and rounded-b-[20px] ensures zero bleed or corner artifacts. */}
          {tickerItems.length > 0 && (
            <div className="absolute inset-x-0 bottom-0 h-[44px] z-[5] bg-[#0e1015] border-t border-site-border-soft overflow-hidden rounded-b-[20px] group">
              <div className="flex w-max h-full animate-[hero-ticker_36s_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:flex-wrap">
                {tickerItems.concat(tickerItems).map((item, i) => (
                  <Link
                    key={`${item.href}-${i}`}
                    href={item.href}
                    className="inline-flex items-center gap-2.5 px-6 h-full text-[13px] text-site-muted whitespace-nowrap border-r border-site-border-soft hover:text-site-text transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>
                      {item.label} <b className="font-semibold text-site-text">{item.title}</b>
                      {item.meta && <span className="text-site-dim"> · {item.meta}</span>}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ════════════════ SPECIAL OFFERS ════════════════ */}
      {/* Soft Shadow skin: panel floats borderless on a diffuse shadow. */}
      <section className="bg-site-surface border border-transparent p-5 md:p-6 rounded-2xl shadow-[0_16px_44px_-26px_rgba(0,0,0,0.85)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            {/* Green savings bar representing deals/discounts */}
            <span aria-hidden="true" className="w-1 self-stretch rounded-full bg-emerald-500" />
            <div>
              <h2 className="text-[19px] md:text-[21px] font-extrabold text-white leading-tight">
                {t("special_offers")}
              </h2>
              <p className="text-[12px] md:text-[13px] text-site-muted font-normal">
                {t("special_offers_subtitle")}
              </p>
            </div>
          </div>
          <Link href="/games" className="shrink-0 text-[12.5px] font-semibold text-site-muted hover:text-white transition-colors flex items-center gap-0.5">
            {t("view_all")} <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {discountedProducts.length === 0 ? (
            <div className="col-span-full flex flex-col items-center py-10 text-[#555]">
              <Tag size={32} className="mb-3 text-[#444]" />
              <p className="text-sm">{t("no_deals")}</p>
            </div>
          ) : (
            discountedProducts.map((deal, idx) => (
              <Link
                key={deal.id}
                href={`/games/${deal.slug}`}
                className="group relative pl-[30px] block transition-transform duration-200 hover:-translate-y-1"
              >
                {/* Floating Game Icon — moves in sync with the card and features smooth zoom on hover */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-[60px] h-[60px] rounded-2xl overflow-hidden shadow-lg border-[3px] border-site-bg bg-[#2A2C30] transition-all duration-200 group-hover:border-white/30 group-hover:shadow-[0_12px_28px_-8px_rgba(0,0,0,0.85)]">
                  <img
                    src={(deal as any).imageUrl || gameImg(deal.name.substring(0, 6), "1A1C20", "555555")}
                    alt={deal.name}
                    className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                  />
                </div>

                {/* Card Body */}
                <div className={`h-full flex flex-col justify-between rounded-xl overflow-hidden bg-gradient-to-r ${dealColors[idx % dealColors.length]} ring-1 ring-transparent ring-inset shadow-[0_10px_26px_-18px_rgba(0,0,0,0.9)] group-hover:ring-white/20 group-hover:shadow-[0_16px_32px_-16px_rgba(0,0,0,0.95)] transition-all duration-200`}>
                  <div className="pl-[42px] pr-3 pt-3 pb-2 h-[52px]">
                    <p className="text-white text-[13px] font-bold line-clamp-1 leading-snug" title={deal.typeName}>{deal.typeName}</p>
                    <p className="text-[#9CA3AF] text-[11px] font-medium line-clamp-1 mt-0.5" title={deal.name}>{deal.name}</p>
                  </div>
                  <div className="pl-[42px] pr-3 pb-2.5 flex items-center gap-3">
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-[2px] rounded-[5px] text-[10px] font-bold tracking-wide whitespace-nowrap shrink-0 shadow-sm">
                      {t("promotion_badge")}
                    </span>
                    <span
                      className={`text-[13px] font-black shrink-0 ${Number(deal.discount) < 0 ? "text-status-danger" : "text-emerald-400"}`}
                      title={Number(deal.discount) < 0 ? "ราคาเพิ่มขึ้นจากมาตรฐาน" : "ประหยัดกว่า"}
                    >
                      {Number(deal.discount) > 0 ? `-${deal.discount}%` : `${deal.discount}%`}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* ════════════════ ALL GAMES SECTION ════════════════ */}
      <section className="pt-12 pb-8">
        {/* Underline header — second device in the header rotation. */}
        <div className="flex items-end justify-between mb-6 border-b border-site-border-soft pb-3">
          <h2 className="text-[20px] md:text-[22px] font-bold text-white leading-none">
            {t("popular_games")}
          </h2>
          <Link href="/games" className="text-[12.5px] text-site-muted hover:text-white transition-colors tracking-wide flex items-center gap-0.5 font-semibold">
            {t("view_all")} <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-8">
          {products.length === 0 ? (
            <div className="col-span-full flex flex-col items-center py-12 text-[#555]">
              <PackageOpen size={36} className="mb-3 text-[#444]" />
              <p className="text-sm">{t("no_products")}</p>
            </div>
          ) : (
            products.map((game, index) => (
              <Link key={game.id} href={`/games/${game.slug}`}>
                <div className="group flex flex-col items-center cursor-pointer relative">
                  {/* HOT Badge - overflows the card */}
                  {(index === 0 || index === 2 || (game as any).isHot) && (
                    <img
                      src="https://assets.lnwtermgame.com/v1/storage/buckets/698c7dfe0038ee35842b/files/69c1fc7f0020f8ff7e7a/view?project=698c7ca4000555520e6b"
                      alt="HOT"
                      className="absolute -top-3 -left-3 z-20 h-[44px] w-auto pointer-events-none"
                    />
                  )}
                  {/* Subtle neutral lift and border highlight on hover */}
                  <div className="relative w-full aspect-square mb-3 rounded-2xl overflow-hidden bg-[#2A2C30] shadow-[0_12px_30px_-20px_rgba(0,0,0,0.9)] ring-1 ring-transparent group-hover:ring-white/25 transition-all duration-200">
                    <img
                      src={game.imageUrl || gameImg(game.name.substring(0, 6), "1A1C20", "555555")}
                      alt={game.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3
                    className="text-[14px] text-center text-white font-bold leading-[1.35] line-clamp-2 w-full px-1 group-hover:text-site-accent transition-colors"
                    title={game.name}
                  >
                    {game.name}
                  </h3>
                  {game.gameDetails?.autoDelivery ? (
                    <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full whitespace-nowrap">
                      <Zap size={10} /> {t("status_instant")}
                    </span>
                  ) : (
                    <span className="mt-1.5 inline-flex items-center text-[10px] font-medium text-[#888] px-2 py-0.5 rounded-full bg-white/5 whitespace-nowrap">
                      {t("status_30_60_mins")}
                    </span>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* ════════════════ NEWS CATEGORY (ข่าวสาร) ════════════════ */}
      <section className="pt-12 pb-8">
        {/* Count header — third device in the rotation; the live article count
            replaces the decorative English sublabel. */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-[20px] md:text-[22px] font-bold text-white leading-none">
              {t("news_title")}
            </h2>
            {!newsLoading && newsItems.length > 0 && (
              <span className="text-[11px] font-bold text-site-text bg-white/10 border border-white/15 px-2 py-0.5 rounded-full">
                {newsItems.length}
              </span>
            )}
          </div>

          <Link href="/news" className="text-[12.5px] text-site-muted hover:text-white transition-colors tracking-wide flex items-center gap-0.5 font-semibold">
            {t("view_all")} <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-8">
          {newsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="w-full aspect-[16/9] bg-[#2A2C30] rounded-lg mb-3" />
                <div className="h-4 bg-[#2A2C30] rounded w-3/4 mb-2" />
                <div className="h-3 bg-[#2A2C30] rounded w-full" />
              </div>
            ))
          ) : newsItems.length === 0 ? (
            <div className="col-span-full flex flex-col items-center py-12 text-[#555]">
              <Newspaper size={36} className="mb-3 text-[#444]" />
              <p className="text-sm">{t("no_news")}</p>
            </div>
          ) : (
            newsItems.map((news) => (
              <Link key={news.id} href={`/news/${news.slug}`}>
                <div className="group flex flex-col cursor-pointer bg-transparent h-full">
                  <div className="relative w-full aspect-[16/9] overflow-hidden rounded-lg mb-3 bg-[#2A2C30] shadow-[0_12px_30px_-20px_rgba(0,0,0,0.9)]">
                    {news.coverImage ? (
                      <img
                        src={news.coverImage}
                        alt={news.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#555] text-sm">
                        <Newspaper size={24} />
                      </div>
                    )}
                  </div>
                  <h3 className="text-[15px] text-white font-bold leading-[1.4] break-words line-clamp-2 mb-1.5 group-hover:text-site-accent transition-colors">
                    {news.title}
                  </h3>
                  <p className="text-[12px] text-[#888] font-normal leading-[1.6] line-clamp-2 pr-2">
                    {news.excerpt}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </section >

      {/* ════════════════ TRUST STRIP ════════════════ */}
      {/* Soft Shadow skin: individual floating chips, centered — each fact
          is its own weightless card. */}
      <section className="mt-14 flex flex-wrap items-stretch justify-center gap-3">
        {trustItems.map((tItem) => (
          <div
            key={tItem.title}
            className="flex items-center gap-3 bg-site-surface border border-transparent rounded-[13px] px-4 py-2.5 shadow-[0_8px_20px_-14px_rgba(0,0,0,0.9)]"
          >
            <tItem.icon size={19} strokeWidth={1.8} className="text-site-muted shrink-0" />
            <div className="leading-snug">
              <p className="text-[13px] font-semibold text-white">{tItem.title}</p>
              <p className="text-[11.5px] text-site-dim">{tItem.desc}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
