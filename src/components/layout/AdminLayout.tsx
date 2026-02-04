"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";
import {
  Package,
  Tag,
  Settings,
  User,
  LogOut,
  ChevronRight,
  Home,
  DollarSign,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/context/auth-context";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

// Hardcoded Thai navigation items
const adminNavItems = [
  {
    title: "แดชบอร์ด",
    href: "/admin",
    icon: <Home className="w-5 h-5" />
  },
  {
    title: "สินค้า",
    href: "/admin/products",
    icon: <Package className="w-5 h-5" />
  },
  {
    title: "โปรโมชั่น",
    href: "/admin/promotions",
    icon: <Tag className="w-5 h-5" />
  },
  {
    title: "ตั๋วสนับสนุน",
    href: "/admin/tickets",
    icon: <MessageSquare className="w-5 h-5" />
  },
  {
    title: "ตั้งค่า",
    href: "/admin/settings",
    icon: <Settings className="w-5 h-5" />
  }
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, logout, isInitialized } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isInitialized && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, router, isInitialized]);

  if (!isInitialized || !isAdmin) {
    return (
      <div className="page-container text-center">
        <div className="bg-mali-card rounded-xl border border-mali-blue/20 p-8">
          <div className="animate-pulse flex space-x-4 justify-center">
            <div className="rounded-full bg-mali-blue/20 h-12 w-12"></div>
            <div className="flex-1 space-y-4 max-w-md">
              <div className="h-4 bg-mali-blue/20 rounded w-3/4"></div>
              <div className="h-4 bg-mali-blue/20 rounded"></div>
              <div className="h-4 bg-mali-blue/20 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between mb-6 bg-mali-card rounded-xl border border-mali-blue/20 p-4">
        <h1 className="text-xl font-bold text-white thai-font">{title || "แผงควบคุมผู้ดูแลระบบ"}</h1>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-mali-blue">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isMenuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/70 z-50 flex justify-end">
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="w-64 bg-mali-card h-full shadow-xl p-4"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-xl text-white thai-font">ผู้ดูแลระบบ</h2>
              <button onClick={() => setIsMenuOpen(false)} className="text-mali-blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="space-y-2">
              {adminNavItems.map((item) => (
                <Link href={item.href} key={item.href}>
                  <div
                    className={cn(
                      "flex items-center py-3 px-4 rounded-lg text-gray-300 hover:bg-mali-blue/20 hover:text-white transition-colors thai-font",
                      pathname === item.href && "bg-mali-blue/20 text-white"
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="text-mali-blue mr-3">{item.icon}</span>
                    {item.title}
                  </div>
                </Link>
              ))}
              <hr className="border-mali-blue/20 my-4" />
              <button
                onClick={() => logout()}
                className="flex items-center w-full py-3 px-4 rounded-lg text-gray-300 hover:bg-red-500/20 hover:text-white transition-colors thai-font"
              >
                <LogOut className="w-5 h-5 mr-3 text-red-500" />
                ออกจากระบบ
              </button>
            </nav>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Desktop sidebar */}
        <motion.div
          className="hidden lg:block col-span-1"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="bg-mali-card rounded-xl border border-mali-blue/20 sticky top-24">
            <div className="p-6 border-b border-mali-blue/20">
              <h2 className="font-bold text-lg text-white flex items-center thai-font">
                <DollarSign className="w-5 h-5 mr-2 text-mali-blue" />
                แผงควบคุมผู้ดูแลระบบ
              </h2>
            </div>
            <nav className="p-4 space-y-2">
              {adminNavItems.map((item) => (
                <Link href={item.href} key={item.href}>
                  <div
                    className={cn(
                      "flex items-center py-3 px-4 rounded-lg text-gray-300 hover:bg-mali-blue/20 hover:text-white transition-colors thai-font",
                      pathname === item.href && "bg-mali-blue/20 text-white"
                    )}
                  >
                    <span className="text-mali-blue mr-3">{item.icon}</span>
                    {item.title}
                    <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                  </div>
                </Link>
              ))}
              <hr className="border-mali-blue/20 my-4" />
              <div className="px-4 py-3">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-mali-blue/20 rounded-full flex items-center justify-center mr-3">
                    <User className="w-6 h-6 text-mali-blue" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{user?.username || user?.email}</div>
                    <div className="text-xs text-gray-400 thai-font">ผู้ดูแลระบบ</div>
                  </div>
                </div>
                <button
                  onClick={() => logout()}
                  className="flex items-center justify-center w-full py-2 px-4 rounded-lg text-red-500 hover:bg-red-500/20 transition-colors text-sm thai-font"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  ออกจากระบบ
                </button>
              </div>
            </nav>
          </div>
        </motion.div>

        {/* Main content */}
        <motion.div
          className="col-span-1 lg:col-span-4 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {title && (
            <div className="hidden lg:block">
              <motion.h1
                className="text-2xl font-bold text-white mb-6 thai-font"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {title}
              </motion.h1>
            </div>
          )}

          {children}
        </motion.div>
      </div>
    </div>
  );
}
