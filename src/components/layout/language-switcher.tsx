"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { routing, usePathname, useRouter } from "@/i18n/routing";

/** สวิตช์ภาษา TH | EN แบบ segmented control
 *  - next-intl usePathname คืน path ภายใน (ไม่มี prefix /th /en)
 *    router.replace จะจัดการ prefix ของ locale ให้เอง
 *  - ต้องคง search params ไว้ (เช่น ?q=) ตอนสลับภาษา
 *  - ต้องถูกครอบด้วย <Suspense> (useSearchParams) — site-header จัดให้แล้ว */
export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const query = searchParams.toString();

  const switchLocale = (next: (typeof routing.locales)[number]) => {
    if (next === locale) return;
    router.replace(query ? `${pathname}?${query}` : pathname, { locale: next });
  };

  return (
    <div
      role="group"
      aria-label={t("language")}
      className={`inline-flex items-center rounded-full border border-border/60 p-0.5${className ? ` ${className}` : ""}`}
    >
      {routing.locales.map((loc) => {
        const active = loc === locale;
        return (
          <button
            key={loc}
            type="button"
            onClick={() => switchLocale(loc)}
            aria-pressed={active}
            className={`min-h-11 rounded-full px-2.5 text-xs font-bold uppercase tracking-wide transition-colors md:min-h-8 ${
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {loc}
          </button>
        );
      })}
    </div>
  );
}
