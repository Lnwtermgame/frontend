"use client";

import { useEffect, useState } from "react";
import { Check, Heart, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { GameCover, coverDnaFor } from "@/components/product/game-cover";
import { extractDominantColor, shadeDarker } from "@/lib/color-extract";
import type { Product } from "@/lib/api/products";

const FALLBACK_SUB: Record<Product["productType"], string> = {
  DIRECT_TOPUP: "เติมตรง",
  CARD: "บัตรเติมเงิน",
  MOBILE_RECHARGE: "เติมมือถือ",
};

/** แถบสีประจำเกมเต็มความกว้างใต้ header — สีมาจากระบบปก (coverDnaFor)
 *  เปลี่ยนโทนตามเกมอัตโนมัติ เช่น PUBG ดำ-ทอง, Free Fire แดง-ส้ม */
export function ProductBand({
  product,
  isFavorite,
  favLoading,
  copied,
  onToggleFavorite,
  onCopyLink,
}: {
  product: Product;
  isFavorite: boolean;
  favLoading: boolean;
  copied: boolean;
  onToggleFavorite: () => void;
  onCopyLink: () => void;
}) {
  const t = useTranslations("product");
  const dna = coverDnaFor(product.name, FALLBACK_SUB[product.productType]);
  const details = product.gameDetails;

  // มีรูปจริง → ดึงสีเด่นจากรูปมาใช้แทนสี DNA (DNA คือค่าเริ่มต้น + fallback
  // เมื่อรูปเป็นขาวดำหรืออ่านไม่ได้)
  const [accent, setAccent] = useState<string | null>(null);
  useEffect(() => {
    setAccent(null);
    if (!product.imageUrl) return;
    let alive = true;
    extractDominantColor(product.imageUrl)
      .then((hex) => {
        if (alive) setAccent(hex);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [product.imageUrl]);

  const c1 = accent ?? dna.c1;
  const c2 = accent ? shadeDarker(accent) : dna.c2;

  const metaItems = [
    details?.developer && { label: t("metaDeveloper"), value: details.developer },
    details?.platforms?.length && {
      label: t("metaPlatforms"),
      value: details.platforms.join(" · "),
    },
    details?.publisher && { label: t("metaPublisher"), value: details.publisher },
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <div
      className="relative overflow-hidden border-b border-border/60"
      style={{ background: `color-mix(in oklab, ${c1} 16%, var(--background))` }}
    >
      {/* รูปทรงเฉียงประดับ — สีรองของเกม */}
      <span
        aria-hidden
        className="absolute -top-[40%] -right-[6%] h-[190%] w-[38%] rotate-[16deg]"
        style={{ background: `color-mix(in oklab, ${c2} 20%, transparent)` }}
      />
      <span
        aria-hidden
        className="absolute -top-[40%] right-[16%] h-[190%] w-[10%] rotate-[16deg]"
        style={{ background: `color-mix(in oklab, ${c1} 32%, transparent)` }}
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-wrap items-center gap-4 px-4 py-6 sm:gap-5">
        <div className="w-[84px] shrink-0 sm:w-[92px]">
          <GameCover
            name={product.name}
            imageUrl={product.imageUrl}
            fallbackSub={FALLBACK_SUB[product.productType]}
            sizes="92px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-extrabold tracking-tight sm:text-2xl">
            {product.name}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground">
            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-bold text-primary">
              {FALLBACK_SUB[product.productType]}
            </span>
            {product.category?.name ? (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                {product.category.name}
              </span>
            ) : null}
            {product.isBestseller ? (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                ขายดี
              </span>
            ) : null}
            <span>{t("autoDelivery")}</span>
          </div>
          {metaItems.length > 0 ? (
            <div className="mt-3 hidden flex-wrap gap-x-5 gap-y-1 text-[11.5px] text-muted-foreground/70 sm:flex">
              {metaItems.map((m) => (
                <span key={m.label}>
                  {m.label}
                  <b className="ml-1.5 font-semibold text-muted-foreground">{m.value}</b>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={favLoading}
            onClick={onToggleFavorite}
            className={`gap-1.5 text-xs ${isFavorite ? "border-primary text-primary" : ""}`}
          >
            <Heart className={`size-4 ${isFavorite ? "fill-primary text-primary" : ""}`} />
            <span>{isFavorite ? "ถูกใจแล้ว" : "ถูกใจ"}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onCopyLink} className="gap-1.5 text-xs">
            {copied ? <Check className="size-4 text-status-success" /> : <Share2 className="size-4" />}
            <span>{copied ? "คัดลอกแล้ว" : "แชร์"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
