const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next.js 16 + Turbopack: when the app lives inside a monorepo where
  // `next` is hoisted to the workspace root's node_modules, Turbopack
  // needs the workspace root as its root so it can resolve `next`. Pin it
  // explicitly to avoid mis-detection from other lockfiles on the drive.
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  // Legacy OAuth entry paths → auth service. Destination follows the gateway
  // env so it works outside local dev (localhost fallback for `next dev`).
  async redirects() {
    const authServiceUrl =
      process.env.AUTH_SERVICE_URL ||
      process.env.GATEWAY_URL ||
      process.env.NEXT_PUBLIC_GATEWAY_URL ||
      "http://localhost:10000";
    return [
      {
        source: "/sign-in-with-facebook",
        destination: `${authServiceUrl}/v1/auth/facebook/login`,
        permanent: true,
      },
      {
        source: "/sign-in-with-gmail",
        destination: `${authServiceUrl}/v1/auth/gmail/login`,
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/storage",
        destination: "http://localhost:3000/api/storage",
      },
      {
        source: "/api/storage/:path*",
        destination: "http://localhost:3000/api/storage/:path*",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "assets.lnwtermgame.com",
      },
      {
        // Appwrite storage — product images
        protocol: "https",
        hostname: "**.appwrite.io",
      },
      {
        // SEAGM CDN — product thumbnails
        protocol: "https",
        hostname: "**.seagm.com",
      },
    ],
    dangerouslyAllowSVG: true,
    // Use inline disposition so SVG/payment icons render in-place
    contentDispositionType: "inline",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

module.exports = withNextIntl(nextConfig);
