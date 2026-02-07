"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";
import { Gamepad2, Search, Filter, Clock, Zap, Sparkles } from "lucide-react";
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
    image: "https://placehold.co/400x300/FF6B9D/ffffff?text=Valorant",
    price: 35.00,
    originalPrice: 50.00,
    type: "riot",
    region: "TW"
  },
  {
    id: "rov-1",
    title: "Realms of Valor",
    image: "https://placehold.co/400x300/4ECDC4/ffffff?text=ROV",
    price: 10.00,
    originalPrice: 15.00,
    type: "garena",
    region: "TH"
  },
  {
    id: "steam-1",
    title: "Steam Gift Card",
    image: "https://placehold.co/400x300/FFD93D/000000?text=Steam",
    price: 50.00,
    type: "steam",
    region: "GLOBAL"
  },
  {
    id: "valorant-2",
    title: "Valorant",
    image: "https://placehold.co/400x300/95E1D3/000000?text=Valorant",
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
    subtitle: "โปรโมชั่นพิเศษสำหรับเดือนนี้เท่านั้น",
    image: "https://placehold.co/1200x400/FFD93D/000000?text=Promotion+Banner",
    link: "/promotions/1",
    color: "yellow"
  },
  {
    id: 2,
    title: "เติมเกมรับเครดิตเพิ่ม 50%",
    subtitle: "สมาชิกใหม่รับโบนัสพิเศษ",
    image: "https://placehold.co/1200x400/FF6B9D/ffffff?text=Extra+Credit",
    link: "/promotions/2",
    color: "pink"
  }
];

// Game categories
const categories = [
  { id: "all", name: "ทั้งหมด", icon: <Gamepad2 size={16} aria-hidden="true" /> },
  { id: "online", name: "เกมออนไลน์", icon: <Gamepad2 size={16} aria-hidden="true" /> },
  { id: "cards", name: "บัตรเติมเงิน", icon: <Gamepad2 size={16} aria-hidden="true" /> }
];

// News data
const newsItems = [
  {
    id: 1,
    title: "Valorant เปิดตัวแมพใหม่และตัวละครใหม่ในซีซั่นหน้า",
    image: "https://placehold.co/400x250/FF6B9D/ffffff?text=Valorant+News",
    date: "15 ม.ค. 2023",
    category: "ข่าวเกม"
  },
  {
    id: 2,
    title: "โปรโมชั่นพิเศษสำหรับเกม Steam ในเดือนนี้",
    image: "https://placehold.co/400x250/4ECDC4/000000?text=Steam+News",
    date: "10 ม.ค. 2023",
    category: "โปรโมชั่น"
  },
  {
    id: 3,
    title: "การอัปเดตครั้งใหญ่ของ PUBG Mobile พร้อมโหมดใหม่",
    image: "https://placehold.co/400x250/FFD93D/000000?text=PUBG+News",
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
    image: "https://placehold.co/1200x400/FFD93D/000000?text=PromotionBanner",
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
    image: "https://placehold.co/1200x400/FF6B9D/ffffff?text=ExtraCredit",
    startDate: "2025-02-15",
    endDate: "2025-05-15",
    type: "bonus",
    discount: "50%",
    discountColor: "green",
    games: ["Valorant", "League of Legends", "Apex Legends"]
  }
];

// Get badge color based on game type
function getTypeBadgeColor(type: GameType): string {
  switch (type) {
    case 'riot':
      return 'bg-brutal-pink text-white';
    case 'garena':
      return 'bg-brutal-yellow text-black';
    case 'steam':
      return 'bg-brutal-blue text-black';
    default:
      return 'bg-gray-200 text-gray-700';
  }
}

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
          className="text-4xl font-black text-black mb-2 relative"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <span className="relative">
            MaliGamePass
            <span className="absolute -bottom-1 left-0 w-full h-3 bg-brutal-yellow -z-10"></span>
          </span>
        </motion.h1>
        <p className="text-gray-600 relative">เติมเกมง่าย ๆ จบที่เดียว บริการเติมเกมครบวงจร</p>
      </div>

      {/* Hero Section with Promotions */}
      <section className="relative w-full rounded-xl overflow-hidden mb-8 border-[3px] border-black"
        style={{ boxShadow: '6px 6px 0 0 #000000' }}
      >
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
                width={1200}
                height={400}
                className="absolute inset-0 w-full h-full object-cover"
                priority={index === 0 ? "true" : undefined}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

              <div className="absolute bottom-8 left-8 max-w-md">
                <h2 className="text-2xl md:text-3xl font-black text-white mb-2 drop-shadow-lg">
                  {slide.title}
                </h2>
                <p className="text-white/90 mb-4 text-sm md:text-base">{slide.subtitle}</p>
                <Link href="/games">
                  <motion.button
                    className={`px-6 py-3 rounded-lg font-bold border-[3px] border-black text-black transition-all ${
                      slide.color === 'pink' ? 'bg-brutal-pink text-white' : 'bg-brutal-yellow text-black'
                    }`}
                    whileHover={{ scale: 1.05, x: -2, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ boxShadow: '4px 4px 0 0 #000000' }}
                  >
                    เติมเกมเลย
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-4 right-4 flex space-x-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              className={`w-3 h-3 rounded-full border-[2px] border-black transition-all ${
                index === currentSlide
                  ? "bg-brutal-yellow"
                  : "bg-white/50 hover:bg-white"
              }`}
              style={index === currentSlide ? { boxShadow: '2px 2px 0 0 #000000' } : undefined}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </section>

      {/* Featured Promotion Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* AI Game Assistant */}
        <div className="col-span-1 md:col-span-2 bg-brutal-blue border-[3px] border-black rounded-xl p-6 relative overflow-hidden group"
          style={{ boxShadow: '6px 6px 0 0 #000000' }}
        >
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1 text-black text-xs mb-2 bg-brutal-yellow px-3 py-1 rounded-md font-bold border-[2px] border-black"
              style={{ boxShadow: '2px 2px 0 0 #000000' }}
            >
              <Sparkles size={12} />
              ใหม่ล่าสุด! 2025
            </div>
            <h3 className="font-black text-black text-2xl mb-2">ผู้ช่วยเกมอัจฉริยะ AI</h3>
            <p className="text-black/80 text-sm mb-4 max-w-md">
              ช่วยให้คุณจัดการเกมได้ง่ายขึ้น พร้อมให้คำแนะนำทุกเกมที่คุณต้องการ
            </p>
            <motion.button
              className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-bold border-[3px] border-black hover:bg-gray-800 transition-colors"
              style={{ boxShadow: '3px 3px 0 0 #000000' }}
              whileHover={{ scale: 1.02, x: -2, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              ทดลองใช้เลย
            </motion.button>
          </div>

          <div className="absolute right-0 bottom-0 opacity-20">
            <Gamepad2 size={140} />
          </div>
        </div>

        {/* Game Promotion */}
        <div className="bg-brutal-pink border-[3px] border-black rounded-xl p-6 relative overflow-hidden"
          style={{ boxShadow: '6px 6px 0 0 #000000' }}
        >
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1 bg-brutal-yellow text-black text-xs px-2 py-1 rounded-md font-bold border-[2px] border-black mb-2"
              style={{ boxShadow: '2px 2px 0 0 #000000' }}
            >
              <Zap size={12} />
              HOT DEAL
            </div>
            <h3 className="font-black text-white text-xl mb-1">เติมเกมรับเครดิตเพิ่ม 50%</h3>
            <p className="text-white/90 text-xs mb-4">
              เฉพาะวันที่ 1-15 มกราคม 2567 เท่านั้น
            </p>
            <motion.button
              className="w-full bg-white text-black py-2.5 rounded-lg text-sm font-bold border-[3px] border-black"
              style={{ boxShadow: '3px 3px 0 0 #000000' }}
              whileHover={{ scale: 1.02, x: -2, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              โปรโมชั่นทั้งหมด
            </motion.button>
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <section className="flex flex-wrap items-center justify-between gap-4 py-2 mb-6">
        <div className="flex items-center space-x-2">
          {categories.map((category) => (
            <motion.button
              key={category.id}
              className={`px-4 py-2.5 rounded-lg text-sm flex items-center space-x-2 border-[3px] font-bold transition-all ${
                activeCategory === category.id
                  ? "bg-brutal-yellow border-black text-black"
                  : "bg-white border-gray-300 text-gray-700 hover:border-black"
              }`}
              style={activeCategory === category.id ? { boxShadow: '4px 4px 0 0 #000000' } : undefined}
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
            type="button"
            className="px-4 py-2.5 rounded-lg bg-white text-gray-700 border-[3px] border-gray-300 text-sm flex items-center space-x-2 font-bold hover:border-black transition-all"
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Filter size={16} aria-hidden="true" />
            <span>ตัวกรอง</span>
          </motion.button>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="ค้นหาเกม…"
            aria-label="ค้นหาเกม"
            autoComplete="off"
            className="w-full md:w-64 bg-white border-[2px] border-gray-300 rounded-lg py-2.5 pl-10 pr-4 text-gray-900 text-sm focus:outline-none focus:border-black focus:ring-0 transition-all"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} aria-hidden="true" />
        </div>
      </section>

      {/* Featured Games */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-black flex items-center">
            <span className="w-2 h-6 bg-brutal-pink mr-3 rounded-sm"></span>
            เกมแนะนำ
          </h2>
          <Link href="/games" className="text-brutal-pink text-sm font-bold hover:underline transition-colors">
            ดูเกมทั้งหมด →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {featuredGames.map((game) => (
            <motion.div
              key={game.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <Link href={`/games/${game.id}`}>
                <div className="bg-white rounded-xl overflow-hidden border-[3px] border-black transition-all hover:-translate-y-1"
                  style={{ boxShadow: '4px 4px 0 0 #000000' }}
                >
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <img
                      src={game.image}
                      alt={game.title}
                      width={400}
                      height={300}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                    />
                    <div className="absolute top-2 right-2 bg-white text-black text-xs font-bold px-2 py-1 rounded-md border-[2px] border-black"
                      style={{ boxShadow: '2px 2px 0 0 #000000' }}
                    >
                      {game.region}
                    </div>

                    {game.originalPrice && (
                      <div className="absolute top-2 left-2 bg-brutal-pink text-white text-xs font-bold px-2 py-1 rounded-md border-[2px] border-black"
                        style={{ boxShadow: '2px 2px 0 0 #000000' }}
                      >
                        -{Math.round(((game.originalPrice - game.price) / game.originalPrice) * 100)}%
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-2 truncate">{game.title}</h3>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {game.originalPrice ? (
                          <>
                            <span className="text-gray-400 line-through text-xs">
                              ฿{game.originalPrice.toFixed(2)}
                            </span>
                            <span className="text-brutal-pink font-black">
                              ฿{game.price.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-black font-black">฿{game.price.toFixed(2)}</span>
                        )}
                      </div>
                      <div className={`px-2 py-1 rounded-md text-xs font-bold border-[2px] border-black ${getTypeBadgeColor(game.type)}`}
                        style={{ boxShadow: '2px 2px 0 0 #000000' }}
                      >
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
        <div className="flex items-center mb-6">
          <h2 className="text-xl font-black text-black flex items-center">
            <span className="w-2 h-6 bg-brutal-yellow mr-3 rounded-sm"></span>
            โปรโมชั่นพิเศษ
          </h2>
        </div>
        <SeasonalEventsGrid
          title=""
          description=""
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
          <h2 className="text-xl font-black text-black flex items-center">
            <span className="w-2 h-6 bg-brutal-blue mr-3 rounded-sm"></span>
            ข่าวสารล่าสุด
          </h2>
          <Link href="/news" className="text-brutal-blue text-sm font-bold hover:underline transition-colors">
            ดูข่าวทั้งหมด →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {newsItems.map((item, index) => (
            <motion.div
              key={item.id}
              className="bg-white rounded-xl overflow-hidden border-[3px] border-black transition-all hover:-translate-y-1"
              style={{ boxShadow: '4px 4px 0 0 #000000' }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <Link href={`/news/${item.id}`}>
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    width={400}
                    height={250}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                  <div className="absolute top-2 left-2 bg-brutal-green text-black text-xs font-bold px-2 py-1 rounded-md border-[2px] border-black"
                    style={{ boxShadow: '2px 2px 0 0 #000000' }}
                  >
                    {item.category}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{item.title}</h3>
                  <div className="flex items-center text-gray-500 text-xs">
                    <Clock size={12} className="mr-1" aria-hidden="true" />
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
