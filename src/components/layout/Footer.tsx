"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { usePublicSettings } from "@/lib/context/public-settings-context";
import { SocialIcon } from "react-social-icons";

const localeConfig: Record<string, { flagCode: string; code: string; label: string }> = {
  th: { flagCode: "th", code: "TH", label: "ภาษาไทย" },
  en: { flagCode: "gb", code: "EN", label: "English" },
  zh: { flagCode: "cn", code: "ZH", label: "中文" },
  ja: { flagCode: "jp", code: "JA", label: "日本語" },
  ko: { flagCode: "kr", code: "KO", label: "한국어" },
  ms: { flagCode: "my", code: "MS", label: "Melayu" },
  hi: { flagCode: "in", code: "HI", label: "हिन्दी" },
  es: { flagCode: "es", code: "ES", label: "Español" },
  fr: { flagCode: "fr", code: "FR", label: "Français" },
};

const paymentMethods = [
  {
    key: "PromptPay",
    label: "PromptPay",
    icon: "/payment-icons/promptpay.jpg",
    className: "h-[18px] w-auto object-contain",
    bg: "bg-white px-2.5",
  },
  {
    key: "TrueMoney",
    label: "TrueMoney",
    icon: "/payment-icons/truemoney.webp",
    className: "h-[14px] w-auto object-contain",
    bg: "bg-white px-2.5",
  },
];

export default function Footer() {
  const t = useTranslations();
  const locale = useLocale();
  const currentLang = localeConfig[locale] || localeConfig.th;
  const { settings } = usePublicSettings();
  const logoUrl = settings?.branding?.logoUrl;
  const siteName = settings?.general?.siteName || "LNWTERMGAME";

  // Brand colors for social platforms
  const socialBrandColors: Record<string, string> = {
    Facebook: "#1877F2",
    LINE: "#06C755",
    Discord: "#5865F2",
  };

  // Filter valid social links
  const socialLinks = [
    settings?.social?.facebookUrl && { url: settings.social.facebookUrl, label: "Facebook" },
    settings?.social?.lineUrl && { url: settings.social.lineUrl, label: "LINE" },
    settings?.social?.discordUrl && { url: settings.social.discordUrl, label: "Discord" },
  ].filter(Boolean) as { url: string; label: string }[];

  return (
    <footer className="w-full bg-site-deep border-t border-site-border-soft text-site-muted font-sans pt-12 pb-8 selection:bg-site-accent/20">
      <div className="site-container">
        {/* ══════════ ZONE 1: BRAND & SITEMAP GRID ══════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 pb-10 border-b border-site-border-soft/80">
          {/* Brand & Purpose (spans 2 columns on large screens) */}
          <div className="lg:col-span-2 flex flex-col items-start gap-4">
            <Link
              href="/"
              className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent/50 rounded-6"
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={siteName}
                  className="h-10 w-auto object-contain max-w-[200px]"
                />
              ) : (
                <span className="text-xl font-extrabold tracking-tight text-white">
                  LNW<span className="text-site-accent">TERM</span>GAME
                </span>
              )}
            </Link>

            <p className="text-[13px] leading-relaxed text-site-muted max-w-[38ch]">
              {t("Footer.tagline") || "บริการเติมเงินเกมและจำหน่ายบัตรเติมเงินที่รวดเร็วและปลอดภัยที่สุด ให้บริการตลอด 24 ชั่วโมง"}
            </p>

            {/* Social Icons Row */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2.5 pt-1">
                {socialLinks.map(({ url, label }) => (
                  <SocialIcon
                    key={label}
                    url={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={label}
                    style={{ width: 32, height: 32 }}
                    bgColor={socialBrandColors[label] || "#1f2430"}
                    className="!transition-transform duration-150 hover:scale-105 active:scale-95 rounded-full"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Column 1: บริษัท (Company) */}
          <div className="flex flex-col gap-2.5">
            <h3 className="text-[12px] font-bold uppercase tracking-[0.08em] text-site-text mb-1">
              {siteName || "LNWTERMGAME"}
            </h3>
            <Link
              href="/about"
              className="text-[13px] text-site-muted hover:text-white transition-colors duration-150 py-0.5 focus-visible:outline-none focus-visible:text-white focus-visible:underline underline-offset-4"
            >
              {t("Footer.about_us")}
            </Link>
            <Link
              href="/contact"
              className="text-[13px] text-site-muted hover:text-white transition-colors duration-150 py-0.5 focus-visible:outline-none focus-visible:text-white focus-visible:underline underline-offset-4"
            >
              {t("Footer.contact_us")}
            </Link>
            <Link
              href="/faq"
              className="text-[13px] text-site-muted hover:text-white transition-colors duration-150 py-0.5 focus-visible:outline-none focus-visible:text-white focus-visible:underline underline-offset-4"
            >
              {t("Footer.faq")}
            </Link>
          </div>

          {/* Column 2: บริการลูกค้า (Customer Service) */}
          <div className="flex flex-col gap-2.5">
            <h3 className="text-[12px] font-bold uppercase tracking-[0.08em] text-site-text mb-1">
              {t("Footer.customer")}
            </h3>
            <Link
              href="/support"
              className="text-[13px] text-site-muted hover:text-white transition-colors duration-150 py-0.5 focus-visible:outline-none focus-visible:text-white focus-visible:underline underline-offset-4"
            >
              {t("Footer.support_center")}
            </Link>
            <Link
              href="/payment-issues"
              className="text-[13px] text-site-muted hover:text-white transition-colors duration-150 py-0.5 focus-visible:outline-none focus-visible:text-white focus-visible:underline underline-offset-4"
            >
              {t("Footer.payment_issues")}
            </Link>
            <Link
              href="/refund"
              className="text-[13px] text-site-muted hover:text-white transition-colors duration-150 py-0.5 focus-visible:outline-none focus-visible:text-white focus-visible:underline underline-offset-4"
            >
              {t("Footer.refund_policy")}
            </Link>
          </div>

          {/* Column 3: นโยบาย (Policies) */}
          <div className="flex flex-col gap-2.5">
            <h3 className="text-[12px] font-bold uppercase tracking-[0.08em] text-site-text mb-1">
              {t("Footer.policies")}
            </h3>
            <Link
              href="/terms"
              className="text-[13px] text-site-muted hover:text-white transition-colors duration-150 py-0.5 focus-visible:outline-none focus-visible:text-white focus-visible:underline underline-offset-4"
            >
              {t("Footer.terms_of_service")}
            </Link>
            <Link
              href="/privacy"
              className="text-[13px] text-site-muted hover:text-white transition-colors duration-150 py-0.5 focus-visible:outline-none focus-visible:text-white focus-visible:underline underline-offset-4"
            >
              {t("Footer.privacy_policy")}
            </Link>
          </div>
        </div>

        {/* ══════════ ZONE 2: PAYMENT & DIRECT CONTACTS ══════════ */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 py-5 border-b border-site-border-soft/80">
          {/* Supported Payments Strip */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[12px] font-medium text-site-dim mr-1">
              {t("Footer.supported_payments")}
            </span>
            {paymentMethods.map(({ key, label, icon, className, bg }) => (
              <div
                key={key}
                className={`h-[30px] rounded-6 overflow-hidden border border-white/15 hover:border-white/35 transition-all shadow-sm flex-shrink-0 flex items-center justify-center ${bg}`}
                title={label}
              >
                <img
                  src={icon}
                  alt={label}
                  className={className}
                />
              </div>
            ))}
          </div>

          {/* Inquiries / Direct Contacts */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-2 text-[12px]">
            <div className="flex items-center gap-1.5">
              <span className="text-site-dim">{t("Footer.payment_inquiry")}:</span>
              <a
                href="mailto:contact@lnwtermgame.com"
                className="font-mono text-[12px] text-site-text hover:text-site-accent transition-colors duration-150 focus-visible:outline-none focus-visible:underline"
              >
                contact@lnwtermgame.com
              </a>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-site-dim">{t("Footer.sale_inquiry")}:</span>
              <a
                href="mailto:sale@lnwtermgame.com"
                className="font-mono text-[12px] text-site-text hover:text-site-accent transition-colors duration-150 focus-visible:outline-none focus-visible:underline"
              >
                sale@lnwtermgame.com
              </a>
            </div>
          </div>
        </div>

        {/* ══════════ ZONE 3: LEGAL COPYRIGHT & LANGUAGE ══════════ */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-5 text-[12px] text-site-dim">
          <p className="tabular-nums font-mono text-[11.5px] text-site-dim">
            &copy; {new Date().getFullYear()} {siteName}. {t("Footer.copyright_notice")}
          </p>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-8 bg-white/[0.02] border border-site-border-soft text-[12px]">
            <span
              className={`fi fi-${currentLang.flagCode} inline-block shrink-0 w-[18px] rounded-[2px]`}
              style={{ aspectRatio: "4/3" }}
              aria-label={currentLang.label}
            />
            <span className="font-medium text-site-text">{currentLang.label}</span>
            <span className="text-site-dim font-mono text-[11px]">({currentLang.code})</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
