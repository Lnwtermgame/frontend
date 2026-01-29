import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { Provider } from "@/components/ui/provider"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Box, Flex } from "@chakra-ui/react"

import { AuthProvider } from "@/context/auth-context"

export const metadata: Metadata = {
  title: "GameTopUp - Premium Game Top-up Service",
  description: "Fast and secure game top-up service",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Provider>
          <AuthProvider>
            <Flex direction="column" minH="100vh">
              <Header />
              <Box flex="1">
                {children}
              </Box>
              <Footer />
            </Flex>
          </AuthProvider>
        </Provider>
      </body>
    </html>
  );
}
