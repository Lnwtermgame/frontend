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
      const response = await supportApi.markArticleHelpful(article.id, isHelpful);
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
            : null
        );
      }
    } catch (err) {
      console.error("Failed to vote:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-12 text-center">
          <Loader2 className="animate-spin mx-auto text-mali-blue-accent mb-4" size={48} />
          <p className="text-mali-text-secondary">Loading article...</p>
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
          className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 text-center"
        >
          <AlertCircle className="mx-auto text-red-400 mb-3" size={48} />
          <h2 className="text-xl font-bold text-white mb-2">Article Not Found</h2>
          <p className="text-red-200 mb-4">{error || "The article you're looking for doesn't exist."}</p>
          <Link
            href="/support/faq"
            className="inline-flex items-center bg-mali-blue hover:bg-mali-blue/90 text-white px-6 py-2 rounded-lg font-medium"
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
        <div className="flex items-center text-sm text-mali-text-secondary">
          <Link href="/support" className="hover:text-white transition-colors">
            Support
          </Link>
          <span className="mx-2">/</span>
          <Link href="/support/faq" className="hover:text-white transition-colors">
            FAQ
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white">{article.title}</span>
        </div>
      </div>

      {/* Article */}
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-mali-blue/20">
          <div className="flex items-center gap-2 text-sm text-mali-text-secondary mb-3">
            <Link
              href={`/support/faq?category=${article.categoryId}`}
              className="flex items-center text-mali-blue-accent hover:underline"
            >
              <Tag size={14} className="mr-1" />
              {article.category.name}
            </Link>
            {article.isPinned && (
              <span className="text-amber-400 ml-2" title="Pinned">
                📌 Pinned
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">{article.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-mali-text-secondary">
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
          <div className="prose prose-invert max-w-none">
            <div className="text-mali-text-secondary leading-relaxed whitespace-pre-line">
              {article.content}
            </div>
          </div>

          {/* Feedback Section */}
          <div className="mt-10 pt-6 border-t border-mali-blue/20">
            <h3 className="text-lg font-medium text-white mb-4">Was this article helpful?</h3>

            {showThankYou ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 flex items-center"
              >
                <CheckCircle className="text-green-400 mr-3" size={20} />
                <span className="text-green-200">Thank you for your feedback!</span>
              </motion.div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleVote(true)}
                  className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                    userVote === true
                      ? "bg-green-500/20 border-green-500/30 text-green-400"
                      : "border-mali-blue/30 text-mali-text-secondary hover:bg-mali-blue/10 hover:text-white"
                  }`}
                >
                  <ThumbsUp size={16} className="mr-2" />
                  Yes ({article.helpfulCount})
                </button>
                <button
                  onClick={() => handleVote(false)}
                  className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                    userVote === false
                      ? "bg-red-500/20 border-red-500/30 text-red-400"
                      : "border-mali-blue/30 text-mali-text-secondary hover:bg-mali-blue/10 hover:text-white"
                  }`}
                >
                  <ThumbsDown size={16} className="mr-2" />
                  No ({article.unhelpfulCount})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 md:p-8 bg-mali-blue/5 border-t border-mali-blue/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-white font-medium mb-1">Still need help?</h4>
              <p className="text-mali-text-secondary text-sm">
                Can&apos;t find what you&apos;re looking for? Contact our support team.
              </p>
            </div>
            <Link
              href="/support/tickets"
              className="bg-mali-blue hover:bg-mali-blue/90 text-white px-6 py-3 rounded-lg font-medium flex items-center"
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
