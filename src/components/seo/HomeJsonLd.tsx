import { JsonLd } from "./JsonLd";

const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "https://lnwtermgame.com";

export function HomeJsonLd() {
    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Lnwtermgame",
        url: SITE_URL,
        potentialAction: {
            "@type": "SearchAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: `${SITE_URL}/games?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
        },
    };

    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Lnwtermgame",
        url: SITE_URL,
        logo: `${SITE_URL}/favicon.ico`,
        sameAs: [],
        contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            availableLanguage: [
                "Thai",
                "English",
                "Chinese",
                "Japanese",
                "Korean",
                "Malay",
                "Hindi",
                "Spanish",
                "French",
            ],
        },
    };

    return (
        <>
            <JsonLd data={websiteSchema} />
            <JsonLd data={organizationSchema} />
        </>
    );
}
