"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Filter, Gamepad2, ChevronRight, Star, Tag, Zap, Globe, Flame, TrendingUp, Laptop, Monitor, Smartphone } from "lucide-react";
import { motion } from "@/lib/framer-exports";

// Mock games data
const GAMES = Array(16).fill(null).map((_, i) => ({
  id: `game-${i + 1}`,
  name: `${getGameName(i)}`,
  category: i % 5 === 0 ? "Popular" : i % 4 === 0 ? "RPG" : i % 3 === 0 ? "MOBA" : i % 2 === 0 ? "FPS" : "Adventure",
  price: 5 + ((i * 17) % 95),
  discountPercent: i % 4 === 0 ? ((i * 11) % 30) : 0,
  image: `https://placehold.co/400x300?text=${getGameName(i).replace(/\s+/g, '+')}`,
  publisher: getPublisherName(i),
  rating: (3.5 + ((i * 7) % 15) / 10).toFixed(1)
}));



function getGameName(index: number) {
  const gameNames = [
    "Valorant", "League of Legends", "PUBG", "Mobile Legends", "Call of Duty",
    "Free Fire", "Genshin Impact", "Ragnarok", "Arena of Valor", "Apex Legends",
    "Fortnite", "Overwatch", "Minecraft", "Rainbow Six", "Counter-Strike",
    "Dota 2", "Honor of Kings", "FIFA Mobile", "NBA 2K", "Clash Royale"
  ];
  return gameNames[index % gameNames.length];
}

function getPublisherName(index: number) {
  const publishers = [
    "Riot Games", "Tencent", "Epic Games", "Valve", "Moonton",
    "Activision", "miHoYo", "Garena", "Ubisoft", "Electronic Arts",
    "Blizzard", "PUBG Corp", "Krafton", "Gravity", "Sea Limited"
  ];
  return publishers[index % publishers.length];
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

// Categories for the sidebar
const CATEGORIES = [
  { id: "all", name: "เกมทั้งหมด", count: GAMES.length, icon: <Gamepad2 size={16} /> },
  { id: "popular", name: "เกมยอดนิยม", count: GAMES.filter(g => g.category === "Popular").length, icon: <Flame size={16} /> },
  { id: "fps", name: "FPS", count: GAMES.filter(g => g.category === "FPS").length, icon: <Gamepad2 size={16} /> },
  { id: "moba", name: "MOBA", count: GAMES.filter(g => g.category === "MOBA").length, icon: <TrendingUp size={16} /> },
  { id: "rpg", name: "RPG", count: GAMES.filter(g => g.category === "RPG").length, icon: <Star size={16} /> },
  { id: "adventure", name: "Adventure", count: GAMES.filter(g => g.category === "Adventure").length, icon: <Globe size={16} /> },
];

// Platform options
const PLATFORMS = [
  { id: "all", name: "ทุกแพลตฟอร์ม", count: GAMES.length, icon: <Monitor size={16} /> },
  { id: "mobile", name: "มือถือ", count: Math.floor(GAMES.length * 0.6), icon: <Smartphone size={16} /> },
  { id: "pc", name: "คอมพิวเตอร์", count: Math.floor(GAMES.length * 0.5), icon: <Laptop size={16} /> },
  { id: "console", name: "คอนโซล", count: Math.floor(GAMES.length * 0.3), icon: <Gamepad2 size={16} /> },
];

// Top-up methods
const TOPUP_METHODS = [
  { id: "direct", name: "เติมเงินโดยตรง", count: GAMES.length, icon: <Zap size={16} /> },
  { id: "giftcard", name: "บัตรของขวัญ", count: Math.floor(GAMES.length * 0.5), icon: <Tag size={16} /> },
  { id: "gamecard", name: "บัตรเกม", count: Math.floor(GAMES.length * 0.7), icon: <Gamepad2 size={16} /> },
];

export default function DirectTopupPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter games based on selected category and search query
  const filteredGames = GAMES.filter(game => {
    const matchesCategory = selectedCategory === "all" || game.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = !searchQuery || game.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <motion.div
        className="w-full rounded-xl overflow-hidden relative shadow-card-hover"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative aspect-[21/9] w-full overflow-hidden">
          <div className="absolute inset-0 bg-card-gradient opacity-40"></div>
          <img
            src="https://placehold.co/1200x600?text=Direct+Top-up+Promotion"
            alt="Direct top-up promotion"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-mali-dark/80 to-transparent" />

          <div className="absolute bottom-8 left-8 max-w-md">
            <span className="bg-mali-blue-light/20 text-mali-blue-light text-xs px-3 py-1 rounded-full backdrop-blur-sm inline-block mb-3">
              เติมเกมโดยตรง
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 drop-shadow-lg">
              เติมเกมโดยตรง ได้โบนัสเพิ่ม
            </h2>
            <p className="text-white/80 mb-4 text-sm">
              เติมเงินเกมโปรดของคุณโดยตรง รวดเร็ว ปลอดภัย ได้รับเครดิตทันที พร้อมโบนัสพิเศษ
            </p>
            <motion.button
              className="bg-button-gradient text-white px-6 py-2 rounded-md font-medium shadow-button-glow"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ดูโปรโมชั่น
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <motion.div
          className="w-full lg:w-64 shrink-0 bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden shadow-card-hover"
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
          <div className="p-4 space-y-1">
            {CATEGORIES.map(category => (
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

          <div className="p-4 border-t border-mali-blue/20">
            <h3 className="text-white font-medium text-sm mb-3 flex items-center">
              <Zap size={16} className="text-mali-blue-light mr-2" />
              วิธีเติมเงิน
            </h3>
            <div className="space-y-1">
              {TOPUP_METHODS.map(method => (
                <motion.button
                  key={method.id}
                  className="w-full flex justify-between items-center text-left p-2 rounded-md text-mali-text-secondary hover:bg-mali-blue/20 hover:text-white group"
                  whileHover={{ x: 3 }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-mali-text-secondary group-hover:text-white">
                      {method.icon}
                    </span>
                    <span className="text-sm">{method.name}</span>
                  </div>
                  <ChevronRight size={14} className="text-mali-text-secondary group-hover:text-white" />
                </motion.button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-mali-blue/20">
            <h3 className="text-white font-medium text-sm mb-3 flex items-center">
              <Monitor size={16} className="text-mali-blue-light mr-2" />
              แพลตฟอร์ม
            </h3>
            <div className="space-y-1">
              {PLATFORMS.map(platform => (
                <motion.button
                  key={platform.id}
                  className="w-full flex justify-between items-center text-left p-2 rounded-md text-mali-text-secondary hover:bg-mali-blue/20 hover:text-white group"
                  whileHover={{ x: 3 }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-mali-text-secondary group-hover:text-white">
                      {platform.icon}
                    </span>
                    <span className="text-sm">{platform.name}</span>
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

          {/* Popular Games Horizontal Scroll */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-white text-lg font-bold flex items-center">
                <Flame size={18} className="text-mali-blue-light mr-2" />
                เกมยอดนิยม
              </h2>
              <Link href="/games/popular" className="text-sm text-mali-text-secondary hover:text-white flex items-center group">
                ดูทั้งหมด
                <ChevronRight size={14} className="ml-1 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="flex space-x-4 overflow-x-auto pb-2 hide-scrollbar">
              {GAMES.filter(game => game.category === "Popular").map((game, index) => (
                <motion.div
                  key={`popular-${game.id}`}
                  className="min-w-[180px] w-[180px]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + (index * 0.05) }}
                >
                  <Link href={`/direct-topup/${game.id}`}>
                    <div className="relative overflow-hidden rounded-lg bg-mali-card border border-mali-blue/20 transition-all hover:-translate-y-1 hover:border-mali-blue/40 hover:shadow-card-hover group">
                      <div className="relative h-24 w-full overflow-hidden">
                        <img
                          src={game.image}
                          alt={game.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-mali-dark to-transparent opacity-70" />

                        <div className="absolute top-2 right-2 flex items-center bg-mali-blue/70 backdrop-blur-sm text-white text-xs px-1.5 py-0.5 rounded">
                          <Star size={10} className="mr-0.5 text-yellow-400" /> {game.rating}
                        </div>
                      </div>

                      <div className="p-3">
                        <p className="text-white text-sm font-medium line-clamp-1 mb-0.5 group-hover:text-mali-blue-light transition-colors">{game.name}</p>
                        <p className="text-mali-text-secondary text-xs line-clamp-1">{game.publisher}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
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

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredGames.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + (index * 0.05) }}
                >
                  <Link href={`/direct-topup/${game.id}`}>
                    <div className="relative overflow-hidden rounded-lg bg-mali-card border border-mali-blue/20 transition-all hover:-translate-y-1 hover:border-mali-blue/40 hover:shadow-card-hover group">
                      {game.discountPercent > 0 && (
                        <div className="absolute top-2 left-2 z-10 bg-mali-pink px-2 py-0.5 text-xs font-medium text-white rounded shadow-purple-glow">
                          โบนัส {game.discountPercent}%
                        </div>
                      )}

                      <div className="relative h-32 md:h-36 w-full overflow-hidden">
                        <img
                          src={game.image}
                          alt={game.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-mali-dark to-transparent opacity-70" />

                        <div className="absolute top-2 right-2 flex items-center bg-mali-blue/70 backdrop-blur-sm text-white text-xs px-1.5 py-0.5 rounded">
                          <Star size={10} className="mr-0.5 text-yellow-400" /> {game.rating}
                        </div>

                        <div className="absolute bottom-2 left-2 bg-mali-blue/30 text-mali-blue-light text-xs px-2 py-0.5 rounded-sm backdrop-blur-sm">
                          {game.category}
                        </div>
                      </div>

                      <div className="p-3">
                        <p className="text-white text-sm font-medium line-clamp-1 mb-1 group-hover:text-mali-blue-light transition-colors">{game.name}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {getCategoryIcon(game.category)}
                            <span className="text-mali-text-secondary text-xs ml-1">{game.publisher}</span>
                          </div>
                          <div className="text-xs text-white font-medium">฿{game.price}</div>
                        </div>
                      </div>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-mali-blue/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-white text-mali-dark px-4 py-2 rounded-md text-sm font-medium translate-y-4 group-hover:translate-y-0 transition-transform shadow-button-glow">
                          เติมเงินเลย
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
