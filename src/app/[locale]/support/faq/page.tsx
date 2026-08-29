"use client";

import { useState, useEffect, useRef } from "react";
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
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

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
        <span className="bg-site-raised p-1.5 border border-site-border-soft text-site-text rounded-4">
          ?
        </span>
      );
    }
    return <span className="text-2xl">{category.icon}</span>;
  };

  return (
    <div className="page-container">
      {/* Hero Section */}
      <div className="site-card p-8 mb-8">
        <div className="max-w-3xl mx-auto text-center">
          <div>
            <div className="flex items-center justify-center mb-4">
              <div className="bg-status-warning/15 p-3 border border-status-warning/20 rounded-8 mr-3">
                <HelpCircle className="h-8 w-8 text-status-warning" />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-site-text">
                {t("title")}
              </h1>
            </div>
            <p className="text-site-muted text-sm font-medium">
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
                  className="w-full py-3 px-5 pl-12 site-input"
                />
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-site-dim"
                  size={18}
                />
                {isSearching && (
                  <Loader2
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-site-accent animate-spin"
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
        <div className="bg-status-danger/10 border border-status-danger/20 rounded-8 p-4 mb-6 flex items-center">
          <AlertCircle className="text-status-danger mr-3" size={20} />
          <span className="text-site-text font-semibold">{error}</span>
          <button
            onClick={loadArticles}
            className="ml-auto text-site-accent hover:text-site-accent-hover flex items-center font-semibold text-xs"
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
          className="text-site-muted hover:text-site-accent transition-colors inline-flex items-center text-xs font-semibold"
        >
          <ArrowLeft size={18} className="mr-1" />
          {t("back_to_faq")}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar - Categories */}
        <div className="lg:col-span-1">
          <div className="site-card overflow-hidden">
            <div className="p-4 bg-site-raised border-b border-site-border-soft">
              <h3 className="text-[11px] uppercase font-bold tracking-wider text-site-dim flex items-center">
                <Filter size={14} className="mr-2" />
                {t("categories._base")}
              </h3>
            </div>
            <div className="p-2">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setExpandedArticle(null);
                }}
                className={`w-full text-left px-4 py-2 flex items-center text-xs font-semibold rounded-6 transition-colors ${selectedCategory === null
                  ? "bg-site-accent/10 text-site-accent border border-site-accent/20"
                  : "text-site-muted hover:bg-site-raised"
                  }`}
              >
                <span className="bg-site-raised border border-site-border-soft p-1 text-site-text mr-3 rounded-4 text-[10px]">
                  All
                </span>
                {t("all")}
                <span className="ml-auto text-[10px] text-site-dim">
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
                  className={`w-full text-left px-4 py-2 flex items-center text-xs font-semibold rounded-6 transition-colors ${selectedCategory === category.id
                    ? "bg-site-accent/10 text-site-accent border border-site-accent/20"
                    : "text-site-muted hover:bg-site-raised"
                    }`}
                >
                  <span className="mr-3 text-lg">{category.icon || "📄"}</span>
                  <span className="flex-1">{category.name}</span>
                  <span className="text-[10px] text-site-dim">
                    {category.articleCount}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Need help CTA */}
          <div className="site-card p-5 mt-6">
            <div className="flex items-center mb-4">
              <div className="bg-status-success/15 p-2 border border-status-success/20 rounded-6 mr-2">
                <MessageSquare size={20} className="text-status-success" />
              </div>
              <h3 className="text-site-text font-bold text-sm">
                {t("need_help.title")}
              </h3>
            </div>
            <p className="text-site-muted text-xs font-medium mb-4">
              {t("need_help.description")}
            </p>
            <Link
              href="/support/tickets"
              className="bg-site-surface text-site-text border border-site-border-soft rounded-6 w-full py-2 font-bold flex items-center justify-center hover:bg-site-raised transition-colors text-xs"
            >
              {t("need_help.contact_support")}
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Loading */}
          {isLoading ? (
            <div className="site-card p-12 text-center">
              <div className="space-y-3 max-w-sm mx-auto">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
              <p className="text-site-muted mt-4 text-sm">{tCommon("loading")}</p>
            </div>
          ) : articles.length > 0 ? (
            <div className={`space-y-3 transition-opacity duration-200 ${isRefetching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              {articles.map((article) => (
                <div
                  key={article.id}
                  className={`site-card overflow-hidden transition-colors duration-200 ${expandedArticle === article.id
                    ? "border-site-accent/30"
                    : ""
                    }`}
                >
                  <button
                    onClick={() =>
                      setExpandedArticle(
                        expandedArticle === article.id ? null : article.id,
                      )
                    }
                    aria-expanded={expandedArticle === article.id}
                    className="w-full text-left p-5 font-bold text-site-text focus:outline-none flex justify-between items-center text-sm"
                  >
                    <div className="flex items-center gap-3">
                      {article.isPinned && (
                        <span>📌</span>
                      )}
                      <span>{article.title}</span>
                    </div>
                    {expandedArticle === article.id ? (
                      <ChevronUp size={20} className="text-site-muted flex-shrink-0" />
                    ) : (
                      <ChevronDown size={20} className="text-site-muted flex-shrink-0" />
                    )}
                  </button>

                  {expandedArticle === article.id && (
                    <div className="overflow-hidden">
                      <div className="px-5 pb-5">
                        <div className="border-t border-site-border-soft pt-4 text-site-muted">
                          <div className="prose prose-sm max-w-none text-site-text">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h2: (props) => <h2 className="text-lg font-bold mt-4 mb-2 text-site-text" {...props} />,
                                p: (props) => <p className="mb-3 leading-relaxed" {...props} />,
                                ul: (props) => <ul className="list-disc pl-6 mb-3" {...props} />,
                                li: (props) => <li className="mb-1" {...props} />,
                              }}
                            >
                              {article.content || article.excerpt}
                            </ReactMarkdown>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-4">
                            <div className="flex items-center gap-1 text-[10px] px-2 py-1 bg-site-surface border border-site-border-soft font-semibold rounded-4 text-site-muted">
                              <Eye size={12} />
                              {article.viewCount}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] px-2 py-1 bg-site-surface border border-site-border-soft font-semibold rounded-4 text-site-muted">
                              <Tag size={12} />
                              {article.categoryName}
                            </div>
                          </div>

                          <div className="flex justify-between items-center mt-4 pt-3 border-t border-site-border-soft">
                            <span className="text-[11px] font-semibold text-site-dim">
                              <Clock size={12} className="inline mr-1" />
                              {new Date(article.createdAt).toLocaleDateString()}
                            </span>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleVote(article.id, true)}
                                className={`text-[10px] font-bold flex items-center px-3 py-1 border border-site-border-soft rounded-4 transition-colors ${userVotes[article.id] === true
                                  ? "bg-status-success/15 text-status-success border-status-success/30"
                                  : "bg-site-surface text-site-muted hover:bg-status-success/10 hover:text-status-success"
                                  }`}
                              >
                                <ThumbsUp size={12} className="mr-1" />
                                {t("yes")}
                              </button>
                              <button
                                onClick={() => handleVote(article.id, false)}
                                className={`text-[10px] font-bold flex items-center px-3 py-1 border border-site-border-soft rounded-4 transition-colors ${userVotes[article.id] === false
                                  ? "bg-status-danger/15 text-status-danger border-status-danger/30"
                                  : "bg-site-surface text-site-muted hover:bg-status-danger/10 hover:text-status-danger"
                                  }`}
                              >
                                <ThumbsDown size={12} className="mr-1" />
                                {t("no")}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="site-card p-8 text-center">
              <EmptyState
                icon={HelpCircle}
                message={t("no_results", { query: searchQuery })}
              />
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                }}
                className="mt-4 bg-site-surface text-site-text border border-site-border-soft rounded-6 px-6 py-2 font-bold hover:bg-site-raised transition-colors text-xs"
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
