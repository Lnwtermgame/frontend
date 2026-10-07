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
import { PasswordInput } from "@/components/auth/password-input";
import { FieldError, FormAlert, localizeAuthError } from "@/components/auth/form-feedback";

// หน้า login ไม่บังคับความยาวรหัสผ่าน (กฎ 8 ตัวใช้ตอนสมัคร/ตั้งใหม่เท่านั้น)
// ให้ backend ตัดสินว่าถูกต้องหรือไม่ — กันข้อความ 2 ชุดขัดกันบนหน้าจอ
// (สร้าง schema ใน component เพื่อใช้ข้อความแปลจาก messages/th.json)
const buildLoginSchema = (t: (key: string) => string) =>
  z.object({
    email: z.string().min(1, t("validation.emailRequired")).email(t("validation.emailInvalid")),
    password: z.string().min(1, t("validation.passwordRequired")),
  });

type LoginValues = { email: string; password: string };

// โลแคลที่รองรับ — ประกาศซ้ำจาก i18n/routing.ts (ไฟล์นั้นไม่ได้ export ลิสต์โลแคล)
// เมื่อเพิ่ม "en" ใน routing.ts ให้เติมที่นี่ด้วย แล้วการถอด prefix จะยังทำงานถูกต้อง
const SUPPORTED_LOCALES = ["th"] as const;
// ถอด prefix โลแคลนำหน้า (/th/... → /...) เพราะ i18n router จะใส่กลับให้เอง
const LOCALE_PREFIX_RE = new RegExp(`^/(?:${SUPPORTED_LOCALES.join("|")})(?=/|$)`);

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
    resolver: zodResolver(buildLoginSchema(t)),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  // เมื่อผู้ใช้แก้ไขช่องใด ๆ ให้ล้างข้อความจาก server ที่ค้างอยู่
  const clearFormError = () => setFormError(null);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await loginWithPassword(values.email, values.password);
    if (result.ok) {
      // Safe redirect: must start with / and not //
      if (redirectPath && redirectPath.startsWith("/") && !redirectPath.startsWith("//")) {
        // Strip locale prefix if present (/th/...) because i18n router handles it
        const target = redirectPath.replace(LOCALE_PREFIX_RE, "") || "/";
        router.replace(target as never);
      } else {
        router.replace("/");
      }
    } else {
      setFormError(localizeAuthError(result.message, t("loginFailed"), t));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex w-full flex-col gap-4">
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
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="password">{t("password")}</Label>
          <Link
            href="/forgot-password"
            className="-my-2 flex min-h-11 items-center text-xs text-muted-foreground hover:text-primary hover:underline md:min-h-0 md:py-0"
          >
            {t("forgotPassword")}
          </Link>
        </div>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password", { onChange: clearFormError })}
        />
        <FieldError id="password-error" message={errors.password?.message} />
      </div>

      {/* ข้อความระดับฟอร์ม (จาก server) — กล่องเดียว เหนือปุ่ม แยกจาก error รายช่อง */}
      {formError ? <FormAlert variant="error">{formError}</FormAlert> : null}

      <Button type="submit" disabled={isSubmitting} className="h-11 w-full font-semibold md:h-9">
        {isSubmitting ? t("loggingIn") : t("login")}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        {t("noAccount")}{" "}
        <Link
          href="/register"
          className="inline-flex min-h-11 items-center font-semibold text-primary hover:underline md:min-h-0"
        >
          {t("register")}
        </Link>
      </p>
    </form>
  );
}
