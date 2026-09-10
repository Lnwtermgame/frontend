"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "@/i18n/routing";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== "bootstrapping" && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [status, user, router, pathname]);

  if (status === "bootstrapping" || !user) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-16" role="status" aria-live="polite">
        <p className="text-center text-sm text-muted-foreground">กำลังโหลด…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="grid min-w-0 max-w-full items-start gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="min-w-0 max-w-full rounded-[14px] border bg-card p-2.5 lg:sticky lg:top-20">
          <DashboardSidebar />
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}
