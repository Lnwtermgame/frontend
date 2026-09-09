"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@/i18n/routing";
import { useProductBySlug } from "@/lib/query/hooks";
import { productImage } from "@/lib/product-image";
import { PackageGrid } from "./package-grid";
import { OrderSummary, type BuyPayload } from "./order-summary";
import { ConfirmOrderDialog } from "./confirm-order-dialog";
import { startBuyFlow } from "@/lib/buy-flow";
import { ApiError } from "@/lib/api/client";
import { lineTotal } from "@/lib/pricing";
import type { ProductTypePublic } from "@/lib/api/products";

export type ProductRoute = "games" | "card" | "mobile";

const FIELD_BY_ROUTE: Record<ProductRoute, string> = {
  games: "gameId",
  card: "cardId",
  mobile: "slug",
};

export function ProductPage({ route }: { route: ProductRoute }) {
  const t = useTranslations("product");
  const router = useRouter();
  const routeParams = useParams<Record<string, string>>();
  const slug = routeParams?.[FIELD_BY_ROUTE[route]] ?? "";
  const query = useProductBySlug(slug);
  const [selected, setSelected] = useState<ProductTypePublic | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [buying, setBuying] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<BuyPayload | null>(null);

  // reset local state when navigating between products
  useEffect(() => {
    setSelected(null);
    setPendingPayload(null);
    setBuyError(null);
  }, [slug]);

  const handleBuy = async (payload: BuyPayload) => {
    if (!selected || !query.data) return;
    setBuying(true);
    try {
      const result = await startBuyFlow(payload, {
        productId: query.data.id,
        productTypeId: selected.id,
      });
      setConfirmOpen(false);
      if (result.outcome === "qr") {
        router.push(
          `/payments/pending?orderId=${result.orderId}&referenceNo=${result.referenceNo}`,
        );
      }
      // redirected: provider flow owns the tab; nothing to do
    } catch (err) {
      const info = err instanceof ApiError ? err.infoCode : undefined;
      setBuyError(
        info === "20133" || info === "20093"
          ? t("playerInvalid")
          : info === "20114"
            ? t("phoneRegionMismatch")
            : err instanceof Error && err.message !== "NO_PAYMENT_LINK" && err.message
            ? err.message
            : t("orderFailed"),
      );
      setConfirmOpen(false);
    } finally {
      setBuying(false);
    }
  };

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
            <p
              role="alert"
              className="mt-4 rounded-[10px] border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {buyError}
            </p>
          ) : null}
        </section>
        <OrderSummary
          product={product}
          selectedType={selected}
          buying={buying}
          onBuy={(payload) => {
            setBuyError(null);
            setPendingPayload(payload);
            setConfirmOpen(true);
          }}
        />
      </div>

      <ConfirmOrderDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        packageName={selected?.name ?? product.name}
        quantity={pendingPayload?.quantity ?? 1}
        total={
          selected && pendingPayload
            ? lineTotal(selected.displayPrice, pendingPayload.quantity)
            : 0
        }
        buying={buying}
        onConfirm={() => {
          if (pendingPayload) void handleBuy(pendingPayload);
        }}
      />
    </div>
  );
}
