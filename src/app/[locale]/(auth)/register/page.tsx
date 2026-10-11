"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth";
import { Link, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OAuthSection } from "@/components/auth/oauth-buttons";
import { PasswordInput } from "@/components/auth/password-input";
import { AuthShell } from "@/components/auth/auth-shell";
import { FieldError, FormAlert, localizeAuthError } from "@/components/auth/form-feedback";

// สร้าง schema ใน component เพื่อใช้ข้อความแปลจาก messages/th.json (auth.validation.*)
const buildRegisterSchema = (t: (key: string) => string) =>
  z
    .object({
      username: z
        .string()
        .min(3, t("validation.usernameMin"))
        .max(30, t("validation.usernameMax"))
        .regex(/^[a-zA-Z0-9_-]+$/, t("validation.usernameFormat")),
      email: z.string().min(1, t("validation.emailRequired")).email(t("validation.emailInvalid")),
      password: z.string().min(8, t("validation.passwordMin")),
      confirmPassword: z.string().min(1, t("validation.confirmPasswordRequired")),
      // ต้องติ๊กยอมรับเงื่อนไขก่อนส่งแบบฟอร์ม
      terms: z.boolean().refine((v) => v === true, t("validation.termsRequired")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("validation.passwordMismatch"),
      path: ["confirmPassword"],
    });

type RegisterValues = { username: string; email: string; password: string; confirmPassword: string; terms: boolean };

export default function RegisterPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const registerWithPassword = useAuthStore((s) => s.registerWithPassword);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(buildRegisterSchema(t)),
    mode: "onTouched",
    defaultValues: { terms: false },
  });

  const clearFormError = () => setFormError(null);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await registerWithPassword(values.username, values.email, values.password);
    if (result.ok) {
      // สมัครสำเร็จ → พาไปหน้ายืนยันอีเมล (?new=1 = แสดงข้อความชวนตรวจอีเมล) แทนการดรอปลงหน้าแรกเงียบๆ
      toast.success(t("registerToast"));
      router.replace("/verify-email?new=1");
    } else {
      setFormError(localizeAuthError(result.message, t("registerFailed"), t));
    }
  });

  return (
    <AuthShell>
      <h1 className="text-xl font-bold tracking-tight">{t("register")}</h1>
      <p className="mt-1 mb-5 text-sm text-muted-foreground">{t("registerSub")}</p>

      <OAuthSection dividerLabel={t("orWithEmail")} />

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="username">{t("username")}</Label>
          <Input
            id="username"
            type="text"
            autoComplete="username"
            aria-invalid={!!errors.username}
            aria-describedby={errors.username ? "username-error" : undefined}
            {...register("username", { onChange: clearFormError })}
          />
          <FieldError id="username-error" message={errors.username?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email", { onChange: clearFormError })}
          />
          <FieldError id="email-error" message={errors.email?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{t("password")}</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder={t("passwordHint")}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password", { onChange: clearFormError })}
          />
          <FieldError id="password-error" message={errors.password?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
            {...register("confirmPassword", { onChange: clearFormError })}
          />
          <FieldError id="confirmPassword-error" message={errors.confirmPassword?.message} />
        </div>

        {/* ยอมรับเงื่อนไข — ลิงก์อยู่ใน label แต่คลิกลิงก์ไม่กระทบการติ๊ก (interactive content ยกเว้น label activation) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-start gap-2.5">
            <input
              id="terms"
              type="checkbox"
              className="mt-0.5 size-4 shrink-0 cursor-pointer rounded-[4px] accent-primary"
              aria-invalid={!!errors.terms}
              aria-describedby={errors.terms ? "terms-error" : undefined}
              {...register("terms", { onChange: clearFormError })}
            />
            <Label
              htmlFor="terms"
              className="cursor-pointer text-sm font-normal leading-normal text-muted-foreground"
            >
              {t("termsAgreePrefix")}{" "}
              <Link href="/terms" className="font-semibold text-primary hover:underline">
                {t("termsOfService")}
              </Link>{" "}
              {t("andJoin")}{" "}
              <Link href="/privacy" className="font-semibold text-primary hover:underline">
                {t("privacyPolicy")}
              </Link>
            </Label>
          </div>
          <FieldError id="terms-error" message={errors.terms?.message} />
        </div>

        {formError ? <FormAlert variant="error">{formError}</FormAlert> : null}

        <Button type="submit" disabled={isSubmitting} className="h-11 w-full font-semibold">
          {isSubmitting ? t("registering") : t("register")}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          {t("haveAccount")}{" "}
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center font-semibold text-primary hover:underline md:min-h-0"
          >
            {t("login")}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
