"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Eye } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "@/i18n/routing";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useNewsArticle } from "@/lib/query/hooks";
import { DashErrorState, formatDateTime } from "@/components/dashboard/shared";

export default function NewsArticleDetailPage() {
  const t = useTranslations("support");
  const params = useParams<Record<string, string>>();
  const slug = params?.slug ?? "";
  const article = useNewsArticle(slug);

  if (article.isLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 space-y-4">
        <Skeleton className="h-8 w-3/4 rounded-[10px]" />
        <Skeleton className="h-64 rounded-[14px]" />
      </div>
    );
  }

  if (article.isError || !article.data) {
    return <DashErrorState onRetry={() => article.refetch()} />;
  }

  const item = article.data;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <Link
        href="/news"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" />
        {t("newsTitle")}
      </Link>

      <article className="rounded-[14px] border bg-card p-6 sm:p-10 shadow-(--shadow-tile)">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{item.category}</Badge>
          {item.isFeatured ? (
            <Badge className="bg-primary text-primary-foreground">แนะนำ</Badge>
          ) : null}
          <div className="num ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            <span>{formatDateTime(item.publishedAt)}</span>
            <span className="flex items-center gap-1">
              <Eye className="size-3.5" />
              {item.viewCount}
            </span>
          </div>
        </div>

        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">{item.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground italic border-l-2 border-primary/50 pl-3">
          {item.excerpt}
        </p>

        <div className="prose prose-invert max-w-none mt-8 border-t pt-6 space-y-4 text-sm leading-relaxed text-muted-foreground [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-foreground [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {item.content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
}
