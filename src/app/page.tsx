"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "@/lib/framer-exports";
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
import { SeasonalEventsGrid } from "@/components/promotion/SeasonalEventsGrid";
import { SeasonalEventProps } from "@/components/promotion/SeasonalEventCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { productApi, Product } from "@/lib/services/product-api";

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

function getRegionFlag(region: string): string | null {
  const key = region?.toLowerCase() || "";
  if (key.includes("th") || key.includes("thailand")) return "th";
  if (key.includes("tw") || key.includes("taiwan")) return "tw";
  if (key.includes("vn") || key.includes("vietnam")) return "vn";
  if (key.includes("ph") || key.includes("philippines")) return "ph";
  if (key.includes("id") || key.includes("indonesia")) return "id";
  if (key.includes("my") || key.includes("malaysia")) return "my";
  if (key.includes("sg") || key.includes("singapore")) return "sg";
  if (key.includes("global")) return "un";
  if (key.includes("us")) return "us";
  return null;
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

const heroSlides = [
  {
    id: 1,
    title: "รับเงินคืน 10%",
    subtitle: "เมื่อเติมเกมผ่านธนาคารกรุงเทพ",
    image: "https://placehold.co/1200x400/FFD93D/000000?text=Promotion",
    link: "/promotions/1",
    color: "yellow",
  },
  {
    id: 2,
    title: "เครดิตเพิ่ม 50%",
    subtitle: "สมาชิกใหม่รับโบนัสพิเศษ",
    image: "https://placehold.co/1200x400/FF6B9D/ffffff?text=Extra+Credit",
    link: "/promotions/2",
    color: "pink",
  },
];

const categories = [
  { id: "all", name: "ทั้งหมด", icon: <Gamepad2 size={16} /> },
  { id: "hot", name: "มาแรง", icon: <Flame size={16} /> },
  { id: "cards", name: "บัตรเติมเงิน", icon: <CreditCard size={16} /> },
];

const newsItems = [
  {
    id: 1,
    title: "Valorant เปิดตัวแมพใหม่และตัวละครใหม่ในซีซั่นหน้า",
    image: "https://placehold.co/400x250/FF6B9D/ffffff?text=Valorant",
    date: "15 ม.ค. 2023",
    category: "ข่าวเกม",
  },
  {
    id: 2,
    title: "โปรโมชั่นพิเศษสำหรับเกม Steam ในเดือนนี้",
    image: "https://placehold.co/400x250/4ECDC4/000000?text=Steam",
    date: "10 ม.ค. 2023",
    category: "โปรโมชั่น",
  },
  {
    id: 3,
    title: "การอัปเดตครั้งใหญ่ของ PUBG Mobile",
    image: "https://placehold.co/400x250/FFD93D/000000?text=PUBG",
    date: "5 ม.ค. 2023",
    category: "อัปเดต",
  },
];

const seasonalEvents: SeasonalEventProps[] = [
  {
    id: "event-1",
    title: "เติมเกมรับเครดิตพิเศษ 10%",
    description: "รับเงินคืน 10% เมื่อเติมเกมผ่านธนาคารกรุงเทพ",
    image: "https://placehold.co/1200x400/FFD93D/000000?text=PromotionBanner",
    startDate: "2025-03-01",
    endDate: "2025-04-30",
    type: "cashback",
    discount: "10%",
    discountColor: "blue",
    games: ["Mobile Legends", "PUBG Mobile", "Free Fire", "Valorant"],
  },
];

const quickActions = [
  {
    icon: CreditCard,
    label: "เติมเกม",
    href: "/games",
    color: "bg-brutal-yellow",
  },
  { icon: Gift, label: "บัตรเกม", href: "/card", color: "bg-brutal-pink" },
  {
    icon: Star,
    label: "โปรโมชั่น",
    href: "/?promo=true",
    color: "bg-brutal-green",
  },
  {
    icon: Headphones,
    label: "ช่วยเหลือ",
    href: "/support",
    color: "bg-brutal-blue",
  },
];

const trustBadges = [
  { icon: ShieldCheck, title: "ปลอดภัย 100%", desc: "ระบบความปลอดภัยสูง" },
  { icon: Headphones, title: "บริการ 24 ชม.", desc: "ทีมงานพร้อมช่วยเสมอ" },
  { icon: Zap, title: "เติมทันที", desc: "ส่งอัตโนมัติรวดเร็ว" },
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeCategory, setActiveCategory] = useState("all");
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
    if (activeCategory === "cards") {
      return product.productType === "CARD";
    }
    return true;
  });

  return (
    <div className="min-h-screen pb-8">
      {/* Hero Slider */}
      <section className="relative w-full overflow-hidden border-b-[3px] border-black">
        <div className="relative aspect-[9/16] sm:aspect-[16/9] lg:aspect-[21/9] w-full overflow-hidden bg-gray-900">
          <AnimatePresence mode="wait">
            {heroSlides.map(
              (slide, index) =>
                index === currentSlide && (
                  <motion.div
                    key={slide.id}
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent sm:bg-gradient-to-r sm:from-black/60 sm:to-transparent" />

                    <div className="absolute inset-0 flex items-end sm:items-center">
                      <div className="w-full p-4 sm:p-8 lg:p-12">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="max-w-xl"
                        >
                          <div
                            className={`inline-block px-3 py-1 text-xs font-bold mb-3 border-[2px] border-black ${
                              slide.color === "pink"
                                ? "bg-brutal-pink text-white"
                                : "bg-brutal-yellow text-black"
                            }`}
                            style={{ boxShadow: "2px 2px 0 0 #000000" }}
                          >
                            <Zap size={12} className="inline mr-1" />
                            โปรโมชั่น
                          </div>
                          <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black text-white mb-2 drop-shadow-[2px_2px_0_#000]">
                            {slide.title}
                          </h2>
                          <p className="text-white/90 text-sm sm:text-lg mb-4 font-medium">
                            {slide.subtitle}
                          </p>
                          <Link href={slide.link}>
                            <Button
                              size="lg"
                              className={`font-black text-sm sm:text-base ${
                                slide.color === "pink"
                                  ? "bg-white text-black hover:bg-gray-100"
                                  : "bg-brutal-yellow text-black hover:bg-yellow-400"
                              }`}
                            >
                              ดูรายละเอียด
                              <ChevronRight size={16} className="ml-1" />
                            </Button>
                          </Link>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ),
            )}
          </AnimatePresence>

          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 border-[2px] border-black flex items-center justify-center hover:bg-brutal-yellow transition-colors hidden sm:flex"
            style={{ boxShadow: "2px 2px 0 0 #000000" }}
          >
            <ChevronLeft size={20} className="text-black" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 border-[2px] border-black flex items-center justify-center hover:bg-brutal-yellow transition-colors hidden sm:flex"
            style={{ boxShadow: "2px 2px 0 0 #000000" }}
          >
            <ChevronRight size={20} className="text-black" />
          </button>
        </div>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full border-[2px] border-black transition-all ${
                index === currentSlide
                  ? "bg-brutal-yellow scale-125"
                  : "bg-white/60 hover:bg-white"
              }`}
              style={
                index === currentSlide
                  ? { boxShadow: "1px 1px 0 0 #000000" }
                  : undefined
              }
            />
          ))}
        </div>
      </section>

      {/* Quick Actions - Mobile */}
      <section className="px-4 py-4 sm:hidden">
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <motion.div
                className={`flex flex-col items-center p-3 ${action.color} border-[2px] border-black`}
                style={{ boxShadow: "2px 2px 0 0 #000000" }}
                whileTap={{ scale: 0.95 }}
              >
                <action.icon size={20} className="text-black mb-1" />
                <span className="text-[10px] font-bold text-black text-center">
                  {action.label}
                </span>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      <div className="container mx-auto px-4 space-y-6 md:space-y-8 mt-4 md:mt-8">
        {/* Search Bar - Mobile */}
        <section className="sm:hidden">
          <div className="relative">
            <Input
              placeholder="ค้นหาเกม..."
              icon={<Search size={18} />}
              className="bg-white border-[3px] border-black"
              style={{ boxShadow: "3px 3px 0 0 #000000" }}
            />
          </div>
        </section>

        {/* Featured Promotion Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <motion.div
            className="sm:col-span-2 lg:col-span-2 bg-brutal-blue border-[3px] border-black p-4 sm:p-6 relative overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
            whileHover={{ y: -2 }}
          >
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1 text-black text-xs mb-2 bg-brutal-yellow px-2 py-1 font-bold border-[2px] border-black">
                <Sparkles size={12} />
                ใหม่ล่าสุด!
              </div>
              <h3 className="font-black text-black text-xl sm:text-2xl mb-2">
                ผู้ช่วยเกมอัจฉริยะ AI
              </h3>
              <p className="text-black/80 text-sm mb-4 max-w-md">
                ช่วยให้คุณจัดการเกมได้ง่ายขึ้น
                พร้อมให้คำแนะนำทุกเกมที่คุณต้องการ
              </p>
              <Button className="bg-black text-white hover:bg-gray-800 border-black text-sm">
                ทดลองใช้เลย
              </Button>
            </div>
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
              <Gamepad2 size={140} />
            </div>
          </motion.div>

          <motion.div
            className="bg-brutal-pink border-[3px] border-black p-4 sm:p-6 relative overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
            whileHover={{ y: -2 }}
          >
            <div className="relative z-10 h-full flex flex-col">
              <div className="inline-flex items-center gap-1 bg-brutal-yellow text-black text-xs px-2 py-1 font-bold border-[2px] border-black mb-2 self-start">
                <Flame size={12} />
                HOT
              </div>
              <h3 className="font-black text-white text-lg sm:text-xl mb-2">
                เครดิตเพิ่ม 50%
              </h3>
              <p className="text-white/90 text-sm mb-4">สำหรับสมาชิกใหม่</p>
              <Button className="w-full bg-white text-black hover:bg-gray-100 border-black text-sm mt-auto">
                รับสิทธิ์
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Categories - Horizontal Scroll */}
        <section>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {categories.map((category) => (
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
                {category.icon}
                <span>{category.name}</span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Featured Games - From Database */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-black text-black flex items-center">
              <span className="w-1.5 h-5 sm:h-6 bg-brutal-pink mr-2"></span>
              เกมแนะนำ
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({filteredProducts.length})
              </span>
            </h2>
            <Link
              href="/games"
              className="text-brutal-pink text-sm font-bold hover:underline flex items-center"
            >
              ทั้งหมด
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
                            เติมเกมเลย
                          </div>
                        </div>

                        {/* Auto delivery icon */}
                        {product.autoDelivery && (
                          <div
                            className="absolute bottom-2 right-2 z-10"
                            title="ส่งให้ทันทีหลังชำระเงิน"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 512 512"
                              className="h-5 w-5 sm:h-6 sm:w-6 drop-shadow-[2px_2px_0_rgba(0,0,0,0.6)]"
                              role="img"
                              aria-label="ส่งให้ทันทีหลังชำระเงิน"
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
                                มาแรง
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
              <p className="text-gray-500 font-bold">ไม่พบเกมที่แนะนำ</p>
            </div>
          )}
        </section>

        {/* Trust Badges */}
        <section className="grid grid-cols-3 gap-2 sm:gap-4">
          {trustBadges.map((badge, i) => (
            <div
              key={i}
              className="bg-white border-[2px] border-black p-3 sm:p-4 text-center"
              style={{ boxShadow: "3px 3px 0 0 #000000" }}
            >
              <badge.icon size={24} className="mx-auto text-black mb-2" />
              <p className="text-xs sm:text-sm font-bold text-black">
                {badge.title}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">
                {badge.desc}
              </p>
            </div>
          ))}
        </section>

        {/* Special Events */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-black text-black flex items-center">
              <span className="w-1.5 h-5 sm:h-6 bg-brutal-yellow mr-2"></span>
              โปรโมชั่นพิเศษ
            </h2>
            <Link
              href="/promotions"
              className="text-sm font-bold hover:underline flex items-center"
            >
              ทั้งหมด
              <ChevronRight size={16} />
            </Link>
          </div>
          <SeasonalEventsGrid
            title=""
            description=""
            events={seasonalEvents}
            viewAllUrl="/promotions"
            viewAllText="ดูทั้งหมด"
            featuredLayout={true}
            maxItems={1}
          />
        </section>

        {/* News */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-black text-black flex items-center">
              <span className="w-1.5 h-5 sm:h-6 bg-brutal-blue mr-2"></span>
              ข่าวสารล่าสุด
            </h2>
            <Link
              href="/news"
              className="text-sm font-bold hover:underline flex items-center"
            >
              ทั้งหมด
              <ChevronRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {newsItems.map((item) => (
              <Link key={item.id} href={`/news/${item.id}`} className="block">
                <motion.div
                  className="bg-white border-[2px] border-black overflow-hidden h-full"
                  style={{ boxShadow: "3px 3px 0 0 #000000" }}
                  whileHover={{ y: -2 }}
                >
                  <div className="aspect-video relative">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-brutal-green text-black text-[10px] sm:text-xs font-bold px-2 py-0.5 border-[2px] border-black">
                      {item.category}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-gray-900 text-sm mb-2 line-clamp-2">
                      {item.title}
                    </h3>
                    <div className="flex items-center text-gray-500 text-[10px] sm:text-xs font-medium">
                      <Clock size={12} className="mr-1" />
                      <span>{item.date}</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
