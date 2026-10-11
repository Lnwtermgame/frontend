"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn } from "@/components/ui/skeleton-region";
import { SkeletonList, FaqItemSkeleton } from "@/components/skeletons";
import { useFaqCategories, useFaqArticles } from "@/lib/query/hooks";
import { FaqAccordion } from "@/components/support/faq-accordion";
import { DashEmptyState, DashErrorState } from "@/components/dashboard/shared";

function FaqInner() {
  const t = useTranslations("support");
  const categories = useFaqCategories();
  const searchParams = useSearchParams();
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  // รับคำค้นจากหน้าศูนย์บริการ (?search=...) เป็นค่าเริ่มต้นของช่องกรอง
  const [query, setQuery] = useState(() => searchParams.get("search") ?? "");

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
            className="pl-9 pr-10"
            aria-label={t("searchPlaceholder")}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t("clearSearch")}
              className="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      {categories.isLoading ? (
        // จองแถวหมวด — กันรายการคำถามถูกดันลงตอนหมวดโหลดเสร็จ
        <div className="mt-8 flex flex-wrap justify-center gap-2" aria-hidden>
          {["w-24", "w-20", "w-28", "w-20"].map((w, i) => (
            <Skeleton key={i} className={`h-11 rounded-md md:h-7 ${w}`} />
          ))}
        </div>
      ) : categories.data?.length ? (
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Button
            size="sm"
            variant={selectedCatId === null ? "default" : "outline"}
            onClick={() => setSelectedCatId(null)}
            className="min-h-11 md:min-h-7"
          >
            {t("allCategories")}
          </Button>
          {categories.data.map((cat) => (
            <Button
              key={cat.id}
              size="sm"
              variant={selectedCatId === cat.id ? "default" : "outline"}
              onClick={() => setSelectedCatId(cat.id)}
              className="min-h-11 md:min-h-7"
            >
              {cat.name} {cat.articleCount ? `(${cat.articleCount})` : ""}
            </Button>
          ))}
        </div>
      ) : null}

      <div className="mt-8">
        {articles.isLoading ? (
          <SkeletonList count={5} className="space-y-3">
            {(i) => <FaqItemSkeleton index={i} />}
          </SkeletonList>
        ) : articles.isError ? (
          <DashErrorState onRetry={() => articles.refetch()} />
        ) : filtered.length === 0 ? (
          <DashEmptyState title={t("emptyFaq")} />
        ) : (
          // สลับหมวด = รายการเดิมจางลงระหว่างโหลด (keepPreviousData) แทนกลับเป็น skeleton
          <FadeIn
            className={`transition-opacity duration-150 ease-soft ${
              articles.isPlaceholderData ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <FaqAccordion articles={filtered} />
          </FadeIn>
        )}
      </div>
    </div>
  );
}

/** Suspense fallback (useSearchParams) — หัวเรื่องจริง + ช่องค้นหา/หมวด/รายการเป็น skeleton (เดิมว่างทั้งหน้า) */
function FaqFallback() {
  const t = useTranslations("support");
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">{t("faqTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("faqSubtitle")}</p>
        <Skeleton className="mx-auto mt-6 h-9 max-w-lg rounded-md" />
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-2" aria-hidden>
        {["w-24", "w-20", "w-28", "w-20"].map((w, i) => (
          <Skeleton key={i} className={`h-11 rounded-md md:h-7 ${w}`} />
        ))}
      </div>
      <div className="mt-8">
        <SkeletonList count={5} className="space-y-3">
          {(i) => <FaqItemSkeleton index={i} />}
        </SkeletonList>
      </div>
    </div>
  );
}

export default function FaqPage() {
  return (
    <Suspense fallback={<FaqFallback />}>
      <FaqInner />
    </Suspense>
  );
}
