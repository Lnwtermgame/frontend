"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShelfTile } from "@/components/product/shelf-tile";
import type { Product } from "@/lib/api/products";

export function ProductShelf({
  title,
  moreHref,
  products,
  isLoading,
  isError,
  onRetry,
}: {
  title: string;
  moreHref: string;
  products: Product[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const t = useTranslations("home");
  const tc = useTranslations("catalog");

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-8">
      <div className="mb-4 flex items-baseline gap-3">
        <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
        <Link
          href={moreHref}
          className="ml-auto text-[13px] font-semibold whitespace-nowrap text-muted-foreground transition-colors hover:text-primary"
        >
          {t("viewAll")} →
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Skeleton className="aspect-square rounded-xl" />
              <Skeleton className="h-3.5 w-3/4 rounded-md" />
              <Skeleton className="h-3 w-1/2 rounded-md" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-[14px] border bg-card p-10 text-center">
          <p className="font-semibold">{tc("error")}</p>
          <Button variant="outline" className="mt-3" onClick={onRetry}>
            {tc("retry")}
          </Button>
        </div>
      ) : !products?.length ? (
        <p className="py-12 text-center text-sm text-muted-foreground">{tc("emptyTitle")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {products.map((p) => (
            <ShelfTile key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
