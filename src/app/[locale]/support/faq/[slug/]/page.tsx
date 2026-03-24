"use client";

import { useState, useEffect } from "react";
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

export default function FaqArticlePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [article, setArticle] = useState<FaqArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userVote, setUserVote] = useState<boolean | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);

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
        setTimeout(() => setShowThankYou(false), 3000);
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
        <div
          className="bg-[#212328] border border-site-border/30 rounded-[16px] p-12 text-center"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
        >
          <Loader2
            className="animate-spin mx-auto text-site-accent mb-4"
            size={48}
          />
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="page-container">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border-[3px] border-red-500/30 p-6 text-center"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
        >
          <AlertCircle className="mx-auto text-red-600 mb-3" size={48} />
          <h2 className="text-xl font-bold text-white mb-2">
            Article Not Found
          </h2>
          <p className="text-red-600 mb-4">
            {error || "The article you're looking for doesn't exist."}
          </p>
          <Link
            href="/support/faq"
            className="inline-flex items-center bg-site-accent hover:bg-site-accent/90 text-white px-6 py-2 font-bold border border-site-border/30 rounded-[12px] transition-all hover:-translate-y-0.5"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to FAQ
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-gray-600">
          <Link href="/support" className="hover:text-white transition-colors">
            Support
          </Link>
          <span className="mx-2">/</span>
          <Link
            href="/support/faq"
            className="hover:text-white transition-colors"
          >
            FAQ
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
        className="bg-[#212328] border border-site-border/30 rounded-[16px] overflow-hidden"
        style={{ boxShadow: "4px 4px 0 0 #000000" }}
      >
        {/* Header */}
        <div className="p-6 md:p-8 border-b-[3px] border-black bg-[#1A1C1E]">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <Link
              href={`/support/faq?category=${article.categoryId}`}
              className="flex items-center text-site-accent hover:underline font-medium"
            >
              <Tag size={14} className="mr-1" />
              {article.category.name}
            </Link>
            {article.isPinned && (
              <span
                className="bg-yellow-500 px-2 py-0.5 border-[2px] border-black text-xs font-bold ml-2"
                title="Pinned"
              >
                📌 Pinned
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Clock size={14} className="mr-1.5" />
              {new Date(article.createdAt).toLocaleDateString()}
            </div>
            <div className="flex items-center">
              <Eye size={14} className="mr-1.5" />
              {article.viewCount} views
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          <div className="prose max-w-none">
            <div className="text-gray-700 leading-relaxed whitespace-pre-line">
              {article.content}
            </div>
          </div>

          {/* Feedback Section */}
          <div className="mt-10 pt-6 border-t-[2px] border-gray-200">
            <h3 className="text-lg font-bold text-white mb-4">
              Was this article helpful?
            </h3>

            {showThankYou ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-500/10 border-[3px] border-green-500/30 p-4 flex items-center"
                style={{ boxShadow: "3px 3px 0 0 #000000" }}
              >
                <CheckCircle className="text-green-600 mr-3" size={20} />
                <span className="text-green-400 font-medium">
                  Thank you for your feedback!
                </span>
              </motion.div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleVote(true)}
                  className={`flex items-center px-4 py-2 border border-site-border/30 rounded-[12px] font-bold transition-all hover:-translate-y-0.5 ${
                    userVote === true
                      ? "bg-green-500/10 border-green-600 text-green-400"
                      : "bg-[#212328] text-gray-700 hover:bg-[#181A1D]"
                  }`}
                  style={{
                    boxShadow:
                      userVote === true
                        ? "3px 3px 0 0 #16a34a"
                        : "3px 3px 0 0 #000000",
                  }}
                >
                  <ThumbsUp size={16} className="mr-2" />
                  Yes ({article.helpfulCount})
                </button>
                <button
                  onClick={() => handleVote(false)}
                  className={`flex items-center px-4 py-2 border border-site-border/30 rounded-[12px] font-bold transition-all hover:-translate-y-0.5 ${
                    userVote === false
                      ? "bg-red-500/10 border-red-600 text-red-400"
                      : "bg-[#212328] text-gray-700 hover:bg-[#181A1D]"
                  }`}
                  style={{
                    boxShadow:
                      userVote === false
                        ? "3px 3px 0 0 #dc2626"
                        : "3px 3px 0 0 #000000",
                  }}
                >
                  <ThumbsDown size={16} className="mr-2" />
                  No ({article.unhelpfulCount})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 md:p-8 bg-[#1A1C1E] border-t-[3px] border-black">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-white font-bold mb-1">Still need help?</h4>
              <p className="text-gray-600 text-sm">
                Can&apos;t find what you&apos;re looking for? Contact our
                support team.
              </p>
            </div>
            <Link
              href="/support/tickets"
              className="bg-site-accent hover:bg-site-accent/90 text-white px-6 py-3 font-bold border border-site-border/30 rounded-[12px] flex items-center transition-all hover:-translate-y-0.5"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
            >
              <MessageSquare size={18} className="mr-2" />
              Contact Support
            </Link>
          </div>
        </div>
      </motion.article>
    </div>
  );
}
