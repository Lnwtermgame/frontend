"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { GameCover } from "@/components/product/game-cover";
import { RegionFlag } from "@/components/product/region-flag";
import type { Product } from "@/lib/api/products";

const BASE_BY_TYPE: Record<Product["productType"], string> = {
  DIRECT_TOPUP: "/games",
  CARD: "/card",
  MOBILE_RECHARGE: "/mobile-recharge",
};

/** คีย์ป้ายประเภทสินค้าต่อ productType (แปลผ่าน product.type_*) */
const TYPE_LABEL_KEY: Record<Product["productType"], "type_DIRECT_TOPUP" | "type_CARD" | "type_MOBILE_RECHARGE"> = {
  DIRECT_TOPUP: "type_DIRECT_TOPUP",
  CARD: "type_CARD",
  MOBILE_RECHARGE: "type_MOBILE_RECHARGE",
};

const THB = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

/** ภูมิภาคที่แสดงธงบนการ์ด — GLOBAL ไม่มีธง (ไม่ผูกประเทศ) จึงไม่อยู่ในรายการ */
const FLAGGED_REGIONS = new Set(["THAILAND", "MALAYSIA"]);

/** แถบ tile ไร้กรอบ (ปกสี + ชื่อ + หมวด + ราคาจริง) — ภาษาเดียวกับ landing
 *  ใช้ร่วมกันทั้ง ProductShelf (หน้าแรก) และ catalog sidebar grid */
export function ShelfTile({ product }: { product: Product }) {
  const t = useTranslations("home");
  const tp = useTranslations("product");
  const types = product.types ?? [];
  const cheapest = types.length
    ? types.reduce((a, b) => (a.displayPrice <= b.displayPrice ? a : b))
    : null;
  const showFlag = !!product.region && FLAGGED_REGIONS.has(product.region);

  return (
    <Link
      href={`${BASE_BY_TYPE[product.productType]}/${product.slug}`}
      className="group block min-w-0 overflow-hidden rounded-[14px] border border-border/60 bg-card shadow-(--shadow-tile) transition-[border-color] duration-150 ease-soft hover:border-primary/45"
    >
      {/* แบบ C · ราคาบนปก — pill ราคาลอยมุมล่างซ้ายบนปก (ขาวโปร่ง → hover ส้มทึบ)
          ให้ราคาถูกเห็นก่อนชื่อ ตัดสินใจจากราคาได้โดยไม่ต้องอ่านตัวหนังสือ */}
      <div className="relative">
        <GameCover
          name={product.name}
          imageUrl={product.imageUrl}
          fallbackSub={tp(TYPE_LABEL_KEY[product.productType])}
          sizes="(max-width: 640px) 30vw, (max-width: 1024px) 25vw, 160px"
          flush
          compact
        />
        {showFlag && product.region && (
          <span
            className="absolute top-1.5 right-1.5 z-10 inline-flex items-center justify-center overflow-hidden rounded-[4px] shadow-sm transition-transform group-hover:scale-105"
            title={product.region}
          >
            {/* กำหนดความกว้างอย่างเดียว ความสูงคิดตามสัดส่วนจริงของธง (5:4) ให้เอง
                ปัจจุบันได้ 18×14.4px — ต้องอาศัย width/height ที่ส่งเข้า RegionFlagIcon
                เพราะไอคอนจาก vendor ตั้ง 32px ไว้ ทำให้ถ้าไม่ทับจะเป็นจัตุรัส 1:1 */}
            <RegionFlag region={product.region} className="h-auto w-[18px]" />
          </span>
        )}
        {cheapest && (
          <span
            className="num absolute bottom-1.5 left-1.5 z-10 inline-flex max-w-[calc(100%-12px)] items-baseline gap-0.5 rounded-full bg-white/90 px-2 py-[3px] text-2xs leading-none font-bold text-primary shadow-[0_2px_8px_rgb(16_24_40/0.18)] backdrop-blur-sm transition-colors duration-150 group-hover:bg-primary group-hover:text-primary-foreground"
          >
            <span className="truncate">{THB.format(cheapest.displayPrice)}</span>
            {cheapest.originPrice &&
              Math.round(cheapest.originPrice) > Math.round(cheapest.displayPrice) && (
                <span className="num text-[10px] font-semibold line-through opacity-70">
                  {THB.format(cheapest.originPrice)}
                </span>
              )}
            <span className="text-[10px] font-semibold opacity-75">{t("andUp")}</span>
          </span>
        )}
      </div>
      <div className="min-w-0 p-2.5 pb-3">
        <p className="truncate text-xs font-semibold">{product.name}</p>
        <p className="truncate text-2xs text-muted-foreground">
          {product.gameType ?? product.category?.name ?? tp(TYPE_LABEL_KEY[product.productType])}
        </p>
      </div>
    </Link>
  );
}
