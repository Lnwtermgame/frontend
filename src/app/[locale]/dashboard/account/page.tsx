"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Star,
  Shield,
  History,
  Loader2,
  Mail,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { motion } from "@/lib/framer-exports";
import { orderApi, Order } from "@/lib/services/order-api";
import { securityApi } from "@/lib/services/security-api";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

// Cooldown time in seconds for resend verification email
const RESEND_COOLDOWN_SECONDS = 60;

export default function AccountPage() {
  const t = useTranslations("Account");
  const { user, isInitialized } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load cooldown from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedCooldownEnd = localStorage.getItem(
        "verification_cooldown_end",
      );
      if (storedCooldownEnd) {
        const endTime = parseInt(storedCooldownEnd, 10);
        const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        if (remaining > 0) {
          setCooldownSeconds(remaining);
        } else {
          localStorage.removeItem("verification_cooldown_end");
        }
      }
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        const newValue = prev - 1;
        if (newValue <= 0) {
          localStorage.removeItem("verification_cooldown_end");
        }
        return Math.max(0, newValue);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  useEffect(() => {
    if (isInitialized && user) {
      fetchOrders();
    }
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [isInitialized, user]);

  const fetchOrders = async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    try {
      const response = await orderApi.getOrders(
        1,
        50,
        undefined,
        controller.signal,
      );
      if (response.success) {
        setOrders(response.data);
      }
    } catch (error: any) {
      if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") {
        console.log("[Account] Failed to fetch orders");
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  const handleSendVerificationEmail = async () => {
    if (cooldownSeconds > 0 || isSendingVerification) return;

    setIsSendingVerification(true);
    try {
      const response = await securityApi.sendVerificationEmail();
      if (response.success) {
        toast.success(t("verification_sent"));

        // Set cooldown
        const endTime = Date.now() + RESEND_COOLDOWN_SECONDS * 1000;
        localStorage.setItem("verification_cooldown_end", endTime.toString());
        setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
      } else {
        toast.error(response.message || t("send_failed"));
      }
    } catch (error: any) {
      const message = securityApi.getErrorMessage(error);
      toast.error(message);
    } finally {
      setIsSendingVerification(false);
    }
  };

  const orderStats = {
    waitSend: orders.filter((o) => o.status === "PENDING").length,
    sending: orders.filter((o) => o.status === "PROCESSING").length,
    completed: orders.filter((o) => o.status === "COMPLETED").length,
    refunded: orders.filter((o) => o.status === "REFUNDED").length,
  };

  const recentlyPurchased = orders
    .filter((o) => o.status === "COMPLETED")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .flatMap((order) =>
      order.items.map((item) => ({
        id: order.id,
        itemId: item.id,
        name: item.product?.name || item.productName || "Product",
        amount: item.productType?.name || `${item.quantity} items`,
        image:
          item.product?.imageUrl ||
          "https://placehold.co/60x60/5C3FC9/white?text=Game",
      })),
    )
    .slice(0, 5);

  const accountLinks = [
    {
      icon: <Shield size={18} />,
      label: t("security"),
      href: "/dashboard/account/security",
    },
  ];

  // Check if email is verified
  const isEmailVerified = user?.emailVerified ?? true; // Default to true if not provided (for backward compatibility)

  return (
    <div className="bg-transparent min-h-full">
      {/* Page Header */}
      <div className="relative mb-4">
        <motion.h2
          className="text-lg font-bold text-black mb-1 relative flex items-center"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <span className="w-1.5 h-4 bg-brutal-pink mr-2"></span>
          {t("title")}
        </motion.h2>
        <p className="text-gray-600 text-xs relative">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="grid gap-4">
            {/* User profile - Enhanced with gradient border */}
            <motion.div
              className="bg-white border-[3px] border-black overflow-hidden relative"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -2 }}
            >
              <div className="p-4">
                <div className="flex flex-col md:flex-row justify-between items-center md:items-start text-center md:text-left gap-3">
                  <div className="flex flex-col md:flex-row items-center gap-3">
                    <div className="relative">
                      <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-brutal-yellow border-[3px] border-black flex items-center justify-center text-black text-lg md:text-xl font-bold overflow-hidden shadow-[2px_2px_0_0_#000]">
                        {user?.username?.charAt(0).toUpperCase() || "U"}
                      </div>
                    </div>
                    <div className="flex flex-col items-center md:items-start gap-1">
                      <h2 className="text-lg md:text-xl font-bold text-black">
                        {user?.username || "User"}
                      </h2>
                      <div className="flex flex-col md:flex-row items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 text-xs">
                            {t("email_label")}
                          </span>
                          <span className="text-gray-900 text-xs font-medium">
                            {user?.email || "user@example.com"}
                          </span>
                        </div>
                        {isEmailVerified ? (
                          <span className="bg-brutal-green text-black text-[10px] font-bold px-2 py-0.5 border-[2px] border-black flex items-center gap-1">
                            <CheckCircle size={10} />
                            {t("verified")}
                          </span>
                        ) : (
                          <span className="bg-brutal-pink text-black text-[10px] font-bold px-2 py-0.5 border-[2px] border-black flex items-center gap-1">
                            <AlertCircle size={10} />
                            {t("not_verified")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email verification banner - shown if not verified */}
                {!isEmailVerified && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 p-3 bg-brutal-pink/20 border-[2px] border-black"
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 bg-brutal-yellow border-[2px] border-black flex items-center justify-center flex-shrink-0">
                          <Mail size={14} className="text-black" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-black">
                            {t("verify_email_banner")}
                          </p>
                          <p className="text-[10px] text-gray-600 mt-0.5">
                            {t("verify_email_desc")}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleSendVerificationEmail}
                        disabled={cooldownSeconds > 0 || isSendingVerification}
                        className={`
                          flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border-[2px] border-black
                          transition-all duration-200 whitespace-nowrap
                          ${cooldownSeconds > 0 || isSendingVerification
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-brutal-yellow text-black hover:bg-brutal-blue hover:text-white"
                          }
                        `}
                      >
                        {isSendingVerification ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            {t("sending")}
                          </>
                        ) : cooldownSeconds > 0 ? (
                          <>
                            <RefreshCw size={12} className="opacity-50" />
                            {t("wait_cooldown", { seconds: cooldownSeconds })}
                          </>
                        ) : (
                          <>
                            <Mail size={12} />
                            {t("send_verification")}
                          </>
                        )}
                      </button>
                    </div>
                    {cooldownSeconds > 0 && (
                      <p className="text-[10px] text-gray-500 mt-1 text-center md:text-right">
                        {t("spam_hint")}
                      </p>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Order statistics - Enhanced with icons and better styling */}
            <motion.div
              className="bg-white border-[3px] border-black"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              whileHover={{ y: -2 }}
            >
              <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-base font-bold text-black flex items-center">
                    <span className="w-1.5 h-4 bg-brutal-blue mr-2"></span>
                    {t("my_orders")}
                  </h2>
                  <Link
                    href="/dashboard/orders"
                    className="text-black text-xs flex items-center hover:underline font-medium"
                  >
                    {t("view_all_orders")} <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-gray-50 border-[2px] border-black hover:bg-brutal-yellow/20 transition-colors">
                    <div className="bg-brutal-blue w-8 h-8 border-[2px] border-black flex items-center justify-center mx-auto mb-1.5">
                      <History size={16} className="text-black" />
                    </div>
                    <div className="text-xl font-bold text-black">
                      {isLoading ? (
                        <Loader2 size={16} className="animate-spin mx-auto" />
                      ) : (
                        orderStats.waitSend
                      )}
                    </div>
                    <div className="text-gray-600 text-xs">{t("order_status.pending")}</div>
                  </div>
                  <div className="p-3 bg-gray-50 border-[2px] border-black hover:bg-brutal-yellow/20 transition-colors">
                    <div className="bg-brutal-blue w-8 h-8 border-[2px] border-black flex items-center justify-center mx-auto mb-1.5">
                      <History size={16} className="text-black" />
                    </div>
                    <div className="text-xl font-bold text-black">
                      {isLoading ? (
                        <Loader2 size={16} className="animate-spin mx-auto" />
                      ) : (
                        orderStats.sending
                      )}
                    </div>
                    <div className="text-gray-600 text-xs">
                      {t("order_status.processing")}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 border-[2px] border-black hover:bg-brutal-yellow/20 transition-colors">
                    <div className="bg-brutal-green w-8 h-8 border-[2px] border-black flex items-center justify-center mx-auto mb-1.5">
                      <History size={16} className="text-black" />
                    </div>
                    <div className="text-xl font-bold text-black">
                      {isLoading ? (
                        <Loader2 size={16} className="animate-spin mx-auto" />
                      ) : (
                        orderStats.completed
                      )}
                    </div>
                    <div className="text-gray-600 text-xs">
                      {t("order_status.completed")}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 border-[2px] border-black hover:bg-brutal-yellow/20 transition-colors">
                    <div className="bg-gray-200 w-8 h-8 border-[2px] border-black flex items-center justify-center mx-auto mb-1.5">
                      <History size={16} className="text-gray-600" />
                    </div>
                    <div className="text-xl font-bold text-black">
                      {isLoading ? (
                        <Loader2 size={16} className="animate-spin mx-auto" />
                      ) : (
                        orderStats.refunded
                      )}
                    </div>
                    <div className="text-gray-600 text-xs">
                      {t("order_status.refunded")}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Recently Purchased - Enhanced with animation and styling */}
            <motion.div
              className="bg-white border-[3px] border-black"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              whileHover={{ y: -2 }}
            >
              <div className="p-4">
                <h2 className="text-base font-bold text-black mb-3 flex items-center">
                  <span className="w-1.5 h-4 bg-brutal-green mr-2"></span>
                  {t("recent_purchases")}
                </h2>
                {recentlyPurchased.length > 0 ? (
                  <div className="space-y-2">
                    {recentlyPurchased.map((item) => (
                      <motion.div
                        key={item.itemId}
                        className="flex items-center p-3 bg-gray-50 border-[2px] border-black hover:bg-brutal-yellow/10 transition-colors"
                        whileHover={{ x: 2 }}
                      >
                        <div className="w-10 h-10 border-[2px] border-black overflow-hidden mr-3 bg-white">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-bold text-black text-sm">{item.name}</h3>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {item.amount}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-auto">
                          <motion.button
                            className="bg-brutal-yellow border-[2px] border-black w-7 h-7 flex items-center justify-center text-black hover:bg-brutal-pink transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Star size={14} />
                          </motion.button>
                          <Link
                            href={`/dashboard/orders/${item.id}`}
                            className="bg-black border-[2px] border-black w-7 h-7 flex items-center justify-center text-white hover:bg-gray-800 transition-colors"
                          >
                            <ChevronRight size={14} />
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-100 text-gray-600 text-center py-6 border-[2px] border-black">
                    <div className="w-12 h-12 mx-auto mb-2 bg-brutal-blue border-[2px] border-black flex items-center justify-center">
                      <History size={20} className="text-black" />
                    </div>
                    <p className="text-sm">{t("no_recent_purchases")}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="grid gap-4">
            {/* Account Links - New section */}
            <motion.div
              className="bg-white border-[3px] border-black"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              whileHover={{ y: -2 }}
            >
              <div className="p-4">
                <h2 className="text-base font-bold text-black mb-3 flex items-center">
                  <span className="w-1.5 h-4 bg-brutal-yellow mr-2"></span>
                  {t("account_settings")}
                </h2>
                <div className="divide-y divide-gray-200">
                  {accountLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center py-2.5 text-gray-600 hover:text-black transition-colors"
                    >
                      <div className="w-7 h-7 bg-brutal-blue border-[2px] border-black flex items-center justify-center text-black mr-3">
                        {link.icon}
                      </div>
                      <span className="font-medium text-sm">{link.label}</span>
                      <ChevronRight size={14} className="ml-auto" />
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
