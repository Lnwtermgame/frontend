"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { cn } from "cn";
import { Link, routing, usePathname } from "@/i18n/routing";

/** ชื่อภาษาแบบ endonym — ตั้งใจไม่แปลตาม locale (ไทย = "ไทย" เสมอ, English = "English" เสมอ)
 *  ผู้ใช้ต้องอ่านออกได้แม้หน้าตาเป็นภาษาอื่นที่ตัวเองไม่รู้จัก */
const LOCALE_META: Record<string, { code: string; name: string }> = {
  th: { code: "TH", name: "ไทย" },
  en: { code: "EN", name: "English" },
};

/** สวิตช์ภาษาแบบ segmented control
 *  - เป็น <a> จริง (ไม่ใช่ button + router.replace) → middle-click/open-in-new-tab ได้,
 *    prefetch ล่วงหน้าทำให้สลับแล้วรู้สึกทันที และมี hreflang ให้ crawler เห็น alternate
 *  - next-intl usePathname คืน path ภายใน (ไม่มี prefix /th /en) — Link จัดการ prefix เอง
 *  - คง search params ไว้ตอนสลับ (?q= ฯลฯ)
 *  - ต้องถูกครอบด้วย <Suspense> (useSearchParams) — site-header จัดให้แล้ว
 *  @param variant "compact" = header (ตัวย่อ), "wide" = drawer มือถือ (ชื่อเต็ม เต็มความกว้าง) */
export function LanguageSwitcher({
  className,
  variant = "compact",
}: {
  className?: string;
  variant?: "compact" | "wide";
}) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = searchParams.toString();
  const wide = variant === "wide";

  return (
    <div
      role="group"
      aria-label={t("language")}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-border/70 bg-muted p-0.5",
        className,
      )}
    >
      {routing.locales.map((loc) => {
        const active = loc === locale;
        const meta = LOCALE_META[loc] ?? { code: loc, name: loc };
        return (
          <Link
            key={loc}
            href={query ? { pathname, query } : { pathname }}
            locale={loc}
            hrefLang={loc}
            title={wide ? undefined : meta.name}
            aria-label={t("switchTo", { language: meta.name })}
            aria-current={active ? "true" : undefined}
            className={cn(
              "min-w-11 flex-1 rounded-full px-2.5 text-center text-xs font-bold whitespace-nowrap select-none",
              "outline-none transition-all duration-150 ease-soft active:translate-y-px",
              "focus-visible:ring-2 focus-visible:ring-ring/60",
              wide ? "min-h-11 py-2" : "min-h-7 py-1.5",
              active
                ? "bg-background text-primary shadow-[0_1px_2px_rgb(16_24_40/0.08),0_1px_1px_rgb(16_24_40/0.04)] ring-1 ring-foreground/[0.06]"
                : "text-muted-foreground-strong hover:bg-background/70 hover:text-foreground",
            )}
          >
            {/* meta.code เป็นตัวพิมพ์ใหญ่ในตัวเองอยู่แล้ว — ไม่ใส่ uppercase ทั้งบล็อก
                ไม่งั้นชื่อเต็มอย่าง "English" จะกลายเป็น "ENGLISH" */}
            {wide ? meta.name : meta.code}
          </Link>
        );
      })}
    </div>
  );
}
