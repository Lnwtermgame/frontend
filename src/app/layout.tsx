import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import Script from "next/script";
import { ReactGrabInit } from "@/components/ReactGrabInit";
import "./globals.css";
import { AuthProvider } from "@/lib/context/auth-context";
import { LanguageProvider } from "@/lib/context/language-context";
import { NotificationProvider } from "@/lib/context/notification-context";
import { PaymentProvider } from "@/lib/context/payment-context";
import { SupportProvider } from "@/lib/context/support-context";
import { SecurityProvider } from "@/lib/context/security-context";
import { DeliveryProvider } from "@/lib/context/delivery-context";
import { PromotionProvider } from "@/lib/context/promotion-context";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { LiveChat } from "@/components/support/LiveChat";

// Import Noto Sans Thai for Thai language support
import '@fontsource/noto-sans-thai/300.css';
import '@fontsource/noto-sans-thai/400.css';
import '@fontsource/noto-sans-thai/500.css';
import '@fontsource/noto-sans-thai/700.css';

// Import Poppins for English language - with all necessary weights
import '@fontsource/poppins/300.css';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';

// Import Inter as fallback font - with all necessary weights
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

// Configure the fonts with Next.js font system
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MaliGamePass - Game Top Up & Digital Cards",
  description: "Top up your favorite games and buy digital gift cards quickly, securely, and at competitive prices.",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning prevents warnings from language switching during initial load
    <html suppressHydrationWarning className={`dark ${poppins.variable} ${inter.variable}`}>
      <head>
        {/* Load critical CSS before any other stylesheets */}
        <link
          rel="stylesheet"
          href="/fonts/critical-language.css"
          precedence="high"
        />

        {/* Preload Thai font with high priority */}
        <link
          rel="preload"
          href="/fonts/noto-sans-thai-regular.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />

        {/* External font CSS */}
        <link
          rel="stylesheet"
          href="/fonts/thai-font.css"
        />

        {/* Critical inline CSS to avoid FOUC */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Critical font loading CSS */
            @font-face {
              font-family: 'Noto Sans Thai';
              font-style: normal;
              font-weight: 400;
              font-display: block; /* Change to block to prevent FOUT */
              src: url('/fonts/noto-sans-thai-regular.ttf') format('truetype');
              unicode-range: U+0E01-0E5B, U+200C-200D, U+25CC;
            }
            
            html {
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              text-rendering: optimizeLegibility;
            }
            
            html[lang="en"] {
              font-family: 'Poppins', 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
            }
            
            html[lang="th"] {
              font-family: 'Noto Sans Thai', 'Thonburi', 'Tahoma', sans-serif !important;
            }
            
            /* Prevent flash of unstyled content while loading */
            .no-fouc { opacity: 0; }
            html:not(.no-js) body { opacity: 1 !important; }
            
            /* Prevent language flicker during navigation */
            * {
              transition: background-color 0.2s, opacity 0.2s, color 0.2s !important;
            }
            
            /* Critical language-specific styling */
            html[lang="th"] *, [data-language="th"] * {
              font-family: 'Noto Sans Thai', 'Thonburi', 'Tahoma', sans-serif !important;
            }
            
            /* Theme critical styling */
            body {
              background-color: #0b1021;
              color: #ffffff;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              text-rendering: optimizeLegibility;
            }
          `
        }} />

        {/* Script to check localStorage and set initial language */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                // Only run in browser environment
                if (typeof window === 'undefined') {
                  return;
                }

                // Mark document to indicate JS is running
                document.documentElement.classList.remove('no-js');

                // Init global state
                window.__LANGUAGE_STATE__ = { updatedDOM: false };

                // Get saved language from localStorage safely
                var savedLocale = null;
                try {
                  if (typeof localStorage !== 'undefined' && localStorage.getItem) {
                    savedLocale = localStorage.getItem('locale');
                  }
                } catch (e) {
                  // localStorage not available
                }

                var initialLocale = (savedLocale === 'th' || savedLocale === 'en')
                  ? savedLocale
                  : (navigator.language && navigator.language.startsWith('th') ? 'th' : 'en');

                // Add flicker prevention class during initialization
                document.documentElement.classList.add('language-transition');

                // Set language attributes and classes synchronously before hydration
                if (initialLocale === 'th') {
                  document.documentElement.lang = 'th';
                  document.documentElement.classList.add('thai-font');
                  document.documentElement.setAttribute('data-language', 'th');
                  document.body && document.body.classList.add('thai-font');
                } else {
                  document.documentElement.lang = 'en';
                  document.documentElement.setAttribute('data-language', 'en');
                  document.documentElement.classList.remove('thai-font');
                  document.body && document.body.classList.remove('thai-font');
                }

                // Store initial state
                window.__LANGUAGE_STATE__ = {
                  locale: initialLocale,
                  updatedDOM: true
                };

                // Create style element to prevent font flickering
                var style = document.createElement('style');
                style.textContent = 'a span, button span, .nav-item span { transition: none !important; }';
                document.head.appendChild(style);

                // Handle font loading completion
                if ('fonts' in document) {
                  document.fonts.ready.then(function() {
                    document.documentElement.classList.add('fonts-loaded');
                    // Remove transition prevention after fonts are loaded
                    setTimeout(function() {
                      document.documentElement.classList.remove('language-transition');
                    }, 100);
                  });
                } else {
                  // Fallback if fonts API not available
                  setTimeout(function() {
                    document.documentElement.classList.add('fonts-loaded');
                    document.documentElement.classList.remove('language-transition');
                  }, 500);
                }
              } catch (e) {
                console.error('Language initialization error:', e);
              }
            })();
          `
        }} />
        {/* react-grab for development */}
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body
        className={cn(
          "min-h-screen bg-mali-dark font-sans antialiased",
        )}
      >
        <ReactGrabInit />
        <AuthProvider>
          <LanguageProvider>
            <NotificationProvider>
              <SecurityProvider>
                <PaymentProvider>
                  <SupportProvider>
                    <DeliveryProvider>
                      <PromotionProvider>
                        <MainLayout>{children}</MainLayout>
                        <LiveChat />
                      </PromotionProvider>
                    </DeliveryProvider>
                  </SupportProvider>
                </PaymentProvider>
              </SecurityProvider>
            </NotificationProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 