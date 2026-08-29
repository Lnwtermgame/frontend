"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "https://lnwtermgame.com";

const SEGMENT_LABEL_KEYS: Record<string, string> = {
    games: "Navigation.games",
    card: "Navigation.card",
    "mobile-recharge": "Navigation.mobile_recharge",
    news: "Navigation.news",
    support: "Navigation.support",
    dashboard: "my_account",
    terms: "Footer.terms_of_service",
    privacy: "Footer.privacy_policy",
    about: "Footer.about_us",
    contact: "Footer.contact_us",
    faq: "Navigation.faq",
};

/**
 * Client-side BreadcrumbList JSON-LD component.
 *
 * Automatically builds breadcrumbs from the current URL path and injects
 * the structured data script into `<head>`.
 */
export function BreadcrumbJsonLd() {
    const pathname = usePathname();
    const t = useTranslations();

    useEffect(() => {
        if (!pathname || pathname === "/") return;

        const segments = pathname.split("/").filter(Boolean);

        // Skip the locale segment (e.g. "th", "en")
        const localePattern = /^[a-z]{2}$/;
        const startIndex = localePattern.test(segments[0]) ? 1 : 0;
        const pathSegments = segments.slice(startIndex);

        if (pathSegments.length === 0) return;

        const items = [
            {
                "@type": "ListItem",
                position: 1,
                name: t("Navigation.home"),
                item: SITE_URL,
            },
        ];

        let currentPath = segments
            .slice(0, startIndex)
            .reduce((acc, seg) => `${acc}/${seg}`, "");

        pathSegments.forEach((segment, index) => {
            currentPath += `/${segment}`;
            const labelKey = SEGMENT_LABEL_KEYS[segment];
            const label = labelKey
                ? t(labelKey)
                : decodeURIComponent(segment)
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase());

            items.push({
                "@type": "ListItem",
                position: index + 2,
                name: label,
                item: `${SITE_URL}${currentPath}`,
            });
        });

        const schema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: items,
        };

        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.textContent = JSON.stringify(schema);
        script.id = "breadcrumb-jsonld";
        document.head.appendChild(script);

        return () => {
            const existing = document.getElementById("breadcrumb-jsonld");
            if (existing) {
                existing.remove();
            }
        };
    }, [pathname, t]);

    return null;
}
