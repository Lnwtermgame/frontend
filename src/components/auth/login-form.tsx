"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "@/i18n/routing";

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
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-semibold">อีเมล</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="rounded-md border px-3 py-2"
          {...register("email")}
        />
        {errors.email && (
          <p role="alert" className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-semibold">รหัสผ่าน</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="rounded-md border px-3 py-2"
          {...register("password")}
        />
        {errors.password && (
          <p role="alert" className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>
      {formError && <p role="alert" className="text-sm text-red-500">{formError}</p>}
      <button type="submit" disabled={isSubmitting} className="rounded-md px-4 py-2 font-semibold">
        {isSubmitting ? "กำลังเข้าสู่ระบบ…" : t("login")}
      </button>
    </form>
  );
}
