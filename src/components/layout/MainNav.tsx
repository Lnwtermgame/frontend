"use client";

import { useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { ChevronDown, Coins, AlignJustify, X, User, LogOut, ShoppingCart, Shield } from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { usePublicSettings } from "@/lib/context/public-settings-context";
import { NavSearchBox } from "./NavSearchBox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getUserInitial(user: { name?: string | null; username?: string | null; email?: string | null } | null | undefined): string {
    return (user?.name?.charAt(0) || user?.username?.charAt(0) || user?.email?.charAt(0) || "U").toUpperCase();
}

export default function MainNav() {
    const t = useTranslations();
    const pathname = usePathname();
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user, isSessionChecked, logout, isAdmin } = useAuth();
    const { settings } = usePublicSettings();

    const logoUrl = settings?.branding?.logoUrl;
    const siteName = settings?.general?.siteName || "";

    const handleLogout = async () => {
        await logout();
        setMobileMenuOpen(false);
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    };

    const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

    const desktopLinkClass = (href: string) =>
        `h-full flex items-center px-1 text-[13px] font-medium transition-colors border-b-2 ${
            isActive(href)
                ? "text-site-text border-site-accent"
                : "text-site-muted hover:text-site-text border-transparent"
        }`;

    return (
        <div className="w-full flex-col z-50 sticky top-0 font-sans">
            {/* MAIN NAVBAR */}
            <nav className="bg-site-surface w-full border-b border-site-border-soft">
                <div className="site-container h-14 flex items-center justify-between">

                    {/* LOGO & DESKTOP LINKS */}
                    <div className="flex items-center h-full gap-5">
                        <Link href="/" className="flex items-center shrink-0">
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt={siteName}
                                    className="h-9 w-auto object-contain max-w-[200px]"
                                />
                            ) : (
                                <span className="text-site-accent font-extrabold text-lg tracking-tight">
                                    {siteName || "LNWTERMGAME"}
                                </span>
                            )}
                        </Link>

                        {/* Desktop Links */}
                        <div className="hidden lg:flex items-center gap-5 h-full">
                            <Link href="/games" className={desktopLinkClass("/games")}>{t("nav_game_topup")}</Link>
                            <Link href="/card" className={desktopLinkClass("/card")}>{t("nav_prepaid_card")}</Link>
                            <Link href="/mobile-recharge" className={desktopLinkClass("/mobile-recharge")}>{t("nav_mobile_topup")}</Link>
                        </div>
                    </div>

                    {/* RIGHT: SEARCH & USER ACTIONS */}
                    <div className="hidden lg:flex items-center gap-3">
                        <NavSearchBox />

                        {/* Session skeleton */}
                        {!isSessionChecked ? (
                            <div className="w-[110px] h-8 bg-site-raised rounded-6 animate-pulse" />
                        ) : user ? (
                            <DropdownMenu modal={false}>
                                {/* Avatar chip button */}
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className="group flex items-center gap-2 bg-site-raised border border-site-border-soft rounded-6 px-2 py-1.5 pr-3 cursor-pointer hover:bg-site-raised/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent/60"
                                    >
                                        <div className="w-7 h-7 bg-site-accent text-site-bg rounded-full flex items-center justify-center overflow-hidden">
                                            <span className="text-[11px] font-bold">
                                                {getUserInitial(user)}
                                            </span>
                                        </div>
                                        <div className="hidden flex-col sm:flex">
                                            <span className="text-site-text text-[12px] font-semibold leading-tight truncate max-w-[100px]">
                                                {user?.username || user?.name || "Player"}
                                            </span>
                                            <span className="text-site-dim text-[10px] leading-tight">
                                                {t("my_account")}
                                            </span>
                                        </div>
                                        <ChevronDown size={14} className="text-site-muted ml-1 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                    </button>
                                </DropdownMenuTrigger>

                                {/* Dropdown Menu */}
                                <DropdownMenuContent
                                    align="end"
                                    sideOffset={8}
                                    className="w-[260px] rounded-8 border-site-border-soft bg-site-surface p-1.5 shadow-lg z-[60]"
                                >
                                    {/* User Info Header */}
                                    <div className="-mx-1.5 -mt-1.5 mb-1.5 p-3 border-b border-site-border-soft bg-site-raised/50">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-site-accent text-site-bg flex items-center justify-center shrink-0">
                                                <span className="font-bold text-base">
                                                    {getUserInitial(user)}
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="font-semibold text-site-text text-[13px] truncate">
                                                    {user?.username || user?.name || "Player"}
                                                </div>
                                                {user?.email && (
                                                    <div className="text-site-dim text-[11px] truncate mt-0.5">
                                                        {user.email}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="flex flex-col gap-0.5">
                                        {isAdmin && (
                                            <DropdownMenuItem asChild className="gap-3 rounded-6 px-3 py-2 text-[13px] text-site-muted focus:bg-site-raised focus:text-site-text [&_svg]:size-3.5">
                                                <Link href="/admin">
                                                    <Shield size={14} />
                                                    {t("admin_panel")}
                                                </Link>
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem asChild className="gap-3 rounded-6 px-3 py-2 text-[13px] text-site-muted focus:bg-site-raised focus:text-site-text [&_svg]:size-3.5">
                                            <Link href="/dashboard/account">
                                                <User size={14} />
                                                {t("my_account")}
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild className="gap-3 rounded-6 px-3 py-2 text-[13px] text-site-muted focus:bg-site-raised focus:text-site-text [&_svg]:size-3.5">
                                            <Link href="/dashboard/credits">
                                                <Coins size={14} />
                                                {t("credits")}
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild className="gap-3 rounded-6 px-3 py-2 text-[13px] text-site-muted focus:bg-site-raised focus:text-site-text [&_svg]:size-3.5">
                                            <Link href="/dashboard/orders">
                                                <ShoppingCart size={14} />
                                                {t("order_history")}
                                            </Link>
                                        </DropdownMenuItem>
                                    </div>

                                    {/* Logout Section */}
                                    <DropdownMenuSeparator className="bg-site-border-soft" />
                                    <DropdownMenuItem
                                        onSelect={handleLogout}
                                        className="gap-3 rounded-6 px-3 py-2 text-[13px] text-status-danger focus:bg-status-danger/10 focus:text-status-danger [&_svg]:size-3.5"
                                    >
                                        <LogOut size={14} />
                                        {t("logout")}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Link href="/login" className="site-btn text-[12px]">
                                {t("login_button")}
                            </Link>
                        )}
                    </div>

                    {/* MOBILE TOGGLE */}
                    <div className="lg:hidden flex items-center gap-3">
                        {!isSessionChecked ? (
                            <div className="w-16 h-8 bg-site-raised rounded-6 animate-pulse" />
                        ) : user ? (
                            <Link href="/dashboard/account" className="flex items-center gap-2 bg-site-raised px-3 py-1.5 rounded-6 border border-site-border-soft">
                                <div className="w-5 h-5 bg-site-accent text-site-bg rounded-full flex items-center justify-center overflow-hidden">
                                    <span className="text-[9px] font-bold">
                                        {getUserInitial(user)}
                                    </span>
                                </div>
                                <span className="text-site-text text-[11px] font-medium truncate max-w-[70px]">
                                    {user?.username || user?.name || "Player"}
                                </span>
                            </Link>
                        ) : (
                            <Link href="/login" className="site-btn text-[12px]">
                                {t("login_button")}
                            </Link>
                        )}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="text-site-text p-1 hover:text-site-accent transition-colors"
                            aria-label={mobileMenuOpen ? t("menu_close") : t("menu_open")}
                        >
                            {mobileMenuOpen ? <X size={22} /> : <AlignJustify size={22} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* MOBILE MENU */}
            {mobileMenuOpen && (
                <div className="lg:hidden bg-site-surface border-t border-site-border-soft p-4 space-y-3">
                    <Link href="/games" className="block text-site-muted hover:text-site-accent transition-colors text-[14px]" onClick={() => setMobileMenuOpen(false)}>{t("nav_game_topup")}</Link>
                    <Link href="/card" className="block text-site-muted hover:text-site-accent transition-colors text-[14px]" onClick={() => setMobileMenuOpen(false)}>{t("Catalog.card.title")}</Link>
                    <Link href="/mobile-recharge" className="block text-site-muted hover:text-site-accent transition-colors text-[14px]" onClick={() => setMobileMenuOpen(false)}>{t("nav_mobile_topup")}</Link>
                    <Link href="/news" className="block text-site-muted hover:text-site-accent transition-colors text-[14px]" onClick={() => setMobileMenuOpen(false)}>{t("Header.news")}</Link>

                    <div className="h-[1px] bg-site-border-soft" />

                    <LanguageSwitcher variant="mobile" />

                    {user && (
                        <>
                            <div className="h-[1px] bg-site-border-soft" />
                            {isAdmin && (
                                <Link href="/admin" className="flex items-center gap-2 text-site-muted hover:text-site-accent transition-colors w-full text-[14px]" onClick={() => setMobileMenuOpen(false)}>
                                    <Shield size={16} /> {t("admin_panel")}
                                </Link>
                            )}
                            <Link href="/dashboard/account" className="flex items-center gap-2 text-site-muted hover:text-site-accent transition-colors w-full text-[14px]" onClick={() => setMobileMenuOpen(false)}>
                                <User size={16} /> {t("my_account")}
                            </Link>
                            <Link href="/dashboard/credits" className="flex items-center gap-2 text-site-muted hover:text-site-accent transition-colors w-full text-[14px]" onClick={() => setMobileMenuOpen(false)}>
                                <Coins size={16} /> {t("credits")}
                            </Link>
                            <Link href="/dashboard/orders" className="flex items-center gap-2 text-site-muted hover:text-site-accent transition-colors w-full text-[14px]" onClick={() => setMobileMenuOpen(false)}>
                                <ShoppingCart size={16} /> {t("order_history")}
                            </Link>
                            <div className="h-[1px] bg-site-border-soft" />
                            <button onClick={handleLogout} className="flex items-center gap-2 text-status-danger hover:text-status-danger/80 transition-colors w-full text-left text-[14px]">
                                <LogOut size={16} /> {t("logout")}
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
