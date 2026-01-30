"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { Coins, Gift, Calendar, ChevronRight, Globe, Award, InfoIcon, History, ExternalLink, CreditCard } from "lucide-react";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";

// Mock credits activity data
const creditsActivity = [
  {
    id: "CRED1001",
    date: "2023-11-15T14:30:00Z",
    amount: 50,
    type: "earned",
    description: "Purchase: Steam Gift Card"
  },
  {
    id: "CRED1002",
    date: "2023-11-10T09:45:00Z",
    amount: 100,
    type: "earned",
    description: "First top-up bonus"
  },
  {
    id: "CRED1003",
    date: "2023-11-05T16:20:00Z",
    amount: 25,
    type: "redeemed",
    description: "Redeem: $5 Discount Voucher"
  }
];

// Mock rewards data
const rewards = [
  {
    id: "REWARD1",
    name: "$5 Discount Voucher",
    description: "Get $5 off your next purchase",
    credits: 100,
    image: "https://placehold.co/200x200?text=Discount+Voucher"
  },
  {
    id: "REWARD2",
    name: "Free Steam Gift Card",
    description: "Redeem for a $10 Steam Gift Card",
    credits: 500,
    image: "https://placehold.co/200x200?text=Steam+Gift+Card"
  },
  {
    id: "REWARD3",
    name: "Premium Support",
    description: "Get priority customer support for 30 days",
    credits: 200,
    image: "https://placehold.co/200x200?text=Premium+Support"
  }
];

export default function CreditsPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();

  const [credits, setCredits] = useState(175);
  const [period, setPeriod] = useState("all");
  const [filteredActivity, setFilteredActivity] = useState(creditsActivity);
  const [selectedReward, setSelectedReward] = useState<string | null>(null);

  // If not logged in, redirect to login page
  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [user, router, isInitialized]);

  // Filter activity based on selected period
  useEffect(() => {
    if (period === "all") {
      setFilteredActivity(creditsActivity);
      return;
    }

    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    setFilteredActivity(
      creditsActivity.filter(activity =>
        new Date(activity.date) >= startDate
      )
    );
  }, [period]);

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-mali-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-mali-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="relative mb-6">
        <motion.h2
          className="text-xl font-bold text-white mb-1 relative"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          Credits
        </motion.h2>
        <p className="text-mali-text-secondary text-sm relative">Earn and redeem credits for exclusive rewards</p>
      </div>

      {/* Credits Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <motion.div
            className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="p-6 md:p-8">
              <div className="flex items-center mb-6">
                <div className="text-mali-blue-accent p-3 bg-mali-blue/10 rounded-xl mr-4 border border-mali-blue/20">
                  <Coins size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">
                    {credits.toLocaleString()} Credits
                  </h2>
                  <p className="text-mali-text-secondary text-sm">
                    Each credit is worth $0.01 USD in discount value
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-mali-blue/5 border border-mali-blue/10 rounded-xl p-4 transition-colors hover:bg-mali-blue/10 hover:border-mali-blue/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-mali-text-secondary text-sm">Earned Credits</span>
                    <span className="bg-green-900/30 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-500/20">
                      +150
                    </span>
                  </div>
                  <div className="text-xl font-bold text-white">150</div>
                </div>

                <div className="bg-mali-blue/5 border border-mali-blue/10 rounded-xl p-4 transition-colors hover:bg-mali-blue/10 hover:border-mali-blue/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-mali-text-secondary text-sm">Redeemed Credits</span>
                    <span className="bg-amber-900/30 text-amber-400 text-xs px-2 py-0.5 rounded-full border border-mali-blue/10">
                      -25
                    </span>
                  </div>
                  <div className="text-xl font-bold text-white">25</div>
                </div>

                <div className="bg-mali-blue/5 border border-mali-blue/10 rounded-xl p-4 transition-colors hover:bg-mali-blue/10 hover:border-mali-blue/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-mali-text-secondary text-sm">Expiring Soon</span>
                    <span className="bg-red-900/30 text-red-400 text-xs px-2 py-0.5 rounded-full border border-mali-blue/10">
                      30 days
                    </span>
                  </div>
                  <div className="text-xl font-bold text-white">50</div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <Link
                  href="/dashboard/orders"
                  className="flex-1 bg-mali-blue/10 hover:bg-mali-blue/20 text-mali-blue-accent hover:text-white border border-mali-blue/20 text-center py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-all"
                >
                  <History size={18} className="mr-2" />
                  View Transaction History
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        <div>
          <motion.div
            className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="p-5 border-b border-mali-blue/20 bg-mali-blue/5">
              <h3 className="text-lg font-bold text-white flex items-center">
                <InfoIcon size={18} className="text-mali-blue-accent mr-2" />
                About Credits
              </h3>
            </div>

            <div className="p-5">
              <div className="space-y-4 text-mali-text-secondary">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-mali-blue/10 border border-mali-blue/20 flex items-center justify-center mr-3 text-mali-blue-accent">
                    <span className="font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-1">Earn Credits</h4>
                    <p className="text-sm">Earn credits through purchases, promotions, and by referring friends.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-mali-blue/10 border border-mali-blue/20 flex items-center justify-center mr-3 text-mali-blue-accent">
                    <span className="font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-1">Redeem Credits</h4>
                    <p className="text-sm">Use your credits for discounts on purchases or exchange for rewards.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-mali-blue/10 border border-mali-blue/20 flex items-center justify-center mr-3 text-mali-blue-accent">
                    <span className="font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-1">Credit Value</h4>
                    <p className="text-sm">Each credit is worth $0.01 USD when used for discounts.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Rewards Section */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <h2 className="text-xl font-bold text-white mb-6 flex items-center">
          <Award className="mr-3 text-mali-blue-accent" />
          Rewards
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => (
            <div
              key={reward.id}
              onClick={() => setSelectedReward(reward.id === selectedReward ? null : reward.id)}
              className={`bg-mali-card border rounded-xl overflow-hidden cursor-pointer transition-all relative
                ${selectedReward === reward.id
                  ? 'border-mali-blue-accent shadow-glow scale-[1.02]'
                  : 'border-mali-blue/20 hover:border-mali-blue/50 hover:-translate-y-1'}`}
            >
              {selectedReward === reward.id && (
                <div className="absolute top-3 right-3 bg-mali-blue-accent text-white p-1 rounded-full z-10 shadow-lg">
                  <Check size={16} strokeWidth={3} />
                </div>
              )}

              <div className="aspect-[2/1] bg-mali-blue/5 relative border-b border-mali-blue/10">
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src={reward.image}
                    alt={reward.name}
                    className="h-20 w-20 object-contain drop-shadow-md"
                  />
                </div>
              </div>

              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-white pr-2">{reward.name}</h3>
                  <span className="bg-mali-blue/20 text-mali-blue-accent px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap border border-mali-blue/10">
                    {reward.credits} Credits
                  </span>
                </div>

                <p className="text-mali-text-secondary text-sm mb-5 h-10 line-clamp-2">
                  {reward.description}
                </p>

                <button
                  className={`w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center transition-all
                    ${selectedReward === reward.id
                      ? 'bg-mali-blue text-white shadow-button-glow'
                      : 'bg-mali-blue/10 text-mali-blue-accent hover:bg-mali-blue/20 hover:text-white'}`}
                >
                  {selectedReward === reward.id ? 'Selected' : 'Select Reward'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className={`mt-8 text-center transition-all duration-300 ${selectedReward ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4 pointer-events-none'}`}>
          <button className="bg-mali-blue hover:bg-mali-blue/90 text-white py-3 px-8 rounded-xl font-bold text-lg shadow-button-glow transition-all flex items-center mx-auto hover:scale-105 active:scale-95">
            Redeem Selected Reward
          </button>
        </div>
      </motion.div>

      {/* Activity History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <div className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-mali-blue/20 bg-mali-blue/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <History size={18} className="text-mali-blue-accent mr-2" />
              Credits History
            </h3>

            <div className="flex bg-mali-blue/10 p-1 rounded-lg self-start sm:self-auto">
              <button
                onClick={() => setPeriod('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === 'all' ? 'bg-mali-card text-white shadow-sm' : 'text-mali-text-secondary hover:text-white'}`}
              >
                All
              </button>
              <button
                onClick={() => setPeriod('month')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === 'month' ? 'bg-mali-card text-white shadow-sm' : 'text-mali-text-secondary hover:text-white'}`}
              >
                Month
              </button>
              <button
                onClick={() => setPeriod('week')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === 'week' ? 'bg-mali-card text-white shadow-sm' : 'text-mali-text-secondary hover:text-white'}`}
              >
                Week
              </button>
            </div>
          </div>

          <div className="p-5">
            {filteredActivity.length > 0 ? (
              <div className="space-y-3">
                {filteredActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-4 bg-mali-blue/5 border border-mali-blue/10 rounded-xl hover:bg-mali-blue/10 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className={`p-3 rounded-lg mr-4 ${activity.type === 'earned' ? 'bg-green-900/20 text-green-400 border border-green-500/20' : 'bg-amber-900/20 text-amber-400 border border-amber-500/20'}`}>
                        {activity.type === 'earned' ? <Coins size={20} /> : <CreditCard size={20} />}
                      </div>
                      <div>
                        <p className="font-medium text-white">{activity.description}</p>
                        <p className="text-xs text-mali-text-secondary flex items-center mt-1">
                          <Calendar size={10} className="mr-1" />
                          {new Date(activity.date).toLocaleDateString()} • {new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${activity.type === 'earned' ? 'text-green-400' : 'text-amber-400'}`}>
                      {activity.type === 'earned' ? '+' : '-'}{activity.amount}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-mali-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Coins size={32} className="text-mali-text-secondary opacity-50" />
                </div>
                <h4 className="text-lg font-medium text-white mb-2">No Credits Activity</h4>
                <p className="text-mali-text-secondary text-sm">
                  You don't have any credits activity in the selected period
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
} 
