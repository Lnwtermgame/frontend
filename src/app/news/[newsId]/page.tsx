"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { 
  Calendar, Clock, ChevronLeft, Share2, ThumbsUp, 
  MessageSquare, Eye, Tag, Bookmark, BookmarkCheck,
  Facebook, Twitter, Link as LinkIcon, Copy, Check, 
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";

// Define article type
interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  author: string;
  authorAvatar: string;
  date: string;
  readTime: number;
  likes: number;
  comments: number;
  views: number;
  tags: string[];
  content: string;
}

// Mock news articles database
const newsArticlesDb: NewsArticle[] = [
  {
    id: "news001",
    title: "Mobile Legends Season 25 - New Heroes and Map Update",
    excerpt: "New season brings major changes to the map, three new heroes, and a complete overhaul of the ranked system",
    category: "updates",
    image: "https://placehold.co/1200x600/003366/ffffff?text=Mobile+Legends+Update",
    author: "GamePass Team",
    authorAvatar: "https://placehold.co/200x200/003366/ffffff?text=GP",
    date: "2023-11-12",
    readTime: 5,
    likes: 243,
    comments: 57,
    views: 1452,
    tags: ["Mobile Legends", "Season 25", "Update"],
    content: `
<p>The wait is finally over! Mobile Legends: Bang Bang Season 25 has arrived with one of the biggest updates in the game's history. This comprehensive update introduces three new heroes, major map revisions, and completely overhauls the ranked system.</p>

<h2>New Heroes</h2>
<p>Three new heroes are joining the Land of Dawn:</p>
<ul>
<li><strong>Ixia (Marksman):</strong> A long-range marksman with unique mechanics that allow her to deal increasing damage the further she is from enemies.</li>
<li><strong>Vexana (Mage):</strong> Completely reworked with new abilities that focus on controlling the battlefield with powerful AoE spells.</li>
<li><strong>Atlas (Tank):</strong> A nautical-themed tank that can pull enemies together and create devastating crowd control combinations.</li>
</ul>

<h2>Map Changes</h2>
<p>The map has undergone significant visual and strategic changes:</p>
<ul>
<li>New jungle layout with repositioned buffs</li>
<li>Revamped Lord and Turtle mechanics</li>
<li>Additional bush placements in side lanes</li>
<li>Enhanced graphics and effects throughout the map</li>
</ul>

<h2>Ranked System Overhaul</h2>
<p>The ranked system has been completely redesigned:</p>
<ul>
<li>New tier between Legend and Mythic called "Immortal"</li>
<li>Seasonal rewards are now distributed based on your highest rank achieved</li>
<li>New MVP protection system that prevents star loss for exceptional performance</li>
<li>Team-based matchmaking improvements to ensure more balanced games</li>
</ul>

<p>Additionally, the update includes over 120 item adjustments, hero balancing, and quality-of-life improvements. Make sure to update your game to the latest version to enjoy all these features!</p>

<h2>Season 25 Events</h2>
<p>To celebrate the new season, several events will be running throughout November and December:</p>
<ul>
<li>Login daily to receive free heroes and skins</li>
<li>Complete special missions for exclusive rewards</li>
<li>Participate in the Season 25 tournament for a chance to win premium prizes</li>
</ul>

<p>The Season 25 update represents a significant step forward for Mobile Legends, addressing many player concerns while introducing exciting new content. Jump into the Land of Dawn and experience these changes firsthand!</p>
    `
  },
  {
    id: "news002",
    title: "PUBG Mobile Collaboration with Dragon Ball Z Announced",
    excerpt: "Exciting new skins and gameplay features coming in the Dragon Ball Z collaboration event",
    category: "events",
    image: "https://placehold.co/600x400/660066/ffffff?text=PUBG+x+DBZ",
    author: "GamePass Team",
    authorAvatar: "https://placehold.co/200x200/003366/ffffff?text=GP",
    date: "2023-11-10",
    readTime: 4,
    likes: 182,
    comments: 43,
    views: 1240,
    tags: ["PUBG Mobile", "Dragon Ball Z", "Collaboration"],
    content: `
<p>PUBG Mobile has officially announced an exciting collaboration with the iconic anime series Dragon Ball Z, bringing the world of Saiyans and epic battles to the battle royale game.</p>

<h2>Dragon Ball Z Character Skins</h2>
<p>Players will be able to transform into their favorite Dragon Ball Z characters with premium skins including:</p>
<ul>
<li>Goku (with Super Saiyan transformation effects)</li>
<li>Vegeta</li>
<li>Piccolo</li>
<li>Frieza</li>
<li>Cell</li>
</ul>

<h2>Special Abilities and Effects</h2>
<p>The collaboration introduces unique gameplay elements:</p>
<ul>
<li>Special emotes including the Kamehameha and Spirit Bomb</li>
<li>Vehicle skins based on Capsule Corp technology</li>
<li>Weapon skins with Ki-blast effects</li>
<li>Special air drop packages styled after Dragon Balls</li>
</ul>

<p>This collaboration will begin next week and run for approximately one month. Make sure to log in daily for free collaboration items and participate in special events to earn premium Dragon Ball Z content!</p>
    `
  },
  {
    id: "news003",
    title: "Genshin Impact 4.2 Update - All You Need to Know",
    excerpt: "Explore the new region, meet new characters, and discover exciting quests in the latest update",
    category: "updates",
    image: "https://placehold.co/600x400/6666cc/ffffff?text=Genshin+Impact+4.2",
    author: "GamePass Team",
    authorAvatar: "https://placehold.co/200x200/003366/ffffff?text=GP",
    date: "2023-11-08",
    readTime: 7,
    likes: 320,
    comments: 98,
    views: 2150,
    tags: ["Genshin Impact", "Update 4.2", "New Content"],
    content: `
<p>Genshin Impact's highly anticipated 4.2 update has arrived, bringing a wealth of new content to this beloved open-world adventure.</p>

<h2>New Region: Fontaine Depths</h2>
<p>The underwater portion of Fontaine is now accessible, featuring:</p>
<ul>
<li>Three major explorable zones</li>
<li>Unique underwater movement mechanics</li>
<li>New puzzles specifically designed for underwater exploration</li>
<li>Hidden treasures and challenges throughout the depths</li>
</ul>

<h2>New Characters</h2>
<p>Two new characters join the roster:</p>
<ul>
<li><strong>Furina (5★ Hydro):</strong> The enigmatic Hydro Archon herself, wielding powerful water abilities and unique mechanics tied to HP management</li>
<li><strong>Charlotte (4★ Cryo):</strong> A journalist from Fontaine with ranged Cryo abilities and support capabilities</li>
</ul>

<h2>New Storyline</h2>
<p>The Archon Quest continues with Chapter IV: Act III, delving deeper into the mysteries of Fontaine and the Hydro Archon's true motives.</p>

<h2>Events and Additional Content</h2>
<ul>
<li>New flagship event: "Tides of Justice"</li>
<li>New domain challenges with exclusive rewards</li>
<li>Additional world quests and hidden achievements</li>
<li>Quality of life improvements and bug fixes</li>
</ul>

<p>The update is available now on all platforms. Remember to claim your free Primogems compensation for the maintenance period!</p>
    `
  },
  {
    id: "news004",
    title: "Black Friday Game Deals - Up to 70% Off on Top Games",
    excerpt: "Get amazing deals on game credits, gift cards, and in-game items during our Black Friday sale",
    category: "promotions",
    image: "https://placehold.co/600x400/cc0000/ffffff?text=Black+Friday+Deals",
    author: "GamePass Team",
    authorAvatar: "https://placehold.co/200x200/003366/ffffff?text=GP",
    date: "2023-11-05",
    readTime: 3,
    likes: 156,
    comments: 22,
    views: 1875,
    tags: ["Black Friday", "Deals", "Sale"],
    content: `
<p>Our biggest sale of the year is here! We're celebrating Black Friday with incredible discounts across our entire catalog of game credits, gift cards, and in-game items.</p>

<h2>Top Deals</h2>
<ul>
<li><strong>Mobile Legends:</strong> 70% off Diamond bundles</li>
<li><strong>PUBG Mobile:</strong> 65% off UC packs</li>
<li><strong>Genshin Impact:</strong> 50% off Genesis Crystal top-ups</li>
<li><strong>Free Fire:</strong> 60% off Diamond packages</li>
<li><strong>Steam Gift Cards:</strong> 25% additional bonus value</li>
</ul>

<h2>Flash Sales</h2>
<p>In addition to our ongoing discounts, we'll be running limited-time flash sales throughout the Black Friday weekend. These deals will only be available for a few hours each, so make sure to check back frequently!</p>

<h2>Bonus Rewards</h2>
<p>Every purchase made during the Black Friday sale period will earn double reward points and automatically enter you into our grand prize drawing for a gaming setup worth over $2,000.</p>

<p>Sale runs from November 24th through November 28th. Don't miss out on these incredible savings!</p>
    `
  }
];

// Mock related articles based on tags and category
const getRelatedArticles = (currentArticle: NewsArticle, count = 3): NewsArticle[] => {
  return newsArticlesDb
    .filter(article => article.id !== currentArticle.id)
    .filter(article => 
      article.category === currentArticle.category || 
      article.tags.some(tag => currentArticle.tags.includes(tag))
    )
    .slice(0, count);
};

export default function NewsArticlePage() {
  const router = useRouter();
  const params = useParams();
    const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [likes, setLikes] = useState<number>(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([]);

  // Fetch article data by ID
  useEffect(() => {
    if (params.newsId) {
      const fetchedArticle = newsArticlesDb.find(article => article.id === params.newsId);
      
      if (fetchedArticle) {
        setArticle(fetchedArticle);
        setLikes(fetchedArticle.likes);
        setRelatedArticles(getRelatedArticles(fetchedArticle));
      } else {
        // Article not found, redirect to news page
        router.push('/news');
      }
      
      setLoading(false);
    }
  }, [params.newsId, router]);

  // Handle like
  const handleLike = () => {
    if (!hasLiked) {
      setLikes(prevLikes => prevLikes + 1);
      setHasLiked(true);
    } else {
      setLikes(prevLikes => prevLikes - 1);
      setHasLiked(false);
    }
  };

  // Handle save
  const toggleSave = () => {
    setIsSaved(!isSaved);
  };

  // Handle copy link
  const copyToClipboard = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-mali-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-mali-text-secondary">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="page-container">
        <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-12 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Article Not Found</h2>
          <p className="text-mali-text-secondary mb-6">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Link 
            href="/news" 
            className="bg-mali-blue hover:bg-mali-blue-dark text-white px-6 py-3 rounded-lg flex items-center justify-center w-48 mx-auto"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to News
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <Link 
          href="/news" 
          className="text-mali-text-secondary hover:text-white flex items-center text-sm"
        >
          <ArrowLeft size={14} className="mr-1" />
          Back to All News
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          {/* Article Content */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden mb-8"
          >
            {/* Featured Image */}
            <div className="aspect-[21/9] bg-gradient-to-br from-blue-900/50 to-purple-900/50 relative">
              <img 
                src={article.image} 
                alt={article.title}
                className="w-full h-full object-cover"
              />
              {/* Category Badge */}
              <div className="absolute top-4 left-4">
                <span className="bg-mali-blue/70 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                  {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
                </span>
              </div>
            </div>
            
            {/* Article Header */}
            <div className="p-6 md:p-8">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
                {article.title}
              </h1>
              
              <div className="flex justify-between items-center mb-6 pb-6 border-b border-mali-blue/20">
                <div className="flex items-center">
                  <img 
                    src={article.authorAvatar}
                    alt={article.author} 
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <div>
                    <p className="text-white font-medium">{article.author}</p>
                    <div className="flex items-center text-xs text-mali-text-secondary">
                      <Calendar size={12} className="mr-1" />
                      <span className="mr-3">{formatDate(article.date)}</span>
                      <Clock size={12} className="mr-1" />
                      <span>{article.readTime} min read</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleSave}
                    className="p-2 bg-mali-blue/10 hover:bg-mali-blue/20 rounded-full transition-colors"
                    title={isSaved ? "Unsave Article" : "Save Article"}
                  >
                    {isSaved ? 
                      <BookmarkCheck size={18} className="text-mali-blue-accent" /> : 
                      <Bookmark size={18} className="text-mali-text-secondary" />
                    }
                  </button>
                  
                  <div className="relative">
                    <button
                      onClick={copyToClipboard}
                      className="p-2 bg-mali-blue/10 hover:bg-mali-blue/20 rounded-full transition-colors"
                      title="Copy Link"
                    >
                      {copySuccess ? 
                        <Check size={18} className="text-green-400" /> : 
                        <LinkIcon size={18} className="text-mali-text-secondary" />
                      }
                    </button>
                    {copySuccess && (
                      <span className="absolute right-0 top-10 bg-green-900/90 text-green-400 text-xs py-1 px-2 rounded whitespace-nowrap">
                        Link copied!
                      </span>
                    )}
                  </div>
                  
                  <button
                    className="p-2 bg-mali-blue/10 hover:bg-mali-blue/20 rounded-full transition-colors"
                    title="Share on Twitter"
                  >
                    <Twitter size={18} className="text-mali-text-secondary" />
                  </button>
                  
                  <button
                    className="p-2 bg-mali-blue/10 hover:bg-mali-blue/20 rounded-full transition-colors"
                    title="Share on Facebook"
                  >
                    <Facebook size={18} className="text-mali-text-secondary" />
                  </button>
                </div>
              </div>
              
              {/* Article Body */}
              <div className="prose prose-invert prose-blue max-w-none">
                <div dangerouslySetInnerHTML={{ __html: article.content }} />
              </div>
              
              {/* Tags */}
              <div className="mt-8 pt-6 border-t border-mali-blue/20">
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag, index) => (
                    <Link 
                      href={`/news?tag=${tag}`}
                      key={index}
                      className="bg-mali-blue/10 hover:bg-mali-blue/20 text-mali-text-secondary hover:text-white text-xs px-3 py-1.5 rounded-full"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Article Footer - Stats and Interactions */}
              <div className="mt-8 pt-6 border-t border-mali-blue/20 flex flex-wrap justify-between items-center">
                <div className="flex items-center space-x-6 mb-4 sm:mb-0">
                  <div className="flex items-center">
                    <Eye size={18} className="text-mali-text-secondary mr-2" />
                    <span className="text-mali-text-secondary">
                      {article.views.toLocaleString()} views
                    </span>
                  </div>
                  
                  <button
                    onClick={handleLike}
                    className="flex items-center group"
                  >
                    <ThumbsUp 
                      size={18} 
                      className={`mr-2 ${hasLiked ? 'text-mali-blue-accent' : 'text-mali-text-secondary group-hover:text-mali-blue-accent'}`} 
                      fill={hasLiked ? 'currentColor' : 'none'}
                    />
                    <span className={`${hasLiked ? 'text-mali-blue-accent' : 'text-mali-text-secondary'}`}>
                      {likes.toLocaleString()} likes
                    </span>
                  </button>
                  
                  <Link href={`/news/${article.id}#comments`} className="flex items-center group">
                    <MessageSquare 
                      size={18} 
                      className="text-mali-text-secondary group-hover:text-mali-blue-accent mr-2" 
                    />
                    <span className="text-mali-text-secondary group-hover:text-white">
                      {article.comments.toLocaleString()} comments
                    </span>
                  </Link>
                </div>
                
                <button className="bg-mali-blue hover:bg-mali-blue-dark text-white px-4 py-2 rounded-lg flex items-center">
                  <Share2 size={16} className="mr-2" />
                  Share Article
                </button>
              </div>
            </div>
          </motion.article>
          
          {/* Comments Section Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden p-6"
            id="comments"
          >
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <MessageSquare size={20} className="text-mali-blue-accent mr-2" />
              Comments ({article.comments})
            </h3>
            
            <div className="p-8 text-center">
              <MessageSquare size={40} className="mx-auto text-mali-text-secondary mb-4" />
              <h4 className="text-lg font-medium text-white mb-2">Join the conversation</h4>
              <p className="text-mali-text-secondary mb-6">
                Login to leave a comment about this article
              </p>
              <Link 
                href="/login" 
                className="bg-mali-blue hover:bg-mali-blue-dark text-white px-6 py-3 rounded-lg inline-block"
              >
                Sign In to Comment
              </Link>
            </div>
          </motion.div>
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-4">
          {/* Related Articles */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden mb-8"
          >
            <div className="p-5 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-b border-mali-blue/30">
              <h3 className="text-lg font-bold text-white">Related Articles</h3>
            </div>
            
            <div className="p-5">
              {relatedArticles.length > 0 ? (
                <div className="space-y-4">
                  {relatedArticles.map((relatedArticle) => (
                    <Link href={`/news/${relatedArticle.id}`} key={relatedArticle.id}>
                      <div className="flex group cursor-pointer">
                        <div className="flex-shrink-0 w-20 h-20 bg-mali-blue/20 rounded-lg overflow-hidden mr-4">
                          <img 
                            src={relatedArticle.image}
                            alt={relatedArticle.title}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                        <div>
                          <h4 className="text-white font-medium mb-1 line-clamp-2 group-hover:text-mali-blue-accent transition-colors">
                            {relatedArticle.title}
                          </h4>
                          <div className="flex items-center text-xs text-mali-text-secondary">
                            <Calendar size={12} className="mr-1" />
                            <span className="mr-2">{formatDate(relatedArticle.date)}</span>
                            <Eye size={12} className="mr-1" />
                            <span>{relatedArticle.views}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-mali-text-secondary text-center py-6">
                  No related articles found
                </p>
              )}
            </div>
          </motion.div>
          
          {/* Popular Tags */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden"
          >
            <div className="p-5 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-b border-mali-blue/30">
              <h3 className="text-lg font-bold text-white">Explore Tags</h3>
            </div>
            
            <div className="p-5">
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(newsArticlesDb.flatMap(a => a.tags)))
                  .map((tag: string, index: number) => (
                    <Link 
                      href={`/news?tag=${tag}`}
                      key={index}
                      className="bg-mali-blue/10 hover:bg-mali-blue/20 border border-mali-blue/30 text-mali-text-secondary hover:text-white text-xs px-3 py-1.5 rounded-full"
                    >
                      {tag}
                    </Link>
                  ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 