"use client";

import { useState } from "react";
import { notFound, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/routing";
import { useProductBySlug, useFavorites, useFeatured } from "@/lib/query/hooks";
import { addFavorite, removeFavorite } from "@/lib/api/dashboard";
import { useAuthStore } from "@/stores/auth";
import { PackageGrid } from "./package-grid";
import { OrderSummary, type BuyPayload } from "./order-summary";
import { ConfirmOrderDialog, type ConfirmReviewRow } from "./confirm-order-dialog";
import { ProductBand } from "./product-band";
import { ShelfTile } from "./shelf-tile";
import { Markdown } from "@/components/markdown";
import { startBuyFlow } from "@/lib/buy-flow";
import { ApiError } from "@/lib/api/client";
import { lineTotal } from "@/lib/pricing";
import { decodeRouteParam } from "@/lib/route-param";
import type { ProductTypePublic } from "@/lib/api/products";

export type ProductRoute = "games" | "card" | "mobile";

const FIELD_BY_ROUTE: Record<ProductRoute, string> = {
  games: "gameId",
  card: "cardId",
  mobile: "slug",
};

// หน้ารายการปลายทางเมื่อโหลดสินค้าไม่สำเร็จ (transient) — ตามชนิดหน้าที่เปิดอยู่
const LIST_HREF_BY_ROUTE: Record<ProductRoute, string> = {
  games: "/games",
  card: "/card",
  mobile: "/mobile-recharge",
};

export function ProductPage({ route }: { route: ProductRoute }) {
  const t = useTranslations("product");
  const router = useRouter();
  const routeParams = useParams<Record<string, string>>();
  // Dynamic params arrive percent-encoded; slugs containing spaces must be
  // decoded before the API lookup or the slug double-encodes and 404s.
  const slug = decodeRouteParam(routeParams?.[FIELD_BY_ROUTE[route]]);
  const query = useProductBySlug(slug);
  const user = useAuthStore((s) => s.user);

  const [selected, setSelected] = useState<ProductTypePublic | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [buying, setBuying] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<BuyPayload | null>(null);

  // Copy link state
  const [copied, setCopied] = useState(false);

  // Favorites state
  const favorites = useFavorites({ limit: 50 });
  const isFavoriteItem = (favorites.data?.data ?? []).find(
    (f) => f.product.id === query.data?.id,
  );
  const isFav = Boolean(isFavoriteItem);
  const [favLoading, setFavLoading] = useState(false);

  // Featured/related products for recommendations
  const featured = useFeatured(6);

  /* reset local state เมื่อ slug เปลี่ยน — ปรับตอน render (pattern จาก React docs
     "adjusting state when a prop changes") แทน effect ที่ทำ cascade render */
  const [prevSlug, setPrevSlug] = useState(slug);
  if (prevSlug !== slug) {
    setPrevSlug(slug);
    setSelected(null);
    setPendingPayload(null);
    setBuyError(null);
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // noop
    }
  };

  const handleToggleFavorite = async () => {
    if (!query.data) return;
    if (!user) {
      const current = window.location.pathname;
      router.push(`/login?redirect=${encodeURIComponent(current)}`);
      return;
    }
    setFavLoading(true);
    try {
      if (isFav && isFavoriteItem) {
        await removeFavorite(isFavoriteItem.id);
      } else {
        await addFavorite(query.data.id);
      }
      favorites.refetch();
    } catch {
      // noop
    } finally {
      setFavLoading(false);
    }
  };

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
        return;
      }
      // outcome === "redirected": แท็บนี้กำลังถูกพาไปหน้าชำระเงินของ gateway แล้ว
      // (buy-flow ใช้ window.location.assign ในแท็บปัจจุบัน — popup blocker ตัดไม่ได้)
      // ห้าม router.push ทันที: same-document navigation จะแย่งจนการนำทางไป gateway ถูกยกเลิก
      // จึงตั้งเวลาสำรอง — หาก 4 วินาทีผ่านไปหน้ายังไม่ออก = การนำทางล้ม ให้ตกที่หน้า pending
      // (มีบริบทคำสั่งซื้อจาก sessionStorage) แทนการนั่งดูไดอะล็อกที่ปิดไปแล้ว
      setTimeout(() => {
        router.push(
          `/payments/pending?orderId=${result.orderId}&referenceNo=${result.referenceNo}`,
        );
      }, 4000);
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
    // แยก "ไม่มีสินค้านี้จริง" ออกจาก "โหลดชั่วคราวไม่สำเร็จ" — 404/ไม่มีข้อมูล
    // ต้องไป not-found boundary (มี header/footer ครบ) ส่วนอื่นควรลองใหม่ได้
    if (
      !query.isError ||
      (query.error instanceof ApiError && query.error.status === 404)
    ) {
      notFound();
    }
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-16 text-center">
        <p className="font-semibold" role="alert">{t("loadError")}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={() => void query.refetch()}>
            {t("retry")}
          </Button>
          <Button asChild>
            <Link href={LIST_HREF_BY_ROUTE[route]}>{t("backToList")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const product = query.data;
  const types = (product.types ?? []).filter((ty) => ty.isActive);

  // ข้อมูลบัญชีที่กรอกตอนกดซื้อ — ส่งเข้าไดอะล็อกให้ทวนอีกทีก่อนสร้างคำสั่งซื้อจริง
  const reviewRows: ConfirmReviewRow[] =
    selected && pendingPayload
      ? (selected.fields ?? [])
          .slice()
          .sort((a, b) => a.position - b.position)
          .filter((f) => (pendingPayload.playerInfo[f.name] ?? "").trim())
          .map((f) => ({ label: f.label, value: pendingPayload.playerInfo[f.name] ?? "" }))
      : [];

  // Filter out current product from recommendations
  const relatedProducts = (featured.data ?? [])
    .filter((p) => p.id !== product.id)
    .slice(0, 5);

  return (
    <div className="pb-8">
      {/* แถบสีประจำเกมเต็มความกว้าง (สีจากระบบปก — เปลี่ยนตามเกมอัตโนมัติ) */}
      <ProductBand
        product={product}
        isFavorite={isFav}
        favLoading={favLoading}
        copied={copied}
        onToggleFavorite={handleToggleFavorite}
        onCopyLink={handleCopyLink}
      />

      <div className="mx-auto w-full max-w-6xl px-4 pt-6">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-[14px] border border-border/60 bg-card p-5">
            <h2 className="mb-3.5 text-2xs font-bold tracking-wider text-muted-foreground-strong uppercase">
              {t("selectPackage")}
            </h2>
            {types.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
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

            {product.description ? (
              <>
                <h2 className="mt-6 mb-3 text-2xs font-bold tracking-wider text-muted-foreground-strong uppercase">
                  {t("detailsTitle")}
                </h2>
                <Markdown>{product.description}</Markdown>
              </>
            ) : null}
          </section>

          {/* key = id ของแพ็กเกจที่เลือก — เปลี่ยนแพ็กเกจ = remount สรุปคำส่งซื้อ
              state ภายใน (ค่าที่กรอก/ยอด/verify) เริ่มใหม่ทั้งชุด ไม่ต้องมี effect รีเซ็ต */}
          <OrderSummary
            key={selected?.id ?? "none"}
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

        {/* Related / Recommended Products */}
        {relatedProducts.length > 0 ? (
          <section className="pt-8">
            <h2 className="mb-4 text-2xs font-bold tracking-wider text-muted-foreground-strong uppercase">
              {t("relatedTitle")}
            </h2>
            <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-5">
              {relatedProducts.map((p) => (
                <ShelfTile key={p.id} product={p} />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {/* กันแถบสรุปตรึงขอบล่างทับเนื้อหาท้ายหน้า (เฉพาะเมื่อมีแถบจริง = เลือกแพ็กเกจแล้ว) */}
      {selected ? (
        <div
          aria-hidden
          className="h-[calc(84px+env(safe-area-inset-bottom))] lg:hidden"
        />
      ) : null}

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
        fee={pendingPayload?.paymentFee ?? 0}
        paymentLabel={pendingPayload?.paymentLabel}
        reviewRows={reviewRows}
        buying={buying}
        onConfirm={() => {
          if (pendingPayload) void handleBuy(pendingPayload);
        }}
      />
    </div>
  );
}
