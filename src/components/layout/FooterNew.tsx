"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { usePublicSettings } from "@/lib/context/public-settings-context";
import { SocialIcon } from "react-social-icons";

const localeConfig: Record<string, { flag: string; code: string; label: string }> = {
    th: { flag: "https://flagcdn.com/w20/th.png", code: "TH", label: "ภาษาไทย" },
    en: { flag: "https://flagcdn.com/w20/gb.png", code: "EN", label: "English" },
};

const paymentMethods = [
    { key: "PromptPay", label: "PromptPay", icon: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/PromptPay.png" },
    { key: "TrueMoney", label: "TrueMoney", icon: "https://raw.githubusercontent.com/casperstack/thai-banks-logo/master/icons/TrueMoney.png" },
];

export default function FooterNew() {
    const t = useTranslations();
    const locale = useLocale();
    const currentLang = localeConfig[locale] || localeConfig.th;
    const { settings } = usePublicSettings();
    const logoUrl = settings?.branding?.logoUrl;

    // Social links from admin settings
    const socialLinks = [
        settings?.social?.facebookUrl && { url: settings.social.facebookUrl, label: "Facebook" },
        settings?.social?.lineUrl && { url: settings.social.lineUrl, label: "LINE" },
        settings?.social?.discordUrl && { url: settings.social.discordUrl, label: "Discord" },
    ].filter(Boolean) as { url: string; label: string }[];

    const facebookUrl = settings?.social?.facebookUrl || null;

    return (
        <footer className="bg-[#141517] text-gray-400 py-12 font-sans w-full">
            <div className="site-container">

                {/* Top Section: Payment Logos & Language */}
                <div className="flex flex-col md:flex-row justify-between items-center pb-8 border-b border-[#33353b] mb-8">
                    <div className="flex flex-wrap gap-3 items-center">
                        {paymentMethods.map(({ key, label, icon }) => (
                            <div
                                key={key}
                                className="w-[58px] h-[58px] rounded-full shadow-sm hover:opacity-80 transition-opacity cursor-pointer overflow-hidden bg-white"
                                title={label}
                            >
                                <img
                                    src={icon}
                                    alt={label}
                                    width={58}
                                    height={58}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center gap-2 cursor-pointer text-white hover:text-site-accent transition-colors">
                        <img src={currentLang.flag} alt={currentLang.code} className="w-[18px] rounded-[2px]" />
                        <span className="text-[13px] font-bold">{currentLang.label}</span>
                    </div>
                </div>

                {/* Middle Section: Columns & Social */}
                <div className="flex flex-col lg:flex-row justify-between gap-10">
                    {/* Columns Wrapper */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:w-3/4">
                        {/* Column 1 */}
                        <div className="flex flex-col gap-3">
                            <h3 className="text-white font-bold text-[14px] tracking-wide mb-1 uppercase">LNWTERMGAME</h3>
                            <Link href="/about" className="text-[13px] text-white hover:text-site-accent transition-colors">{t("Footer.about_us")}</Link>
                            <Link href="/contact" className="text-[13px] text-white hover:text-site-accent transition-colors">{t("Footer.contact_us")}</Link>
                        </div>

                        {/* Column 2 */}
                        <div className="flex flex-col gap-3">
                            <h3 className="text-white font-bold text-[14px] tracking-wide mb-1">{t("Footer.customer")}</h3>
                            <Link href="/refund" className="text-[13px] text-white hover:text-site-accent transition-colors">{t("Footer.refund_policy")}</Link>
                            <Link href="/privacy" className="text-[13px] text-white hover:text-site-accent transition-colors">{t("Footer.privacy_policy")}</Link>
                            <Link href="/payment-issues" className="text-[13px] text-white hover:text-site-accent transition-colors">{t("Footer.payment_issues")}</Link>
                        </div>

                        {/* Column 3 */}
                        <div className="flex flex-col gap-3">
                            <h3 className="text-white font-bold text-[14px] tracking-wide mb-1">{t("Footer.policies")}</h3>
                            <Link href="/terms" className="text-[13px] text-white hover:text-site-accent transition-colors">{t("Footer.terms_of_service")}</Link>
                            <Link href="/privacy" className="text-[13px] text-white hover:text-site-accent transition-colors">{t("Footer.privacy_policy")}</Link>
                        </div>

                        {/* Column 4 */}
                        <div className="flex flex-col gap-3">
                            <h3 className="text-white font-bold text-[14px] tracking-wide mb-1">{t("Footer.services")}</h3>
                            <Link href="/support" className="text-[13px] text-white hover:text-site-accent transition-colors">{t("Footer.features.support")}</Link>
                        </div>
                    </div>

                    {/* Right Side: Facebook Widget + Social Icons */}
                    <div className="lg:w-1/4 flex flex-col items-start lg:items-end">
                        {/* Facebook Widget - only show if facebookUrl is set */}
                        {facebookUrl && (
                            <a
                                href={facebookUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-[#222427] border border-[#33353b] p-3 rounded-[8px] w-full max-w-[280px] block hover:border-site-accent/30 transition-colors group"
                            >
                                <div className="flex gap-3 items-center text-white">
                                    <SocialIcon
                                        url={facebookUrl}
                                        style={{ width: 40, height: 40 }}
                                        target="_blank"
                                        as="div"
                                    />
                                    <div>
                                        <p className="text-[13px] font-bold leading-tight group-hover:text-site-accent transition-colors">LNWTERMGAME</p>
                                        <p className="text-[10px] text-gray-500">Facebook Page</p>
                                    </div>
                                </div>
                                <div className="flex items-center mt-2">
                                    <span className="bg-[#1877f2] text-white text-xs px-3 py-1 flex items-center gap-1.5 rounded font-medium">
                                        Follow Page
                                    </span>
                                </div>
                            </a>
                        )}

                        {/* Social Links Row */}
                        {socialLinks.length > 0 && (
                            <div className="flex items-center gap-3 mt-6 justify-end">
                                <span className="text-white text-[13px] font-bold mr-1">{t("Footer.contact_us")}</span>
                                {socialLinks.map(({ url, label }) => (
                                    <SocialIcon
                                        key={label}
                                        url={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={label}
                                        style={{ width: 36, height: 36 }}
                                        bgColor="#212328"
                                        fgColor="#9ca3af"
                                        className="!transition-all !duration-200 hover:!opacity-80 hover:!scale-110"
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="flex flex-col md:flex-row justify-between items-center py-6 border-t border-[#33353b] mt-8 text-[12px] text-gray-500">
                    <div className="flex flex-col gap-1 mb-4 md:mb-0">
                        {logoUrl && (
                            <img
                                src={logoUrl}
                                alt="Logo"
                                className="h-14 w-auto object-contain"
                            />
                        )}
                    </div>

                    <div className="flex flex-col text-center md:text-left gap-1 mt-4 md:mt-0">
                        <p>{t("Footer.payment_inquiry")}</p>
                        <a href="mailto:contact@lnwtermgame.com" className="text-white hover:text-[#00a3ff]">contact@lnwtermgame.com</a>
                    </div>

                    <div className="flex flex-col text-center md:text-left gap-1 mt-4 md:mt-0">
                        <p>{t("Footer.sale_inquiry")}</p>
                        <a href="mailto:sale@lnwtermgame.com" className="text-white hover:text-[#00a3ff]">sale@lnwtermgame.com</a>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center text-[11px] text-gray-600 mt-6 pb-4">
                    <p>{t("Footer.copyright_notice")}</p>
                    <p className="mt-2 md:mt-0 whitespace-nowrap text-[#00a3ff] font-bold">©2026 Copyright LNWTERMGAME</p>
                </div>

            </div>
        </footer>
    );
}
