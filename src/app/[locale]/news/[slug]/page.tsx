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
import { useTranslations } from "next-intl";

const categoryColors: Record<string, string> = {
  general: "bg-[#1A1C1E] text-gray-700",
  promotion: "bg-pink-100 text-pink-700",
  update: "bg-blue-100 text-blue-700",
  event: "bg-yellow-500/10 text-yellow-400",
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
  const t = useTranslations("NewsDetail");
  const tNews = useTranslations("News");
  const tCommon = useTranslations("Common");
  const params = useParams();
  const slug = params?.slug as string;

  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [recentNews, setRecentNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categoryLabels: Record<string, string> = {
    general: tNews("categories.general"),
    promotion: tNews("categories.promotion"),
    update: tNews("categories.update"),
    event: tNews("categories.event"),
  };

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
          setError("not_found");
        }

        if (recentRes.success && recentRes.data) {
          setRecentNews(recentRes.data.filter((n) => n.slug !== slug));
        }
      } catch (err) {
        setError("loading_error");
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
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-pink-500" />
            <p className="text-gray-600">{tCommon("loading")}</p>
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
          <h1 className="text-2xl font-bold text-white mb-2">
            {error === "not_found" ? t("error_not_found") : t("error_loading")}
          </h1>
          <p className="text-gray-600 mb-6">
            {error === "not_found" ? t("error_not_found_desc") : ""}
          </p>
          <Link
            href="/news"
            className="inline-flex items-center px-6 py-3 bg-black text-white border border-site-border/30 rounded-[12px] hover:bg-gray-800 transition-colors"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("back_to_news")}
          </Link>
        </div>
      </div>
    );
  }

  const category = categoryLabels[article.category] || tNews("categories.general");
  const categoryColor =
    categoryColors[article.category] || categoryColors.general;
  const cleanedContent = article.content.replace(
    /(?:^|\n)##\s*(วิดีโอที่เกี่ยวข้อง|Related Videos)[\s\S]*?(?=\n##\s|\n#\s|\n*$)/ig,
    "",
  );

  return (
    <div className="page-container">
      <div className="max-w-4xl mx-auto">
        {/* Back Link - Outside white box */}
        <Link
          href="/news"
          className="inline-flex items-center text-gray-600 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t("back_to_news")}
        </Link>

        {/* White rounded container like CMS pages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#212328] rounded-2xl border border-gray-200 shadow-sm p-6 md:p-10"
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
                <span className="inline-block px-3 py-1 text-sm font-medium bg-yellow-500/10 text-yellow-400">
                  {t("featured_badge")}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {article.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(article.publishedAt || article.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {article.viewCount?.toLocaleString() || 0} {t("views")}
              </span>
            </div>
          </div>

          {/* Cover Image */}
          {article.coverImage && (
            <div className="mb-8">
              <div className="aspect-video bg-[#1A1C1E] rounded-xl overflow-hidden">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          <article className="prose prose-lg max-w-none text-gray-700">
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
                  <h2 className="text-2xl font-bold text-white mt-8 mb-3">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-bold text-white mt-6 mb-2">
                    {children}
                  </h3>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-white">{children}</strong>
                ),
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
                code: ({ children, className }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="bg-[#1A1C1E] px-1.5 py-0.5 rounded text-sm font-mono">
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
                iframe: ({ width, height, ...props }) => (
                  <iframe
                    {...props}
                    width={width || "100%"}
                    height={height || "420"}
                  />
                ),
                img: ({ src, alt }) => (
                  <img
                    src={src}
                    alt={alt || ""}
                    className="my-6 w-full rounded-xl border-[2px] border-black"
                  />
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto">
                    <table className="w-full border border-site-border/30 rounded-[12px] border-collapse">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-[#1A1C1E]">{children}</thead>
                ),
                tbody: ({ children }) => <tbody>{children}</tbody>,
                tr: ({ children }) => (
                  <tr className="border-b-[2px] border-black">{children}</tr>
                ),
                th: ({ children }) => (
                  <th className="border-[2px] border-black p-3 text-left text-white font-bold">
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
              {cleanedContent}
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
                    className="px-2 py-1 bg-[#1A1C1E] text-gray-700 text-sm border border-gray-300 rounded"
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
                {t("sources")}
              </h3>
              <ul className="space-y-2">
                {(article as any).sources.map(
                  (source: string, index: number) => (
                    <li key={index}>
                      <a
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-site-accent hover:underline flex items-center"
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
              {t("last_updated")}:{" "}
              {new Date(article.updatedAt).toLocaleDateString()}
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
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <Newspaper className="w-5 h-5 mr-2" />
              {t("other_news")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentNews.slice(0, 3).map((news) => (
                <Link
                  key={news.id}
                  href={`/news/${news.slug}`}
                  className="group bg-[#212328] border-[2px] border-gray-200 hover:border-black p-4 rounded-xl transition-colors"
                >
                  <h3 className="font-bold text-white text-sm line-clamp-2 group-hover:text-pink-500 transition-colors">
                    {news.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(news.publishedAt || news.createdAt).toLocaleDateString()}
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
