"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Gift, Star, CreditCard, ShoppingBag, PlayCircle, Video, MessageCircle, Loader2 } from "lucide-react";
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
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category?.name || 'Gift Card',
    price: product.price,
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
    case 'popular': return <Star size={16} />;
    case 'gaming': return <PlayCircle size={16} />;
    case 'entertainment': return <Video size={16} />;
    case 'shopping': return <ShoppingBag size={16} />;
    case 'social': return <MessageCircle size={16} />;
    default: return <Gift size={16} />;
  }
}


export default function CardPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cards, setCards] = useState<CardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{id: string; name: string; count: number; icon: React.ReactNode}[]>([]);

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

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Sidebar */}
        <motion.div
          className="w-full lg:w-64 shrink-0 bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden shadow-card-hover sticky top-24"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="p-4 border-b border-mali-blue/20 bg-mali-sidebar">
            <h2 className="text-white font-bold text-lg flex items-center">
              <CreditCard size={18} className="text-mali-blue-light mr-2" />
              ประเภทบัตร
            </h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 text-mali-blue animate-spin" />
            </div>
          ) : (
          <div className="p-4 space-y-1">
            {categories.map(category => (
              <motion.button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full flex justify-between items-center text-left p-2.5 rounded-md group transition-all relative overflow-hidden ${selectedCategory === category.id
                  ? "bg-mali-blue/30 text-white"
                  : "text-mali-text-secondary hover:bg-mali-blue/20 hover:text-white"
                  }`}
                whileHover={{ x: 3 }}
              >
                {selectedCategory === category.id && (
                  <motion.div
                    layoutId="active-category-indicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-mali-blue-light to-mali-purple"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
                <div className="flex items-center gap-3">
                  <span className={`${selectedCategory === category.id ? "text-mali-blue-accent" : "text-mali-text-secondary group-hover:text-white"}`}>
                    {category.icon}
                  </span>
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
                <span className="text-xs bg-mali-blue/30 px-2 py-0.5 rounded-full">{category.count}</span>
              </motion.button>
            ))}
          </div>
          )}

          <div className="p-4 mt-4 space-y-3 border-t border-mali-blue/20">
            <h3 className="text-white font-medium text-sm mb-2 flex items-center">
              <Star size={14} className="text-mali-blue-light mr-2" />
              Popular Cards
            </h3>

            {cards.slice(0, 3).map(card => (
              <Link href={`/card/${card.slug}`} key={`popular-${card.id}`}>
                <motion.div
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-mali-blue/20 transition-colors"
                  whileHover={{ x: 3 }}
                >
                  <div className="w-10 h-10 rounded-md overflow-hidden bg-mali-navy flex items-center justify-center">
                    <img
                      src={card.image !== undefined ? card.image : `https://placehold.co/80x80/${getRandomColor()}/FFFFFF?text=${card.name.substring(0, 2)}`}
                      alt={card.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{card.name}</p>
                    <p className="text-mali-text-secondary text-xs">เริ่มต้น ฿{card.price}</p>
                  </div>
                </motion.div>
              </Link>
            ))}

            <Link href="/card">
              <div className="text-center mt-4 text-mali-blue-light hover:text-mali-blue-accent text-xs">
                View all cards
              </div>
            </Link>
          </div>
        </motion.div>

        <div className="flex-1 space-y-6">
          {/* Header with search and filters */}
          <motion.div
            className="bg-mali-card rounded-xl border border-mali-blue/20 p-4 shadow-card-hover"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-white text-xl font-bold flex items-center">
                  <CreditCard size={20} className="text-mali-blue-light mr-2" />
                  บัตรเกม & บัตรเติมเงิน
                </h1>
                <p className="text-mali-text-secondary text-sm mt-1">เลือกซื้อบัตรเกมและบัตรเติมเงินได้ทันที</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ค้นหาบัตร..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full md:w-64 rounded-md bg-mali-blue/20 border border-mali-blue/30 pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-mali-blue-accent focus:border-mali-blue-accent transition-all"
                  />
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mali-text-secondary" />
                </div>

                <button className="bg-mali-blue/20 text-mali-text-secondary hover:text-white hover:bg-mali-blue/30 text-xs px-3 py-2 rounded-md flex items-center gap-1.5 transition-colors">
                  <Filter size={14} /> ตัวกรอง
                </button>
              </div>
            </div>
          </motion.div>

          {/* Cards grid */}
          <motion.div
            className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {loading ? (
              <div className="col-span-full flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 text-mali-blue animate-spin" />
              </div>
            ) : (
              filteredCards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + (index * 0.05) }}
              >
                <Link href={`/card/${card.slug}`}>
                  <div className="relative overflow-hidden rounded-lg bg-mali-card border border-mali-blue/20 transition-all hover:-translate-y-1 hover:border-mali-blue/40 hover:shadow-card-hover group">
                    {card.discountPercent && card.discountPercent > 0 && (
                      <div className="absolute top-2 right-2 z-10 bg-mali-pink px-2 py-0.5 text-xs font-medium text-white rounded shadow-purple-glow">
                        -{card.discountPercent}%
                      </div>
                    )}

                    <div className="relative aspect-square w-full overflow-hidden">
                      <img
                        src={card.image !== undefined ? card.image : `https://placehold.co/400x240/${getRandomColor()}/FFFFFF?text=${card.name}`}
                        alt={card.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-mali-dark to-transparent opacity-70" />

                      <div className="absolute bottom-2 left-2 bg-mali-blue/30 text-mali-blue-light text-[10px] px-2 py-0.5 rounded-sm backdrop-blur-sm">
                        {card.category}
                      </div>
                    </div>

                    <div className="p-2">
                      <p className="text-white text-xs font-medium line-clamp-1 mb-1 group-hover:text-mali-blue-light transition-colors">{card.name}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {getCategoryIcon(card.category)}
                          <span className="text-mali-text-secondary text-[10px] ml-1">Digital</span>
                        </div>
                        <div className="text-[10px] text-white font-medium">฿{card.price}</div>
                      </div>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-mali-blue/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-white text-mali-dark px-4 py-2 rounded-md text-sm font-medium translate-y-4 group-hover:translate-y-0 transition-transform shadow-button-glow">
                        View Card
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
          </motion.div>
        </div>
      </div>
    </div>
  );
} 
