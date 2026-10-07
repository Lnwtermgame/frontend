"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/api/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { FieldError, FormAlert, localizeAuthError } from "@/components/auth/form-feedback";

// สร้าง schema ใน component เพื่อใช้ข้อความแปลจาก messages/th.json (auth.validation.*)
const buildForgotSchema = (t: (key: string) => string) =>
  z.object({
    email: z.string().email(t("validation.emailInvalid")),
  });

type ForgotValues = { email: string };

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const [isSent, setIsSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({
    resolver: zodResolver(buildForgotSchema(t)),
    mode: "onBlur",
  });

  const onSubmit = handleSubmit(async (values) => {
    setErrorMsg(null);
    try {
      await requestPasswordReset(values.email);
      setIsSent(true);
    } catch (err) {
      setErrorMsg(localizeAuthError(err instanceof Error ? err.message : undefined, t("requestFailed"), t));
    }
  });

  return (
    <AuthShell>
      <div className="w-full space-y-6">
        <Link
          href="/login"
          className="-mt-2 mb-1 inline-flex min-h-11 items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-3.5" />
          {t("login")}
        </Link>

        <div>
          <h1 className="text-xl font-extrabold tracking-tight">{t("forgotPasswordTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("forgotPasswordDesc")}</p>
        </div>

        {isSent ? (
          <div className="rounded-[14px] border border-status-success/40 bg-status-success/10 p-5 text-center space-y-3">
            <CheckCircle2 className="mx-auto size-8 text-status-success" />
            <p className="text-sm font-semibold text-status-success">{t("resetLinkSent")}</p>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link href="/login">{t("login")}</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email", { onChange: () => setErrorMsg(null) })}
              />
              <FieldError id="email-error" message={errors.email?.message} />
            </div>

            {errorMsg ? <FormAlert variant="error">{errorMsg}</FormAlert> : null}

            <Button type="submit" disabled={isSubmitting} className="h-11 w-full font-semibold md:h-9">
              {isSubmitting ? t("sendingRequest") : t("sendResetLink")}
            </Button>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
