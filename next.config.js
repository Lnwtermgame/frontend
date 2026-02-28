/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable static generation for pages that use client-side context
  output: "standalone",
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
        protocol: "https",
        hostname: "qr.stripe.com",
      },
    ],
    dangerouslyAllowSVG: true,
    // Use inline disposition so SVG/payment icons render in-place
    contentDispositionType: "inline",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

module.exports = nextConfig;
