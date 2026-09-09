"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GameCover } from "@/components/product/game-cover";
import type { Product } from "@/lib/api/products";

const BASE_BY_TYPE: Record<Product["productType"], string> = {
  DIRECT_TOPUP: "/games",
  CARD: "/card",
  MOBILE_RECHARGE: "/mobile-recharge",
};

const FALLBACK_SUB: Record<Product["productType"], string> = {
  DIRECT_TOPUP: "เติมตรง",
  CARD: "บัตรเติมเงิน",
  MOBILE_RECHARGE: "เติมมือถือ",
};

const THB = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

function ShelfTile({ product }: { product: Product }) {
  const t = useTranslations("home");
  const types = product.types ?? [];
  const cheapest = types.length
    ? types.reduce((a, b) => (a.displayPrice <= b.displayPrice ? a : b))
    : null;

  return (
    <Link
      href={`${BASE_BY_TYPE[product.productType]}/${product.slug}`}
      className="group flex min-w-0 flex-col gap-2"
    >
      <div className="transition-transform duration-150 group-hover:-translate-y-1">
        <GameCover
          name={product.name}
          imageUrl={product.imageUrl}
          fallbackSub={FALLBACK_SUB[product.productType]}
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
        />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold">{product.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {product.category?.name ?? FALLBACK_SUB[product.productType]}
        </p>
        {cheapest && (
          <p className="num mt-1 text-[13.5px] font-bold text-primary">
            {THB.format(cheapest.displayPrice)}
            {cheapest.originPrice &&
              Math.round(cheapest.originPrice) > Math.round(cheapest.displayPrice) && (
              <span className="num ml-1.5 text-[11px] font-semibold text-muted-foreground/70 line-through">
                {THB.format(cheapest.originPrice)}
              </span>
            )}
            <span className="ml-1 text-[10.5px] font-semibold text-muted-foreground/70">{t("andUp")}</span>
          </p>
        )}
      </div>
    </Link>
  );
}

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
        <div className="grid grid-cols-2 gap-x-3.5 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-square rounded-xl" />
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <Skeleton className="h-3.5 w-1/2 rounded-md" />
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
        <div className="grid grid-cols-2 gap-x-3.5 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {products.map((p) => (
            <ShelfTile key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
