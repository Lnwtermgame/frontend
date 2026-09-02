import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://lnwtermgame.com",
  ),
};

/**
 * Pass-through root layout.
 *
 * The real <html>/<body> shell is rendered by `src/app/[locale]/layout.tsx`
 * (it owns the per-locale `lang` attribute). Rendering the shell here too
 * produced nested <html> trees and hydration errors on locale switch.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
