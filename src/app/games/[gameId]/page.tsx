"use client";

import { useState, useEffect } from 'react';
import { motion } from "@/lib/framer-exports";
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ChevronLeft, ShoppingCart, Heart, Share2, Star, 
  Package, Award, Clock, Calendar, Monitor, Smartphone, 
  CreditCard, Info, DollarSign, Gift, AlertCircle, Check 
} from 'lucide-react';
import { GameRelatedProducts, RelatedProduct } from '@/components/GameRelatedProducts';
import { PremiumUpsellCard } from '@/components/PremiumUpsellCard';

// Mock game data (would normally come from an API)
const gameDetails = {
  "pubg-mobile": {
    title: "PUBG Mobile",
    developer: "KRAFTON, Inc.",
    publisher: "Tencent Games",
    category: "Battle Royale",
    releaseDate: "2018-03-19",
    platforms: ["Android", "iOS"],
    rating: 4.7,
    ratingCount: 12589,
    description: "PUBG Mobile is the FREE battle royale shooter that pits 100 players against each other in a struggle for survival. Gather supplies and outwit your opponents to become the last person standing. Each 10-minute game places you on a remote island where you are pit against 99 other players, all seeking survival. Players freely choose their starting point with their parachute, and aim to stay in the safe zone for as long as possible.",
    longDescription: "PUBG MOBILE delivers the most intense free-to-play multiplayer action on mobile. Drop in, gear up, and compete. Survive epic 100-player classic battles, payload mode, and fast-paced 4v4 team deathmatch and zombie modes. Survival is key and the last one standing wins. When duty calls, fire at will!\n\nPUBG MOBILE provides the most intense free-to-play multiplayer action game experience on mobile. Unreal Engine 4 brings smooth, next-level graphics to your mobile device, allowing for an immersive gaming experience that matches the original PUBG on PC.",
    features: [
      "Multiple maps with different terrains and strategies",
      "Different game modes including Classic, Arcade, and EvoGround",
      "Regular updates with new content, features, and gameplay improvements",
      "Customizable controls and settings for optimal gameplay experience",
      "Voice chat with teammates for strategic coordination"
    ],
    topUpOptions: [
      { id: "pubg-60-uc", title: "60 UC", price: 0.99, originalPrice: 0.99, isPopular: false },
      { id: "pubg-300-uc", title: "300 UC", price: 4.99, originalPrice: 4.99, isPopular: true },
      { id: "pubg-600-uc", title: "600 UC", price: 9.99, originalPrice: 9.99, isPopular: false },
      { id: "pubg-1500-uc", title: "1,500 UC", price: 24.99, originalPrice: 29.99, isPopular: false },
      { id: "pubg-3000-uc", title: "3,000 UC", price: 49.99, originalPrice: 59.99, isPopular: false },
      { id: "pubg-6000-uc", title: "6,000 UC", price: 99.99, originalPrice: 119.99, isPopular: false },
    ],
    screenshots: [
      "https://placehold.co/1200x675/003366/ffffff?text=PUBG+Screenshot+1",
      "https://placehold.co/1200x675/003366/ffffff?text=PUBG+Screenshot+2",
      "https://placehold.co/1200x675/003366/ffffff?text=PUBG+Screenshot+3",
      "https://placehold.co/1200x675/003366/ffffff?text=PUBG+Screenshot+4",
    ],
    mainImage: "https://placehold.co/600x400/003366/ffffff?text=PUBG+Mobile",
    relatedGames: ["free-fire", "apex-legends", "fortnite", "call-of-duty-mobile"]
  },
  "free-fire": {
    title: "Garena Free Fire",
    developer: "111dots Studio",
    publisher: "Garena",
    category: "Battle Royale",
    releaseDate: "2017-12-04",
    platforms: ["Android", "iOS"],
    rating: 4.3,
    ratingCount: 9876,
    description: "Garena Free Fire is a battle royale game where 50 players parachute onto a remote island and fight to be the last person standing. Find weapons, stay in the safe zone, and survive to become the ultimate survivor.",
    longDescription: "Garena Free Fire is an ultimate survival shooter game available on mobile. Each 10-minute game places you on a remote island where you are pit against 49 other players, all seeking survival. Players freely choose their starting point with their parachute, and aim to stay in the safe zone for as long as possible.",
    features: [
      "Fast-paced 10-minute matches for ultimate survival",
      "4v4 squad battles and unique character abilities",
      "Realistic graphics and smooth controls",
      "Social features to play with friends",
      "Regular updates with new content"
    ],
    topUpOptions: [
      { id: "ff-100-diamond", title: "100 Diamonds", price: 0.99, originalPrice: 0.99, isPopular: false },
      { id: "ff-310-diamond", title: "310 Diamonds", price: 2.99, originalPrice: 2.99, isPopular: true },
      { id: "ff-520-diamond", title: "520 Diamonds", price: 4.99, originalPrice: 4.99, isPopular: false },
      { id: "ff-1060-diamond", title: "1,060 Diamonds", price: 9.99, originalPrice: 9.99, isPopular: false },
      { id: "ff-2180-diamond", title: "2,180 Diamonds", price: 19.99, originalPrice: 23.99, isPopular: false },
    ],
    screenshots: [
      "https://placehold.co/1200x675/ff6600/ffffff?text=Free+Fire+Screenshot+1",
      "https://placehold.co/1200x675/ff6600/ffffff?text=Free+Fire+Screenshot+2",
      "https://placehold.co/1200x675/ff6600/ffffff?text=Free+Fire+Screenshot+3",
    ],
    mainImage: "https://placehold.co/600x400/ff6600/ffffff?text=Free+Fire",
    relatedGames: ["pubg-mobile", "apex-legends", "fortnite", "call-of-duty-mobile"]
  },
  "mobile-legends": {
    title: "Mobile Legends: Bang Bang",
    developer: "Moonton",
    publisher: "Moonton",
    category: "MOBA",
    releaseDate: "2016-11-14",
    platforms: ["Android", "iOS"],
    rating: 4.5,
    ratingCount: 8542,
    description: "Mobile Legends: Bang Bang is a mobile MOBA game where two opposing teams fight to reach and destroy the enemy base while defending their own in 10-minute matches with heroes that feature unique abilities.",
    longDescription: "Mobile Legends: Bang Bang is a multiplayer online battle arena (MOBA) game designed for mobile phones. The game pits two teams of five against each other in real-time battles, with the ultimate goal of destroying the enemy base while protecting your own.",
    features: [
      "Fast-paced 10-minute matches with real-time combat",
      "Classic MOBA gameplay with lanes, minions, and towers",
      "Diverse roster of heroes with unique abilities",
      "Various game modes including Classic, Ranked, Brawl, and Arcade",
      "Regular tournaments and esports competitions"
    ],
    topUpOptions: [
      { id: "ml-86-diamond", title: "86 Diamonds", price: 1.99, originalPrice: 1.99, isPopular: false },
      { id: "ml-172-diamond", title: "172 Diamonds", price: 3.99, originalPrice: 3.99, isPopular: true },
      { id: "ml-257-diamond", title: "257 Diamonds", price: 5.99, originalPrice: 5.99, isPopular: false },
      { id: "ml-514-diamond", title: "514 Diamonds", price: 11.99, originalPrice: 11.99, isPopular: false },
      { id: "ml-1412-diamond", title: "1,412 Diamonds", price: 29.99, originalPrice: 34.99, isPopular: false },
    ],
    screenshots: [
      "https://placehold.co/1200x675/660066/ffffff?text=Mobile+Legends+Screenshot+1",
      "https://placehold.co/1200x675/660066/ffffff?text=Mobile+Legends+Screenshot+2",
      "https://placehold.co/1200x675/660066/ffffff?text=Mobile+Legends+Screenshot+3",
    ],
    mainImage: "https://placehold.co/600x400/660066/ffffff?text=Mobile+Legends",
    relatedGames: ["league-of-legends", "valorant", "arena-of-valor"]
  },
};

// Additional mocked games not fully detailed but needed for related games
const partialGameData = {
  "apex-legends": {
    title: "Apex Legends",
    mainImage: "https://placehold.co/600x400/cc3333/ffffff?text=Apex+Legends",
    rating: 4.3,
    category: "Battle Royale",
  },
  "fortnite": {
    title: "Fortnite",
    mainImage: "https://placehold.co/600x400/6699cc/ffffff?text=Fortnite",
    rating: 4.2,
    category: "Battle Royale",
  },
  "call-of-duty-mobile": {
    title: "Call of Duty: Mobile",
    mainImage: "https://placehold.co/600x400/333333/ffffff?text=CoD+Mobile",
    rating: 4.4,
    category: "FPS",
  },
  "league-of-legends": {
    title: "League of Legends",
    mainImage: "https://placehold.co/600x400/0066cc/ffffff?text=LoL",
    rating: 4.5,
    category: "MOBA",
  },
  "valorant": {
    title: "Valorant",
    mainImage: "https://placehold.co/600x400/cc0000/ffffff?text=Valorant",
    rating: 4.8,
    category: "FPS",
  },
  "arena-of-valor": {
    title: "Arena of Valor",
    mainImage: "https://placehold.co/600x400/006699/ffffff?text=Arena+of+Valor",
    rating: 4.1,
    category: "MOBA",
  }
};

export default function GameDetailsPage() {
  const { gameId } = useParams();
    const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('topup');
  const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // Mock loading game details
  useEffect(() => {
    if (typeof gameId !== 'string') return;
    
    // Simulate API call
    const timer = setTimeout(() => {
      const gameData = gameDetails[gameId as keyof typeof gameDetails];
      setGame(gameData || null);
      
      // Find popular option as default
      if (gameData) {
        const popularOption = gameData.topUpOptions.find(option => option.isPopular);
        setSelectedOption(popularOption ? popularOption.id : gameData.topUpOptions[0].id);
      }
      
      setLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [gameId]);
  
  if (loading) {
    return (
      <div className="page-container flex items-center justify-center h-96">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-mali-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-mali-text-secondary">Loading game details...</p>
        </div>
      </div>
    );
  }
  
  if (!game) {
    return (
      <div className="page-container">
        <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-8 text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Game Not Found</h2>
          <p className="text-mali-text-secondary mb-6">The game you're looking for doesn't exist or has been removed.</p>
          <Link href="/games" className="bg-mali-blue-accent hover:bg-mali-blue-accent/90 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center">
            <ChevronLeft size={18} className="mr-2" />
            Back to Games
          </Link>
        </div>
      </div>
    );
  }

  const getRelatedGameData = (id: string) => {
    return gameDetails[id as keyof typeof gameDetails] || partialGameData[id as keyof typeof partialGameData];
  };

  // Mock premium product data
  const premiumProduct = {
    id: "premium-bundle",
    title: `${game?.title} Premium Battle Pass`,
    description: "Enhance your game experience with our Premium Battle Pass. Unlock exclusive skins, emotes, and more with one purchase.",
    image: "https://placehold.co/1200x400/1a1c42/ffffff?text=Premium+Battle+Pass",
    price: 29.99,
    originalPrice: 49.99,
    savings: 40,
    features: [
      "Exclusive legendary character skins",
      "Premium emotes and animations",
      "Battle Pass level skip tokens",
      "Monthly premium currency bonus",
      "Priority customer support"
    ]
  };

  // Mock related products for cross-selling
  const relatedProducts: RelatedProduct[] = [
    {
      id: "special-bundle-1",
      title: `${game?.title} Special Bundle`,
      image: "https://placehold.co/400x300/1a1c42/ffffff?text=Special+Bundle",
      price: 19.99,
      originalPrice: 24.99,
      type: "bundle",
      discount: "20% OFF",
      tag: "POPULAR",
      tagColor: "blue"
    },
    {
      id: "starter-pack",
      title: "Starter Pack",
      image: "https://placehold.co/400x300/1a1c42/ffffff?text=Starter+Pack",
      price: 4.99,
      type: "addon",
      tag: "NEW",
      tagColor: "green"
    },
    {
      id: "monthly-subscription",
      title: "Monthly Premium",
      image: "https://placehold.co/400x300/1a1c42/ffffff?text=Monthly+Sub",
      price: 9.99,
      type: "subscription",
      tag: "BEST VALUE",
      tagColor: "purple"
    },
    {
      id: "bonus-credits",
      title: "5000 Bonus Credits",
      image: "https://placehold.co/400x300/1a1c42/ffffff?text=Bonus+Credits",
      price: 14.99,
      originalPrice: 19.99,
      type: "addon",
      discount: "25% OFF"
    },
    {
      id: "exclusive-skin",
      title: "Exclusive Character Skin",
      image: "https://placehold.co/400x300/1a1c42/ffffff?text=Exclusive+Skin",
      price: 12.99,
      type: "addon",
      tag: "LIMITED",
      tagColor: "pink"
    }
  ];

  return (
    <div className="page-container">
      {/* Back link */}
      <div className="mb-6">
        <Link href="/games" className="text-mali-text-secondary hover:text-white transition-colors inline-flex items-center">
          <ChevronLeft size={18} className="mr-1" />
          Back to Games
        </Link>
      </div>
      
      {/* Game Hero */}
      <div className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden mb-8">
        <div className="relative h-80 md:h-96">
          {/* Main banner image */}
          <Image 
            src={game.screenshots[0]} 
            alt={game.title} 
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
          
          {/* Game info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden border-4 border-mali-blue/30">
                <Image 
                  src={game.mainImage} 
                  alt={game.title} 
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{game.title}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="bg-mali-blue/30 text-mali-blue-accent px-3 py-1 rounded-full">
                    {game.category}
                  </span>
                  <div className="flex items-center text-yellow-400">
                    <Star size={16} className="fill-yellow-400" />
                    <span className="ml-1">{game.rating}</span>
                    <span className="ml-1 text-mali-text-secondary">({game.ratingCount.toLocaleString()})</span>
                  </div>
                  <span className="text-mali-text-secondary flex items-center">
                    <Calendar size={14} className="mr-1" />
                    {new Date(game.releaseDate).getFullYear()}
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-gray-400 mr-2">By</span>
                  <span className="text-white">{game.developer}</span>
                </div>
              </div>
              
              <div className="flex mt-4 md:mt-0 space-x-3">
                <button 
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`p-3 rounded-full border ${isFavorite ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-mali-blue/10 border-mali-blue/20 text-mali-text-secondary hover:text-white'}`}
                >
                  <Heart size={20} className={isFavorite ? 'fill-red-400' : ''} />
                </button>
                <button className="p-3 rounded-full bg-mali-blue/10 border border-mali-blue/20 text-mali-text-secondary hover:text-white">
                  <Share2 size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Game info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Tab navigation */}
          <div className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden">
            <div className="flex border-b border-mali-blue/20">
              <button
                onClick={() => setActiveTab('topup')}
                className={`py-4 px-6 text-sm font-medium flex items-center ${activeTab === 'topup' ? 'text-mali-blue-accent border-b-2 border-mali-blue-accent' : 'text-mali-text-secondary hover:text-white'}`}
              >
                <DollarSign size={18} className="mr-2" />
                Top Up Options
              </button>
              <button
                onClick={() => setActiveTab('info')}
                className={`py-4 px-6 text-sm font-medium flex items-center ${activeTab === 'info' ? 'text-mali-blue-accent border-b-2 border-mali-blue-accent' : 'text-mali-text-secondary hover:text-white'}`}
              >
                <Info size={18} className="mr-2" />
                Game Info
              </button>
              <button
                onClick={() => setActiveTab('screenshots')}
                className={`py-4 px-6 text-sm font-medium flex items-center ${activeTab === 'screenshots' ? 'text-mali-blue-accent border-b-2 border-mali-blue-accent' : 'text-mali-text-secondary hover:text-white'}`}
              >
                <Monitor size={18} className="mr-2" />
                Screenshots
              </button>
            </div>
            
            <div className="p-6">
              {/* Top Up Options */}
              {activeTab === 'topup' && (
                <div className="space-y-6">
                  <p className="text-mali-text-secondary">Select an amount to top up:</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {game.topUpOptions.map((option: any) => (
                      <div 
                        key={option.id}
                        onClick={() => setSelectedOption(option.id)}
                        className={`relative border p-4 rounded-xl cursor-pointer transition-all ${selectedOption === option.id ? 'bg-mali-blue/20 border-mali-blue-accent' : 'bg-mali-blue/10 border-mali-blue/30 hover:border-mali-blue/50'}`}
                      >
                        {option.isPopular && (
                          <div className="absolute -top-3 left-0 right-0 flex justify-center">
                            <span className="bg-blue-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                              POPULAR
                            </span>
                          </div>
                        )}
                        
                        <h4 className="text-white font-bold text-center mb-3">{option.title}</h4>
                        
                        <div className="text-center">
                          {option.originalPrice > option.price ? (
                            <>
                              <span className="line-through text-mali-text-secondary text-sm mr-1">${option.originalPrice.toFixed(2)}</span>
                              <span className="text-green-400 font-bold">${option.price.toFixed(2)}</span>
                            </>
                          ) : (
                            <span className="text-white font-bold">${option.price.toFixed(2)}</span>
                          )}
                        </div>
                        
                        {selectedOption === option.id && (
                          <div className="absolute bottom-2 right-2 text-mali-blue-accent">
                            <Check size={16} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 bg-mali-blue/10 border border-mali-blue/20 rounded-lg p-4">
                    <div className="flex items-start">
                      <Gift className="text-mali-blue-accent mr-3 mt-1 flex-shrink-0" size={20} />
                      <div>
                        <h4 className="text-white font-medium mb-1">First Purchase Bonus!</h4>
                        <p className="text-mali-text-secondary text-sm">Get an extra 10% bonus on your first purchase. The bonus will be automatically added to your account.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Game Info */}
              {activeTab === 'info' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-white font-medium mb-2">About {game.title}</h3>
                    <p className="text-mali-text-secondary">{game.longDescription || game.description}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-white font-medium mb-3">Key Features</h3>
                    <ul className="space-y-2">
                      {game.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <Check size={18} className="text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-mali-text-secondary">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-mali-blue/10 border border-mali-blue/20 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2 flex items-center">
                        <Package className="mr-2 text-mali-blue-accent" size={18} />
                        Developer
                      </h4>
                      <p className="text-mali-text-secondary">{game.developer}</p>
                    </div>
                    
                    <div className="bg-mali-blue/10 border border-mali-blue/20 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2 flex items-center">
                        <Award className="mr-2 text-mali-blue-accent" size={18} />
                        Publisher
                      </h4>
                      <p className="text-mali-text-secondary">{game.publisher}</p>
                    </div>
                    
                    <div className="bg-mali-blue/10 border border-mali-blue/20 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2 flex items-center">
                        <Calendar className="mr-2 text-mali-blue-accent" size={18} />
                        Release Date
                      </h4>
                      <p className="text-mali-text-secondary">{new Date(game.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    
                    <div className="bg-mali-blue/10 border border-mali-blue/20 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2 flex items-center">
                        <Smartphone className="mr-2 text-mali-blue-accent" size={18} />
                        Platforms
                      </h4>
                      <p className="text-mali-text-secondary">{game.platforms.join(', ')}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Screenshots */}
              {activeTab === 'screenshots' && (
                <div>
                  <div className="mb-4">
                    <div className="relative aspect-video rounded-lg overflow-hidden">
                      <Image 
                        src={game.screenshots[selectedScreenshotIndex]} 
                        alt={`${game.title} screenshot ${selectedScreenshotIndex + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2">
                    {game.screenshots.map((screenshot: string, index: number) => (
                      <div 
                        key={index}
                        onClick={() => setSelectedScreenshotIndex(index)}
                        className={`relative aspect-video rounded-md overflow-hidden cursor-pointer border-2 ${selectedScreenshotIndex === index ? 'border-mali-blue-accent' : 'border-transparent hover:border-mali-blue/50'}`}
                      >
                        <Image 
                          src={screenshot} 
                          alt={`${game.title} thumbnail ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Related Games */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Related Games</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {game.relatedGames.map((relatedId: string) => {
                const relatedGame = getRelatedGameData(relatedId);
                if (!relatedGame) return null;
                
                return (
                  <Link href={`/games/${relatedId}`} key={relatedId}>
                    <motion.div 
                      className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden group"
                      whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                    >
                      <div className="relative aspect-square">
                        <Image 
                          src={relatedGame.mainImage} 
                          alt={relatedGame.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                        <div className="absolute bottom-2 left-2 right-2">
                          <h3 className="text-sm font-bold text-white line-clamp-1">{relatedGame.title}</h3>
                          <div className="flex items-center mt-1">
                            <Star size={12} className="text-yellow-400" />
                            <span className="ml-1 text-xs text-yellow-400">{relatedGame.rating}</span>
                            <span className="ml-2 text-xs bg-mali-blue/30 text-mali-blue-accent px-1.5 py-0.5 rounded">{relatedGame.category}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Right column - Purchase section */}
        <div>
          <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-6 sticky top-4">
            <h3 className="text-xl font-bold text-white mb-4">Top Up Details</h3>
            
            {selectedOption && (() => {
              const option = game.topUpOptions.find((opt: any) => opt.id === selectedOption);
              if (!option) return null;
              
              return (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-mali-text-secondary">Selected Amount:</span>
                    <span className="text-white font-bold">{option.title}</span>
                  </div>
                  
                  <div className="py-4 border-y border-mali-blue/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-mali-text-secondary">Price:</span>
                      {option.originalPrice > option.price ? (
                        <div>
                          <span className="line-through text-mali-text-secondary text-sm mr-2">${option.originalPrice.toFixed(2)}</span>
                          <span className="text-white font-bold">${option.price.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-white font-bold">${option.price.toFixed(2)}</span>
                      )}
                    </div>
                    
                    {option.originalPrice > option.price && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-mali-text-secondary">You Save:</span>
                        <span className="text-green-400 font-bold">${(option.originalPrice - option.price).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <button className="w-full bg-mali-blue hover:bg-mali-blue/90 text-white py-3 rounded-lg font-medium flex items-center justify-center">
                      <ShoppingCart size={18} className="mr-2" />
                      Buy Now
                    </button>
                    
                    <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-medium flex items-center justify-center">
                      <CreditCard size={18} className="mr-2" />
                      Top Up with Card
                    </button>
                  </div>
                  
                  <div className="bg-mali-blue/10 rounded-lg p-3 text-sm">
                    <div className="flex">
                      <Clock size={16} className="text-mali-text-secondary mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-mali-text-secondary">
                        Auto-delivery within 5 minutes after payment
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
      
      {/* Premium Upsell Card - after payment selection */}
      <section className="mb-10">
        <PremiumUpsellCard
          id={premiumProduct.id}
          title={premiumProduct.title}
          description={premiumProduct.description}
          image={premiumProduct.image}
          price={premiumProduct.price}
          originalPrice={premiumProduct.originalPrice}
          savings={premiumProduct.savings}
          savingsType="percentage"
          features={premiumProduct.features}
          ctaText="Get Premium Pass"
          ctaUrl={`/games/${gameId}/premium`}
          variant="horizontal"
        />
      </section>
      
      {/* Cross-selling section */}
      <section className="mb-10">
        <GameRelatedProducts
          title="Enhance Your Experience"
          subtitle="Recommended add-ons for this game"
          products={relatedProducts}
          type="cross-sell"
          viewAllUrl={`/games/${gameId}/items`}
          viewAllText="View all items"
        />
      </section>
      
      {/* Related Games section - modify the existing code */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-white mb-4">Similar Games</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {game.relatedGames.map((id: string) => {
            const relatedGame = getRelatedGameData(id);
            if (!relatedGame) return null;
            
            return (
              <Link href={`/games/${id}`} key={id}>
                <div className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden hover:border-mali-blue/50 transition-colors">
                  <div className="aspect-square relative">
                    <Image
                      src={relatedGame.mainImage}
                      alt={relatedGame.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-white text-sm mb-1 truncate">{relatedGame.title}</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                        <span className="text-mali-text-secondary text-xs ml-1">
                          {relatedGame.rating}
                        </span>
                      </div>
                      <span className="text-xs text-mali-text-secondary">{relatedGame.category}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
} 