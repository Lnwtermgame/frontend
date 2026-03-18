import { notFound } from "next/navigation";
import { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { getTranslations } from "next-intl/server";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_GATEWAY_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

export const dynamic = "force-dynamic";

type CmsRouteParams = {
  slug: string;
};

// This generates static params for known CMS pages
export async function generateStaticParams() {
  // Return common CMS page slugs
  return [
    { slug: "terms" },
    { slug: "privacy" },
    { slug: "terms-of-service" },
    { slug: "privacy-policy" },
    { slug: "about" },
    { slug: "contact" },
    { slug: "help" },
    { slug: "faq" },
  ];
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://lnwtermgame.com";

const LOCALES = ["th", "en", "zh", "ja", "ko", "ms", "hi", "es", "fr"];

// Generate metadata for the page
export async function generateMetadata({
  params,
}: {
  params: Promise<CmsRouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getCmsPage(slug);

  if (!page) {
    return {
      title: "Page Not Found",
    };
  }

  const title = page.metaTitle || page.title;
  const description = page.metaDescription || "";

  const languageAlternates: Record<string, string> = {};
  for (const locale of LOCALES) {
    languageAlternates[locale] = `${SITE_URL}/${locale}/${slug}`;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${slug}`,
      type: "article",
    },
    alternates: {
      canonical: `${SITE_URL}/${slug}`,
      languages: languageAlternates,
    },
  };
}

async function getCmsPage(slug: string) {
  try {
    const endpoint = `${API_BASE_URL}/api/cms/pages/${slug}`;
    const response = await fetch(endpoint, {
      cache: "no-store",
    });

    if (!response.ok) {
      // 404 is expected for non-CMS slugs — only log server errors
      if (response.status >= 500) {
        console.error("[Frontend] CMS page fetch error", {
          slug,
          status: response.status,
        });
      }
      return null;
    }

    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error("[Frontend] Error fetching CMS page", {
      slug,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

interface CmsPageProps {
  params: Promise<CmsRouteParams>;
}

export default async function CmsPage({ params }: CmsPageProps) {
  const t = await getTranslations("NewsDetail");
  const { slug } = await params;
  const page = await getCmsPage(slug);

  if (!page) {
    notFound();
  }

  return (
    <div className="page-container">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            {page.title}
          </h1>
          <div className="h-1 w-20 bg-brutal-pink"></div>
        </div>

        {/* Content */}
        <article
          className="prose prose-lg max-w-none
            prose-headings:text-black prose-headings:font-bold
            prose-p:text-gray-700
            prose-a:text-brutal-blue prose-a:no-underline hover:prose-a:underline
            prose-strong:text-black
            prose-ul:text-gray-700 prose-ol:text-gray-700
            prose-li:marker:text-brutal-pink
            prose-blockquote:border-l-4 prose-blockquote:border-brutal-pink prose-blockquote:bg-gray-50 prose-blockquote:py-2 prose-blockquote:px-4
            prose-table:border-[3px] prose-table:border-black
            prose-th:bg-gray-100 prose-th:border-[2px] prose-th:border-black prose-th:p-3
            prose-td:border-[2px] prose-td:border-black prose-td:p-3"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeSanitize]}
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
                <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>
              ),
              h2: ({ children }) => (
                <h2 className="text-2xl font-bold text-black mt-8 mb-3">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-bold text-black mt-6 mb-2">
                  {children}
                </h3>
              ),
            }}
          >
            {page.content}
          </ReactMarkdown>
        </article>

        {/* Last Updated */}
        <div className="mt-12 pt-6 border-t-[2px] border-gray-200">
          <p className="text-sm text-gray-500">
            {t("last_updated")}:{" "}
            {new Date(page.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
