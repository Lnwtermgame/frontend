"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { useFeatured, useBestsellers } from "@/lib/query/hooks";
import { ProductGrid, ProductGridSkeleton, GridEmptyState } from "@/components/product/product-grid";
import { HowItWorks } from "@/components/home/how-it-works";

export default function HomePage() {
  const t = useTranslations("home");
  const tc = useTranslations("catalog");
  const featured = useFeatured(10);
  const bestsellers = useBestsellers(10);

  return (
    <div className="pb-10">
      <section className="mx-auto w-full max-w-6xl px-4 pb-10 pt-14">
        <h1 className="max-w-2xl text-3xl font-extrabold leading-snug sm:text-4xl">
          {t("heroTitle1")} <span className="text-primary">{t("heroTitle2")}</span>
        </h1>
        <p className="mt-3 max-w-xl text-[15px] text-muted-foreground">{t("heroSubtitle")}</p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/games">{t("heroCta")}</Link>
        </Button>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-10">
        <h2 className="mb-4 text-xl font-bold">{t("popularTitle")}</h2>
        {featured.isLoading ? (
          <ProductGridSkeleton count={10} />
        ) : featured.isError ? (
          <div className="rounded-[14px] border bg-card p-10 text-center">
            <p className="font-semibold">{tc("error")}</p>
            <Button variant="outline" className="mt-3" onClick={() => featured.refetch()}>
              {tc("retry")}
            </Button>
          </div>
        ) : !featured.data?.length ? (
          <GridEmptyState title={t("popularTitle")} description="" />
        ) : (
          <ProductGrid products={featured.data} />
        )}
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-10">
        <h2 className="mb-4 text-xl font-bold">{t("bestsellerTitle")}</h2>
        {bestsellers.isLoading ? (
          <ProductGridSkeleton count={10} />
        ) : bestsellers.isError ? (
          <div className="rounded-[14px] border bg-card p-10 text-center">
            <p className="font-semibold">{tc("error")}</p>
            <Button variant="outline" className="mt-3" onClick={() => bestsellers.refetch()}>
              {tc("retry")}
            </Button>
          </div>
        ) : !bestsellers.data?.length ? (
          <GridEmptyState title={t("bestsellerTitle")} description="" />
        ) : (
          <ProductGrid products={bestsellers.data} />
        )}
      </section>

      <HowItWorks />
    </div>
  );
}
