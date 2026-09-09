"use client";

import { Suspense, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFaqCategories, useFaqArticles } from "@/lib/query/hooks";
import { FaqAccordion } from "@/components/support/faq-accordion";
import { DashEmptyState, DashErrorState } from "@/components/dashboard/shared";

function FaqInner() {
  const t = useTranslations("support");
  const categories = useFaqCategories();
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const articles = useFaqArticles({
    categoryId: selectedCatId ?? undefined,
    limit: 100,
  });

  const filtered = useMemo(() => {
    const list = articles.data?.data ?? [];
    if (!query.trim()) return list;
    const lower = query.toLowerCase();
    return list.filter(
      (a) => a.title.toLowerCase().includes(lower) || a.content.toLowerCase().includes(lower),
    );
  }, [articles.data?.data, query]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">{t("faqTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("faqSubtitle")}</p>

        <div className="relative mx-auto mt-6 max-w-lg">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="pl-9"
          />
        </div>
      </div>

      {categories.data?.length ? (
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Button
            size="sm"
            variant={selectedCatId === null ? "default" : "outline"}
            onClick={() => setSelectedCatId(null)}
          >
            {t("allCategories")}
          </Button>
          {categories.data.map((cat) => (
            <Button
              key={cat.id}
              size="sm"
              variant={selectedCatId === cat.id ? "default" : "outline"}
              onClick={() => setSelectedCatId(cat.id)}
            >
              {cat.name} {cat.articleCount ? `(${cat.articleCount})` : ""}
            </Button>
          ))}
        </div>
      ) : null}

      <div className="mt-8">
        {articles.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-[14px]" />
            ))}
          </div>
        ) : articles.isError ? (
          <DashErrorState onRetry={() => articles.refetch()} />
        ) : filtered.length === 0 ? (
          <DashEmptyState title={t("emptyFaq")} />
        ) : (
          <FaqAccordion articles={filtered} />
        )}
      </div>
    </div>
  );
}

export default function FaqPage() {
  return (
    <Suspense fallback={null}>
      <FaqInner />
    </Suspense>
  );
}
