"use client";

import { usePathname } from "next/navigation";
import { Link, useRouter } from "@/i18n/routing";
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
  Key,
  ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/context/auth-context";
import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const tAdmin = useTranslations("Admin");
  const t = useTranslations();

  // Hardcoded Thai navigation items - organized by category
  const adminNavCategories = [
    {
      title: tAdmin("nav.main"),
      items: [
        {
          title: tAdmin("dashboard"),
          href: "/admin",
          icon: <Home className="w-4 h-4" />,
        },
        {
          title: tAdmin("analytics"),
          href: "/admin/analytics",
          icon: <TrendingUp className="w-4 h-4" />,
        },
      ],
    },
    {
      title: tAdmin("nav.products_sales"),
      items: [
        {
          title: tAdmin("products"),
          href: "/admin/products",
          icon: <Package className="w-4 h-4" />,
        },
        {
          title: tAdmin("categories"),
          href: "/admin/categories",
          icon: <Layers className="w-4 h-4" />,
        },
        {
          title: tAdmin("orders"),
          href: "/admin/orders",
          icon: <ShoppingCart className="w-4 h-4" />,
        },
        {
          title: tAdmin("payments"),
          href: "/admin/payments",
          icon: <CreditCard className="w-4 h-4" />,
        },
        {
          title: t("promotions"),
          href: "/admin/promotions",
          icon: <Tag className="w-4 h-4" />,
        },
      ],
    },
    {
      title: tAdmin("nav.content"),
      items: [
        {
          title: tAdmin("cms_pages"),
          href: "/admin/cms/pages",
          icon: <FileText className="w-4 h-4" />,
        },
        {
          title: tAdmin("news"),
          href: "/admin/cms/news",
          icon: <Newspaper className="w-4 h-4" />,
        },
        {
          title: tAdmin("manage_faq"),
          href: "/admin/faq",
          icon: <HelpCircle className="w-4 h-4" />,
        },
        {
          title: tAdmin("images"),
          href: "/admin/images",
          icon: <ImageIcon className="w-4 h-4" />,
        },
      ],
    },
    {
      title: tAdmin("nav.users_communication"),
      items: [
        {
          title: tAdmin("manage_users"),
          href: "/admin/users",
          icon: <Users className="w-4 h-4" />,
        },
        {
          title: tAdmin("support_tickets"),
          href: "/admin/tickets",
          icon: <MessageSquare className="w-4 h-4" />,
        },
        {
          title: tAdmin("notifications"),
          href: "/admin/notification",
          icon: <Bell className="w-4 h-4" />,
        },
        {
          title: tAdmin("email"),
          href: "/admin/email",
          icon: <Mail className="w-4 h-4" />,
        },
      ],
    },
    {
      title: tAdmin("nav.system"),
      items: [
        {
          title: tAdmin("settings"),
          href: "/admin/settings",
          icon: <Settings className="w-4 h-4" />,
        },
        {
          title: tAdmin("oauth"),
          href: "/admin/oauth",
          icon: <Key className="w-4 h-4" />,
        },
      ],
    },
  ];

  // Flatten for mobile menu
  const allNavItems = adminNavCategories.flatMap((category) => category.items);
  const { user, isAdmin, logout, isInitialized, isSessionChecked } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // Restore sidebar scroll position on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("admin-sidebar-scroll");
    if (saved && sidebarRef.current) {
      sidebarRef.current.scrollTop = parseInt(saved, 10);
    }
  }, []);

  // Save sidebar scroll position on navigation
  useEffect(() => {
    return () => {
      if (sidebarRef.current) {
        sessionStorage.setItem("admin-sidebar-scroll", String(sidebarRef.current.scrollTop));
      }
    };
  }, [pathname]);

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
      <div className="w-full text-center py-20">
        <div
          className="bg-site-raised rounded-[16px] border border-white/5 p-8 max-w-md mx-auto"
        >
          <div className="animate-pulse flex space-x-4 justify-center">
            <div className="rounded-full bg-site-raised/10 h-12 w-12"></div>
            <div className="flex-1 space-y-4 max-w-md">
              <div className="h-4 bg-site-raised/10 w-3/4 rounded"></div>
              <div className="h-4 bg-site-raised/10 rounded"></div>
              <div className="h-4 bg-site-raised/10 w-5/6 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Mobile header */}
      <div
        className="lg:hidden flex items-center justify-between mb-6 bg-site-surface rounded-2xl border border-white/5 p-4 shadow-xl"
      >
        <h1 className="text-lg font-bold text-white flex items-center tracking-wide">
          <div className="w-1.5 h-5 bg-gradient-to-b from-site-accent to-site-accent/50 rounded-full mr-3 shadow-accent-glow"></div>
          {title || tAdmin("admin_cp")}
        </h1>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 bg-site-raised border border-white/5 rounded-xl text-gray-400 hover:text-white hover:border-white/10 transition-all shadow-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
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
        <div className="lg:hidden fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          ></div>

          <div className="relative w-[280px] bg-site-surface h-full shadow-2xl p-4 overflow-y-auto border-l border-white/10 flex flex-col animate-in slide-in-from-right-full duration-300">
            <div className="flex justify-between items-center mb-6 px-2">
              <h2 className="font-bold text-lg text-white flex items-center tracking-tight">
                <div className="w-8 h-8 bg-gradient-to-tr from-site-accent/20 to-site-accent/10 border border-site-accent/20 rounded-xl flex items-center justify-center mr-3">
                  <DollarSign className="w-4 h-4 text-site-accent" />
                </div>
                {tAdmin("admin_cp")}
              </h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1.5 bg-site-raised border border-white/5 rounded-lg text-gray-400 hover:text-white transition-all"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
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

            <nav className="space-y-6 flex-1">
              {adminNavCategories.map((category) => (
                <div key={category.title} className="mb-2">
                  <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">
                    {category.title}
                  </h3>
                  <div className="space-y-1">
                    {category.items.map((item) => (
                      <Link href={item.href} key={item.href}>
                        <div
                          className={cn(
                            "flex items-center py-2.5 px-3 rounded-xl transition-all font-medium text-[13px] group border border-transparent",
                            pathname === item.href
                              ? "bg-gradient-to-r from-site-accent/10 to-transparent border-site-accent/20 text-site-accent"
                              : "text-gray-400 hover:bg-site-raised hover:text-gray-200"
                          )}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <span className={cn(
                            "mr-3 transition-colors",
                            pathname === item.href ? "text-site-accent" : "text-gray-500 group-hover:text-gray-300"
                          )}>
                            {item.icon}
                          </span>
                          {item.title}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="mt-8 pt-4 border-t border-white/5">
              <button
                onClick={async () => {
                  await logout();
                  router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
                }}
                className="flex items-center w-full py-3 px-4 text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all font-medium text-[13px] rounded-xl"
              >
                <LogOut className="w-4 h-4 mr-3" />
                {t("logout")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
        {/* Desktop sidebar */}
        <div className="hidden lg:block col-span-1 xl:col-span-1">
          <div
            className="bg-site-surface rounded-2xl border border-white/5 sticky top-24 overflow-hidden pt-2 pb-4 shadow-xl flex flex-col h-[calc(100vh-120px)]"
          >
            <div className="px-5 py-4 border-b border-white/5 flex items-center shrink-0">
              <div
                className="w-9 h-9 bg-gradient-to-tr from-site-accent/20 to-site-accent/5 border border-site-accent/20 rounded-xl flex items-center justify-center mr-3 shadow-accent-glow"
              >
                <DollarSign className="w-5 h-5 text-site-accent" />
              </div>
              <h2 className="font-bold text-white tracking-wide text-[15px]">
                {tAdmin("admin_cp")}
              </h2>
            </div>

            <nav ref={sidebarRef} className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
              {adminNavCategories.map((category) => (
                <div key={category.title} className="mb-6">
                  <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2.5 px-3">
                    {category.title}
                  </h3>
                  <div className="space-y-1 flex flex-col">
                    {category.items.map((item) => {
                      const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                      return (
                        <Link href={item.href} key={item.href}>
                          <div
                            className={cn(
                              "w-full flex items-center text-left px-3 py-2.5 rounded-xl transition-all duration-200 group border relative",
                              isActive
                                ? "bg-gradient-to-r from-site-accent/10 to-site-accent/5 border-site-accent/20 text-site-accent shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                                : "bg-transparent border-transparent text-gray-400 hover:bg-site-raised hover:border-white/5 hover:text-gray-200"
                            )}
                          >
                            {isActive && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-site-accent rounded-r-md"></div>
                            )}
                            <span className={cn(
                              "mr-3 transition-transform duration-200",
                              isActive ? "text-site-accent scale-110" : "text-gray-500 group-hover:text-gray-400 group-hover:scale-110"
                            )}>
                              {item.icon}
                            </span>
                            <span className="text-[13px] font-medium tracking-wide">{item.title}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="px-4 pt-4 border-t border-white/5 shrink-0 bg-site-surface">
              <div className="flex items-center mb-3 bg-site-raised rounded-xl p-3 border border-white/5 shadow-inner">
                <div
                  className="w-10 h-10 bg-site-raised border border-white/10 rounded-full flex items-center justify-center mr-3 shrink-0 uppercase font-bold text-gray-300 text-[14px]"
                >
                  {user?.username ? user.username.charAt(0) : <User className="w-5 h-5 text-gray-400" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-bold text-white truncate">
                    {user?.username || user?.email}
                  </div>
                  <div className="text-[10px] text-site-accent font-bold tracking-wider uppercase mt-0.5">
                    {tAdmin("admin")}
                  </div>
                </div>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  router.push(
                    `/login?redirect=${encodeURIComponent(pathname)}`,
                  );
                }}
                className="flex items-center justify-center w-full py-2.5 px-3 text-white bg-red-500/10 hover:bg-red-500/20 transition-all text-[12px] font-bold rounded-xl border border-red-500/20 hover:border-red-500/40"
              >
                <LogOut className="w-4 h-4 mr-2 text-red-400" />
                <span className="text-red-400">{t("logout")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="col-span-1 lg:col-span-3 xl:col-span-4 space-y-6">
          {title && (
            <div className="hidden lg:flex items-center justify-between">
              <h1 className="text-2xl font-black text-white flex items-center tracking-tight">
                {title}
              </h1>
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}
