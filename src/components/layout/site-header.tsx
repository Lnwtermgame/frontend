"use client";

import Image from "next/image";
import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  UserRound,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NavSearch } from "./nav-search";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function HeaderInner() {
  const t = useTranslations("nav");
  const ta = useTranslations("auth");
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);

  const categories = [
    { href: "/games", label: t("games") },
    { href: "/card", label: t("card") },
    { href: "/mobile-recharge", label: t("mobile") },
    { href: "/support", label: t("support") },
  ];

  const handleLogout = async () => {
    await logout();
    await signOut({ redirect: false }).catch(() => {});
  };

  const logo = (
    <Link href="/" className="flex items-center gap-2">
      <Image
        src="/brand/logo-mark.png"
        alt=""
        width={1105}
        height={910}
        className="h-8 w-auto"
        priority
      />
      <span className="whitespace-nowrap text-sm font-extrabold tracking-wide">
        LNW<span className="text-primary">TERMGAME</span>
      </span>
    </Link>
  );

  const drawerLinkClass = (href: string) =>
    `rounded-[10px] px-3 py-2.5 text-sm font-semibold transition-colors ${
      isActive(pathname, href)
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-card hover:text-foreground"
    }`;

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3.5 px-4">
          {/* mobile: hamburger drawer */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="-ml-2 size-9 md:hidden"
                aria-label={t("menu")}
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="border-b py-3.5 pr-4 pl-4">
                <SheetTitle asChild>{logo}</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-0.5 p-3">
                {categories.map((c) => (
                  <Link
                    key={c.href}
                    href={c.href}
                    onClick={() => setMenuOpen(false)}
                    className={drawerLinkClass(c.href)}
                  >
                    {c.label}
                  </Link>
                ))}
                <div className="my-2 h-px bg-border/60" />
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className={drawerLinkClass("/dashboard")}
                    >
                      {t("dashboard")}
                    </Link>
                    <Link
                      href="/dashboard/orders"
                      onClick={() => setMenuOpen(false)}
                      className={drawerLinkClass("/dashboard/orders")}
                    >
                      {t("orders")}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        handleLogout();
                      }}
                      className="rounded-[10px] px-3 py-2.5 text-left text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
                    >
                      {ta("logout")}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className={drawerLinkClass("/login")}
                    >
                      {ta("login")}
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMenuOpen(false)}
                      className={drawerLinkClass("/register")}
                    >
                      {ta("register")}
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          {logo}

          {/* desktop search — วางกึ่งกลางช่องว่างระหว่างโลโก้กับเมนูขวา ไม่หนีบซ้าย */}
          <div className="hidden flex-1 justify-center md:flex">
            <NavSearch withButton className="w-full max-w-[520px]" />
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            {user ? (
              <Link
                href="/dashboard/orders"
                className="hidden items-center gap-1.5 rounded-[8px] px-2.5 py-2 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-card hover:text-foreground md:flex"
              >
                <Package className="size-[15px]" />
                {t("orders")}
              </Link>
            ) : null}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full border border-border/60 py-1 pr-2.5 pl-1 transition-colors hover:border-border hover:bg-card"
                  >
                    <span className="grid size-7 place-items-center rounded-full border bg-secondary text-xs font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                    <span className="hidden max-w-[120px] truncate text-[13px] font-semibold lg:inline">
                      {user.username}
                    </span>
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="truncate">
                    {user.username}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <LayoutDashboard className="size-4" />
                      {t("dashboard")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/orders">
                      <Package className="size-4" />
                      {t("orders")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/account">
                      <UserRound className="size-4" />
                      {t("account")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="size-4" />
                    {ta("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login">{ta("login")}</Link>
                </Button>
                <Button size="sm" asChild className="hidden sm:inline-flex">
                  <Link href="/register">{ta("register")}</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* mobile search row */}
        <div className="px-4 pb-3 md:hidden">
          <NavSearch withButton={false} className="block" />
        </div>
      </header>

      {/* second deck: categories (scrolls away, not sticky) */}
      <div className="border-b bg-card/50">
        <div className="mx-auto hidden h-11 max-w-6xl items-center px-4 md:flex">
          <nav className="flex h-full items-center">
            {categories.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className={`flex h-full items-center border-b-2 px-3.5 text-[13.5px] font-semibold transition-colors ${
                  isActive(pathname, c.href)
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.label}
              </Link>
            ))}
          </nav>
          <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-border/50 px-3 py-1 text-xs font-semibold text-muted-foreground">
            <span className="size-[7px] rounded-full bg-primary" />
            {t("autoBadge")}
          </span>
        </div>

        {/* mobile: category chips */}
        <div className="flex gap-2 overflow-x-auto px-4 py-2.5 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                isActive(pathname, c.href)
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

export function SiteHeader() {
  return (
    <Suspense fallback={null}>
      <HeaderInner />
    </Suspense>
  );
}
