"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Navbar from "./Navbar";
import FooterNew from "./FooterNew";
import { usePublicSettings } from "@/lib/context/public-settings-context";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { settings } = usePublicSettings();

  // Monitor mode: skip Navbar, Footer and wrapper — render children only
  const isMonitor = searchParams.get("monitor") === "1";
  if (isMonitor) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="site-container py-6">
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-6 h-6 border-2 border-site-accent border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            {children}
          </Suspense>
        </div>
      </main>
      <FooterNew />
    </div>
  );
}
