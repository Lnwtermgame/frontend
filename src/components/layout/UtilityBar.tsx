"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function UtilityBar() {
  const t = useTranslations();
  return (
    <div className="bg-site-deep w-full hidden md:block border-b border-site-border-soft">
      <div className="site-container h-8 flex items-center justify-between text-[11px] text-site-dim">
        <div className="flex items-center gap-5">
          <Link href="/news" className="hover:text-site-text transition-colors">{t("Header.news")}</Link>
          <Link href="/dealer" className="hover:text-site-text transition-colors">{t("Header.dealers")}</Link>
          <Link href="/how-to" className="hover:text-site-text transition-colors">{t("how_to_use.title")}</Link>
        </div>
        <LanguageSwitcher variant="desktop" />
      </div>
    </div>
  );
}
