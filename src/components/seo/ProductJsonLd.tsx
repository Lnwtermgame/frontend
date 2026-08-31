"use client";

import { useEffect } from "react";

const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "https://lnwtermgame.com";

interface ProductJsonLdProps {
    name: string;
    description: string;
    image?: string;
    slug: string;
    /** Lowest price among product types (THB) */
    priceLow?: number;
    /** Highest price among product types (THB) */
    priceHigh?: number;
    category?: string;
    /** Product rating (0-5) */
    rating?: number;
    ratingCount?: number;
}

/**
 * Injects a Product + Offer JSON-LD script into the document head.
 *
 * Because the game/card detail page is a client component we cannot use
 * the server-side metadata API, so we insert the structured data
 * dynamically via `useEffect`.
 */
export function ProductJsonLd({
    name,
    description,
    image,
    slug,
    priceLow,
    priceHigh,
    category,
    rating,
    ratingCount,
}: ProductJsonLdProps) {
    useEffect(() => {
        const schema: Record<string, unknown> = {
            "@context": "https://schema.org",
            "@type": "Product",
            name,
            description,
            url: `${SITE_URL}/games/${slug}`,
            category: category || "Game Top Up",
        };

        if (image) {
            schema.image = image;
        }

        // Offer / AggregateOffer
        if (priceLow != null && priceHigh != null && priceLow !== priceHigh) {
            schema.offers = {
                "@type": "AggregateOffer",
                priceCurrency: "THB",
                lowPrice: priceLow.toFixed(2),
                highPrice: priceHigh.toFixed(2),
                availability: "https://schema.org/InStock",
            };
        } else if (priceLow != null) {
            schema.offers = {
                "@type": "Offer",
                priceCurrency: "THB",
                price: priceLow.toFixed(2),
                availability: "https://schema.org/InStock",
            };
        }

        // Aggregate rating
        if (rating != null && ratingCount != null && ratingCount > 0) {
            schema.aggregateRating = {
                "@type": "AggregateRating",
                ratingValue: rating.toFixed(1),
                reviewCount: ratingCount,
            };
        }

        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.textContent = JSON.stringify(schema);
        script.id = "product-jsonld";
        document.head.appendChild(script);

        return () => {
            const existing = document.getElementById("product-jsonld");
            if (existing) {
                existing.remove();
            }
        };
    }, [name, description, image, slug, priceLow, priceHigh, category, rating, ratingCount]);

    return null;
}
