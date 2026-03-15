import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Lnwtermgame - Game Top Up & Digital Cards",
        short_name: "Lnwtermgame",
        description:
            "Fast and secure game top-up, gift cards, and mobile recharge service.",
        start_url: "/",
        display: "standalone",
        background_color: "#F5F5F0",
        theme_color: "#000000",
        icons: [
            {
                src: "/favicon.ico",
                sizes: "any",
                type: "image/x-icon",
            },
        ],
    };
}
