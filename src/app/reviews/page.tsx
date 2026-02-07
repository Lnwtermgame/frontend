"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Star, Search, ThumbsUp, ThumbsDown, Filter,
  MessageSquare, ChevronDown,
  Calendar, BadgeCheck, ArrowRight, MoreHorizontal
} from "lucide-react";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";
import { useAuth } from "@/lib/hooks/use-auth";

// Define review type
interface GameReview {
  id: string;
  gameId: string;
  gameName: string;
  gameImage: string;
  userId: string;
  username: string;
  userAvatar: string;
  isVerifiedPurchase: boolean;
  rating: number;
  title: string;
  content: string;
  date: string;
  likes: number;
  dislikes: number;
  platform: "mobile" | "pc" | "console";
  tags: string[];
}

// Mock reviews data
const reviews: GameReview[] = [
  {
    id: "review001",
    gameId: "game001",
    gameName: "Mobile Legends",
    gameImage: "https://placehold.co/600x400/003366/ffffff?text=Mobile+Legends",
    userId: "user001",
    username: "GamerPro99",
    userAvatar: "https://placehold.co/200x200?text=GP",
    isVerifiedPurchase: true,
    rating: 4.5,
    title: "Great MOBA for mobile devices with smooth gameplay",
    content: "I've been playing Mobile Legends for over a year now and I'm still enjoying it. The controls are intuitive for a mobile game, and the matchmaking is generally fair. Heroes are well-balanced with regular updates keeping the meta fresh. Occasional lag issues during peak hours, but overall a solid gaming experience. Definitely recommend for MOBA fans looking for a mobile alternative to PC games like League of Legends.",
    date: "2023-11-15",
    likes: 42,
    dislikes: 5,
    platform: "mobile",
    tags: ["MOBA", "Strategy", "Competitive"]
  },
  {
    id: "review002",
    gameId: "game002",
    gameName: "PUBG Mobile",
    gameImage: "https://placehold.co/600x400/660066/ffffff?text=PUBG+Mobile",
    userId: "user002",
    username: "SniperElite",
    userAvatar: "https://placehold.co/200x200?text=SE",
    isVerifiedPurchase: true,
    rating: 5,
    title: "The best battle royale experience on mobile",
    content: "PUBG Mobile delivers an incredible battle royale experience that rivals its PC counterpart. The graphics are stunning for a mobile game, and the controls are customizable and responsive. I particularly enjoy the variety of maps and game modes. The developers are constantly adding new content and addressing issues. The anti-cheat systems have improved dramatically over time. If you're looking for a serious battle royale game on mobile, this is definitely the one to play.",
    date: "2023-11-12",
    likes: 78,
    dislikes: 3,
    platform: "mobile",
    tags: ["Battle Royale", "Shooter", "Tactical"]
  },
  {
    id: "review003",
    gameId: "game003",
    gameName: "Genshin Impact",
    gameImage: "https://placehold.co/600x400/6666cc/ffffff?text=Genshin+Impact",
    userId: "user003",
    username: "AdventureSeeker",
    userAvatar: "https://placehold.co/200x200?text=AS",
    isVerifiedPurchase: false,
    rating: 4,
    title: "Beautiful open world with engaging combat",
    content: "Genshin Impact offers a breathtaking open world with plenty to explore. The elemental combat system is innovative and allows for creative approaches to battles. Character designs are top-notch with interesting backstories. However, the gacha system can be frustrating for F2P players, and the resin system limits how much you can progress in a day. Despite these limitations, the regular updates with new areas, characters, and storylines keep the game fresh and exciting. Definitely worth trying, even if you don't plan to spend money.",
    date: "2023-11-08",
    likes: 103,
    dislikes: 15,
    platform: "mobile",
    tags: ["Open World", "RPG", "Fantasy"]
  },
  {
    id: "review004",
    gameId: "game004",
    gameName: "Valorant",
    gameImage: "https://placehold.co/600x400/cc0000/ffffff?text=Valorant",
    userId: "user004",
    username: "TacticalShooter",
    userAvatar: "https://placehold.co/200x200?text=TS",
    isVerifiedPurchase: true,
    rating: 4.5,
    title: "Tactical shooter with unique agent abilities",
    content: "Valorant successfully blends precise gunplay with unique character abilities to create a fresh take on tactical shooters. The game rewards skill and strategy, with each agent bringing something different to the team composition. Maps are well-designed with multiple approaches to each site. The anti-cheat is effective, though sometimes a bit intrusive. Regular updates and a responsive dev team keep the game balanced. If you enjoy CS:GO but want something with a bit more variety in gameplay, Valorant is definitely worth checking out.",
    date: "2023-11-05",
    likes: 67,
    dislikes: 8,
    platform: "pc",
    tags: ["FPS", "Tactical", "Competitive"]
  },
  {
    id: "review005",
    gameId: "game005",
    gameName: "Free Fire",
    gameImage: "https://placehold.co/600x400/ff6600/ffffff?text=Free+Fire",
    userId: "user005",
    username: "FireNinja",
    userAvatar: "https://placehold.co/200x200?text=FN",
    isVerifiedPurchase: true,
    rating: 3.5,
    title: "Accessible battle royale with room for improvement",
    content: "Free Fire is a great entry point into battle royale games, especially for those with lower-end devices. The matches are quick and action-packed, with a good variety of weapons and characters with unique abilities. The graphics are basic but functional, prioritizing performance over visuals. My main complaints are occasional server issues and an increasing focus on cosmetic microtransactions. Still, it's a fun game to play with friends and the regular updates keep things interesting. Good option if you want a lighter alternative to PUBG Mobile.",
    date: "2023-11-01",
    likes: 45,
    dislikes: 12,
    platform: "mobile",
    tags: ["Battle Royale", "Shooter", "Action"]
  },
  {
    id: "review006",
    gameId: "game006",
    gameName: "League of Legends: Wild Rift",
    gameImage: "https://placehold.co/600x400/0066cc/ffffff?text=Wild+Rift",
    userId: "user006",
    username: "MidLaneMain",
    userAvatar: "https://placehold.co/200x200?text=MLM",
    isVerifiedPurchase: false,
    rating: 5,
    title: "Perfect adaptation of LoL for mobile devices",
    content: "Wild Rift is an impressive adaptation of League of Legends for mobile. The controls are intuitive, and the shorter match times (15-20 minutes) make it perfect for gaming on the go. Champion abilities have been thoughtfully modified to work with touch controls. The graphics are excellent, and the performance is smooth even on mid-range devices. Riot has done a great job balancing the champions and providing regular updates. The progression system is fair for free players too. If you enjoy MOBAs or are a fan of League on PC, Wild Rift is a must-try.",
    date: "2023-10-28",
    likes: 89,
    dislikes: 4,
    platform: "mobile",
    tags: ["MOBA", "Strategy", "Competitive"]
  },
  {
    id: "review007",
    gameId: "game007",
    gameName: "Call of Duty Mobile",
    gameImage: "https://placehold.co/600x400/333333/ffffff?text=CoD+Mobile",
    userId: "user007",
    username: "OperatorElite",
    userAvatar: "https://placehold.co/200x200?text=OE",
    isVerifiedPurchase: true,
    rating: 4,
    title: "Console-quality shooter experience on mobile",
    content: "Call of Duty Mobile impressively brings the CoD experience to smartphones. The controls are customizable and responsive, making the gameplay feel natural after some practice. Both multiplayer and battle royale modes are well-implemented with classic maps and weapons from various CoD titles. Graphics are excellent on high-end devices. The battle pass and progression systems are reasonable, though some cosmetics are expensive. Regular updates add new content and game modes. Some occasional matchmaking issues, but overall one of the best FPS experiences available on mobile.",
    date: "2023-10-22",
    likes: 72,
    dislikes: 7,
    platform: "mobile",
    tags: ["FPS", "Battle Royale", "Action"]
  },
  {
    id: "review008",
    gameId: "game008",
    gameName: "Fortnite",
    gameImage: "https://placehold.co/600x400/6699cc/ffffff?text=Fortnite",
    userId: "user008",
    username: "BuildMaster",
    userAvatar: "https://placehold.co/200x200?text=BM",
    isVerifiedPurchase: false,
    rating: 4,
    title: "Unique blend of shooting and building mechanics",
    content: "Fortnite stands out in the battle royale genre with its unique building mechanics that add a layer of strategy beyond just shooting. The game is constantly evolving with new seasons bringing map changes, weapons, and gameplay mechanics. The cartoonish art style holds up well over time. The cross-platform play is seamless, allowing mobile players to compete with console and PC users (though this can be challenging). Creative mode offers endless possibilities for custom games. The frequent collaborations with movies, music, and other games keep things fresh. A fun experience overall, especially with friends.",
    date: "2023-10-15",
    likes: 56,
    dislikes: 9,
    platform: "console",
    tags: ["Battle Royale", "Building", "Cross-platform"]
  }
];

// Platform options
const platforms = [
  { name: "All Platforms", value: "all" },
  { name: "Mobile", value: "mobile" },
  { name: "PC", value: "pc" },
  { name: "Console", value: "console" }
];

// Rating options
const ratings = [
  { name: "All Ratings", value: "all" },
  { name: "5 Stars", value: "5" },
  { name: "4+ Stars", value: "4" },
  { name: "3+ Stars", value: "3" }
];

// Sort options
const sortOptions = [
  { name: "Most Recent", value: "date" },
  { name: "Highest Rated", value: "rating" },
  { name: "Most Helpful", value: "likes" }
];

// Popular games for filtering
const popularGames = [
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

function ReviewsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { user } = useAuth();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedRating, setSelectedRating] = useState("all");
  const [selectedGame, setSelectedGame] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [filteredReviews, setFilteredReviews] = useState<GameReview[]>(reviews);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [likedReviews, setLikedReviews] = useState<string[]>([]);
  const [dislikedReviews, setDislikedReviews] = useState<string[]>([]);

  // Set initial filters from URL parameters
  useEffect(() => {
    const platform = searchParams.get("platform");
    const rating = searchParams.get("rating");
    const game = searchParams.get("game");
    const query = searchParams.get("q");
    const verified = searchParams.get("verified") === "true";

    if (platform) setSelectedPlatform(platform);
    if (rating) setSelectedRating(rating);
    if (game) setSelectedGame(game);
    if (query) setSearchQuery(query);
    if (verified) setVerifiedOnly(verified);
  }, [searchParams]);

  // Filter reviews based on selected filters
  useEffect(() => {
    let filtered = [...reviews];

    // Apply platform filter
    if (selectedPlatform !== "all") {
      filtered = filtered.filter(review => review.platform === selectedPlatform);
    }

    // Apply rating filter
    if (selectedRating !== "all") {
      const minRating = parseInt(selectedRating);
      filtered = filtered.filter(review => review.rating >= minRating);
    }

    // Apply game filter
    if (selectedGame !== "all") {
      filtered = filtered.filter(review => review.gameName === selectedGame);
    }

    // Apply verified purchase filter
    if (verifiedOnly) {
      filtered = filtered.filter(review => review.isVerifiedPurchase);
    }

    // Apply search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(review =>
        review.title.toLowerCase().includes(query) ||
        review.content.toLowerCase().includes(query) ||
        review.gameName.toLowerCase().includes(query) ||
        review.username.toLowerCase().includes(query) ||
        review.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "date":
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "likes":
        filtered.sort((a, b) => b.likes - a.likes);
        break;
    }

    setFilteredReviews(filtered);
  }, [selectedPlatform, selectedRating, selectedGame, verifiedOnly, searchQuery, sortBy]);

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Handle like/dislike
  const handleLikeReview = (reviewId: string, isLike: boolean) => {
    if (isLike) {
      // If already liked, remove like
      if (likedReviews.includes(reviewId)) {
        setLikedReviews(likedReviews.filter(id => id !== reviewId));
      }
      // If disliked, remove dislike and add like
      else if (dislikedReviews.includes(reviewId)) {
        setDislikedReviews(dislikedReviews.filter(id => id !== reviewId));
        setLikedReviews([...likedReviews, reviewId]);
      }
      // Add like
      else {
        setLikedReviews([...likedReviews, reviewId]);
      }
    } else {
      // If already disliked, remove dislike
      if (dislikedReviews.includes(reviewId)) {
        setDislikedReviews(dislikedReviews.filter(id => id !== reviewId));
      }
      // If liked, remove like and add dislike
      else if (likedReviews.includes(reviewId)) {
        setLikedReviews(likedReviews.filter(id => id !== reviewId));
        setDislikedReviews([...dislikedReviews, reviewId]);
      }
      // Add dislike
      else {
        setDislikedReviews([...dislikedReviews, reviewId]);
      }
    }
  };

  // Calculate adjusted likes/dislikes based on user interactions
  const getAdjustedLikes = (review: GameReview) => {
    let adjustedLikes = review.likes;
    if (likedReviews.includes(review.id)) adjustedLikes++;
    if (dislikedReviews.includes(review.id) && !likedReviews.includes(review.id)) adjustedLikes--;
    return adjustedLikes < 0 ? 0 : adjustedLikes;
  };

  const getAdjustedDislikes = (review: GameReview) => {
    let adjustedDislikes = review.dislikes;
    if (dislikedReviews.includes(review.id)) adjustedDislikes++;
    if (likedReviews.includes(review.id) && !dislikedReviews.includes(review.id)) adjustedDislikes--;
    return adjustedDislikes < 0 ? 0 : adjustedDislikes;
  };

  // Render stars for rating
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="w-4 h-4 text-brutal-yellow fill-brutal-yellow" />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star className="w-4 h-4 text-brutal-yellow" />
            <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
              <Star className="w-4 h-4 text-brutal-yellow fill-brutal-yellow" />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
        ))}
      </div>
    );
  };

  return (
    <div className="page-container bg-brutal-gray min-h-screen">
      {/* Hero Section */}
      <motion.div
        className="bg-white border-[3px] border-black rounded-xl p-6 md:p-8 mb-8"
        style={{ boxShadow: '4px 4px 0 0 #000000' }}
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
              <span className="w-1.5 h-7 bg-brutal-pink mr-3"></span>
              <Star className="h-7 w-7 text-brutal-yellow mr-3" />
              <h1 className="text-2xl md:text-3xl font-bold text-black">Game Reviews</h1>
            </div>
            <p className="text-gray-600 mb-6">
              Browse user reviews and ratings for popular games, or share your own experience
            </p>
          </motion.div>

          {/* Search Bar */}
          <div className="relative mb-2">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-5 h-5 text-gray-500" />
            </div>
            <input
              type="text"
              className="block w-full p-3 pl-10 bg-white border-[2px] border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-black transition-colors"
              placeholder="Search for games, reviews, or reviewers..."
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
        <div className="bg-white border-[3px] border-black rounded-xl p-4" style={{ boxShadow: '4px 4px 0 0 #000000' }}>
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4">
              {/* Game Filter */}
              <div className="relative">
                <select
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
                  className="appearance-none bg-gray-100 border-[2px] border-gray-300 text-black rounded-lg py-2 pl-4 pr-10 focus:outline-none focus:border-black cursor-pointer"
                >
                  {popularGames.map((game) => (
                    <option key={game.value} value={game.value}>
                      {game.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronDown size={16} className="text-gray-500" />
                </div>
              </div>

              {/* Platform Filter */}
              <div className="relative">
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="appearance-none bg-gray-100 border-[2px] border-gray-300 text-black rounded-lg py-2 pl-4 pr-10 focus:outline-none focus:border-black cursor-pointer"
                >
                  {platforms.map((platform) => (
                    <option key={platform.value} value={platform.value}>
                      {platform.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronDown size={16} className="text-gray-500" />
                </div>
              </div>

              {/* Rating Filter */}
              <div className="relative">
                <select
                  value={selectedRating}
                  onChange={(e) => setSelectedRating(e.target.value)}
                  className="appearance-none bg-gray-100 border-[2px] border-gray-300 text-black rounded-lg py-2 pl-4 pr-10 focus:outline-none focus:border-black cursor-pointer"
                >
                  {ratings.map((rating) => (
                    <option key={rating.value} value={rating.value}>
                      {rating.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronDown size={16} className="text-gray-500" />
                </div>
              </div>

              {/* Verified Purchasers Only */}
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 mr-2 border-[2px] border-black rounded flex items-center justify-center transition-colors ${verifiedOnly ? 'bg-brutal-pink' : 'bg-white'}`}>
                    {verifiedOnly && <BadgeCheck size={14} className="text-white" />}
                  </div>
                  <span className="text-black text-sm font-medium">Verified Purchases Only</span>
                </label>
              </div>
            </div>

            {/* Sort Options */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-gray-100 border-[2px] border-gray-300 text-black rounded-lg py-2 pl-4 pr-10 focus:outline-none focus:border-black cursor-pointer"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <ChevronDown size={16} className="text-gray-500" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Results Count */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-black flex items-center">
          <span className="w-1.5 h-5 bg-brutal-blue mr-2"></span>
          {filteredReviews.length} {filteredReviews.length === 1 ? 'Review' : 'Reviews'} Found
        </h2>

        {/* Clear Filters Button (visible only when filters are applied) */}
        {(selectedPlatform !== "all" || selectedRating !== "all" || selectedGame !== "all" || verifiedOnly || searchQuery) && (
          <button
            onClick={() => {
              setSelectedPlatform("all");
              setSelectedRating("all");
              setSelectedGame("all");
              setVerifiedOnly(false);
              setSearchQuery("");
            }}
            className="text-black hover:underline text-sm flex items-center font-medium"
          >
            <Filter size={14} className="mr-1" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Write Review Button */}
      <div className="mb-8">
        <Link href={user ? "/reviews/write" : "/login?redirect=/reviews/write"} className="inline-block">
          <button className="bg-black text-white border-[3px] border-black py-3 px-6 rounded-lg font-medium flex items-center hover:bg-gray-800 transition-colors" style={{ boxShadow: '4px 4px 0 0 #000000' }}>
            <MessageSquare size={18} className="mr-2" />
            Write a Review
          </button>
        </Link>
      </div>

      {/* Reviews List */}
      {filteredReviews.length > 0 ? (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {filteredReviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * Math.min(index, 5) }}
              className="bg-white border-[3px] border-black rounded-xl overflow-hidden"
              style={{ boxShadow: '4px 4px 0 0 #000000' }}
            >
              <div className="border-b-[2px] border-black bg-gray-50 px-6 py-4 flex flex-wrap justify-between items-center">
                <Link href={`/games/${review.gameId}`} className="flex items-center group">
                  <div className="w-12 h-12 bg-white border-[2px] border-black rounded-lg overflow-hidden mr-3">
                    <img
                      src={review.gameImage}
                      alt={review.gameName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-black group-hover:text-brutal-pink transition-colors">
                      {review.gameName}
                    </h3>
                    <div className="flex items-center text-xs text-gray-600">
                      <span className={`px-2 py-0.5 rounded border-[2px] mr-2 font-medium ${review.platform === "mobile" ? "bg-brutal-blue text-white border-black" :
                          review.platform === "pc" ? "bg-brutal-purple text-white border-black" :
                            "bg-brutal-green text-white border-black"
                        }`}>
                        {review.platform.charAt(0).toUpperCase() + review.platform.slice(1)}
                      </span>
                      <Calendar size={12} className="mr-1" />
                      <span>{formatDate(review.date)}</span>
                    </div>
                  </div>
                </Link>

                <div className="flex items-center mt-2 sm:mt-0">
                  {renderStars(review.rating)}
                  <span className="ml-2 text-lg font-bold text-black">{review.rating.toFixed(1)}</span>
                </div>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-200 border-[2px] border-black">
                      <img
                        src={review.userAvatar}
                        alt={review.username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-black">{review.username}</p>
                      {review.isVerifiedPurchase && (
                        <div className="flex items-center text-xs text-brutal-green font-medium">
                          <BadgeCheck size={12} className="mr-1" />
                          <span>Verified Purchase</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button className="text-gray-500 hover:text-black p-1">
                    <MoreHorizontal size={18} />
                  </button>
                </div>

                <h4 className="text-xl font-bold text-black mb-3">{review.title}</h4>

                <p className="text-gray-600 mb-4">
                  {review.content}
                </p>

                {/* Tags */}
                {review.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {review.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="bg-brutal-yellow text-black text-xs px-3 py-1.5 rounded border-[2px] border-black font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Review Actions */}
                <div className="flex items-center justify-between pt-4 border-t-[2px] border-gray-200">
                  <div className="flex items-center gap-4">
                    <button
                      className={`flex items-center gap-1 font-medium ${likedReviews.includes(review.id)
                          ? "text-brutal-pink"
                          : "text-gray-600 hover:text-brutal-pink"
                        }`}
                      onClick={() => handleLikeReview(review.id, true)}
                    >
                      <ThumbsUp size={16} className={likedReviews.includes(review.id) ? "fill-brutal-pink" : ""} />
                      <span>{getAdjustedLikes(review)}</span>
                    </button>

                    <button
                      className={`flex items-center gap-1 font-medium ${dislikedReviews.includes(review.id)
                          ? "text-red-500"
                          : "text-gray-600 hover:text-red-500"
                        }`}
                      onClick={() => handleLikeReview(review.id, false)}
                    >
                      <ThumbsDown size={16} className={dislikedReviews.includes(review.id) ? "fill-red-500" : ""} />
                      <span>{getAdjustedDislikes(review)}</span>
                    </button>
                  </div>

                  <button className="text-black hover:text-brutal-pink text-sm flex items-center font-medium">
                    View full review
                    <ArrowRight size={14} className="ml-1" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Load More Button */}
          {filteredReviews.length >= 5 && (
            <div className="mt-8 text-center">
              <button className="bg-white border-[3px] border-black text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors" style={{ boxShadow: '4px 4px 0 0 #000000' }}>
                Load More Reviews
              </button>
            </div>
          )}
        </motion.div>
      ) : (
        <div className="bg-white border-[3px] border-black rounded-xl p-12 text-center" style={{ boxShadow: '4px 4px 0 0 #000000' }}>
          <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-black mb-2">No Reviews Found</h3>
          <p className="text-gray-600 mb-6">
            We couldn't find any reviews matching your filters.
          </p>
          <button
            onClick={() => {
              setSelectedPlatform("all");
              setSelectedRating("all");
              setSelectedGame("all");
              setVerifiedOnly(false);
              setSearchQuery("");
            }}
            className="bg-black text-white border-[3px] border-black px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            style={{ boxShadow: '4px 4px 0 0 #000000' }}
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <Suspense fallback={
      <div className="page-container min-h-screen flex items-center justify-center bg-brutal-gray">
        <div className="w-16 h-16 border-[4px] border-black border-t-brutal-pink rounded-full animate-spin"></div>
      </div>
    }>
      <ReviewsContent />
    </Suspense>
  );
}
