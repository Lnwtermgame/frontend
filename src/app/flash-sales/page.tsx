"use client";

import { useState, useEffect } from "react";
import { motion } from "@/lib/framer-exports";
import { Clock, Tag, ShoppingCart, Zap, ArrowRight, ChevronRight, Bell } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Mock flash sales data
const mockFlashSales = [
  {
    id: "fs-1",
    title: "PUBG Mobile UC - 50% OFF",
    description: "Limited time offer on PUBG Mobile UC. Get twice the value!",
    originalPrice: 19.99,
    salePrice: 9.99,
    image: "https://placehold.co/600x400/003366/ffffff?text=PUBG+Mobile", // Using placeholder
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(), // 4 hours from now
    percentSold: 68,
  },
  {
    id: "fs-2",
    title: "Valorant Points - 30% OFF",
    description: "Stock up on Valorant Points with this exclusive flash deal",
    originalPrice: 24.99,
    salePrice: 17.49,
    image: "https://placehold.co/600x400/cc0000/ffffff?text=Valorant", // Using placeholder
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(), // 8 hours from now
    percentSold: 42,
  },
  {
    id: "fs-3",
    title: "Steam Wallet Cards - 25% OFF",
    description: "Limited stock! Get your Steam Wallet Cards at a discount",
    originalPrice: 50.00,
    salePrice: 37.50,
    image: "https://placehold.co/600x400/000000/ffffff?text=Steam", // Using placeholder
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(), // 12 hours from now
    percentSold: 85,
  },
  {
    id: "fs-4",
    title: "Free Fire Diamonds - 40% OFF",
    description: "Flash sale on Free Fire Diamonds. Limited quantities available!",
    originalPrice: 9.99,
    salePrice: 5.99,
    image: "https://placehold.co/600x400/ff6600/ffffff?text=Free+Fire", // Using placeholder
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(), // 6 hours from now
    percentSold: 76,
  }
];

// Upcoming flash sales
const upcomingFlashSales = [
  {
    id: "ufs-1",
    title: "Mobile Legends Diamonds",
    description: "Get ready for our biggest Mobile Legends sale ever!",
    discount: "45% OFF",
    image: "https://placehold.co/600x400/660066/ffffff?text=Mobile+Legends", // Using placeholder
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours from now
  },
  {
    id: "ufs-2",
    title: "Roblox Gift Cards",
    description: "Huge discounts coming soon on all Roblox Gift Cards",
    discount: "35% OFF",
    image: "https://placehold.co/600x400/33cc33/ffffff?text=Roblox", // Using placeholder
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 36).toISOString(), // 36 hours from now
  },
  {
    id: "ufs-3",
    title: "Genshin Impact Crystals",
    description: "Limited time offer coming soon on Genesis Crystals",
    discount: "30% OFF",
    image: "https://placehold.co/600x400/6666cc/ffffff?text=Genshin", // Using placeholder
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(), // 48 hours from now
  }
];

// Also update the background pattern
const heroBgStyle = {
  backgroundImage: "linear-gradient(45deg, rgba(60, 60, 190, 0.1) 25%, transparent 25%, transparent 50%, rgba(60, 60, 190, 0.1) 50%, rgba(60, 60, 190, 0.1) 75%, transparent 75%, transparent)",
  backgroundSize: "20px 20px"
};

type TimeLeft = {
  hours: number;
  minutes: number;
  seconds: number;
};

export default function FlashSalesPage() {
  const [timeLeft, setTimeLeft] = useState<Record<string, TimeLeft>>({});
  
  // Calculate time left for each sale
  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft: Record<string, TimeLeft> = {};
      
      mockFlashSales.forEach(sale => {
        const difference = new Date(sale.endTime).getTime() - Date.now();
        
        if (difference > 0) {
          const hours = Math.floor(difference / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);
          
          newTimeLeft[sale.id] = { hours, minutes, seconds };
        } else {
          newTimeLeft[sale.id] = { hours: 0, minutes: 0, seconds: 0 };
        }
      });
      
      setTimeLeft(newTimeLeft);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="page-container">
      {/* Hero Section */}
      <motion.div 
        className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-mali-blue/30 rounded-xl p-8 mb-8 text-center relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 opacity-10" style={heroBgStyle}></div>
        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 text-yellow-400 mr-2" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">Flash Sales</h1>
            </div>
            <p className="text-gray-300 max-w-2xl mx-auto mb-6">
              Limited-time offers with massive discounts. Act fast before they're gone!
            </p>
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-mali-card/60 backdrop-blur-sm px-5 py-3 rounded-lg flex items-center">
                <Clock className="h-5 w-5 text-mali-blue mr-2" />
                <span className="text-white">Limited Time</span>
              </div>
              <div className="bg-mali-card/60 backdrop-blur-sm px-5 py-3 rounded-lg flex items-center">
                <Tag className="h-5 w-5 text-mali-blue mr-2" />
                <span className="text-white">Exclusive Deals</span>
              </div>
              <div className="bg-mali-card/60 backdrop-blur-sm px-5 py-3 rounded-lg flex items-center">
                <ShoppingCart className="h-5 w-5 text-mali-blue mr-2" />
                <span className="text-white">Fast Checkout</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Active Flash Sales */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Zap className="h-6 w-6 text-yellow-400 mr-2" />
            Active Flash Sales
          </h2>
          <Link href="/flash-sales/history" className="text-mali-blue hover:text-white transition-colors flex items-center">
            View History
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockFlashSales.map((sale) => (
            <motion.div 
              key={sale.id}
              className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="relative">
                <div className="aspect-[16/9] relative">
                  <Image 
                    src={sale.image} 
                    alt={sale.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full font-bold text-sm">
                  {Math.round((1 - sale.salePrice / sale.originalPrice) * 100)}% OFF
                </div>
              </div>
              
              <div className="p-5">
                <h3 className="text-lg font-bold text-white mb-2">{sale.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{sale.description}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-gray-400 line-through text-sm mr-2">${sale.originalPrice.toFixed(2)}</span>
                    <span className="text-white font-bold text-xl">${sale.salePrice.toFixed(2)}</span>
                  </div>
                  
                  <div className="bg-mali-blue/20 rounded-lg px-3 py-1.5 flex items-center">
                    <Clock className="h-4 w-4 text-mali-blue mr-2" />
                    <span className="text-white text-sm font-mono">
                      {timeLeft[sale.id] ? (
                        `${String(timeLeft[sale.id].hours).padStart(2, '0')}:${String(timeLeft[sale.id].minutes).padStart(2, '0')}:${String(timeLeft[sale.id].seconds).padStart(2, '0')}`
                      ) : '00:00:00'}
                    </span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="h-2 bg-mali-blue/10 rounded-full">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-mali-blue to-purple-500" 
                      style={{ width: `${sale.percentSold}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-400">
                    <span>{sale.percentSold}% sold</span>
                    <span>Limited quantity</span>
                  </div>
                </div>
                
                <button className="w-full bg-mali-blue hover:bg-mali-blue/90 text-white py-3 rounded-lg font-medium flex items-center justify-center transition-colors">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Buy Now
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Upcoming Flash Sales */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Clock className="h-6 w-6 text-mali-blue mr-2" />
            Coming Soon
          </h2>
          <button className="text-mali-blue hover:text-white transition-colors flex items-center">
            Set Reminder
            <Bell className="h-4 w-4 ml-1" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingFlashSales.map((sale) => (
            <motion.div 
              key={sale.id}
              className="bg-mali-card/50 border border-mali-blue/20 rounded-xl overflow-hidden group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="relative">
                <div className="aspect-[16/9] relative grayscale group-hover:grayscale-0 transition-all duration-300">
                  <Image 
                    src={sale.image} 
                    alt={sale.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                </div>
                <div className="absolute top-4 right-4 bg-amber-500/80 text-white px-3 py-1 rounded-full font-bold text-sm">
                  {sale.discount}
                </div>
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-sm opacity-75">Starting In</p>
                  <p className="font-medium">
                    {new Date(sale.startTime).toLocaleDateString(undefined, { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              
              <div className="p-5">
                <h3 className="text-lg font-bold text-white mb-2">{sale.title}</h3>
                <p className="text-gray-400 text-sm">{sale.description}</p>
                
                <button className="w-full mt-4 border border-mali-blue/50 text-mali-blue hover:bg-mali-blue/10 py-2.5 rounded-lg font-medium flex items-center justify-center transition-colors">
                  <Bell className="h-4 w-4 mr-2" />
                  Notify Me
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
} 
