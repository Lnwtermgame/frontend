"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";
import { Newspaper, Calendar, Eye, Loader2 } from "lucide-react";
import { cmsApi, NewsArticle, NewsArticleListItem } from "@/lib/services";
import { useTranslations } from "next-intl";

const categoryColors: Record<string, string> = {
  general: "bg-gray-100 text-gray-700",
  promotion: "bg-pink-100 text-pink-700",
  update: "bg-blue-100 text-blue-700",
  event: "bg-yellow-100 text-yellow-700",
};

export default function NewsPage() {
  const t = useTranslations("News");
  const tCommon = useTranslations("Common");
  const [articles, setArticles] = useState<NewsArticleListItem[]>([]);
  const [featured, setFeatured] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const categoryLabels: Record<string, string> = {
    general: t("categories.general"),
    promotion: t("categories.promotion"),
    update: t("categories.update"),
    event: t("categories.event"),
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [articlesRes, featuredRes] = await Promise.all([
          cmsApi.getNewsArticles(1, 20),
          cmsApi.getFeaturedNews(3),
        ]);

        if (articlesRes.success && articlesRes.data) {
          setArticles(articlesRes.data);
        }

        if (featuredRes.success && featuredRes.data) {
          setFeatured(featuredRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch news:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-brutal-pink" />
            <p className="text-gray-600">{tCommon("loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center mb-4">
          <Newspaper className="w-8 h-8 text-brutal-pink mr-3" />
          <h1 className="text-3xl font-bold text-black">
            {t("title")}
          </h1>
        </div>
        <p className="text-gray-600">
          {t("subtitle")}
        </p>
      </motion.div>

      {/* Featured News */}
      {featured.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-xl font-bold text-black mb-4 flex items-center">
            <span className="w-1.5 h-6 bg-brutal-yellow mr-2"></span>
            {t("featured")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featured.map((article) => (
              <Link
                key={article.id}
                href={`/news/${article.slug}`}
                className="group bg-white border-[3px] border-black overflow-hidden hover:shadow-[4px_4px_0_0_#FF6B9D] transition-shadow"
              >
                <div className="aspect-video bg-gray-100 overflow-hidden">
                  {article.coverImage ? (
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Newspaper className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <span
                    className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase mb-2 ${
                      categoryColors[article.category] || categoryColors.general
                    }`}
                  >
                    {categoryLabels[article.category] || t("categories.general")}
                  </span>
                  <h3 className="font-bold text-black line-clamp-2 group-hover:text-brutal-pink transition-colors">
                    {article.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* All News */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-xl font-bold text-black mb-4 flex items-center">
          <span className="w-1.5 h-6 bg-brutal-pink mr-2"></span>
          {t("all_news")}
        </h2>

        {articles.length === 0 ? (
          <div className="text-center py-16 bg-white border-[3px] border-black">
            <Newspaper className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600">{t("no_news")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Link
                  href={`/news/${article.slug}`}
                  className="block bg-white border-[3px] border-black p-4 hover:shadow-[4px_4px_0_0_#000] transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Cover */}
                    <div className="w-full sm:w-32 h-40 sm:h-24 bg-gray-100 flex-shrink-0 border-[2px] border-gray-200 overflow-hidden">
                      {article.coverImage ? (
                        <img
                          src={article.coverImage}
                          alt={article.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Newspaper className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase ${
                            categoryColors[article.category] ||
                            categoryColors.general
                          }`}
                        >
                          {categoryLabels[article.category] || t("categories.general")}
                        </span>
                        {article.isFeatured && (
                          <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase bg-yellow-100 text-yellow-700">
                            {t("featured_badge")}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-black mb-1 line-clamp-1 hover:text-brutal-pink transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500 uppercase">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(article.publishedAt || article.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <Eye className="w-3 h-3 mr-1" />
                          {t("view_count", { count: article.viewCount || 0 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
