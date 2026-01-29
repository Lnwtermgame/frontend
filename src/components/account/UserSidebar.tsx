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
import { useMemo, memo } from "react";
import { motion } from "@/lib/framer-exports";

// Use memo to prevent unnecessary re-renders
const NavItem = memo(function NavItem({
  href,
  label,
  icon,
  isActive
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
}) {
  // Pre-compute classes to avoid calculation during render
  const linkClasses = cn(
    "flex items-center gap-3 px-4 py-3 rounded-md relative overflow-hidden transition-all thai-font",
    isActive
      ? "bg-mali-blue/30 text-white font-medium"
      : "text-mali-text-secondary hover:bg-mali-blue/20 hover:text-white"
  );

  return (
    <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
      <Link
        href={href}
        className={linkClasses}
        prefetch={false}
      >
        <span className={cn(
          "flex items-center justify-center relative z-10",
          isActive ? "text-mali-blue-accent" : "text-mali-text-secondary group-hover:text-white"
        )}>
          {icon}
        </span>
        <span className="text-sm font-medium relative z-10 thai-font">
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

  // Create navigation items array with hardcoded Thai text
  const navItems = useMemo(() => [
    {
      href: "/account",
      label: "บัญชีของฉัน",
      icon: <User className="w-5 h-5" />
    },
    {
      href: "/top-up",
      label: "เติมเงิน",
      icon: <DollarSign className="w-5 h-5" />
    },
    {
      href: "/orders",
      label: "คำสั่งซื้อของฉัน",
      icon: <ShoppingCart className="w-5 h-5" />
    },
    {
      href: "/my-cards",
      label: "บัตรของฉัน",
      icon: <CreditCard className="w-5 h-5" />
    },
    {
      href: "/invoice",
      label: "ใบแจ้งหนี้ของฉัน",
      icon: <FileText className="w-5 h-5" />
    },
    {
      href: "/coupons",
      label: "คูปองของฉัน",
      icon: <Ticket className="w-5 h-5" />
    },
    {
      href: "/favorite",
      label: "รายการโปรด",
      icon: <Heart className="w-5 h-5" />
    },
    {
      href: "/lucky-draw",
      label: "ชิงโชค",
      icon: <Gift className="w-5 h-5" />
    },
    {
      href: "/balance",
      label: "ยอดเงิน",
      icon: <DollarSign className="w-5 h-5" />
    },
    {
      href: "/credits",
      label: "เครดิต",
      icon: <DollarSign className="w-5 h-5" />
    },
    {
      href: "/notifications",
      label: "การแจ้งเตือน",
      icon: <Bell className="w-5 h-5" />
    }
  ], []);

  return (
    <div className="w-full overflow-hidden">
      <div className="p-4 border-b border-mali-blue/20 bg-mali-sidebar">
        <h3 className="text-white font-medium text-sm thai-font">เมนู</h3>
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
            />
          );
        })}
        <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
          <button
            className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-md text-mali-text-secondary hover:bg-mali-blue/20 hover:text-white thai-font"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium thai-font">
              ออกจากระบบ
            </span>
          </button>
        </motion.div>
      </div>
    </div>
  );
});

export default UserSidebar;
