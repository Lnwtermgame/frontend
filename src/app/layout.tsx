import type { Metadata } from "next";
import Script from "next/script";
import { ReactGrabInit } from "@/components/ReactGrabInit";
import "./globals.css";
import { AuthProvider } from "@/lib/context/auth-context";
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

export const metadata: Metadata = {
  title: "MaliGamePass - Game Top Up & Digital Cards",
  description: "เติมเงินเกมและซื้อบัตรของขวัญดิจิตอลอย่างรวดเร็ว ปลอดภัย และราคาคุ้มค่า",
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
    <html lang="th" className="dark">
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
      <body
        className={cn(
          "min-h-screen bg-mali-dark font-sans antialiased",
        )}
      >
        <ReactGrabInit />
        <AuthProvider>
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
        </AuthProvider>
      </body>
    </html>
  );
}
