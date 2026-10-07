"use client";

import { useEffect, useState } from "react";
import { Check, Heart, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { GameCover, coverDnaFor } from "@/components/product/game-cover";
import { extractDominantColor, shadeDarker } from "@/lib/color-extract";
import { assetUrl } from "@/lib/asset-url";
import type { Product } from "@/lib/api/products";

/** คีย์ป้ายประเภทสินค้าต่อ productType (แปลผ่าน product.type_*) */
const TYPE_LABEL_KEY: Record<Product["productType"], "type_DIRECT_TOPUP" | "type_CARD" | "type_MOBILE_RECHARGE"> = {
  DIRECT_TOPUP: "type_DIRECT_TOPUP",
  CARD: "type_CARD",
  MOBILE_RECHARGE: "type_MOBILE_RECHARGE",
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
  const fallbackSub = t(TYPE_LABEL_KEY[product.productType]);
  const dna = coverDnaFor(product.name, fallbackSub);
  const details = product.gameDetails;

  // มีรูปจริง → ดึงสีเด่นจากรูปมาใช้แทนสี DNA (DNA คือค่าเริ่มต้น + fallback
  // เมื่อรูปเป็นขาวดำหรืออ่านไม่ได้)
  /* accent ผูกกับ imageUrl ที่คำนวณได้ — derive ตอน render แทนการ reset ใน effect
     (รูปเปลี่ยน = accent เดิตหมดอายุทันที ไม่ flash สีเก่า) */
  const [accentEntry, setAccentEntry] = useState<{ img: string; color: string | null } | null>(null);
  const accent = accentEntry && accentEntry.img === product.imageUrl ? accentEntry.color : null;
  useEffect(() => {
    const img = product.imageUrl;
    if (!img) return;
    let alive = true;
    extractDominantColor(assetUrl(img))
      .then((hex) => {
        if (alive) setAccentEntry({ img, color: hex });
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
            fallbackSub={fallbackSub}
            sizes="92px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold tracking-tight">
            {product.name}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-2xs font-bold text-primary">
              {fallbackSub}
            </span>
            {product.category?.name ? (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-2xs font-bold text-muted-foreground">
                {product.category.name}
              </span>
            ) : null}
            {product.isBestseller ? (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-2xs font-bold text-muted-foreground">
                {t("bestseller")}
              </span>
            ) : null}
            <span>{t("autoDelivery")}</span>
          </div>
          {metaItems.length > 0 ? (
            <div className="mt-3 hidden flex-wrap gap-x-5 gap-y-1 text-2xs text-muted-foreground-strong sm:flex">
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
            className={`min-h-11 gap-1.5 text-xs md:min-h-7 ${isFavorite ? "border-primary text-primary" : ""}`}
          >
            <Heart className={`size-4 ${isFavorite ? "fill-primary text-primary" : ""}`} />
            <span>{isFavorite ? t("favorited") : t("favorite")}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCopyLink}
            className="min-h-11 gap-1.5 text-xs md:min-h-7"
          >
            {copied ? <Check className="size-4 text-status-success" /> : <Share2 className="size-4" />}
            <span>{copied ? t("copied") : t("share")}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
