"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useRouter } from "@/i18n/routing";
import {
  ChevronRight,
  ChevronLeft,
  Flame,
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
import { useTranslations, useLocale } from "next-intl";
import toast from "react-hot-toast";
import { usePublicSettings } from "@/lib/context/public-settings-context";
import { useAuth } from "@/lib/hooks/use-auth";
import { cmsApi, type NewsArticle } from "@/lib/services/cms-api";
import { productApi, type Product } from "@/lib/services/product-api";
import { couponApi, type Coupon } from "@/lib/services";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { OfferCard, type Deal } from "@/components/ui/OfferCard";
import { CouponCard } from "@/components/ui/CouponCard";
import { GameTile } from "@/components/ui/GameTile";
import { PanelCard } from "@/components/ui/PanelCard";
import { ListRow } from "@/components/ui/ListRow";
import { TrustStrip, type TrustItem } from "@/components/ui/TrustStrip";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  SkeletonHero,
  SkeletonOfferCard,
  SkeletonCouponCard,
  SkeletonGameTile,
  SkeletonListRow,
  SkeletonNewsCard,
} from "@/components/ui/Skeleton";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

const gameImg = () => "/images/placeholder-game.svg";

function formatDate(
  locale: string,
  dateStr: string | null | undefined,
): string | undefined {
  if (!dateStr) return undefined;
  try {
    return new Date(dateStr).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return undefined;
  }
}

export default function HomePage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const { settings, loading: settingsLoading } = usePublicSettings();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [newsItems, setNewsItems] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const claimingRef = useRef(false);

  // Compact number formatter
  const compact = useMemo(() => {
    const fmt = new Intl.NumberFormat(locale, {
      notation: "compact",
      maximumFractionDigits: 1,
    });
    return (n: number) => fmt.format(n);
  }, [locale]);

  const defaultSlides = [
    {
      id: "1",
      title: "Zenless Zone Zero",
      subtitle: t("hero_zzz_subtitle"),
      badge: t("promotion_badge"),
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
      badge: t("promotion_badge"),
      highlightText: t("hero_genshin_highlight_text"),
      highlight: "20%",
      image: "/images/placeholder-hero.svg",
      btnText: t("hero_btn_text"),
      href: "/games",
    },
  ];

  const heroSlides = settings?.homepage?.heroSlides?.length
    ? settings.homepage.heroSlides.map((slide) => ({
        id: slide.id,
        title: slide.title,
        subtitle: slide.subtitle || "",
        badge: slide.badgeText || "",
        highlightText: "",
        highlight: "",
        image: slide.image,
        btnText:
          settings.homepage.sectionLabels?.heroButtonText || t("hero_btn_text"),
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

  // Track the active slide — embla fires "select" for autoplay, swipe,
  // arrows and dots alike, so dots/arrows stay in sync with every input.
  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => setCurrentSlide(carouselApi.selectedScrollSnap());
    carouselApi.on("select", onSelect);
    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  // Embla measures the container on init, which can run before the hero's
  // final layout (this page mounts the carousel after the data skeleton).
  // Re-measure once the API exists and again after the first paint.
  useEffect(() => {
    if (!carouselApi) return;
    carouselApi.reInit();
    const raf = requestAnimationFrame(() => carouselApi.reInit());
    return () => cancelAnimationFrame(raf);
  }, [carouselApi, heroSlides.length]);

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

  // Fetch products (all types from same response)
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
          setAllProducts(response.data);
        }
      } catch (error) {
        console.error("[HomePage] Failed to fetch products:", error);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Deals derived from the same product list — no extra API round-trip
  const discountedProducts = useMemo<Deal[]>(() => {
    const deals = allProducts
      .map((p) => {
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
          img: p.imageUrl || gameImg(),
        };
      })
      .filter(Boolean) as Deal[];
    return deals.sort((a, b) => b.discount - a.discount).slice(0, 10);
  }, [allProducts]);

  // Fetch coupons — endpoint is auth-gated (order service `authenticate`),
  // so skip for guests instead of guaranteed-401 on every visit.
  useEffect(() => {
    if (!user) {
      setCoupons([]);
      setCouponsLoading(false);
      return;
    }
    const fetchCoupons = async () => {
      try {
        setCouponsLoading(true);
        const response = await couponApi.getAvailableCoupons(1, 5);
        if (response.success && response.data) {
          setCoupons(response.data);
          // Pre-populate claimed state
          const preClaimed = new Set<string>();
          response.data.forEach((c) => {
            if (c.isClaimed) preClaimed.add(c.id);
          });
          setClaimedIds(preClaimed);
        }
      } catch (error) {
        console.error("[HomePage] Failed to fetch coupons:", error);
      } finally {
        setCouponsLoading(false);
      }
    };
    fetchCoupons();
  }, [user]);

  // Derived lists from allProducts
  const popularTopup = useMemo(() => {
    return allProducts
      .filter((p) => p.productType === "DIRECT_TOPUP")
      .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
      .slice(0, 5);
  }, [allProducts]);

  const popularCards = useMemo(() => {
    return allProducts
      .filter((p) => p.productType === "CARD")
      .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
      .slice(0, 5);
  }, [allProducts]);

  const newCards = useMemo(() => {
    return allProducts
      .filter((p) => p.productType === "CARD")
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);
  }, [allProducts]);

  const newTopup = useMemo(() => {
    return allProducts
      .filter((p) => p.productType === "DIRECT_TOPUP")
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);
  }, [allProducts]);

  // Games grid (top 12 DIRECT_TOPUP by salesCount)
  const gamesGrid = useMemo(() => {
    return allProducts
      .filter((p) => p.productType === "DIRECT_TOPUP")
      .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
      .slice(0, 12);
  }, [allProducts]);

  // Coupon claim handler
  const handleClaimCoupon = async (id: string) => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (claimingRef.current) return;
    claimingRef.current = true;
    try {
      setClaimingId(id);
      const response = await couponApi.claimCoupon(id);
      if (response.success) {
        setClaimedIds((prev) => new Set(prev).add(id));
      } else {
        toast.error(response.message || "Failed to claim coupon");
      }
    } catch (error) {
      const message = couponApi.getErrorMessage(error);
      toast.error(message);
    } finally {
      setClaimingId(null);
      claimingRef.current = false;
    }
  };

  const isPageReady =
    !settingsLoading && !newsLoading && !productsLoading && !couponsLoading;

  // ═══════ LOADING SKELETON ═══════
  if (!isPageReady) {
    return (
      <div className="space-y-8 py-2 pb-16">
        <SkeletonHero />

        <section>
          <SectionHeader
            title={t("home_coupons")}
            sublabel={t("home_sublabel_coupons")}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCouponCard key={i} />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            title={t("special_offers")}
            sublabel={t("home_sublabel_offers")}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonOfferCard key={i} />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            title={t("popular_games")}
            sublabel={t("home_sublabel_popular_games")}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonGameTile key={i} />
            ))}
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="site-card p-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <SkeletonListRow key={j} />
              ))}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonNewsCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // ═══════ READY RENDER ═══════
  return (
    <div className="space-y-8 py-2 pb-16">
      {/* ════════════════ HERO SLIDER ════════════════ */}
      {/* Embla (shadcn Carousel) owns the track: swipe, loop, autoplay
          (pauses on hover via stopOnMouseEnter and resumes on its own because
          stopOnInteraction is false). The section is the frame; .hero-clip on
          the Carousel wrapper keeps the compositor-level rounded clip over the
          moving track so artwork never leaks past the corners at fractional
          DPRs. */}
      <section className="relative rounded-8 border border-site-border-soft bg-site-deep">
        <Carousel
          className="hero-clip w-full"
          opts={{ loop: true }}
          plugins={[
            Autoplay({ delay: 6000, stopOnInteraction: false, stopOnMouseEnter: true }),
          ]}
          setApi={setCarouselApi}
        >
          <CarouselContent className="m-0">
            {heroSlides.map((slide, i) => (
              <CarouselItem
                key={slide.id}
                className="relative h-[300px] pl-0 md:h-[380px]"
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  draggable={false}
                  loading={i === 0 ? "eager" : "lazy"}
                />
                {/* Readability shelf: solid on the text side, art shows through right */}
                <div
                  aria-hidden="true"
                  className="hero-scrim absolute inset-0"
                />
                <div
                  aria-hidden="true"
                  className="hero-fade-bottom absolute inset-0"
                />

                <div className="relative z-10 flex h-full max-w-[600px] flex-col justify-center px-6 md:px-12">
                  {slide.badge && (
                    <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-site-accent/40 bg-site-accent/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-site-accent">
                      <Flame
                        size={12}
                        className="fill-current"
                        aria-hidden="true"
                      />
                      {slide.badge}
                    </span>
                  )}
                  <h2 className="text-2xl font-extrabold leading-tight text-site-text md:text-4xl">
                    {slide.title}
                  </h2>
                  {slide.subtitle && (
                    <p className="mt-1.5 text-[13px] leading-relaxed text-site-muted md:text-sm">
                      {slide.subtitle}
                    </p>
                  )}
                  {(slide.highlight || slide.highlightText) && (
                    <div className="mt-2 flex items-baseline gap-2">
                      {slide.highlightText && (
                        <span className="text-sm font-medium text-site-muted">
                          {slide.highlightText}
                        </span>
                      )}
                      {slide.highlight && (
                        <span className="text-3xl font-extrabold leading-none text-site-accent md:text-4xl">
                          {slide.highlight}
                        </span>
                      )}
                    </div>
                  )}
                  <Link
                    href={slide.href}
                    className="site-btn mt-4 w-fit text-[12px] md:text-sm"
                  >
                    {slide.btnText}
                  </Link>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Arrows — desktop only; mobile controls via dots */}
        <button
          onClick={() => carouselApi?.scrollPrev()}
          className="absolute left-4 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-site-border bg-site-bg/80 text-site-text backdrop-blur-sm transition-colors hover:border-site-accent hover:bg-site-accent hover:text-site-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent/60 md:flex"
          aria-label={t("hero_prev_slide")}
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => carouselApi?.scrollNext()}
          className="absolute right-4 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-site-border bg-site-bg/80 text-site-text backdrop-blur-sm transition-colors hover:border-site-accent hover:bg-site-accent hover:text-site-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent/60 md:flex"
          aria-label={t("hero_next_slide")}
        >
          <ChevronRight size={18} />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => carouselApi?.scrollTo(i)}
              aria-label={t("hero_go_to_slide", { index: i + 1 })}
              aria-current={i === currentSlide}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentSlide
                  ? "w-7 bg-site-accent"
                  : "w-2.5 bg-site-text/30 hover:bg-site-text/60"
              }`}
            />
          ))}
        </div>
      </section>

      {/* ════════════════ COUPONS ════════════════ */}
      <section>
        <SectionHeader
          title={t("home_coupons")}
          sublabel={t("home_sublabel_coupons")}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {coupons.length === 0 ? (
            <EmptyState icon={Tag} message={t("home_no_coupons")} />
          ) : (
            coupons.map((coupon) => (
              <CouponCard
                key={coupon.id}
                coupon={coupon}
                onClaim={handleClaimCoupon}
                claiming={claimingId === coupon.id}
                claimed={claimedIds.has(coupon.id)}
                claimLabel={t("home_coupon_claim")}
                claimedLabel={t("home_coupon_claimed")}
              />
            ))
          )}
        </div>
      </section>

      {/* ════════════════ SPECIAL OFFERS ════════════════ */}
      <section>
        <SectionHeader
          title={t("special_offers")}
          sublabel={t("home_sublabel_offers")}
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
                badgeLabel={t("promotion_badge")}
              />
            ))
          )}
        </div>
      </section>

      {/* ════════════════ POPULAR GAMES GRID ════════════════ */}
      <section>
        <SectionHeader
          title={t("popular_games")}
          sublabel={t("home_sublabel_popular_games")}
          actionHref="/games"
          actionLabel={t("view_all")}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {gamesGrid.length === 0 ? (
            <EmptyState icon={PackageOpen} message={t("no_products")} />
          ) : (
            gamesGrid.map((game) => (
              <GameTile
                key={game.id}
                slug={game.slug}
                name={game.name}
                image={game.imageUrl || gameImg()}
                instant={game.gameDetails?.autoDelivery}
              />
            ))
          )}
        </div>
      </section>

      {/* ════════════════ 2×2 PANELS ════════════════ */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Popular Game Cards */}
        <PanelCard
          title={t("home_popular_card")}
          sublabel={t("home_sublabel_popular_card")}
          actionHref="/card"
          actionLabel={t("view_all")}
        >
          {popularCards.length === 0 ? (
            <EmptyState icon={CreditCard} message={t("no_products")} />
          ) : (
            popularCards.map((p) => (
              <ListRow
                key={p.id}
                href={`/card/${p.slug}`}
                title={p.name}
                subtitle={p.gameDetails?.region || p.category?.name}
                icon={p.imageUrl || undefined}
                meta={compact(p.salesCount || 0)}
              />
            ))
          )}
        </PanelCard>

        {/* Popular Game Top-Up */}
        <PanelCard
          title={t("popular_games")}
          sublabel={t("home_sublabel_popular_topup")}
          actionHref="/games"
          actionLabel={t("view_all")}
        >
          {popularTopup.length === 0 ? (
            <EmptyState icon={PackageOpen} message={t("no_products")} />
          ) : (
            popularTopup.map((p) => (
              <ListRow
                key={p.id}
                href={`/games/${p.slug}`}
                title={p.name}
                subtitle={p.gameDetails?.region || p.category?.name}
                icon={p.imageUrl || undefined}
                meta={compact(p.salesCount || 0)}
              />
            ))
          )}
        </PanelCard>

        {/* New Game Cards */}
        <PanelCard
          title={t("home_new_card")}
          sublabel={t("home_sublabel_new_card")}
          actionHref="/card"
          actionLabel={t("view_all")}
        >
          {newCards.length === 0 ? (
            <EmptyState icon={CreditCard} message={t("no_products")} />
          ) : (
            newCards.map((p) => (
              <ListRow
                key={p.id}
                href={`/card/${p.slug}`}
                title={p.name}
                subtitle={p.gameDetails?.region}
                icon={p.imageUrl || undefined}
              />
            ))
          )}
        </PanelCard>

        {/* New Game Top-Up */}
        <PanelCard
          title={t("home_new_topup")}
          sublabel={t("home_sublabel_new_topup")}
          actionHref="/games"
          actionLabel={t("view_all")}
        >
          {newTopup.length === 0 ? (
            <EmptyState icon={PackageOpen} message={t("no_products")} />
          ) : (
            newTopup.map((p) => (
              <ListRow
                key={p.id}
                href={`/games/${p.slug}`}
                title={p.name}
                subtitle={p.gameDetails?.region}
                icon={p.imageUrl || undefined}
              />
            ))
          )}
        </PanelCard>
      </div>

      {/* ════════════════ NEWS COVER GRID ════════════════ */}
      <section>
        <SectionHeader
          title={t("news_title")}
          sublabel={t("home_sublabel_news")}
          actionHref="/news"
          actionLabel={t("view_all")}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {newsItems.length === 0 ? (
            <EmptyState icon={Newspaper} message={t("no_news")} />
          ) : (
            newsItems.map((news) => (
              <Link
                key={news.id}
                href={`/news/${news.slug}`}
                className="site-card overflow-hidden group block"
              >
                {news.coverImage ? (
                  <img
                    src={news.coverImage}
                    alt={news.title}
                    className="aspect-[16/9] w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="aspect-[16/9] w-full bg-site-raised flex items-center justify-center">
                    <Newspaper size={24} className="text-site-dim" />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-[13px] font-semibold text-site-text line-clamp-2 group-hover:text-site-accent transition-colors">
                    {news.title}
                  </p>
                  <p className="text-[11px] text-site-dim mt-1">
                    {formatDate(locale, news.publishedAt || news.createdAt)}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* ════════════════ TRUST STRIP ════════════════ */}
      <TrustStrip items={trustItems} />
    </div>
  );
}
