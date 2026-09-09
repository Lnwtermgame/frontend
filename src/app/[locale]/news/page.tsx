"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useNews } from "@/lib/query/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DashEmptyState, DashErrorState, formatDateTime } from "@/components/dashboard/shared";

export default function NewsListPage() {
  const t = useTranslations("support");
  const news = useNews({ limit: 20 });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">{t("newsTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("newsSubtitle")}</p>
      </div>

      <div className="mt-10">
        {news.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-[14px]" />
            ))}
          </div>
        ) : news.isError ? (
          <DashErrorState onRetry={() => news.refetch()} />
        ) : !news.data?.data.length ? (
          <DashEmptyState title={t("emptyNews")} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {news.data.data.map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.slug}`}
                className="group flex flex-col justify-between rounded-[14px] border bg-card p-5 shadow-(--shadow-tile) transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-primary"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {item.category}
                    </Badge>
                    {item.isFeatured ? (
                      <Badge className="bg-primary text-primary-foreground text-xs">
                        แนะนำ
                      </Badge>
                    ) : null}
                  </div>
                  <h2 className="mt-3 text-base font-bold group-hover:text-primary transition-colors line-clamp-2">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {item.excerpt}
                  </p>
                </div>
                <div className="num mt-4 border-t pt-3 text-xs text-muted-foreground">
                  {formatDateTime(item.publishedAt)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
