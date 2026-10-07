import "../globals.css";
import type { Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SessionProvider } from "next-auth/react";
import { routing } from "@/i18n/routing";
import { QueryProvider } from "@/components/providers/query-provider";
import { NextAuthSessionSync } from "@/components/providers/next-auth-session-sync";
import { AuthBootstrap } from "@/components/providers/auth-bootstrap";
import { NotificationsRealtime } from "@/components/providers/notifications-realtime";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CookieNotice } from "@/components/layout/cookie-notice";
import { Toaster } from "sonner";

/** viewportFit: "cover" จำเป็นสำหรับ env(safe-area-inset-*) — ถ้าไม่ตั้ง
 *  เบราว์เซอร์ iOS จะคืนค่า inset เป็น 0 เสมอ ทำให้ padding กันรอยบาก
 *  ของแถบสรุปตรึงล่าง (recharge-order-summary / order-summary) ไม่ทำงาน */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return { title: t("title") };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const tCommon = await getTranslations("common");

    return (
      <html lang={locale}>
        <body className="antialiased">
          {/* skip-to-content — WCAG 2.4.1 ต้องเป็น focus target แรกของ body */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg"
          >
            {tCommon("skipToContent")}
          </a>
          <SessionProvider>
            <NextIntlClientProvider>
              <QueryProvider>
                <NextAuthSessionSync />
                <AuthBootstrap />
                <NotificationsRealtime />
                <div className="flex min-h-screen flex-col">
                  <SiteHeader />
                  <main id="main" tabIndex={-1} className="flex-1">
                    {children}
                  </main>
                  <SiteFooter />
                </div>
                <CookieNotice />
              </QueryProvider>
            </NextIntlClientProvider>
          </SessionProvider>
          <Toaster
            theme="dark"
            position="top-center"
            closeButton
            toastOptions={{
              style: {
                background: "oklch(0.285 0.009 320)",
                border: "1px solid oklch(0.318 0.019 308)",
                color: "oklch(0.938 0.003 49)",
              },
            }}
          />
        </body>
      </html>
    );
}
