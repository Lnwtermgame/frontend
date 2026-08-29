import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lnwtermgame.com";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_GATEWAY_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

const LOCALES = ["th", "en", "zh", "ja", "ko", "ms", "hi", "es", "fr"];

interface SeoProductType {
  displayPrice?: number | string;
}

interface SeoProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  imageUrl?: string;
  coverImageUrl?: string;
  productType?: string;
  averageRating?: number;
  reviewCount?: number;
  metaTitle?: string;
  metaDescription?: string;
  isActive?: boolean;
  types?: SeoProductType[];
}

const cuidPattern = /^c[a-z0-9]{24,}$/i;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidDatabaseId(id: string): boolean {
  return cuidPattern.test(id) || uuidPattern.test(id);
}

/**
 * Server-side product fetch for metadata/JSON-LD so crawlers receive real
 * content — the detail page itself renders client-side.
 * Returns null when the product doesn't exist (never throws).
 */
export async function fetchProductForSeo(
  slugOrId: string,
): Promise<SeoProduct | null> {
  const endpoint = isValidDatabaseId(slugOrId)
    ? `${API_BASE_URL}/api/products/${slugOrId}`
    : `${API_BASE_URL}/api/products/slug/${slugOrId}`;

  try {
    const response = await fetch(endpoint, { next: { revalidate: 300 } });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.success ? (data.data as SeoProduct) : null;
  } catch {
    return null;
  }
}

export function buildProductMetadata(product: SeoProduct): Metadata {
  const title = product.metaTitle || product.name;
  const description =
    product.metaDescription ||
    product.shortDescription ||
    product.description ||
    "";

  const languageAlternates: Record<string, string> = {};
  for (const locale of LOCALES) {
    languageAlternates[locale] = `${SITE_URL}/${locale}/${product.slug}`;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/games/${product.slug}`,
      type: "website",
      images: product.coverImageUrl || product.imageUrl
        ? [{ url: (product.coverImageUrl || product.imageUrl)! }]
        : undefined,
    },
    alternates: {
      canonical: `${SITE_URL}/games/${product.slug}`,
      languages: languageAlternates,
    },
  };
}

export function buildProductJsonLd(product: SeoProduct): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.metaDescription ||
      product.shortDescription ||
      product.description ||
      "",
    url: `${SITE_URL}/games/${product.slug}`,
    category:
      product.productType === "CARD" ? "Gift Card" : "Game Top Up",
  };

  if (product.imageUrl || product.coverImageUrl) {
    schema.image = product.coverImageUrl || product.imageUrl;
  }

  const prices = (product.types || [])
    .map((t) => Number(t.displayPrice))
    .filter((p) => Number.isFinite(p) && p > 0);

  if (prices.length > 1) {
    schema.offers = {
      "@type": "AggregateOffer",
      priceCurrency: "THB",
      lowPrice: Math.min(...prices).toFixed(2),
      highPrice: Math.max(...prices).toFixed(2),
      availability: "https://schema.org/InStock",
    };
  } else if (prices.length === 1) {
    schema.offers = {
      "@type": "Offer",
      priceCurrency: "THB",
      price: prices[0].toFixed(2),
      availability: "https://schema.org/InStock",
    };
  }

  // Aggregate rating only from real data — never fabricate.
  if (
    product.averageRating != null &&
    product.reviewCount != null &&
    product.reviewCount > 0
  ) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(product.averageRating).toFixed(1),
      reviewCount: product.reviewCount,
    };
  }

  return schema;
}
