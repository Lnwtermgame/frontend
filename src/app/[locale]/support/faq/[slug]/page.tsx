"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ThumbsUp, ThumbsDown, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFaqArticleBySlug } from "@/lib/query/hooks";
import { markFaqHelpful } from "@/lib/api/support";
import { DashErrorState, formatDateTime } from "@/components/dashboard/shared";

export default function FaqArticlePage() {
  const t = useTranslations("support");
  const params = useParams<Record<string, string>>();
  const slug = params?.slug ?? "";
  const article = useFaqArticleBySlug(slug);
  const [voted, setVoted] = useState(false);

  if (article.isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 space-y-4">
        <Skeleton className="h-8 w-3/4 rounded-[10px]" />
        <Skeleton className="h-48 rounded-[14px]" />
      </div>
    );
  }

  if (article.isError || !article.data) {
    return <DashErrorState onRetry={() => article.refetch()} />;
  }

  const art = article.data;

  const handleVote = async (isHelpful: boolean) => {
    if (voted) return;
    try {
      await markFaqHelpful(art.id, isHelpful);
      setVoted(true);
    } catch {
      // noop
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link
        href="/support/faq"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" />
        {t("faqTitle")}
      </Link>

      <article className="rounded-[14px] border bg-card p-6 shadow-(--shadow-tile)">
        <h1 className="text-xl font-bold sm:text-2xl">{art.title}</h1>
        <p className="num mt-2 text-xs text-muted-foreground">
          {formatDateTime(art.updatedAt)}
        </p>

        <div className="mt-6 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {art.content}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3 border-t pt-4 text-xs">
          <span>{t("wasHelpful")}</span>
          {voted ? (
            <span className="font-semibold text-status-success">{t("thankYou")}</span>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1"
                onClick={() => handleVote(true)}
              >
                <ThumbsUp className="size-3.5" />
                {t("yes")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1"
                onClick={() => handleVote(false)}
              >
                <ThumbsDown className="size-3.5" />
                {t("no")}
              </Button>
            </>
          )}
        </div>
      </article>
    </div>
  );
}
