"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Gift, Star, CreditCard, ShoppingBag, PlayCircle, Video, MessageCircle, Loader2, Zap } from "lucide-react";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";
import { productApi, Product } from "@/lib/services/product-api";

// Card interface from API
interface CardProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  discountPercent?: number;
  image: string;
}

// Transform Product to CardProduct
function transformProductToCard(product: Product): CardProduct {
  // Get starting price from seagmTypes (lowest unitPrice) or fallback to product price
  const startingPrice = product.seagmTypes && product.seagmTypes.length > 0
    ? Math.min(...product.seagmTypes.map(t => Number(t.unitPrice)))
    : Number(product.price);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category?.name || 'Gift Card',
    price: startingPrice,
    discountPercent: product.comparePrice ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0,
    image: product.imageUrl || `https://placehold.co/400x300?text=${encodeURIComponent(product.name)}`,
  };
}

function getRandomColor() {
  const colors = ["1E88E5", "5E35B1", "D81B60", "7CB342", "FB8C00", "6D4C41", "546E7A", "EC407A", "5C6BC0", "26A69A"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getCategoryIcon(category: string) {
  switch (category.toLowerCase()) {
    case 'popular': return <Star size={16} className="text-brutal-pink" />;
    case 'gaming': return <PlayCircle size={16} className="text-brutal-blue" />;
    case 'entertainment': return <Video size={16} className="text-brutal-yellow" />;
    case 'shopping': return <ShoppingBag size={16} className="text-brutal-green" />;
    case 'social': return <MessageCircle size={16} className="text-brutal-blue" />;
    default: return <Gift size={16} className="text-gray-500" />;
  }
}


export default function CardPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cards, setCards] = useState<CardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{ id: string; name: string; count: number; icon: React.ReactNode }[]>([]);

  // Fetch cards from API
  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true);
        // Fetch CARD products (gift cards)
        const response = await productApi.getProducts({
          isActive: true,
          limit: 100,
          sortBy: 'salesCount',
          sortOrder: 'desc',
        });

        if (response.success) {
          // Filter for CARD products only and transform
          const cardProducts = response.data
            .filter(p => p.productType === 'CARD')
            .map(transformProductToCard);
          setCards(cardProducts);

          // Build categories from actual data
          const categoryCounts = cardProducts.reduce((acc, card) => {
            acc[card.category] = (acc[card.category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          const cats = [
            { id: "all", name: "All Cards", count: cardProducts.length, icon: <CreditCard size={16} /> },
            { id: "popular", name: "Popular", count: cardProducts.filter(c => c.category === "Popular").length, icon: <Star size={16} /> },
            ...Object.entries(categoryCounts)
              .filter(([name]) => name !== "Popular")
              .map(([name, count]) => ({
                id: name.toLowerCase(),
                name,
                count,
                icon: getCategoryIcon(name),
              })),
          ];
          setCategories(cats);
        }
      } catch (error) {
        console.error('Failed to fetch cards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, []);

  // Filter cards based on selected category and search query
  const filteredCards = cards.filter(card => {
    const matchesCategory = selectedCategory === "all" || card.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = !searchQuery || card.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
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
          {/* Categories Card */}
          <div className="bg-white border-[3px] border-black overflow-hidden mb-4"
            style={{ boxShadow: '4px 4px 0 0 #000000' }}
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
                {categories.map(category => (
                  <motion.button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex justify-between items-center text-left p-3 group transition-all relative overflow-hidden border-[2px] ${
                      selectedCategory === category.id
                        ? "bg-brutal-yellow border-black text-black"
                        : "bg-white border-transparent text-gray-700 hover:border-gray-300"
                    }`}
                    style={selectedCategory === category.id ? { boxShadow: '3px 3px 0 0 #000000' } : undefined}
                    whileHover={{ x: 3 }}
                  >
                    <div className="flex items-center gap-3">
                      <span className={selectedCategory === category.id ? "text-black" : "text-gray-500"}>
                        {category.icon}
                      </span>
                      <span className="text-sm font-bold">{category.name}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold border-[2px] border-black ${
                      selectedCategory === category.id ? "bg-white text-black" : "bg-gray-100 text-gray-600"
                    }`}>
                      {category.count}
                    </span>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Promo Card */}
          <div className="bg-brutal-pink border-[3px] border-black p-4 relative overflow-hidden"
            style={{ boxShadow: '4px 4px 0 0 #000000' }}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={18} className="text-black" />
                <span className="font-black text-black text-sm">โปรโมชั่นบัตร</span>
              </div>
              <p className="text-black/80 text-xs mb-3">
                รับส่วนลดพิเศษสำหรับบัตรเติมเงินและบัตรของขวัญ
              </p>
              <motion.button
                className="w-full bg-black text-white px-3 py-2 text-xs font-bold border-[2px] border-black"
                style={{ boxShadow: '3px 3px 0 0 #000000' }}
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
            style={{ boxShadow: '4px 4px 0 0 #000000' }}
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
                <p className="text-gray-500 text-sm mt-1">เลือกซื้อบัตรเกมและบัตรเติมเงินได้ทันที</p>
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

                <button className="bg-white text-gray-700 hover:text-black border-[2px] border-gray-300 hover:border-black text-sm px-4 py-2.5 flex items-center gap-1.5 transition-all font-bold"
                >
                  <Filter size={16} /> ตัวกรอง
                </button>
              </div>
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
                <span className="ml-2 text-sm font-normal text-gray-500">({filteredCards.length})</span>
              </h2>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredCards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + (index * 0.05) }}
                >
                  <Link href={`/card/${card.slug}`}>
                    <div className="relative overflow-hidden bg-white border-[3px] border-black transition-all hover:-translate-y-1 group"
                      style={{ boxShadow: '4px 4px 0 0 #000000' }}
                    >
                      {(card.discountPercent || 0) > 0 && (
                        <div className="absolute top-2 left-2 z-10 bg-brutal-pink px-2 py-1 text-[10px] font-bold text-white border-[2px] border-black"
                          style={{ boxShadow: '2px 2px 0 0 #000000' }}
                        >
                          -{card.discountPercent}%
                        </div>
                      )}

                      <div className="relative aspect-square w-full overflow-hidden">
                        <img
                          src={card.image !== undefined ? card.image : `https://placehold.co/400x240/${getRandomColor()}/FFFFFF?text=${card.name}`}
                          alt={card.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-70" />

                        <div className="absolute top-2 right-2 flex items-center bg-white border-[2px] border-black text-black text-[10px] px-1.5 py-0.5 font-bold"
                          style={{ boxShadow: '2px 2px 0 0 #000000' }}
                        >
                          <Star size={10} className="mr-0.5 text-brutal-yellow" fill="currentColor" /> {card.category}
                        </div>

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <div className="bg-brutal-yellow text-black px-4 py-2 text-sm font-bold border-[2px] border-black translate-y-4 group-hover:translate-y-0 transition-transform"
                            style={{ boxShadow: '3px 3px 0 0 #000000' }}
                          >
                            ดูรายละเอียด
                          </div>
                        </div>
                      </div>

                      <div className="p-2.5">
                        <p className="text-gray-900 text-xs font-bold line-clamp-1 mb-1 group-hover:text-brutal-pink transition-colors">{card.name}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {getCategoryIcon(card.category)}
                            <span className="text-gray-500 text-[10px] ml-1 truncate max-w-[60px]">Digital</span>
                          </div>
                          <div className="text-xs text-black font-black">฿{card.price}</div>
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
                <p className="text-gray-400 text-sm mt-1">ลองค้นหาด้วยคำอื่น หรือเลือกหมวดหมู่อื่น</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
