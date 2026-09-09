"use client";

import { useState } from "react";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { Search } from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { useAuthStore } from "@/stores/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function HeaderInner() {
  const t = useTranslations("nav");
  const ta = useTranslations("auth");
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [query, setQuery] = useState("");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(query.trim() ? `/games?search=${encodeURIComponent(query.trim())}` : "/games");
  };

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
        <form onSubmit={submitSearch} className="relative hidden flex-1 max-w-md sm:block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="pl-9"
          />
        </form>
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
                <Link href="/login">{t("register")}</Link>
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
