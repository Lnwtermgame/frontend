import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getCmsPage } from "@/lib/api/support";
import { formatDateTime } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const page = await getCmsPage(slug);
    return {
      title: page.metaTitle || page.title,
      description: page.metaDescription,
    };
  } catch {
    return {
      title: "Lnwtermgame",
    };
  }
}

export default async function DynamicCmsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let page;
  try {
    page = await getCmsPage(slug);
  } catch {
    notFound();
  }

  if (!page) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <article className="rounded-[14px] border bg-card p-6 sm:p-10 shadow-(--shadow-tile)">
        <h1 className="text-2xl font-bold sm:text-3xl">{page.title}</h1>
        {page.updatedAt ? (
          <p className="num mt-2 text-xs text-muted-foreground border-b pb-4">
            ปรับปรุงล่าสุดเมื่อ: {formatDateTime(page.updatedAt)}
          </p>
        ) : null}

        <div className="prose prose-invert max-w-none mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-foreground [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-1">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {page.content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
}
