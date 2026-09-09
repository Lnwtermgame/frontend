"use client";

import { useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductBySlug } from "@/lib/query/hooks";
import { productImage } from "@/lib/product-image";
import { PackageGrid } from "./package-grid";
import { OrderSummary, type BuyPayload } from "./order-summary";
import type { ProductTypePublic } from "@/lib/api/products";

export type ProductRoute = "games" | "card" | "mobile";

const FIELD_BY_ROUTE: Record<ProductRoute, string> = {
  games: "gameId",
  card: "cardId",
  mobile: "slug",
};

export function ProductPage({ route }: { route: ProductRoute }) {
  const t = useTranslations("product");
  const routeParams = useParams<Record<string, string>>();
  const slug = routeParams?.[FIELD_BY_ROUTE[route]] ?? "";
  const query = useProductBySlug(slug);
  const [selected, setSelected] = useState<ProductTypePublic | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);

  if (query.isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <Skeleton className="h-24 w-full rounded-[14px]" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <Skeleton className="h-64 rounded-[14px]" />
          <Skeleton className="h-80 rounded-[14px]" />
        </div>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-16 text-center">
        <p className="font-semibold" role="alert">{t("orderFailed")}</p>
      </div>
    );
  }

  const product = query.data;
  const types = (product.types ?? []).filter((ty) => ty.isActive);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex items-center gap-4 rounded-[14px] border bg-card p-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-[10px]">
          <Image
            src={productImage(product.name, product.imageUrl)}
            alt={product.name}
            fill
            sizes="64px"
            className="object-cover"
          />
        </div>
        <div>
          <h1 className="text-xl font-bold">{product.name}</h1>
          <div className="mt-1.5 flex gap-1.5">
            <Badge variant="secondary">{t("autoDelivery")}</Badge>
            {product.isBestseller ? <Badge variant="secondary">ขายดี</Badge> : null}
          </div>
        </div>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <section>
          <h2 className="mb-3 text-lg font-bold">{t("selectPackage")}</h2>
          {types.length === 0 ? (
            <p className="rounded-[14px] border bg-card p-8 text-center text-sm text-muted-foreground">
              {t("outOfStock")}
            </p>
          ) : (
            <PackageGrid
              types={types}
              selectedId={selected?.id ?? null}
              onSelect={(ty) => setSelected(ty)}
            />
          )}
          {buyError ? (
            <p role="alert" className="mt-4 rounded-[10px] border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {buyError}
            </p>
          ) : null}
        </section>
        <OrderSummary
          product={product}
          selectedType={selected}
          onBuy={(payload: BuyPayload) => {
            void payload;
            setBuyError(null);
          }}
          buying={false}
        />
      </div>
    </div>
  );
}
