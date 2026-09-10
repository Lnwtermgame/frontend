"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/auth";
import { Link, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { PasswordInput } from "@/components/auth/password-input";
import { AuthDivider, AuthShell } from "@/components/auth/auth-shell";

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร")
      .max(30, "ชื่อผู้ใช้ต้องไม่เกิน 30 ตัวอักษร")
      .regex(/^[a-zA-Z0-9_-]+$/, "ชื่อผู้ใช้ต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข _ หรือ - เท่านั้น"),
    email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
    password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

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
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await registerWithPassword(values.username, values.email, values.password);
    if (result.ok) {
      router.replace("/");
    } else {
      setFormError(result.message ?? t("registerFailed"));
    }
  });

  return (
    <AuthShell>
      <h1 className="text-xl font-extrabold tracking-tight">{t("register")}</h1>
      <p className="mt-1 mb-5 text-[13px] text-muted-foreground">{t("registerSub")}</p>

      <OAuthButtons />
      <AuthDivider label={t("orWithEmail")} />

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="username">{t("username")}</Label>
          <Input id="username" type="text" autoComplete="username" {...register("username")} />
          {errors.username && (
            <p role="alert" className="text-xs text-destructive">
              {errors.username.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">{t("email")}</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email && (
            <p role="alert" className="text-xs text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{t("password")}</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder={t("passwordHint")}
            {...register("password")}
          />
          {errors.password && (
            <p role="alert" className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p role="alert" className="text-xs text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {formError ? (
          <p role="alert" className="text-xs text-destructive">
            {formError}
          </p>
        ) : null}

        <Button type="submit" disabled={isSubmitting} className="mt-1 h-11 w-full font-semibold">
          {isSubmitting ? t("registering") : t("register")}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          {t("haveAccount")}{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            {t("login")}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
