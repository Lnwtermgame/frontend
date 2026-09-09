import "../globals.css";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SessionProvider } from "next-auth/react";
import { routing } from "@/i18n/routing";
import { QueryProvider } from "@/components/providers/query-provider";
import { NextAuthSessionSync } from "@/components/providers/next-auth-session-sync";
import { AuthBootstrap } from "@/components/providers/auth-bootstrap";

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

  return (
    <html lang={locale}>
      <body>
        <SessionProvider>
          <NextIntlClientProvider>
            <QueryProvider>
              <NextAuthSessionSync />
              <AuthBootstrap />
              {children}
            </QueryProvider>
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
