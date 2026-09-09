"use client";

import { useTranslations } from "next-intl";
import { Package, Receipt, Ticket, Heart, Coins } from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";

const ITEMS = [
  { href: "/dashboard/orders", key: "orders", Icon: Package },
  { href: "/dashboard/invoice", key: "invoices", Icon: Receipt },
  { href: "/dashboard/coupons", key: "coupons", Icon: Ticket },
  { href: "/dashboard/favorite", key: "favorites", Icon: Heart },
  { href: "/dashboard/credits", key: "credits", Icon: Coins },
] as const;

export function DashboardSidebar() {
  const t = useTranslations("dashboard");
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label={t("title")}>
      {ITEMS.map(({ href, key, Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-semibold transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-card hover:text-foreground"
            }`}
          >
            <Icon className="size-4" />
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
