"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Search,
  ChevronDown,
  Download,
  User,
  LogOut,
  FileText,
  CreditCard,
  DollarSign,
  Coins,
  Ticket,
  Star,
  Heart,
  Gift,
  Bell,
  Globe,
  Languages
} from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { useCart } from "@/lib/hooks/use-cart";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "@/lib/framer-exports";

export function Header() {
  const { user, logout } = useAuth();
  const { getTotalItems } = useCart();
  const cartItemCount = getTotalItems();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    if (isMounted) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMounted]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    router.push("/");
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
        damping: 30
      }
    },
    hover: {
      backgroundColor: "#1e2959",
      color: "#ffffff",
      transition: { duration: 0.2 }
    }
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
        staggerChildren: 0.05
      }
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.header
      className="w-full bg-mali-navy border-b border-mali-blue/20"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Top navbar with secondary links */}
      <div className="container mx-auto flex items-center justify-between px-4 py-1 border-b border-mali-blue/10 text-xs text-mali-text-secondary">
        <div className="flex items-center space-x-6">
          <motion.div whileHover={{ opacity: 1 }} initial={{ opacity: 0.8 }}>
            <Link href="/" className="text-xs font-normal">News</Link>
          </motion.div>
          <motion.div whileHover={{ opacity: 1 }} initial={{ opacity: 0.8 }}>
            <Link href="/" className="text-xs font-normal">Contact Support</Link>
          </motion.div>
          <motion.div whileHover={{ opacity: 1 }} initial={{ opacity: 0.8 }}>
            <Link href="/" className="text-xs font-normal">All Games</Link>
          </motion.div>
        </div>
        <div className="flex items-center space-x-4">
          <motion.div
            className="flex items-center space-x-1 cursor-pointer"
            whileHover={{ opacity: 1 }}
            initial={{ opacity: 0.8 }}
          >
            <span className="text-xs">EN</span>
            <ChevronDown className="h-3 w-3" />
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center text-xs"
          >
            <Languages className="h-3 w-3 mr-1" />
            <span className="text-white">ไทย</span>
          </motion.div>
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
              <span className="text-xl font-bold"><span className="text-blue-500">Mali</span><span className="text-white">GamePass</span></span>
            </Link>
          </motion.div>

          <nav className="hidden lg:grid grid-cols-3 gap-4 items-center justify-items-center min-w-[400px]">
            <motion.div
              className="group relative"
              whileHover={{ y: -2 }}
            >
              <Link href="/card" className="px-2 py-1 text-sm text-white uppercase inline-flex items-center hover:text-gray-300">
                CARD <ChevronDown className="ml-1 h-3 w-3" />
              </Link>
            </motion.div>
            <motion.div
              className="group relative"
              whileHover={{ y: -2 }}
            >
              <Link href="/direct-topup" className="px-2 py-1 text-sm text-white uppercase inline-flex items-center hover:text-gray-300">
                DIRECT TOP-UP <ChevronDown className="ml-1 h-3 w-3" />
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ y: -2 }}
            >
              <Link href="/mobile-recharge" className="px-2 py-1 text-sm text-white uppercase hover:text-gray-300">
                MOBILE RECHARGE
              </Link>
            </motion.div>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <motion.div
            className="relative w-64"
            whileHover={{ scale: 1.02 }}
          >
            <input
              type="text"
              placeholder="Search Games"
              className="w-full rounded-sm bg-mali-blue/20 border border-mali-blue/30 px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-mali-blue-accent"
            />
            <Search className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mali-text-secondary" />
          </motion.div>

          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="text-mali-text-secondary hover:text-white transition-colors"
            >
              <Bell size={20} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              className="text-mali-text-secondary hover:text-white transition-colors"
            >
              <Globe size={20} />
            </motion.button>

            {user ? (
              <div className="relative" ref={isMounted ? userMenuRef : null}>
                <motion.button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-1 text-white text-xs hover:text-gray-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <User className="h-5 w-5" />
                  <span>{user.name.split(' ')[0]}</span>
                  <ChevronDown className="h-3 w-3" />
                </motion.button>

                <AnimatePresence>
                  {isMounted && showUserMenu && (
                    <motion.div
                      className="absolute right-0 mt-2 w-64 bg-mali-card border border-mali-blue/20 rounded-md shadow-lg z-50"
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <div className="p-4 border-b border-mali-blue/20 flex items-center">
                        <motion.div
                          className="h-10 w-10 rounded-full bg-mali-blue-accent flex items-center justify-center mr-3 shadow-lg"
                          whileHover={{ scale: 1.1 }}
                        >
                          <span className="text-white font-bold text-lg">{user.name.charAt(0).toUpperCase()}</span>
                        </motion.div>
                        <div>
                          <div className="font-medium text-white text-sm">{user.name}</div>
                          <div className="text-mali-text-secondary text-xs truncate">{user.email}</div>
                        </div>
                      </div>

                      <div className="py-2">
                        <motion.button
                          variants={menuItemVariants}
                          whileHover="hover"
                          className="w-full flex items-center px-4 py-2 text-xs text-mali-text-secondary hover:text-white"
                          onClick={() => {
                            setShowUserMenu(false);
                            router.push('/dashboard/account');
                          }}
                        >
                          <User className="h-4 w-4 mr-3" />
                          <span>My Account</span>
                        </motion.button>

                        <motion.button
                          variants={menuItemVariants}
                          whileHover="hover"
                          className="w-full flex items-center px-4 py-2 text-xs text-mali-text-secondary hover:text-white"
                          onClick={() => {
                            setShowUserMenu(false);
                            router.push('/dashboard/credits');
                          }}
                        >
                          <Coins className="h-4 w-4 mr-3" />
                          <span>Credits</span>
                        </motion.button>

                        <motion.button
                          variants={menuItemVariants}
                          whileHover="hover"
                          className="w-full flex items-center px-4 py-2 text-xs text-mali-text-secondary hover:text-white"
                          onClick={() => {
                            setShowUserMenu(false);
                            router.push('/dashboard/orders');
                          }}
                        >
                          <ShoppingCart className="h-4 w-4 mr-3" />
                          <span>Order History</span>
                        </motion.button>

                        <motion.button
                          variants={menuItemVariants}
                          whileHover="hover"
                          className="w-full flex items-center px-4 py-2 text-xs text-mali-text-secondary hover:text-white"
                          onClick={handleLogout}
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          <span>Logout</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-button-gradient text-white text-sm px-4 py-1.5 rounded-md shadow-md"
                onClick={() => router.push('/login')}
              >
                เข้าระบบ
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
} 
