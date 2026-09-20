"use client";

import { useTranslations } from "next-intl";
import { CircleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { CountryMeta } from "@/lib/mobile-countries";
import { isPhoneValid, normalizePhone } from "@/lib/mobile-recharge";

/**
 * ขั้น 2 — เบอร์ผู้รับ
 * Prefix +<callingCode> อ่านอย่างเดียว (คงที่ตามประเทศที่เลือก) ผู้ใช้พิมพ์แต่ตัวเบอร์
 * เตือนขอบแดงเมื่อพิมพ์ยังไม่ครบ 8 หลัก / step ถือว่าเสร็จเมื่อผ่าน isPhoneValid
 */
export function PhoneInput({
  country,
  value,
  onChange,
  invalidHighlight,
}: {
  country: CountryMeta;
  value: string;
  onChange: (phone: string) => void;
  /** true เมื่อ backend ตอบว่าเบอร์ไม่ถูกต้อง — บังคับแสดงสถานะผิดพลาด */
  invalidHighlight?: boolean;
}) {
  const t = useTranslations("mobileRecharge");
  const tooShort = value.length > 0 && value.length < 8;
  const invalid = invalidHighlight || tooShort;

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={`flex items-stretch overflow-hidden rounded-[10px] border transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/25 ${
          invalid ? "border-destructive" : "border-input"
        }`}
      >
        <span
          className={`num flex min-w-[64px] items-center justify-center gap-1.5 border-r px-3 text-sm font-semibold ${
            invalid ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          <span aria-hidden className="text-base leading-none">{country.flag}</span>
          +{country.callingCode}
        </span>
        <Input
          type="text"
          inputMode="numeric"
          autoComplete="tel-national"
          aria-label={t("stepPhone")}
          aria-invalid={invalid}
          value={value}
          onChange={(e) => onChange(normalizePhone(e.target.value, country.callingCode))}
          placeholder={t("phonePlaceholder")}
          className="num h-11 min-w-0 flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-60 lg:h-10"
        />
      </div>
      {invalid ? (
        <p role="alert" className="flex items-center gap-1.5 text-xs text-destructive">
          <CircleAlert className="size-3.5 shrink-0" aria-hidden />
          {t("phoneTooShort")}
        </p>
      ) : null}
    </div>
  );
}
