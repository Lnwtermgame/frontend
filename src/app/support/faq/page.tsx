"use client";

import { useState, useEffect } from "react";
import { motion } from "@/lib/framer-exports";
import Link from "next/link";
import { supportApi, FaqCategory, FaqArticleListItem } from "@/lib/services";
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Tag,
  Filter,
  ArrowLeft,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Loader2,
  AlertCircle,
  Eye
} from "lucide-react";

export default function FaqPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  // Data states
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [articles, setArticles] = useState<FaqArticleListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalArticles, setTotalArticles] = useState(0);
  const [userVotes, setUserVotes] = useState<Record<string, boolean | null>>({});

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Load articles when category changes
  useEffect(() => {
    loadArticles();
  }, [selectedCategory]);

  // Search debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchQuery) {
        performSearch();
      } else {
        loadArticles();
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const loadCategories = async () => {
    try {
      const response = await supportApi.getFaqCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const loadArticles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await supportApi.getFaqArticles(
        1,
        50,
        selectedCategory || undefined,
        undefined,
        undefined
      );
      if (response.success) {
        setArticles(response.data);
        setTotalArticles(response.meta?.total || 0);
      }
    } catch (err) {
      setError(supportApi.getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await supportApi.searchFaqArticles(searchQuery, 50);
      if (response.success) {
        setArticles(response.data);
        setTotalArticles(response.data.length);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleVote = async (articleId: string, isHelpful: boolean) => {
    try {
      const response = await supportApi.markArticleHelpful(articleId, isHelpful);
      if (response.success) {
        setUserVotes((prev) => ({
          ...prev,
          [articleId]: response.data.userVote,
        }));
        // Refresh articles to show updated counts
        loadArticles();
      }
    } catch (err) {
      console.error("Failed to vote:", err);
    }
  };

  const getCategoryById = (id: string) => {
    return categories.find((c) => c.id === id);
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = getCategoryById(categoryId);
    if (!category?.icon) {
      return <span className="bg-mali-blue/20 p-1.5 rounded text-mali-blue-accent">?</span>;
    }
    return <span className="text-2xl">{category.icon}</span>;
  };

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
              <HelpCircle className="h-8 w-8 text-mali-blue-accent mr-3" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Frequently Asked Questions
              </h1>
            </div>
            <p className="text-gray-300 mb-6">
              Find answers to common questions about our services, orders, and account management.
            </p>

            {/* Search Box */}
            <div className="max-w-xl mx-auto mt-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for answers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-3 px-5 pl-12 bg-mali-blue/20 border border-mali-blue/30 rounded-xl text-white focus:outline-none focus:border-mali-blue-accent focus:ring-1 focus:ring-mali-blue-accent"
                />
                <Search
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-mali-text-secondary"
                  size={18}
                />
                {isSearching && (
                  <Loader2
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-mali-blue-accent animate-spin"
                    size={18}
                  />
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6 flex items-center"
        >
          <AlertCircle className="text-red-400 mr-3" size={20} />
          <span className="text-red-200">{error}</span>
          <button
            onClick={loadArticles}
            className="ml-auto text-red-400 hover:text-red-300 flex items-center"
          >
            <Clock size={16} className="mr-1" />
            Retry
          </button>
        </motion.div>
      )}

      {/* Back to Support Home */}
      <div className="mb-6">
        <Link
          href="/support"
          className="text-mali-text-secondary hover:text-white transition-colors inline-flex items-center"
        >
          <ArrowLeft size={18} className="mr-1" />
          Back to Support Center
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar - Categories */}
        <div className="lg:col-span-1">
          <div className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden">
            <div className="p-4 bg-mali-blue/10 border-b border-mali-blue/20">
              <h3 className="text-white font-medium flex items-center">
                <Filter size={16} className="mr-2" />
                Categories
              </h3>
            </div>
            <div className="p-2">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setExpandedArticle(null);
                }}
                className={`w-full text-left px-4 py-2 rounded-md flex items-center ${
                  selectedCategory === null
                    ? "bg-mali-blue/20 text-white font-medium"
                    : "text-mali-text-secondary hover:bg-mali-blue/10 hover:text-white"
                }`}
              >
                <span className="bg-gray-500/20 p-1.5 rounded text-gray-400 mr-3">
                  All
                </span>
                All Categories
                <span className="ml-auto text-xs text-mali-text-secondary">
                  {totalArticles}
                </span>
              </button>

              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setExpandedArticle(null);
                  }}
                  className={`w-full text-left px-4 py-2 rounded-md flex items-center ${
                    selectedCategory === category.id
                      ? "bg-mali-blue/20 text-white font-medium"
                      : "text-mali-text-secondary hover:bg-mali-blue/10 hover:text-white"
                  }`}
                >
                  <span className="mr-3 text-lg">{category.icon || "📄"}</span>
                  <span className="flex-1">{category.name}</span>
                  <span className="text-xs text-mali-text-secondary">
                    {category.articleCount}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Need more help */}
          <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-5 mt-6">
            <div className="flex items-center mb-4">
              <MessageSquare size={20} className="text-mali-blue-accent mr-2" />
              <h3 className="text-white font-medium">Need More Help?</h3>
            </div>
            <p className="text-mali-text-secondary text-sm mb-4">
              Can&apos;t find what you&apos;re looking for? Our support team is ready to help.
            </p>
            <Link
              href="/support/tickets"
              className="bg-mali-blue/20 hover:bg-mali-blue/30 text-mali-blue-accent w-full py-2 rounded-lg font-medium flex items-center justify-center"
            >
              Contact Support
            </Link>
          </div>
        </div>

        {/* Main Content - FAQ List */}
        <div className="lg:col-span-3">
          {/* Category Title */}
          {selectedCategory && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">
                {getCategoryById(selectedCategory)?.name || "FAQs"}
              </h2>
              <p className="text-mali-text-secondary mt-1">
                {getCategoryById(selectedCategory)?.description}
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-12 text-center">
              <Loader2
                className="animate-spin mx-auto text-mali-blue-accent mb-4"
                size={48}
              />
              <p className="text-mali-text-secondary">Loading FAQs...</p>
            </div>
          ) : articles.length > 0 ? (
            <div className="space-y-4">
              {articles.map((article) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`border border-mali-blue/20 rounded-xl overflow-hidden ${
                    expandedArticle === article.id
                      ? "bg-mali-blue/5"
                      : "bg-mali-card"
                  }`}
                >
                  <button
                    onClick={() =>
                      setExpandedArticle(
                        expandedArticle === article.id ? null : article.id
                      )
                    }
                    className="w-full text-left p-5 font-medium text-white focus:outline-none flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3">
                      {article.isPinned && (
                        <span className="text-amber-400" title="Pinned">
                          📌
                        </span>
                      )}
                      <span>{article.title}</span>
                    </div>
                    {expandedArticle === article.id ? (
                      <ChevronUp
                        size={20}
                        className="text-mali-text-secondary flex-shrink-0"
                      />
                    ) : (
                      <ChevronDown
                        size={20}
                        className="text-mali-text-secondary flex-shrink-0"
                      />
                    )}
                  </button>

                  {expandedArticle === article.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.3 }}
                      className="px-5 pb-5"
                    >
                      <div className="border-t border-mali-blue/20 pt-4 text-mali-text-secondary">
                        <p className="whitespace-pre-line">
                          {article.excerpt || "Click to read the full article..."}
                        </p>

                        <Link
                          href={`/support/faq/${article.slug}`}
                          className="inline-flex items-center text-mali-blue-accent hover:underline mt-3"
                        >
                          Read full article
                          <ArrowLeft size={16} className="ml-1 rotate-180" />
                        </Link>

                        <div className="flex flex-wrap gap-2 mt-4">
                          <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-mali-blue/10 text-mali-text-secondary">
                            <Eye size={12} />
                            {article.viewCount} views
                          </div>
                          <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-mali-blue/10 text-mali-text-secondary">
                            <Tag size={12} />
                            {article.categoryName}
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-mali-blue/10">
                          <span className="text-xs text-mali-text-secondary flex items-center">
                            <Clock size={12} className="mr-1" />
                            {new Date(article.createdAt).toLocaleDateString()}
                          </span>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleVote(article.id, true)}
                              className={`text-xs flex items-center px-2 py-1 rounded-full transition-colors ${
                                userVotes[article.id] === true
                                  ? "bg-green-500/20 text-green-400"
                                  : "text-mali-text-secondary hover:text-green-400"
                              }`}
                            >
                              <ThumbsUp size={12} className="mr-1" />
                              Helpful
                            </button>
                            <button
                              onClick={() => handleVote(article.id, false)}
                              className={`text-xs flex items-center px-2 py-1 rounded-full transition-colors ${
                                userVotes[article.id] === false
                                  ? "bg-red-500/20 text-red-400"
                                  : "text-mali-text-secondary hover:text-red-400"
                              }`}
                            >
                              <ThumbsDown size={12} className="mr-1" />
                              Not helpful
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-8 text-center">
              <HelpCircle
                size={48}
                className="mx-auto text-mali-text-secondary/50 mb-4"
              />
              <h3 className="text-xl font-bold text-white mb-2">
                No Matching Questions
              </h3>
              <p className="text-mali-text-secondary mb-6">
                We couldn&apos;t find any FAQs matching your search. Try adjusting your
                search terms or browse by category.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                }}
                className="bg-mali-blue hover:bg-mali-blue/90 text-white px-6 py-2 rounded-lg font-medium"
              >
                View All FAQs
              </button>
            </div>
          )}

          {/* Contact Support CTA */}
          {(articles.length > 0 || !isLoading) && (
            <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-mali-blue/30 rounded-xl p-6 mt-8">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    Still need help?
                  </h3>
                  <p className="text-mali-text-secondary">
                    If you couldn&apos;t find the answer you were looking for, our
                    support team is here to help.
                  </p>
                </div>
                <Link
                  href="/support/tickets"
                  className="mt-4 md:mt-0 bg-mali-blue hover:bg-mali-blue/90 text-white px-6 py-3 rounded-lg font-medium whitespace-nowrap"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
