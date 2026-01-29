"use client";

import { motion } from "@/lib/framer-exports";
import { CashbackCard } from "@/components/promotion/CashbackCard";
import { Coins, Wallet, CreditCard, Info } from "lucide-react";

export default function CashbackPage() {
  // Sample cashback data
  const cashbackItems = [
    {
      id: "cashback-1",
      title: "PUBG Mobile Cashback",
      description: "Get 15% cashback when you top-up any PUBG Mobile package",
      amount: "15%",
      minSpend: 50,
      maxCashback: 100,
      expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(), // 15 days from now
      image: "https://placehold.co/600x400/003366/ffffff?text=PUBG+Mobile", // Using placeholder instead of /images/games/pubg-mobile.jpg
      isSpecial: true,
    },
    {
      id: "cashback-2",
      title: "Mobile Legends Bonus",
      description: "Receive 10% cashback on all Mobile Legends diamonds purchases",
      amount: "10%",
      minSpend: 20,
      maxCashback: 50,
      expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days from now
      image: "https://placehold.co/600x400/660066/ffffff?text=Mobile+Legends", // Using placeholder instead of /images/games/mobile-legends.jpg
    },
    {
      id: "cashback-3",
      title: "Steam Wallet Rewards",
      description: "5% back on all Steam Wallet card purchases",
      amount: "5%",
      minSpend: 10,
      maxCashback: 25,
      expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days from now
      image: "https://placehold.co/600x400/000000/ffffff?text=Steam", // Using placeholder instead of /images/games/steam.jpg
    }
  ];

  return (
    <div className="page-container">
      {/* Hero Section */}
      <motion.div 
        className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border border-mali-blue/30 rounded-xl p-8 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center justify-center mb-4">
              <Coins className="h-8 w-8 text-blue-400 mr-3" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">Cashback Rewards</h1>
            </div>
            <p className="text-gray-300 mb-6">
              Earn cashback on your purchases and get rewarded for shopping with us
            </p>
          </motion.div>
          
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-mali-card/60 backdrop-blur-sm p-4 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Wallet className="h-5 w-5 text-mali-blue mr-2" />
                <h3 className="text-white font-medium">Earn Cashback</h3>
              </div>
              <p className="text-gray-400 text-sm">Up to 15% on eligible purchases</p>
            </div>
            
            <div className="bg-mali-card/60 backdrop-blur-sm p-4 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <CreditCard className="h-5 w-5 text-mali-blue mr-2" />
                <h3 className="text-white font-medium">Spend Credits</h3>
              </div>
              <p className="text-gray-400 text-sm">Use credits on your next purchase</p>
            </div>
            
            <div className="bg-mali-card/60 backdrop-blur-sm p-4 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Info className="h-5 w-5 text-mali-blue mr-2" />
                <h3 className="text-white font-medium">No Limits</h3>
              </div>
              <p className="text-gray-400 text-sm">Earn cashback on all eligible games</p>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Cashback Cards */}
      <h2 className="text-2xl font-bold text-white mb-6">Available Cashback Offers</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cashbackItems.map((item) => (
          <CashbackCard 
            key={item.id}
            title={item.title}
            description={item.description}
            amount={item.amount}
            minSpend={item.minSpend}
            maxCashback={item.maxCashback}
            expiryDate={item.expiryDate}
            image={item.image}
            isSpecial={item.isSpecial}
          />
        ))}
      </div>
      
      {/* How It Works */}
      <motion.div 
        className="bg-mali-card border border-mali-blue/20 rounded-xl p-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-xl font-bold text-white mb-4">How Cashback Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="bg-mali-blue/20 text-mali-blue w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">1</div>
              <h3 className="text-white font-medium">Make a Purchase</h3>
            </div>
            <p className="text-gray-400 text-sm pl-11">Buy any eligible product from our store</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="bg-mali-blue/20 text-mali-blue w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">2</div>
              <h3 className="text-white font-medium">Earn Cashback</h3>
            </div>
            <p className="text-gray-400 text-sm pl-11">Cashback is automatically calculated and added to your account</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="bg-mali-blue/20 text-mali-blue w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">3</div>
              <h3 className="text-white font-medium">Use on Next Purchase</h3>
            </div>
            <p className="text-gray-400 text-sm pl-11">Apply your cashback balance to future purchases</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 