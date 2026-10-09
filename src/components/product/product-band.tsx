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

/** ความสว่างโดยประมาณของ hex (#rrggbb) — 0-255 ใช้เลือกสีตัวหนังสือบน band พอ */
function hexLuma(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
}

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

  // band เป็น "โปสเตอร์เกม" พื้นสีจริงของปก — ตัวหนังสือเลือกขาว/หมึกเข้มตามความสว่าง
  // ของ c1 (DNA บางเกมสีอ่อน เช่น Identity V ครีม ขาวบนครีมจะมองไม่เห็น)
  const bandInk = hexLuma(c1) > 150 ? "#292524" : "#ffffff";

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
      className="relative overflow-hidden"
      style={{ background: `linear-gradient(100deg, ${c1}, ${c2})`, color: bandInk }}
    >
      {/* รูปทรงเฉียงประดับ — แสงโปร่งสี bandInk บนพื้นสีเกม ให้ผิวมีมิติแบบโปสเตอร์ */}
      <span
        aria-hidden
        className="absolute -top-[40%] -right-[6%] h-[190%] w-[38%] rotate-[16deg]"
        style={{ background: `color-mix(in srgb, ${bandInk} 7%, transparent)` }}
      />
      <span
        aria-hidden
        className="absolute -top-[40%] right-[16%] h-[190%] w-[10%] rotate-[16deg]"
        style={{ background: `color-mix(in srgb, ${bandInk} 12%, transparent)` }}
      />

      {/* มือถือ: สองแถวชัด ๆ — (ปก+ชื่อ) แล้ว (ปุ่มเต็มแถว) เดิม flex-wrap เดาไม่ได้
          title block หดจน h1 ตัดคำสี่บรรทัดและปุ่มทับตัวหนังสือ / เดสก์ท็อป: แถวเดียวเหมือนเดิม */}
      <div className="relative mx-auto flex w-full max-w-6xl flex-col px-4 py-5 sm:flex-row sm:items-center sm:gap-5 sm:py-6">
        <div className="flex min-w-0 items-center gap-4 sm:flex-1">
          <div className="w-[84px] shrink-0 sm:w-[92px]">
            <GameCover
              name={product.name}
              imageUrl={product.imageUrl}
              fallbackSub={fallbackSub}
              sizes="92px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
              {product.name}
            </h1>
            {/* ชิปบนพื้นสีเกม — แก้วขาวโปร่ง สีตัวหนังสือตาม bandInk ไม่ใช้ token เทาที่จมกับพื้นเข้ม */}
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-2xs font-bold">
                {fallbackSub}
              </span>
              {product.category?.name ? (
                <span className="rounded-full bg-white/12 px-2.5 py-0.5 text-2xs font-bold">
                  {product.category.name}
                </span>
              ) : null}
              {product.isBestseller ? (
                <span className="rounded-full bg-white/12 px-2.5 py-0.5 text-2xs font-bold">
                  {t("bestseller")}
                </span>
              ) : null}
              <span className="opacity-80">{t("autoDelivery")}</span>
            </div>
            {metaItems.length > 0 ? (
              <div className="mt-3 hidden flex-wrap gap-x-5 gap-y-1 text-2xs opacity-75 sm:flex">
                {metaItems.map((m) => (
                  <span key={m.label}>
                    {m.label}
                    <b className="ml-1.5 font-semibold">{m.value}</b>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex shrink-0 items-center gap-2 sm:ml-auto sm:mt-0">
          <Button
            variant="outline"
            size="sm"
            disabled={favLoading}
            onClick={onToggleFavorite}
            className={`min-h-11 flex-1 justify-center gap-1.5 text-xs text-foreground sm:flex-none md:min-h-7 ${isFavorite ? "border-primary text-primary" : ""}`}
          >
            <Heart className={`size-4 ${isFavorite ? "fill-primary text-primary" : ""}`} />
            <span>{isFavorite ? t("favorited") : t("favorite")}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCopyLink}
            className="min-h-11 flex-1 justify-center gap-1.5 text-xs text-foreground sm:flex-none md:min-h-7"
          >
            {copied ? <Check className="size-4 text-status-success" /> : <Share2 className="size-4" />}
            <span>{copied ? t("copied") : t("share")}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
