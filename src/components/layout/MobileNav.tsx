"use client";

import { Link } from '@/i18n/routing';
import { usePathname } from "next/navigation";
import { useRouter } from '@/i18n/routing';
import { motion, AnimatePresence } from "@/lib/framer-exports";
import { cn } from "@/lib/utils";
import {
  Home,
  Gamepad2,
  CreditCard,
  Smartphone,
  Heart,
  MessageCircle,
  X,
  User,
  LogOut,
  ChevronRight,
  Star,
  Newspaper,
} from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";
import { useTranslations } from "next-intl";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const tNav = useTranslations("Navigation");
  const tUserMenu = useTranslations("UserMenu");

  const handleLogout = async () => {
    await logout();
    onClose();
    router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
  };

  const mainNavItems = [
    { href: "/", label: tNav("home"), icon: <Home size={20} /> },
    { href: "/games", label: tNav("games"), icon: <Gamepad2 size={20} /> },
    { href: "/card", label: tNav("card"), icon: <CreditCard size={20} /> },
    {
      href: "/mobile-recharge",
      label: tNav("mobile_recharge"),
      icon: <Smartphone size={20} />,
    },
    {
      href: "/news",
      label: tNav("news"),
      icon: <Newspaper size={20} />,
    },
    {
      href: "/dashboard/favorite",
      label: tNav("favorite"),
      icon: <Heart size={20} />,
    },
    {
      href: "/support",
      label: tNav("support"),
      icon: <MessageCircle size={20} />,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm lg:hidden"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 bottom-0 left-0 w-[80%] max-w-sm bg-white z-50 border-r-[3px] border-black flex flex-col lg:hidden"
            style={{ boxShadow: "4px 0 0 0 rgba(0,0,0,0.1)" }}
          >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b-[3px] border-black bg-brutal-yellow">
              <span className="font-black text-xl">MENU</span>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white border-[2px] border-black flex items-center justify-center hover:bg-gray-100 active:translate-y-0.5 transition-all"
                style={{ boxShadow: "2px 2px 0 0 #000000" }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* User Section */}
              {isAuthenticated ? (
                <div
                  className="bg-gray-50 border-[2px] border-black p-4 space-y-3"
                  style={{ boxShadow: "3px 3px 0 0 #000000" }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white border-[2px] border-black flex items-center justify-center overflow-hidden">
                      <img
                        src={
                          user?.avatar ||
                          "https://placehold.co/200x200?text=User"
                        }
                        alt={user?.username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{user?.username}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  {user?.isPremium && (
                    <div className="bg-brutal-yellow border border-black px-2 py-1 text-xs font-bold inline-flex items-center">
                      <Star size={12} className="mr-1 fill-black" /> Premium
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Link
                      href="/dashboard/account"
                      onClick={onClose}
                      className="text-xs border border-black bg-white p-2 text-center hover:bg-gray-50"
                    >
                      {tNav("account")}
                    </Link>
                    <Link
                      href="/dashboard/orders"
                      onClick={onClose}
                      className="text-xs border border-black bg-white p-2 text-center hover:bg-gray-50"
                    >
                      {tNav("orders")}
                    </Link>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={onClose}
                  className="flex items-center justify-center w-full bg-brutal-pink text-white font-bold py-3 border-[3px] border-black shadow-brutal-mobile active:translate-y-[2px] active:shadow-none transition-all"
                >
                  <User size={20} className="mr-2" />
                  {tNav("login")} / {tNav("register")}
                </Link>
              )}

              {/* Navigation Links */}
              <nav className="space-y-2">
                {mainNavItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center p-3 border-[2px] border-black transition-all active:translate-y-[2px]",
                        isActive
                          ? "bg-brutal-blue text-black font-bold shadow-brutal-mobile"
                          : "bg-white hover:bg-gray-50",
                      )}
                    >
                      <span
                        className={cn(
                          "mr-3",
                          isActive ? "text-black" : "text-gray-500",
                        )}
                      >
                        {item.icon}
                      </span>
                      {item.label}
                      <ChevronRight size={16} className="ml-auto opacity-50" />
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Footer / Logout */}
            {isAuthenticated && (
              <div className="p-4 border-t-[3px] border-black bg-gray-50">
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center w-full py-3 text-red-500 font-bold border-[2px] border-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={20} className="mr-2" />
                  {tUserMenu("logout")}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
