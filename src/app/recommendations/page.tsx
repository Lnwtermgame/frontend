"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ThumbsUp, ThumbsDown, Star, ChevronRight, 
  Heart, ArrowRight, ShoppingCart, Gamepad,
  Clock, Eye, Sparkles, RefreshCw, Filter,
  ChevronDown, Users, Zap, Bolt, Settings
} from "lucide-react";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";

// Mock data for recently viewed items
const recentlyViewedItems = [
  {
    id: "game1",
    title: "Mobile Legends",
    image: "https://placehold.co/600x400/003366/ffffff?text=Mobile+Legends",
    category: "MOBA",
    lastViewed: "2023-11-19T16:45:00Z",
    price: 0,
    isFree: true,
    rating: 4.5,
    reviewCount: 1284
  },
  {
    id: "game2",
    title: "PUBG Mobile",
    image: "https://placehold.co/600x400/660066/ffffff?text=PUBG+Mobile",
    category: "Battle Royale",
    lastViewed: "2023-11-19T14:22:00Z",
    price: 0,
    isFree: true,
    rating: 4.3,
    reviewCount: 2155
  },
  {
    id: "game3",
    title: "Genshin Impact",
    image: "https://placehold.co/600x400/006633/ffffff?text=Genshin+Impact",
    category: "RPG",
    lastViewed: "2023-11-19T12:30:00Z",
    price: 0,
    isFree: true,
    rating: 4.7,
    reviewCount: 3089
  },
  {
    id: "item1",
    title: "1000 Garena Shells",
    image: "https://placehold.co/600x400/333366/ffffff?text=Garena+Shells",
    category: "Game Currency",
    lastViewed: "2023-11-18T16:45:00Z",
    price: 25.99,
    isFree: false,
    rating: 4.8,
    reviewCount: 542
  },
  {
    id: "item2",
    title: "PUBG Mobile UC - 600",
    image: "https://placehold.co/600x400/993366/ffffff?text=PUBG+UC",
    category: "Game Currency",
    lastViewed: "2023-11-18T12:30:00Z",
    price: 9.99,
    isFree: false,
    rating: 4.9,
    reviewCount: 789
  }
];

// Mock data for personalized recommendations
const personalizedRecommendations = [
  {
    id: "rec1",
    title: "Free Fire MAX",
    image: "https://placehold.co/600x400/663300/ffffff?text=Free+Fire+MAX",
    category: "Battle Royale",
    price: 0,
    isFree: true,
    rating: 4.2,
    reviewCount: 1876,
    matchScore: 95
  },
  {
    id: "rec2",
    title: "Call of Duty Mobile",
    image: "https://placehold.co/600x400/333399/ffffff?text=COD+Mobile",
    category: "FPS",
    price: 0,
    isFree: true,
    rating: 4.5,
    reviewCount: 2134,
    matchScore: 92
  },
  {
    id: "rec3",
    title: "League of Legends: Wild Rift",
    image: "https://placehold.co/600x400/006699/ffffff?text=Wild+Rift",
    category: "MOBA",
    price: 0,
    isFree: true,
    rating: 4.4,
    reviewCount: 1543,
    matchScore: 90
  },
  {
    id: "rec4",
    title: "Apex Legends Mobile",
    image: "https://placehold.co/600x400/990033/ffffff?text=Apex+Legends",
    category: "Battle Royale",
    price: 0,
    isFree: true,
    rating: 4.1,
    reviewCount: 1287,
    matchScore: 88
  },
  {
    id: "rec5",
    title: "Honkai Star Rail",
    image: "https://placehold.co/600x400/660099/ffffff?text=Honkai+Star+Rail",
    category: "RPG",
    price: 0,
    isFree: true,
    rating: 4.6,
    reviewCount: 1876,
    matchScore: 85
  },
  {
    id: "rec6",
    title: "Valorant Mobile",
    image: "https://placehold.co/600x400/990066/ffffff?text=Valorant+Mobile",
    category: "FPS",
    price: 0,
    isFree: true,
    rating: 4.3,
    reviewCount: 1023,
    matchScore: 82
  }
];

// Mock data for popular items showcase
const popularItemsShowcase = [
  {
    id: "pop1",
    title: "Mobile Legends - 1000 Diamonds",
    image: "https://placehold.co/600x400/003366/ffffff?text=ML+Diamonds",
    category: "Game Currency",
    price: 19.99,
    isFree: false,
    rating: 4.9,
    reviewCount: 3456,
    salesCount: 12543
  },
  {
    id: "pop2",
    title: "Steam Wallet Card - $50",
    image: "https://placehold.co/600x400/333333/ffffff?text=Steam+Card",
    category: "Gift Card",
    price: 52.99,
    isFree: false,
    rating: 4.8,
    reviewCount: 2785,
    salesCount: 9876
  },
  {
    id: "pop3",
    title: "Genshin Impact - 3280 Genesis Crystals",
    image: "https://placehold.co/600x400/006633/ffffff?text=Genesis+Crystals",
    category: "Game Currency",
    price: 49.99,
    isFree: false,
    rating: 4.7,
    reviewCount: 1987,
    salesCount: 7654
  },
  {
    id: "pop4",
    title: "Google Play Gift Card - $25",
    image: "https://placehold.co/600x400/990000/ffffff?text=Google+Play",
    category: "Gift Card",
    price: 26.99,
    isFree: false,
    rating: 4.9,
    reviewCount: 4321,
    salesCount: 15432
  },
  {
    id: "pop5",
    title: "PUBG Mobile - 600 UC",
    image: "https://placehold.co/600x400/660066/ffffff?text=PUBG+UC",
    category: "Game Currency",
    price: 9.99,
    isFree: false,
    rating: 4.8,
    reviewCount: 1876,
    salesCount: 6789
  },
  {
    id: "pop6",
    title: "Fortnite - 1000 V-Bucks",
    image: "https://placehold.co/600x400/993300/ffffff?text=V-Bucks",
    category: "Game Currency",
    price: 9.99,
    isFree: false,
    rating: 4.7,
    reviewCount: 2345,
    salesCount: 8765
  }
];

// Array of categories to filter on
const categories = ["All", "MOBA", "RPG", "Battle Royale", "FPS", "Game Currency", "Gift Card"];

export default function RecommendationsPage() {
  const router = useRouter();
  
  
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showRecentlyViewed, setShowRecentlyViewed] = useState(true);
  const [showPersonalized, setShowPersonalized] = useState(true);
  const [showPopular, setShowPopular] = useState(true);

  // Format time to be user-friendly
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
    
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Filter items by category
  const filteredRecentlyViewed = selectedCategory === "All" 
    ? recentlyViewedItems 
    : recentlyViewedItems.filter(item => item.category === selectedCategory);
  
  const filteredPersonalized = selectedCategory === "All" 
    ? personalizedRecommendations 
    : personalizedRecommendations.filter(item => item.category === selectedCategory);
  
  const filteredPopular = selectedCategory === "All" 
    ? popularItemsShowcase 
    : popularItemsShowcase.filter(item => item.category === selectedCategory);

  return (
    <div className="page-container">
      {/* Hero Section */}
      <motion.div 
        className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-mali-blue/30 rounded-xl p-6 md:p-8 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center mb-4">
              <Sparkles className="h-7 w-7 text-mali-blue-accent mr-3" />
              <h1 className="text-2xl md:text-3xl font-bold text-white">Recommendations</h1>
            </div>
            <p className="text-gray-300 mb-6">
              Discover games and items tailored to your interests and past activity
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Category Filter */}
      <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Filter size={18} className="text-mali-blue-accent mr-2" />
            <h3 className="font-medium text-white">Filter by Category</h3>
          </div>
          
          <button 
            onClick={() => setSelectedCategory("All")}
            className="text-sm text-mali-blue-accent flex items-center"
          >
            <RefreshCw size={14} className="mr-1" />
            Reset Filters
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                selectedCategory === category
                  ? 'bg-mali-blue text-white'
                  : 'bg-mali-blue/10 text-mali-text-secondary hover:bg-mali-blue/20 hover:text-white'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Recently Viewed Section */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-b border-mali-blue/30 flex justify-between items-center">
            <div className="flex items-center">
              <Clock size={18} className="text-mali-blue-accent mr-2" />
              <h3 className="text-lg font-bold text-white">Recently Viewed</h3>
            </div>
            
            <button 
              onClick={() => setShowRecentlyViewed(!showRecentlyViewed)} 
              className="text-mali-blue-accent"
            >
              <ChevronDown 
                size={20} 
                className={`transition-transform ${showRecentlyViewed ? 'rotate-180' : ''}`} 
              />
            </button>
          </div>
          
          {showRecentlyViewed && (
            <div className="p-5">
              {filteredRecentlyViewed.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                  {filteredRecentlyViewed.map((item) => (
                    <Link href={`/games/${item.id}`} key={item.id}>
                      <div className="bg-mali-blue/10 border border-mali-blue/20 rounded-xl overflow-hidden hover:border-mali-blue/50 transition-colors">
                        <div className="aspect-[4/3] relative">
                          <img 
                            src={item.image} 
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                            <div className="flex items-center">
                              <Clock size={10} className="mr-1" />
                              {formatRelativeTime(item.lastViewed)}
                            </div>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                            <div className="flex items-center text-xs text-mali-text-secondary">
                              <span className="bg-mali-blue/40 text-mali-blue-accent px-2 py-0.5 rounded-full">
                                {item.category}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-3">
                          <h4 className="font-medium text-white mb-2 truncate">{item.title}</h4>
                          
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <Star size={12} className="text-yellow-500 mr-1" />
                              <span className="text-xs text-white">{item.rating}</span>
                              <span className="text-xs text-mali-text-secondary ml-1">({item.reviewCount})</span>
                            </div>
                            
                            <div>
                              {item.isFree ? (
                                <span className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full">
                                  Free
                                </span>
                              ) : (
                                <span className="text-xs font-medium text-white">
                                  ${item.price.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Clock size={36} className="mx-auto mb-3 text-mali-text-secondary" />
                  <p className="text-mali-text-secondary">No recently viewed items in this category</p>
                  <button 
                    onClick={() => setSelectedCategory("All")}
                    className="mt-3 text-mali-blue-accent text-sm hover:underline"
                  >
                    View all categories
                  </button>
                </div>
              )}
              
              {filteredRecentlyViewed.length > 0 && (
                <div className="mt-5 text-center">
                  <Link href="/history">
                    <button className="bg-mali-blue/10 hover:bg-mali-blue/20 text-mali-blue-accent px-4 py-2 rounded-lg text-sm flex items-center mx-auto">
                      View All History
                      <ArrowRight size={14} className="ml-1" />
                    </button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Personalized Recommendations */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-b border-mali-blue/30 flex justify-between items-center">
            <div className="flex items-center">
              <Zap size={18} className="text-mali-blue-accent mr-2" />
              <h3 className="text-lg font-bold text-white">Personalized For You</h3>
            </div>
            
            <button 
              onClick={() => setShowPersonalized(!showPersonalized)} 
              className="text-mali-blue-accent"
            >
              <ChevronDown 
                size={20} 
                className={`transition-transform ${showPersonalized ? 'rotate-180' : ''}`} 
              />
            </button>
          </div>
          
          {showPersonalized && (
            <div className="p-5">
              {filteredPersonalized.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredPersonalized.map((item) => (
                    <Link href={`/games/${item.id}`} key={item.id}>
                      <div className="bg-mali-blue/10 border border-mali-blue/20 rounded-xl overflow-hidden hover:border-mali-blue/50 transition-colors h-full flex flex-col">
                        <div className="aspect-[16/9] relative">
                          <img 
                            src={item.image} 
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-purple-800/80 text-white text-xs px-2 py-1 rounded-full">
                            <div className="flex items-center">
                              <Bolt size={10} className="mr-1 text-yellow-400" />
                              <span className="text-yellow-400">{item.matchScore}%</span> match
                            </div>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                            <div className="flex items-center text-xs text-mali-text-secondary">
                              <span className="bg-mali-blue/40 text-mali-blue-accent px-2 py-0.5 rounded-full">
                                {item.category}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 flex-1 flex flex-col">
                          <h4 className="font-medium text-white mb-2">{item.title}</h4>
                          
                          <div className="flex items-center mb-3">
                            <Star size={14} className="text-yellow-500 mr-1" />
                            <span className="text-sm text-white">{item.rating}</span>
                            <span className="text-xs text-mali-text-secondary ml-1">({item.reviewCount})</span>
                          </div>
                          
                          <div className="mt-auto flex justify-between items-center">
                            <div>
                              {item.isFree ? (
                                <span className="text-sm bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full">
                                  Free
                                </span>
                              ) : (
                                <span className="text-sm font-medium text-white">
                                  ${item.price.toFixed(2)}
                                </span>
                              )}
                            </div>
                            
                            <button className="bg-mali-blue/20 hover:bg-mali-blue/40 text-mali-blue-accent p-2 rounded-lg transition-colors">
                              <ShoppingCart size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Zap size={36} className="mx-auto mb-3 text-mali-text-secondary" />
                  <p className="text-mali-text-secondary">No personalized recommendations in this category</p>
                  <button 
                    onClick={() => setSelectedCategory("All")}
                    className="mt-3 text-mali-blue-accent text-sm hover:underline"
                  >
                    View all categories
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Popular Items Showcase */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <div className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-b border-mali-blue/30 flex justify-between items-center">
            <div className="flex items-center">
              <ThumbsUp size={18} className="text-mali-blue-accent mr-2" />
              <h3 className="text-lg font-bold text-white">Popular Among Gamers</h3>
            </div>
            
            <button 
              onClick={() => setShowPopular(!showPopular)} 
              className="text-mali-blue-accent"
            >
              <ChevronDown 
                size={20} 
                className={`transition-transform ${showPopular ? 'rotate-180' : ''}`} 
              />
            </button>
          </div>
          
          {showPopular && (
            <div className="p-5">
              {filteredPopular.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredPopular.map((item) => (
                    <Link href={`/games/${item.id}`} key={item.id}>
                      <div className="bg-mali-blue/10 border border-mali-blue/20 rounded-xl overflow-hidden hover:border-mali-blue/50 transition-colors h-full flex flex-col">
                        <div className="aspect-[16/9] relative">
                          <img 
                            src={item.image} 
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-red-800/80 text-white text-xs px-2 py-1 rounded-full">
                            <div className="flex items-center">
                              <Users size={10} className="mr-1" />
                              {item.salesCount.toLocaleString()} sold
                            </div>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                            <div className="flex items-center text-xs text-mali-text-secondary">
                              <span className="bg-mali-blue/40 text-mali-blue-accent px-2 py-0.5 rounded-full">
                                {item.category}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 flex-1 flex flex-col">
                          <h4 className="font-medium text-white mb-2">{item.title}</h4>
                          
                          <div className="flex items-center mb-3">
                            <Star size={14} className="text-yellow-500 mr-1" />
                            <span className="text-sm text-white">{item.rating}</span>
                            <span className="text-xs text-mali-text-secondary ml-1">({item.reviewCount})</span>
                          </div>
                          
                          <div className="mt-auto flex justify-between items-center">
                            <div>
                              {item.isFree ? (
                                <span className="text-sm bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full">
                                  Free
                                </span>
                              ) : (
                                <span className="text-sm font-medium text-white">
                                  ${item.price.toFixed(2)}
                                </span>
                              )}
                            </div>
                            
                            <button className="bg-mali-blue hover:bg-mali-blue/90 text-white p-2 rounded-lg transition-colors">
                              <ShoppingCart size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <ThumbsUp size={36} className="mx-auto mb-3 text-mali-text-secondary" />
                  <p className="text-mali-text-secondary">No popular items in this category</p>
                  <button 
                    onClick={() => setSelectedCategory("All")}
                    className="mt-3 text-mali-blue-accent text-sm hover:underline"
                  >
                    View all categories
                  </button>
                </div>
              )}
              
              {filteredPopular.length > 0 && (
                <div className="mt-5 text-center">
                  <Link href="/games">
                    <button className="bg-mali-blue/10 hover:bg-mali-blue/20 text-mali-blue-accent px-4 py-2 rounded-lg text-sm flex items-center mx-auto">
                      Explore More
                      <ArrowRight size={14} className="ml-1" />
                    </button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-mali-blue/30 rounded-xl p-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <h3 className="text-xl font-bold text-white mb-2">Improve Your Recommendations</h3>
        <p className="text-mali-text-secondary mb-6 max-w-2xl mx-auto">
          The more you browse, the better we can tailor recommendations to your gaming preferences
        </p>
        
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/games">
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white py-3 px-6 rounded-lg font-medium flex items-center">
              <Gamepad size={18} className="mr-2" />
              Browse Games
            </button>
          </Link>
          
          <Link href="/account/preferences">
            <button className="bg-mali-blue/20 hover:bg-mali-blue/30 text-mali-blue-accent py-3 px-6 rounded-lg font-medium flex items-center">
              <Settings size={18} className="mr-2" />
              Adjust Preferences
            </button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
} 
