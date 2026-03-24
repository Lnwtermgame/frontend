"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import {
  Flame, ChevronRight, ChevronLeft, Zap, Gift,
  ShieldCheck,
  Award, Headphones, PackageOpen, Newspaper, Tag,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePublicSettings } from "@/lib/context/public-settings-context";
import { cmsApi, type NewsArticle } from "@/lib/services/cms-api";
import { productApi, type Product } from "@/lib/services/product-api";

const gameImg = (label: string, bg: string, fg: string, w = 500, h = 500) =>
  `https://placehold.co/${w}x${h}/${bg}/${fg}?text=${encodeURIComponent(label)}&font=montserrat`;

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
      image: "https://placehold.co/800x600/FFFFFF/000000?text=ZZZ+Character+Art",
      btnText: t("hero_btn_text"),
      href: "/games/zzz",
      bgRight: "md:bg-gradient-to-r md:from-[#141517] md:to-[#222427]",
    },
    {
      id: "2",
      title: "Genshin Impact",
      subtitle: t("hero_genshin_subtitle"),
      highlightText: t("hero_genshin_highlight_text"),
      highlight: "20%",
      image: "https://placehold.co/800x600/FFFFFF/000000?text=Genshin+Character+Art",
      btnText: t("hero_btn_text"),
      href: "/games/genshin",
      bgRight: "md:bg-gradient-to-r md:from-[#141517] md:to-[#222427]",
    },
  ];

  const heroSlides = settings?.homepage?.heroSlides?.length
    ? settings.homepage.heroSlides.map((slide) => {
      let gradientClass = "md:bg-gradient-to-r md:from-[#141517] md:to-[#222427]";
      if (slide.color === "yellow") gradientClass = "md:bg-gradient-to-r md:from-[#1A180E] md:to-[#2F2913]";
      if (slide.color === "blue") gradientClass = "md:bg-gradient-to-r md:from-[#0E1528] md:to-[#172445]";
      if (slide.color === "pink") gradientClass = "md:bg-gradient-to-r md:from-[#280E1A] md:to-[#45172D]";
      if (slide.color === "green") gradientClass = "md:bg-gradient-to-r md:from-[#0E281A] md:to-[#17452D]";

      return {
        id: slide.id,
        title: slide.title,
        subtitle: slide.subtitle || "",
        highlightText: slide.badgeText ? "HOT" : "",
        highlight: slide.badgeText || "",
        image: slide.image,
        btnText: settings.homepage.sectionLabels?.heroButtonText || t("hero_btn_text"),
        href: slide.link || "/games",
        bgRight: gradientClass,
      };
    })
    : defaultSlides;



  const dealColors = [
    "from-[#3D252E] via-[#2C2D30] to-[#2C2D30]", "from-[#244357] via-[#2C2D30] to-[#2C2D30]",
    "from-[#3B452A] via-[#2C2D30] to-[#2C2D30]", "from-[#3A3C40] via-[#2C2D30] to-[#2C2D30]",
    "from-[#284852] via-[#2C2D30] to-[#2C2D30]", "from-[#1A3A73] via-[#2C2D30] to-[#2C2D30]",
    "from-[#284A63] via-[#2C2D30] to-[#2C2D30]", "from-[#413B63] via-[#2C2D30] to-[#2C2D30]",
    "from-[#1E3E6E] via-[#2C2D30] to-[#2C2D30]", "from-[#2E3A28] via-[#2C2D30] to-[#2C2D30]",
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



  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

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

  const slide = heroSlides[currentSlide];

  const isPageReady = !settingsLoading && !newsLoading && !productsLoading && !dealsLoading;

  // ═══════ GLOBAL LOADING SKELETON ═══════
  if (!isPageReady) {
    return (
      <div className="space-y-6 py-6 pb-20 animate-pulse">
        {/* Hero skeleton */}
        <div className="w-full h-[260px] sm:h-[300px] md:h-[350px] lg:h-[400px] bg-[#1A1C20] rounded-[16px]" />



        {/* Special offers skeleton */}
        <div className="bg-[#1A1C20] border border-site-border p-5 md:p-6 rounded-[16px]">
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
            <div key={i} className="py-6 px-4 bg-[#1A1C20] border border-site-border rounded-[16px] flex flex-col items-center">
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
    <div className="space-y-6 py-6 pb-20 animate-[fadeIn_0.3s_ease-in-out]">
      {/* ════════════════ HERO SLIDER ════════════════ */}
      <section className="relative w-full overflow-hidden bg-[#16181A] isolate ring-1 ring-[#16181A]/50 ring-inset" style={{ borderRadius: 16 }}>
        <div
          className="flex flex-nowrap w-full transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {heroSlides.map((slide) => (
            <div key={slide.id} className="w-full flex-[0_0_100%] relative h-[260px] sm:h-[300px] md:h-[350px] lg:h-[400px] bg-[#16181A] overflow-hidden">

              {/* Left Side: Text Wrapper */}
              <div
                className="absolute left-0 top-0 bottom-0 w-[90%] sm:w-[80%] md:w-[45%] z-10 pointer-events-none md:drop-shadow-[15px_0_20px_rgba(0,0,0,0.85)]"
              >
                <div
                  className={`w-full h-full flex flex-col justify-center pl-7 sm:pl-10 md:pl-20 pr-1 md:pr-10 relative pointer-events-auto bg-transparent md:bg-[#16181A] ${slide.bgRight} md:[clip-path:polygon(0_0,100%_0,calc(100%-15px)_100%,0_100%)] [text-shadow:-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000,0_4px_8px_#000] md:[text-shadow:none]`}
                >
                  <h2 className="text-[14px] sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl tracking-tight text-white font-bold mb-1 md:mb-2 md:drop-shadow-sm leading-tight">{slide.title}</h2>
                  <div className="flex flex-wrap items-baseline gap-x-2 sm:gap-4 mb-2 sm:mb-4 md:mb-6">
                    <span className="text-[11px] sm:text-sm md:text-lg lg:text-xl text-gray-200">{slide.subtitle}</span>
                    <div className="flex items-end text-site-accent">
                      <span className="text-[10px] sm:text-xs md:text-sm lg:text-base mr-1 sm:mr-2 mb-0.5 sm:mb-1 text-white">{slide.highlightText}</span>
                      <span className="text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black leading-none">{slide.highlight}</span>
                    </div>
                  </div>
                  <Link
                    href={slide.href}
                    className="bg-site-accent hover:bg-site-accent-hover border border-transparent text-white w-fit px-4 sm:px-8 md:px-10 lg:px-14 py-1.5 sm:py-2.5 md:py-3 rounded-[6px] transition-colors shadow-accent-glow font-bold text-xs sm:text-sm md:text-base pointer-events-auto mt-1 [text-shadow:none]"
                  >
                    {slide.btnText}
                  </Link>
                </div>
              </div>

              {/* Right Side: Image at original position with gradient blend on left edge */}
              <div className="w-[65%] md:w-[60%] h-full absolute right-0 top-0 bottom-0 z-0 overflow-hidden pointer-events-none">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover object-center"
                />
                {/* Gradient overlay on left edge of image for smooth blending */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `linear-gradient(to right, #16181A 0%, rgba(22,24,26,0.6) 15%, transparent 35%)`,
                  }}
                />

              </div>

            </div>
          ))}
        </div>
        {/* Navigation Arrows */}
        <button
          onClick={() => setCurrentSlide((p) => (p - 1 + heroSlides.length) % heroSlides.length)}
          className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-8 md:w-10 h-8 md:h-10 bg-black/60 border border-white/20 hover:bg-black/90 hover:scale-110 flex items-center justify-center text-white transition-all duration-200 z-10 backdrop-blur-sm rounded-full"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
        </button>
        <button
          onClick={() => setCurrentSlide((p) => (p + 1) % heroSlides.length)}
          className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-8 md:w-10 h-8 md:h-10 bg-black/60 border border-white/20 hover:bg-black/90 hover:scale-110 flex items-center justify-center text-white transition-all duration-200 z-10 backdrop-blur-sm rounded-full"
          aria-label="Next slide"
        >
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
        </button>
        {/* Slide Dots */}
        <div className="absolute bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 z-10 flex gap-2.5">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-2 md:h-2.5 rounded-full transition-all duration-300 ${i === currentSlide ? "w-8 md:w-10 bg-site-accent shadow-accent-glow" : "w-2 md:w-2.5 bg-white/50 hover:bg-white border border-white/10"}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </section>




      {/* ════════════════ SPECIAL OFFERS ════════════════ */}
      <section className="bg-[#1A1C20] border border-site-border p-5 md:p-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-[20px] md:text-[22px] font-extrabold text-white mb-1 tracking-wide flex items-center gap-2">
              <Tag size={20} className="text-[#A3E635]" />
              {t("special_offers")}
            </h2>
            <p className="text-[12px] md:text-[13px] text-[#A1A1AA] font-normal">
              {t("special_offers_subtitle")}
            </p>
          </div>
          <Link href="/games" className="shrink-0 bg-black hover:bg-[#181818] border border-[#444] hover:border-site-accent text-white text-[12px] md:text-[13px] font-bold px-5 py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5">
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
              <Link key={deal.id} href={`/games/${deal.slug}`} className="group relative pl-[30px]">
                {/* Floating Game Icon */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-[60px] h-[60px] rounded-2xl overflow-hidden shadow-lg border-[3px] border-[#1A1C20] bg-[#2A2C30] transition-transform duration-300 group-hover:scale-110">
                  <img
                    src={(deal as any).imageUrl || gameImg(deal.name.substring(0, 6), "1A1C20", "555555")}
                    alt={deal.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Card Body */}
                <div className={`h-full flex flex-col justify-between rounded-xl overflow-hidden bg-gradient-to-r ${dealColors[idx % dealColors.length]} ring-1 ring-transparent ring-inset group-hover:ring-site-accent/40 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_12px_32px_rgba(0,0,0,0.6)]`}>
                  <div className="pl-[42px] pr-3 pt-3 pb-2 h-[52px]">
                    <p className="text-white text-[13px] font-bold line-clamp-1 leading-snug" title={deal.typeName}>{deal.typeName}</p>
                    <p className="text-[#9CA3AF] text-[11px] font-medium line-clamp-1 mt-0.5" title={deal.name}>{deal.name}</p>
                  </div>
                  <div className="pl-[42px] pr-3 pb-2.5 flex items-center gap-3">
                    <span className="bg-site-accent text-white px-2 py-[2px] rounded-[5px] text-[10px] font-bold tracking-wide whitespace-nowrap shrink-0 shadow-sm">
                      {t("promotion_badge")}
                    </span>
                    <span
                      className={`text-[13px] font-black shrink-0 ${Number(deal.discount) < 0 ? "text-red-400" : "text-[#4ADE80]"}`}
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
        <div className="flex flex-col mb-6 relative">
          <div className="flex flex-col relative z-10 w-fit">
            <h2 className="text-[20px] md:text-[22px] font-bold text-white leading-none mb-1">
              {t("popular_games")}
            </h2>
            <p className="text-[10px] md:text-[11px] text-[#666] uppercase font-bold tracking-widest leading-none">
              GAME TOP-UP POPULAR
            </p>
          </div>
          <div className="absolute right-0 bottom-0 text-right">
            <Link href="/games" className="text-[12px] text-site-accent hover:text-white transition-colors tracking-wide flex items-center gap-0.5 font-semibold">
              {t("view_all")} <ChevronRight size={14} />
            </Link>
          </div>
          <div className="h-[1px] w-full bg-[#33353B] mt-3 opacity-50" />
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
                      className="absolute -top-3 -left-3 z-20 h-[44px] w-auto drop-shadow-[0_2px_8px_rgba(255,51,102,0.5)] pointer-events-none"
                    />
                  )}
                  <div className="relative w-full aspect-square mb-3 transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_12px_32px_-8px_rgba(103,176,186,0.2)] rounded-2xl overflow-hidden bg-[#2A2C30] ring-1 ring-white/5 group-hover:ring-site-accent/30">
                    <img
                      src={game.imageUrl || gameImg(game.name.substring(0, 6), "1A1C20", "555555")}
                      alt={game.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
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
        <div className="flex items-end justify-between mb-6">
          <div className="flex flex-col">
            <h2 className="text-[20px] md:text-[22px] font-bold text-white leading-none mb-1">
              {t("news_title")}
            </h2>
            <p className="text-[10px] md:text-[11px] text-[#666] uppercase font-bold tracking-widest leading-none">
              NEWS
            </p>
          </div>

          <Link href="/news" className="text-[12px] text-site-accent hover:text-white transition-colors mb-0.5 tracking-wide flex items-center gap-0.5 font-semibold">
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
                  <div className="relative w-full aspect-[16/9] overflow-hidden rounded-lg mb-3 bg-[#2A2C30] ring-1 ring-white/5">
                    {news.coverImage ? (
                      <img
                        src={news.coverImage}
                        alt={news.title}
                        className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-[1.05]"
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

      {/* ════════════════ TRUST BADGES ════════════════ */}
      < section className="flex flex-wrap justify-center gap-5 mt-16" >
        {
          trustItems.map((tItem) => (
            <div key={tItem.title} className="flex flex-col items-center text-center py-6 px-5 bg-site-surface border border-site-border w-[calc(50%-10px)] lg:w-[calc(25%-15px)] min-w-[160px] rounded-2xl hover:border-site-accent/30 transition-colors duration-200">
              <div className="w-14 h-14 rounded-full bg-site-accent/10 border border-site-accent/20 flex items-center justify-center mb-4">
                <tItem.icon size={24} className="text-site-accent" />
              </div>
              <p className="text-[15px] font-bold text-white mb-1">{tItem.title}</p>
              <p className="text-[12px] text-[#888] leading-snug">{tItem.desc}</p>
            </div>
          ))
        }
      </section >
    </div >
  );
}
