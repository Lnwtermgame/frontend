"use client";

import { Menu, Sun, Moon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/lib/hooks/use-theme";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/context/auth-context";

export function AdminTopbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const t = useTranslations("Admin");
  const { user } = useAuth();

  // Derive breadcrumb from path: /th/admin/products → "Admin › สินค้า"
  const segments = pathname.split("/").filter(Boolean);
  const adminIdx = segments.indexOf("admin");
  const crumbs = segments.slice(adminIdx + 1);

  return (
    <div className="h-14 flex items-center gap-3 px-4 border-b border-site-border-soft bg-site-surface sticky top-0 z-30">
      <button
        onClick={onOpenMobile}
        className="lg:hidden p-2 rounded-lg text-site-muted hover:bg-site-raised"
        aria-label="Menu"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="text-xs text-site-dim hidden sm:block">
        <span>{t("admin_cp")}</span>
        {crumbs.length > 0 && (
          <>
            {" › "}
            <span className="text-site-muted font-medium capitalize">{crumbs.join(" › ")}</span>
          </>
        )}
      </div>
      <div className="flex-1" />
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg text-site-muted hover:bg-site-raised hover:text-site-text transition-colors"
        aria-label={theme === "dark" ? t("switch_light") : t("switch_dark")}
        title={theme === "dark" ? t("switch_light") : t("switch_dark")}
      >
        {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-semantic-violet to-semantic-blue flex items-center justify-center text-[10px] font-bold text-white uppercase">
        {user?.username?.charAt(0) ?? "A"}
      </div>
    </div>
  );
}
