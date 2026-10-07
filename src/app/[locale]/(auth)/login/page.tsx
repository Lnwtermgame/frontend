"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LoginForm } from "@/components/auth/login-form";
import { OAuthSection } from "@/components/auth/oauth-buttons";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormAlert } from "@/components/auth/form-feedback";

function LoginContent() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("session_expired") === "true";

  return (
    <AuthShell>
      <h1 className="text-xl font-extrabold tracking-tight">{t("login")}</h1>
      <p className="mt-1 mb-5 text-sm text-muted-foreground">{t("welcomeBack")}</p>

      {sessionExpired && (
        <FormAlert variant="warning" className="mb-5">
          {t("sessionExpired")}
        </FormAlert>
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
