"use client";

import { useLocale, useTranslations } from "next-intl";
import { RegionFlagIcon } from "@/components/product/region-flag-icon";
import type { CountryMeta } from "@/lib/mobile-countries";

/**
 * ขั้น 1 — เลือกประเทศผู้รับ (SEAGM-style card grid)
 * ทุกประเทศที่มีสินค้าแสดงเป็นการ์ด 2 คอลัมน์ตั้งแต่โหลด: ธง + ชื่อ + รหัสโทร
 * การ์ดที่เลือก = ring inset 2px สี primary — ภาษาเดียวกับ OperatorList
 * ธงเป็น SVG จากชุด nucleo-flags (ไม่ใช้อีโมจิ) — เรนเดอร์เหมือนกันทุกแพลตฟอร์ม
 */
export function CountrySelect({
  countries,
  value,
  onChange,
  disabled,
}: {
  countries: (CountryMeta & { operatorCount?: number })[];
  value: string | null;
  onChange: (code: string) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("mobileRecharge");
  const locale = useLocale();
  const name = (c: CountryMeta) => (locale === "th" ? c.nameTh : c.nameEn);

  return (
    <div
      className="grid grid-cols-2 gap-2.5"
      role="radiogroup"
      aria-label={t("stepCountry")}
    >
      {countries.map((c) => {
        const selected = c.code === value;
        return (
          <button
            key={c.code}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(c.code)}
            className={`flex items-center gap-3 rounded-[6px] p-2.5 text-left transition-shadow disabled:cursor-not-allowed disabled:opacity-50 ${
              selected
                ? "bg-muted/60 ring-2 ring-primary ring-inset"
                : "bg-muted/60 hover:bg-muted"
            }`}
          >
            <span
              aria-hidden
              className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[6px] bg-white p-1 shadow-sm"
            >
              <RegionFlagIcon
                code={c.code.toLowerCase()}
                className="h-auto w-full"
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-bold">
                {name(c)}
              </span>
              <span className="num block text-[12px] font-semibold text-muted-foreground">
                +{c.callingCode}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
