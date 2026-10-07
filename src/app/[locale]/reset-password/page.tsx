"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/api/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { localizeAuthError } from "@/components/auth/form-feedback";

// สร้าง schema ใน component เพื่อใช้ข้อความแปลจาก messages/th.json (auth.validation.*)
const buildResetSchema = (t: (key: string) => string) =>
  z
    .object({
      newPassword: z.string().min(8, t("validation.passwordMin")),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("validation.passwordMismatch"),
      path: ["confirmPassword"],
    });

type ResetValues = { newPassword: string; confirmPassword: string };

function ResetPasswordInner() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    resolver: zodResolver(buildResetSchema(t)),
    mode: "onBlur",
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!token) {
      setErrorMsg(t("resetTokenMissing"));
      return;
    }
    setErrorMsg(null);
    try {
      await resetPassword(token, values.newPassword);
      setIsSuccess(true);
    } catch (err) {
      setErrorMsg(localizeAuthError(err instanceof Error ? err.message : undefined, t("resetFailed"), t));
    }
  });

  return (
    <AuthShell>
      <div className="w-full space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-extrabold tracking-tight">{t("resetPasswordTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("resetPasswordDesc")}</p>
        </div>

        {isSuccess ? (
          <div className="rounded-[14px] border border-status-success/40 bg-status-success/10 p-5 text-center space-y-3">
            <CheckCircle2 className="mx-auto size-8 text-status-success" />
            <p className="text-sm font-semibold text-status-success">{t("resetPasswordSuccess")}</p>
            <Button asChild className="mt-2 w-full">
              <Link href="/login">{t("login")}</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newPassword">{t("password")}</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                placeholder={t("newPasswordPlaceholder")}
                {...register("newPassword")}
              />
              {errors.newPassword && (
                <p role="alert" className="text-xs text-destructive">
                  {errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p role="alert" className="text-xs text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {errorMsg ? (
              <p role="alert" className="text-xs text-destructive">
                {errorMsg}
              </p>
            ) : null}

            <Button type="submit" disabled={isSubmitting} className="mt-2 h-11 w-full font-semibold md:h-8">
              {isSubmitting ? t("settingPassword") : t("resetPasswordTitle")}
            </Button>
          </form>
        )}
      </div>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
