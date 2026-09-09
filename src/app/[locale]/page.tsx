"use client";

import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { useRouter } from "@/i18n/routing";
import { useAuthStore } from "@/stores/auth";

export default function HomePage() {
  const t = useTranslations("home");
  const ta = useTranslations("auth");
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    await signOut({ redirect: false }).catch(() => {});
    router.replace("/");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="opacity-70">{t("placeholder")}</p>
      {status === "authenticated" && user ? (
        <div className="flex items-center gap-3">
          <span>สวัสดี {user.username}</span>
          <button type="button" onClick={handleLogout} className="rounded-md border px-3 py-1">
            {ta("logout")}
          </button>
        </div>
      ) : (
        <a href="/th/login" className="rounded-md border px-3 py-1">{ta("login")}</a>
      )}
    </main>
  );
}
