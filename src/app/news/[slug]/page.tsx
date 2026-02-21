"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import {
  Newspaper,
  Calendar,
  Eye,
  ArrowLeft,
  Tag,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { cmsApi, NewsArticle } from "@/lib/services";

const categoryLabels: Record<string, string> = {
  general: "ทั่วไป",
  promotion: "โปรโมชั่น",
  update: "อัปเดต",
  event: "กิจกรรม",
};

const categoryColors: Record<string, string> = {
  general: "bg-gray-100 text-gray-700",
  promotion: "bg-pink-100 text-pink-700",
  update: "bg-blue-100 text-blue-700",
  event: "bg-yellow-100 text-yellow-700",
};

const markdownSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    "iframe",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
  ],
  attributes: {
    ...defaultSchema.attributes,
    div: [...((defaultSchema.attributes?.div as string[]) || []), "className"],
    table: [
      ...((defaultSchema.attributes?.table as string[]) || []),
      "className",
    ],
    th: [
      ...((defaultSchema.attributes?.th as string[]) || []),
      "colSpan",
      "rowSpan",
      "align",
    ],
    td: [
      ...((defaultSchema.attributes?.td as string[]) || []),
      "colSpan",
      "rowSpan",
      "align",
    ],
    iframe: [
      "src",
      "allow",
      "allowfullscreen",
      "frameborder",
      "loading",
      "referrerpolicy",
      "title",
      "width",
      "height",
    ],
  },
};

export default function NewsArticlePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [recentNews, setRecentNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [articleRes, recentRes] = await Promise.all([
          cmsApi.getNewsArticleBySlug(slug),
          cmsApi.getRecentNews(5),
        ]);

        if (articleRes.success && articleRes.data) {
          setArticle(articleRes.data);
        } else {
          setError("ไม่พบบทความ");
        }

        if (recentRes.success && recentRes.data) {
          setRecentNews(recentRes.data.filter((n) => n.slug !== slug));
        }
      } catch (err) {
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        console.error("Failed to fetch news article:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-brutal-pink" />
            <p className="text-gray-600">กำลังโหลด...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="page-container">
        <div className="max-w-4xl mx-auto text-center py-16">
          <Newspaper className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-black mb-2">ไม่พบบทความ</h1>
          <p className="text-gray-600 mb-6">
            บทความที่คุณกำลังค้นหาอาจถูกลบหรือไม่มีอยู่
          </p>
          <Link
            href="/news"
            className="inline-flex items-center px-6 py-3 bg-black text-white border-[3px] border-black hover:bg-gray-800 transition-colors"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับไปหน้าข่าวสาร
          </Link>
        </div>
      </div>
    );
  }

  const category = categoryLabels[article.category] || "ทั่วไป";
  const categoryColor =
    categoryColors[article.category] || categoryColors.general;

  return (
    <div className="page-container">
      <div className="max-w-4xl mx-auto">
        {/* Back Link - Outside white box */}
        <Link
          href="/news"
          className="inline-flex items-center text-gray-600 hover:text-black mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          กลับไปหน้าข่าวสาร
        </Link>

        {/* White rounded container like CMS pages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-10"
        >
          {/* Article Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span
                className={`inline-block px-3 py-1 text-sm font-medium ${categoryColor}`}
              >
                {category}
              </span>
              {article.isFeatured && (
                <span className="inline-block px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-700">
                  ข่าวเด่น
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-black thai-font mb-4">
              {article.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {article.publishedAt
                  ? new Date(article.publishedAt).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : new Date(article.createdAt).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
              </span>
              <span className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {article.viewCount?.toLocaleString() || 0} ครั้ง
              </span>
            </div>
          </div>

          {/* Cover Image */}
          {article.coverImage && (
            <div className="mb-8">
              <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          <article className="prose prose-lg max-w-none text-gray-700 thai-font">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSchema]]}
              components={{
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
                h2: ({ children }) => (
                  <h2 className="text-2xl font-bold text-black mt-8 mb-3 thai-font">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-bold text-black mt-6 mb-2 thai-font">
                    {children}
                  </h3>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-black">{children}</strong>
                ),
                a: ({ children, href }) => (
                  <a
                    href={href}
                    className="text-brutal-blue hover:underline"
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
                code: ({ children, className }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">
                      {children}
                    </code>
                  ) : (
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                      <code className="font-mono text-sm">{children}</code>
                    </pre>
                  );
                },
                div: ({ className, children }) => (
                  <div className={className}>{children}</div>
                ),
                iframe: ({ ...props }) => (
                  <div className="youtube-embed">
                    <iframe {...props} className="youtube-embed_iframe" />
                  </div>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto">
                    <table className="w-full border-[3px] border-black border-collapse">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-gray-100">{children}</thead>
                ),
                tbody: ({ children }) => <tbody>{children}</tbody>,
                tr: ({ children }) => (
                  <tr className="border-b-[2px] border-black">{children}</tr>
                ),
                th: ({ children }) => (
                  <th className="border-[2px] border-black p-3 text-left text-black font-bold">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border-[2px] border-black p-3 align-top">
                    {children}
                  </td>
                ),
              }}
            >
              {article.content}
            </ReactMarkdown>
          </article>

          {/* Tags */}
          {article.tags?.length > 0 && (
            <div className="flex items-center gap-2 mt-8 pt-8 border-t border-gray-200">
              <Tag className="w-4 h-4 text-gray-400" />
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-sm border border-gray-300 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sources Section */}
          {(article as any).sources?.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8 pt-6 border-t border-gray-200"
            >
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                <ExternalLink className="w-4 h-4 mr-2" />
                แหล่งข่าว
              </h3>
              <ul className="space-y-2">
                {(article as any).sources.map(
                  (source: string, index: number) => (
                    <li key={index}>
                      <a
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brutal-blue hover:underline flex items-center"
                      >
                        {new URL(source).hostname}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </motion.div>
          )}

          {/* Last Updated */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              อัปเดตล่าสุด:{" "}
              {new Date(article.updatedAt).toLocaleDateString("th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </motion.div>

        {/* Other News */}
        {recentNews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-12"
          >
            <h2 className="text-xl font-bold text-black thai-font mb-4 flex items-center">
              <Newspaper className="w-5 h-5 mr-2" />
              ข่าวอื่นๆ
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentNews.slice(0, 3).map((news) => (
                <Link
                  key={news.id}
                  href={`/news/${news.slug}`}
                  className="group bg-white border-[2px] border-gray-200 hover:border-black p-4 rounded-xl transition-colors"
                >
                  <h3 className="font-bold text-black text-sm line-clamp-2 group-hover:text-brutal-pink transition-colors">
                    {news.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-2">
                    {news.publishedAt
                      ? new Date(news.publishedAt).toLocaleDateString("th-TH")
                      : new Date(news.createdAt).toLocaleDateString("th-TH")}
                  </p>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
