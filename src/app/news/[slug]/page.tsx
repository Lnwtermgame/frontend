import { notFound } from "next/navigation";
import { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import Link from "next/link";
import { Newspaper, Calendar, Eye, ArrowLeft, Tag } from "lucide-react";

// Generate metadata for the article
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = await getNewsArticle(params.slug);

  if (!article) {
    return {
      title: "Article Not Found",
    };
  }

  return {
    title: `${article.title} - GameTopup News`,
    description: article.excerpt,
  };
}

async function getNewsArticle(slug: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/cms/news/${slug}`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    return null;
  }
}

async function getRecentNews() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/cms/news/recent?limit=5`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    return [];
  }
}

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

interface NewsArticlePageProps {
  params: { slug: string };
}

export default async function NewsArticlePage({
  params,
}: NewsArticlePageProps) {
  const [article, recentNews] = await Promise.all([
    getNewsArticle(params.slug),
    getRecentNews(),
  ]);

  if (!article) {
    notFound();
  }

  const category = categoryLabels[article.category] || "ทั่วไป";
  const categoryColor =
    categoryColors[article.category] || categoryColors.general;

  // Filter out current article from recent news
  const otherNews = recentNews.filter((n: any) => n.slug !== params.slug);

  return (
    <MainLayout>
      <div className="page-container">
        <div className="max-w-4xl mx-auto">
          {/* Back Link */}
          <Link
            href="/news"
            className="inline-flex items-center text-gray-600 hover:text-black mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            กลับไปหน้าข่าวสาร
          </Link>

          {/* Article Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
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
              <div className="aspect-video bg-gray-100 border-[3px] border-black overflow-hidden">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Content */}
          <article
            className="prose prose-lg max-w-none mb-8
              prose-headings:text-black prose-headings:font-bold prose-headings:thai-font
              prose-p:text-gray-700 prose-p:thai-font
              prose-a:text-brutal-blue prose-a:no-underline hover:prose-a:underline
              prose-strong:text-black
              prose-ul:text-gray-700 prose-ol:text-gray-700
              prose-li:marker:text-brutal-pink
              prose-blockquote:border-l-4 prose-blockquote:border-brutal-pink prose-blockquote:bg-gray-50 prose-blockquote:py-2 prose-blockquote:px-4
              prose-img:border-[3px] prose-img:border-black prose-img:shadow-[4px_4px_0_0_#000]"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Tags */}
          {article.tags?.length > 0 && (
            <div className="flex items-center gap-2 mb-8 pb-8 border-b-[2px] border-gray-200">
              <Tag className="w-4 h-4 text-gray-400" />
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-sm border border-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Other News */}
          {otherNews.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold text-black thai-font mb-4 flex items-center">
                <Newspaper className="w-5 h-5 mr-2" />
                ข่าวอื่นๆ
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {otherNews.slice(0, 3).map((news: any) => (
                  <Link
                    key={news.id}
                    href={`/news/${news.slug}`}
                    className="group bg-white border-[2px] border-gray-200 hover:border-black p-4 transition-colors"
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
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
