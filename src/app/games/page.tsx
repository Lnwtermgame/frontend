"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  Gamepad2,
  Zap,
  Globe,
  Flame,
  TrendingUp,
  Laptop,
  Monitor,
  Smartphone,
  Loader2,
} from "lucide-react";
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
  coverImage?: string;
  rating: number;
  price: number;
  discountPercent?: number | undefined;
  platforms: string[];
}

function getCategoryIcon(category: string) {
  switch (category.toLowerCase()) {
    case "popular":
      return <Flame size={16} className="text-brutal-pink" />;
    case "fps":
      return <Gamepad2 size={16} className="text-brutal-blue" />;
    case "moba":
      return <TrendingUp size={16} className="text-brutal-green" />;
    case "rpg":
      return <TrendingUp size={16} className="text-brutal-yellow" />;
    case "adventure":
      return <Globe size={16} className="text-brutal-blue" />;
    default:
      return <Gamepad2 size={16} className="text-gray-500" />;
  }
}

// Transform Product to GameProduct
function transformProductToGame(product: Product): GameProduct {
  // Use game details for publisher if available
  const publisher =
    product.gameDetails?.publisher || product.gameDetails?.developer;

  // Get starting price from seagmTypes (lowest sellingPrice)
  const startingPrice =
    product.seagmTypes && product.seagmTypes.length > 0
      ? Math.min(
          ...product.seagmTypes
            .filter((t) => t.sellingPrice && t.sellingPrice > 0)
            .map((t) => Number(t.sellingPrice)),
        )
      : 0;

  // Get max discount rate from seagmTypes (use discountRate from API)
  let discountPercent: number | undefined = undefined;
  if (product.seagmTypes && product.seagmTypes.length > 0) {
    // Find the highest discount rate among all types
    const maxDiscount = Math.max(
      ...product.seagmTypes.map((t) => Number(t.discountRate || 0)),
    );
    // Only show if discount is between 1% and 99%
    if (maxDiscount >= 1 && maxDiscount < 100) {
      discountPercent = maxDiscount;
    }
  }

  return {
    id: product.id,
    slug: product.slug,
    title: product.name,
    category: "Direct Top-Up",
    publisher: publisher || "Unknown Publisher",
    mainImage:
      product.imageUrl ||
      `https://placehold.co/400x400?text=${encodeURIComponent(product.name)}`,
    rating: product.averageRating || 4.5,
    price: startingPrice,
    discountPercent: discountPercent,
    platforms: product.gameDetails?.platforms || ["PC", "Mobile"],
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
  const [categories, setCategories] = useState<
    { id: string; name: string; count: number; icon: React.ReactNode }[]
  >([]);

  // Fetch games from API
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        // Fetch DIRECT_TOPUP products (games)
        const response = await productApi.getProducts({
          isActive: true,
          limit: 100,
          sortBy: "salesCount",
          sortOrder: "desc",
        });

        if (response.success) {
          // Filter for DIRECT_TOPUP products only and transform
          const gameProducts = response.data
            .filter((p) => p.productType === "DIRECT_TOPUP")
            .map(transformProductToGame);
          setGames(gameProducts);

          // Build categories from actual data
          const categoryCounts = gameProducts.reduce(
            (acc, game) => {
              acc[game.category] = (acc[game.category] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          );

          const cats = [
            {
              id: "all",
              name: "เกมทั้งหมด",
              count: gameProducts.length,
              icon: <Gamepad2 size={16} className="text-brutal-pink" />,
            },
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
        console.error("Failed to fetch games:", error);
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
    {
      id: "all",
      name: "ทุกแพลตฟอร์ม",
      count: games.length,
      icon: <Monitor size={16} className="text-brutal-blue" />,
    },
    {
      id: "mobile",
      name: "มือถือ",
      count: games.filter((g) =>
        g.platforms.some(
          (p) => p === "Mobile" || p === "Android" || p === "iOS",
        ),
      ).length,
      icon: <Smartphone size={16} className="text-brutal-green" />,
    },
    {
      id: "pc",
      name: "คอมพิวเตอร์",
      count: games.filter((g) =>
        g.platforms.some((p) => p === "PC" || p === "Mac"),
      ).length,
      icon: <Laptop size={16} className="text-brutal-yellow" />,
    },
    {
      id: "console",
      name: "คอนโซล",
      count: games.filter((g) =>
        g.platforms.some(
          (p) => p === "Console" || p === "PS4" || p === "PS5" || p === "Xbox",
        ),
      ).length,
      icon: <Gamepad2 size={16} className="text-brutal-pink" />,
    },
  ];

  // Filter games based on selected category and search query
  const filteredGames = games.filter((game) => {
    // Category filter
    const matchesCategory =
      selectedCategory === "all" ||
      game.category.toLowerCase() === selectedCategory.toLowerCase() ||
      (selectedCategory === "popular" &&
        (game.category === "Popular" || game.rating >= 4.5));

    // Search filter
    const matchesSearch =
      !searchQuery ||
      game.title.toLowerCase().includes(searchQuery.toLowerCase());

    // Platform filter
    let matchesPlatform = true;
    if (selectedPlatform !== "all") {
      if (selectedPlatform === "mobile") {
        matchesPlatform = game.platforms.some(
          (p) => p === "Mobile" || p === "Android" || p === "iOS",
        );
      } else if (selectedPlatform === "pc") {
        matchesPlatform = game.platforms.some((p) => p === "PC" || p === "Mac");
      } else if (selectedPlatform === "console") {
        matchesPlatform = game.platforms.some(
          (p) => p === "Console" || p === "PS4" || p === "PS5" || p === "Xbox",
        );
      }
    }

    return matchesCategory && matchesSearch && matchesPlatform;
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
          <div
            className="bg-white border-[3px] border-black overflow-hidden mb-4"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="p-4 border-b-[3px] border-black bg-brutal-yellow">
              <h2 className="text-black font-black text-lg flex items-center">
                <Gamepad2 size={20} className="mr-2" />
                หมวดหมู่เกม
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
                      <span
                        className={
                          selectedCategory === category.id
                            ? "text-black"
                            : "text-gray-500"
                        }
                      >
                        {category.icon}
                      </span>
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

          {/* Platforms Card */}
          <div
            className="bg-white border-[3px] border-black overflow-hidden mb-4"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="p-4 border-b-[3px] border-black bg-brutal-blue">
              <h3 className="text-black font-black text-base flex items-center">
                <Monitor size={18} className="mr-2" />
                แพลตฟอร์ม
              </h3>
            </div>
            <div className="p-3 space-y-1">
              {PLATFORMS.map((platform) => (
                <motion.button
                  key={platform.id}
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={`w-full flex justify-between items-center text-left p-3 group transition-all relative overflow-hidden border-[2px] ${
                    selectedPlatform === platform.id
                      ? "bg-brutal-blue border-black text-black"
                      : "bg-white border-transparent text-gray-700 hover:border-gray-300"
                  }`}
                  style={
                    selectedPlatform === platform.id
                      ? { boxShadow: "3px 3px 0 0 #000000" }
                      : undefined
                  }
                  whileHover={{ x: 3 }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        selectedPlatform === platform.id
                          ? "text-black"
                          : "text-gray-500"
                      }
                    >
                      {platform.icon}
                    </span>
                    <span className="text-sm font-bold">{platform.name}</span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold border-[2px] border-black ${
                      selectedPlatform === platform.id
                        ? "bg-white text-black"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {platform.count}
                  </span>
                </motion.button>
              ))}
            </div>
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
                  โบนัสเติมเงินครั้งแรก
                </span>
              </div>
              <p className="text-black/80 text-xs mb-3">
                รับโบนัส 20% สำหรับการเติมเงินครั้งแรกในทุกเกม
              </p>
              <motion.button
                className="w-full bg-black text-white px-3 py-2 text-xs font-bold border-[2px] border-black"
                style={{ boxShadow: "3px 3px 0 0 #000000" }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                รับโบนัสเลย
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
                  <Zap
                    size={24}
                    className="text-brutal-yellow mr-2"
                    fill="currentColor"
                  />
                  เติมเกมโดยตรง
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  เติมเงินเกมโปรดของคุณโดยตรง รวดเร็ว ปลอดภัย
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ค้นหาเกม..."
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
          </motion.div>

          {/* Games grid */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-gray-900 text-lg font-black flex items-center">
                <Gamepad2 size={20} className="text-brutal-pink mr-2" />
                เกมทั้งหมด
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({filteredGames.length})
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredGames.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                >
                  <Link href={`/games/${game.slug}`}>
                    <div
                      className="relative overflow-hidden bg-white border-[3px] border-black transition-all hover:-translate-y-1 group"
                      style={{ boxShadow: "4px 4px 0 0 #000000" }}
                    >
                      {game.discountPercent ? (
                        <div
                          className="absolute top-2 left-2 z-10 bg-brutal-pink px-2 py-1 text-[10px] font-bold text-white border-[2px] border-black"
                          style={{ boxShadow: "2px 2px 0 0 #000000" }}
                        >
                          -{game.discountPercent}%
                        </div>
                      ) : null}

                      <div className="relative aspect-square w-full overflow-hidden">
                        <img
                          src={game.mainImage}
                          alt={game.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-70" />

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div
                            className="bg-brutal-yellow text-black px-4 py-2 text-sm font-bold border-[2px] border-black translate-y-4 group-hover:translate-y-0 transition-transform"
                            style={{ boxShadow: "3px 3px 0 0 #000000" }}
                          >
                            เติมเกมเลย
                          </div>
                        </div>
                      </div>

                      <div className="p-2.5">
                        <p className="text-gray-900 text-xs font-bold line-clamp-1 mb-1 group-hover:text-brutal-pink transition-colors">
                          {game.title}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {getCategoryIcon(game.category)}
                            <span className="text-gray-500 text-[10px] ml-1 truncate max-w-[60px]">
                              {game.publisher}
                            </span>
                          </div>
                          <div className="text-xs text-black font-black">
                            ฿{game.price}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {filteredGames.length === 0 && !loading && (
              <div className="text-center py-12">
                <Gamepad2 size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-bold">ไม่พบเกมที่ค้นหา</p>
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

export default function DirectTopupPage() {
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
      <DirectTopupContent />
    </Suspense>
  );
}
