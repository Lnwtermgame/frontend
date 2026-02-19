"use client";

import Script from "next/script";

const TAWK_TO_PROPERTY_ID = process.env.NEXT_PUBLIC_TAWK_TO_PROPERTY_ID;
const TAWK_TO_WIDGET_ID = process.env.NEXT_PUBLIC_TAWK_TO_WIDGET_ID;

export function TawkTo() {
  // Don't render if tawk.to is not configured
  if (!TAWK_TO_PROPERTY_ID || !TAWK_TO_WIDGET_ID) {
    return null;
  }

  const tawkToUrl = `https://embed.tawk.to/${TAWK_TO_PROPERTY_ID}/${TAWK_TO_WIDGET_ID}`;

  return (
    <Script
      id="tawk-to"
      strategy="lazyOnload"
      src={tawkToUrl}
      crossOrigin="anonymous"
    />
  );
}
