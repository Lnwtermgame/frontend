"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { formatTHB } from "@/lib/pricing";
import type { ProductTypePublic } from "@/lib/api/products";

const FOLD_COUNT = 12;

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
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={!type.hasStock}
      aria-disabled={!type.hasStock}
      onClick={() => onSelect(type)}
      className={`rounded-[10px] border p-3 text-left transition-[border-color,background-color] duration-150 ease-soft disabled:cursor-not-allowed ${
        !type.hasStock
          ? "border-dashed border-border/70 opacity-50"
          : selected
            ? "border-primary bg-primary/5 ring-2 ring-primary ring-inset"
            : "border-border hover:border-primary/40 hover:bg-primary/5"
      }`}
    >
      {/* Thai ต้อง leading สูงกว่า 1.2 — สระ/วรรณยุกต์บน-ล่างโดนตัดถ้าแน่นเกิน */}
      <span className="line-clamp-2 min-h-[2.9em] text-xs leading-[1.45em] font-semibold">
        {type.name}
      </span>
      {type.hasStock ? (
        <span className="num mt-2 block text-sm font-bold text-primary">
          {formatTHB(type.displayPrice)}
        </span>
      ) : (
        // หมดstock = บอกเหตุชัดแทนแค่หรี่การ์ด (กดไม่ได้ทำไมราคายังอยู่) —
        // ป้ายเดียวกับ operator-list ให้อ่านเป็นระบบเดียวกัน แคบก็ตัดด้วย ellipsis
        <Badge variant="secondary" className="mt-2 max-w-full truncate">
          {t("temporarilyUnavailable")}
        </Badge>
      )}
    </button>
  );
}

/**
 * ขั้น 4 — เลือกนิยาม (SEAGM-style)
 * Grid 2 คอลัมน์ แบ่งกลุ่ม credits/data แต่ละกลุ่มพับได้ที่ 12 การ์ดแรก
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
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);

  const { credits, data } = useMemo(() => {
    const credits: ProductTypePublic[] = [];
    const data: ProductTypePublic[] = [];
    for (const ty of types) (isDataPack(ty.name) ? data : credits).push(ty);
    return { credits, data };
  }, [types]);

  const group = (
    items: ProductTypePublic[],
    label: string,
    open: boolean,
    setOpen: (v: boolean) => void,
    // หัวกลุ่มโผล่เฉพาะเมื่อมีสองกลุ่มจริง (credits + data) — กลุ่มเดียวหัวเป็น noise
    // และป้ายจาก namespace mobileRecharge ("เติมเงินโทรศัพท์") อ่านผิดบริบทบนหน้าเกม
    showHeader: boolean,
  ) => {
    if (!items.length) return null;
    const visible = open ? items : items.slice(0, FOLD_COUNT);
    const foldable = items.length > FOLD_COUNT;
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
          className={showHeader ? "mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4" : "grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4"}
          role="radiogroup"
          aria-label={showHeader ? label : undefined}
        >
          {visible.map((ty) => (
            <DenomCard
              key={ty.id}
              type={ty}
              selected={ty.id === selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
        {foldable ? (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-[10px] border border-transparent text-xs font-semibold text-primary transition-colors hover:border-border hover:bg-primary/10"
          >
            {open ? t("showLess") : t("showMore", { count: items.length })}
            <ChevronDown
              aria-hidden
              className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
        ) : null}
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
      {group(credits, t("groupCredits"), creditsOpen, setCreditsOpen, data.length > 0)}
      {group(data, t("groupData"), dataOpen, setDataOpen, credits.length > 0)}
    </div>
  );
}
