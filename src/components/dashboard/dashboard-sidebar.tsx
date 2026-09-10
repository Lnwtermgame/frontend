"use client";

import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import {
  Package,
  Receipt,
  Ticket,
  Heart,
  Coins,
  User,
  Bell,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { useAuthStore } from "@/stores/auth";
import { useCreditBalance } from "@/lib/query/hooks";
import { formatTHB } from "@/lib/pricing";

const ITEMS = [
  { href: "/dashboard/orders", key: "orders", Icon: Package },
  { href: "/dashboard/account", key: "account", Icon: User, exact: true },
  { href: "/dashboard/notifications", key: "notifications", Icon: Bell },
  { href: "/dashboard/invoice", key: "invoices", Icon: Receipt },
  { href: "/dashboard/coupons", key: "coupons", Icon: Ticket },
  { href: "/dashboard/favorite", key: "favorites", Icon: Heart },
  { href: "/dashboard/credits", key: "credits", Icon: Coins },
] as const;

export function DashboardSidebar() {
  const t = useTranslations("dashboard");
  const ta = useTranslations("auth");
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const balance = useCreditBalance();

  const handleLogout = async () => {
    await logout();
    await signOut({ redirect: false }).catch(() => {});
  };

  return (
    <div>
      <div className="flex items-center gap-3 px-2 pt-1 pb-3 lg:border-b lg:border-border/60">
        <span
          aria-hidden
          className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/15 text-base font-bold text-primary"
        >
          {(user?.username ?? "?").charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold">{user?.username}</span>
          <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
        </span>
      </div>

      <Link
        href="/dashboard/credits"
        className="mt-3 flex items-center gap-2 rounded-[10px] border border-primary/25 bg-primary/[0.07] px-3 py-2"
      >
        <span className="text-xs font-semibold text-muted-foreground">{t("creditBalance")}</span>
        <span className="num ml-auto text-sm font-bold text-primary">
          {balance.isLoading ? "…" : formatTHB(balance.data?.balance ?? 0)}
        </span>
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
      </Link>

      <nav className="mt-2 flex gap-0.5 overflow-x-auto lg:flex-col" aria-label={t("title")}>
        {ITEMS.map(({ href, key, Icon, ...rest }) => {
          const isExact = "exact" in rest && rest.exact;
          const active = isExact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "bg-primary/12 text-primary"
                  : "text-muted-foreground hover:bg-card hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              {t(key)}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-2 flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-card hover:text-destructive"
      >
        <LogOut className="size-4" />
        {ta("logout")}
      </button>
    </div>
  );
}
