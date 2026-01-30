"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  Star, Trophy, Gift, Calendar, ChevronRight, Shield,
  Sparkles, History, Award, Clock, ArrowUp, InfoIcon,
  Users, BadgeCheck, Crown, Settings, Lock
} from "lucide-react";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";

// Mock user loyalty data
const userLoyalty = {
  points: 3750,
  tier: "gold",
  tierProgress: 75, // Percentage to next tier
  nextTier: "platinum",
  pointsToNextTier: 1250,
  anniversaryDate: "2023-05-15",
  memberSince: "2022-05-15",
  pointsExpiring: 500,
  expiryDate: "2023-12-31",
  lifetimePoints: 7500,
};

// Mock loyalty tiers
const loyaltyTiers = [
  {
    id: "bronze",
    name: "Bronze",
    icon: <Shield size={20} />,
    pointsRequired: 0,
    color: "#CD7F32",
    benefits: [
      "5% bonus credits on purchases",
      "Early access to flash sales",
      "Member-only promotions"
    ]
  },
  {
    id: "silver",
    name: "Silver",
    icon: <Star size={20} />,
    pointsRequired: 1000,
    color: "#C0C0C0",
    benefits: [
      "10% bonus credits on purchases",
      "Priority customer support",
      "Exclusive monthly rewards",
      "Birthday bonus: 200 points"
    ]
  },
  {
    id: "gold",
    name: "Gold",
    icon: <Award size={20} />,
    pointsRequired: 3000,
    color: "#FFD700",
    benefits: [
      "15% bonus credits on purchases",
      "VIP customer support",
      "Quarterly premium rewards",
      "Birthday bonus: 500 points",
      "Exclusive seasonal events"
    ]
  },
  {
    id: "platinum",
    name: "Platinum",
    icon: <Crown size={20} />,
    pointsRequired: 5000,
    color: "#E5E4E2",
    benefits: [
      "20% bonus credits on purchases",
      "24/7 dedicated support line",
      "Monthly premium rewards",
      "Birthday bonus: 1000 points",
      "Early access to new features",
      "Exclusive limited edition items"
    ]
  },
  {
    id: "diamond",
    name: "Diamond",
    icon: <Sparkles size={20} />,
    pointsRequired: 10000,
    color: "#B9F2FF",
    benefits: [
      "25% bonus credits on purchases",
      "Personal account manager",
      "Unlimited premium rewards",
      "Birthday bonus: 2000 points",
      "Priority access to all events and sales",
      "Custom profile badges",
      "Exclusive yearly physical gifts"
    ]
  }
];

// Mock points history
const pointsHistory = [
  {
    id: "PH001",
    date: "2023-11-15",
    amount: 250,
    type: "earned",
    description: "Purchase: PUBG Mobile Credits"
  },
  {
    id: "PH002",
    date: "2023-11-10",
    amount: 500,
    type: "earned",
    description: "Tier Upgrade: Silver to Gold"
  },
  {
    id: "PH003",
    date: "2023-11-05",
    amount: 100,
    type: "redeemed",
    description: "Redeemed for $5 Discount"
  },
  {
    id: "PH004",
    date: "2023-10-22",
    amount: 300,
    type: "earned",
    description: "Monthly Login Bonus"
  },
  {
    id: "PH005",
    date: "2023-10-15",
    amount: 200,
    type: "expired",
    description: "Points expiry - 12 months inactivity"
  }
];

// Mock exclusive tier rewards
const tierRewards = [
  {
    id: "TR001",
    name: "Gold Tier Exclusive Skin",
    description: "Limited edition weapon skin for PUBG Mobile",
    tier: "gold",
    image: "https://placehold.co/200x200?text=Gold+Skin"
  },
  {
    id: "TR002",
    name: "Premium Support Package",
    description: "30 days of premium support with priority response",
    tier: "gold",
    image: "https://placehold.co/200x200?text=Support+Package"
  },
  {
    id: "TR003",
    name: "Platinum VIP Access",
    description: "Exclusive events and early game access",
    tier: "platinum",
    image: "https://placehold.co/200x200?text=VIP+Access",
    locked: true
  }
];

export default function StarProgramPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();

  const [period, setPeriod] = useState("all");
  const [filteredHistory, setFilteredHistory] = useState(pointsHistory);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [activeReward, setActiveReward] = useState<string | null>(null);

  // If not logged in, redirect to login page
  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [user, router, isInitialized]);

  // Filter history based on selected period
  useEffect(() => {
    if (period === "all") {
      setFilteredHistory(pointsHistory);
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

    setFilteredHistory(
      pointsHistory.filter(item =>
        new Date(item.date) >= startDate
      )
    );
  }, [period]);

  // Get current tier data
  const currentTier = loyaltyTiers.find(tier => tier.id === userLoyalty.tier) || loyaltyTiers[0];
  const nextTier = loyaltyTiers.find(tier => tier.id === userLoyalty.nextTier);

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
        className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-mali-blue/30 rounded-xl p-8 mb-8"
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
              <Star className="h-8 w-8 text-amber-400 mr-3" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">Star Program</h1>
            </div>
            <p className="text-gray-300 mb-6">
              Earn stars through purchases and activities, unlock exclusive rewards and benefits based on your tier
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto bg-mali-card border border-mali-blue/30 rounded-xl mb-8 p-1">
        <button
          onClick={() => setSelectedTab("overview")}
          className={`px-5 py-3 rounded-lg font-medium text-sm whitespace-nowrap flex items-center ${selectedTab === "overview" ? "bg-mali-blue text-white" : "text-mali-text-secondary hover:text-white"}`}
        >
          <Star size={16} className="mr-2" />
          Overview
        </button>
        <button
          onClick={() => setSelectedTab("tiers")}
          className={`px-5 py-3 rounded-lg font-medium text-sm whitespace-nowrap flex items-center ${selectedTab === "tiers" ? "bg-mali-blue text-white" : "text-mali-text-secondary hover:text-white"}`}
        >
          <Trophy size={16} className="mr-2" />
          Tier Benefits
        </button>
        <button
          onClick={() => setSelectedTab("rewards")}
          className={`px-5 py-3 rounded-lg font-medium text-sm whitespace-nowrap flex items-center ${selectedTab === "rewards" ? "bg-mali-blue text-white" : "text-mali-text-secondary hover:text-white"}`}
        >
          <Gift size={16} className="mr-2" />
          Exclusive Rewards
        </button>
        <button
          onClick={() => setSelectedTab("history")}
          className={`px-5 py-3 rounded-lg font-medium text-sm whitespace-nowrap flex items-center ${selectedTab === "history" ? "bg-mali-blue text-white" : "text-mali-text-secondary hover:text-white"}`}
        >
          <History size={16} className="mr-2" />
          Points History
        </button>
      </div>

      {/* Overview Tab */}
      {selectedTab === "overview" && (
        <>
          {/* Membership Stats */}
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
                    <div className="text-amber-400 p-3 bg-amber-900/30 rounded-xl mr-4">
                      <BadgeCheck size={24} />
                    </div>
                    <div>
                      <div className="flex items-center">
                        <h2 className="text-2xl font-bold text-white mr-3">
                          {currentTier.name} Member
                        </h2>
                        <span className={`px-2 py-1 rounded-md text-xs font-medium bg-opacity-20 bg-black`}
                          style={{ color: currentTier.color, backgroundColor: `${currentTier.color}30` }}>
                          {userLoyalty.points.toLocaleString()} Points
                        </span>
                      </div>
                      <p className="text-mali-text-secondary text-sm">
                        Member since {new Date(userLoyalty.memberSince).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Next Tier Progress */}
                  {nextTier && (
                    <div className="mb-6">
                      <div className="flex justify-between mb-2">
                        <span className="text-white">{currentTier.name}</span>
                        <span className="text-white">{nextTier.name}</span>
                      </div>
                      <div className="h-2 bg-mali-blue/20 rounded-full">
                        <div
                          className="h-2 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                          style={{ width: `${userLoyalty.tierProgress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-2 text-sm text-mali-text-secondary">
                        <span>{userLoyalty.points} points</span>
                        <span>{userLoyalty.pointsToNextTier} points needed</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-mali-blue/10 border border-mali-blue/20 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-mali-text-secondary text-sm">Lifetime Points</span>
                        <span className="bg-indigo-900/30 text-indigo-400 text-xs px-2 py-0.5 rounded-full">
                          Total
                        </span>
                      </div>
                      <div className="text-xl font-bold text-white">{userLoyalty.lifetimePoints.toLocaleString()}</div>
                    </div>

                    <div className="bg-mali-blue/10 border border-mali-blue/20 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-mali-text-secondary text-sm">Anniversary</span>
                        <span className="bg-green-900/30 text-green-400 text-xs px-2 py-0.5 rounded-full">
                          Bonus
                        </span>
                      </div>
                      <div className="text-white font-bold">
                        {new Date(userLoyalty.anniversaryDate).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="bg-mali-blue/10 border border-mali-blue/20 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-mali-text-secondary text-sm">Points Expiring</span>
                        <span className="bg-red-900/30 text-red-400 text-xs px-2 py-0.5 rounded-full">
                          Soon
                        </span>
                      </div>
                      <div className="text-xl font-bold text-white">{userLoyalty.pointsExpiring}</div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4">
                    <Link
                      href="/dashboard/credits"
                      className="flex-1 bg-mali-blue/20 hover:bg-mali-blue/30 text-mali-blue-accent text-center py-3 px-4 rounded-lg font-medium flex items-center justify-center"
                    >
                      <History size={18} className="mr-2" />
                      View Credits
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
                <div className="p-5 bg-gradient-to-r from-amber-900/50 to-amber-800/50 border-b border-mali-blue/30">
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <InfoIcon size={18} className="text-amber-400 mr-2" />
                    About Star Program
                  </h3>
                </div>

                <div className="p-5">
                  <div className="space-y-4 text-mali-text-secondary">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-900/30 flex items-center justify-center mr-3 text-amber-400">
                        <span className="font-medium">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-white">Earn Points</h4>
                        <p className="text-sm">Earn points through purchases. 1 point for each $1 spent.</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-900/30 flex items-center justify-center mr-3 text-amber-400">
                        <span className="font-medium">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-white">Reach Higher Tiers</h4>
                        <p className="text-sm">Unlock new benefits and rewards as you reach higher tiers.</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-900/30 flex items-center justify-center mr-3 text-amber-400">
                        <span className="font-medium">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-white">Points Expiry</h4>
                        <p className="text-sm">Points expire after 12 months of inactivity on your account.</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-mali-blue/20">
                    <button onClick={() => setSelectedTab("tiers")} className="text-amber-400 hover:text-amber-300 flex items-center justify-between">
                      <span>Learn more about tier benefits</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Current Tier Benefits */}
          <motion.div
            className="mb-8 bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="p-5 bg-gradient-to-r from-amber-900/50 to-amber-800/50 border-b border-mali-blue/30 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center">
                <Trophy size={18} className="text-amber-400 mr-2" />
                {currentTier.name} Tier Benefits
              </h3>
              <button onClick={() => setSelectedTab("tiers")} className="text-sm text-amber-400 hover:underline flex items-center">
                View All Tiers
                <ChevronRight size={14} className="ml-1" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentTier.benefits.map((benefit, index) => (
                <div key={index} className="flex p-3 bg-mali-blue/10 border border-mali-blue/20 rounded-lg">
                  <BadgeCheck size={18} className="text-amber-400 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-white text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}

      {/* Tiers Tab */}
      {selectedTab === "tiers" && (
        <motion.div
          className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="p-5 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border-b border-mali-blue/30">
            <h3 className="text-lg font-bold text-white flex items-center">
              <Trophy size={18} className="text-amber-400 mr-2" />
              Star Program Tiers
            </h3>
          </div>

          <div className="p-5 space-y-6">
            {loyaltyTiers.map((tier) => {
              const isCurrent = tier.id === userLoyalty.tier;
              const isUnlocked = loyaltyTiers.findIndex(t => t.id === tier.id) <= loyaltyTiers.findIndex(t => t.id === userLoyalty.tier);

              return (
                <div
                  key={tier.id}
                  className={`border rounded-lg p-5 ${isCurrent
                    ? `border-2 shadow-glow`
                    : 'border-mali-blue/20 bg-mali-card'}`}
                  style={isCurrent ? { borderColor: tier.color, boxShadow: `0 0 15px ${tier.color}40` } : {}}
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                        style={{ backgroundColor: `${tier.color}30`, color: tier.color }}
                      >
                        {tier.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                        <p className="text-xs text-mali-text-secondary">
                          {tier.pointsRequired.toLocaleString()} points required
                        </p>
                      </div>
                    </div>

                    <div>
                      {isCurrent && (
                        <span className="bg-mali-blue/20 text-mali-blue-accent px-3 py-1 rounded-full text-xs font-medium">
                          Current Tier
                        </span>
                      )}
                      {!isUnlocked && (
                        <span className="bg-mali-blue/20 text-mali-text-secondary px-3 py-1 rounded-full text-xs font-medium flex items-center">
                          <Lock size={12} className="mr-1" />
                          Locked
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {tier.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-start">
                        <BadgeCheck size={16} className={isUnlocked ? "text-green-400" : "text-mali-text-secondary"} />
                        <span className={`ml-2 text-sm ${isUnlocked ? "text-white" : "text-mali-text-secondary"}`}>
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Rewards Tab */}
      {selectedTab === "rewards" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tierRewards.map((reward) => (
              <div
                key={reward.id}
                className={`bg-mali-card border rounded-xl overflow-hidden 
                  ${reward.locked
                    ? 'border-mali-blue/20 opacity-70'
                    : activeReward === reward.id
                      ? 'border-amber-400 shadow-glow'
                      : 'border-mali-blue/20 hover:border-mali-blue/50 cursor-pointer'
                  }`}
                onClick={() => !reward.locked && setActiveReward(activeReward === reward.id ? null : reward.id)}
              >
                <div className="aspect-[2/1] bg-gradient-to-br from-amber-900/30 to-purple-900/30 relative">
                  {reward.locked && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                      <div className="flex flex-col items-center">
                        <Lock size={24} className="text-mali-blue mb-2" />
                        <span className="text-sm font-medium text-white">Unlock {reward.tier} Tier</span>
                      </div>
                    </div>
                  )}
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
                    <span
                      className="px-2 py-1 rounded-md text-xs font-medium"
                      style={{
                        backgroundColor: `${(loyaltyTiers.find(t => t.id === reward.tier)?.color || '#ffffff')}20`,
                        color: loyaltyTiers.find(t => t.id === reward.tier)?.color || '#ffffff'
                      }}
                    >
                      {reward.tier} Tier
                    </span>
                  </div>

                  <p className="text-mali-text-secondary text-sm mb-4">
                    {reward.description}
                  </p>

                  <button
                    disabled={reward.locked}
                    className={`w-full py-2 rounded-lg font-medium text-sm flex items-center justify-center
                      ${reward.locked
                        ? 'bg-mali-blue/10 text-mali-text-secondary cursor-not-allowed'
                        : activeReward === reward.id
                          ? 'bg-amber-500 text-white'
                          : 'bg-mali-blue/20 text-mali-blue-accent hover:bg-mali-blue/30'
                      }`}
                  >
                    {reward.locked
                      ? 'Locked'
                      : activeReward === reward.id
                        ? 'Selected'
                        : 'Select Reward'
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={`mt-6 text-center ${activeReward ? 'block' : 'hidden'}`}>
            <button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-90 text-white py-3 px-8 rounded-lg font-medium">
              Redeem Selected Reward
            </button>
          </div>
        </motion.div>
      )}

      {/* History Tab */}
      {selectedTab === "history" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden"
        >
          <div className="p-5 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border-b border-mali-blue/30 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center">
              <History size={18} className="text-amber-400 mr-2" />
              Points History
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
            {filteredHistory.length > 0 ? (
              <div className="space-y-4">
                {filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-mali-blue/10 border border-mali-blue/20 rounded-xl"
                  >
                    <div className="flex items-center">
                      <div className={`p-3 rounded-xl mr-4 
                        ${item.type === 'earned'
                          ? 'bg-green-900/30 text-green-400'
                          : item.type === 'redeemed'
                            ? 'bg-amber-900/30 text-amber-400'
                            : 'bg-red-900/30 text-red-400'
                        }`}
                      >
                        {item.type === 'earned'
                          ? <Star size={20} />
                          : item.type === 'redeemed'
                            ? <Gift size={20} />
                            : <Clock size={20} />
                        }
                      </div>
                      <div>
                        <p className="font-medium text-white">{item.description}</p>
                        <p className="text-xs text-mali-text-secondary">
                          {new Date(item.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className={`text-lg font-bold 
                      ${item.type === 'earned'
                        ? 'text-green-400'
                        : item.type === 'redeemed'
                          ? 'text-amber-400'
                          : 'text-red-400'
                      }`}
                    >
                      {item.type === 'earned' ? '+' : '-'}{item.amount}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <History size={48} className="mx-auto text-mali-text-secondary mb-4" />
                <h4 className="text-lg font-medium text-white mb-2">No Points Activity</h4>
                <p className="text-mali-text-secondary mb-6">
                  You don't have any points activity in the selected period
                </p>

              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
} 
