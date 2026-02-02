"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Filter, Gamepad2, Star, Zap, Globe, Flame, TrendingUp, Laptop, Monitor, Smartphone, Loader2 } from "lucide-react";
import { motion } from "@/lib/framer-exports";
import { productApi, Product } from "@/lib/services/product-api";

// Game interface from API
interface GameProduct {
  id: string;
  slug: string;
  title: string;
  category: string;
  publisher: string;
  mainImage: string;
  rating: number;
  price: number;
  discountPercent?: number;
  platforms: string[];
}

function getCategoryIcon(category: string) {
  switch (category.toLowerCase()) {
    case 'popular': return <Flame size={16} />;
    case 'fps': return <Gamepad2 size={16} />;
    case 'moba': return <TrendingUp size={16} />;
    case 'rpg': return <Star size={16} />;
    case 'adventure': return <Globe size={16} />;
    default: return <Gamepad2 size={16} />;
  }
}

// Transform Product to GameProduct
function transformProductToGame(product: Product): GameProduct {
  return {
    id: product.id,
    slug: product.slug,
    title: product.name,
    category: product.category?.name || 'Game',
    publisher: product.attributes?.find(a => a.name.toLowerCase().includes('publisher'))?.value || product.category?.name || 'Game',
    mainImage: product.imageUrl || `https://placehold.co/400x400?text=${encodeURIComponent(product.name)}`,
    rating: product.averageRating || 4.5,
    price: product.price,
    discountPercent: product.comparePrice ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0,
    platforms: ['PC', 'Mobile'], // Default platforms - could be extracted from attributes
  };
}

function DirectTopupContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("search") || "";
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [games, setGames] = useState<GameProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{id: string; name: string; count: number; icon: React.ReactNode}[]>([]);

  // Fetch games from API
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        // Fetch DIRECT_TOPUP products (games)
        const response = await productApi.getProducts({
          isActive: true,
          limit: 100,
          sortBy: 'salesCount',
          sortOrder: 'desc',
        });

        if (response.success) {
          // Filter for DIRECT_TOPUP products only and transform
          const gameProducts = response.data
            .filter(p => p.productType === 'DIRECT_TOPUP')
            .map(transformProductToGame);
          setGames(gameProducts);

          // Build categories from actual data
          const categoryCounts = gameProducts.reduce((acc, game) => {
            acc[game.category] = (acc[game.category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          const cats = [
            { id: "all", name: "เกมทั้งหมด", count: gameProducts.length, icon: <Gamepad2 size={16} /> },
            ...Object.entries(categoryCounts).map(([name, count]) => ({
              id: name.toLowerCase(),
              name,
              count,
              icon: getCategoryIcon(name),
            })),
          ];
          setCategories(cats);
        }
      } catch (error) {
        console.error('Failed to fetch games:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  // Update searchQuery when URL params change
  useEffect(() => {
    const query = searchParams.get("search");
    if (query !== null) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  // Platform options
  const PLATFORMS = [
    { id: "all", name: "ทุกแพลตฟอร์ม", count: games.length, icon: <Monitor size={16} /> },
    { id: "mobile", name: "มือถือ", count: games.filter(g => g.platforms.some(p => p === "Mobile" || p === "Android" || p === "iOS")).length, icon: <Smartphone size={16} /> },
    { id: "pc", name: "คอมพิวเตอร์", count: games.filter(g => g.platforms.some(p => p === "PC" || p === "Mac")).length, icon: <Laptop size={16} /> },
    { id: "console", name: "คอนโซล", count: games.filter(g => g.platforms.some(p => p === "Console" || p === "PS4" || p === "PS5" || p === "Xbox")).length, icon: <Gamepad2 size={16} /> },
  ];

  // Filter games based on selected category and search query
  const filteredGames = games.filter(game => {
    // Category filter
    const matchesCategory = selectedCategory === "all" ||
      game.category.toLowerCase() === selectedCategory.toLowerCase() ||
      (selectedCategory === "popular" && (game.category === "Popular" || game.rating >= 4.5));

    // Search filter
    const matchesSearch = !searchQuery || game.title.toLowerCase().includes(searchQuery.toLowerCase());

    // Platform filter
    let matchesPlatform = true;
    if (selectedPlatform !== "all") {
      if (selectedPlatform === "mobile") {
        matchesPlatform = game.platforms.some(p => p === "Mobile" || p === "Android" || p === "iOS");
      } else if (selectedPlatform === "pc") {
        matchesPlatform = game.platforms.some(p => p === "PC" || p === "Mac");
      } else if (selectedPlatform === "console") {
        matchesPlatform = game.platforms.some(p => p === "Console" || p === "PS4" || p === "PS5" || p === "Xbox");
      }
    }

    return matchesCategory && matchesSearch && matchesPlatform;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6 min-w-0">
        {/* Sidebar */}
        <motion.div
          className="w-full lg:w-64 lg:min-w-[256px] shrink-0 bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden shadow-card-hover lg:sticky lg:top-24 lg:h-fit"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="p-4 border-b border-mali-blue/20 bg-mali-sidebar">
            <h2 className="text-white font-bold text-lg flex items-center">
              <Gamepad2 size={18} className="text-mali-blue-light mr-2" />
              หมวดหมู่เกม
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
                    layoutId="active-game-category-indicator"
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

          <div className="p-4 border-t border-mali-blue/20">
            <h3 className="text-white font-medium text-sm mb-3 flex items-center">
              <Monitor size={16} className="text-mali-blue-light mr-2" />
              แพลตฟอร์ม
            </h3>
            <div className="space-y-1">
              {PLATFORMS.map(platform => (
                <motion.button
                  key={platform.id}
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={`w-full flex justify-between items-center text-left p-2.5 rounded-md group transition-all relative overflow-hidden ${selectedPlatform === platform.id
                    ? "bg-mali-blue/30 text-white"
                    : "text-mali-text-secondary hover:bg-mali-blue/20 hover:text-white"
                    }`}
                  whileHover={{ x: 3 }}
                >
                  {selectedPlatform === platform.id && (
                    <motion.div
                      layoutId="active-game-platform-indicator"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-mali-blue-light to-mali-purple"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                  <div className="flex items-center gap-3">
                    <span className={`${selectedPlatform === platform.id ? "text-mali-blue-accent" : "text-mali-text-secondary group-hover:text-white"}`}>
                      {platform.icon}
                    </span>
                    <span className="text-sm font-medium">{platform.name}</span>
                  </div>
                  <span className="text-xs bg-mali-blue/30 px-2 py-0.5 rounded-full">{platform.count}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-mali-blue/20">
            <div className="bg-accent-gradient rounded-lg p-4 text-white shadow-purple-glow relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-purple-300/20 rounded-full blur-xl"></div>
              <div className="absolute right-5 bottom-5 w-16 h-16 bg-pink-300/30 rounded-full blur-lg"></div>
              <div className="relative z-10">
                <h3 className="font-medium mb-2">โบนัสเติมเงินครั้งแรก</h3>
                <p className="text-sm text-white/80 mb-3">รับโบนัส 20% สำหรับการเติมเงินครั้งแรกในทุกเกม</p>
                <motion.button
                  className="w-full bg-white text-mali-purple px-3 py-1.5 rounded text-sm font-medium"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  รับโบนัสเลย
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex-1 min-w-0 space-y-6">
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
                  <Zap size={20} className="text-mali-blue-light mr-2" />
                  เติมเกมโดยตรง
                </h1>
                <p className="text-mali-text-secondary text-sm mt-1">เติมเงินเกมโปรดของคุณโดยตรง รวดเร็ว ปลอดภัย</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ค้นหาเกม..."
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

          {/* Games grid */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-white text-lg font-bold flex items-center">
                <Gamepad2 size={18} className="text-mali-blue-light mr-2" />
                เกมทั้งหมด
              </h2>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredGames.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + (index * 0.05) }}
                >
                  <Link href={`/games/${game.slug}`}>
                    <div className="relative overflow-hidden rounded-lg bg-mali-card border border-mali-blue/20 transition-all hover:-translate-y-1 hover:border-mali-blue/40 hover:shadow-card-hover group">
                      {game.discountPercent && game.discountPercent > 0 ? (
                        <div className="absolute top-2 left-2 z-10 bg-mali-pink px-2 py-0.5 text-xs font-medium text-white rounded shadow-purple-glow">
                          โบนัส {game.discountPercent}%
                        </div>
                      ) : null}

                      <div className="relative aspect-square w-full overflow-hidden">
                        <img
                          src={game.mainImage}
                          alt={game.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-mali-dark to-transparent opacity-70" />

                        <div className="absolute top-2 right-2 flex items-center bg-mali-blue/70 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded">
                          <Star size={8} className="mr-0.5 text-yellow-400" /> {game.rating}
                        </div>

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-mali-blue/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-white text-mali-dark px-4 py-2 rounded-md text-sm font-medium translate-y-4 group-hover:translate-y-0 transition-transform shadow-button-glow">
                            เติมเงินเลย
                          </div>
                        </div>
                      </div>

                      <div className="p-2">
                        <p className="text-white text-xs font-medium line-clamp-1 mb-1 group-hover:text-mali-blue-accent transition-colors">{game.title}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {getCategoryIcon(game.category)}
                            <span className="text-mali-text-secondary text-[10px] ml-1">{game.publisher}</span>
                          </div>
                          <div className="text-[10px] text-white font-medium">฿{game.price}</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function DirectTopupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-mali-dark flex items-center justify-center text-white">Loading...</div>}>
      <DirectTopupContent />
    </Suspense>
  );
}
