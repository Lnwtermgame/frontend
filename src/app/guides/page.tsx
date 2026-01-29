"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen, Search, Filter, Calendar, Star,
  Clock, User, ChevronDown, ArrowRight, Tag,
  ListFilter, Grid2X2, LayoutList
} from "lucide-react";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";

// Define game guide type
interface GameGuide {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  game: string;
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  image: string;
  author: string;
  date: string;
  readTime: number;
  likes: number;
  views: number;
  tags: string[];
}

// Mock guides data
const guides: GameGuide[] = [
  {
    id: "guide001",
    title: "Beginners Guide to Mobile Legends: Hero Selection and Basic Strategy",
    excerpt: "Learn the fundamentals of Mobile Legends with hero selection tips, lane strategies, and team composition basics for new players",
    category: "strategy",
    game: "Mobile Legends",
    difficulty: "beginner",
    image: "https://placehold.co/600x400/003366/ffffff?text=ML+Guide",
    author: "GamePass Team",
    date: "2023-11-10",
    readTime: 8,
    likes: 342,
    views: 12500,
    tags: ["Mobile Legends", "Beginner", "Heroes", "Strategy"]
  },
  {
    id: "guide002",
    title: "Advanced PUBG Mobile Tactics: Positioning and Late-Game Strategies",
    excerpt: "Master advanced positioning techniques and endgame tactics to consistently secure chicken dinners in PUBG Mobile",
    category: "tactics",
    game: "PUBG Mobile",
    difficulty: "advanced",
    image: "https://placehold.co/600x400/660066/ffffff?text=PUBG+Tactics",
    author: "GamePass Team",
    date: "2023-11-05",
    readTime: 12,
    likes: 276,
    views: 9800,
    tags: ["PUBG Mobile", "Advanced", "Tactics", "Battle Royale"]
  },
  {
    id: "guide003",
    title: "Genshin Impact: Efficient Farming Routes for Ascension Materials",
    excerpt: "Optimize your farming routes for character and weapon ascension materials in Genshin Impact with these daily routes",
    category: "farming",
    game: "Genshin Impact",
    difficulty: "intermediate",
    image: "https://placehold.co/600x400/6666cc/ffffff?text=Genshin+Farming",
    author: "GamePass Team",
    date: "2023-11-02",
    readTime: 10,
    likes: 455,
    views: 18200,
    tags: ["Genshin Impact", "Farming", "Ascension Materials", "Efficiency"]
  },
  {
    id: "guide004",
    title: "Valorant Aim Training Routines: Improve Your Accuracy and Reflexes",
    excerpt: "Develop professional-level aim with these custom training routines designed to enhance accuracy, reflexes and crosshair placement",
    category: "skills",
    game: "Valorant",
    difficulty: "intermediate",
    image: "https://placehold.co/600x400/cc0000/ffffff?text=Valorant+Aim",
    author: "GamePass Team",
    date: "2023-10-28",
    readTime: 15,
    likes: 389,
    views: 14500,
    tags: ["Valorant", "Aim Training", "FPS Skills", "Improvement"]
  },
  {
    id: "guide005",
    title: "Free Fire: Best Weapon Combinations for Different Playstyles",
    excerpt: "Find the perfect weapon loadout for your unique playstyle in Free Fire with our comprehensive weapon combination guide",
    category: "loadouts",
    game: "Free Fire",
    difficulty: "beginner",
    image: "https://placehold.co/600x400/ff6600/ffffff?text=Free+Fire+Weapons",
    author: "GamePass Team",
    date: "2023-10-22",
    readTime: 7,
    likes: 298,
    views: 11200,
    tags: ["Free Fire", "Weapons", "Loadouts", "Battle Royale"]
  },
  {
    id: "guide006",
    title: "League of Legends: Wild Rift Lane Rotations and Map Awareness",
    excerpt: "Master the art of lane rotations and develop superior map awareness to control the pace of Wild Rift matches",
    category: "strategy",
    game: "League of Legends: Wild Rift",
    difficulty: "advanced",
    image: "https://placehold.co/600x400/0066cc/ffffff?text=Wild+Rift",
    author: "GamePass Team",
    date: "2023-10-18",
    readTime: 14,
    likes: 322,
    views: 13400,
    tags: ["Wild Rift", "Map Control", "Rotations", "Advanced"]
  },
  {
    id: "guide007",
    title: "Call of Duty Mobile: Best Gunsmith Builds for Season 12",
    excerpt: "Dominate the battlefield with these meta weapon builds optimized for the current season of Call of Duty Mobile",
    category: "loadouts",
    game: "Call of Duty Mobile",
    difficulty: "intermediate",
    image: "https://placehold.co/600x400/333333/ffffff?text=CoD+Mobile",
    author: "GamePass Team",
    date: "2023-10-15",
    readTime: 9,
    likes: 418,
    views: 16700,
    tags: ["CoD Mobile", "Gunsmith", "Meta Builds", "Season 12"]
  },
  {
    id: "guide008",
    title: "Fortnite Creative Mode: Building Advanced Game Mechanics",
    excerpt: "Learn how to implement custom game mechanics in your Fortnite Creative islands with these expert building techniques",
    category: "creation",
    game: "Fortnite",
    difficulty: "expert",
    image: "https://placehold.co/600x400/6699cc/ffffff?text=Fortnite+Creative",
    author: "GamePass Team",
    date: "2023-10-10",
    readTime: 18,
    likes: 267,
    views: 9200,
    tags: ["Fortnite", "Creative Mode", "Map Building", "Game Design"]
  }
];

// Category options
const categories = [
  { name: "All Categories", value: "all" },
  { name: "Strategy", value: "strategy" },
  { name: "Tactics", value: "tactics" },
  { name: "Farming", value: "farming" },
  { name: "Skills", value: "skills" },
  { name: "Loadouts", value: "loadouts" },
  { name: "Creation", value: "creation" }
];

// Game options
const games = [
  { name: "All Games", value: "all" },
  { name: "Mobile Legends", value: "Mobile Legends" },
  { name: "PUBG Mobile", value: "PUBG Mobile" },
  { name: "Genshin Impact", value: "Genshin Impact" },
  { name: "Valorant", value: "Valorant" },
  { name: "Free Fire", value: "Free Fire" },
  { name: "League of Legends: Wild Rift", value: "League of Legends: Wild Rift" },
  { name: "Call of Duty Mobile", value: "Call of Duty Mobile" },
  { name: "Fortnite", value: "Fortnite" }
];

// Difficulty options
const difficulties = [
  { name: "All Levels", value: "all" },
  { name: "Beginner", value: "beginner" },
  { name: "Intermediate", value: "intermediate" },
  { name: "Advanced", value: "advanced" },
  { name: "Expert", value: "expert" }
];

import { Suspense } from "react";

function GuidesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();


  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedGame, setSelectedGame] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filteredGuides, setFilteredGuides] = useState<GameGuide[]>(guides);

  // Set initial filters from URL parameters
  useEffect(() => {
    const category = searchParams.get("category");
    const game = searchParams.get("game");
    const difficulty = searchParams.get("difficulty");
    const query = searchParams.get("q");

    if (category) setSelectedCategory(category);
    if (game) setSelectedGame(game);
    if (difficulty) setSelectedDifficulty(difficulty);
    if (query) setSearchQuery(query);
  }, [searchParams]);

  // Filter guides based on selected filters
  useEffect(() => {
    let filtered = [...guides];

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(guide => guide.category === selectedCategory);
    }

    // Apply game filter
    if (selectedGame !== "all") {
      filtered = filtered.filter(guide => guide.game === selectedGame);
    }

    // Apply difficulty filter
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter(guide => guide.difficulty === selectedDifficulty);
    }

    // Apply search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(guide =>
        guide.title.toLowerCase().includes(query) ||
        guide.excerpt.toLowerCase().includes(query) ||
        guide.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "date":
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case "popular":
        filtered.sort((a, b) => b.views - a.views);
        break;
      case "likes":
        filtered.sort((a, b) => b.likes - a.likes);
        break;
    }

    setFilteredGuides(filtered);
  }, [selectedCategory, selectedGame, selectedDifficulty, searchQuery, sortBy]);

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-900/30 text-green-400";
      case "intermediate":
        return "bg-blue-900/30 text-blue-400";
      case "advanced":
        return "bg-purple-900/30 text-purple-400";
      case "expert":
        return "bg-red-900/30 text-red-400";
      default:
        return "bg-mali-blue/30 text-mali-blue-accent";
    }
  };

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
              <BookOpen className="h-7 w-7 text-mali-blue-accent mr-3" />
              <h1 className="text-2xl md:text-3xl font-bold text-white">Game Guides</h1>
            </div>
            <p className="text-gray-300 mb-6">
              Level up your gameplay with our collection of in-depth guides, tutorials, and strategies
            </p>
          </motion.div>

          {/* Search Bar */}
          <div className="relative mb-2">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-5 h-5 text-mali-text-secondary" />
            </div>
            <input
              type="text"
              className="block w-full p-3 pl-10 bg-mali-card border border-mali-blue/30 rounded-lg text-white placeholder-mali-text-secondary focus:outline-none focus:ring-2 focus:ring-mali-blue/50"
              placeholder="Search for guides, tips, and strategies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </motion.div>

      {/* Filters Section */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4">
              {/* Category Filter */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none bg-mali-blue/10 border border-mali-blue/20 text-white rounded-lg py-2 pl-4 pr-10 focus:outline-none focus:ring-1 focus:ring-mali-blue"
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value} className="bg-mali-card">
                      {category.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronDown size={16} className="text-mali-text-secondary" />
                </div>
              </div>

              {/* Game Filter */}
              <div className="relative">
                <select
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
                  className="appearance-none bg-mali-blue/10 border border-mali-blue/20 text-white rounded-lg py-2 pl-4 pr-10 focus:outline-none focus:ring-1 focus:ring-mali-blue"
                >
                  {games.map((game) => (
                    <option key={game.value} value={game.value} className="bg-mali-card">
                      {game.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronDown size={16} className="text-mali-text-secondary" />
                </div>
              </div>

              {/* Difficulty Filter */}
              <div className="relative">
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="appearance-none bg-mali-blue/10 border border-mali-blue/20 text-white rounded-lg py-2 pl-4 pr-10 focus:outline-none focus:ring-1 focus:ring-mali-blue"
                >
                  {difficulties.map((difficulty) => (
                    <option key={difficulty.value} value={difficulty.value} className="bg-mali-card">
                      {difficulty.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronDown size={16} className="text-mali-text-secondary" />
                </div>
              </div>
            </div>

            <div className="flex gap-4 items-center">
              {/* Sort Options */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-mali-blue/10 border border-mali-blue/20 text-white rounded-lg py-2 pl-4 pr-10 focus:outline-none focus:ring-1 focus:ring-mali-blue"
                >
                  <option value="date" className="bg-mali-card">Latest</option>
                  <option value="popular" className="bg-mali-card">Most Popular</option>
                  <option value="likes" className="bg-mali-card">Most Liked</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronDown size={16} className="text-mali-text-secondary" />
                </div>
              </div>

              {/* View Mode Toggles */}
              <div className="flex bg-mali-blue/10 border border-mali-blue/20 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-mali-blue text-white" : "text-mali-text-secondary hover:text-white"}`}
                  title="Grid View"
                >
                  <Grid2X2 size={18} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-mali-blue text-white" : "text-mali-text-secondary hover:text-white"}`}
                  title="List View"
                >
                  <LayoutList size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Results Count */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-white">
          {filteredGuides.length} {filteredGuides.length === 1 ? 'Guide' : 'Guides'} Found
        </h2>

        {/* Clear Filters Button (visible only when filters are applied) */}
        {(selectedCategory !== "all" || selectedGame !== "all" || selectedDifficulty !== "all" || searchQuery) && (
          <button
            onClick={() => {
              setSelectedCategory("all");
              setSelectedGame("all");
              setSelectedDifficulty("all");
              setSearchQuery("");
            }}
            className="text-mali-blue-accent hover:underline text-sm flex items-center"
          >
            <Filter size={14} className="mr-1" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Guides Grid/List View */}
      {filteredGuides.length > 0 ? (
        <>
          {/* Grid View */}
          {viewMode === "grid" && (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {filteredGuides.map((guide, index) => (
                <motion.div
                  key={guide.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.05 * index }}
                >
                  <Link href={`/guides/${guide.id}`}>
                    <div className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden h-full hover:border-mali-blue/50 group cursor-pointer">
                      <div className="aspect-[16/9] bg-gradient-to-br from-blue-900/50 to-purple-900/50 relative">
                        <img
                          src={guide.image}
                          alt={guide.title}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className="bg-mali-blue/70 text-white text-xs font-medium px-2 py-1 rounded-full">
                            {guide.game}
                          </span>
                          <span className={`${getDifficultyColor(guide.difficulty)} text-xs font-medium px-2 py-1 rounded-full`}>
                            {guide.difficulty.charAt(0).toUpperCase() + guide.difficulty.slice(1)}
                          </span>
                        </div>
                      </div>

                      <div className="p-5">
                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-mali-blue-accent transition-colors line-clamp-2">
                          {guide.title}
                        </h3>

                        <p className="text-mali-text-secondary text-sm mb-4 line-clamp-2">
                          {guide.excerpt}
                        </p>

                        <div className="flex justify-between items-center text-xs text-mali-text-secondary">
                          <div className="flex items-center">
                            <Clock size={12} className="mr-1" />
                            <span className="mr-3">{guide.readTime} min read</span>

                            <Star size={12} className="mr-1 text-amber-400" />
                            <span>{guide.likes}</span>
                          </div>

                          <span>{formatDate(guide.date)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {filteredGuides.map((guide, index) => (
                <motion.div
                  key={guide.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * index }}
                >
                  <Link href={`/guides/${guide.id}`}>
                    <div className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden hover:border-mali-blue/50 group cursor-pointer">
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-1/4 aspect-video md:aspect-auto bg-gradient-to-br from-blue-900/50 to-purple-900/50 relative">
                          <img
                            src={guide.image}
                            alt={guide.title}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                          />
                        </div>

                        <div className="p-5 md:w-3/4">
                          <div className="flex gap-2 mb-2">
                            <span className="bg-mali-blue/20 text-mali-blue-accent text-xs font-medium px-2 py-1 rounded-full">
                              {guide.game}
                            </span>
                            <span className={`${getDifficultyColor(guide.difficulty)} text-xs font-medium px-2 py-1 rounded-full`}>
                              {guide.difficulty.charAt(0).toUpperCase() + guide.difficulty.slice(1)}
                            </span>
                            <span className="bg-mali-blue/20 text-mali-text-secondary text-xs font-medium px-2 py-1 rounded-full">
                              {guide.category.charAt(0).toUpperCase() + guide.category.slice(1)}
                            </span>
                          </div>

                          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-mali-blue-accent transition-colors">
                            {guide.title}
                          </h3>

                          <p className="text-mali-text-secondary text-sm mb-4">
                            {guide.excerpt}
                          </p>

                          <div className="flex justify-between items-center">
                            <div className="flex items-center text-xs text-mali-text-secondary">
                              <User size={12} className="mr-1" />
                              <span className="mr-3">{guide.author}</span>

                              <Calendar size={12} className="mr-1" />
                              <span className="mr-3">{formatDate(guide.date)}</span>

                              <Clock size={12} className="mr-1" />
                              <span className="mr-3">{guide.readTime} min read</span>

                              <Star size={12} className="mr-1 text-amber-400" />
                              <span>{guide.likes}</span>
                            </div>

                            <span className="text-mali-blue-accent text-sm font-medium flex items-center group-hover:translate-x-1 transition-transform">
                              Read Guide
                              <ArrowRight size={14} className="ml-1" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      ) : (
        <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-12 text-center">
          <Search size={48} className="mx-auto text-mali-text-secondary mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Guides Found</h3>
          <p className="text-mali-text-secondary mb-6">
            We couldn't find any guides matching your filters.
          </p>
          <button
            onClick={() => {
              setSelectedCategory("all");
              setSelectedGame("all");
              setSelectedDifficulty("all");
              setSearchQuery("");
            }}
            className="bg-mali-blue hover:bg-mali-blue/90 text-white px-6 py-3 rounded-lg font-medium"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Popular Tags */}
      <motion.div
        className="mt-12 p-6 bg-mali-card border border-mali-blue/20 rounded-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <Tag size={18} className="mr-2 text-mali-blue-accent" />
          Popular Topics
        </h3>

        <div className="flex flex-wrap gap-2">
          {Array.from(new Set(guides.flatMap(guide => guide.tags)))
            .sort()
            .map((tag, index) => (
              <button
                key={index}
                onClick={() => setSearchQuery(tag)}
                className="bg-mali-blue/10 hover:bg-mali-blue/20 border border-mali-blue/30 text-mali-text-secondary hover:text-white text-xs px-3 py-1.5 rounded-full"
              >
                {tag}
              </button>
            ))}
        </div>
      </motion.div>
    </div>
  );
}

export default function GuidesPage() {
  return (
    <Suspense fallback={
      <div className="page-container min-h-screen flex items-center justify-center">
        <div className="relative w-20 h-20 animate-pulse-glow">
          <div className="absolute inset-0 bg-glow-gradient animate-glow"></div>
          <div className="absolute inset-0 border-2 border-mali-blue-light rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-2 border-mali-purple rounded-full animate-spin-slow"></div>
        </div>
      </div>
    }>
      <GuidesContent />
    </Suspense>
  );
} 
