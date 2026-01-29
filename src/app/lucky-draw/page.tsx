"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  Gift, Calendar, Trophy, History, ArrowRight, Sparkles, Info,
  AlertTriangle, Clock, ChevronRight, Users, Award, Star, Timer,
  CheckCircle
} from "lucide-react";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";

// Mock active lucky draws
const activeDraws = [
  {
    id: "DRAW1",
    name: "Monthly Giveaway",
    description: "Win one of 10 premium game keys!",
    endDate: "2023-12-15T23:59:59Z",
    totalPrizes: 10,
    entryType: "free",
    image: "https://placehold.co/800x400/1E88E5/white?text=Monthly+Giveaway",
    isEntered: false
  },
  {
    id: "DRAW2",
    name: "VIP Member Draw",
    description: "Exclusive draw for VIP members. Win $100 store credit!",
    endDate: "2023-12-10T23:59:59Z",
    totalPrizes: 5,
    entryType: "vip",
    image: "https://placehold.co/800x400/D81B60/white?text=VIP+Draw",
    isEntered: true
  },
  {
    id: "DRAW3",
    name: "Spend & Win",
    description: "Every $10 spent = 1 entry. Win up to $500 in prizes!",
    endDate: "2023-12-31T23:59:59Z",
    totalPrizes: 20,
    entryType: "spend",
    image: "https://placehold.co/800x400/7CB342/white?text=Spend+%26+Win",
    isEntered: false
  }
];

// Mock draw history
const drawHistory = [
  {
    id: "PAST1",
    name: "Halloween Special",
    endDate: "2023-10-31T23:59:59Z",
    status: "won",
    prize: "Steam Gift Card $20"
  },
  {
    id: "PAST2",
    name: "September Bonus Draw",
    endDate: "2023-09-30T23:59:59Z",
    status: "participated",
    prize: null
  },
  {
    id: "PAST3",
    name: "Summer Giveaway",
    endDate: "2023-08-15T23:59:59Z",
    status: "participated",
    prize: null
  }
];

export default function LuckyDrawPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();

  const [activeTab, setActiveTab] = useState("active");
  const [loading, setLoading] = useState(false);
  const [currentEntries, setCurrentEntries] = useState<{ [key: string]: number }>({
    "DRAW1": 0,
    "DRAW2": 1,
    "DRAW3": 0
  });

  // If not logged in, redirect to login page
  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [user, router, isInitialized]);

  // Handle lucky draw entry
  const handleEnterDraw = (drawId: string) => {
    setLoading(true);

    // Simulate API call to enter the draw
    setTimeout(() => {
      setCurrentEntries(prev => ({
        ...prev,
        [drawId]: prev[drawId] + 1
      }));
      setLoading(false);
    }, 1000);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Calculate time remaining
  const getTimeRemaining = (endDateString: string) => {
    const endDate = new Date(endDateString);
    const now = new Date();

    const diffInDays = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays < 0) {
      return "Ended";
    } else if (diffInDays === 0) {
      return "Ends today";
    } else if (diffInDays === 1) {
      return "1 day left";
    } else {
      return `${diffInDays} days left`;
    }
  };

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
              <Gift className="h-8 w-8 text-mali-blue-accent mr-3" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">Lucky Draw</h1>
            </div>
            <p className="text-gray-300 mb-6">
              Participate in exclusive lucky draws and win amazing prizes including game keys, gift cards, and store credits
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="flex border-b border-mali-blue/20 overflow-x-auto">
          <button
            className={`px-6 py-4 text-sm font-medium flex items-center ${activeTab === 'active'
              ? 'text-mali-blue-accent border-b-2 border-mali-blue-accent'
              : 'text-mali-text-secondary hover:text-white hover:bg-mali-blue/10'
              }`}
            onClick={() => setActiveTab('active')}
          >
            <Gift size={18} className="mr-2" />
            Active Draws
          </button>
          <button
            className={`px-6 py-4 text-sm font-medium flex items-center ${activeTab === 'history'
              ? 'text-mali-blue-accent border-b-2 border-mali-blue-accent'
              : 'text-mali-text-secondary hover:text-white hover:bg-mali-blue/10'
              }`}
            onClick={() => setActiveTab('history')}
          >
            <History size={18} className="mr-2" />
            Draw History
          </button>
          <button
            className={`px-6 py-4 text-sm font-medium flex items-center ${activeTab === 'winners'
              ? 'text-mali-blue-accent border-b-2 border-mali-blue-accent'
              : 'text-mali-text-secondary hover:text-white hover:bg-mali-blue/10'
              }`}
            onClick={() => setActiveTab('winners')}
          >
            <Trophy size={18} className="mr-2" />
            Winner List
          </button>
          <button
            className={`px-6 py-4 text-sm font-medium flex items-center ${activeTab === 'rules'
              ? 'text-mali-blue-accent border-b-2 border-mali-blue-accent'
              : 'text-mali-text-secondary hover:text-white hover:bg-mali-blue/10'
              }`}
            onClick={() => setActiveTab('rules')}
          >
            <Info size={18} className="mr-2" />
            Rules & FAQ
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'active' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <Gift className="mr-3 text-mali-blue-accent" />
                Active Lucky Draws
              </h2>

              {activeDraws.length === 0 ? (
                <div className="text-center py-12">
                  <Gift size={48} className="mx-auto text-mali-text-secondary mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No active draws</h3>
                  <p className="text-mali-text-secondary mb-6">
                    There are no active lucky draws at the moment. Check back soon!
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {activeDraws.map((draw) => (
                    <motion.div
                      key={draw.id}
                      whileHover={{ y: -5 }}
                      transition={{ duration: 0.2 }}
                      className="bg-mali-blue/10 border border-mali-blue/20 rounded-xl overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3">
                        <div className="md:col-span-1 relative">
                          <img
                            src={draw.image}
                            alt={draw.name}
                            className="w-full h-48 md:h-full object-cover"
                          />
                          <div className="absolute top-3 right-3">
                            {draw.entryType === "vip" && (
                              <span className="bg-yellow-900/80 text-yellow-400 text-xs font-bold px-2 py-1 rounded-full">
                                VIP ONLY
                              </span>
                            )}
                            {draw.entryType === "free" && (
                              <span className="bg-green-900/80 text-green-400 text-xs font-bold px-2 py-1 rounded-full">
                                FREE ENTRY
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="md:col-span-2 p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-white font-bold text-lg">{draw.name}</h3>
                              <p className="text-mali-text-secondary text-sm mb-4">{draw.description}</p>
                            </div>
                            <div className="flex items-center bg-mali-blue/20 px-2.5 py-1 rounded-lg text-xs">
                              <Timer className="h-3.5 w-3.5 mr-1.5 text-mali-blue-accent" />
                              <span className={`${getTimeRemaining(draw.endDate).includes("day")
                                ? "text-white"
                                : "text-red-400"
                                }`}>
                                {getTimeRemaining(draw.endDate)}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-5">
                            <div className="bg-mali-blue/20 rounded-lg p-3">
                              <div className="text-mali-text-secondary text-xs mb-1">Total Prizes</div>
                              <div className="text-white font-medium flex items-center">
                                <Award size={16} className="text-mali-blue-accent mr-1.5" />
                                {draw.totalPrizes}
                              </div>
                            </div>
                            <div className="bg-mali-blue/20 rounded-lg p-3">
                              <div className="text-mali-text-secondary text-xs mb-1">Your Entries</div>
                              <div className="text-white font-medium flex items-center">
                                <Users size={16} className="text-mali-blue-accent mr-1.5" />
                                {currentEntries[draw.id]}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center gap-3 sm:justify-between">
                            <div className="flex items-center">
                              <span className="text-mali-text-secondary mr-2">End Date:</span>
                              <span className="text-white">{formatDate(draw.endDate)}</span>
                            </div>

                            <button
                              onClick={() => handleEnterDraw(draw.id)}
                              disabled={loading || (draw.entryType === "vip" && currentEntries[draw.id] > 0)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center ${draw.entryType === "vip" && currentEntries[draw.id] > 0
                                ? 'bg-mali-blue/20 text-mali-text-secondary cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white'
                                }`}
                            >
                              {loading ? (
                                <div className="flex items-center">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                  <span>Processing...</span>
                                </div>
                              ) : currentEntries[draw.id] > 0 ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1.5" />
                                  {draw.entryType === "spend" ? "Add Entry" : "Already Entered"}
                                </>
                              ) : (
                                <>
                                  Enter Draw <ArrowRight className="h-4 w-4 ml-1.5" />
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <History className="mr-3 text-mali-blue-accent" />
                Your Draw History
              </h2>

              {drawHistory.length === 0 ? (
                <div className="text-center py-12">
                  <History size={48} className="mx-auto text-mali-text-secondary mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No history found</h3>
                  <p className="text-mali-text-secondary mb-6">
                    You haven't participated in any lucky draws yet.
                  </p>
                  <button
                    onClick={() => setActiveTab('active')}
                    className="bg-mali-blue hover:bg-mali-blue/90 text-white py-2 px-4 rounded-lg font-medium inline-flex items-center"
                  >
                    <Gift size={18} className="mr-2" />
                    Browse Active Draws
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-mali-blue/10">
                        <th className="text-left text-xs uppercase text-mali-text-secondary font-medium px-4 py-3 rounded-l-lg">Draw Name</th>
                        <th className="text-left text-xs uppercase text-mali-text-secondary font-medium px-4 py-3">End Date</th>
                        <th className="text-left text-xs uppercase text-mali-text-secondary font-medium px-4 py-3">Status</th>
                        <th className="text-left text-xs uppercase text-mali-text-secondary font-medium px-4 py-3 rounded-r-lg">Prize</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-mali-blue/10">
                      {drawHistory.map((history) => (
                        <tr
                          key={history.id}
                          className="hover:bg-mali-blue/5 transition-colors"
                        >
                          <td className="px-4 py-4 text-white font-medium">{history.name}</td>
                          <td className="px-4 py-4 text-mali-text-secondary">{formatDate(history.endDate)}</td>
                          <td className="px-4 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${history.status === "won"
                              ? "bg-green-900/30 text-green-400"
                              : "bg-blue-900/30 text-blue-400"
                              }`}>
                              {history.status === "won" ? "Winner" : "Participated"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-mali-text-secondary">
                            {history.prize || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'winners' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <Trophy className="mr-3 text-yellow-500" />
                Recent Winners
              </h2>

              <div className="space-y-6">
                <div className="bg-mali-blue/10 border border-mali-blue/20 rounded-xl overflow-hidden">
                  <div className="p-5 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border-b border-mali-blue/30">
                    <h3 className="text-lg font-bold text-white flex items-center">
                      <Trophy size={18} className="text-yellow-500 mr-2" />
                      Halloween Special Winners
                    </h3>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="bg-mali-blue/10 border border-mali-blue/20 p-4 rounded-lg flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center mr-4 text-white font-bold">J</div>
                      <div className="flex-1">
                        <div className="text-white font-medium">John D.</div>
                        <div className="text-mali-text-secondary text-sm">Steam Gift Card $20</div>
                      </div>
                      <div className="px-3 py-1.5 bg-yellow-900/30 text-yellow-400 text-xs font-medium rounded-lg">
                        1st Prize
                      </div>
                    </div>

                    <div className="bg-mali-blue/10 border border-mali-blue/20 p-4 rounded-lg flex items-center">
                      <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center mr-4 text-white font-bold">S</div>
                      <div className="flex-1">
                        <div className="text-white font-medium">Sarah M.</div>
                        <div className="text-mali-text-secondary text-sm">PlayStation Store $15</div>
                      </div>
                      <div className="px-3 py-1.5 bg-blue-900/30 text-blue-400 text-xs font-medium rounded-lg">
                        2nd Prize
                      </div>
                    </div>

                    <div className="bg-mali-blue/10 border border-mali-blue/20 p-4 rounded-lg flex items-center">
                      <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center mr-4 text-white font-bold">R</div>
                      <div className="flex-1">
                        <div className="text-white font-medium">Robert K.</div>
                        <div className="text-mali-text-secondary text-sm">Google Play $10</div>
                      </div>
                      <div className="px-3 py-1.5 bg-blue-900/30 text-blue-400 text-xs font-medium rounded-lg">
                        3rd Prize
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-mali-blue/10 border border-mali-blue/20 rounded-xl overflow-hidden">
                  <div className="p-5 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border-b border-mali-blue/30">
                    <h3 className="text-lg font-bold text-white flex items-center">
                      <Trophy size={18} className="text-yellow-500 mr-2" />
                      September Bonus Draw Winners
                    </h3>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="bg-mali-blue/10 border border-mali-blue/20 p-4 rounded-lg flex items-center">
                      <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center mr-4 text-white font-bold">A</div>
                      <div className="flex-1">
                        <div className="text-white font-medium">Alex P.</div>
                        <div className="text-mali-text-secondary text-sm">SEAGM $50 Credit</div>
                      </div>
                      <div className="px-3 py-1.5 bg-yellow-900/30 text-yellow-400 text-xs font-medium rounded-lg">
                        1st Prize
                      </div>
                    </div>

                    <div className="bg-mali-blue/10 border border-mali-blue/20 p-4 rounded-lg flex items-center">
                      <div className="h-10 w-10 rounded-full bg-orange-600 flex items-center justify-center mr-4 text-white font-bold">M</div>
                      <div className="flex-1">
                        <div className="text-white font-medium">Michael T.</div>
                        <div className="text-mali-text-secondary text-sm">iTunes Gift Card $25</div>
                      </div>
                      <div className="px-3 py-1.5 bg-blue-900/30 text-blue-400 text-xs font-medium rounded-lg">
                        2nd Prize
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center mt-6">
                <Link
                  href="/lucky-draw/winners"
                  className="inline-flex items-center text-mali-blue-accent hover:text-mali-blue-accent/80 font-medium"
                >
                  View All Winners <ChevronRight size={16} className="ml-1" />
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <Info className="mr-3 text-mali-blue-accent" />
                Lucky Draw Rules & FAQ
              </h2>

              <div className="space-y-6">
                <motion.div
                  className="bg-mali-blue/10 border border-mali-blue/20 rounded-xl overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <div className="p-5 border-b border-mali-blue/20">
                    <div className="flex items-start">
                      <div className="p-2 bg-mali-blue/20 rounded-lg mr-3 text-mali-blue-accent">
                        <Info size={20} />
                      </div>
                      <div>
                        <h3 className="text-white font-bold mb-2">How do Lucky Draws work?</h3>
                        <p className="text-mali-text-secondary">
                          Lucky Draws are contests where you can win prizes by participating. Each draw has specific entry requirements and prize pools. Winners are selected randomly after the draw end date.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-mali-blue/10 border border-mali-blue/20 rounded-xl overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <div className="p-5 border-b border-mali-blue/20">
                    <div className="flex items-start">
                      <div className="p-2 bg-mali-blue/20 rounded-lg mr-3 text-mali-blue-accent">
                        <Gift size={20} />
                      </div>
                      <div>
                        <h3 className="text-white font-bold mb-2">Types of Lucky Draws</h3>
                        <div className="space-y-3 text-mali-text-secondary">
                          <div className="flex items-start">
                            <Star size={16} className="text-yellow-400 mr-2 mt-1" />
                            <div>
                              <span className="text-white font-medium">Free Draws:</span> Open to all registered users. Limited to one entry per user.
                            </div>
                          </div>
                          <div className="flex items-start">
                            <Star size={16} className="text-yellow-400 mr-2 mt-1" />
                            <div>
                              <span className="text-white font-medium">VIP Draws:</span> Exclusive to VIP members. Limited to one entry per VIP user.
                            </div>
                          </div>
                          <div className="flex items-start">
                            <Star size={16} className="text-yellow-400 mr-2 mt-1" />
                            <div>
                              <span className="text-white font-medium">Spend & Win:</span> Earn entries based on your purchases. Every $10 spent = 1 entry.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-mali-blue/10 border border-mali-blue/20 rounded-xl overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <div className="p-5 border-b border-mali-blue/20">
                    <div className="flex items-start">
                      <div className="p-2 bg-amber-900/30 rounded-lg mr-3 text-yellow-400">
                        <AlertTriangle size={20} />
                      </div>
                      <div>
                        <h3 className="text-white font-bold mb-2">Terms & Conditions</h3>
                        <div className="space-y-2 text-mali-text-secondary">
                          <div className="flex items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-mali-blue-accent mr-2"></div>
                            <span>Winners will be notified via email and in-app notification.</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-mali-blue-accent mr-2"></div>
                            <span>Prizes must be claimed within 30 days of winning.</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-mali-blue-accent mr-2"></div>
                            <span>SEAGM reserves the right to modify or cancel any draw.</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-mali-blue-accent mr-2"></div>
                            <span>Your account must be in good standing to participate.</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-mali-blue-accent mr-2"></div>
                            <span>Employees of SEAGM and their family members are not eligible.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-mali-blue/10 border border-mali-blue/20 rounded-xl overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <div className="p-5">
                    <div className="flex items-start">
                      <div className="p-2 bg-amber-900/30 rounded-lg mr-3 text-yellow-400">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <h3 className="text-white font-bold mb-2">Increase Your Chances</h3>
                        <div className="space-y-2 text-mali-text-secondary">
                          <div className="flex items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-mali-blue-accent mr-2"></div>
                            <span>Purchase more to earn more entries in Spend & Win draws.</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-mali-blue-accent mr-2"></div>
                            <span>Upgrade to VIP status to access exclusive draws.</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-mali-blue-accent mr-2"></div>
                            <span>Share draws on social media to earn bonus entries.</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-mali-blue-accent mr-2"></div>
                            <span>Complete special missions for additional entries.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* VIP Status */}
      <motion.div
        className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center">
              <Star className="mr-2 text-yellow-500" />
              VIP Status
            </h2>
            <Link
              href="/vip"
              className="text-mali-blue-accent hover:text-mali-blue-accent/80 flex items-center font-medium text-sm"
            >
              Upgrade Now <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>

          <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-mali-blue/30 p-5 rounded-xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="mb-4">
                <div className="text-mali-text-secondary text-sm mb-1">Your Status</div>
                <div className="text-white font-bold">Standard Member</div>
              </div>

              <div className="mb-4">
                <div className="text-mali-text-secondary text-sm mb-1">Benefits</div>
                <div className="text-white">Upgrade to VIP for exclusive lucky draws with bigger prizes!</div>
              </div>

              <button className="mt-2 bg-gradient-to-r from-amber-600 to-yellow-500 hover:opacity-90 text-white px-4 py-2 rounded-lg font-medium">
                Become VIP
              </button>
            </div>

            <div className="absolute right-4 bottom-4 opacity-20">
              <Trophy className="h-24 w-24 text-yellow-500" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 
