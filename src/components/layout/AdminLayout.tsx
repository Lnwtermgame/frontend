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
  MessageSquare,
  TrendingUp,
  Users,
  ShoppingCart,
  Bell,
  Layers,
  HelpCircle,
  CreditCard,
  FileText,
  Newspaper,
  Mail,
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
    icon: <Home className="w-5 h-5" />,
  },
  {
    title: "สินค้า",
    href: "/admin/products",
    icon: <Package className="w-5 h-5" />,
  },
  {
    title: "หมวดหมู่",
    href: "/admin/categories",
    icon: <Layers className="w-5 h-5" />,
  },
  {
    title: "คำสั่งซื้อ",
    href: "/admin/orders",
    icon: <ShoppingCart className="w-5 h-5" />,
  },
  {
    title: "การชำระเงิน",
    href: "/admin/payments",
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    title: "โปรโมชั่น",
    href: "/admin/promotions",
    icon: <Tag className="w-5 h-5" />,
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    title: "จัดการผู้ใช้",
    href: "/admin/users",
    icon: <Users className="w-5 h-5" />,
  },
  {
    title: "จัดการ FAQ",
    href: "/admin/faq",
    icon: <HelpCircle className="w-5 h-5" />,
  },
  {
    title: "ตั๋วสนับสนุน",
    href: "/admin/tickets",
    icon: <MessageSquare className="w-5 h-5" />,
  },
  {
    title: "หน้าเว็บ (CMS)",
    href: "/admin/cms/pages",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    title: "ข่าวสาร",
    href: "/admin/cms/news",
    icon: <Newspaper className="w-5 h-5" />,
  },
  {
    title: "การแจ้งเตือน",
    href: "/admin/notification",
    icon: <Bell className="w-5 h-5" />,
  },
  {
    title: "อีเมล",
    href: "/admin/email",
    icon: <Mail className="w-5 h-5" />,
  },
  {
    title: "ตั้งค่า",
    href: "/admin/settings",
    icon: <Settings className="w-5 h-5" />,
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, logout, isInitialized, isSessionChecked } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Only redirect after session check is complete
    if (isInitialized && isSessionChecked && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, router, isInitialized, isSessionChecked]);

  // Wait for both initialization AND session check before rendering
  // This ensures the API token is properly set before any API calls
  if (!isInitialized || !isSessionChecked || !isAdmin) {
    return (
      <div className="page-container text-center">
        <div
          className="bg-white border-[3px] border-black p-8"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
        >
          <div className="animate-pulse flex space-x-4 justify-center">
            <div className="rounded-full bg-gray-200 h-12 w-12"></div>
            <div className="flex-1 space-y-4 max-w-md">
              <div className="h-4 bg-gray-200 w-3/4"></div>
              <div className="h-4 bg-gray-200"></div>
              <div className="h-4 bg-gray-200 w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Mobile header */}
      <div
        className="lg:hidden flex items-center justify-between mb-6 bg-white border-[3px] border-black p-4"
        style={{ boxShadow: "4px 4px 0 0 #000000" }}
      >
        <h1 className="text-xl font-black text-black thai-font flex items-center">
          <span className="w-1.5 h-5 bg-brutal-pink mr-2"></span>
          {title || "แผงควบคุมผู้ดูแลระบบ"}
        </h1>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-gray-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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
            className="w-64 bg-white h-full shadow-xl p-4"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-black text-xl text-black thai-font flex items-center">
                <span className="w-1.5 h-5 bg-brutal-pink mr-2"></span>
                ผู้ดูแลระบบ
              </h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="space-y-2">
              {adminNavItems.map((item) => (
                <Link href={item.href} key={item.href}>
                  <div
                    className={cn(
                      "flex items-center py-3 px-4 text-gray-600 hover:bg-gray-100 hover:text-black transition-colors thai-font font-medium",
                      pathname === item.href &&
                        "bg-brutal-yellow text-black font-bold border-[2px] border-black",
                    )}
                    style={
                      pathname === item.href
                        ? { boxShadow: "3px 3px 0 0 #000000" }
                        : undefined
                    }
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="text-gray-500 mr-3">{item.icon}</span>
                    {item.title}
                  </div>
                </Link>
              ))}
              <hr className="border-gray-200 my-4" />
              <button
                onClick={() => logout()}
                className="flex items-center w-full py-3 px-4 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors thai-font font-medium"
              >
                <LogOut className="w-5 h-5 mr-3" />
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
          <div
            className="bg-white border-[3px] border-black sticky top-24"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="p-6 border-b-[2px] border-gray-200 bg-gray-50">
              <h2 className="font-black text-lg text-black flex items-center thai-font">
                <div
                  className="w-8 h-8 bg-brutal-pink border-[2px] border-black flex items-center justify-center mr-2"
                  style={{ boxShadow: "2px 2px 0 0 #000000" }}
                >
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                แผงควบคุม
              </h2>
            </div>
            <nav className="p-4 space-y-2">
              {adminNavItems.map((item) => (
                <Link href={item.href} key={item.href}>
                  <div
                    className={cn(
                      "flex items-center py-3 px-4 text-gray-600 hover:bg-gray-100 hover:text-black transition-colors thai-font font-medium",
                      pathname === item.href &&
                        "bg-brutal-yellow text-black font-bold border-[2px] border-black",
                    )}
                    style={
                      pathname === item.href
                        ? { boxShadow: "3px 3px 0 0 #000000" }
                        : undefined
                    }
                  >
                    <span className="text-gray-500 mr-3">{item.icon}</span>
                    {item.title}
                    <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                  </div>
                </Link>
              ))}
              <hr className="border-gray-200 my-4" />
              <div className="px-4 py-3">
                <div className="flex items-center mb-3">
                  <div
                    className="w-10 h-10 bg-brutal-yellow border-[2px] border-black flex items-center justify-center mr-3"
                    style={{ boxShadow: "2px 2px 0 0 #000000" }}
                  >
                    <User className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-black">
                      {user?.username || user?.email}
                    </div>
                    <div className="text-xs text-gray-500 thai-font">
                      ผู้ดูแลระบบ
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => logout()}
                  className="flex items-center justify-center w-full py-2 px-4 text-brutal-pink hover:bg-brutal-pink/10 transition-colors text-sm font-bold thai-font border-[2px] border-transparent hover:border-brutal-pink"
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
                className="text-2xl font-black text-black mb-6 thai-font flex items-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span className="w-1.5 h-6 bg-brutal-pink mr-3"></span>
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
