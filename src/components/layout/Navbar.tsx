"use client";

import { useState, useRef, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { Search, ChevronDown, Coins, AlignJustify, User, LogOut, ShoppingCart, Shield } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { usePublicSettings } from "@/lib/context/public-settings-context";
import { NavSearchBox } from "./NavSearchBox";

export default function Navbar() {
    const t = useTranslations();
    const tAdmin = useTranslations();
    const pathname = usePathname();
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const { user, isSessionChecked, logout, isAdmin } = useAuth();
    const { settings } = usePublicSettings();

    const logoUrl = settings?.branding?.logoUrl;
    const siteName = settings?.general?.siteName || "";

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await logout();
        setMobileMenuOpen(false);
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    };

    return (
        <div className="w-full flex-col z-50 sticky top-0 font-sans border-b border-site-border">
            {/* ════════════════ TOP ANNOUNCEMENT BAR ════════════════ */}
            <div className="bg-[#141517] w-full hidden md:block">
                <div className="site-container h-[30px] flex items-center justify-between text-[12px] text-[#a1a1aa]">
                    {/* Left Links */}
                    <div className="flex items-center gap-5">
                        <Link href="/news" className="hover:text-white transition-colors">{t("Header.news")}</Link>
                        <Link href="/dealer" className="hover:text-white transition-colors">{t("Header.dealers")}</Link>
                        <Link href="/how-to" className="hover:text-white transition-colors">{t("how_to_use.title")}</Link>
                    </div>

                    {/* Right Language/Currency */}
                    <div className="flex items-center gap-4 text-white">
                        <LanguageSwitcher variant="desktop" />
                    </div>
                </div>
            </div>

            {/* ════════════════ MAIN NAVBAR ════════════════ */}
            <nav className="bg-[#17181A] w-full">
                <div className="site-container h-[64px] flex items-center justify-between">

                    {/* LOGO & MAIN LINKS */}
                    <div className="flex items-center h-full gap-1">
                        <Link href="/" className="flex items-center gap-2.5 mr-6 shrink-0">
                            {/* Logo: image only, no fallback text */}
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt={siteName}
                                    className="h-14 w-auto object-contain max-w-[240px]"
                                />
                            ) : (
                                /* Empty placeholder to reserve space and prevent layout shift */
                                <div className="h-14 w-[56px]" />
                            )}
                        </Link>

                        {/* Vertical Divider */}
                        <div className="hidden lg:block w-[1px] h-5 bg-[#333] mr-4"></div>

                        {/* Desktop Links */}
                        <div className="hidden lg:flex items-center gap-1 text-[13px] text-[#ccc] font-medium h-full">
                            <Link href="/games" className="hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-md transition-all">{t("nav_game_topup")}</Link>
                            <Link href="/card" className="hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-md transition-all">{t("nav_prepaid_card")}</Link>
                            <Link href="/mobile-recharge" className="hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-md transition-all">{t("nav_mobile_topup")}</Link>
                        </div>
                    </div>

                    {/* SEARCH & USER ACTIONS */}
                    <div className="hidden lg:flex items-center gap-3">
                        {/* Search Input */}
                        <div className="relative flex items-center z-[100]">
                            <NavSearchBox />
                        </div>

                        {/* User Actions Auth State */}
                        {!isSessionChecked ? (
                            <div className="w-[120px] h-[34px] bg-site-border/50 rounded-[6px] animate-pulse"></div>
                        ) : user ? (
                            <div className="relative" ref={userMenuRef}>
                                <div
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center gap-2.5 bg-[#181A1D] px-2 py-1.5 pr-3 rounded-full cursor-pointer hover:bg-[#212328] transition-all border border-site-border/80 shadow-sm"
                                >
                                    <div className="w-7 h-7 bg-gradient-to-br from-site-accent to-blue-600 rounded-full flex items-center justify-center overflow-hidden shadow-inner">
                                        <span className="text-white text-[11px] font-bold">
                                            {(user?.name?.charAt(0) || user?.username?.charAt(0) || user?.email?.charAt(0) || "U").toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[#f4f4f5] text-[12px] font-bold leading-tight truncate max-w-[100px] hidden sm:block">
                                            {user?.username || user?.name || "Player"}
                                        </span>
                                        <span className="text-[#a1a1aa] text-[10px] leading-tight hidden sm:block">
                                            {t("my_account")}
                                        </span>
                                    </div>
                                    <ChevronDown size={14} className={`text-gray-400 ml-1 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                                </div>
                                {/* Dropdown Menu */}
                                {showUserMenu && (
                                    <div className="absolute right-0 top-full mt-2.5 flex flex-col bg-[#181A1D] border border-site-border/80 rounded-[12px] shadow-2xl w-[280px] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {/* User Info Header */}
                                        <div className="p-4 border-b border-site-border/30 bg-[#1c1e22]">
                                            <div className="flex items-center gap-3">
                                                <div className="h-11 w-11 rounded-full bg-gradient-to-br from-site-accent to-blue-600 flex items-center justify-center shadow-inner shrink-0 ring-2 ring-[#181A1D]">
                                                    <span className="text-white font-bold text-lg">
                                                        {(user?.name?.charAt(0) || user?.username?.charAt(0) || user?.email?.charAt(0) || "U").toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-bold text-[#f4f4f5] text-[14px] truncate">
                                                        {user?.username || user?.name || "Player"}
                                                    </div>
                                                    <div className="text-[#a1a1aa] text-[12px] truncate mt-0.5">
                                                        {user?.email || "user@example.com"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Menu Items */}
                                        <div className="p-2 flex flex-col gap-0.5">
                                            {isAdmin && (
                                                <Link href="/admin" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[13px] text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors font-medium group">
                                                    <div className="w-7 h-7 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                                                        <Shield size={14} />
                                                    </div>
                                                    {t("admin_panel")}
                                                </Link>
                                            )}
                                            <Link href="/dashboard/account" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[13px] text-gray-300 hover:text-white hover:bg-[#272a30] transition-colors group">
                                                <div className="w-7 h-7 rounded-full bg-[#212328] flex items-center justify-center group-hover:bg-[#2a2d35] transition-colors text-gray-400 group-hover:text-white">
                                                    <User size={14} />
                                                </div>
                                                {t("my_account")}
                                            </Link>
                                            <Link href="/dashboard/credits" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[13px] text-gray-300 hover:text-white hover:bg-[#272a30] transition-colors group">
                                                <div className="w-7 h-7 rounded-full bg-[#212328] flex items-center justify-center group-hover:bg-[#2a2d35] transition-colors text-gray-400 group-hover:text-white">
                                                    <Coins size={14} />
                                                </div>
                                                {t("credits")}
                                            </Link>
                                            <Link href="/dashboard/orders" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[13px] text-gray-300 hover:text-white hover:bg-[#272a30] transition-colors group">
                                                <div className="w-7 h-7 rounded-full bg-[#212328] flex items-center justify-center group-hover:bg-[#2a2d35] transition-colors text-gray-400 group-hover:text-white">
                                                    <ShoppingCart size={14} />
                                                </div>
                                                {t("order_history")}
                                            </Link>
                                        </div>

                                        {/* Logout Section */}
                                        <div className="p-2 border-t border-site-border/30 bg-[#141517]/50">
                                            <button onClick={() => { setShowUserMenu(false); handleLogout(); }} className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[13px] text-[#EB5757] hover:text-[#FF6B6B] hover:bg-red-500/10 transition-colors text-left w-full font-medium group">
                                                <div className="w-7 h-7 rounded-full bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                                                    <LogOut size={14} />
                                                </div>
                                                {t("logout")}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link href="/login" className="bg-site-accent text-white text-[12px] px-4 py-1.5 rounded-[6px] font-bold transition-colors hover:bg-site-accent-hover shadow-accent-glow">
                                {t("login_button")}
                            </Link>
                        )}
                    </div>

                    {/* MOBILE TOGGLE */}
                    <div className="lg:hidden flex items-center gap-4">
                        {!isSessionChecked ? (
                            <div className="w-16 h-8 bg-site-border/50 rounded-[6px] animate-pulse"></div>
                        ) : user ? (
                            <Link href="/dashboard/account" className="flex items-center gap-2 bg-[#212328] px-3 py-1.5 rounded-full border border-site-border/50">
                                <div className="w-5 h-5 bg-[#181A1D] rounded-full flex items-center justify-center overflow-hidden border border-site-border/50">
                                    <User size={10} className="text-gray-400" />
                                </div>
                                <span className="text-white text-[11px] font-medium truncate max-w-[70px]">
                                    {user?.username || user?.name || "Player"}
                                </span>
                            </Link>
                        ) : (
                            <Link href="/login" className="bg-site-accent text-white text-[12px] px-4 py-1.5 rounded-[6px] font-bold transition-colors hover:bg-site-accent-hover shadow-accent-glow">
                                {t("login_button")}
                            </Link>
                        )}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="text-white p-1 hover:text-site-accent transition-colors"
                        >
                            <AlignJustify size={24} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* MOBILE MENU */}
            {mobileMenuOpen && (
                <div className="lg:hidden bg-[#17181A] border-t border-site-border">
                    <div className="flex flex-col p-4 space-y-4 text-white text-[14px]">
                        <Link href="/games" className="hover:text-site-accent">{t("topup_system")}</Link>
                        <Link href="/games/all" className="hover:text-site-accent">{t("games.title")}</Link>
                        <Link href="/card" className="hover:text-site-accent">{t("Catalog.card.title")}</Link>
                        <Link href="/lucky" className="hover:text-site-accent">{t("lucky_games")}</Link>

                        <div className="h-[1px] bg-site-border my-2"></div>

                        <div className="py-2">
                            <LanguageSwitcher variant="mobile" />
                        </div>

                        <div className="h-[1px] bg-site-border my-2"></div>

                        <Link href="/article" className="text-gray-400 hover:text-white">{t("Header.articles")}</Link>
                        <Link href="/promotions" className="text-gray-400 hover:text-white">{tAdmin("promotions")}</Link>
                        <Link href="/news" className="text-gray-400 hover:text-white">{t("Header.news")}</Link>

                        {user && (
                            <>
                                <div className="h-[1px] bg-site-border my-2"></div>
                                {isAdmin && (
                                    <Link href="/admin" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors w-full font-medium" onClick={() => setMobileMenuOpen(false)}>
                                        <Shield size={16} /> {t("admin_panel")}
                                    </Link>
                                )}
                                <Link href="/dashboard/account" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-full" onClick={() => setMobileMenuOpen(false)}>
                                    <User size={16} /> {t("my_account")}
                                </Link>
                                <Link href="/dashboard/credits" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-full" onClick={() => setMobileMenuOpen(false)}>
                                    <Coins size={16} /> {t("credits")}
                                </Link>
                                <Link href="/dashboard/orders" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-full" onClick={() => setMobileMenuOpen(false)}>
                                    <ShoppingCart size={16} /> {t("order_history")}
                                </Link>
                                <div className="h-[1px] bg-site-border my-2"></div>
                                <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors w-full text-left font-medium">
                                    <LogOut size={16} /> {t("logout")}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
