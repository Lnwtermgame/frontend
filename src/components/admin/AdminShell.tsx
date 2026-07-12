"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { useAuth } from "@/lib/context/auth-context";

/**
 * Persistent admin shell — lives in the admin route GROUP layout so it
 * stays mounted across navigations between admin pages. This prevents
 * sidebar/topbar remount flicker.
 *
 * Individual admin pages should NOT wrap themselves in AdminLayout anymore.
 * They render their content directly (PageContainer, etc.).
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAdmin, isInitialized, isSessionChecked } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (isInitialized && isSessionChecked && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, router, isInitialized, isSessionChecked]);

  // Full-screen spinner only on initial auth resolution.
  // Once resolved, the shell persists — only children swap.
  if (!isInitialized || !isSessionChecked || !isAdmin) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-site-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <AdminSidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminTopbar onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-[1400px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
