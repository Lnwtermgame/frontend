"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "@/lib/framer-exports";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  Eye,
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function FaqPage() {
  const t = useTranslations("SupportFAQ");
  const tCommon = useTranslations("Common");
  const LOCAL_VOTE_KEY = "faqUserVotes";
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
  const [userVotes, setUserVotes] = useState<Record<string, boolean | null>>(
    {},
  );
  const hasInitializedSearch = useRef(false);
  const hasLoadedVotes = useRef(false);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Rehydrate stored votes (session persistence)
  useEffect(() => {
    if (hasLoadedVotes.current) return;
    hasLoadedVotes.current = true;
    try {
      const stored = localStorage.getItem(LOCAL_VOTE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, boolean | null>;
        setUserVotes(parsed);
      }
    } catch (err) {
      console.warn("Failed to load stored FAQ votes", err);
    }
  }, []);

  // Load articles when category changes
  useEffect(() => {
    loadArticles();
  }, [selectedCategory]);

  // Search debounce
  useEffect(() => {
    if (!hasInitializedSearch.current) {
      hasInitializedSearch.current = true;
      return;
    }
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
        undefined,
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
      const response = await supportApi.markArticleHelpful(
        articleId,
        isHelpful,
      );
      if (response.success) {
        setUserVotes((prev) => ({
          ...prev,
          [articleId]: response.data.userVote,
        }));
        try {
          const current = localStorage.getItem(LOCAL_VOTE_KEY);
          const parsed = current
            ? (JSON.parse(current) as Record<string, boolean | null>)
            : {};
          parsed[articleId] = response.data.userVote;
          localStorage.setItem(LOCAL_VOTE_KEY, JSON.stringify(parsed));
        } catch (err) {
          console.warn("Failed to persist FAQ vote", err);
        }
        setArticles((prev) =>
          prev.map((article) =>
            article.id === articleId
              ? {
                  ...article,
                  helpfulCount:
                    response.data.helpfulCount ?? article.helpfulCount,
                  unhelpfulCount:
                    response.data.unhelpfulCount ?? article.unhelpfulCount,
                }
              : article,
          ),
        );
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
      return (
        <span className="bg-brutal-gray p-1.5 border-[2px] border-black text-black">
          ?
        </span>
      );
    }
    return <span className="text-2xl">{category.icon}</span>;
  };

  return (
    <div className="page-container bg-brutal-gray">
      {/* Hero Section */}
      <motion.div
        className="bg-white border-[3px] border-black p-8 mb-8"
        style={{ boxShadow: "4px 4px 0 0 #000000" }}
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
              <div className="bg-brutal-yellow p-3 border-[3px] border-black mr-3">
                <HelpCircle className="h-8 w-8 text-black" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-black uppercase">
                {t("title")}
              </h1>
            </div>
            <p className="text-gray-600 font-bold uppercase">
              {t("subtitle")}
            </p>

            {/* Search Box */}
            <div className="max-w-xl mx-auto mt-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t("search_placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-3 px-5 pl-12 bg-white border-[2px] border-black text-black focus:outline-none focus:bg-brutal-gray transition-colors font-bold"
                />
                <Search
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                  size={18}
                />
                {isSearching && (
                  <Loader2
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-black animate-spin"
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
          className="bg-brutal-pink border-[3px] border-black p-4 mb-6 flex items-center shadow-[4px_4px_0_0_#000]"
        >
          <AlertCircle className="text-black mr-3" size={20} />
          <span className="text-black font-black uppercase">{error}</span>
          <button
            onClick={loadArticles}
            className="ml-auto text-black hover:text-gray-700 flex items-center font-black uppercase text-xs"
          >
            <Clock size={16} className="mr-1" />
            Retry
          </button>
        </motion.div>
      )}

      {/* Back Link */}
      <div className="mb-6">
        <Link
          href="/support"
          className="text-black hover:text-gray-700 transition-colors inline-flex items-center font-black uppercase text-xs"
        >
          <ArrowLeft size={18} className="mr-1" />
          {t("back_to_faq")}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar - Categories */}
        <div className="lg:col-span-1">
          <div
            className="bg-white border-[3px] border-black overflow-hidden shadow-[4px_4px_0_0_#000]"
          >
            <div className="p-4 bg-brutal-gray border-b-[3px] border-black font-black uppercase text-xs">
              <h3 className="text-black flex items-center">
                <Filter size={16} className="mr-2" />
                {t("categories")}
              </h3>
            </div>
            <div className="p-2">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setExpandedArticle(null);
                }}
                className={`w-full text-left px-4 py-2 flex items-center uppercase text-xs font-black transition-colors ${
                  selectedCategory === null
                    ? "bg-brutal-yellow border-[2px] border-black text-black"
                    : "text-gray-700 hover:bg-brutal-gray"
                }`}
              >
                <span className="bg-brutal-gray border-[2px] border-black p-1 text-black mr-3">
                  All
                </span>
                {t("all")}
                <span className="ml-auto text-[10px] text-gray-600">
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
                  className={`w-full text-left px-4 py-2 flex items-center uppercase text-xs font-black transition-colors ${
                    selectedCategory === category.id
                      ? "bg-brutal-yellow border-[2px] border-black text-black"
                      : "text-gray-700 hover:bg-brutal-gray"
                  }`}
                >
                  <span className="mr-3 text-lg">{category.icon || "📄"}</span>
                  <span className="flex-1">{category.name}</span>
                  <span className="text-[10px] text-gray-600">
                    {category.articleCount}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Need help CTA */}
          <div
            className="bg-white border-[3px] border-black p-5 mt-6 shadow-[4px_4px_0_0_#000]"
          >
            <div className="flex items-center mb-4">
              <div className="bg-brutal-green p-2 border-[2px] border-black mr-2">
                <MessageSquare size={20} className="text-black" />
              </div>
              <h3 className="text-black font-black uppercase text-sm">
                Need Help?
              </h3>
            </div>
            <p className="text-gray-600 text-xs font-bold mb-4 uppercase">
              Can't find what you're looking for?
            </p>
            <Link
              href="/support/tickets"
              className="bg-black text-white border-[3px] border-black w-full py-2 font-black flex items-center justify-center hover:bg-gray-800 transition-colors uppercase text-xs shadow-[3px_3px_0_0_#000]"
            >
              Contact Support
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Loading */}
          {isLoading ? (
            <div
              className="bg-white border-[3px] border-black p-12 text-center shadow-[4px_4px_0_0_#000]"
            >
              <Loader2
                className="animate-spin mx-auto text-black mb-4"
                size={48}
              />
              <p className="text-gray-600 font-bold uppercase">{tCommon("loading")}</p>
            </div>
          ) : articles.length > 0 ? (
            <div className="space-y-4">
              {articles.map((article) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`border-[3px] border-black overflow-hidden shadow-[4px_4px_0_0_#000] ${
                    expandedArticle === article.id
                      ? "bg-brutal-gray"
                      : "bg-white"
                  }`}
                >
                  <button
                    onClick={() =>
                      setExpandedArticle(
                        expandedArticle === article.id ? null : article.id,
                      )
                    }
                    className="w-full text-left p-5 font-black text-black focus:outline-none flex justify-between items-center uppercase text-sm"
                  >
                    <div className="flex items-center gap-3">
                      {article.isPinned && (
                        <span>📌</span>
                      )}
                      <span>{article.title}</span>
                    </div>
                    {expandedArticle === article.id ? (
                      <ChevronUp size={20} className="text-gray-600 flex-shrink-0" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-600 flex-shrink-0" />
                    )}
                  </button>

                  {expandedArticle === article.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.3 }}
                      className="px-5 pb-5"
                    >
                      <div className="border-t-[3px] border-black pt-4 text-gray-700">
                        <div className="prose prose-sm max-w-none text-black font-bold">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h2: (props) => <h2 className="text-lg font-black mt-4 mb-2 uppercase" {...props} />,
                              p: (props) => <p className="mb-3 leading-relaxed uppercase" {...props} />,
                              ul: (props) => <ul className="list-disc pl-6 mb-3" {...props} />,
                              li: (props) => <li className="mb-1" {...props} />,
                            }}
                          >
                            {article.content || article.excerpt}
                          </ReactMarkdown>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4">
                          <div className="flex items-center gap-1 text-[10px] px-2 py-1 bg-white border-[2px] border-black font-black uppercase">
                            <Eye size={12} />
                            {article.viewCount}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] px-2 py-1 bg-white border-[2px] border-black font-black uppercase">
                            <Tag size={12} />
                            {article.categoryName}
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-4 pt-3 border-t-[3px] border-black">
                          <span className="text-[10px] font-black text-gray-600 uppercase">
                            <Clock size={12} className="inline mr-1" />
                            {new Date(article.createdAt).toLocaleDateString()}
                          </span>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleVote(article.id, true)}
                              className={`text-[10px] font-black uppercase flex items-center px-3 py-1 border-[2px] border-black shadow-[2px_2px_0_0_#000] active:translate-y-[1px] transition-colors ${
                                userVotes[article.id] === true
                                  ? "bg-brutal-green text-black"
                                  : "bg-white hover:bg-brutal-green"
                              }`}
                            >
                              <ThumbsUp size={12} className="mr-1" />
                              {t("yes")}
                            </button>
                            <button
                              onClick={() => handleVote(article.id, false)}
                              className={`text-[10px] font-black uppercase flex items-center px-3 py-1 border-[2px] border-black shadow-[2px_2px_0_0_#000] active:translate-y-[1px] transition-colors ${
                                userVotes[article.id] === false
                                  ? "bg-brutal-pink text-black"
                                  : "bg-white hover:bg-brutal-pink"
                              }`}
                            >
                              <ThumbsDown size={12} className="mr-1" />
                              {t("no")}
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
            <div
              className="bg-white border-[3px] border-black p-8 text-center shadow-[4px_4px_0_0_#000]"
            >
              <HelpCircle size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-black text-black mb-2 uppercase">
                {t("no_results", { query: searchQuery })}
              </h3>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                }}
                className="bg-black text-white border-[3px] border-black px-6 py-2 font-black hover:bg-gray-800 transition-colors uppercase text-xs shadow-[3px_3px_0_0_#000]"
              >
                View All
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
