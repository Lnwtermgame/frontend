import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { ReactGrabInit } from "@/components/ReactGrabInit";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import "flag-icons/css/flag-icons.min.css";
import { AuthProvider } from "@/lib/context/auth-context";
import { NotificationProvider } from "@/lib/context/notification-context";
import { PaymentProvider } from "@/lib/context/payment-context";
import { SupportProvider } from "@/lib/context/support-context";
import { SecurityProvider } from "@/lib/context/security-context";
import { DeliveryProvider } from "@/lib/context/delivery-context";
import { PromotionProvider } from "@/lib/context/promotion-context";
import { CartProvider } from "@/lib/context/cart-context";
import { PublicSettingsProvider } from "@/lib/context/public-settings-context";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { TawkTo } from "@/components/tawk-to";

// Import Noto Sans Thai for Thai language support
import "@fontsource/noto-sans-thai/300.css";
import "@fontsource/noto-sans-thai/400.css";
import "@fontsource/noto-sans-thai/500.css";
import "@fontsource/noto-sans-thai/700.css";

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
  seo?: { metaTitle?: string; metaDescription?: string };
  branding?: { faviconUrl?: string | null };
};

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
  const title =
    settings?.seo?.metaTitle ||
    settings?.general?.siteName ||
    "Lnwtermgame - Game Top Up & Digital Cards";
  const description =
    settings?.seo?.metaDescription ||
    settings?.general?.siteTagline ||
    "Fast and secure game top-up and digital card service.";
  const favicon = settings?.branding?.faviconUrl || "/favicon.ico";

  return {
    title,
    description,
    icons: {
      icon: favicon,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" style={{ colorScheme: "light" }}>
      <head>
        {/* react-grab for development */}
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body className={cn("min-h-screen bg-brutal-gray font-sans antialiased")}>
        <ReactGrabInit />
        <AuthProvider>
          <NotificationProvider>
            <SecurityProvider>
              <PaymentProvider>
                <SupportProvider>
                  <DeliveryProvider>
                    <PromotionProvider>
                      <CartProvider>
                        <PublicSettingsProvider>
                          <MainLayout>{children}</MainLayout>
                        </PublicSettingsProvider>
                      </CartProvider>
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
                    </PromotionProvider>
                  </DeliveryProvider>
                </SupportProvider>
              </PaymentProvider>
            </SecurityProvider>
          </NotificationProvider>
        </AuthProvider>
        {/* <TawkTo /> */}
      </body>
    </html>
  );
}
