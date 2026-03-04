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
      backgroundColor: "#F9FAFB",
      color: "#000000",
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

  return (
    <motion.header
      className="w-full bg-white border-b-[3px] border-black"
      style={{ boxShadow: "0 2px 0 0 rgba(0,0,0,0.05)" }}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Top navbar with secondary links */}
      <div className="container mx-auto flex items-center justify-between px-4 py-2 border-b border-gray-200 text-xs text-gray-600">
        <div className="flex items-center space-x-6">
          <motion.div whileHover={{ opacity: 1 }} initial={{ opacity: 0.8 }}>
            <Link
              href="/news"
              className="text-xs font-medium hover:text-black transition-colors"
            >
              {t("news")}
            </Link>
          </motion.div>
          <motion.div whileHover={{ opacity: 1 }} initial={{ opacity: 0.8 }}>
            <Link
              href="/support"
              className="text-xs font-medium hover:text-black transition-colors"
            >
              {t("contact_us")}
            </Link>
          </motion.div>
          <motion.div whileHover={{ opacity: 1 }} initial={{ opacity: 0.8 }}>
            <Link
              href="/games"
              className="text-xs font-medium hover:text-black transition-colors"
            >
              {t("all_games")}
            </Link>
          </motion.div>
        </div>
        <div className="flex items-center space-x-4 relative" ref={langMenuRef}>
          <button
            type="button"
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center space-x-1 hover:opacity-100 opacity-80 transition-opacity uppercase font-bold text-black"
          >
            <Languages className="h-3 w-3 mr-1" aria-hidden="true" />
            <span className="text-xs">{locale}</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${showLangMenu ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>

          <AnimatePresence>
            {showLangMenu && (
              <motion.div
                className="absolute right-0 top-full mt-2 w-32 bg-white border-[3px] border-black z-50 overflow-hidden shadow-[4px_4px_0_0_#000]"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {[
                  { code: "en", label: "English" },
                  { code: "th", label: "ไทย" },
                  { code: "zh", label: "中文" },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLocaleChange(lang.code)}
                    className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-100 transition-colors ${locale === lang.code ? "text-brutal-pink bg-pink-50" : "text-black"}`}
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
                <span className="text-brutal-pink">Mali</span>
                <span className="text-black">Game</span>
                <span
                  className="bg-brutal-yellow px-1.5 py-0.5 ml-1 border-[2px] border-black text-sm"
                  style={{ boxShadow: "2px 2px 0 0 #000000" }}
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
                className="px-2 py-1 text-sm text-black uppercase inline-flex items-center hover:text-brutal-pink font-bold transition-colors"
              >
                {t("gift_cards")} <ChevronDown className="ml-1 h-3 w-3" />
              </Link>
            </motion.div>
            <motion.div className="group relative" whileHover={{ y: -2 }}>
              <Link
                href="/games"
                className="px-2 py-1 text-sm text-black uppercase inline-flex items-center hover:text-brutal-pink font-bold transition-colors"
              >
                {t("direct_topup")} <ChevronDown className="ml-1 h-3 w-3" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ y: -2 }}>
              <Link
                href="/mobile-recharge"
                className="px-2 py-1 text-sm text-black uppercase hover:text-brutal-pink font-bold transition-colors"
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
              className="w-full bg-white border-[2px] border-gray-300 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:border-black transition-all"
            />
            <Search
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
          </motion.div>

          <div className="flex items-center space-x-3">
            <motion.button
              type="button"
              aria-label={t("notifications")}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 bg-brutal-gray border-[2px] border-black flex items-center justify-center text-black hover:bg-brutal-yellow transition-colors"
              style={{ boxShadow: "2px 2px 0 0 #000000" }}
            >
              <Bell size={18} aria-hidden="true" />
            </motion.button>

            <motion.button
              type="button"
              aria-label={t("cart")}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 bg-brutal-gray border-[2px] border-black flex items-center justify-center text-black hover:bg-brutal-green transition-colors relative"
              style={{ boxShadow: "2px 2px 0 0 #000000" }}
            >
              <ShoppingCart size={18} aria-hidden="true" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brutal-pink text-white text-xs font-bold rounded-full flex items-center justify-center border-[2px] border-black">
                  {cartItemCount}
                </span>
              )}
            </motion.button>

            {user ? (
              <div className="relative" ref={isMounted ? userMenuRef : null}>
                <motion.button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-black text-sm hover:text-gray-700 font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    className="w-10 h-10 bg-brutal-yellow border-[2px] border-black flex items-center justify-center"
                    style={{ boxShadow: "2px 2px 0 0 #000000" }}
                  >
                    <User className="h-5 w-5 text-black" />
                  </div>
                  <span className="hidden md:block">
                    {user.name?.split(" ")[0] || user.username || user.email}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </motion.button>

                <AnimatePresence>
                  {isMounted && showUserMenu && (
                    <motion.div
                      className="absolute right-0 mt-2 w-64 bg-white border-[3px] border-black z-50 overflow-hidden"
                      style={{ boxShadow: "4px 4px 0 0 #000000" }}
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <div className="p-4 border-b-[2px] border-gray-200 flex items-center bg-gray-50">
                        <motion.div
                          className="h-10 w-10 bg-brutal-yellow border-[2px] border-black flex items-center justify-center mr-3"
                          style={{ boxShadow: "2px 2px 0 0 #000000" }}
                          whileHover={{ scale: 1.05 }}
                        >
                          <span className="text-black font-bold text-lg">
                            {(
                              user.name?.charAt(0) ||
                              user.username?.charAt(0) ||
                              user.email?.charAt(0) ||
                              "U"
                            ).toUpperCase()}
                          </span>
                        </motion.div>
                        <div>
                          <div className="font-bold text-black text-sm">
                            {user.name || user.username || user.email}
                          </div>
                          <div className="text-gray-500 text-xs truncate">
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
                            className="w-full flex items-center px-4 py-2 text-sm text-gray-600 hover:text-black cursor-pointer"
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
                            className="w-full flex items-center px-4 py-2 text-sm text-gray-600 hover:text-black cursor-pointer"
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
                            className="w-full flex items-center px-4 py-2 text-sm text-gray-600 hover:text-black cursor-pointer"
                          >
                            <ShoppingCart
                              className="h-4 w-4 mr-3"
                              aria-hidden="true"
                            />
                            <span>{t("order_history")}</span>
                          </motion.div>
                        </Link>

                        <div className="border-t border-gray-200 my-2" />

                        <motion.button
                          type="button"
                          variants={menuItemVariants}
                          whileHover="hover"
                          className="w-full flex items-center px-4 py-2 text-sm text-brutal-pink hover:text-brutal-pink/80 font-bold"
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
                  boxShadow: "4px 4px 0 0 #000000",
                }}
                whileTap={{ scale: 0.95 }}
                className="bg-black text-white text-sm px-5 py-2.5 border-[3px] border-black font-bold"
                style={{ boxShadow: "3px 3px 0 0 #000000" }}
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
