import type { MetadataRoute } from "next";

const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "https://lnwtermgame.com";

const GATEWAY_URL =
    process.env.GATEWAY_URL ||
    process.env.NEXT_PUBLIC_GATEWAY_URL ||
    "http://localhost:3000";

const LOCALES = ["th", "en", "zh", "ja", "ko", "ms", "hi", "es", "fr"];

const STATIC_PAGES = [
    { path: "", changeFrequency: "daily" as const, priority: 1 },
    { path: "/games", changeFrequency: "daily" as const, priority: 0.9 },
    { path: "/card", changeFrequency: "daily" as const, priority: 0.9 },
    { path: "/mobile-recharge", changeFrequency: "daily" as const, priority: 0.8 },
    { path: "/news", changeFrequency: "daily" as const, priority: 0.7 },
    { path: "/support", changeFrequency: "monthly" as const, priority: 0.5 },
];

const CMS_SLUGS = [
    "terms",
    "privacy",
    "terms-of-service",
    "privacy-policy",
    "about",
    "contact",
    "help",
    "faq",
];

function buildLanguageAlternates(path: string): Record<string, string> {
    const alternates: Record<string, string> = {};
    for (const locale of LOCALES) {
        alternates[locale] = `${SITE_URL}/${locale}${path}`;
    }
    return alternates;
}

type ProductSlug = { slug: string; updatedAt?: string };
type NewsSlug = { slug: string; updatedAt?: string };

async function fetchProductSlugs(): Promise<ProductSlug[]> {
    try {
        const res = await fetch(`${GATEWAY_URL}/api/products/sitemap`, {
            next: { revalidate: 3600 },
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.success && Array.isArray(json.data) ? json.data : [];
    } catch {
        return [];
    }
}

async function fetchNewsSlugs(): Promise<NewsSlug[]> {
    try {
        const res = await fetch(`${GATEWAY_URL}/api/cms/news/sitemap`, {
            next: { revalidate: 3600 },
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.success && Array.isArray(json.data) ? json.data : [];
    } catch {
        return [];
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [productSlugs, newsSlugs] = await Promise.all([
        fetchProductSlugs(),
        fetchNewsSlugs(),
    ]);

    const entries: MetadataRoute.Sitemap = [];

    for (const page of STATIC_PAGES) {
        for (const locale of LOCALES) {
            entries.push({
                url: `${SITE_URL}/${locale}${page.path}`,
                lastModified: new Date(),
                changeFrequency: page.changeFrequency,
                priority: page.priority,
                alternates: { languages: buildLanguageAlternates(page.path) },
            });
        }
    }

    for (const slug of CMS_SLUGS) {
        for (const locale of LOCALES) {
            entries.push({
                url: `${SITE_URL}/${locale}/${slug}`,
                lastModified: new Date(),
                changeFrequency: "monthly",
                priority: 0.4,
                alternates: { languages: buildLanguageAlternates(`/${slug}`) },
            });
        }
    }

    for (const product of productSlugs) {
        for (const locale of LOCALES) {
            entries.push({
                url: `${SITE_URL}/${locale}/games/${product.slug}`,
                lastModified: product.updatedAt
                    ? new Date(product.updatedAt)
                    : new Date(),
                changeFrequency: "weekly",
                priority: 0.8,
                alternates: {
                    languages: buildLanguageAlternates(`/games/${product.slug}`),
                },
            });
        }
    }

    for (const article of newsSlugs) {
        for (const locale of LOCALES) {
            entries.push({
                url: `${SITE_URL}/${locale}/news/${article.slug}`,
                lastModified: article.updatedAt
                    ? new Date(article.updatedAt)
                    : new Date(),
                changeFrequency: "weekly",
                priority: 0.6,
                alternates: {
                    languages: buildLanguageAlternates(`/news/${article.slug}`),
                },
            });
        }
    }

    return entries;
}
