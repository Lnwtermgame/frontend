import { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import Link from "next/link";
import { Newspaper, Calendar, Eye } from "lucide-react";

export const metadata: Metadata = {
  title: "ข่าวสารและประกาศ - GameTopup",
  description: "ข่าวสาร โปรโมชั่น และประกาศล่าสุดจาก GameTopup",
};

async function getNewsArticles() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/cms/news`,
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

async function getFeaturedNews() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/cms/news/featured?limit=3`,
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

export default async function NewsPage() {
  const [articles, featured] = await Promise.all([
    getNewsArticles(),
    getFeaturedNews(),
  ]);

  return (
    <MainLayout>
      <div className="page-container">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Newspaper className="w-8 h-8 text-brutal-pink mr-3" />
            <h1 className="text-3xl font-bold text-black thai-font">
              ข่าวสารและประกาศ
            </h1>
          </div>
          <p className="text-gray-600 thai-font">
            ติดตามข่าวสาร โปรโมชั่น และอัปเดตล่าสุด
          </p>
        </div>

        {/* Featured News */}
        {featured.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-black thai-font mb-4 flex items-center">
              <span className="w-1.5 h-6 bg-brutal-yellow mr-2"></span>
              ข่าวเด่น
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featured.map((article: any) => (
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
                      className={`inline-block px-2 py-0.5 text-xs font-medium mb-2 ${
                        categoryColors[article.category] ||
                        categoryColors.general
                      }`}
                    >
                      {categoryLabels[article.category] || "ทั่วไป"}
                    </span>
                    <h3 className="font-bold text-black thai-font line-clamp-2 group-hover:text-brutal-pink transition-colors">
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
          <h2 className="text-xl font-bold text-black thai-font mb-4 flex items-center">
            <span className="w-1.5 h-6 bg-brutal-pink mr-2"></span>
            ข่าวทั้งหมด
          </h2>

          {articles.length === 0 ? (
            <div className="text-center py-16 bg-white border-[3px] border-black">
              <Newspaper className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600 thai-font">ยังไม่มีข่าวสาร</p>
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article: any) => (
                <Link
                  key={article.id}
                  href={`/news/${article.slug}`}
                  className="block bg-white border-[3px] border-black p-4 hover:shadow-[4px_4px_0_0_#000] transition-shadow"
                >
                  <div className="flex gap-4">
                    {/* Cover */}
                    <div className="w-32 h-24 bg-gray-100 flex-shrink-0 border-[2px] border-gray-200 overflow-hidden">
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
                          className={`inline-block px-2 py-0.5 text-xs font-medium ${
                            categoryColors[article.category] ||
                            categoryColors.general
                          }`}
                        >
                          {categoryLabels[article.category] || "ทั่วไป"}
                        </span>
                        {article.isFeatured && (
                          <span className="inline-block px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700">
                            เด่น
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-black thai-font mb-1 line-clamp-1 hover:text-brutal-pink transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {article.publishedAt
                            ? new Date(article.publishedAt).toLocaleDateString(
                                "th-TH",
                              )
                            : new Date(article.createdAt).toLocaleDateString(
                                "th-TH",
                              )}
                        </span>
                        <span className="flex items-center">
                          <Eye className="w-3 h-3 mr-1" />
                          {article.viewCount?.toLocaleString() || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
