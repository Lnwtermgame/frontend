"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
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

/** ภูมิภาค → ข้อความ badge + สี (ไม่ใช้ emoji ธง — บาง OS ไม่ render) */
const REGION_BADGE: Record<NonNullable<Product["region"]>, { label: string; className: string }> = {
  THAILAND: { label: "TH", className: "bg-blue-600/90 text-white" },
  MALAYSIA: { label: "MY", className: "bg-amber-500/90 text-black" },
  GLOBAL: { label: "GLOBAL", className: "bg-neutral-800/80 text-white" },
};

/** แถบ tile ไร้กรอบ (ปกสี + ชื่อ + หมวด + ราคาจริง) — ภาษาเดียวกับ landing
 *  ใช้ร่วมกันทั้ง ProductShelf (หน้าแรก) และ catalog sidebar grid */
export function ShelfTile({ product }: { product: Product }) {
  const t = useTranslations("home");
  const types = product.types ?? [];
  const cheapest = types.length
    ? types.reduce((a, b) => (a.displayPrice <= b.displayPrice ? a : b))
    : null;
  const regionBadge = product.region ? REGION_BADGE[product.region] : null;

  return (
    <Link
      href={`${BASE_BY_TYPE[product.productType]}/${product.slug}`}
      className="group flex min-w-0 flex-col gap-1.5"
    >
      <div className="relative transition-transform duration-150 group-hover:-translate-y-1">
        <GameCover
          name={product.name}
          imageUrl={product.imageUrl}
          fallbackSub={FALLBACK_SUB[product.productType]}
          sizes="(max-width: 640px) 30vw, (max-width: 1024px) 25vw, 160px"
        />
        {regionBadge && (
          <span
            className={`num absolute right-1.5 top-1.5 rounded-[5px] px-1.5 py-[2px] text-[9.5px] font-extrabold tracking-wide backdrop-blur-sm ${regionBadge.className}`}
          >
            {regionBadge.label}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold">{product.name}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {product.gameType ?? product.category?.name ?? FALLBACK_SUB[product.productType]}
        </p>
        {cheapest && (
          <p className="num mt-0.5 text-[12.5px] font-bold text-primary">
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
