import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { ReactGrabInit } from "@/components/ReactGrabInit";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { AuthProvider } from "@/lib/context/auth-context";
import { NotificationProvider } from "@/lib/context/notification-context";
import { PaymentProvider } from "@/lib/context/payment-context";
import { SupportProvider } from "@/lib/context/support-context";
import { SecurityProvider } from "@/lib/context/security-context";
import { DeliveryProvider } from "@/lib/context/delivery-context";
import { PromotionProvider } from "@/lib/context/promotion-context";
import { CartProvider } from "@/lib/context/cart-context";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

// Import Noto Sans Thai for Thai language support
import '@fontsource/noto-sans-thai/300.css';
import '@fontsource/noto-sans-thai/400.css';
import '@fontsource/noto-sans-thai/500.css';
import '@fontsource/noto-sans-thai/700.css';

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Allow zoom for accessibility
  userScalable: true,
  viewportFit: "cover", // For iPhone safe areas
};

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
    <html lang="th" style={{ colorScheme: 'light' }}>
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
          "min-h-screen bg-brutal-gray font-sans antialiased",
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
                    <CartProvider>
                      <MainLayout>{children}</MainLayout>
                    </CartProvider>
                      <Toaster
                        position="bottom-right"
                        containerStyle={{
                          zIndex: 50,
                        }}
                        toastOptions={{
                          duration: 4000,
                          style: {
                            background: '#FFFFFF',
                            color: '#1f2937',
                            border: '3px solid #000000',
                            boxShadow: '4px 4px 0 0 #000000',
                            borderRadius: '8px',
                            padding: '12px 16px',
                          },
                          success: {
                            iconTheme: {
                              primary: '#95E1D3',
                              secondary: '#000000',
                            },
                          },
                          error: {
                            iconTheme: {
                              primary: '#FF6B9D',
                              secondary: '#FFFFFF',
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
      </body>
    </html>
  );
}
