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
          title: tAdmin("promotions"),
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
        className="lg:hidden flex items-center justify-between mb-4 bg-white border-[3px] border-black p-3"
        style={{ boxShadow: "4px 4px 0 0 #000000" }}
      >
        <h1 className="text-lg font-black text-black thai-font flex items-center">
          <span className="w-1.5 h-4 bg-brutal-pink mr-2"></span>
          {title || tAdmin("admin_cp")}
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
          <div className="w-64 bg-white h-full shadow-xl p-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-black text-xl text-black thai-font flex items-center">
                <span className="w-1.5 h-5 bg-brutal-pink mr-2"></span>
                {tAdmin("admin")}
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
            <nav className="space-y-1">
              {allNavItems.map((item) => (
                <Link href={item.href} key={item.href}>
                  <div
                    className={cn(
                      "flex items-center py-2 px-3 text-gray-600 hover:bg-gray-100 hover:text-black transition-colors thai-font font-medium text-sm",
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
                    <span className="text-gray-500 mr-2">{item.icon}</span>
                    {item.title}
                  </div>
                </Link>
              ))}
              <hr className="border-gray-200 my-4" />
              <button
                onClick={async () => {
                  await logout();
                  router.push(
                    `/login?redirect=${encodeURIComponent(pathname)}`,
                  );
                }}
                className="flex items-center w-full py-2 px-3 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors thai-font font-medium text-sm"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {tAdmin("logout")}
              </button>
            </nav>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Desktop sidebar */}
        <div className="hidden lg:block col-span-1">
          <div
            className="bg-white border-[3px] border-black sticky top-24"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="p-4 border-b-[2px] border-gray-200 bg-gray-50">
              <h2 className="font-black text-base text-black flex items-center thai-font">
                <div
                  className="w-6 h-6 bg-brutal-pink border-[2px] border-black flex items-center justify-center mr-2"
                  style={{ boxShadow: "2px 2px 0 0 #000000" }}
                >
                  <DollarSign className="w-3 h-3 text-white" />
                </div>
                {tAdmin("admin_cp")}
              </h2>
            </div>
            <nav className="p-3 space-y-3">
              {adminNavCategories.map((category) => (
                <div key={category.title}>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">
                    {category.title}
                  </h3>
                  <div className="space-y-1">
                    {category.items.map((item) => (
                      <Link href={item.href} key={item.href}>
                        <div
                          className={cn(
                            "flex items-center py-2 px-3 text-gray-600 hover:bg-gray-100 hover:text-black transition-colors thai-font font-medium text-sm rounded",
                            pathname === item.href &&
                            "bg-brutal-yellow text-black font-bold border-[2px] border-black",
                          )}
                          style={
                            pathname === item.href
                              ? { boxShadow: "3px 3px 0 0 #000000" }
                              : undefined
                          }
                        >
                          <span className="text-gray-500 mr-2">
                            {item.icon}
                          </span>
                          {item.title}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              <hr className="border-gray-200 my-3" />
              <div className="px-3 py-2">
                <div className="flex items-center mb-2">
                  <div
                    className="w-8 h-8 bg-brutal-yellow border-[2px] border-black flex items-center justify-center mr-2"
                    style={{ boxShadow: "2px 2px 0 0 #000000" }}
                  >
                    <User className="w-4 h-4 text-black" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-black truncate">
                      {user?.username || user?.email}
                    </div>
                    <div className="text-xs text-gray-500 thai-font">
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
                  className="flex items-center justify-center w-full py-1.5 px-3 text-brutal-pink hover:bg-brutal-pink/10 transition-colors text-xs font-bold thai-font border-[2px] border-transparent hover:border-brutal-pink"
                >
                  <LogOut className="w-3 h-3 mr-1" />
                  {tAdmin("logout")}
                </button>
              </div>
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="col-span-1 lg:col-span-4 space-y-4">
          {title && (
            <div className="hidden lg:block">
              <h1 className="text-xl font-black text-black mb-4 thai-font flex items-center">
                <span className="w-1.5 h-5 bg-brutal-pink mr-2"></span>
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
