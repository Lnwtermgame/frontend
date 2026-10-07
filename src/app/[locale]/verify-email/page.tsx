"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2, XCircle, RefreshCw, MailCheck } from "lucide-react";
import { Link } from "@/i18n/routing";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/auth/auth-shell";
import { verifyEmail, resendVerification } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth";

function VerifyEmailInner() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";
  // ?new=1 = มาจากหน้าสมัครสมาชิก — แสดงข้อความชวนตรวจอีเมลแทนการยืนยันโทเค็น
  const isNewRegistration = searchParams.get("new") === "1";
  const storedEmail = useAuthStore((s) => s.user?.email) ?? "";

  const [status, setStatus] = useState<"loading" | "success" | "error">(() =>
    token && email ? "loading" : "error",
  );
  const [resending, setResending] = useState(false);
  const [resentMsg, setResentMsg] = useState(false);

  // อีเมลปลายทางสำหรับส่งซ้ำ: จากลิงก์ หรือจากเซสชันที่เพิ่งสมัคร
  const resendTarget = email || storedEmail;

  useEffect(() => {
    // ไม่มีโทเค็น = ลิงก์ไม่สมบูรณ์ — ค่าเริ่มต้นของ state ก็เป็น "error" อยู่แล้ว จึงไม่ต้อง setState ซ้ำ
    if (isNewRegistration || !token || !email) return;
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
  }, [token, email, isNewRegistration]);

  const handleResend = async () => {
    if (!resendTarget) return;
    setResending(true);
    try {
      await resendVerification(resendTarget);
      setResentMsg(true);
      toast.success(t("resendToastOk"));
    } catch {
      toast.error(t("resendToastFailed"));
    } finally {
      setResending(false);
    }
  };

  const resendBlock = resentMsg ? (
    <p className="text-xs font-semibold text-status-success">{t("verificationResent")}</p>
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
  );

  return (
    <AuthShell>
      <div className="w-full space-y-6 text-center">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">{t("verifyEmailTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isNewRegistration ? t("verifyEmailDescNew") : t("verifyEmailDescCheck")}
          </p>
        </div>

        {isNewRegistration ? (
          /* มาจากหน้าสมัคร — ชวนผู้ใช้ไปกดยืนยันในอีเมล */
          <div className="space-y-4 rounded-[14px] border border-status-success/40 bg-status-success/10 p-6">
            <MailCheck className="mx-auto size-10 text-status-success" />
            <p className="text-sm font-semibold text-status-success">
              {t("verifyEmailRegisteredNotice")}
            </p>
            {resendTarget ? (
              <p className="num break-all text-xs text-muted-foreground-strong">{resendTarget}</p>
            ) : null}
            {resendTarget ? (
              <div className="space-y-2 border-t border-status-success/20 pt-3">{resendBlock}</div>
            ) : null}
            <Button asChild variant="ghost" size="sm" className="h-11 w-full md:h-7">
              <Link href="/">{tc("backHome")}</Link>
            </Button>
          </div>
        ) : status === "loading" ? (
          <div className="space-y-3 rounded-[14px] border bg-card p-6">
            <p className="text-sm text-muted-foreground">{t("verifyingEmail")}</p>
          </div>
        ) : status === "success" ? (
          <div className="space-y-3 rounded-[14px] border border-status-success/40 bg-status-success/10 p-6">
            <CheckCircle2 className="mx-auto size-10 text-status-success" />
            <p className="text-sm font-semibold text-status-success">{t("verifyEmailSuccess")}</p>
            <Button asChild className="mt-2 h-11 w-full md:h-8">
              <Link href="/login">{t("login")}</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4 rounded-[14px] border border-destructive/40 bg-destructive/10 p-6">
            <XCircle className="mx-auto size-10 text-destructive" />
            <p className="text-sm font-semibold text-destructive">{t("verifyEmailFailed")}</p>
            {resendTarget ? (
              <div className="space-y-2 border-t border-destructive/20 pt-3">{resendBlock}</div>
            ) : null}
            <Button asChild variant="ghost" size="sm" className="h-11 w-full md:h-7">
              <Link href="/login">{t("login")}</Link>
            </Button>
          </div>
        )}
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}
