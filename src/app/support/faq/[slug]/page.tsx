"use client";

import { useState, useEffect } from "react";
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
      <div className="page-container bg-brutal-gray">
        <div
          className="bg-white border-[3px] border-black p-12 text-center"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
        >
          <Loader2 className="animate-spin mx-auto text-black mb-4" size={48} />
          <p className="text-gray-600">กำลังโหลดบทความ...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="page-container bg-brutal-gray">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brutal-pink border-[3px] border-black p-6 text-center"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
        >
          <AlertCircle className="mx-auto text-black mb-3" size={48} />
          <h2 className="text-xl font-bold text-black mb-2">ไม่พบบทความ</h2>
          <p className="text-gray-800 mb-4">
            {error || "ไม่พบบทความที่คุณต้องการ"}
          </p>
          <Link
            href="/support/faq"
            className="inline-flex items-center bg-black text-white border-[3px] border-black px-6 py-2 font-medium hover:bg-gray-800 transition-colors"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <ArrowLeft size={18} className="mr-2" />
            กลับไปหน้าคำถามที่พบบ่อย
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page-container bg-brutal-gray">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-gray-600">
          <Link
            href="/support"
            className="hover:text-black transition-colors font-medium"
          >
            ศูนย์ช่วยเหลือ
          </Link>
          <span className="mx-2">/</span>
          <Link
            href="/support/faq"
            className="hover:text-black transition-colors font-medium"
          >
            คำถามที่พบบ่อย
          </Link>
          <span className="mx-2">/</span>
          <span className="text-black font-medium">{article.title}</span>
        </div>
      </div>

      {/* Article */}
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white border-[3px] border-black overflow-hidden"
        style={{ boxShadow: "4px 4px 0 0 #000000" }}
      >
        {/* Header */}
        <div className="p-6 md:p-8 border-b-[3px] border-black">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <Link
              href={`/support/faq?category=${article.categoryId}`}
              className="flex items-center text-brutal-blue hover:underline font-medium"
            >
              <Tag size={14} className="mr-1" />
              {article.category.name}
            </Link>
            {article.isPinned && (
              <span className="text-black ml-2" title="ปักหมุด">
                📌 ปักหมุด
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-black mb-4">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Clock size={14} className="mr-1.5" />
              {new Date(article.createdAt).toLocaleDateString()}
            </div>
            <div className="flex items-center">
              <Eye size={14} className="mr-1.5" />
              {article.viewCount} ครั้ง
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
                    className="text-xl font-bold text-black mt-4 mb-2"
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
                  <a className="text-brutal-blue underline" {...props} />
                ),
              }}
            >
              {article.content}
            </ReactMarkdown>
          </div>

          {/* Feedback Section */}
          <div className="mt-10 pt-6 border-t-[3px] border-black">
            <h3 className="text-lg font-medium text-black mb-4">
              บทความนี้มีประโยชน์หรือไม่?
            </h3>

            {showThankYou ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-brutal-green border-[3px] border-black p-4 flex items-center"
                style={{ boxShadow: "4px 4px 0 0 #000000" }}
              >
                <CheckCircle className="text-black mr-3" size={20} />
                <span className="text-black font-medium">
                  ขอบคุณสำหรับความคิดเห็น!
                </span>
              </motion.div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleVote(true)}
                  className={`flex items-center px-4 py-2 border-[3px] transition-colors ${
                    userVote === true
                      ? "bg-brutal-green border-black text-black"
                      : "bg-white border-black text-black hover:bg-brutal-green"
                  }`}
                  style={{ boxShadow: "4px 4px 0 0 #000000" }}
                >
                  <ThumbsUp size={16} className="mr-2" />
                  ใช่ ({article.helpfulCount})
                </button>
                <button
                  onClick={() => handleVote(false)}
                  className={`flex items-center px-4 py-2 border-[3px] transition-colors ${
                    userVote === false
                      ? "bg-brutal-pink border-black text-black"
                      : "bg-white border-black text-black hover:bg-brutal-pink"
                  }`}
                  style={{ boxShadow: "4px 4px 0 0 #000000" }}
                >
                  <ThumbsDown size={16} className="mr-2" />
                  ไม่ ({article.unhelpfulCount})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 md:p-8 bg-brutal-gray border-t-[3px] border-black">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-black font-medium mb-1">
                ยังต้องการความช่วยเหลือ?
              </h4>
              <p className="text-gray-600 text-sm">
                หากยังไม่พบที่ต้องการ ติดต่อทีมซัพพอร์ตของเราได้เลย
              </p>
            </div>
            <Link
              href="/support/tickets"
              className="bg-black text-white border-[3px] border-black px-6 py-3 font-medium flex items-center hover:bg-gray-800 transition-colors"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
            >
              <MessageSquare size={18} className="mr-2" />
              ติดต่อทีมซัพพอร์ต
            </Link>
          </div>
        </div>
      </motion.article>
    </div>
  );
}
