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
  LogOut,
  LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo, memo } from "react";
import { motion } from "@/lib/framer-exports";

// Use memo to prevent unnecessary re-renders
const NavItem = memo(function NavItem({
  href,
  label,
  icon,
  isActive,
  color
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  color: string;
}) {


  return (
    <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 px-4 py-3 relative overflow-hidden transition-all thai-font group border-[2px]",
          isActive
            ? "bg-brutal-yellow text-black font-bold border-black"
            : "bg-white border-transparent text-gray-600 hover:border-gray-200 hover:bg-gray-50"
        )}
        style={isActive ? { boxShadow: '3px 3px 0 0 #000000' } : undefined}
      >
        <span className={cn(
          "flex items-center justify-center relative z-10 w-8 h-8 border-[2px] border-black",
          isActive ? `bg-white ${color}` : "bg-gray-100 text-gray-400 group-hover:bg-white group-hover:text-black"
        )}
          style={isActive ? { boxShadow: '2px 2px 0 0 #000000' } : {}}
        >
          {icon}
        </span>
        <span className="text-sm font-bold relative z-10 thai-font">
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

// Use memo for the entire sidebar component
const UserSidebar = memo(function UserSidebar() {
  const pathname = usePathname();

  // Create navigation items array with hardcoded Thai text and colors
  const navItems = useMemo(() => [
    {
      href: "/dashboard/account",
      label: "บัญชีของฉัน",
      icon: <User className="w-4 h-4" />,
      color: "text-brutal-blue"
    },
    {
      href: "/dashboard/orders",
      label: "คำสั่งซื้อของฉัน",
      icon: <ShoppingCart className="w-4 h-4" />,
      color: "text-brutal-pink"
    },
    {
      href: "/dashboard/invoice",
      label: "ใบแจ้งหนี้ของฉัน",
      icon: <FileText className="w-4 h-4" />,
      color: "text-brutal-green"
    },
    {
      href: "/dashboard/coupons",
      label: "คูปองของฉัน",
      icon: <Ticket className="w-4 h-4" />,
      color: "text-brutal-yellow"
    },
    {
      href: "/dashboard/favorite",
      label: "รายการโปรด",
      icon: <Heart className="w-4 h-4" />,
      color: "text-brutal-pink"
    },
    {
      href: "/dashboard/credits",
      label: "เครดิต",
      icon: <DollarSign className="w-4 h-4" />,
      color: "text-brutal-green"
    },
    {
      href: "/dashboard/notifications",
      label: "การแจ้งเตือน",
      icon: <Bell className="w-4 h-4" />,
      color: "text-brutal-blue"
    }
  ], []);

  return (
    <div className="w-full overflow-hidden">
      <div className="p-5 border-b-[3px] border-black bg-brutal-yellow">
        <h3 className="text-black font-black text-base thai-font flex items-center">
          <div className="w-8 h-8 bg-white border-[2px] border-black flex items-center justify-center mr-3"
            style={{ boxShadow: '2px 2px 0 0 #000000' }}
          >
            <LayoutGrid className="w-4 h-4 text-black" />
          </div>
          เมนู
        </h3>
      </div>
      <div className="p-4 space-y-2">
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
            />
          );
        })}
      </div>
    </div>
  );
});

export default UserSidebar;
