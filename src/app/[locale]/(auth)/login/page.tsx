"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LoginForm } from "@/components/auth/login-form";
import { OAuthSection } from "@/components/auth/oauth-buttons";
import { AuthShell } from "@/components/auth/auth-shell";

function LoginContent() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("session_expired") === "true";

  return (
    <AuthShell>
      <h1 className="text-xl font-extrabold tracking-tight">{t("login")}</h1>
      <p className="mt-1 mb-5 text-[13px] text-muted-foreground">{t("welcomeBack")}</p>

      {sessionExpired && (
        <p
          role="alert"
          className="mb-4 rounded-[10px] border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-400"
        >
          เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง
        </p>
      )}

      <OAuthSection dividerLabel={t("orWithEmail")} />
      <LoginForm />
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
