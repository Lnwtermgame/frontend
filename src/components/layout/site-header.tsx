"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { Link } from "@/i18n/routing";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { NavSearch } from "./nav-search";

function HeaderInner() {
  const t = useTranslations("nav");
  const ta = useTranslations("auth");
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    await signOut({ redirect: false }).catch(() => {});
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="text-sm font-extrabold tracking-wide">
          LNW<span className="text-primary">TERMGAME</span>
        </Link>
        <NavSearch />
        <nav className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
            <Link href="/games">{t("games")}</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
            <Link href="/card">{t("card")}</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="hidden lg:inline-flex">
            <Link href="/mobile-recharge">{t("mobile")}</Link>
          </Button>
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="hidden text-xs font-semibold sm:inline max-w-[120px] truncate">{user.username}</span>
              <Button variant="outline" size="sm" onClick={handleLogout} className="h-8 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm">
                {ta("logout")}
              </Button>
            </div>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild className="h-8 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm">
                <Link href="/login">{ta("login")}</Link>
              </Button>
              <Button size="sm" asChild className="hidden sm:inline-flex">
                <Link href="/register">{t("register")}</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteHeader() {
  return (
    <Suspense fallback={null}>
      <HeaderInner />
    </Suspense>
  );
}
