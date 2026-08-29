"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supportApi, FaqArticle } from "@/lib/services";
import {
  ArrowLeft,
  Clock,
  Eye,
  Tag,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

export default function FaqArticlePage() {
  const t = useTranslations("SupportFAQDetail");
  const tNav = useTranslations("Navigation");
  const params = useParams();
  const slug = params.slug as string;

  const [article, setArticle] = useState<FaqArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userVote, setUserVote] = useState<boolean | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const thankYouTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (thankYouTimerRef.current) clearTimeout(thankYouTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (slug) {
      loadArticle();
    }
  }, [slug]);

  const loadArticle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await supportApi.getFaqArticleBySlug(slug);
      if (response.success) {
        setArticle(response.data);
      }
    } catch (err) {
      setError(supportApi.getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (isHelpful: boolean) => {
    if (!article) return;
    try {
      const response = await supportApi.markArticleHelpful(
        article.id,
        isHelpful,
      );
      if (response.success) {
        setUserVote(response.data.userVote);
        setShowThankYou(true);
        thankYouTimerRef.current = setTimeout(() => setShowThankYou(false), 3000);
        // Update article with new counts
        setArticle((prev) =>
          prev
            ? {
              ...prev,
              helpfulCount: response.data.helpfulCount,
              unhelpfulCount: response.data.unhelpfulCount,
            }
            : null,
        );
      }
    } catch (err) {
      console.error("Failed to vote:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-site-accent" />
            <p className="text-site-muted">{t("loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="page-container">
        <div className="max-w-4xl mx-auto text-center py-16">
          <EmptyState
            icon={AlertCircle}
            message={t("error._base")}
            description={error || undefined}
          />
          <Link
            href="/support/faq"
            className="inline-flex items-center mt-6 site-btn"
          >
            <ArrowLeft size={18} className="mr-2" />
            {t("back_to_faq")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center text-sm text-site-muted">
            <Link
              href="/support"
              className="hover:text-site-text transition-colors font-medium"
            >
              {tNav("support")}
            </Link>
            <span className="mx-2">/</span>
            <Link
              href="/support/faq"
              className="hover:text-site-text transition-colors font-medium"
            >
              {tNav("faq")}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-site-text font-medium">{article.title}</span>
          </div>
        </div>

        {/* Article Card */}
        <div className="site-card p-6 md:p-10">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Link
                href={`/support/faq?category=${article.categoryId}`}
                className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-4 bg-site-accent/10 text-site-accent hover:underline"
              >
                <Tag size={14} className="mr-1" />
                {article.category.name}
              </Link>
              {article.isPinned && (
                <Badge variant="warning">📌 Pinned</Badge>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-site-text mb-4">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-[11px] text-site-dim">
              <div className="flex items-center">
                <Clock size={14} className="mr-1.5" />
                {t("last_updated")}: {new Date(article.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <Eye size={14} className="mr-1.5" />
                {article.viewCount} {t("views")}
              </div>
            </div>
          </div>

          {/* Content */}
          <article
            className="prose prose-lg max-w-none
              prose-headings:text-site-text prose-headings:font-bold
              prose-p:text-site-muted
              prose-a:text-site-accent prose-a:no-underline hover:prose-a:underline
              prose-strong:text-site-text
              prose-ul:text-site-muted prose-ol:text-site-muted
              prose-li:marker:text-site-accent
              prose-blockquote:border-l-4 prose-blockquote:border-site-accent prose-blockquote:bg-site-raised prose-blockquote:py-2 prose-blockquote:px-4
              prose-table:border-site-border
              prose-th:bg-site-raised prose-th:border-site-border prose-th:p-3
              prose-td:border-site-border prose-td:p-3"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => (
                  <h2 className="text-xl font-bold text-site-text mt-8 mb-3">
                    {children}
                  </h2>
                ),
                p: ({ children }) => (
                  <p className="mb-4 leading-relaxed whitespace-pre-wrap">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-6 mb-4 space-y-1">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="mb-1">{children}</li>,
                strong: ({ children }) => (
                  <strong className="font-bold text-site-text">{children}</strong>
                ),
                em: ({ children }) => <em className="italic">{children}</em>,
                a: ({ children, href }) => (
                  <a
                    href={href}
                    className="text-site-accent hover:underline"
                    target={href?.startsWith("http") ? "_blank" : undefined}
                    rel={
                      href?.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {article.content}
            </ReactMarkdown>
          </article>

          {/* Feedback Section */}
          <div className="mt-10 pt-6 border-t border-site-border-soft">
            <h3 className="text-lg font-medium text-site-text mb-4">
              {t("helpful")}
            </h3>

            {showThankYou ? (
              <div className="bg-status-success/10 border border-status-success/20 rounded-8 p-4 flex items-center">
                <CheckCircle className="text-status-success mr-3" size={20} />
                <span className="text-status-success font-medium">
                  {t("thank_you")}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleVote(true)}
                  className={`flex items-center px-4 py-2 border border-site-border-soft rounded-6 transition-colors ${userVote === true
                    ? "bg-status-success/15 border-status-success/30 text-status-success"
                    : "bg-site-surface text-site-text hover:bg-status-success/10 hover:text-status-success"
                    }`}
                >
                  <ThumbsUp size={16} className="mr-2" />
                  {t("yes")} ({article.helpfulCount})
                </button>
                <button
                  onClick={() => handleVote(false)}
                  className={`flex items-center px-4 py-2 border border-site-border-soft rounded-6 transition-colors ${userVote === false
                    ? "bg-status-danger/15 border-status-danger/30 text-status-danger"
                    : "bg-site-surface text-site-text hover:bg-status-danger/10 hover:text-status-danger"
                    }`}
                >
                  <ThumbsDown size={16} className="mr-2" />
                  {t("no")} ({article.unhelpfulCount})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="site-card p-6 md:p-8 mt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-site-text font-medium mb-1">
                {t("still_need_help")}
              </h4>
              <p className="text-site-muted text-sm">
                {t("contact_support_desc")}
              </p>
            </div>
            <Link
              href="/support/tickets"
              className="bg-site-surface text-site-text border border-site-border-soft rounded-6 px-6 py-3 font-medium flex items-center hover:bg-site-raised transition-colors"
            >
              <MessageSquare size={18} className="mr-2" />
              {t("contact_support")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
