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

const resetSchema = z
  .object({
    newPassword: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  });

type ResetValues = z.infer<typeof resetSchema>;

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
    resolver: zodResolver(resetSchema),
    mode: "onBlur",
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!token) {
      setErrorMsg("ไม่พบโทเค็นสำหรับการรีเซ็ตรหัสผ่าน กรุณาตรวจสอบลิงก์ในอีเมล");
      return;
    }
    setErrorMsg(null);
    try {
      await resetPassword(token, values.newPassword);
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err?.message || "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน");
    }
  });

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t("resetPasswordTitle")}</h1>
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
              placeholder="รหัสผ่านใหม่อย่างน้อย 8 ตัว"
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

          <Button type="submit" disabled={isSubmitting} className="mt-2 w-full font-semibold">
            {isSubmitting ? "กำลังตั้งรหัสผ่าน…" : t("resetPasswordTitle")}
          </Button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <Suspense fallback={null}>
        <ResetPasswordInner />
      </Suspense>
    </main>
  );
}
