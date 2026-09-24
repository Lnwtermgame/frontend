"use client";

import { useTranslations } from "next-intl";
import { CircleAlert } from "lucide-react";
import type { CountryMeta } from "@/lib/mobile-countries";
import { isPhoneValid, normalizePhone } from "@/lib/mobile-recharge";

/**
 * ขั้น 2 — เบอร์ผู้รับ (SEAGM-style)
 * Field เดียว: +<callingCode> ฝังด้านใน (อ่านอย่างเดียว) + ช่องพิมพ์เบอร์
 * สูง 48px คงที่ตาม field ประเทศ
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
  const tooShort = value.length > 0 && !isPhoneValid(value);
  const invalid = invalidHighlight || tooShort;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        className={`flex h-12 items-stretch overflow-hidden rounded-[6px] bg-muted/60 transition-colors focus-within:ring-2 focus-within:ring-ring/40 ${
          invalid ? "ring-2 ring-destructive/60" : ""
        } lg:h-10`}
      >
        <span
          className={`num flex items-center border-r border-border/60 px-3.5 text-[14px] font-semibold select-none ${
            invalid ? "text-destructive" : "text-foreground/80"
          }`}
        >
          +{country.callingCode}
        </span>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          aria-label={t("stepPhone")}
          aria-invalid={invalid}
          value={value}
          onChange={(e) => onChange(normalizePhone(e.target.value, country.callingCode))}
          placeholder={t("phonePlaceholder")}
          className="num h-full min-w-0 flex-1 bg-transparent px-3 text-[14px] outline-none placeholder:text-muted-foreground"
        />
      </label>
      {invalid ? (
        <p role="alert" className="flex items-center gap-1.5 text-xs text-destructive">
          <CircleAlert className="size-3.5 shrink-0" aria-hidden />
          {t("phoneTooShort")}
        </p>
      ) : null}
    </div>
  );
}
