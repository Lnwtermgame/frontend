"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useParams } from "next/navigation";
import { motion } from "@/lib/framer-exports";
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
      <div className="page-container bg-transparent">
        <div
          className="bg-[#1A1C20] border border-site-border rounded-[16px] p-12 text-center"
          
        >
          <Loader2 className="animate-spin mx-auto text-white mb-4" size={48} />
          <p className="text-gray-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="page-container bg-transparent">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-pink-500 border border-site-border rounded-[12px] p-6 text-center"
          
        >
          <AlertCircle className="mx-auto text-white mb-3" size={48} />
          <h2 className="text-xl font-bold text-white mb-2">{t("error._base")}</h2>
          <p className="text-gray-800 mb-4">
            {error || t("error._base")}
          </p>
          <Link
            href="/support/faq"
            className="inline-flex items-center bg-black text-white border border-site-border rounded-[12px] px-6 py-2 font-medium hover:bg-gray-800 transition-colors"
            
          >
            <ArrowLeft size={18} className="mr-2" />
            {t("back_to_faq")}
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page-container bg-transparent">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-gray-600">
          <Link
            href="/support"
            className="hover:text-white transition-colors font-medium"
          >
            {tNav("support")}
          </Link>
          <span className="mx-2">/</span>
          <Link
            href="/support/faq"
            className="hover:text-white transition-colors font-medium"
          >
            {tNav("faq")}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white font-medium">{article.title}</span>
        </div>
      </div>

      {/* Article */}
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-[#1A1C20] border border-site-border rounded-[16px] overflow-hidden"
        
      >
        {/* Header */}
        <div className="p-6 md:p-8 border-b-[3px] border-black">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <Link
              href={`/support/faq?category=${article.categoryId}`}
              className="flex items-center text-site-accent hover:underline font-medium"
            >
              <Tag size={14} className="mr-1" />
              {article.category.name}
            </Link>
            {article.isPinned && (
              <span className="text-white ml-2" title="Pinned">
                📌
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
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
        <div className="p-6 md:p-8">
          <div className="prose max-w-none text-gray-800">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: (props) => (
                  <h2
                    className="text-xl font-bold text-white mt-4 mb-2"
                    {...props}
                  />
                ),
                p: (props) => (
                  <p
                    className="mb-3 leading-relaxed whitespace-pre-wrap"
                    {...props}
                  />
                ),
                ul: (props) => (
                  <ul className="list-disc pl-6 mb-3" {...props} />
                ),
                ol: (props) => (
                  <ol className="list-decimal pl-6 mb-3" {...props} />
                ),
                li: (props) => <li className="mb-1" {...props} />,
                strong: (props) => (
                  <strong className="font-semibold" {...props} />
                ),
                em: (props) => <em className="italic" {...props} />,
                a: (props) => (
                  <a className="text-site-accent underline" {...props} />
                ),
              }}
            >
              {article.content}
            </ReactMarkdown>
          </div>

          {/* Feedback Section */}
          <div className="mt-10 pt-6 border-t-[3px] border-black">
            <h3 className="text-lg font-medium text-white mb-4">
              {t("helpful")}
            </h3>

            {showThankYou ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-500 border border-site-border rounded-[12px] p-4 flex items-center"
                
              >
                <CheckCircle className="text-white mr-3" size={20} />
                <span className="text-white font-medium">
                  {t("thank_you")}
                </span>
              </motion.div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleVote(true)}
                  className={`flex items-center px-4 py-2 border-[3px] transition-colors ${userVote === true
                    ? "bg-green-500 border-black text-white"
                    : "bg-[#1A1C20] border-black text-white hover:bg-green-500"
                    }`}
                  
                >
                  <ThumbsUp size={16} className="mr-2" />
                  {t("yes")} ({article.helpfulCount})
                </button>
                <button
                  onClick={() => handleVote(false)}
                  className={`flex items-center px-4 py-2 border-[3px] transition-colors ${userVote === false
                    ? "bg-pink-500 border-black text-white"
                    : "bg-[#1A1C20] border-black text-white hover:bg-pink-500"
                    }`}
                  
                >
                  <ThumbsDown size={16} className="mr-2" />
                  {t("no")} ({article.unhelpfulCount})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 md:p-8 bg-[#2A2C30] border-t-[3px] border-black">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-white font-medium mb-1">
                {t("still_need_help")}
              </h4>
              <p className="text-gray-600 text-sm">
                {t("contact_support_desc")}
              </p>
            </div>
            <Link
              href="/support/tickets"
              className="bg-black text-white border border-site-border rounded-[12px] px-6 py-3 font-medium flex items-center hover:bg-gray-800 transition-colors"
              
            >
              <MessageSquare size={18} className="mr-2" />
              {t("contact_support")}
            </Link>
          </div>
        </div>
      </motion.article>
    </div>
  );
}
