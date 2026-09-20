"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CountryMeta } from "@/lib/mobile-countries";

/**
 * ขั้น 1 — เลือกประเทศผู้รับ
 * ตัวเลือกมีเฉพาะประเทศที่มีสินค้า MOBILE_RECHARGE จริง (ส่งเข้ามาจาก grouping)
 */
export function CountrySelect({
  countries,
  value,
  onChange,
  disabled,
}: {
  countries: CountryMeta[];
  value: string | null;
  onChange: (code: string) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("mobileRecharge");
  const locale = useLocale();

  return (
    <Select
      value={value ?? ""}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger
        aria-label={t("stepCountry")}
        className="data-[size=default]:h-11 lg:data-[size=default]:h-10"
      >
        <SelectValue placeholder={t("countryPlaceholder")} />
      </SelectTrigger>
      <SelectContent>
        {countries.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            <span className="flex items-center gap-2">
              <span aria-hidden>{c.flag}</span>
              {locale === "th" ? c.nameTh : c.nameEn}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
