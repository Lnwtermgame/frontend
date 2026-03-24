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
import { useState, useEffect } from "react";
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
          className="bg-[#212328] rounded-[16px] border border-white/5 p-8 max-w-md mx-auto"
        >
          <div className="animate-pulse flex space-x-4 justify-center">
            <div className="rounded-full bg-[#212328]/10 h-12 w-12"></div>
            <div className="flex-1 space-y-4 max-w-md">
              <div className="h-4 bg-[#212328]/10 w-3/4 rounded"></div>
              <div className="h-4 bg-[#212328]/10 rounded"></div>
              <div className="h-4 bg-[#212328]/10 w-5/6 rounded"></div>
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
        className="lg:hidden flex items-center justify-between mt-2 mb-6 bg-[#212328] rounded-[16px] border border-white/5 p-4 shadow-lg"
      >
        <h1 className="text-lg font-bold text-white flex items-center tracking-wide">
          <div className="w-1.5 h-5 bg-site-accent rounded-full mr-3"></div>
          {title || tAdmin("admin_cp")}
        </h1>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-gray-400 hover:text-white transition-colors"
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
        <div className="lg:hidden fixed inset-0 bg-[#121316]/90 z-[100] flex justify-end backdrop-blur-sm">
          <div className="w-72 bg-[#1A1C1E] h-full shadow-2xl p-4 overflow-y-auto border-l border-white/5">
            <div className="flex justify-between items-center mb-8 px-2">
              <h2 className="font-bold text-xl text-white flex items-center tracking-tight">
                <div className="w-1.5 h-6 bg-site-accent rounded-full mr-3"></div>
                {tAdmin("admin")}
              </h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-400 hover:text-white"
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
            <nav className="space-y-1">
              {allNavItems.map((item) => (
                <Link href={item.href} key={item.href}>
                  <div
                    className={cn(
                      "flex items-center py-3 px-4 text-gray-400 hover:bg-[#212328] hover:text-white transition-colors font-medium text-[13px] rounded-xl mb-1",
                      pathname === item.href &&
                      "bg-[#212328] text-white",
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className={cn("mr-3", pathname === item.href ? "text-site-accent" : "text-gray-500")}>{item.icon}</span>
                    {item.title}
                  </div>
                </Link>
              ))}
              <hr className="border-white/10 my-6" />
              <button
                onClick={async () => {
                  await logout();
                  router.push(
                    `/login?redirect=${encodeURIComponent(pathname)}`,
                  );
                }}
                className="flex items-center w-full py-3 px-4 text-[#ff4f4f] hover:bg-[#ff4f4f]/10 transition-colors font-medium text-[13px] rounded-xl"
              >
                <LogOut className="w-4 h-4 mr-3" />
                {t("logout")}
              </button>
            </nav>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
        {/* Desktop sidebar */}
        <div className="hidden lg:block col-span-1 xl:col-span-1">
          <div
            className="bg-[#212328] rounded-[16px] border border-white/5 sticky top-24 overflow-hidden pb-4 shadow-lg"
          >
            <div className="p-5 border-b border-white/5">
              <h2 className="font-bold text-white flex items-center tracking-wide text-[15px]">
                <div
                  className="w-8 h-8 bg-site-accent/10 rounded-full flex items-center justify-center mr-3"
                >
                  <DollarSign className="w-4 h-4 text-site-accent" />
                </div>
                {tAdmin("admin_cp")}
              </h2>
            </div>

            <nav className="p-3">
              {adminNavCategories.map((category) => (
                <div key={category.title} className="mb-4">
                  <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-3 pl-4">
                    {category.title}
                  </h3>
                  <div className="space-y-0.5 flex flex-col">
                    {category.items.map((item) => (
                      <Link href={item.href} key={item.href}>
                        <div
                          className={`w-full flex items-center text-left px-4 py-2.5 transition-colors group ${pathname === item.href
                            ? "bg-[#292B30] border-l-[3px] border-site-accent text-white"
                            : "bg-transparent border-l-[3px] border-transparent text-[#a1a1aa] hover:bg-[#292B30] hover:text-white"
                            }`}
                        >
                          <span className={cn("mr-3 transition-colors", pathname === item.href ? "text-site-accent" : "text-gray-500 group-hover:text-gray-400")}>
                            {item.icon}
                          </span>
                          <span className="text-[13px] font-medium">{item.title}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              <div className="mx-4 my-4 border-t border-white/5"></div>

              <div className="px-4">
                <div className="flex items-center mb-4 bg-[#181A1D] rounded-xl p-3 border border-white/5">
                  <div
                    className="w-10 h-10 bg-[#292B30] rounded-full flex items-center justify-center mr-3 shrink-0"
                  >
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-bold text-white truncate">
                      {user?.username || user?.email}
                    </div>
                    <div className="text-[11px] text-gray-500 font-medium tracking-wide">
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
                  className="flex items-center justify-center w-full py-2.5 px-3 text-[#ff4f4f] hover:bg-[#ff4f4f]/10 transition-colors text-[12px] font-bold rounded-xl border border-transparent hover:border-[#ff4f4f]/20"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t("logout")}
                </button>
              </div>
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="col-span-1 lg:col-span-3 xl:col-span-4 space-y-6">
          {title && (
            <div className="hidden lg:block">
              <h1 className="text-2xl font-bold text-white mb-2 flex items-center tracking-tight">
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
