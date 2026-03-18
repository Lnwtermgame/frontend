const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
  // Disable static generation for pages that use client-side context
  async redirects() {
    return [
      {
        source: "/sign-in-with-facebook",
        destination: "http://localhost:10000/v1/auth/facebook/login",
        permanent: true,
      },
      {
        source: "/sign-in-with-gmail",
        destination: "http://localhost:10000/v1/auth/gmail/login",
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
