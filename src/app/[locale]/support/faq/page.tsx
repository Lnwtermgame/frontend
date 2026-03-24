"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "@/lib/framer-exports";
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
import { useTranslations, useLocale } from "next-intl";

export default function FaqPage() {
  const t = useTranslations("SupportFAQ");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const LOCAL_VOTE_KEY = "faqUserVotes";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  // Data states
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [articles, setArticles] = useState<FaqArticleListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalArticles, setTotalArticles] = useState(0);
  const [userVotes, setUserVotes] = useState<Record<string, boolean | null>>(
    {},
  );
  const hasInitializedSearch = useRef(false);
  const hasLoadedVotes = useRef(false);

  // Load categories on mount or locale change
  useEffect(() => {
    loadCategories();
  }, [locale]);

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

  // Load articles when category changes or locale changes
  useEffect(() => {
    loadArticles();
  }, [selectedCategory, locale]);

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
  }, [searchQuery, locale]);

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
    if (articles.length === 0 && !searchQuery) {
      setIsLoading(true);
    } else {
      setIsRefetching(true);
    }
    setError(null);
    try {
      const response = await supportApi.getFaqArticles(
        1,
        50,
        selectedCategory || undefined,
        undefined,
        undefined,
        locale,
      );
      if (response.success) {
        setArticles(response.data);
        setTotalArticles(response.meta?.total || 0);
      }
    } catch (err) {
      setError(supportApi.getErrorMessage(err));
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
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
        <span className="bg-[#2A2C30] p-1.5 border border-site-border text-white">
          ?
        </span>
      );
    }
    return <span className="text-2xl">{category.icon}</span>;
  };

  return (
    <div className="page-container bg-transparent">
      {/* Hero Section */}
      <div
        className="bg-[#1A1C20] border border-site-border rounded-[16px] p-8 mb-8"
        
      >
        <div className="max-w-3xl mx-auto text-center">
          <div>
            <div className="flex items-center justify-center mb-4">
              <div className="bg-yellow-500 p-3 border border-site-border rounded-[12px] mr-3">
                <HelpCircle className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white uppercase">
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
                  className="w-full py-3 px-5 pl-12 bg-[#1A1C20] border border-site-border text-white focus:outline-none focus:bg-[#2A2C30] transition-colors font-bold"
                />
                <Search
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                  size={18}
                />
                {isSearching && (
                  <Loader2
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white animate-spin"
                    size={18}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="bg-pink-500 border border-site-border rounded-[12px] p-4 mb-6 flex items-center shadow-md"
        >
          <AlertCircle className="text-white mr-3" size={20} />
          <span className="text-white font-black uppercase">{error}</span>
          <button
            onClick={loadArticles}
            className="ml-auto text-white hover:text-gray-700 flex items-center font-black uppercase text-xs"
          >
            <Clock size={16} className="mr-1" />
            Retry
          </button>
        </div>
      )}

      {/* Back Link */}
      <div className="mb-6">
        <Link
          href="/support"
          className="text-white hover:text-gray-700 transition-colors inline-flex items-center font-black uppercase text-xs"
        >
          <ArrowLeft size={18} className="mr-1" />
          {t("back_to_faq")}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar - Categories */}
        <div className="lg:col-span-1">
          <div
            className="bg-[#1A1C20] border border-site-border rounded-[16px] overflow-hidden shadow-md"
          >
            <div className="p-4 bg-[#2A2C30] border-b-[3px] border-black font-black uppercase text-xs">
              <h3 className="text-white flex items-center">
                <Filter size={16} className="mr-2" />
                {t("categories._base")}
              </h3>
            </div>
            <div className="p-2">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setExpandedArticle(null);
                }}
                className={`w-full text-left px-4 py-2 flex items-center uppercase text-xs font-black transition-colors ${selectedCategory === null
                  ? "bg-yellow-500 border border-site-border text-white"
                  : "text-gray-700 hover:bg-[#2A2C30]"
                  }`}
              >
                <span className="bg-[#2A2C30] border border-site-border p-1 text-white mr-3">
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
                  className={`w-full text-left px-4 py-2 flex items-center uppercase text-xs font-black transition-colors ${selectedCategory === category.id
                    ? "bg-yellow-500 border border-site-border text-white"
                    : "text-gray-700 hover:bg-[#2A2C30]"
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
            className="bg-[#1A1C20] border border-site-border rounded-[16px] p-5 mt-6 shadow-md"
          >
            <div className="flex items-center mb-4">
              <div className="bg-green-500 p-2 border border-site-border mr-2">
                <MessageSquare size={20} className="text-white" />
              </div>
              <h3 className="text-white font-black uppercase text-sm">
                {t("need_help.title")}
              </h3>
            </div>
            <p className="text-gray-600 text-xs font-bold mb-4 uppercase">
              {t("need_help.description")}
            </p>
            <Link
              href="/support/tickets"
              className="bg-black text-white border border-site-border rounded-[12px] w-full py-2 font-black flex items-center justify-center hover:bg-gray-800 transition-colors uppercase text-xs shadow-md"
            >
              {t("need_help.contact_support")}
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Loading */}
          {isLoading ? (
            <div
              className="bg-[#1A1C20] border border-site-border rounded-[16px] p-12 text-center shadow-md"
            >
              <Loader2
                className="animate-spin mx-auto text-white mb-4"
                size={48}
              />
              <p className="text-gray-600 font-bold uppercase">{tCommon("loading")}</p>
            </div>
          ) : articles.length > 0 ? (
            <div className={`space-y-4 transition-opacity duration-200 ${isRefetching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              {articles.map((article) => (
                <div
                  key={article.id}
                  className={`border border-site-border rounded-[12px] overflow-hidden shadow-md transition-colors duration-200 ${expandedArticle === article.id
                    ? "bg-[#2A2C30]"
                    : "bg-[#1A1C20]"
                    }`}
                >
                  <button
                    onClick={() =>
                      setExpandedArticle(
                        expandedArticle === article.id ? null : article.id,
                      )
                    }
                    className="w-full text-left p-5 font-black text-white focus:outline-none flex justify-between items-center uppercase text-sm"
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

                  <AnimatePresence>
                    {expandedArticle === article.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5">
                          <div className="border-t-[3px] border-black pt-4 text-gray-700">
                            <div className="prose prose-sm max-w-none text-white font-bold">
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
                              <div className="flex items-center gap-1 text-[10px] px-2 py-1 bg-[#1A1C20] border border-site-border font-black uppercase">
                                <Eye size={12} />
                                {article.viewCount}
                              </div>
                              <div className="flex items-center gap-1 text-[10px] px-2 py-1 bg-[#1A1C20] border border-site-border font-black uppercase">
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
                                  className={`text-[10px] font-black uppercase flex items-center px-3 py-1 border border-site-border shadow-md active:translate-y-[1px] transition-colors ${userVotes[article.id] === true
                                    ? "bg-green-500 text-white"
                                    : "bg-[#1A1C20] hover:bg-green-500"
                                    }`}
                                >
                                  <ThumbsUp size={12} className="mr-1" />
                                  {t("yes")}
                                </button>
                                <button
                                  onClick={() => handleVote(article.id, false)}
                                  className={`text-[10px] font-black uppercase flex items-center px-3 py-1 border border-site-border shadow-md active:translate-y-[1px] transition-colors ${userVotes[article.id] === false
                                    ? "bg-pink-500 text-white"
                                    : "bg-[#1A1C20] hover:bg-pink-500"
                                    }`}
                                >
                                  <ThumbsDown size={12} className="mr-1" />
                                  {t("no")}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="bg-[#1A1C20] border border-site-border rounded-[16px] p-8 text-center shadow-md"
            >
              <HelpCircle size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-black text-white mb-2 uppercase">
                {t("no_results", { query: searchQuery })}
              </h3>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                }}
                className="bg-black text-white border border-site-border rounded-[12px] px-6 py-2 font-black hover:bg-gray-800 transition-colors uppercase text-xs shadow-md"
              >
                {t("view_all")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
