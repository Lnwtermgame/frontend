"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Search,
  ChevronDown,
  User,
  LogOut,
  Coins,
  Bell,
  Globe,
  Languages,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { useCart } from "@/lib/hooks/use-cart";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "@/lib/framer-exports";
import { useTranslations, useLocale } from "next-intl";

export function Header() {
  const t = useTranslations("Header");
  const locale = useLocale();
  const { user, logout } = useAuth();
  const { getTotalItems } = useCart();
  const cartItemCount = getTotalItems();
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
      if (
        langMenuRef.current &&
        !langMenuRef.current.contains(event.target as Node)
      ) {
        setShowLangMenu(false);
      }
    }

    if (isMounted) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMounted]);

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
  };

  const handleLocaleChange = (newLocale: string) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/") || "/");
    setShowLangMenu(false);
  };

  // Animation variants
  const menuItemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 500,
        damping: 30,
      },
    },
    hover: {
      backgroundColor: "rgba(255,255,255,0.05)",
      color: "#ffffff",
      transition: { duration: 0.2 },
    },
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 500,
        damping: 30,
        staggerChildren: 0.05,
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: { duration: 0.2 },
    },
  };

  const languages = [
    { code: "en", label: "English" },
    { code: "th", label: "ไทย" },
    { code: "zh", label: "中文" },
    { code: "ja", label: "日本語" },
    { code: "ko", label: "한국어" },
    { code: "ms", label: "Melayu" },
    { code: 'hi', label: 'हिन्दी', flagCode: 'in' },
    { code: 'es', label: 'Español', flagCode: 'es' },
    { code: 'fr', label: 'Français', flagCode: 'fr' }
  ];

  const currentLanguageLabel = languages.find((l) => l.code === locale)?.label || locale;

  return (
    <motion.header
      className="w-full glass-nav border-b border-zinc-800/30"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Top navbar with secondary links */}
      <div className="container mx-auto flex items-center justify-between px-4 py-2 border-b border-zinc-800/20 text-xs text-zinc-500">
        <div className="flex items-center space-x-6">
          <motion.div whileHover={{ opacity: 1 }} initial={{ opacity: 0.8 }}>
            <Link
              href="/news"
              className="text-xs font-medium hover:text-white transition-colors"
            >
              {t("news")}
            </Link>
          </motion.div>
          <motion.div whileHover={{ opacity: 1 }} initial={{ opacity: 0.8 }}>
            <Link
              href="/support"
              className="text-xs font-medium hover:text-white transition-colors"
            >
              {t("contact_us")}
            </Link>
          </motion.div>
          <motion.div whileHover={{ opacity: 1 }} initial={{ opacity: 0.8 }}>
            <Link
              href="/games"
              className="text-xs font-medium hover:text-white transition-colors"
            >
              {t("all_games")}
            </Link>
          </motion.div>
        </div>
        <div className="flex items-center space-x-4 relative" ref={langMenuRef}>
          <button
            type="button"
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center space-x-1 hover:opacity-100 opacity-80 transition-opacity uppercase font-bold text-white"
          >
            <Languages className="h-3 w-3 mr-1" aria-hidden="true" />
            <span className="text-xs">{currentLanguageLabel}</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${showLangMenu ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>

          <AnimatePresence>
            {showLangMenu && (
              <motion.div
                className="absolute right-0 top-full mt-2 w-32 glass-card rounded-xl z-50 overflow-hidden shadow-gaming-card"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLocaleChange(lang.code)}
                    className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-[#212328]/10 transition-colors ${locale === lang.code ? "text-blue-400 bg-blue-500/10" : "text-zinc-300"}`}
                  >
                    {lang.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main navbar */}
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mr-8"
          >
            <Link href="/">
              <div className="font-black text-xl flex items-center">
                <span className="text-blue-400">Mali</span>
                <span className="text-white">Game</span>
                <span
                  className="bg-gaming-btn px-1.5 py-0.5 ml-1 text-sm text-white rounded"
                >
                  Pass
                </span>
              </div>
            </Link>
          </motion.div>

          <nav className="hidden lg:grid grid-cols-3 gap-4 items-center justify-items-center min-w-[400px]">
            <motion.div className="group relative" whileHover={{ y: -2 }}>
              <Link
                href="/card"
                className="px-2 py-1 text-sm text-zinc-300 uppercase inline-flex items-center hover:text-blue-400 font-bold transition-colors"
              >
                {t("gift_cards")} <ChevronDown className="ml-1 h-3 w-3" />
              </Link>
            </motion.div>
            <motion.div className="group relative" whileHover={{ y: -2 }}>
              <Link
                href="/games"
                className="px-2 py-1 text-sm text-zinc-300 uppercase inline-flex items-center hover:text-blue-400 font-bold transition-colors"
              >
                {t("direct_topup")} <ChevronDown className="ml-1 h-3 w-3" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ y: -2 }}>
              <Link
                href="/mobile-recharge"
                className="px-2 py-1 text-sm text-zinc-300 uppercase hover:text-blue-400 font-bold transition-colors"
              >
                {t("mobile_recharge")}
              </Link>
            </motion.div>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <motion.div className="relative w-64" whileHover={{ scale: 1.01 }}>
            <input
              type="text"
              placeholder={t("search_placeholder")}
              aria-label={t("search_placeholder")}
              autoComplete="off"
              className="w-full bg-neutral-900/70 border border-zinc-700/50 px-4 py-2 text-sm text-white rounded-lg focus:outline-none focus:border-blue-500 transition-all placeholder:text-zinc-500"
            />
            <Search
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
              aria-hidden="true"
            />
          </motion.div>

          <div className="flex items-center space-x-3">
            <motion.button
              type="button"
              aria-label={t("notifications")}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#212328]/10 transition-colors"
            >
              <Bell size={18} aria-hidden="true" />
            </motion.button>

            <motion.button
              type="button"
              aria-label={t("cart")}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#212328]/10 transition-colors relative"
            >
              <ShoppingCart size={18} aria-hidden="true" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </motion.button>

            {user ? (
              <div className="relative" ref={isMounted ? userMenuRef : null}>
                <motion.button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-white text-sm hover:text-zinc-300 font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    className="w-10 h-10 rounded-full border-2 border-zinc-600 flex items-center justify-center overflow-hidden"
                  >
                    <User className="h-5 w-5 text-zinc-400" />
                  </div>
                  <span className="hidden md:block">
                    {user.name?.split(" ")[0] || user.username || user.email}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </motion.button>

                <AnimatePresence>
                  {isMounted && showUserMenu && (
                    <motion.div
                      className="absolute right-0 mt-2 w-64 glass-card rounded-xl z-50 overflow-hidden shadow-gaming-card"
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <div className="p-4 border-b border-zinc-700/50 flex items-center">
                        <motion.div
                          className="h-10 w-10 rounded-full border-2 border-zinc-600 flex items-center justify-center mr-3 overflow-hidden"
                          whileHover={{ scale: 1.05 }}
                        >
                          <span className="text-white font-bold text-lg">
                            {(
                              user.name?.charAt(0) ||
                              user.username?.charAt(0) ||
                              user.email?.charAt(0) ||
                              "U"
                            ).toUpperCase()}
                          </span>
                        </motion.div>
                        <div>
                          <div className="font-bold text-white text-sm">
                            {user.name || user.username || user.email}
                          </div>
                          <div className="text-zinc-500 text-xs truncate">
                            {user.email}
                          </div>
                        </div>
                      </div>

                      <div className="py-2">
                        <Link
                          href="/dashboard/account"
                          className="block"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <motion.div
                            variants={menuItemVariants}
                            whileHover="hover"
                            className="w-full flex items-center px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-[#212328]/5 cursor-pointer rounded-lg"
                          >
                            <User className="h-4 w-4 mr-3" aria-hidden="true" />
                            <span>{t("my_account")}</span>
                          </motion.div>
                        </Link>

                        <Link
                          href="/dashboard/credits"
                          className="block"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <motion.div
                            variants={menuItemVariants}
                            whileHover="hover"
                            className="w-full flex items-center px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-[#212328]/5 cursor-pointer rounded-lg"
                          >
                            <Coins
                              className="h-4 w-4 mr-3"
                              aria-hidden="true"
                            />
                            <span>{t("credits")}</span>
                          </motion.div>
                        </Link>

                        <Link
                          href="/dashboard/orders"
                          className="block"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <motion.div
                            variants={menuItemVariants}
                            whileHover="hover"
                            className="w-full flex items-center px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-[#212328]/5 cursor-pointer rounded-lg"
                          >
                            <ShoppingCart
                              className="h-4 w-4 mr-3"
                              aria-hidden="true"
                            />
                            <span>{t("order_history")}</span>
                          </motion.div>
                        </Link>

                        <div className="border-t border-zinc-700/50 my-2" />

                        <motion.button
                          type="button"
                          variants={menuItemVariants}
                          whileHover="hover"
                          className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 font-bold rounded-lg"
                          onClick={handleLogout}
                        >
                          <LogOut className="h-4 w-4 mr-3" aria-hidden="true" />
                          <span>{t("logout")}</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button
                whileHover={{
                  scale: 1.05,
                  y: -2,
                }}
                whileTap={{ scale: 0.95 }}
                className="text-white text-sm px-5 py-2.5 font-bold rounded-lg bg-gaming-btn border border-blue-500 transition-all hover:shadow-gaming-btn"
                onClick={() =>
                  router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
                }
              >
                {t("login")}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
