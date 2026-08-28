"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  DollarSign,
  ShoppingCart,
  FileText,
  Ticket,
  Heart,
  Bell,
  LayoutGrid,
  X,
  Menu,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo, memo, useState, useEffect } from "react";
import { useTranslations } from "next-intl";

const NavItem = memo(function NavItem({
  href,
  label,
  icon,
  isActive,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-6 text-[13px] transition-colors",
        isActive
          ? "bg-site-raised text-site-text"
          : "text-site-muted hover:text-site-text hover:bg-site-raised",
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center w-7 h-7 rounded-4 transition-colors",
          isActive
            ? "bg-site-accent text-site-bg"
            : "bg-site-surface text-site-muted",
        )}
      >
        {icon}
      </span>
      <span className="relative z-10">{label}</span>
    </Link>
  );
});

const UserSidebar = memo(function UserSidebar({
  isOpen = true,
  onClose,
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const t = useTranslations("UserMenu");
  const tAccount = useTranslations("Account");

  const navItems = useMemo(
    () => [
      {
        href: "/dashboard/account",
        label: t("my_account"),
        icon: <User className="w-[18px] h-[18px]" />,
      },
      {
        href: "/dashboard/orders",
        label: t("my_orders"),
        icon: <ShoppingCart className="w-[18px] h-[18px]" />,
      },
      {
        href: "/dashboard/invoice",
        label: t("my_invoices"),
        icon: <FileText className="w-[18px] h-[18px]" />,
      },
      {
        href: "/dashboard/coupons",
        label: t("my_coupons"),
        icon: <Ticket className="w-[18px] h-[18px]" />,
      },
      {
        href: "/dashboard/favorite",
        label: t("favorite"),
        icon: <Heart className="w-[18px] h-[18px]" />,
      },
      {
        href: "/dashboard/credits",
        label: t("credits"),
        icon: <DollarSign className="w-[18px] h-[18px]" />,
      },
      {
        href: "/dashboard/notifications",
        label: t("notifications"),
        icon: <Bell className="w-[18px] h-[18px]" />,
      },
      {
        href: "/dashboard/account/security",
        label: tAccount("security"),
        icon: <Shield className="w-[18px] h-[18px]" />,
      },
    ],
    [t, tAccount],
  );

  const renderSidebarContent = (className?: string) => (
    <div className={cn("w-full flex flex-col h-full bg-site-surface border border-site-border-soft rounded-8 p-2 overflow-hidden", className)}>
      <div className="px-3 py-3 border-b border-site-border-soft flex items-center justify-between">
        <h3 className="text-site-text font-bold text-sm flex items-center">
          <div className="w-7 h-7 rounded-4 bg-site-accent/10 flex items-center justify-center mr-2">
            <LayoutGrid className="w-3.5 h-3.5 text-site-accent" />
          </div>
          {t("menu")}
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden w-7 h-7 rounded-4 bg-site-raised flex items-center justify-center hover:bg-site-surface transition-colors text-site-muted hover:text-site-text"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="p-1 space-y-0.5 flex-1 overflow-y-auto w-full">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={isActive}
              onClick={onClose}
            />
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-full sticky top-24 self-start">
        {renderSidebarContent()}
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/80 z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <div
            className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] max-w-[85vw] p-4 z-50 bg-site-deep"
          >
            {renderSidebarContent("h-full")}
          </div>
        </>
      )}
    </>
  );
});

export default UserSidebar;

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("UserMenu");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const id = requestAnimationFrame(() => setIsSidebarOpen(false));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed bottom-20 right-4 z-30 w-14 h-14 rounded-8 bg-site-accent text-site-bg flex items-center justify-center transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Active Page Indicator - Mobile Only */}
      <div className="lg:hidden mb-6">
        <div className="bg-site-surface border border-site-border-soft p-4 rounded-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-4 bg-site-accent/10 flex items-center justify-center">
                <LayoutGrid className="w-4 h-4 text-site-accent" />
              </div>
              <span className="font-bold text-site-text text-sm">
                {t("account_menu")}
              </span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="px-3 py-1.5 bg-site-surface text-site-muted font-medium border border-site-border-soft rounded-6 text-xs hover:text-site-text transition-colors"
            >
              {t("open_menu")}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <UserSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="lg:col-span-3">
          {children}
        </main>
      </div>
    </div>
  );
}
