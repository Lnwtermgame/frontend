"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { verifyEmail, resendVerification } from "@/lib/api/auth";

function VerifyEmailInner() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [resending, setResending] = useState(false);
  const [resentMsg, setResentMsg] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setStatus("error");
      return;
    }
    let cancelled = false;
    verifyEmail(email, token)
      .then(() => {
        if (!cancelled) setStatus("success");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [token, email]);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await resendVerification(email);
      setResentMsg(true);
    } catch {
      // noop
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6 text-center">
      <h1 className="text-2xl font-bold">{t("verifyEmailTitle")}</h1>

      {status === "loading" ? (
        <div className="rounded-[14px] border bg-card p-6 space-y-3">
          <p className="text-sm text-muted-foreground">กำลังตรวจสอบการยืนยันอีเมล…</p>
        </div>
      ) : status === "success" ? (
        <div className="rounded-[14px] border border-status-success/40 bg-status-success/10 p-6 space-y-3">
          <CheckCircle2 className="mx-auto size-10 text-status-success" />
          <p className="text-sm font-semibold text-status-success">{t("verifyEmailSuccess")}</p>
          <Button asChild className="mt-2 w-full">
            <Link href="/login">{t("login")}</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-[14px] border border-destructive/40 bg-destructive/10 p-6 space-y-4">
          <XCircle className="mx-auto size-10 text-destructive" />
          <p className="text-sm font-semibold text-destructive">{t("verifyEmailFailed")}</p>
          {email ? (
            <div className="space-y-2 border-t border-destructive/20 pt-3">
              {resentMsg ? (
                <p className="text-xs text-status-success font-semibold">{t("verificationResent")}</p>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={resending}
                  onClick={handleResend}
                  className="w-full gap-1.5"
                >
                  <RefreshCw className="size-3.5" />
                  {t("resendVerification")}
                </Button>
              )}
            </div>
          ) : null}
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link href="/login">{t("login")}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <Suspense fallback={null}>
        <VerifyEmailInner />
      </Suspense>
    </main>
  );
}
