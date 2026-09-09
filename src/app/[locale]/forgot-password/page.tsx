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

const forgotSchema = z.object({
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
});

type ForgotValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const [isSent, setIsSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    mode: "onBlur",
  });

  const onSubmit = handleSubmit(async (values) => {
    setErrorMsg(null);
    try {
      await requestPasswordReset(values.email);
      setIsSent(true);
    } catch (err: any) {
      setErrorMsg(err?.message || "เกิดข้อผิดพลาดในการส่งคำขอ");
    }
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="w-full max-w-sm space-y-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-3.5" />
          {t("login")}
        </Link>

        <div>
          <h1 className="text-2xl font-bold">{t("forgotPasswordTitle")}</h1>
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
                {...register("email")}
              />
              {errors.email && (
                <p role="alert" className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            {errorMsg ? (
              <p role="alert" className="text-xs text-destructive">
                {errorMsg}
              </p>
            ) : null}

            <Button type="submit" disabled={isSubmitting} className="mt-2 w-full font-semibold">
              {isSubmitting ? "กำลังส่งคำขอ…" : t("sendResetLink")}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
