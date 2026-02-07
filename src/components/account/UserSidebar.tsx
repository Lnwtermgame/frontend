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
            ? "bg-brutal-yellow text-black font-bold border-[2px] border-black"
            : "text-gray-600 hover:bg-gray-100 hover:text-black"
        )}
        style={isActive ? { boxShadow: '3px 3px 0 0 #000000' } : undefined}
      >
        <span className={cn(
          "flex items-center justify-center relative z-10",
          isActive ? "text-black" : "text-gray-500 group-hover:text-black"
        )}>
          {icon}
        </span>
        <span className="text-sm font-bold relative z-10 thai-font">
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
      <div className="p-6 border-b-[2px] border-gray-200 bg-gray-50">
        <h3 className="text-gray-600 font-bold text-sm thai-font flex items-center">
          <span className="w-1.5 h-4 bg-brutal-pink mr-2 rounded-sm"></span>
          เมนู
        </h3>
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
