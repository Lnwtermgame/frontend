"use client";

import { useState, useEffect } from "react";
import { motion } from "@/lib/framer-exports";
import { Search, Gamepad2, Filter, ChevronDown, Clock, Tag, Star, Heart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
// Mock categories
const categories = [
  { id: "action", name: "Action" },
  { id: "adventure", name: "Adventure" },
  { id: "rpg", name: "RPG" },
  { id: "strategy", name: "Strategy" },
  { id: "fps", name: "FPS" },
  { id: "sports", name: "Sports" },
  { id: "moba", name: "MOBA" },
  { id: "battle-royale", name: "Battle Royale" },
  { id: "card", name: "Card Games" },
  { id: "simulation", name: "Simulation" },
];

// Mock game data
const gamesData = [
  {
    id: "pubg-mobile",
    title: "PUBG Mobile",
    category: "Battle Royale",
    image: "https://placehold.co/600x400/003366/ffffff?text=PUBG+Mobile",
    rating: 4.7,
    platforms: ["Android", "iOS"],
    isFeatured: true,
    isPopular: true,
    isNew: false,
  },
  {
    id: "free-fire",
    title: "Garena Free Fire",
    category: "Battle Royale",
    image: "https://placehold.co/600x400/ff6600/ffffff?text=Free+Fire",
    rating: 4.3,
    platforms: ["Android", "iOS"],
    isFeatured: true,
    isPopular: true,
    isNew: false,
  },
  {
    id: "mobile-legends",
    title: "Mobile Legends: Bang Bang",
    category: "MOBA",
    image: "https://placehold.co/600x400/660066/ffffff?text=Mobile+Legends",
    rating: 4.5,
    platforms: ["Android", "iOS"],
    isFeatured: false,
    isPopular: true,
    isNew: false,
  },
  {
    id: "valorant",
    title: "Valorant",
    category: "FPS",
    image: "https://placehold.co/600x400/cc0000/ffffff?text=Valorant",
    rating: 4.8,
    platforms: ["PC"],
    isFeatured: true,
    isPopular: false,
    isNew: false,
  },
  {
    id: "genshin-impact",
    title: "Genshin Impact",
    category: "RPG",
    image: "https://placehold.co/600x400/6666cc/ffffff?text=Genshin",
    rating: 4.6,
    platforms: ["PC", "PlayStation", "Android", "iOS"],
    isFeatured: true,
    isPopular: true,
    isNew: false,
  },
  {
    id: "league-of-legends",
    title: "League of Legends",
    category: "MOBA",
    image: "https://placehold.co/600x400/0066cc/ffffff?text=LoL",
    rating: 4.5,
    platforms: ["PC"],
    isFeatured: false,
    isPopular: true,
    isNew: false,
  },
  {
    id: "call-of-duty-mobile",
    title: "Call of Duty: Mobile",
    category: "FPS",
    image: "https://placehold.co/600x400/333333/ffffff?text=CoD+Mobile",
    rating: 4.4,
    platforms: ["Android", "iOS"],
    isFeatured: false,
    isPopular: false,
    isNew: false,
  },
  {
    id: "fortnite",
    title: "Fortnite",
    category: "Battle Royale",
    image: "https://placehold.co/600x400/6699cc/ffffff?text=Fortnite",
    rating: 4.2,
    platforms: ["PC", "PlayStation", "Xbox", "Android"],
    isFeatured: false,
    isPopular: true,
    isNew: false,
  },
  {
    id: "roblox",
    title: "Roblox",
    category: "Adventure",
    image: "https://placehold.co/600x400/33cc33/ffffff?text=Roblox",
    rating: 4.0,
    platforms: ["PC", "Xbox", "Android", "iOS"],
    isFeatured: false,
    isPopular: true,
    isNew: false,
  },
  {
    id: "minecraft",
    title: "Minecraft",
    category: "Adventure",
    image: "https://placehold.co/600x400/33aa33/ffffff?text=Minecraft",
    rating: 4.8,
    platforms: ["PC", "PlayStation", "Xbox", "Android", "iOS"],
    isFeatured: false,
    isPopular: true,
    isNew: false,
  },
  {
    id: "apex-legends",
    title: "Apex Legends",
    category: "Battle Royale",
    image: "https://placehold.co/600x400/cc3333/ffffff?text=Apex+Legends",
    rating: 4.3,
    platforms: ["PC", "PlayStation", "Xbox"],
    isFeatured: false,
    isPopular: false,
    isNew: true,
  },
  {
    id: "honkai-star-rail",
    title: "Honkai: Star Rail",
    category: "RPG",
    image: "https://placehold.co/600x400/6633cc/ffffff?text=Honkai+Star+Rail",
    rating: 4.7,
    platforms: ["PC", "Android", "iOS"],
    isFeatured: false,
    isPopular: false,
    isNew: true,
  }
];

export default function GamesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [filteredGames, setFilteredGames] = useState(gamesData);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Filter and sort games
  useEffect(() => {
    let result = [...gamesData];

    // Filter by search term
    if (searchTerm) {
      result = result.filter(game =>
        game.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(game =>
        game.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Sort games
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => (a.isPopular === b.isPopular ? 0 : a.isPopular ? -1 : 1));
        break;
      case 'newest':
        result.sort((a, b) => (a.isNew === b.isNew ? 0 : a.isNew ? -1 : 1));
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'az':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'za':
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }

    setFilteredGames(result);
  }, [searchTerm, selectedCategory, sortBy]);

  return (
    <div className="page-container">
      {/* Page Header with blur effect */}
      <div className="relative mb-8">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-mali-purple/20 blur-3xl"></div>
        <div className="absolute -top-10 right-10 w-80 h-80 rounded-full bg-mali-blue/20 blur-3xl"></div>

        <motion.h1
          className="text-3xl font-bold text-white mb-2 relative flex items-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Gamepad2 className="h-8 w-8 text-mali-blue-light mr-3" />
          Games
        </motion.h1>
        <p className="text-mali-text-secondary relative">Browse our collection of top games and find your next gaming adventure</p>
      </div>

      {/* Game filters and search */}
      <motion.div
        className="bg-mali-card rounded-xl border border-mali-blue/20 p-6 mb-6 shadow-card-hover"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search games..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-3 px-5 pl-12 bg-mali-blue/20 border border-mali-blue/30 rounded-xl text-white focus:outline-none focus:border-mali-blue-accent focus:ring-1 focus:ring-mali-blue-accent transition-all"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-mali-text-secondary" size={18} />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setIsCategoryOpen(!isCategoryOpen);
                setIsSortOpen(false);
              }}
              className="w-full flex justify-between items-center py-3 px-5 bg-mali-blue/20 border border-mali-blue/30 rounded-xl text-white focus:outline-none hover:bg-mali-blue/30 transition-colors"
            >
              <div className="flex items-center">
                <Tag size={18} className="mr-2 text-mali-blue-light" />
                <span>{selectedCategory === 'all' ? 'All Categories' : categories.find(c => c.id === selectedCategory)?.name}</span>
              </div>
              <ChevronDown size={16} className={`transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCategoryOpen && (
              <motion.div
                className="absolute z-30 mt-2 w-full bg-mali-card border border-mali-blue/30 rounded-xl shadow-lg py-2 overflow-y-auto max-h-64"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-mali-blue/20 flex items-center ${selectedCategory === 'all' ? 'text-mali-blue-accent' : 'text-white'
                    }`}
                  onClick={() => {
                    setSelectedCategory('all');
                    setIsCategoryOpen(false);
                  }}
                >
                  <Gamepad2 size={14} className="mr-2" />
                  All Categories
                </button>

                {categories.map(category => (
                  <button
                    key={category.id}
                    className={`w-full text-left px-4 py-2 hover:bg-mali-blue/20 ${selectedCategory === category.id ? 'text-mali-blue-accent' : 'text-white'
                      }`}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setIsCategoryOpen(false);
                    }}
                  >
                    {category.name}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Sort By */}
          <div className="relative">
            <button
              onClick={() => {
                setIsSortOpen(!isSortOpen);
                setIsCategoryOpen(false);
              }}
              className="w-full flex justify-between items-center py-3 px-5 bg-mali-blue/20 border border-mali-blue/30 rounded-xl text-white focus:outline-none hover:bg-mali-blue/30 transition-colors"
            >
              <div className="flex items-center">
                <Filter size={18} className="mr-2 text-mali-blue-light" />
                <span>
                  {sortBy === 'popular' ? 'Popular' :
                    sortBy === 'newest' ? 'Newest' :
                      sortBy === 'rating' ? 'Top Rated' :
                        sortBy === 'az' ? 'A-Z' : 'Z-A'}
                </span>
              </div>
              <ChevronDown size={16} className={`transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSortOpen && (
              <motion.div
                className="absolute z-30 mt-2 w-full bg-mali-card border border-mali-blue/30 rounded-xl shadow-lg py-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {[
                  { id: 'popular', name: 'Popular', icon: <Star size={14} /> },
                  { id: 'newest', name: 'Newest', icon: <Clock size={14} /> },
                  { id: 'rating', name: 'Top Rated', icon: <Star size={14} /> },
                  { id: 'az', name: 'A-Z', icon: null },
                  { id: 'za', name: 'Z-A', icon: null }
                ].map(option => (
                  <button
                    key={option.id}
                    className={`w-full text-left px-4 py-2 hover:bg-mali-blue/20 flex items-center ${sortBy === option.id ? 'text-mali-blue-accent' : 'text-white'
                      }`}
                    onClick={() => {
                      setSortBy(option.id);
                      setIsSortOpen(false);
                    }}
                  >
                    {option.icon && <span className="mr-2">{option.icon}</span>}
                    {option.name}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-mali-text-secondary">
          {filteredGames.length} {filteredGames.length === 1 ? 'game' : 'games'} found
          {selectedCategory !== 'all' && ` in ${categories.find(c => c.id === selectedCategory)?.name}`}
          {searchTerm && ` for "${searchTerm}"`}
        </p>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredGames.length > 0 ? (
          filteredGames.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * (index % 8) }}
              whileHover={{ y: -5 }}
              className="h-full"
            >
              <Link href={`/games/${game.id}`}>
                <div className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden shadow-card-hover h-full flex flex-col">
                  <div className="relative">
                    <div className="aspect-video w-full overflow-hidden">
                      <img
                        src={game.image}
                        alt={game.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>

                    {/* Badge overlay */}
                    <div className="absolute top-0 left-0 w-full p-3 flex justify-between">
                      <div>
                        {game.isNew && (
                          <span className="bg-mali-purple text-white text-xs font-medium px-2 py-1 rounded-md mr-2">
                            New
                          </span>
                        )}
                        {game.isPopular && (
                          <span className="bg-mali-blue-accent text-white text-xs font-medium px-2 py-1 rounded-md">
                            Popular
                          </span>
                        )}
                      </div>
                      <button
                        className="bg-mali-dark/60 text-mali-text-secondary hover:text-white p-1.5 rounded-full backdrop-blur-sm transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          // Add to favorites function
                        }}
                      >
                        <Heart size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 flex-grow flex flex-col">
                    <h3 className="font-medium text-white mb-1">{game.title}</h3>
                    <div className="text-mali-text-secondary text-sm mb-2">{game.category}</div>

                    <div className="mt-auto">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          <span className="text-white text-sm">{game.rating}</span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {game.platforms.map(platform => (
                            <span
                              key={platform}
                              className="text-xs bg-mali-blue/20 text-mali-blue-accent px-1.5 py-0.5 rounded"
                            >
                              {platform}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-mali-blue/10 rounded-xl p-8 border border-mali-blue/20"
            >
              <Gamepad2 className="h-12 w-12 mx-auto text-mali-blue/50 mb-4" />
              <h3 className="text-white font-medium mb-2">No games found</h3>
              <p className="text-mali-text-secondary">
                Try adjusting your search criteria or browse a different category.
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
} 
