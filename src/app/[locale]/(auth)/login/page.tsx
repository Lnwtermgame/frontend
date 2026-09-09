"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { LoginForm } from "@/components/auth/login-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

function LoginContent() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("session_expired") === "true";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-xl font-bold">{t("login")}</h1>
      {sessionExpired && (
        <p role="alert" className="rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm">
          เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง
        </p>
      )}
      <LoginForm />
      <OAuthButtons />
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
