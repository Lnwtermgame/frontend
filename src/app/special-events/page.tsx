"use client";

import { useState } from "react";
import { motion } from "@/lib/framer-exports";
import { Calendar, Gift, Tag, Clock, ChevronRight, Ticket, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { SeasonalEventsGrid } from "@/components/promotion/SeasonalEventsGrid";
import { SeasonalEventProps } from "@/components/promotion/SeasonalEventCard";

// Seasonal event data
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
  },
  {
    id: "event-3",
    title: "ลดราคาบัตรเติมเงิน Steam 15%",
    description: "สำหรับบัตรเติมเงิน Steam ทุกราคาตลอดเดือนเมษายน",
    image: "https://placehold.co/1200x400/1a2547/ffffff?text=SteamDiscount",
    startDate: "2025-04-01",
    endDate: "2025-04-30",
    type: "discount",
    discount: "15%",
    discountColor: "purple",
    games: ["Steam Wallet Card"]
  },
  {
    id: "event-4",
    title: "ซื้อบัตร PlayStation แลกรับแต้มเพิ่มพิเศษ",
    description: "รับแต้มสะสม 2 เท่าเมื่อซื้อบัตร PlayStation ทุกประเภท",
    image: "https://placehold.co/1200x400/1a2547/ffffff?text=PSPointsBonus",
    startDate: "2025-03-15",
    endDate: "2025-05-15",
    type: "bonus",
    discount: "2X",
    discountColor: "blue",
    games: ["PlayStation Store Gift Card"]
  }
];

// Featured game promotions that match the theme
const featuredGames = [
  {
    id: "game-1",
    name: "Mobile Legends",
    image: "https://placehold.co/300x300/1E88E5/white?text=ML",
    discount: "50%",
    price: 9.99,
    originalPrice: 19.99,
    regions: ["TH", "PH", "MY", "ID", "SG", "VN"],
    isBestseller: true
  },
  {
    id: "game-2",
    name: "VALORANT",
    image: "https://placehold.co/300x300/5E35B1/white?text=VALORANT",
    discount: "30%",
    price: 35.00,
    originalPrice: 50.00,
    regions: ["TH", "VN", "PH", "MY", "ID", "TW"],
    isBestseller: true
  },
  {
    id: "game-3",
    name: "Steam Gift Card",
    image: "https://placehold.co/300x300/000000/white?text=STEAM",
    discount: "20%",
    price: 40.00,
    originalPrice: 50.00,
    regions: ["GLOBAL", "WORLD"],
    isBestseller: false
  },
  {
    id: "game-4",
    name: "PlayStation Store Card",
    image: "https://placehold.co/300x300/003791/white?text=PS",
    discount: "25%",
    price: 37.50,
    originalPrice: 50.00,
    regions: ["TH", "SG", "MY", "ID"],
    isBestseller: false
  }
];

// Special coupon codes
const specialCoupons = [
  {
    id: "coupon-1",
    code: "NEWUSER50",
    discount: "50%",
    maxDiscount: "500 บาท",
    minSpend: 1000,
    validUntil: "2025-04-30",
    description: "รับส่วนลด 50% สำหรับสมาชิกใหม่",
    terms: "เฉพาะการเติมเกมครั้งแรก ส่วนลดสูงสุด 500 บาท"
  },
  {
    id: "coupon-2",
    code: "SUMMER15",
    discount: "15%",
    maxDiscount: "300 บาท",
    minSpend: 500,
    validUntil: "2025-06-30",
    description: "ส่วนลดพิเศษสำหรับซัมเมอร์นี้",
    terms: "ใช้ได้กับเกมทุกเกม ยกเว้นบัตรของขวัญ"
  }
];

export default function SpecialEventsPage() {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  // Filter events based on the selected filter
  const filteredEvents = activeFilter === 'all' 
    ? seasonalEvents 
    : seasonalEvents.filter(event => event.type === activeFilter);

  return (
    <div className="page-container">
      {/* Page header with light bloom effect */}
      <div className="relative mb-8">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-mali-blue-light/20 blur-3xl"></div>
        <div className="absolute top-10 -left-20 w-64 h-64 rounded-full bg-mali-purple/20 blur-3xl"></div>
        
        <motion.h1 
          className="text-3xl font-bold text-white mb-2 relative"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          โปรโมชั่นพิเศษ
        </motion.h1>
        <p className="text-mali-text-secondary relative">ดีลพิเศษและโปรโมชั่นตามเทศกาล</p>
      </div>

      {/* Event type filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button 
          onClick={() => setActiveFilter('all')} 
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeFilter === 'all' 
              ? 'bg-mali-blue text-white shadow-button-glow' 
              : 'bg-mali-blue/10 text-mali-text-secondary hover:bg-mali-blue/20'
          }`}
        >
          ทั้งหมด
        </button>
        <button 
          onClick={() => setActiveFilter('cashback')} 
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeFilter === 'cashback' 
              ? 'bg-mali-blue text-white shadow-button-glow' 
              : 'bg-mali-blue/10 text-mali-text-secondary hover:bg-mali-blue/20'
          }`}
        >
          เงินคืน
        </button>
        <button 
          onClick={() => setActiveFilter('discount')} 
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeFilter === 'discount' 
              ? 'bg-mali-blue text-white shadow-button-glow' 
              : 'bg-mali-blue/10 text-mali-text-secondary hover:bg-mali-blue/20'
          }`}
        >
          ส่วนลด
        </button>
        <button 
          onClick={() => setActiveFilter('bonus')} 
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeFilter === 'bonus' 
              ? 'bg-mali-blue text-white shadow-button-glow' 
              : 'bg-mali-blue/10 text-mali-text-secondary hover:bg-mali-blue/20'
          }`}
        >
          โบนัส
        </button>
        <button 
          onClick={() => setActiveFilter('special')} 
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeFilter === 'special' 
              ? 'bg-mali-blue text-white shadow-button-glow' 
              : 'bg-mali-blue/10 text-mali-text-secondary hover:bg-mali-blue/20'
          }`}
        >
          พิเศษ
        </button>
      </div>

      {/* Main event banners using our new component */}
      <section className="mb-12">
        <SeasonalEventsGrid
          events={filteredEvents}
          title=""
          featuredLayout={true}
        />
      </section>
      
      {/* Special coupon codes section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">คูปองส่วนลดพิเศษ</h2>
          <Link href="/coupons" className="text-mali-blue-light hover:text-white transition-colors flex items-center">
            ดูทั้งหมด
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {specialCoupons.map(coupon => (
            <motion.div
              key={coupon.id}
              className="glass-card p-4 border border-mali-blue/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center mb-3">
                  <div className="h-10 w-10 rounded-full bg-mali-blue/20 flex items-center justify-center mr-3">
                    <Ticket className="h-5 w-5 text-mali-blue-light" />
                  </div>
                  <div>
                    <div className="font-mono text-white text-lg font-bold">{coupon.code}</div>
                    <div className="text-xs text-mali-text-secondary">{coupon.description}</div>
                  </div>
                </div>
                <div className="px-3 py-1 bg-mali-blue/20 text-mali-blue-light rounded-full text-sm">
                  {coupon.discount}
                </div>
              </div>
              
              <div className="mt-2 text-xs text-mali-text-secondary">
                <div className="flex justify-between mb-1">
                  <span>ใช้ขั้นต่ำ: ฿{coupon.minSpend}</span>
                  <span>ส่วนลดสูงสุด: {coupon.maxDiscount}</span>
                </div>
                <div>หมดอายุ: {new Date(coupon.validUntil).toLocaleDateString('th-TH')}</div>
                <div className="mt-1 text-mali-blue-light">{coupon.terms}</div>
              </div>
              
              <button
                className="w-full mt-3 bg-mali-blue/20 hover:bg-mali-blue/30 text-mali-blue-light py-2 rounded-md font-medium transition-colors"
              >
                คัดลอกรหัส
              </button>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
} 