"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Newspaper, Calendar, Eye } from "lucide-react";
import { cmsApi, NewsArticleListItem } from "@/lib/services";
import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

const categoryColors: Record<string, string> = {
  general: "bg-site-raised text-site-muted",
  promotion: "bg-site-accent/10 text-site-accent",
  update: "bg-status-info/15 text-status-info",
  event: "bg-status-warning/15 text-status-warning",
};

export default function NewsPage() {
  const t = useTranslations("News");
  const tCommon = useTranslations("Common");
  const [articles, setArticles] = useState<NewsArticleListItem[]>([]);
  const [featured, setFeatured] = useState<NewsArticleListItem[]>([]);
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
        <SectionHeader level={1} title={t("title")} sublabel={t("subtitle")} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="site-card overflow-hidden">
              <Skeleton className="aspect-[16/9] w-full rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8">
        <SectionHeader level={1} title={t("title")} sublabel={t("subtitle")} />
      </div>

      {/* Featured News */}
      {featured.length > 0 && (
        <div className="mb-12">
          <h2 className="text-base md:text-lg font-bold text-site-text leading-none mb-4 flex items-center">
            <span className="w-1.5 h-5 bg-site-accent mr-2"></span>
            {t("featured")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featured.map((article) => (
              <Link
                key={article.id}
                href={`/news/${article.slug}`}
                className="group site-card overflow-hidden"
              >
                <div className="aspect-[16/9] w-full bg-site-deep overflow-hidden">
                  {article.coverImage ? (
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Newspaper className="w-12 h-12 text-site-dim" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <span
                    className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase mb-2 rounded-4 ${
                      categoryColors[article.category] || categoryColors.general
                    }`}
                  >
                    {categoryLabels[article.category] || t("categories.general")}
                  </span>
                  <h3 className="text-[14px] font-bold text-site-text line-clamp-2 group-hover:text-site-accent transition-colors">
                    {article.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* All News */}
      <div>
        <h2 className="text-base md:text-lg font-bold text-site-text leading-none mb-4 flex items-center">
          <span className="w-1.5 h-5 bg-site-accent mr-2"></span>
          {t("all_news")}
        </h2>

        {articles.length === 0 ? (
          <EmptyState icon={Newspaper} message={t("no_news")} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/news/${article.slug}`}
                className="group site-card overflow-hidden"
              >
                <div className="aspect-[16/9] w-full bg-site-deep overflow-hidden">
                  {article.coverImage ? (
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Newspaper className="w-8 h-8 text-site-dim" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-4 ${
                        categoryColors[article.category] ||
                        categoryColors.general
                      }`}
                    >
                      {categoryLabels[article.category] || t("categories.general")}
                    </span>
                    {article.isFeatured && (
                      <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-4 bg-site-accent/10 text-site-accent">
                        {t("featured_badge")}
                      </span>
                    )}
                  </div>
                  <h3 className="text-[14px] font-bold text-site-text line-clamp-2 group-hover:text-site-accent transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-[12px] text-site-muted line-clamp-2 mt-1.5">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-site-dim mt-2">
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
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
