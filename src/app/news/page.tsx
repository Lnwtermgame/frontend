"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Newspaper, Clock, Calendar, ChevronRight, Search, 
  Tag, ThumbsUp, MessageSquare, Share2, Eye, ArrowRight,
  Bookmark, BookmarkCheck
} from "lucide-react";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";
import { useTranslations } from "@/lib/context/language-context";

// Mock categories
const categories = [
  { id: "all", name: "All News", count: 24 },
  { id: "updates", name: "Game Updates", count: 8 },
  { id: "promotions", name: "Promotions", count: 6 },
  { id: "events", name: "Events", count: 4 },
  { id: "releases", name: "New Releases", count: 3 },
  { id: "guides", name: "Guides & Tutorials", count: 3 }
];

// Mock featured news
const featuredNews = {
  id: "news001",
  title: "Mobile Legends Season 25 - New Heroes and Map Update",
  excerpt: "New season brings major changes to the map, three new heroes, and a complete overhaul of the ranked system",
  category: "updates",
  image: "https://placehold.co/1200x600/003366/ffffff?text=Mobile+Legends+Update",
  author: "GamePass Team",
  date: "2023-11-12",
  readTime: 5,
  likes: 243,
  comments: 57,
  views: 1452,
  tags: ["Mobile Legends", "Season 25", "Update"]
};

// Mock news articles
const newsArticles = [
  {
    id: "news002",
    title: "PUBG Mobile Collaboration with Dragon Ball Z Announced",
    excerpt: "Exciting new skins and gameplay features coming in the Dragon Ball Z collaboration event",
    category: "events",
    image: "https://placehold.co/600x400/660066/ffffff?text=PUBG+x+DBZ",
    author: "GamePass Team",
    date: "2023-11-10",
    readTime: 4,
    likes: 182,
    comments: 43,
    views: 1240,
    featured: false,
    tags: ["PUBG Mobile", "Dragon Ball Z", "Collaboration"]
  },
  {
    id: "news003",
    title: "Genshin Impact 4.2 Update - All You Need to Know",
    excerpt: "Explore the new region, meet new characters, and discover exciting quests in the latest update",
    category: "updates",
    image: "https://placehold.co/600x400/6666cc/ffffff?text=Genshin+Impact+4.2",
    author: "GamePass Team",
    date: "2023-11-08",
    readTime: 7,
    likes: 320,
    comments: 98,
    views: 2150,
    featured: false,
    tags: ["Genshin Impact", "Update 4.2", "New Content"]
  },
  {
    id: "news004",
    title: "Black Friday Game Deals - Up to 70% Off on Top Games",
    excerpt: "Get amazing deals on game credits, gift cards, and in-game items during our Black Friday sale",
    category: "promotions",
    image: "https://placehold.co/600x400/cc0000/ffffff?text=Black+Friday+Deals",
    author: "GamePass Team",
    date: "2023-11-05",
    readTime: 3,
    likes: 156,
    comments: 22,
    views: 1875,
    featured: false,
    tags: ["Black Friday", "Deals", "Sale"]
  },
  {
    id: "news005",
    title: "How to Rank Up Fast in Valorant - Pro Tips and Tricks",
    excerpt: "Master these strategies from pro players to climb the ranked ladder in Valorant",
    category: "guides",
    image: "https://placehold.co/600x400/cc0000/ffffff?text=Valorant+Guide",
    author: "GamePass Team",
    date: "2023-11-03",
    readTime: 8,
    likes: 278,
    comments: 63,
    views: 3240,
    featured: false,
    tags: ["Valorant", "Guide", "Pro Tips"]
  },
  {
    id: "news006",
    title: "Free Fire Max Now Available - Enhanced Graphics and Features",
    excerpt: "Download the new Free Fire Max for improved graphics, gameplay, and exclusive content",
    category: "releases",
    image: "https://placehold.co/600x400/ff6600/ffffff?text=Free+Fire+Max",
    author: "GamePass Team",
    date: "2023-11-01",
    readTime: 5,
    likes: 194,
    comments: 46,
    views: 2105,
    featured: false,
    tags: ["Free Fire Max", "New Release", "Battle Royale"]
  },
  {
    id: "news007",
    title: "Exclusive In-Game Items for GamePass Members",
    excerpt: "Get exclusive skins, weapons, and items when you top-up through GamePass",
    category: "promotions",
    image: "https://placehold.co/600x400/33aa33/ffffff?text=Exclusive+Items",
    author: "GamePass Team",
    date: "2023-10-29",
    readTime: 3,
    likes: 142,
    comments: 19,
    views: 1680,
    featured: false,
    tags: ["Exclusive", "In-Game Items", "Promotion"]
  }
];

export default function NewsPage() {
  const router = useRouter();
  const { t } = useTranslations();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [savedArticles, setSavedArticles] = useState<string[]>([]);
  const [filteredArticles, setFilteredArticles] = useState(newsArticles);

  // Filter articles based on category and search query
  useEffect(() => {
    let articles = newsArticles;
    
    if (selectedCategory !== "all") {
      articles = articles.filter(article => article.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      articles = articles.filter(article => 
        article.title.toLowerCase().includes(query) || 
        article.excerpt.toLowerCase().includes(query) ||
        article.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    setFilteredArticles(articles);
  }, [selectedCategory, searchQuery]);

  // Toggle saved article
  const toggleSaveArticle = (articleId: string) => {
    if (savedArticles.includes(articleId)) {
      setSavedArticles(savedArticles.filter(id => id !== articleId));
    } else {
      setSavedArticles([...savedArticles, articleId]);
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="page-container">
      {/* Hero Section */}
      <motion.div 
        className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border border-mali-blue/30 rounded-xl p-6 md:p-8 mb-8"
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
              <Newspaper className="h-7 w-7 text-mali-blue-accent mr-3" />
              <h1 className="text-2xl md:text-3xl font-bold text-white">News & Updates</h1>
            </div>
            <p className="text-gray-300 mb-6">
              Stay updated with the latest game news, events, updates, and promotions
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
              placeholder="Search news, updates, and guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </motion.div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar - Categories */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="lg:col-span-1 order-2 lg:order-1"
        >
          <div className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden sticky top-24">
            <div className="p-5 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-b border-mali-blue/30">
              <h3 className="text-lg font-bold text-white">Categories</h3>
            </div>
            
            <div className="p-3">
              <ul className="space-y-2">
                {categories.map((category) => (
                  <li key={category.id}>
                    <button
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors
                        ${selectedCategory === category.id 
                          ? 'bg-mali-blue text-white' 
                          : 'bg-mali-blue/10 text-mali-text-secondary hover:bg-mali-blue/20 hover:text-white'
                        }`}
                    >
                      <span>{category.name}</span>
                      <span className={`text-xs rounded-full px-2 py-1 ${
                        selectedCategory === category.id 
                          ? 'bg-white/20' 
                          : 'bg-mali-blue/20'
                      }`}>
                        {category.count}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Popular Tags */}
            <div className="p-5 border-t border-mali-blue/20">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <Tag size={16} className="mr-2 text-mali-blue-accent" />
                Popular Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(newsArticles.flatMap(article => article.tags)))
                  .slice(0, 8)
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
            </div>
          </div>
        </motion.div>
        
        {/* Article Content */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          {/* Featured Article */}
          {selectedCategory === "all" && !searchQuery && (
            <Link href={`/news/${featuredNews.id}`}>
              <motion.div 
                className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden mb-8 group cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -5 }}
              >
                <div className="relative">
                  <div className="aspect-[21/9] bg-gradient-to-br from-blue-900/50 to-purple-900/50">
                    <img 
                      src={featuredNews.image} 
                      alt={featuredNews.title}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-purple-600/90 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                      Featured
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <span className="bg-mali-blue/20 text-mali-blue-accent text-xs font-medium px-3 py-1 rounded-full mb-3 inline-block">
                    {featuredNews.category.charAt(0).toUpperCase() + featuredNews.category.slice(1)}
                  </span>
                  
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-3 group-hover:text-mali-blue-accent transition-colors">
                    {featuredNews.title}
                  </h2>
                  
                  <p className="text-mali-text-secondary mb-4">
                    {featuredNews.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-mali-text-secondary">
                      <Calendar size={14} className="mr-1" />
                      <span className="mr-3">{formatDate(featuredNews.date)}</span>
                      
                      <Clock size={14} className="mr-1" />
                      <span className="mr-3">{featuredNews.readTime} min read</span>
                      
                      <Eye size={14} className="mr-1" />
                      <span>{featuredNews.views}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-mali-text-secondary">
                      <div className="flex items-center">
                        <ThumbsUp size={14} className="mr-1" />
                        <span className="text-xs">{featuredNews.likes}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <MessageSquare size={14} className="mr-1" />
                        <span className="text-xs">{featuredNews.comments}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-5 pt-4 border-t border-mali-blue/20 flex justify-between items-center">
                    <span className="text-sm text-mali-text-secondary">
                      By <span className="text-white">{featuredNews.author}</span>
                    </span>
                    
                    <span className="text-sm text-mali-blue-accent font-medium flex items-center group-hover:translate-x-1 transition-transform">
                      Read Full Article
                      <ArrowRight size={16} className="ml-1" />
                    </span>
                  </div>
                </div>
              </motion.div>
            </Link>
          )}
          
          {/* News Articles Grid */}
          {filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredArticles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                >
                  <Link href={`/news/${article.id}`}>
                    <div className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden h-full group cursor-pointer hover:border-mali-blue/50">
                      <div className="aspect-[16/9] bg-gradient-to-br from-blue-900/50 to-purple-900/50 relative">
                        <img 
                          src={article.image} 
                          alt={article.title}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute top-3 right-3 z-10">
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              toggleSaveArticle(article.id);
                            }}
                            className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                          >
                            {savedArticles.includes(article.id) ? 
                              <BookmarkCheck size={16} className="text-mali-blue-accent" /> : 
                              <Bookmark size={16} />
                            }
                          </button>
                        </div>
                      </div>
                      
                      <div className="p-5">
                        <div className="flex justify-between mb-2">
                          <span className="bg-mali-blue/20 text-mali-blue-accent text-xs font-medium px-2 py-1 rounded-full">
                            {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
                          </span>
                          
                          <div className="flex items-center text-xs text-mali-text-secondary">
                            <Clock size={12} className="mr-1" />
                            <span>{article.readTime} min</span>
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-mali-blue-accent transition-colors line-clamp-2">
                          {article.title}
                        </h3>
                        
                        <p className="text-mali-text-secondary text-sm mb-3 line-clamp-2">
                          {article.excerpt}
                        </p>
                        
                        <div className="flex justify-between items-center text-xs text-mali-text-secondary">
                          <span>{formatDate(article.date)}</span>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex items-center">
                              <ThumbsUp size={12} className="mr-1" />
                              <span>{article.likes}</span>
                            </div>
                            
                            <div className="flex items-center">
                              <MessageSquare size={12} className="mr-1" />
                              <span>{article.comments}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-12 text-center">
              <Search size={48} className="mx-auto text-mali-text-secondary mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Articles Found</h3>
              <p className="text-mali-text-secondary mb-6">
                We couldn't find any articles matching your search criteria.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="bg-mali-blue hover:bg-mali-blue/90 text-white px-6 py-3 rounded-lg font-medium"
              >
                Clear Filters
              </button>
            </div>
          )}
          
          {/* Show More Button */}
          {filteredArticles.length > 0 && (
            <div className="mt-8 text-center">
              <button className="bg-mali-blue/20 hover:bg-mali-blue/30 text-mali-blue-accent px-6 py-3 rounded-lg font-medium">
                Load More Articles
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 