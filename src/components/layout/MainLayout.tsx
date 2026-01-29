"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Home,
  ShoppingCart,
  CreditCard,
  Gift,
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
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "@/lib/framer-exports";
import { useState, useEffect, useMemo, memo } from "react";
import { Footer } from "./footer";
import { useAuth } from "@/lib/context/auth-context";
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
          className="absolute inset-0 bg-glow-gradient opacity-0"
          animate={{ opacity: 0.1 }}
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

  // Create memoized nav items with hardcoded Thai text
  const mainNavItems = useMemo(() => [
    { href: "/", label: "หน้าแรก", icon: <Home size={20} /> },
    { href: "/games", label: "เกมทั้งหมด", icon: <Gamepad2 size={20} /> },
    { href: "/direct-topup", label: "เติมเงินโดยตรง", icon: <DollarSign size={20} /> },
    { href: "/card", label: "บัตร", icon: <CreditCard size={20} /> },
    { href: "/favorite", label: "รายการโปรด", icon: <Heart size={20} /> },
    { href: "/flash-sales", label: "แฟลชเซลล์", icon: <Zap size={20} /> },
    { href: "/cashback", label: "เงินคืน", icon: <Coins size={20} /> },
    { href: "/referral", label: "ชวนเพื่อน", icon: <Share2 size={20} /> },
    { href: "/support", label: "ช่วยเหลือ", icon: <MessageCircle size={20} /> },
  ], []);

  const mobileNavItems = useMemo(() => [
    { href: "/", label: "หน้าแรก", icon: <Home size={20} /> },
    { href: "/games", label: "เกมทั้งหมด", icon: <Gamepad2 size={20} /> },
    { href: "/direct-topup", label: "เติมเงิน", icon: <DollarSign size={20} /> },
    { href: "/orders", label: "คำสั่งซื้อ", icon: <ShoppingCart size={20} /> },
    { href: "/account", label: "บัญชี", icon: <User size={20} /> },
  ], []);

  const accountMenuItems = useMemo(() => [
    { href: "/account", label: "บัญชีของฉัน", icon: <User size={18} /> },
    { href: "/top-up", label: "เติมเงิน", icon: <DollarSign size={18} /> },
    { href: "/direct-topup", label: "เติมเงินโดยตรง", icon: <Gamepad2 size={18} /> },
    { href: "/card", label: "บัตร", icon: <CreditCard size={18} /> },
    { href: "/my-cards", label: "บัตรของฉัน", icon: <CreditCard size={18} /> },
    { href: "/invoice", label: "ใบแจ้งหนี้", icon: <FileText size={18} /> },
    { href: "/balance", label: "ยอดเงิน", icon: <DollarSign size={18} /> },
    { href: "/credits", label: "เครดิต", icon: <Coins size={18} /> },
    { href: "/coupons", label: "คูปอง", icon: <Ticket size={18} /> },
    { href: "/favorite", label: "รายการโปรด", icon: <Heart size={18} /> },
    { href: "/lucky-draw", label: "ชิงโชค", icon: <Gift size={18} /> },
    { href: "/flash-sales", label: "แฟลชเซลล์", icon: <Zap size={18} /> },
    { href: "/cashback", label: "เงินคืน", icon: <Coins size={18} /> },
    { href: "/referral", label: "ชวนเพื่อน", icon: <Share2 size={18} /> },
    { href: "/notifications", label: "การแจ้งเตือน", icon: <Bell size={18} /> },
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
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-mali-sidebar/90 backdrop-blur-md border-b border-mali-blue/20">
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
            <div className="flex items-center space-x-5">
              <button className="text-mali-text-secondary hover:text-white transition-colors relative">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-mali-red rounded-full flex items-center justify-center text-white text-xs">
                  3
                </span>
              </button>

              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={toggleUserMenu}
                    className="flex items-center space-x-2 text-white"
                  >
                    <div className="w-8 h-8 rounded-full bg-mali-blue flex items-center justify-center overflow-hidden border-2 border-mali-blue-light/30">
                      <img
                        src={user?.avatar || "https://placehold.co/200x200?text=User"}
                        alt={`${user?.name} avatar`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="hidden md:inline-block text-sm font-medium w-[100px] truncate text-left">{user?.name}</span>
                    <ChevronDown size={14} />
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-mali-card border border-mali-blue/30 overflow-hidden z-50"
                      >
                        <div className="p-3 border-b border-mali-blue/20">
                          <p className="text-white font-medium">{user?.name}</p>
                          <p className="text-mali-text-secondary text-xs">{user?.email}</p>
                          {user?.isPremium && (
                            <div className="mt-1 bg-yellow-600/20 text-yellow-400 text-xs px-2 py-0.5 rounded inline-block">
                              สมาชิกพรีเมียม
                            </div>
                          )}
                        </div>

                        {/* Credits display */}
                        <div className="p-3 border-b border-mali-blue/20 bg-mali-blue/10">
                          <div className="flex justify-between items-center">
                            <span className="text-mali-text-secondary text-xs">คะแนนสะสม:</span>
                            <span className="text-white font-medium">{user?.credits?.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="py-1">
                          {accountMenuItems.slice(0, 4).map((item) => (
                            <Link key={item.href} href={item.href}>
                              <div className="px-4 py-2 text-sm text-mali-text-secondary hover:bg-mali-blue/20 hover:text-white flex items-center space-x-2">
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                              </div>
                            </Link>
                          ))}
                          <button
                            onClick={handleLogout}
                            className="w-full px-4 py-2 text-sm text-red-400 hover:bg-mali-blue/20 flex items-center space-x-2"
                          >
                            <LogOut size={18} />
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
                  className="flex items-center space-x-1 text-white bg-button-gradient px-3 py-1.5 rounded-md text-sm shadow-button-glow hover:opacity-90 transition-opacity"
                >
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
