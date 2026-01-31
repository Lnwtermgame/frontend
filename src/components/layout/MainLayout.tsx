"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ShoppingCart,
  CreditCard,
  MessageCircle,
  Bell,
  Menu,
  User,
  Gamepad2,
  FileText,
  DollarSign,
  Coins,
  Ticket,
  Heart,
  LogOut,
  ChevronDown,
  Zap,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "@/lib/framer-exports";
import { useState, useEffect, useMemo, memo, useRef } from "react";
import { Footer } from "./footer";
import { useAuth } from "@/lib/context/auth-context";
import { useNotifications } from "@/lib/context/notification-context";
import SearchBar from "@/components/layout/SearchBar";

interface MainLayoutProps {
  children: React.ReactNode;
}

// Memo-ized navigation item component to prevent re-renders
const NavItem = memo(function NavItem({
  href,
  label,
  icon,
  isActive,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-md transition-all relative overflow-hidden",
        isActive
          ? "bg-mali-blue/30 text-white font-medium"
          : "hover:bg-mali-blue/20 text-mali-text-secondary hover:text-white"
      )}
      prefetch={false}
    >
      {isActive && (
        <motion.div
          layoutId="active-nav-indicator"
          className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-mali-blue-light to-mali-purple"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
      <span className={cn(
        "flex items-center justify-center text-inherit relative z-10",
        isActive ? "text-white" : "text-mali-text-secondary group-hover:text-white"
      )}>
        {icon}
      </span>
      <span className="text-sm font-medium relative z-10">{label}</span>

      {isActive && (
        <motion.div
          className="absolute inset-0 bg-white/5 opacity-0"
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
      )}
    </Link>
  );
});

const MobileNavItem = memo(function MobileNavItem({
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
      className={cn(
        "flex items-center justify-center flex-col gap-1 py-2 w-full",
        isActive
          ? "text-white"
          : "text-mali-text-secondary"
      )}
      onClick={onClick}
      prefetch={false}
    >
      <div className={cn(
        "flex items-center justify-center w-10 h-10 rounded-full",
        isActive ? "bg-mali-blue-accent/20" : "transparent"
      )}>
        <span className={cn(
          "flex items-center justify-center",
          isActive ? "text-mali-blue-accent" : "text-mali-text-secondary"
        )}>
          {icon}
        </span>
      </div>
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
});

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  // Toggle user menu dropdown
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  // Notification state
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    if (isNotificationOpen || isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationOpen, isUserMenuOpen]);

  // Create memoized nav items with hardcoded Thai text
  const mainNavItems = useMemo(() => [
    { href: "/", label: "หน้าแรก", icon: <Home size={20} /> },
    { href: "/games", label: "เกมทั้งหมด", icon: <Gamepad2 size={20} /> },

    { href: "/card", label: "บัตร", icon: <CreditCard size={20} /> },
    { href: "/dashboard/favorite", label: "รายการโปรด", icon: <Heart size={20} /> },

    { href: "/support", label: "ช่วยเหลือ", icon: <MessageCircle size={20} /> },
  ], []);

  const mobileNavItems = useMemo(() => [
    { href: "/", label: "หน้าแรก", icon: <Home size={20} /> },
    { href: "/games", label: "เกมทั้งหมด", icon: <Gamepad2 size={20} /> },
    { href: "/direct-topup", label: "เติมเงิน", icon: <DollarSign size={20} /> },
    { href: "/dashboard/orders", label: "คำสั่งซื้อ", icon: <ShoppingCart size={20} /> },
    { href: "/dashboard/account", label: "บัญชี", icon: <User size={20} /> },
  ], []);

  const accountMenuItems = useMemo(() => [
    { href: "/dashboard/account", label: "บัญชีของฉัน", icon: <User size={18} /> },

    { href: "/direct-topup", label: "เติมเงินโดยตรง", icon: <Gamepad2 size={18} /> },
    { href: "/card", label: "บัตร", icon: <CreditCard size={18} /> },

    { href: "/dashboard/invoice", label: "ใบแจ้งหนี้", icon: <FileText size={18} /> },

    { href: "/dashboard/credits", label: "เครดิต", icon: <Coins size={18} /> },
    { href: "/dashboard/coupons", label: "คูปอง", icon: <Ticket size={18} /> },
    { href: "/dashboard/favorite", label: "รายการโปรด", icon: <Heart size={18} /> },


    { href: "/dashboard/notifications", label: "การแจ้งเตือน", icon: <Bell size={18} /> },
  ], []);

  return (
    <div className="flex min-h-screen bg-mali-dark thai-font">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-mali-sidebar z-30 hidden lg:flex flex-col border-r border-mali-blue/20">
        {/* Logo */}
        <div className="p-6">
          <Link href="/">
            <div className="font-bold text-xl flex items-center">
              <span className="text-mali-blue-light">Mali</span>
              <span className="text-white">GamePass</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 pt-2 px-3 space-y-1 overflow-y-auto">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));

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
        </nav>


      </aside>

      {/* Mobile navbar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-mali-sidebar border-t border-mali-blue/20 lg:hidden">
        <div className="flex justify-around items-center">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <MobileNavItem
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

      {/* Main Content */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen transition-all duration-300">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-mali-sidebar border-b border-mali-blue/20">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            {/* Mobile Logo and Menu */}
            <div className="flex items-center space-x-4 lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-mali-text-secondary focus:outline-none"
              >
                <Menu size={24} />
              </button>
              <Link href="/">
                <div className="font-bold text-lg flex items-center">
                  <span className="text-mali-blue-light">Mali</span>
                  <span className="text-white">GamePass</span>
                </div>
              </Link>
            </div>

            {/* Search */}
            <div className="hidden md:block flex-1 max-w-md mx-auto">
              <SearchBar
                variant="header"
                placeholder="ค้นหาเกม"
              />
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* Notification Dropdown */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-mali-text-secondary hover:text-white hover:bg-white/5 transition-all relative"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-mali-red rounded-full ring-2 ring-mali-sidebar flex items-center justify-center">
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {isNotificationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-80 rounded-xl shadow-lg bg-mali-card border border-mali-blue/30 overflow-hidden z-50 origin-top-right"
                    >
                      <div className="p-3 border-b border-mali-blue/20 flex justify-between items-center bg-mali-blue/5">
                        <h3 className="text-white font-medium text-sm">การแจ้งเตือน</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-mali-blue-accent hover:text-mali-blue-light transition-colors"
                          >
                            อ่านทั้งหมด
                          </button>
                        )}
                      </div>

                      <div className="max-h-[300px] overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={cn(
                                "p-3 border-b border-mali-blue/10 hover:bg-mali-blue/10 transition-colors flex gap-3 cursor-pointer",
                                !notification.read && "bg-mali-blue/5"
                              )}
                              onClick={() => markAsRead(notification.id)}
                            >
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                                notification.type === 'success' ? "bg-green-500/20 text-green-400" :
                                  notification.type === 'error' ? "bg-red-500/20 text-red-400" :
                                    notification.type === 'warning' ? "bg-yellow-500/20 text-yellow-400" :
                                      "bg-blue-500/20 text-blue-400"
                              )}>
                                {notification.type === 'success' ? <Zap size={14} /> :
                                  notification.type === 'error' ? <LogOut size={14} /> :
                                    <Bell size={14} />}
                              </div>
                              <div className="flex-1">
                                <p className={cn("text-sm mb-1", !notification.read ? "text-white font-medium" : "text-mali-text-secondary")}>
                                  {notification.title}
                                </p>
                                <p className="text-xs text-mali-text-secondary line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-[10px] text-mali-text-secondary/60 mt-1">
                                  {new Date(notification.createdAt).toLocaleTimeString()}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 rounded-full bg-mali-blue-accent mt-2 shrink-0" />
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-mali-text-secondary flex flex-col items-center">
                            <Bell size={24} className="mb-2 opacity-20" />
                            <p className="text-sm">ไม่มีการแจ้งเตือนใหม่</p>
                          </div>
                        )}
                      </div>

                      <Link href="/notifications" className="block p-2 text-center text-xs text-mali-blue-accent hover:bg-mali-blue/10 border-t border-mali-blue/20 transition-colors">
                        ดูทั้งหมด
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Divider */}
              <div className="h-8 w-[1px] bg-mali-blue/20 mx-1"></div>

              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={toggleUserMenu}
                    className="flex items-center md:space-x-3 text-white pl-1 pr-2 py-1 rounded-full hover:bg-white/5 transition-all"
                  >
                    <div className="w-9 h-9 rounded-full bg-mali-blue flex items-center justify-center overflow-hidden border-2 border-mali-blue-light/30 shadow-sm">
                      <img
                        src={user?.avatar || "https://placehold.co/200x200?text=User"}
                        alt={`${user?.username} avatar`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-sm font-medium w-[100px] truncate text-left leading-tight">{user?.username}</span>
                      <span className="text-[10px] text-mali-text-secondary">Member</span>
                    </div>
                    <ChevronDown size={14} className="text-mali-text-secondary ml-1" />
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-64 rounded-xl shadow-xl bg-mali-card border border-mali-blue/30 overflow-hidden z-50 origin-top-right"
                      >
                        <div className="p-4 border-b border-mali-blue/20 bg-gradient-to-br from-mali-blue/10 to-transparent">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-12 h-12 rounded-full border-2 border-mali-blue-light/50 overflow-hidden">
                              <img src={user?.avatar || "https://placehold.co/200x200?text=User"} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="text-white font-medium">{user?.username}</p>
                              <p className="text-mali-text-secondary text-xs">{user?.email}</p>
                            </div>
                          </div>

                          {user?.isPremium && (
                            <div className="mb-3 bg-gradient-to-r from-yellow-600/20 to-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs px-2 py-1 rounded flex items-center">
                              <Star size={12} className="mr-1 fill-yellow-400" /> สมาชิกพรีเมียม
                            </div>
                          )}

                          <div className="flex justify-between items-center bg-mali-dark/50 p-2 rounded-lg border border-mali-blue/20">
                            <span className="text-mali-text-secondary text-xs">คะแนนสะสม</span>
                            <span className="text-mali-blue-accent font-bold font-mono">{user?.credits?.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="p-2">
                          {accountMenuItems.slice(0, 4).map((item) => (
                            <Link key={item.href} href={item.href}>
                              <div className="px-3 py-2.5 rounded-lg text-sm text-mali-text-secondary hover:bg-mali-blue/20 hover:text-white flex items-center space-x-3 transition-colors">
                                <span className="opacity-70">{item.icon}</span>
                                <span>{item.label}</span>
                              </div>
                            </Link>
                          ))}

                          <div className="my-1 border-t border-mali-blue/10"></div>

                          <button
                            onClick={handleLogout}
                            className="w-full px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center space-x-3 transition-colors"
                          >
                            <LogOut size={18} className="opacity-70" />
                            <span>ออกจากระบบ</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center space-x-1 text-white bg-button-gradient px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-all shadow-button-glow"
                >
                  <User size={16} />
                  <span>เข้าสู่ระบบ</span>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="py-4 px-4 md:px-6 container mx-auto flex-grow">
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
