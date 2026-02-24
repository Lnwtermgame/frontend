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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo, memo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "@/lib/framer-exports";

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
          "flex items-center gap-2.5 px-3 py-2.5 relative overflow-hidden transition-all thai-font group border-[2px]",
          isActive
            ? "bg-brutal-yellow text-black font-bold border-black"
            : "bg-white border-transparent text-gray-600 hover:border-gray-200 hover:bg-gray-50",
        )}
        style={isActive ? { boxShadow: "3px 3px 0 0 #000000" } : undefined}
      >
        <span
          className={cn(
            "flex items-center justify-center relative z-10 w-7 h-7 border-[2px] border-black",
            isActive
              ? `bg-white ${color}`
              : "bg-gray-100 text-gray-400 group-hover:bg-white group-hover:text-black",
          )}
          style={isActive ? { boxShadow: "2px 2px 0 0 #000000" } : {}}
        >
          {icon}
        </span>
        <span className="text-xs font-bold relative z-10 thai-font">
          {label}
        </span>

        {isActive && (
          <motion.div
            layoutId="active-indicator"
            className="absolute right-2 w-2 h-2 bg-black rounded-full"
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

  const navItems = useMemo(
    () => [
      {
        href: "/dashboard/account",
        label: "บัญชีของฉัน",
        icon: <User className="w-4 h-4" />,
        color: "text-brutal-blue",
      },
      {
        href: "/dashboard/orders",
        label: "คำสั่งซื้อของฉัน",
        icon: <ShoppingCart className="w-4 h-4" />,
        color: "text-brutal-pink",
      },
      {
        href: "/dashboard/invoice",
        label: "ใบแจ้งหนี้ของฉัน",
        icon: <FileText className="w-4 h-4" />,
        color: "text-brutal-green",
      },
      {
        href: "/dashboard/coupons",
        label: "คูปองของฉัน",
        icon: <Ticket className="w-4 h-4" />,
        color: "text-brutal-yellow",
      },
      {
        href: "/dashboard/favorite",
        label: "รายการโปรด",
        icon: <Heart className="w-4 h-4" />,
        color: "text-brutal-pink",
      },
      {
        href: "/dashboard/credits",
        label: "เครดิต",
        icon: <DollarSign className="w-4 h-4" />,
        color: "text-brutal-green",
      },
      {
        href: "/dashboard/notifications",
        label: "การแจ้งเตือน",
        icon: <Bell className="w-4 h-4" />,
        color: "text-brutal-blue",
      },
    ],
    [],
  );

  const renderSidebarContent = (className?: string) => (
    <div className={cn("w-full flex flex-col", className)}>
      <div className="p-4 border-b-[3px] border-black bg-brutal-yellow flex items-center justify-between">
        <h3 className="text-black font-black text-sm thai-font flex items-center">
          <div
            className="w-7 h-7 bg-white border-[2px] border-black flex items-center justify-center mr-2.5"
            style={{ boxShadow: "2px 2px 0 0 #000000" }}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-black" />
          </div>
          เมนู
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden w-7 h-7 bg-white border-[2px] border-black flex items-center justify-center hover:bg-brutal-gray transition-colors"
            style={{ boxShadow: "2px 2px 0 0 #000000" }}
          >
            <X className="w-3.5 h-3.5 text-black" />
          </button>
        )}
      </div>
      <div className="p-3 space-y-1.5 flex-1 overflow-y-auto">
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
      <div
        className="hidden lg:block w-full overflow-hidden bg-white border-[3px] border-black sticky top-24 self-start"
        style={{ boxShadow: "4px 4px 0 0 #000000" }}
      >
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
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={onClose}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 max-w-[80vw] bg-white border-r-[3px] border-black z-50"
              style={{ boxShadow: "4px 0 0 0 #000000" }}
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
        className="lg:hidden fixed bottom-20 right-4 z-30 w-12 h-12 bg-brutal-yellow border-[3px] border-black flex items-center justify-center shadow-lg"
        style={{ boxShadow: "3px 3px 0 0 #000000" }}
      >
        <Menu className="w-5 h-5 text-black" />
      </button>

      {/* Active Page Indicator - Mobile Only */}
      <div className="lg:hidden mb-4">
        <div
          className="bg-white border-[3px] border-black p-3"
          style={{ boxShadow: "3px 3px 0 0 #000000" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 bg-brutal-yellow border-[2px] border-black flex items-center justify-center"
                style={{ boxShadow: "2px 2px 0 0 #000000" }}
              >
                <LayoutGrid className="w-4 h-4 text-black" />
              </div>
              <span className="font-bold text-black text-sm">เมนูบัญชี</span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="px-3 py-1.5 bg-black text-white font-bold border-[2px] border-black text-xs"
            >
              เปิดเมนู
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
