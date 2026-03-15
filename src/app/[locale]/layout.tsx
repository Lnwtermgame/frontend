import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Script from "next/script";
import { ReactGrabInit } from "@/components/ReactGrabInit";
import { Toaster } from "react-hot-toast";
import "../globals.css";
import "flag-icons/css/flag-icons.min.css";
import { AuthProvider } from "@/lib/context/auth-context";
import { NotificationProvider } from "@/lib/context/notification-context";
import { PaymentProvider } from "@/lib/context/payment-context";
import { SupportProvider } from "@/lib/context/support-context";
import { SecurityProvider } from "@/lib/context/security-context";
import { DeliveryProvider } from "@/lib/context/delivery-context";
import { CartProvider } from "@/lib/context/cart-context";
import { PublicSettingsProvider } from "@/lib/context/public-settings-context";
import { NextAuthProvider } from "@/components/providers/nextauth-provider";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { TawkTo } from "@/components/tawk-to";
import { CookieNotice } from "@/components/cookie/CookieNotice";
import { HomeJsonLd } from "@/components/seo/HomeJsonLd";

// Import Noto Sans Thai for Thai language support
import "@fontsource/noto-sans-thai/300.css";
import "@fontsource/noto-sans-thai/400.css";
import "@fontsource/noto-sans-thai/500.css";
import "@fontsource/noto-sans-thai/700.css";

// Import Noto Sans SC for Chinese language support
import "@fontsource/noto-sans-sc/300.css";
import "@fontsource/noto-sans-sc/400.css";
import "@fontsource/noto-sans-sc/500.css";
import "@fontsource/noto-sans-sc/700.css";

// Import Noto Sans JP for Japanese language support
import "@fontsource/noto-sans-jp/300.css";
import "@fontsource/noto-sans-jp/400.css";
import "@fontsource/noto-sans-jp/500.css";
import "@fontsource/noto-sans-jp/700.css";

// Import Noto Sans KR for Korean language support
import "@fontsource/noto-sans-kr/300.css";
import "@fontsource/noto-sans-kr/400.css";
import "@fontsource/noto-sans-kr/500.css";
import "@fontsource/noto-sans-kr/700.css";

// Import Noto Sans Devanagari for Hindi language support
import "@fontsource/noto-sans-devanagari/300.css";
import "@fontsource/noto-sans-devanagari/400.css";
import "@fontsource/noto-sans-devanagari/500.css";
import "@fontsource/noto-sans-devanagari/700.css";

// Import Poppins for English language and generic text
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Allow zoom for accessibility
  userScalable: true,
  viewportFit: "cover", // For iPhone safe areas
};

type PublicSettingsMetadataPayload = {
  general?: { siteName?: string; siteTagline?: string };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
  };
  branding?: { faviconUrl?: string | null };
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://lnwtermgame.com";

const LOCALES = ["th", "en", "zh", "ja", "ko", "ms", "hi", "es", "fr"];

const METADATA_FETCH_TIMEOUT_MS = 2500;
const METADATA_FETCH_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 250;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function getPublicSettingsMetadata(): Promise<PublicSettingsMetadataPayload | null> {
  const gatewayUrl =
    process.env.GATEWAY_URL ||
    process.env.NEXT_PUBLIC_GATEWAY_URL ||
    "http://localhost:3000";

  for (let attempt = 0; attempt < METADATA_FETCH_RETRIES; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        `${gatewayUrl}/api/public/settings`,
        { next: { revalidate: 60 } },
        METADATA_FETCH_TIMEOUT_MS,
      );

      if (!response.ok) {
        throw new Error(`metadata fetch failed with status ${response.status}`);
      }

      const json = (await response.json()) as {
        success?: boolean;
        data?: PublicSettingsMetadataPayload;
      };
      if (json.success && json.data) {
        return json.data;
      }
      throw new Error("metadata payload is invalid");
    } catch {
      if (attempt === METADATA_FETCH_RETRIES - 1) {
        return null;
      }
      const backoff = RETRY_BASE_DELAY_MS * 2 ** attempt;
      await sleep(backoff);
    }
  }

  return null;
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettingsMetadata();
  const siteName =
    settings?.general?.siteName || "Lnwtermgame";
  const title =
    settings?.seo?.metaTitle ||
    siteName + " - Game Top Up & Digital Cards";
  const description =
    settings?.seo?.metaDescription ||
    settings?.general?.siteTagline ||
    "Fast and secure game top-up and digital card service.";
  const favicon = settings?.branding?.faviconUrl || "/favicon.ico";
  const rawKeywords = settings?.seo?.metaKeywords;
  const keywords = Array.isArray(rawKeywords)
    ? rawKeywords
    : typeof rawKeywords === "string" && rawKeywords
      ? rawKeywords.split(",").map((k) => k.trim())
      : [
        "game top up",
        "เติมเกม",
        "gift card",
        "digital card",
        "mobile recharge",
        "Lnwtermgame",
      ];

  const languageAlternates: Record<string, string> = {};
  for (const locale of LOCALES) {
    languageAlternates[locale] = `${SITE_URL}/${locale}`;
  }

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
    description,
    keywords,
    icons: {
      icon: favicon,
    },
    openGraph: {
      title,
      description,
      url: SITE_URL,
      siteName,
      type: "website",
      locale: "th_TH",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: SITE_URL,
      languages: languageAlternates,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function RootLayout(
  props: Readonly<{
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
  }>,
) {
  const params = await props.params;
  const { locale } = params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();
  const isTawkEnabled = Boolean(
    process.env.NEXT_PUBLIC_TAWK_TO_PROPERTY_ID &&
    process.env.NEXT_PUBLIC_TAWK_TO_WIDGET_ID,
  );

  return (
    <html lang={locale} style={{ colorScheme: "light" }}>
      <head>
        {/* react-grab for development */}
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
        <HomeJsonLd />
      </head>
      <body className={cn("min-h-screen bg-brutal-gray font-sans antialiased")}>
        <ReactGrabInit />
        <NextIntlClientProvider messages={messages}>
          <NextAuthProvider>
            <AuthProvider>
              <NotificationProvider>
                <SecurityProvider>
                  <PaymentProvider>
                    <SupportProvider>
                      <DeliveryProvider>
                        <CartProvider>
                          <PublicSettingsProvider>
                            <MainLayout>{props.children}</MainLayout>
                          </PublicSettingsProvider>
                        </CartProvider>
                        <CookieNotice isTawkEnabled={isTawkEnabled} />
                        <Toaster
                          position="bottom-right"
                          containerStyle={{
                            zIndex: 50,
                          }}
                          toastOptions={{
                            duration: 4000,
                            style: {
                              background: "#FFFFFF",
                              color: "#1f2937",
                              border: "3px solid #000000",
                              boxShadow: "4px 4px 0 0 #000000",
                              borderRadius: "8px",
                              padding: "12px 16px",
                            },
                            success: {
                              iconTheme: {
                                primary: "#95E1D3",
                                secondary: "#000000",
                              },
                            },
                            error: {
                              iconTheme: {
                                primary: "#FF6B9D",
                                secondary: "#FFFFFF",
                              },
                            },
                          }}
                        />
                      </DeliveryProvider>
                    </SupportProvider>
                  </PaymentProvider>
                </SecurityProvider>
              </NotificationProvider>
            </AuthProvider>
          </NextAuthProvider>
        </NextIntlClientProvider>
        <TawkTo />
      </body>
    </html>
  );
}
