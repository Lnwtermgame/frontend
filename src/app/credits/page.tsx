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
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-mali-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-mali-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

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
              <Coins className="h-8 w-8 text-mali-blue-accent mr-3" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">Credits</h1>
            </div>
            <p className="text-gray-300 mb-6">
              Earn credits through purchases and promotions, then redeem them for discounts and exclusive rewards
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Credits Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <motion.div
            className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="p-6 md:p-8">
              <div className="flex items-center mb-6">
                <div className="text-mali-blue-accent p-3 bg-mali-blue/20 rounded-xl mr-4">
                  <Coins size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {credits.toLocaleString()} Credits
                  </h2>
                  <p className="text-mali-text-secondary text-sm">
                    Each credit is worth $0.01 USD in discount value
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-mali-blue/10 border border-mali-blue/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-mali-text-secondary text-sm">Earned Credits</span>
                    <span className="bg-green-900/30 text-green-400 text-xs px-2 py-0.5 rounded-full">
                      +150
                    </span>
                  </div>
                  <div className="text-xl font-bold text-white">150</div>
                </div>

                <div className="bg-mali-blue/10 border border-mali-blue/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-mali-text-secondary text-sm">Redeemed Credits</span>
                    <span className="bg-amber-900/30 text-amber-400 text-xs px-2 py-0.5 rounded-full">
                      -25
                    </span>
                  </div>
                  <div className="text-xl font-bold text-white">25</div>
                </div>

                <div className="bg-mali-blue/10 border border-mali-blue/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-mali-text-secondary text-sm">Expiring Soon</span>
                    <span className="bg-red-900/30 text-red-400 text-xs px-2 py-0.5 rounded-full">
                      30 days
                    </span>
                  </div>
                  <div className="text-xl font-bold text-white">50</div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <Link
                  href="/orders"
                  className="flex-1 bg-mali-blue/20 hover:bg-mali-blue/30 text-mali-blue-accent text-center py-3 px-4 rounded-lg font-medium flex items-center justify-center"
                >
                  <History size={18} className="mr-2" />
                  View Transaction History
                </Link>

                <Link
                  href="/referral"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white text-center py-3 px-4 rounded-lg font-medium flex items-center justify-center"
                >
                  <Gift size={18} className="mr-2" />
                  Earn More Credits
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        <div>
          <motion.div
            className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="p-5 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-b border-mali-blue/30">
              <h3 className="text-lg font-bold text-white flex items-center">
                <InfoIcon size={18} className="text-mali-blue-accent mr-2" />
                About Credits
              </h3>
            </div>

            <div className="p-5">
              <div className="space-y-4 text-mali-text-secondary">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-mali-blue/20 flex items-center justify-center mr-3 text-mali-blue-accent">
                    <span className="font-medium">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Earn Credits</h4>
                    <p className="text-sm">Earn credits through purchases, promotions, and by referring friends.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-mali-blue/20 flex items-center justify-center mr-3 text-mali-blue-accent">
                    <span className="font-medium">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Redeem Credits</h4>
                    <p className="text-sm">Use your credits for discounts on purchases or exchange for rewards.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-mali-blue/20 flex items-center justify-center mr-3 text-mali-blue-accent">
                    <span className="font-medium">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Credit Value</h4>
                    <p className="text-sm">Each credit is worth $0.01 USD when used for discounts.</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-mali-blue/20">
                <Link href="/referral" className="text-mali-blue-accent hover:text-mali-blue-accent/80 flex items-center justify-between">
                  <span>Learn more about earning credits</span>
                  <ChevronRight size={16} />
                </Link>
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
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <Award className="mr-3 text-mali-blue-accent" />
          Rewards
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => (
            <div
              key={reward.id}
              onClick={() => setSelectedReward(reward.id === selectedReward ? null : reward.id)}
              className={`bg-mali-card border rounded-xl overflow-hidden cursor-pointer transition-all
                ${selectedReward === reward.id
                  ? 'border-mali-blue-accent shadow-glow'
                  : 'border-mali-blue/20 hover:border-mali-blue/50'}`}
            >
              <div className="aspect-[2/1] bg-gradient-to-br from-purple-900/50 to-blue-900/50 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src={reward.image}
                    alt={reward.name}
                    className="h-20 w-20 object-contain"
                  />
                </div>
              </div>

              <div className="p-5">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-white">{reward.name}</h3>
                  <span className="bg-blue-900/30 text-mali-blue-accent px-2 py-1 rounded-md text-xs font-medium">
                    {reward.credits} Credits
                  </span>
                </div>

                <p className="text-mali-text-secondary text-sm mb-4">
                  {reward.description}
                </p>

                <button
                  className={`w-full py-2 rounded-lg font-medium text-sm flex items-center justify-center
                    ${selectedReward === reward.id
                      ? 'bg-mali-blue text-white'
                      : 'bg-mali-blue/20 text-mali-blue-accent hover:bg-mali-blue/30'}`}
                >
                  {selectedReward === reward.id ? 'Selected' : 'Select Reward'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className={`mt-6 text-center ${selectedReward ? 'block' : 'hidden'}`}>
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white py-3 px-8 rounded-lg font-medium">
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
          <div className="p-5 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-b border-mali-blue/30 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center">
              <History size={18} className="text-mali-blue-accent mr-2" />
              Credits History
            </h3>

            <div className="flex space-x-2">
              <button
                onClick={() => setPeriod('all')}
                className={`px-3 py-1 text-sm rounded-md ${period === 'all' ? 'bg-mali-blue text-white' : 'bg-mali-blue/20 text-mali-text-secondary hover:text-white'}`}
              >
                All
              </button>
              <button
                onClick={() => setPeriod('month')}
                className={`px-3 py-1 text-sm rounded-md ${period === 'month' ? 'bg-mali-blue text-white' : 'bg-mali-blue/20 text-mali-text-secondary hover:text-white'}`}
              >
                Month
              </button>
              <button
                onClick={() => setPeriod('week')}
                className={`px-3 py-1 text-sm rounded-md ${period === 'week' ? 'bg-mali-blue text-white' : 'bg-mali-blue/20 text-mali-text-secondary hover:text-white'}`}
              >
                Week
              </button>
            </div>
          </div>

          <div className="p-5">
            {filteredActivity.length > 0 ? (
              <div className="space-y-4">
                {filteredActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-4 bg-mali-blue/10 border border-mali-blue/20 rounded-xl"
                  >
                    <div className="flex items-center">
                      <div className={`p-3 rounded-xl mr-4 ${activity.type === 'earned' ? 'bg-green-900/30 text-green-400' : 'bg-amber-900/30 text-amber-400'}`}>
                        {activity.type === 'earned' ? <Coins size={20} /> : <CreditCard size={20} />}
                      </div>
                      <div>
                        <p className="font-medium text-white">{activity.description}</p>
                        <p className="text-xs text-mali-text-secondary">
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
                <Coins size={48} className="mx-auto text-mali-text-secondary mb-4" />
                <h4 className="text-lg font-medium text-white mb-2">No Credits Activity</h4>
                <p className="text-mali-text-secondary mb-6">
                  You don't have any credits activity in the selected period
                </p>
                <Link
                  href="/referral"
                  className="bg-mali-blue/20 hover:bg-mali-blue/30 text-mali-blue-accent py-2 px-4 rounded-lg font-medium inline-flex items-center"
                >
                  <Gift size={18} className="mr-2" />
                  Earn Your First Credits
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
} 
