"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "@/i18n/routing";
import { resolveSafeRedirect } from "@/lib/auth-redirect";

/**
 * Guest-only guard สำหรับ /login และ /register
 *
 * auth state อยู่ฝั่ง client (zustand + refresh token) จึงตรวจใน middleware ไม่ได้
 * — ตัดสินครั้งเดียวตอน bootstrap เสร็จ: ถ้าเข้าสู่ระบบอยู่แล้ว → พาออกไปหน้า redirect/หน้าแรก
 * หลังตัดสินแล้วจะไม่ redirect ซ้ำ เพื่อไม่ชนกับ redirect ของฟอร์มเอง
 * (เช่น สมัครสำเร็จ → /verify-email, login สำเร็จ → ?redirect=)
 */
function GuestOnly({ children }: { children: React.ReactNode }) {
  const tc = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const decided = useRef(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (decided.current || status === "bootstrapping") return;
    decided.current = true;
    if (user) {
      router.replace(resolveSafeRedirect(searchParams.get("redirect")) as never);
    } else {
      setAllowed(true);
    }
  }, [status, user, router, searchParams]);

  if (!allowed) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-16" role="status" aria-live="polite">
        <p className="text-center text-sm text-muted-foreground">{tc("loading")}</p>
      </div>
    );
  }

  return <>{children}</>;
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <GuestOnly>{children}</GuestOnly>
    </Suspense>
  );
}
