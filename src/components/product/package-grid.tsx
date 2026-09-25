"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
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
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={!type.hasStock}
      onClick={() => onSelect(type)}
      className={`rounded-[6px] p-3 text-left transition-shadow disabled:cursor-not-allowed disabled:opacity-50 ${
        !type.hasStock
          ? "bg-muted/30"
          : selected
            ? "bg-muted/60 ring-2 ring-primary ring-inset"
            : "bg-muted/60 hover:bg-muted"
      }`}
    >
      <span className="line-clamp-2 min-h-[2.4em] text-[12.5px] leading-[1.2em] font-bold">
        {type.name}
      </span>
      <span className="num mt-1.5 block text-[13px] font-bold text-primary">
        {formatTHB(type.displayPrice)}
      </span>
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
  ) => {
    if (!items.length) return null;
    const visible = open ? items : items.slice(0, FOLD_COUNT);
    const foldable = items.length > FOLD_COUNT;
    return (
      <section>
        <h3 className="text-[13px] font-bold">{label}</h3>
        <div className="mt-2 grid grid-cols-2 gap-2.5" role="radiogroup" aria-label={label}>
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
            className="mt-2.5 flex h-11 w-full items-center justify-center gap-1 text-[12.5px] font-semibold text-primary underline-offset-4 hover:underline"
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
    <div className="flex flex-col gap-5">
      {group(credits, t("groupCredits"), creditsOpen, setCreditsOpen)}
      {group(data, t("groupData"), dataOpen, setDataOpen)}
    </div>
  );
}
