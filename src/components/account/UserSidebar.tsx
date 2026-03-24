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
import { motion, AnimatePresence } from "@/lib/framer-exports";
import { useTranslations } from "next-intl";

const NavItem = memo(function NavItem({
  href,
  label,
  icon,
  isActive,
  color,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  color: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-4 py-3 relative overflow-hidden transition-all thai-font group rounded-xl",
          isActive
            ? "bg-site-accent/10 border-l-[3px] border-site-accent text-site-accent font-bold"
            : "bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-[#212328]/5",
        )}
      >
        <span
          className={cn(
            "flex items-center justify-center relative w-8 h-8 rounded-lg transition-colors",
            isActive
              ? "bg-site-accent text-[#1A1C1E]"
              : "bg-[#1A1C1E] text-gray-400 group-hover:text-site-accent",
          )}
        >
          {icon}
        </span>
        <span className={cn(
          "text-sm relative z-10 thai-font",
          isActive ? "font-bold text-site-accent" : "font-medium"
        )}>
          {label}
        </span>

        {isActive && (
          <motion.div
            layoutId="active-indicator"
            className="absolute right-3 w-1.5 h-1.5 bg-site-accent rounded-full shadow-[0_0_8px_rgba(103,176,186,0.8)]"
            initial={false}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
      </Link>
    </motion.div>
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
        color: "",
      },
      {
        href: "/dashboard/orders",
        label: t("my_orders"),
        icon: <ShoppingCart className="w-[18px] h-[18px]" />,
        color: "",
      },
      {
        href: "/dashboard/invoice",
        label: t("my_invoices"),
        icon: <FileText className="w-[18px] h-[18px]" />,
        color: "",
      },
      {
        href: "/dashboard/coupons",
        label: t("my_coupons"),
        icon: <Ticket className="w-[18px] h-[18px]" />,
        color: "",
      },
      {
        href: "/dashboard/favorite",
        label: t("favorite"),
        icon: <Heart className="w-[18px] h-[18px]" />,
        color: "",
      },
      {
        href: "/dashboard/credits",
        label: t("credits"),
        icon: <DollarSign className="w-[18px] h-[18px]" />,
        color: "",
      },
      {
        href: "/dashboard/notifications",
        label: t("notifications"),
        icon: <Bell className="w-[18px] h-[18px]" />,
        color: "",
      },
      {
        href: "/dashboard/account/security",
        label: tAccount("security"),
        icon: <Shield className="w-[18px] h-[18px]" />,
        color: "",
      },
    ],
    [t, tAccount],
  );

  const renderSidebarContent = (className?: string) => (
    <div className={cn("w-full flex flex-col h-full bg-[#222427] rounded-xl overflow-hidden shadow-ocean border border-site-border", className)}>
      <div className="p-5 border-b border-site-border bg-[#1A1C1E]/50 flex items-center justify-between">
        <h3 className="text-white font-bold text-base thai-font flex items-center">
          <div className="w-8 h-8 rounded-lg bg-site-accent/10 flex items-center justify-center mr-3">
            <LayoutGrid className="w-4 h-4 text-site-accent" />
          </div>
          {t("menu")}
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 rounded-lg bg-[#212328]/5 flex items-center justify-center hover:bg-[#212328]/10 transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="p-3 space-y-1 flex-1 overflow-y-auto w-full">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={isActive}
              color={item.color}
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
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
              onClick={onClose}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] max-w-[85vw] p-4 z-50 bg-[#16181A]"
            >
              {renderSidebarContent("h-full")}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
});

export default UserSidebar;

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("UserMenu");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsSidebarOpen(false);
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
        className="lg:hidden fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-site-accent text-[#1A1C1E] flex items-center justify-center shadow-accent-glow hover:scale-105 active:scale-95 transition-all"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Active Page Indicator - Mobile Only */}
      <div className="lg:hidden mb-6">
        <div className="bg-[#222427] border border-site-border p-4 rounded-xl shadow-ocean">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-site-accent/10 flex items-center justify-center">
                <LayoutGrid className="w-5 h-5 text-site-accent" />
              </div>
              <span className="font-bold text-white text-base">
                {t("account_menu")}
              </span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="px-4 py-2 bg-[#1A1C1E] text-white font-medium border border-site-border rounded-lg text-sm hover:bg-[#212328]/5 transition-colors"
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

        <motion.main
          className="lg:col-span-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
