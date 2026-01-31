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
  LogOut
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


  return (
    <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg relative overflow-hidden transition-all thai-font group",
          isActive
            ? "bg-mali-blue/20 text-white font-medium shadow-sm border border-mali-blue/30"
            : "text-mali-text-secondary hover:bg-mali-blue/10 hover:text-white"
        )}
        prefetch={false}
      >
        <span className={cn(
          "flex items-center justify-center relative z-10",
          isActive ? "text-white" : "text-mali-text-secondary group-hover:text-white"
        )}>
          {icon}
        </span>
        <span className="text-sm font-medium relative z-10 thai-font">
          {label}
        </span>

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
      href: "/dashboard/account",
      label: "บัญชีของฉัน",
      icon: <User className="w-5 h-5" />
    },

    {
      href: "/dashboard/orders",
      label: "คำสั่งซื้อของฉัน",
      icon: <ShoppingCart className="w-5 h-5" />
    },

    {
      href: "/dashboard/invoice",
      label: "ใบแจ้งหนี้ของฉัน",
      icon: <FileText className="w-5 h-5" />
    },
    {
      href: "/dashboard/coupons",
      label: "คูปองของฉัน",
      icon: <Ticket className="w-5 h-5" />
    },
    {
      href: "/dashboard/favorite",
      label: "รายการโปรด",
      icon: <Heart className="w-5 h-5" />
    },


    {
      href: "/dashboard/credits",
      label: "เครดิต",
      icon: <DollarSign className="w-5 h-5" />
    },
    {
      href: "/dashboard/notifications",
      label: "การแจ้งเตือน",
      icon: <Bell className="w-5 h-5" />
    }
  ], []);

  return (
    <div className="w-full overflow-hidden">
      <div className="p-6 border-b border-mali-blue/20">
        <h3 className="text-mali-text-secondary font-medium text-sm thai-font">เมนู</h3>
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
      </div>
    </div>
  );
});

export default UserSidebar;
