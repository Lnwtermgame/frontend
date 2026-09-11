import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import path from "node:path";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: { root: appDir },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "assets.lnwtermgame.com" },
      { protocol: "https", hostname: "**.appwrite.io" },
      { protocol: "https", hostname: "**.seagm.com" },
    ],
    dangerouslyAllowSVG: true,
  },
  // Same-origin image proxy: /assets/:fileId → Appwrite storage view URL, so the
  // browser never sees the storage backend path. assetUrl() swaps URLs at render.
  // IDs are already public (they appear in every stored URL) — env overrides only.
  async rewrites() {
    const endpoint = (process.env.APPWRITE_ENDPOINT || "https://assets.lnwtermgame.com/v1").replace(/\/+$/, "");
    const bucket = process.env.APPWRITE_BUCKET_ID || "698c7dfe0038ee35842b";
    const project = process.env.APPWRITE_PROJECT_ID || "698c7ca4000555520e6b";
    return [
      {
        source: "/assets/:fileId",
        destination: `${endpoint}/storage/buckets/${bucket}/files/:fileId/view?project=${project}`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
