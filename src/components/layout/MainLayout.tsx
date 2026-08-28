"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { UtilityBar } from "./UtilityBar";
import MainNav from "./MainNav";
import Footer from "./Footer";
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

  // Admin pages render their own full-viewport shell (AdminShell) — skip
  // the storefront Navbar/Footer/container so the shell isn't nested inside
  // site-container.
  const isAdmin = pathname.includes("/admin");
  if (isAdmin) {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-6 h-6 border-2 border-site-accent border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        {children}
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <UtilityBar />
      <MainNav />
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
      <Footer />
    </div>
  );
}
