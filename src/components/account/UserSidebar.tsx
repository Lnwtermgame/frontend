"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  DollarSign,
  ShoppingCart,
  CreditCard,
  FileText,
  Ticket,
  Heart,
  Gift,
  Bell,
  LogOut,
  GamepadIcon,
  CreditCard as CardIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations, useLanguage } from "@/lib/context/language-context";
import { useState, useEffect, useMemo, memo } from "react";
import { motion } from "@/lib/framer-exports";

// Use memo to prevent unnecessary re-renders
const NavItem = memo(function NavItem({
  href,
  label,
  icon,
  isActive,
  locale
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  locale: string;
}) {
  // Pre-compute classes to avoid calculation during render
  const linkClasses = cn(
    "flex items-center gap-3 px-4 py-3 rounded-md relative overflow-hidden transition-all",
    isActive
      ? "bg-mali-blue/30 text-white font-medium"
      : "text-mali-text-secondary hover:bg-mali-blue/20 hover:text-white"
  );

  // Use inline style for font family to ensure it's applied instantly
  const fontStyle = locale === "th"
    ? { fontFamily: "var(--font-thai)", transition: "none" }
    : { transition: "none" };

  return (
    <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
      <Link
        href={href}
        className={linkClasses}
        style={fontStyle}
        prefetch={false} // Disable prefetching to reduce flicker during navigation
      >
        <span className={cn(
          "flex items-center justify-center relative z-10",
          isActive ? "text-mali-blue-accent" : "text-mali-text-secondary group-hover:text-white"
        )}>
          {icon}
        </span>
        <span className="text-sm font-medium relative z-10" style={fontStyle}>
          {label}
        </span>
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-mali-blue-accent rounded-r"></div>
        )}
      </Link>
    </motion.div>
  );
});

// Use memo for the entire sidebar component
const UserSidebar = memo(function UserSidebar() {
  const pathname = usePathname();
  const { t } = useTranslations();
  const { locale, isLoaded } = useLanguage();

  // Create navigation items array with memoization
  const navItems = useMemo(() => [
    {
      href: "/account",
      label: t("myAccount"),
      icon: <User className="w-5 h-5" />
    },
    {
      href: "/top-up",
      label: t("topUp"),
      icon: <DollarSign className="w-5 h-5" />
    },
    {
      href: "/orders",
      label: t("myOrders"),
      icon: <ShoppingCart className="w-5 h-5" />
    },
    {
      href: "/my-cards",
      label: t("myCards"),
      icon: <CreditCard className="w-5 h-5" />
    },
    {
      href: "/invoice",
      label: t("myInvoice"),
      icon: <FileText className="w-5 h-5" />
    },
    {
      href: "/coupons",
      label: t("myCoupons"),
      icon: <Ticket className="w-5 h-5" />
    },
    {
      href: "/favorite",
      label: t("myFavorite"),
      icon: <Heart className="w-5 h-5" />
    },
    {
      href: "/lucky-draw",
      label: t("myLuckyDraw"),
      icon: <Gift className="w-5 h-5" />
    },
    {
      href: "/balance",
      label: t("balance"),
      icon: <DollarSign className="w-5 h-5" />
    },
    {
      href: "/credits",
      label: t("credits"),
      icon: <DollarSign className="w-5 h-5" />
    },
    {
      href: "/notifications",
      label: t("notifications"),
      icon: <Bell className="w-5 h-5" />
    }
  ], [t]);

  // If not loaded yet, return a skeleton with same dimensions to prevent layout shift
  if (!isLoaded) {
    return (
      <div className="w-full rounded-xl overflow-hidden">
        <div className="p-4 border-b border-mali-blue/20 bg-mali-sidebar">
          <div className="h-6 bg-mali-blue/20 w-32 rounded animate-pulse"></div>
        </div>
        <div className="p-4 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 animate-pulse"
            >
              <div className="h-5 w-5 rounded-full bg-mali-blue/20"></div>
              <div className="h-4 w-24 bg-mali-blue/20 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden">
      <div className="p-4 border-b border-mali-blue/20 bg-mali-sidebar">
        <h3 className="text-white font-medium text-sm">{t("menu")}</h3>
      </div>
      <div className="p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={isActive}
              locale={locale}
            />
          );
        })}
        <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
          <button
            className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-md text-mali-text-secondary hover:bg-mali-blue/20 hover:text-white"
            style={{ fontFamily: locale === "th" ? "var(--font-thai)" : "inherit", transition: "none" }}
          >
            <LogOut className="w-5 h-5" />
            <span
              className="text-sm font-medium"
              style={{ fontFamily: locale === "th" ? "var(--font-thai)" : "inherit", transition: "none" }}
            >
              {t("logout")}
            </span>
          </button>
        </motion.div>
      </div>
    </div>
  );
});

export default UserSidebar; 