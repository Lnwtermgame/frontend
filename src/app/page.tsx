"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";
import { Gamepad2, Search, Filter, Clock } from "lucide-react";
import { SeasonalEventsGrid } from "@/components/promotion/SeasonalEventsGrid";
import { SeasonalEventProps } from "@/components/promotion/SeasonalEventCard";

type GameType = 'riot' | 'garena' | 'steam' | 'default';

interface GameData {
  id: string;
  title: string;
  image: string;
  price: number;
  originalPrice?: number;
  type: GameType;
  region: string;
  isFavorite?: boolean;
}

// Mock data for games
const featuredGames: GameData[] = [
  {
    id: "valorant-1",
    title: "Valorant",
    image: "https://placehold.co/400x300/101b33/ffffff?text=Valorant",
    price: 35.00,
    originalPrice: 50.00,
    type: "riot",
    region: "TW"
  },
  {
    id: "rov-1",
    title: "Realms of Valor",
    image: "https://placehold.co/400x300/101b33/ffffff?text=Realms+of+Valor",
    price: 10.00,
    originalPrice: 15.00,
    type: "garena",
    region: "TH"
  },
  {
    id: "steam-1",
    title: "Steam Gift Card",
    image: "https://placehold.co/400x300/101b33/ffffff?text=Steam+Gift+Card",
    price: 50.00,
    type: "steam",
    region: "GLOBAL"
  },
  {
    id: "valorant-2",
    title: "Valorant",
    image: "https://placehold.co/400x300/101b33/ffffff?text=Valorant",
    price: 35.00,
    originalPrice: 50.00,
    type: "riot",
    region: "VN"
  }
];

// Hero slider data
const heroSlides = [
  {
    id: 1,
    title: "รับเงินคืน 10% เมื่อเติมเกมผ่านธนาคารกรุงเทพ",
    image: "https://placehold.co/1200x400/101b33/ffffff?text=Promotion+Banner+1",
    link: "/promotions/1"
  },
  {
    id: 2,
    title: "เติมเกมรับเครดิตเพิ่ม 50%",
    image: "https://placehold.co/1200x400/101b33/ffffff?text=Promotion+Banner+2",
    link: "/promotions/2"
  }
];

// Game categories
const categories = [
  { id: "all", name: "ทั้งหมด", icon: <Gamepad2 size={16} /> },
  { id: "online", name: "เกมออนไลน์", icon: <Gamepad2 size={16} /> },
  { id: "cards", name: "บัตรเติมเงิน", icon: <Gamepad2 size={16} /> }
];

// News data
const newsItems = [
  {
    id: 1,
    title: "Valorant เปิดตัวแมพใหม่และตัวละครใหม่ในซีซั่นหน้า",
    image: "https://placehold.co/400x250/101b33/ffffff?text=Valorant+News",
    date: "15 ม.ค. 2023",
    category: "ข่าวเกม"
  },
  {
    id: 2,
    title: "โปรโมชั่นพิเศษสำหรับเกม Steam ในเดือนนี้",
    image: "https://placehold.co/400x250/101b33/ffffff?text=Steam+News",
    date: "10 ม.ค. 2023",
    category: "โปรโมชั่น"
  },
  {
    id: 3,
    title: "การอัปเดตครั้งใหญ่ของ PUBG Mobile พร้อมโหมดใหม่",
    image: "https://placehold.co/400x250/101b33/ffffff?text=PUBG+News",
    date: "5 ม.ค. 2023",
    category: "อัปเดต"
  }
];

// Sample seasonal events
const seasonalEvents: SeasonalEventProps[] = [
  {
    id: "event-1",
    title: "เติมเกมรับเครดิตพิเศษ 10%",
    description: "รับเงินคืน 10% เมื่อเติมเกมผ่านธนาคารกรุงเทพ",
    image: "https://placehold.co/1200x400/1a2547/ffffff?text=PromotionBanner",
    startDate: "2025-03-01",
    endDate: "2025-04-30",
    type: "cashback",
    discount: "10%",
    discountColor: "blue",
    games: ["Mobile Legends", "PUBG Mobile", "Free Fire", "Valorant"]
  },
  {
    id: "event-2",
    title: "เติมเกมรับเครดิตเพิ่ม 50%",
    description: "โปรโมชั่นพิเศษสำหรับสมาชิกใหม่",
    image: "https://placehold.co/1200x400/1a2547/ffffff?text=ExtraCredit",
    startDate: "2025-02-15",
    endDate: "2025-05-15",
    type: "bonus",
    discount: "50%",
    discountColor: "green",
    games: ["Valorant", "League of Legends", "Apex Legends"]
  }
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeCategory, setActiveCategory] = useState("all");

  // Auto rotate hero slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="relative mb-8 pt-4">

        <motion.h1
          className="text-3xl font-bold text-white mb-2 relative"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          MaliGamePass
        </motion.h1>
        <p className="text-mali-text-secondary relative">Your one-stop shop for game top-ups and credits</p>
      </div>

      {/* Hero Section with Promotions */}
      <section className="relative w-full rounded-xl overflow-hidden shadow-card-hover mb-8">
        <div className="relative aspect-[21/9] w-full overflow-hidden">
          {heroSlides.map((slide, index) => (
            <motion.div
              key={slide.id}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{
                opacity: index === currentSlide ? 1 : 0,
                zIndex: index === currentSlide ? 10 : 0
              }}
              transition={{ duration: 0.7 }}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-mali-dark/80 to-transparent" />

              <div className="absolute bottom-8 left-8 max-w-md">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 drop-shadow-lg">
                  {slide.title}
                </h2>
                <motion.button
                  className="bg-button-gradient text-white px-6 py-2 rounded-md font-medium shadow-button-glow"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  เติมเงินเลย
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-4 right-4 flex space-x-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full ${index === currentSlide ? "bg-white shadow-blue-glow" : "bg-white/30"
                }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </section>

      {/* Featured Promotion Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* AI Game Assistant */}
        <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-mali-blue to-black rounded-xl p-6 relative overflow-hidden border border-mali-blue/50 group">
          <div className="relative z-10">
            <div className="text-white text-xs mb-1 bg-mali-blue-accent px-2 py-0.5 rounded font-bold inline-block">ใหม่ปี! 2025</div>
            <h3 className="font-bold text-white text-xl mb-2">AI Game Assistant</h3>
            <p className="text-white/80 text-sm mb-4 max-w-md">
              เช่วยให้ผู้เล่นสามารถจัดการเกมได้ง่ายขึ้น และช่วยเหลือผู้เล่นทุกเกม
            </p>
            <motion.button
              className="bg-white text-black px-4 py-1.5 rounded-md text-sm font-bold hover:bg-gray-200 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ทดลองใช้เลย
            </motion.button>
          </div>

          <div className="absolute right-0 bottom-0 opacity-10">
            <Gamepad2 size={120} />
          </div>
        </div>

        {/* Game Promotion */}
        <div className="bg-mali-card rounded-xl p-6 relative overflow-hidden border border-mali-blue/50">
          <div className="relative z-10">
            <h3 className="font-bold text-white text-lg mb-1">เติมเกมรับเครดิตเพิ่ม 50%</h3>
            <p className="text-white/70 text-xs mb-4">
              เฉพาะวันที่ 1-15 มกราคม 2567 เท่านั้น
            </p>
            <div className="text-white text-sm">
              <div className="flex justify-between mb-2">
                <span>เติมเกมครบ 1,000 บาท</span>
                <span>รับเครดิตเพิ่ม 500 บาท</span>
              </div>
              <motion.button
                className="mt-4 w-full bg-button-gradient text-white py-1.5 rounded-md text-sm font-medium shadow-button-glow"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                โปรโมชั่นทั้งหมด
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <section className="flex flex-wrap items-center justify-between gap-4 py-2 mb-6">
        <div className="flex items-center space-x-2">
          {categories.map((category) => (
            <motion.button
              key={category.id}
              className={`px-4 py-2 rounded-md text-sm flex items-center space-x-2 border transition-colors ${activeCategory === category.id
                  ? "bg-mali-blue-accent text-white border-mali-blue-accent font-bold"
                  : "bg-mali-card border-mali-blue text-mali-text-secondary hover:text-white hover:border-mali-blue-light"
                }`}
              onClick={() => setActiveCategory(category.id)}
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </motion.button>
          ))}

          <motion.button
            className="px-4 py-2 rounded-md bg-mali-blue/20 text-mali-text-secondary hover:text-white text-sm flex items-center space-x-2"
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Filter size={16} />
            <span>Filter</span>
          </motion.button>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search games..."
            className="w-full md:w-64 bg-mali-blue/20 border border-mali-blue/30 rounded-md py-2 pl-9 pr-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-mali-blue-accent focus:border-mali-blue-accent"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mali-text-secondary" size={16} />
        </div>
      </section>

      {/* Featured Games */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Featured Games</h2>
          <Link href="/games" className="text-mali-blue-accent text-sm hover:text-mali-blue-light transition-colors">
            View all games
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {featuredGames.map((game) => (
            <motion.div
              key={game.id}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Link href={`/games/${game.id}`}>
                <div className="bg-mali-card rounded-xl overflow-hidden border border-mali-blue/20 shadow-card-hover">
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <img
                      src={game.image}
                      alt={game.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                    />
                    <div className="absolute top-2 right-2 bg-mali-blue/80 text-white text-xs font-medium px-2 py-0.5 rounded">
                      {game.region}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-medium text-white mb-1">{game.title}</h3>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        {game.originalPrice ? (
                          <>
                            <span className="text-mali-text-secondary line-through text-xs">
                              ฿{game.originalPrice.toFixed(2)}
                            </span>
                            <span className="text-mali-green font-medium">
                              ฿{game.price.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-white">฿{game.price.toFixed(2)}</span>
                        )}
                      </div>
                      <div className={`
                        px-2 py-0.5 rounded text-xs font-medium
                        ${game.type === 'riot' ? 'bg-red-500/20 text-red-400' :
                          game.type === 'garena' ? 'bg-orange-500/20 text-orange-400' :
                            game.type === 'steam' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-mali-blue/20 text-mali-blue-accent'}
                      `}>
                        {game.type}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Special Events Section */}
      <section className="mb-12">
        <SeasonalEventsGrid
          title="โปรโมชั่นพิเศษ"
          description="ดีลพิเศษและโปรโมชั่นตามเทศกาล"
          events={seasonalEvents}
          viewAllUrl="/special-events"
          viewAllText="ดูทั้งหมด"
          featuredLayout={true}
          maxItems={1}
        />
      </section>

      {/* News Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Latest News</h2>
          <Link href="/news" className="text-mali-blue-accent text-sm hover:text-mali-blue-light transition-colors">
            View all news
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {newsItems.map((item) => (
            <motion.div
              key={item.id}
              className="bg-mali-card rounded-xl overflow-hidden border border-mali-blue/20 shadow-card-hover"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Link href={`/news/${item.id}`}>
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                  <div className="absolute top-2 left-2 bg-mali-purple/80 text-white text-xs font-medium px-2 py-0.5 rounded">
                    {item.category}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-medium text-white mb-2">{item.title}</h3>
                  <div className="flex items-center text-mali-text-secondary text-xs">
                    <Clock size={12} className="mr-1" />
                    <span>{item.date}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
} 
