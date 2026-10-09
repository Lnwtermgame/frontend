"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { assetUrl } from "@/lib/asset-url";
import { formatTHB } from "@/lib/pricing";
import type { ProductTypePublic } from "@/lib/api/products";

/**
 * แยกกลุ่มนิยามแบบ SEAGM: "เติมเงินโทรศัพท์" (credits) / "ชุดข้อมูล" (data/internet)
 * ชื่อที่มีคำว่า internet/data/MB/GB/Mbps/unlimited = กลุ่มข้อมูล ที่เหลือเป็น credits
 */
function isDataPack(name: string): boolean {
  return /internet|data|mb|gb|mps|unlimited|bundle/i.test(name);
}

function DenomCard({
  type,
  selected,
  onSelect,
}: {
  type: ProductTypePublic;
  selected: boolean;
  onSelect: (t: ProductTypePublic) => void;
}) {
  const t = useTranslations("mobileRecharge");
  // ราคาเดิมโชว์ขีดฆ่าใต้ราคาขาย เมื่อต่างกันจริง (ปัดเศษก่อนเทียบกัน noise ทศนิยม)
  const strike =
    type.originPrice &&
    Math.round(type.originPrice) > Math.round(type.displayPrice);

  // รูปค่าเงินประจำแพ็กเกจ — ไม่มีรูป = ไม่มี element รูปเลย (ไม่ใช้ placeholder)
  const img = type.imageUrl ?? null;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={!type.hasStock}
      aria-disabled={!type.hasStock}
      onClick={() => onSelect(type)}
      // กรอบชั้นเดียว (inset-ring) ทุก state — ห้ามซ้อน border + inset-ring เพราะ anti-alias
      // ของสองชั้นที่มุมโค้งไม่ตรงกัน เกิดเส้นขาวรั่วที่มุม; dashed ใช้ outline (ไม่กินพื้นที่) ขนาดเท่ากันทุก state
      className={`flex min-w-0 items-center gap-3 rounded-[10px] p-2.5 pr-3.5 text-left transition-[box-shadow,background-color] duration-150 ease-soft disabled:cursor-not-allowed ${
        !type.hasStock
          ? "outline-1 outline-dashed -outline-offset-1 outline-border/70 opacity-50"
          : selected
            ? "bg-primary/5 inset-ring-2 inset-ring-primary"
            : "inset-ring inset-ring-border hover:bg-primary/5 hover:inset-ring-primary/40"
      }`}
    >
      {img && (
        <span className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-card">
          <Image
            src={assetUrl(img)}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
          />
        </span>
      )}
      <span className="min-w-0 flex-1 text-[13px] leading-snug font-semibold line-clamp-2">
        {type.name}
      </span>
      {!type.hasStock ? (
        // หมดstock = บอกเหตุชัดแทนราคา (กดไม่ได้ทำไมราคายังอยู่) — ป้ายเดียวกับ operator-list
        <Badge variant="secondary" className="max-w-[9rem] shrink-0 truncate">
          {t("temporarilyUnavailable")}
        </Badge>
      ) : (
        <span className="flex shrink-0 flex-col items-end">
          <span className="num text-sm font-bold text-primary">
            {formatTHB(type.displayPrice)}
          </span>
          {strike && type.originPrice !== undefined && (
            <span className="num text-2xs font-semibold text-muted-foreground line-through">
              {formatTHB(type.originPrice)}
            </span>
          )}
        </span>
      )}
    </button>
  );
}

/**
 * เลือกนิยาม (SEAGM-style) — แถวแนวนอน 2 การ์ดต่อแถว แสดงครบทุกแพ็กเกจ ไม่มีการย่อ
 * รูปค่าเงินแสดงเฉพาะแพ็กเกจที่แอดมินใส่รูปไว้เท่านั้น
 */
export function PackageGrid({
  types,
  selectedId,
  onSelect,
}: {
  types: ProductTypePublic[];
  selectedId: string | null;
  onSelect: (t: ProductTypePublic) => void;
}) {
  const t = useTranslations("mobileRecharge");

  const { credits, data } = useMemo(() => {
    const credits: ProductTypePublic[] = [];
    const data: ProductTypePublic[] = [];
    for (const ty of types) (isDataPack(ty.name) ? data : credits).push(ty);
    return { credits, data };
  }, [types]);

  const group = (
    items: ProductTypePublic[],
    label: string,
    // หัวกลุ่มโผล่เฉพาะเมื่อมีสองกลุ่มจริง (credits + data) — กลุ่มเดียวหัวเป็น noise
    // และป้ายจาก namespace mobileRecharge ("เติมเงินโทรศัพท์") อ่านผิดบริบทบนหน้าเกม
    showHeader: boolean,
  ) => {
    if (!items.length) return null;
    return (
      <section>
        {showHeader ? (
          <h3 className="flex items-center gap-2 text-sm font-bold">
            {label}
            {/* จำนวนแพ็กเกจจริงในกลุ่ม — ชิปขอบเพราะ bg-muted ทับ bg-card มองไม่เห็น */}
            <span className="num rounded-full border border-border/80 px-1.5 text-2xs leading-4 font-semibold text-muted-foreground">
              {items.length}
            </span>
          </h3>
        ) : null}
        <div
          className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2"
          role="radiogroup"
          aria-label={showHeader ? label : undefined}
        >
          {items.map((ty) => (
            <DenomCard
              key={ty.id}
              type={ty}
              selected={ty.id === selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      </section>
    );
  };

  if (!credits.length && !data.length) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        {t("noDenominations")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {group(credits, t("groupCredits"), data.length > 0)}
      {group(data, t("groupData"), credits.length > 0)}
    </div>
  );
}
