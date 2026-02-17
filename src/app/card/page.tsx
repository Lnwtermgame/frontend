"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
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
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "@/lib/framer-exports";
import { productApi, Product } from "@/lib/services/product-api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CountryFlag, getCountryFlagCode } from "@/components/ui/country-flag";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";

// Card interface from API
interface CardProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  discountPercent?: number;
  image: string;
  country: string;
}

function getCategoryFlagCode(name: string): string | null {
  return getCountryFlagCode(name);
}

function sortGlobalOnTop<T extends { id: string; name: string }>(items: T[]): T[] {
  const clone = [...items];
  const idx = clone.findIndex((item) => item.name.toLowerCase() === "global" || item.id.toLowerCase() === "global");
  if (idx > 1) {
    const [globalItem] = clone.splice(idx, 1);
    clone.splice(1, 0, globalItem);
  }
  return clone;
}

// Transform Product to CardProduct
function transformProductToCard(product: Product): CardProduct {
  // Get starting price from types (lowest displayPrice)
  const startingPrice =
    product.types && product.types.length > 0
      ? Math.min(...product.types.map((t) => Number(t.displayPrice)))
      : 0;

  // Discount is not available in public API
  const discountPercent = 0;

  const categoryName = product.category?.name || "Gift Card";
  const regionRaw = product.gameDetails?.region || "";
  
  // Use category name as country if it's a known country, otherwise use region or default to Global
  let country = regionRaw || categoryName || "Global";

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: categoryName,
    price: startingPrice,
    discountPercent: discountPercent,
    image:
      product.imageUrl ||
      `https://placehold.co/400x300?text=${encodeURIComponent(product.name)}`,
    country: country,
  };
}

function getRandomColor() {
  const colors = [
    "1E88E5",
    "5E35B1",
    "D81B60",
    "7CB342",
    "FB8C00",
    "6D4C41",
    "546E7A",
    "EC407A",
    "5C6BC0",
    "26A69A",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getCategoryIcon(category: string) {
  switch (category.toLowerCase()) {
    case "popular":
      return <Star size={16} className="text-brutal-pink" />;
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

function CardContent() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cards, setCards] = useState<CardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<
    { id: string; name: string; count: number; icon: React.ReactNode }[]
  >([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch cards from API
  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true);
        // Fetch CARD products (gift cards)
        const response = await productApi.getProducts({
          isActive: true,
          limit: 100,
          sortBy: "salesCount",
          sortOrder: "desc",
        });

        if (response.success) {
          // Filter for CARD products only and transform
          const cardProducts = response.data
            .filter((p) => p.productType === "CARD")
            .map(transformProductToCard);
          setCards(cardProducts);

          // Build categories from actual data
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
              icon: <CreditCard size={16} />,
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

  // Filter cards based on selected category and search query
  const filteredCards = cards.filter((card) => {
    const matchesCategory =
      selectedCategory === "all" ||
      card.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      card.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6 min-w-0">
        
        {/* Mobile Filter Sheet */}
        <AnimatePresence>
          {isFilterOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFilterOpen(false)}
                className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm lg:hidden"
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 bottom-0 right-0 w-[80%] max-w-sm bg-white z-50 border-l-[3px] border-black flex flex-col lg:hidden shadow-2xl"
              >
                <div className="p-4 border-b-[3px] border-black bg-brutal-yellow flex justify-between items-center">
                  <h2 className="font-black text-xl flex items-center gap-2">
                    <Filter size={20} /> ตัวกรอง
                  </h2>
                  <button onClick={() => setIsFilterOpen(false)} className="p-1 border-[2px] border-black bg-white hover:bg-gray-100">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                   {/* Categories Mobile */}
                   <div>
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      <CreditCard size={18} /> ประเภทบัตร
                    </h3>
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => {
                            setSelectedCategory(category.id);
                            setIsFilterOpen(false);
                          }}
                          className={`w-full flex justify-between items-center p-3 border-[2px] border-black font-bold transition-all active:scale-95 ${
                            selectedCategory === category.id
                              ? "bg-brutal-yellow text-black shadow-[3px_3px_0_0_#000]"
                              : "bg-white text-gray-700"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                             {getCategoryFlagCode(category.name) && (
                                <CountryFlag
                                  code={getCategoryFlagCode(category.name)}
                                  size="S"
                                  className="mr-2"
                                />
                             )}
                             {category.name}
                          </span>
                          <span className="bg-black text-white text-xs px-2 py-0.5 rounded-full">
                            {category.count}
                          </span>
                        </button>
                      ))}
                    </div>
                   </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <motion.div
          className="hidden lg:block w-64 lg:min-w-[256px] shrink-0"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Categories Card */}
          <div
            className="bg-white border-[3px] border-black overflow-hidden mb-4"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="p-4 border-b-[3px] border-black bg-brutal-yellow">
              <h2 className="text-black font-black text-lg flex items-center">
                <CreditCard size={20} className="mr-2" />
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
                      <CountryFlag
                        code={getCategoryFlagCode(category.name)}
                        size="M"
                      />
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
            className="bg-brutal-pink border-[3px] border-black p-4 relative overflow-hidden"
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
              <Button
                size="sm"
                fullWidth
                className="bg-black text-white border-black"
              >
                ดูโปรโมชั่น
              </Button>
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
                  เลือกซื้อบัตรเกมและบัตรเติมเงินได้ทันที
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <Input
                    placeholder="ค้นหาบัตร..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Search size={18} />}
                    className="bg-gray-50"
                  />
                </div>

                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto lg:hidden"
                  onClick={() => setIsFilterOpen(true)}
                >
                  <Filter size={16} className="mr-2" /> ตัวกรอง
                </Button>
                
                <Button 
                   variant="outline" 
                   className="hidden lg:flex"
                   onClick={() => {}}
                >
                   <Filter size={16} className="mr-2" /> ตัวกรอง
                </Button>
              </div>
            </div>
            
             {/* Mobile Horizontal Category Scroll */}
            <div className="lg:hidden mt-4 -mx-5 px-5 overflow-x-auto scrollbar-hide flex gap-2 pb-2">
              <button
                 onClick={() => setSelectedCategory("all")}
                 className={`whitespace-nowrap px-4 py-2 text-sm font-bold border-[2px] border-black transition-all ${
                    selectedCategory === "all" ? "bg-black text-white" : "bg-white text-gray-700"
                 }`}
              >
                ทั้งหมด
              </button>
              {categories.map((cat) => (
                <button
                   key={cat.id}
                   onClick={() => setSelectedCategory(cat.id)}
                   className={`whitespace-nowrap px-4 py-2 text-sm font-bold border-[2px] border-black transition-all ${
                      selectedCategory === cat.id ? "bg-brutal-yellow text-black" : "bg-white text-gray-700"
                   }`}
                >
                  <span className="flex items-center gap-1">
                    {cat.icon} {cat.name}
                  </span>
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
                      className="relative overflow-hidden bg-white border-[3px] border-black transition-all hover:-translate-y-1 group h-full flex flex-col"
                      style={{ boxShadow: "4px 4px 0 0 #000000" }}
                    >
                      {(card.discountPercent || 0) > 0 && (
                        <div
                          className="absolute top-2 left-2 z-10 bg-brutal-pink px-2 py-1 text-[10px] font-bold text-white border-[2px] border-black"
                          style={{ boxShadow: "2px 2px 0 0 #000000" }}
                        >
                          -{card.discountPercent}%
                        </div>
                      )}

                      <div className="relative aspect-square w-full overflow-hidden bg-white flex items-center justify-center">
                        <Image
                          src={
                            card.image !== undefined
                              ? card.image
                              : `https://placehold.co/400x240/${getRandomColor()}/FFFFFF?text=${card.name}`
                          }
                          alt={card.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        />
                        
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div
                            className="bg-brutal-pink text-white px-4 py-2 text-sm font-bold border-[2px] border-black translate-y-4 group-hover:translate-y-0 transition-transform"
                            style={{ boxShadow: "3px 3px 0 0 #000000" }}
                          >
                            ซื้อบัตร
                          </div>
                        </div>
                      </div>

                      <div className="p-2.5 bg-white border-t-[3px] border-black flex-1 flex flex-col justify-between">
                        <p className="text-gray-900 text-xs font-bold line-clamp-2 mb-1 group-hover:text-brutal-pink transition-colors text-center leading-tight">
                          {card.name}
                        </p>
                        <div className="flex items-center justify-center mt-auto">
                           <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-full flex items-center gap-1">
                            <CountryFlag code={getCategoryFlagCode(card.country)} size="S" />
                            {card.category}
                          </span>
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
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                >
                  ล้างตัวกรองทั้งหมด
                </Button>
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
