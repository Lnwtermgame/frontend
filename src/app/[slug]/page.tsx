import { notFound } from "next/navigation";
import { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

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

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription,
  };
}

async function getCmsPage(slug: string) {
  try {
    const endpoint = `${API_BASE_URL}/api/cms/pages/${slug}`;
    const response = await fetch(endpoint, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[Frontend] Failed to fetch CMS page", {
        slug,
        endpoint,
        status: response.status,
      });
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
          <h1 className="text-3xl font-bold text-black thai-font mb-2">
            {page.title}
          </h1>
          <div className="h-1 w-20 bg-brutal-pink"></div>
        </div>

        {/* Content */}
        <article
          className="prose prose-lg max-w-none
            prose-headings:text-black prose-headings:font-bold prose-headings:thai-font
            prose-p:text-gray-700 prose-p:thai-font
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
                <h2 className="text-2xl font-bold text-black mt-8 mb-3 thai-font">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-bold text-black mt-6 mb-2 thai-font">
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
            อัปเดตล่าสุด:{" "}
            {new Date(page.updatedAt).toLocaleDateString("th-TH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
