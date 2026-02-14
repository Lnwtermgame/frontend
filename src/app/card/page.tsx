"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  Gift,
  Star,
  CreditCard,
  ShoppingBag,
  PlayCircle,
  Video,
  MessageCircle,
  Loader2,
  Zap,
  Globe,
  Flame,
  TrendingUp,
} from "lucide-react";
import { motion } from "@/lib/framer-exports";
import { productApi, Product } from "@/lib/services/product-api";

interface CardProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  publisher: string;
  mainImage: string;
  rating: number;
  price: number;
  discountPercent?: number | undefined;
  platforms: string[];
  autoDelivery?: boolean;
}

function getCategoryFlagCode(name: string): string | null {
  const key = name.toLowerCase();
  if (
    key.includes("us") ||
    key.includes("united states") ||
    key.includes("usa")
  )
    return "us";
  if (key.includes("global")) return "un";
  if (key.includes("thailand")) return "th";
  if (key.includes("malaysia")) return "my";
  if (key.includes("singapore")) return "sg";
  if (key.includes("indonesia")) return "id";
  if (key.includes("philippines")) return "ph";
  if (key.includes("vietnam")) return "vn";
  if (key.includes("china")) return "cn";
  return null;
}

function getCategoryIcon(category: string) {
  switch (category.toLowerCase()) {
    case "popular":
      return <Flame size={16} className="text-brutal-pink" />;
    case "gaming":
      return <PlayCircle size={16} className="text-brutal-blue" />;
    case "entertainment":
      return <Video size={16} className="text-brutal-yellow" />;
    case "shopping":
      return <ShoppingBag size={16} className="text-brutal-green" />;
    case "social":
      return <MessageCircle size={16} className="text-brutal-blue" />;
    default:
      return <Gift size={16} className="text-gray-500" />;
  }
}

function transformProductToCard(product: Product): CardProduct {
  const publisher = product.category?.name || "Gift Card";
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
  const discountPercent: number | undefined =
    discountRates.length > 0 ? Math.max(...discountRates) : undefined;

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category?.name || "Gift Card",
    publisher: publisher,
    mainImage:
      product.imageUrl ||
      `https://placehold.co/400x400?text=${encodeURIComponent(product.name)}`,
    rating: product.averageRating || 4.5,
    price: startingPrice,
    discountPercent: discountPercent,
    platforms: ["Digital"],
    autoDelivery: true,
  };
}

function sortGlobalOnTop<T extends { id: string; name: string }>(
  items: T[],
): T[] {
  const clone = [...items];
  const idx = clone.findIndex(
    (item) =>
      item.name.toLowerCase() === "global" ||
      item.id.toLowerCase() === "global",
  );
  if (idx > 1) {
    const [globalItem] = clone.splice(idx, 1);
    clone.splice(1, 0, globalItem);
  }
  return clone;
}

function CardContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("search") || "";
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [cards, setCards] = useState<CardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<
    { id: string; name: string; count: number; icon: React.ReactNode }[]
  >([]);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true);
        const response = await productApi.getProducts({
          isActive: true,
          limit: 100,
          sortBy: "salesCount",
          sortOrder: "desc",
        });

        if (response.success) {
          const cardProducts = response.data
            .filter((p) => p.productType === "CARD")
            .map(transformProductToCard);
          setCards(cardProducts);

          const categoryCounts = cardProducts.reduce(
            (acc, card) => {
              acc[card.category] = (acc[card.category] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          );

          const cats = [
            {
              id: "all",
              name: "บัตรทั้งหมด",
              count: cardProducts.length,
              icon: <CreditCard size={16} className="text-brutal-pink" />,
            },
            ...Object.entries(categoryCounts).map(([name, count]) => ({
              id: name.toLowerCase(),
              name,
              count,
              icon: getCategoryIcon(name),
            })),
          ];
          setCategories(sortGlobalOnTop(cats));
        }
      } catch (error) {
        console.error("Failed to fetch cards:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, []);

  useEffect(() => {
    const query = searchParams.get("search");
    if (query !== null) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  const REGIONS = [
    {
      id: "all",
      name: "ทุกภูมิภาค",
      count: cards.length,
      icon: <Globe size={16} className="text-brutal-blue" />,
    },
    {
      id: "global",
      name: "Global",
      count: cards.filter((c) => c.category.toLowerCase().includes("global"))
        .length,
      icon: <Globe size={16} className="text-brutal-green" />,
    },
    {
      id: "us",
      name: "สหรัฐอเมริกา",
      count: cards.filter((c) => c.category.toLowerCase().includes("us"))
        .length,
      icon: <Star size={16} className="text-brutal-yellow" />,
    },
    {
      id: "th",
      name: "ไทย",
      count: cards.filter((c) => c.category.toLowerCase().includes("thai"))
        .length,
      icon: <Star size={16} className="text-brutal-pink" />,
    },
  ];

  const filteredCards = cards.filter((card) => {
    const matchesCategory =
      selectedCategory === "all" ||
      card.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch =
      !searchQuery ||
      card.name.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesRegion = true;
    if (selectedRegion !== "all") {
      if (selectedRegion === "global") {
        matchesRegion = card.category.toLowerCase().includes("global");
      } else if (selectedRegion === "us") {
        matchesRegion = card.category.toLowerCase().includes("us");
      } else if (selectedRegion === "th") {
        matchesRegion = card.category.toLowerCase().includes("thai");
      }
    }

    return matchesCategory && matchesSearch && matchesRegion;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6 min-w-0">
        {/* Sidebar */}
        <motion.div
          className="w-full lg:w-64 lg:min-w-[256px] shrink-0"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Regions Card */}
          <div
            className="bg-white border-[3px] border-black overflow-hidden mb-4"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="p-4 border-b-[3px] border-black bg-brutal-blue">
              <h3 className="text-black font-black text-base flex items-center">
                <Globe size={18} className="mr-2" />
                ภูมิภาค
              </h3>
            </div>
            <div className="p-3 space-y-1">
              {REGIONS.map((region) => (
                <motion.button
                  key={region.id}
                  onClick={() => setSelectedRegion(region.id)}
                  className={`w-full flex justify-between items-center text-left p-3 group transition-all relative overflow-hidden border-[2px] ${
                    selectedRegion === region.id
                      ? "bg-brutal-blue border-black text-black"
                      : "bg-white border-transparent text-gray-700 hover:border-gray-300"
                  }`}
                  style={
                    selectedRegion === region.id
                      ? { boxShadow: "3px 3px 0 0 #000000" }
                      : undefined
                  }
                  whileHover={{ x: 3 }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        selectedRegion === region.id
                          ? "text-black"
                          : "text-gray-500"
                      }
                    >
                      {region.icon}
                    </span>
                    <span className="text-sm font-bold">{region.name}</span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold border-[2px] border-black ${
                      selectedRegion === region.id
                        ? "bg-white text-black"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {region.count}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Categories Card */}
          <div
            className="bg-white border-[3px] border-black overflow-hidden mb-4"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="p-4 border-b-[3px] border-black bg-brutal-yellow">
              <h2 className="text-black font-black text-lg flex items-center">
                <Gift size={20} className="mr-2" />
                ประเภทบัตร
              </h2>
            </div>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 text-brutal-pink animate-spin" />
              </div>
            ) : (
              <div className="p-3 space-y-1">
                {categories.map((category) => (
                  <motion.button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex justify-between items-center text-left p-3 group transition-all relative overflow-hidden border-[2px] ${
                      selectedCategory === category.id
                        ? "bg-brutal-yellow border-black text-black"
                        : "bg-white border-transparent text-gray-700 hover:border-gray-300"
                    }`}
                    style={
                      selectedCategory === category.id
                        ? { boxShadow: "3px 3px 0 0 #000000" }
                        : undefined
                    }
                    whileHover={{ x: 3 }}
                  >
                    <div className="flex items-center gap-3">
                      {getCategoryFlagCode(category.name) ? (
                        <img
                          src={`https://flagcdn.com/${getCategoryFlagCode(category.name)}.svg`}
                          alt={`${category.name} flag`}
                          className="w-6 h-4 border border-black/10"
                          loading="lazy"
                          width={24}
                          height={18}
                        />
                      ) : (
                        <span
                          className={
                            selectedCategory === category.id
                              ? "text-black"
                              : "text-gray-500"
                          }
                        >
                          {category.icon}
                        </span>
                      )}
                      <span className="text-sm font-bold">{category.name}</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold border-[2px] border-black ${
                        selectedCategory === category.id
                          ? "bg-white text-black"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {category.count}
                    </span>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Promo Card */}
          <div
            className="bg-brutal-green border-[3px] border-black p-4 relative overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={18} className="text-black" />
                <span className="font-black text-black text-sm">
                  โปรโมชั่นบัตร
                </span>
              </div>
              <p className="text-black/80 text-xs mb-3">
                รับส่วนลดพิเศษสำหรับบัตรเติมเงินและบัตรของขวัญ
              </p>
              <motion.button
                className="w-full bg-black text-white px-3 py-2 text-xs font-bold border-[2px] border-black"
                style={{ boxShadow: "3px 3px 0 0 #000000" }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                ดูโปรโมชั่น
              </motion.button>
            </div>
          </div>
        </motion.div>

        <div className="flex-1 min-w-0 space-y-6">
          {/* Header with search and filters */}
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
                  <CreditCard size={24} className="text-brutal-pink mr-2" />
                  บัตรเกม & บัตรเติมเงิน
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  เลือกซื้อบัตรเกมและบัตรเติมเงินได้ทันที ส่งอัตโนมัติ
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ค้นหาบัตร..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full md:w-64 bg-gray-50 border-[2px] border-gray-300 pl-10 pr-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-black transition-all"
                  />
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>

                <button className="bg-white text-gray-700 hover:text-black border-[2px] border-gray-300 hover:border-black text-sm px-4 py-2.5 flex items-center gap-1.5 transition-all font-bold">
                  <Filter size={16} /> ตัวกรอง
                </button>
              </div>
            </div>

            {/* Mobile Horizontal Category Scroll */}
            <div className="lg:hidden mt-4 -mx-5 px-5 overflow-x-auto scrollbar-hide flex gap-2 pb-2">
              {categories.slice(0, 6).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`whitespace-nowrap px-3 py-2 text-xs font-bold border-[2px] border-black transition-all flex-shrink-0 ${
                    selectedCategory === cat.id
                      ? "bg-brutal-yellow text-black"
                      : "bg-white text-gray-700"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Cards grid */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-gray-900 text-lg font-black flex items-center">
                <Gift size={20} className="text-brutal-pink mr-2" />
                บัตรทั้งหมด
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({filteredCards.length})
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredCards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                >
                  <Link href={`/card/${card.slug}`}>
                    <div
                      className="relative overflow-hidden bg-white border-[3px] border-black transition-all hover:-translate-y-1 group"
                      style={{ boxShadow: "4px 4px 0 0 #000000" }}
                    >
                      {card.discountPercent ? (
                        <div
                          className="absolute top-2 left-2 z-10 bg-brutal-pink px-2 py-1 text-[10px] font-bold text-white border-[2px] border-black"
                          style={{ boxShadow: "2px 2px 0 0 #000000" }}
                        >
                          -{card.discountPercent}%
                        </div>
                      ) : null}

                      <div className="relative aspect-square w-full overflow-hidden">
                        <img
                          src={card.mainImage}
                          alt={card.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-70" />

                        {card.autoDelivery && (
                          <div
                            className="absolute bottom-2 right-2 z-10"
                            title="ส่งให้ทันทีหลังชำระเงิน"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 512 512"
                              className="h-6 w-6 drop-shadow-[2px_2px_0_rgba(0,0,0,0.6)]"
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

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div
                            className="bg-brutal-yellow text-black px-4 py-2 text-sm font-bold border-[2px] border-black translate-y-4 group-hover:translate-y-0 transition-transform"
                            style={{ boxShadow: "3px 3px 0 0 #000000" }}
                          >
                            ซื้อบัตร
                          </div>
                        </div>
                      </div>

                      <div className="p-2.5">
                        <p className="text-gray-900 text-xs font-bold line-clamp-1 mb-1 group-hover:text-brutal-pink transition-colors">
                          {card.name}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {getCategoryIcon(card.category)}
                            <span className="text-gray-500 text-[10px] ml-1 truncate max-w-[60px]">
                              {card.category}
                            </span>
                          </div>
                          <div className="text-xs text-black font-black">
                            ฿{card.price}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {filteredCards.length === 0 && !loading && (
              <div className="text-center py-12">
                <CreditCard size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-bold">ไม่พบบัตรที่ค้นหา</p>
                <p className="text-gray-400 text-sm mt-1">
                  ลองค้นหาด้วยคำอื่น หรือเลือกหมวดหมู่อื่น
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function CardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brutal-gray flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader2 className="w-8 h-8 text-brutal-pink animate-spin" />
            <span className="text-gray-900 font-bold">กำลังโหลด...</span>
          </div>
        </div>
      }
    >
      <CardContent />
    </Suspense>
  );
}
