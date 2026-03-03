"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import UserSidebar, { DashboardLayout } from "@/components/account/UserSidebar";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isSessionChecked } = useAuth();

  useEffect(() => {
    if (isSessionChecked && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, router, isSessionChecked, pathname]);

  if (!isSessionChecked) {
    return null;
  }

  if (!user) {
    return null;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
