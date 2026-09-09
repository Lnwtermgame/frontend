"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/auth";
import { Link, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัว"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect");
  const loginWithPassword = useAuthStore((s) => s.loginWithPassword);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await loginWithPassword(values.email, values.password);
    if (result.ok) {
      // Safe redirect: must start with / and not //
      if (redirectPath && redirectPath.startsWith("/") && !redirectPath.startsWith("//")) {
        // Strip locale prefix if present (/th/...) because i18n router handles it
        const target = redirectPath.replace(/^\/th(\/|$)/, "$1") || "/";
        router.replace(target as never);
      } else {
        router.replace("/");
      }
    } else {
      setFormError(result.message ?? t("loginFailed"));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
        />
        {errors.email && (
          <p role="alert" className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t("password")}</Label>
          <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary hover:underline">
            {t("forgotPassword")}
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
        />
        {errors.password && (
          <p role="alert" className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>
      {formError && <p role="alert" className="text-xs text-destructive">{formError}</p>}
      <Button type="submit" disabled={isSubmitting} className="mt-2 w-full font-semibold">
        {isSubmitting ? "กำลังเข้าสู่ระบบ…" : t("login")}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          {t("register")}
        </Link>
      </p>
    </form>
  );
}
