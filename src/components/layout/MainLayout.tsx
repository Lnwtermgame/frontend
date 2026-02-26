"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
  Search,
  Star,
  Smartphone,
  Loader2,
  Newspaper,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "@/lib/framer-exports";
import {
  useState,
  useEffect,
  useMemo,
  memo,
  useRef,
  type CSSProperties,
} from "react";
import { Footer } from "./footer";
import { useAuth } from "@/lib/context/auth-context";
import { useNotifications } from "@/lib/context/notification-context";
import SearchBar from "@/components/layout/SearchBar";
import { MobileNav } from "./MobileNav";
import { Sheet } from "@/components/ui/Sheet";
import { usePublicSettings } from "@/lib/context/public-settings-context";

interface MainLayoutProps {
  children: React.ReactNode;
}

const HeaderNavItem = memo(function HeaderNavItem({
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
        "flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all relative",
        isActive
          ? "bg-brutal-yellow text-black border-l-[3px] border-r-[3px] border-black"
          : "text-gray-700 hover:bg-gray-100 hover:text-black",
      )}
      prefetch={false}
    >
      <span className="flex items-center justify-center">{icon}</span>
      <span>{label}</span>
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
        "flex items-center justify-center flex-col gap-1 py-2 w-full transition-all",
        isActive ? "text-brutal-pink" : "text-gray-500",
      )}
      onClick={onClick}
      prefetch={false}
    >
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 transition-all",
          isActive
            ? "bg-brutal-yellow border-[3px] border-black"
            : "transparent",
        )}
        style={isActive ? { boxShadow: "3px 3px 0 0 #000000" } : undefined}
      >
        <span
          className={cn(
            "flex items-center justify-center",
            isActive ? "text-black" : "text-gray-500",
          )}
        >
          {icon}
        </span>
      </div>
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
});

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFullBleedPage = pathname.startsWith("/payments/success");
  const isTicketMonitorMode =
    pathname.startsWith("/admin/tickets") &&
    searchParams.get("monitor") === "1";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const { settings: publicSettings } = usePublicSettings();
  const { user, isAuthenticated, isInitialized, logout } = useAuth();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
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

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const handleBeforeUnload = () => {
      window.scrollTo(0, 0);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const showFloatingSearch = !pathname.startsWith("/dashboard");
  const isMaintenanceBypassPath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");
  const isMaintenanceEnabled = Boolean(
    publicSettings?.features.enableMaintenanceMode,
  );
  const shouldShowMaintenanceScreen =
    isMaintenanceEnabled && !isMaintenanceBypassPath;
  const supportTicketsEnabled =
    publicSettings?.features.enableSupportTickets ?? true;
  const dynamicThemeStyle = useMemo(
    () =>
      ({
        "--brand-primary": publicSettings?.branding.primaryColor || "#FF6B9D",
        "--brand-secondary":
          publicSettings?.branding.secondaryColor || "#95E1D3",
      }) as CSSProperties,
    [
      publicSettings?.branding.primaryColor,
      publicSettings?.branding.secondaryColor,
    ],
  );

  const mainNavItems = useMemo(
    () => [
      { href: "/", label: "หน้าแรก", icon: <Home size={20} /> },
      { href: "/games", label: "เกมทั้งหมด", icon: <Gamepad2 size={20} /> },
      { href: "/card", label: "บัตร", icon: <CreditCard size={20} /> },
      {
        href: "/mobile-recharge",
        label: "เติมเงินมือถือ",
        icon: <Smartphone size={20} />,
      },
      {
        href: "/news",
        label: "ข่าวสาร",
        icon: <Newspaper size={20} />,
      },
      {
        href: "/dashboard/favorite",
        label: "รายการโปรด",
        icon: <Heart size={20} />,
      },
      {
        href: "/support",
        label: "ช่วยเหลือ",
        icon: <MessageCircle size={20} />,
      },
    ],
    [],
  );
  const visibleMainNavItems = useMemo(
    () =>
      supportTicketsEnabled
        ? mainNavItems
        : mainNavItems.filter((item) => item.href !== "/support"),
    [mainNavItems, supportTicketsEnabled],
  );

  const mobileNavItems = useMemo(
    () => [
      { href: "/", label: "หน้าแรก", icon: <Home size={20} /> },
      { href: "/games", label: "เกม", icon: <Gamepad2 size={20} /> },
      {
        href: "/news",
        label: "ข่าว",
        icon: <Newspaper size={20} />,
      },
      {
        href: "/dashboard/orders",
        label: "คำสั่งซื้อ",
        icon: <ShoppingCart size={20} />,
      },
      { href: "/dashboard/account", label: "บัญชี", icon: <User size={20} /> },
    ],
    [],
  );

  const accountMenuItems = useMemo(
    () => [
      {
        href: "/dashboard/account",
        label: "บัญชีของฉัน",
        icon: <User size={18} />,
      },
      {
        href: "/games",
        label: "เติมเงินโดยตรง",
        icon: <Gamepad2 size={18} />,
      },
      { href: "/card", label: "บัตร", icon: <CreditCard size={18} /> },
      {
        href: "/dashboard/invoice",
        label: "ใบแจ้งหนี้",
        icon: <FileText size={18} />,
      },
      {
        href: "/dashboard/credits",
        label: "เครดิต",
        icon: <Coins size={18} />,
      },
      {
        href: "/dashboard/coupons",
        label: "คูปอง",
        icon: <Ticket size={18} />,
      },
      {
        href: "/dashboard/favorite",
        label: "รายการโปรด",
        icon: <Heart size={18} />,
      },
      {
        href: "/dashboard/notifications",
        label: "การแจ้งเตือน",
        icon: <Bell size={18} />,
      },
    ],
    [],
  );

  useEffect(() => {
    if (!publicSettings) return;
    const title =
      publicSettings.seo.metaTitle || publicSettings.general.siteName;
    const description =
      publicSettings.seo.metaDescription ||
      publicSettings.general.siteTagline ||
      "";
    const favicon = publicSettings.branding.faviconUrl;

    if (title) document.title = title;
    if (description) {
      const meta = document.querySelector("meta[name='description']");
      if (meta) meta.setAttribute("content", description);
    }
    if (favicon) {
      const iconEl = document.querySelector(
        "link[rel='icon']",
      ) as HTMLLinkElement | null;
      if (iconEl) {
        iconEl.href = favicon;
      } else {
        const link = document.createElement("link");
        link.rel = "icon";
        link.href = favicon;
        document.head.appendChild(link);
      }
    }
  }, [publicSettings]);

  const renderBrand = (compact = false) => {
    const siteName = publicSettings?.general.siteName || "Lnwtermgame";
    const logoUrl = publicSettings?.branding.logoUrl;

    if (logoUrl) {
      return (
        <div className="flex items-center gap-2">
          <img
            src={logoUrl}
            alt={siteName}
            className="h-8 w-8 rounded border-[2px] border-black object-cover"
          />
          <span
            className={cn(
              "font-bold text-black",
              compact ? "text-lg" : "text-xl",
            )}
          >
            {siteName}
          </span>
        </div>
      );
    }

    return (
      <div
        className={cn(
          "font-bold flex items-center",
          compact ? "text-lg" : "text-xl",
        )}
      >
        <span className="text-brutal-pink">
          {siteName.slice(0, 4) || "Mali"}
        </span>
        <span className="text-black">{siteName.slice(4) || "GamePass"}</span>
      </div>
    );
  };

  if (isTicketMonitorMode) {
    return <div className="min-h-screen w-full bg-gray-50">{children}</div>;
  }

  if (shouldShowMaintenanceScreen) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-brutal-gray p-6"
        style={dynamicThemeStyle}
      >
        <div
          className="w-full max-w-2xl border-[3px] border-black bg-white p-8 text-center"
          style={{ boxShadow: "6px 6px 0 0 #000000" }}
        >
          <h1 className="mb-3 text-3xl font-black text-black">
            {publicSettings?.general.siteName || "Lnwtermgame"}
          </h1>
          <p className="text-lg font-bold text-black">
            ระบบอยู่ระหว่างปรับปรุง
          </p>
          <p className="mt-3 text-sm text-gray-700">
            {publicSettings?.features.maintenanceMessage ||
              "ขออภัยในความไม่สะดวก ทีมงานกำลังปรับปรุงระบบและจะกลับมาให้บริการเร็วที่สุด"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen bg-brutal-gray thai-font w-full max-w-full overflow-x-clip"
      style={dynamicThemeStyle}
    >
      {/* Main Content - Full width */}
      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 w-full max-w-full min-w-0 overflow-x-clip pb-20 lg:pb-0">
        {/* Header */}
        <header
          className="sticky top-0 z-30 bg-white border-b-[3px] border-black"
          style={{ boxShadow: "0 4px 0 0 rgba(0,0,0,0.05)" }}
        >
          {/* Top row: Logo, Search, User */}
          <div className="h-16 flex items-center justify-between px-4 min-w-0">
            {/* Mobile Menu Button + Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden text-gray-700 focus:outline-none p-1"
              >
                <Menu size={24} />
              </button>
              <Link href="/" className="shrink-0">
                {renderBrand(true)}
              </Link>
            </div>

            {/* Search - Desktop */}
            <div className="hidden md:block flex-1 max-w-md mx-4">
              <SearchBar variant="header" placeholder="ค้นหาเกม" />
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 min-w-0">
              {/* Notification Dropdown - Show only when authenticated */}
              {isAuthenticated && (
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all relative border-[2px] border-transparent hover:border-black"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-brutal-pink text-white text-[10px] font-bold rounded-full border-[2px] border-black flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
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
                        className="fixed top-20 left-2 right-2 w-auto bg-white border-[3px] border-black overflow-hidden z-50 origin-top sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:mt-2 sm:w-80 sm:max-w-[calc(100vw-1rem)] sm:origin-top-right"
                        style={{ boxShadow: "4px 4px 0 0 #000000" }}
                      >
                        <div className="p-3 border-b-[2px] border-black flex justify-between items-center bg-gray-50">
                          <h3 className="text-gray-900 font-bold text-sm">
                            การแจ้งเตือน
                          </h3>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-xs text-brutal-pink hover:text-brutal-pink/80 font-semibold transition-colors"
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
                                  "p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors flex gap-3 cursor-pointer",
                                  !notification.isRead && "bg-brutal-yellow/10",
                                )}
                                onClick={() => markAsRead(notification.id)}
                              >
                                <div
                                  className={cn(
                                    "w-8 h-8 flex items-center justify-center shrink-0 mt-1 border-[2px] border-black",
                                    notification.type === "ORDER"
                                      ? "bg-brutal-green text-black"
                                      : notification.type === "PAYMENT"
                                        ? "bg-brutal-blue text-black"
                                        : notification.type === "PROMOTION"
                                          ? "bg-brutal-yellow text-black"
                                          : "bg-gray-200 text-black",
                                  )}
                                >
                                  {notification.type === "ORDER" ? (
                                    <ShoppingCart size={14} />
                                  ) : notification.type === "PAYMENT" ? (
                                    <CreditCard size={14} />
                                  ) : notification.type === "PROMOTION" ? (
                                    <Ticket size={14} />
                                  ) : (
                                    <Bell size={14} />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p
                                    className={cn(
                                      "text-sm mb-1",
                                      !notification.isRead
                                        ? "text-gray-900 font-semibold"
                                        : "text-gray-600",
                                    )}
                                  >
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-gray-500 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-[10px] text-gray-400 mt-1">
                                    {new Date(
                                      notification.createdAt,
                                    ).toLocaleTimeString()}
                                  </p>
                                </div>
                                {!notification.isRead && (
                                  <div className="w-2 h-2 rounded-full bg-brutal-pink mt-2 shrink-0" />
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                              <Bell size={24} className="mb-2 opacity-30" />
                              <p className="text-sm">ไม่มีการแจ้งเตือนใหม่</p>
                            </div>
                          )}
                        </div>

                        <Link
                          href="/dashboard/notifications"
                          onClick={() => setIsNotificationOpen(false)}
                          className="block p-2 text-center text-xs text-gray-700 hover:bg-gray-100 border-t border-gray-100 font-medium transition-colors"
                        >
                          ดูทั้งหมด
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Show divider only when authenticated */}
              {isAuthenticated && (
                <div className="h-8 w-[2px] bg-gray-200 mx-1 hidden md:block"></div>
              )}

              {!isInitialized ? (
                <div className="flex items-center space-x-2 border-[2px] border-gray-300 px-3 py-2 text-sm text-gray-500">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="hidden sm:inline">กำลังโหลด</span>
                </div>
              ) : isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={toggleUserMenu}
                    className="flex items-center gap-2 text-gray-900 pl-1 pr-2 py-1 hover:bg-gray-100 transition-all border-[2px] border-transparent hover:border-black"
                  >
                    <div className="w-9 h-9 bg-brutal-yellow flex items-center justify-center overflow-hidden border-[2px] border-black shrink-0">
                      <img
                        src={
                          user?.avatar ||
                          "https://placehold.co/200x200?text=User"
                        }
                        alt={`${user?.username} avatar`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-sm font-bold w-[100px] truncate text-left leading-tight">
                        {user?.username}
                      </span>
                      <span className="text-[10px] text-gray-500">Member</span>
                    </div>
                    <ChevronDown
                      size={14}
                      className="text-gray-500 hidden md:block"
                    />
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed top-20 left-2 right-2 w-auto bg-white border-[3px] border-black overflow-hidden z-50 origin-top sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:mt-2 sm:w-64 sm:max-w-[calc(100vw-1rem)] sm:origin-top-right"
                        style={{ boxShadow: "4px 4px 0 0 #000000" }}
                      >
                        <div className="p-4 border-b-[2px] border-black bg-gray-50">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-12 h-12 border-[3px] border-black overflow-hidden bg-brutal-yellow">
                              <img
                                src={
                                  user?.avatar ||
                                  "https://placehold.co/200x200?text=User"
                                }
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="text-gray-900 font-bold">
                                {user?.username}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {user?.email}
                              </p>
                            </div>
                          </div>

                          {user?.isPremium && (
                            <div
                              className="mb-3 bg-brutal-yellow border-[2px] border-black text-black text-xs px-2 py-1 flex items-center font-bold"
                              style={{ boxShadow: "2px 2px 0 0 #000000" }}
                            >
                              <Star size={12} className="mr-1 fill-black" />{" "}
                              สมาชิกพรีเมียม
                            </div>
                          )}

                          <div
                            className="flex justify-between items-center bg-white p-2 border-[2px] border-black"
                            style={{ boxShadow: "2px 2px 0 0 #000000" }}
                          >
                            <span className="text-gray-600 text-xs">
                              คะแนนสะสม
                            </span>
                            <span className="text-black font-bold font-mono">
                              {user?.credits?.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="p-2">
                          {accountMenuItems.slice(0, 4).map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <div className="px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3 transition-colors font-medium">
                                <span className="opacity:70">{item.icon}</span>
                                <span>{item.label}</span>
                              </div>
                            </Link>
                          ))}

                          <div className="my-1 border-t border-gray-100"></div>

                          <button
                            onClick={handleLogout}
                            className="w-full px-3 py-2.5 text-sm text-brutal-pink hover:bg-brutal-pink/10 flex items-center space-x-3 transition-colors font-medium"
                          >
                            <LogOut size={18} className="opacity:70" />
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
                  className="flex items-center space-x-1 text-black bg-brutal-yellow px-3 py-2 text-sm font-bold border-[3px] border-black transition-all hover:-translate-y-0.5 shrink-0"
                  style={{ boxShadow: "4px 4px 0 0 #000000" }}
                >
                  <User size={16} />
                  <span className="hidden sm:inline">เข้าสู่ระบบ</span>
                </Link>
              )}
            </div>
          </div>

          {/* Bottom row: Navigation - Desktop only */}
          <nav className="hidden lg:flex items-center justify-center border-t-[3px] border-black bg-white">
            {visibleMainNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <HeaderNavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={isActive}
                />
              );
            })}
          </nav>
        </header>

        {/* Main content */}
        {publicSettings?.features.enableMaintenanceMode && (
          <div className="border-b-[3px] border-black bg-red-100 px-4 py-2 text-sm text-red-900">
            {publicSettings.features.maintenanceMessage ||
              "ระบบอยู่ระหว่างปรับปรุงบางส่วน"}
          </div>
        )}
        {publicSettings?.homepage.announcementEnabled &&
          publicSettings.homepage.announcementText && (
            <div className="border-b-[2px] border-black bg-yellow-100 px-4 py-2 text-sm text-black">
              {publicSettings.homepage.announcementText}
            </div>
          )}
        <main
          className={cn(
            "flex-grow w-full max-w-full min-w-0 overflow-x-clip",
            isFullBleedPage
              ? "px-0 py-0"
              : "container mx-auto px-4 py-4 md:px-6",
          )}
        >
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Mobile navbar - Bottom */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-black lg:hidden safe-bottom h-16"
        style={{ boxShadow: "0 -4px 0 0 rgba(0,0,0,0.1)" }}
      >
        <div className="flex justify-around items-center h-full">
          {mobileNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

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
      </nav>

      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {showFloatingSearch && (
        <>
          <button
            onClick={() => setIsMobileSearchOpen(true)}
            className="lg:hidden fixed bottom-20 right-4 z-30 w-14 h-14 bg-brutal-yellow border-[3px] border-black flex items-center justify-center shadow-lg"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
            aria-label="เปิดค้นหา"
          >
            <Search size={24} className="text-black" />
          </button>

          <Sheet
            isOpen={isMobileSearchOpen}
            onClose={() => setIsMobileSearchOpen(false)}
            title="ค้นหาเกม"
          >
            <div className="space-y-3">
              <SearchBar variant="full" placeholder="ค้นหาเกม" />
              <p className="text-xs text-gray-500">
                พิมพ์ชื่อเกมหรือสินค้าที่ต้องการ แล้วเลือกรายการจากผลลัพธ์
              </p>
            </div>
          </Sheet>
        </>
      )}
    </div>
  );
}
