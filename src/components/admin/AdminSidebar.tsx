"use client";

import { usePathname, Link } from "@/i18n/routing";
import {
  Home, TrendingUp, Package, Layers, ShoppingCart, CreditCard, Tag,
  FileText, Newspaper, HelpCircle, ImageIcon, Users, MessageSquare,
  Bell, Mail, Settings, Key, Bot, Pin, PinOff, X, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { useAuth } from "@/lib/context/auth-context";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}
interface NavCategory {
  title: string;
  items: NavItem[];
}

export function AdminSidebar({ mobileOpen, onCloseMobile }: { mobileOpen: boolean; onCloseMobile: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const tAdmin = useTranslations("Admin");
  const t = useTranslations();
  const { user, logout } = useAuth();
  const [pinned, setPinned] = useLocalStorage<boolean>("admin-sidebar-pinned", false);

  const categories: NavCategory[] = [
    {
      title: tAdmin("nav.main"),
      items: [
        { title: tAdmin("dashboard"), href: "/admin", icon: Home },
        { title: tAdmin("analytics"), href: "/admin/analytics", icon: TrendingUp },
      ],
    },
    {
      title: tAdmin("nav.products_sales"),
      items: [
        { title: tAdmin("products"), href: "/admin/products", icon: Package },
        { title: tAdmin("categories"), href: "/admin/categories", icon: Layers },
        { title: tAdmin("orders"), href: "/admin/orders", icon: ShoppingCart },
        { title: tAdmin("payments"), href: "/admin/payments", icon: CreditCard },
        { title: t("promotions"), href: "/admin/promotions", icon: Tag },
      ],
    },
    {
      title: tAdmin("nav.content"),
      items: [
        { title: tAdmin("cms_pages"), href: "/admin/cms/pages", icon: FileText },
        { title: tAdmin("news"), href: "/admin/cms/news", icon: Newspaper },
        { title: tAdmin("manage_faq"), href: "/admin/faq", icon: HelpCircle },
        { title: tAdmin("images"), href: "/admin/images", icon: ImageIcon },
      ],
    },
    {
      title: tAdmin("nav.users_communication"),
      items: [
        { title: tAdmin("manage_users"), href: "/admin/users", icon: Users },
        { title: tAdmin("support_tickets"), href: "/admin/tickets", icon: MessageSquare },
        { title: tAdmin("notifications"), href: "/admin/notification", icon: Bell },
        { title: tAdmin("email"), href: "/admin/email", icon: Mail },
      ],
    },
    {
      title: tAdmin("nav.system"),
      items: [
        { title: tAdmin("ai_chat"), href: "/admin/ai-chat", icon: Bot },
        { title: tAdmin("settings"), href: "/admin/settings", icon: Settings },
        { title: tAdmin("oauth"), href: "/admin/oauth", icon: Key },
      ],
    },
  ];

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  // ─── Desktop rail (collapsed icons or pinned-expanded) ───
  const desktopRail = (
    <div
      className={cn(
        "hidden lg:flex flex-col h-full border-r border-site-border-soft bg-site-bg shrink-0 transition-[width] duration-200",
        pinned ? "w-52" : "w-16",
      )}
    >
      {/* Pin toggle */}
      <div className="flex items-center px-3 h-14 border-b border-site-border-soft shrink-0">
        {pinned && (
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-site-text truncate leading-tight">
              {tAdmin("admin_cp")}
            </div>
          </div>
        )}
        <button
          onClick={() => setPinned(!pinned)}
          className={cn(
            "p-1.5 rounded-lg text-site-dim hover:text-site-text hover:bg-site-raised transition-colors",
            pinned ? "ml-auto" : "mx-auto",
          )}
          aria-label={pinned ? tAdmin("unpin") : tAdmin("pin")}
          title={pinned ? tAdmin("unpin") : tAdmin("pin")}
        >
          {pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {categories.map((cat) => (
          <div key={cat.title} className="mb-3">
            {pinned && (
              <h3 className="px-2 mb-1.5 text-[9px] font-bold text-site-dim uppercase tracking-widest">
                {cat.title}
              </h3>
            )}
            {!pinned && <div className="h-px bg-site-border-soft mx-2 my-2" />}
            <div className="flex flex-col gap-0.5">
              {cat.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link href={item.href} key={item.href}>
                    <div
                      data-tip={!pinned ? item.title : undefined}
                      className={cn(
                        "relative flex items-center gap-3 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors group",
                        pinned ? "" : "justify-center",
                        active
                          ? "text-site-accent"
                          : "text-site-muted hover:text-site-text hover:bg-site-raised",
                      )}
                    >
                      {active && pinned && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-1/2 bg-site-accent rounded-r" />
                      )}
                      {active && !pinned && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-1/2 bg-site-accent rounded-r" />
                      )}
                      <item.icon className="w-4 h-4 shrink-0" />
                      {pinned && <span className="truncate">{item.title}</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User + logout */}
      <div className="border-t border-site-border-soft p-3 shrink-0">
        {pinned ? (
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-site-raised border border-site-border flex items-center justify-center text-xs font-bold text-site-muted uppercase">
              {user?.username?.charAt(0) ?? "A"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-site-text truncate">
                {user?.username ?? user?.email}
              </div>
              <div className="text-[10px] text-site-accent font-bold uppercase tracking-wide">
                {tAdmin("admin")}
              </div>
            </div>
          </div>
        ) : null}
        <button
          onClick={async () => {
            await logout();
            router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
          }}
          className={cn(
            "w-full flex items-center rounded-lg text-[12px] font-semibold py-2 px-2.5 transition-colors",
            pinned ? "gap-2 justify-start text-semantic-rose hover:bg-semantic-rose/10" : "justify-center text-semantic-rose hover:bg-semantic-rose/10",
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {pinned && t("logout")}
        </button>
      </div>
    </div>
  );

  // ─── Mobile drawer ───
  const mobileDrawer = mobileOpen && (
    <div className="lg:hidden fixed inset-0 z-[100] flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCloseMobile} />
      <div className="relative w-[280px] h-full bg-site-surface border-r border-site-border shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
        <div className="flex items-center justify-between px-4 h-14 border-b border-site-border-soft shrink-0">
          <span className="font-bold text-site-text">{tAdmin("admin_cp")}</span>
          <button onClick={onCloseMobile} className="p-1.5 rounded-lg text-site-dim hover:bg-site-raised">
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {categories.map((cat) => (
            <div key={cat.title} className="mb-3">
              <h3 className="px-2 mb-1.5 text-[9px] font-bold text-site-dim uppercase tracking-widest">
                {cat.title}
              </h3>
              {cat.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link href={item.href} key={item.href}>
                    <div
                      onClick={onCloseMobile}
                      className={cn(
                        "flex items-center gap-3 px-2.5 py-2 rounded-lg text-[13px] font-medium",
                        active
                          ? "text-site-accent bg-site-accent/10"
                          : "text-site-muted hover:text-site-text hover:bg-site-raised",
                      )}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <button
          onClick={async () => {
            await logout();
            router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
          }}
          className="m-3 flex items-center gap-2 py-2.5 px-3 rounded-lg text-[13px] font-semibold text-semantic-rose hover:bg-semantic-rose/10 border-t border-site-border-soft pt-3"
        >
          <LogOut className="w-4 h-4" />
          {t("logout")}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {desktopRail}
      {mobileDrawer}
      {/* Tooltip CSS for collapsed rail icons */}
      <style jsx global>{`
        [data-tip]:hover::after {
          content: attr(data-tip);
          position: fixed;
          transform: translateX(8px);
          background: var(--site-raised);
          color: var(--site-text);
          border: 1px solid var(--site-border);
          padding: 5px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 500;
          white-space: nowrap;
          z-index: 50;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          margin-left: 40px;
          margin-top: -14px;
          pointer-events: none;
          opacity: 0;
          animation: tipIn 0.1s 0.2s forwards;
        }
        @keyframes tipIn { to { opacity: 1; } }
      `}</style>
    </>
  );
}
