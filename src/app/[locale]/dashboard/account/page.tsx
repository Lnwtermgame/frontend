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

  // Check if email is verified
  const isEmailVerified = user?.emailVerified ?? true; // Default to true if not provided (for backward compatibility)

  return (
    <div className="bg-transparent min-h-full">
      {/* Page Header */}
      <div className="relative mb-6">
        <motion.h2
          className="text-xl md:text-2xl font-bold text-white mb-2 relative flex items-center"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <span className="w-1.5 h-6 bg-site-accent mr-3 rounded-full shadow-accent-glow"></span>
          {t("title")}
        </motion.h2>
        <p className="text-gray-400 text-sm relative">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid gap-4">
        <div className="w-full">
          <div className="grid gap-6">
            {/* User profile */}
            <motion.div
              className="bg-[#222427] border border-site-border rounded-xl overflow-hidden relative shadow-ocean"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-center md:items-start text-center md:text-left gap-4">
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="relative">
                      <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-[#1A1C1E] border border-site-border flex items-center justify-center text-site-accent text-xl md:text-3xl font-bold overflow-hidden shadow-inner">
                        {user?.username?.charAt(0).toUpperCase() || "U"}
                      </div>
                    </div>
                    <div className="flex flex-col items-center md:items-start gap-1.5">
                      <h2 className="text-xl md:text-2xl font-bold text-white">
                        {user?.username || "User"}
                      </h2>
                      <div className="flex flex-col md:flex-row items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-sm">
                            {t("email_label")}
                          </span>
                          <span className="text-gray-200 text-sm font-medium">
                            {user?.email || "user@example.com"}
                          </span>
                        </div>
                        {isEmailVerified ? (
                          <span className="bg-green-500/10 text-green-400 text-xs font-bold px-2.5 py-1 rounded-md border border-green-500/30/20 flex items-center gap-1.5">
                            <CheckCircle size={12} />
                            {t("verified")}
                          </span>
                        ) : (
                          <span className="bg-red-500/10 text-red-400 text-xs font-bold px-2.5 py-1 rounded-md border border-red-500/30/20 flex items-center gap-1.5">
                            <AlertCircle size={12} />
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
                    className="mt-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30/20"
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                          <Mail size={16} className="text-red-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-red-400">
                            {t("verify_email_banner")}
                          </p>
                          <p className="text-xs text-red-400/70 mt-1">
                            {t("verify_email_desc")}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleSendVerificationEmail}
                        disabled={cooldownSeconds > 0 || isSendingVerification}
                        className={`
                          flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg border
                          transition-all duration-200 whitespace-nowrap md:w-auto w-full
                          ${cooldownSeconds > 0 || isSendingVerification
                            ? "bg-[#212328]/5 text-gray-400 border-white/10 cursor-not-allowed"
                            : "bg-red-500/20 text-red-400 border-red-500/30/30 hover:bg-red-500 hover:text-white hover:border-red-500/30 shadow-sm"
                          }
                        `}
                      >
                        {isSendingVerification ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            {t("sending")}
                          </>
                        ) : cooldownSeconds > 0 ? (
                          <>
                            <RefreshCw size={14} className="opacity-50" />
                            {t("wait_cooldown", { seconds: cooldownSeconds })}
                          </>
                        ) : (
                          <>
                            <Mail size={14} />
                            {t("send_verification")}
                          </>
                        )}
                      </button>
                    </div>
                    {cooldownSeconds > 0 && (
                      <p className="text-xs text-red-400/60 mt-2 text-center md:text-right">
                        {t("spam_hint")}
                      </p>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Order statistics */}
            <motion.div
              className="bg-[#222427] border border-site-border rounded-xl shadow-ocean overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-white flex items-center">
                    <span className="w-1.5 h-5 bg-site-accent mr-3 rounded-full shadow-accent-glow"></span>
                    {t("my_orders")}
                  </h2>
                  <Link
                    href="/dashboard/orders"
                    className="text-site-accent text-sm flex items-center hover:text-white transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-[#212328]/5"
                  >
                    {t("view_all_orders")} <ChevronRight size={16} className="ml-1" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="p-4 bg-[#1A1C1E] rounded-xl border border-site-border hover:border-site-accent/50 transition-colors group">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <History size={18} className="text-yellow-400" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                      {isLoading ? (
                        <Loader2 size={24} className="animate-spin mx-auto text-site-accent" />
                      ) : (
                        orderStats.waitSend
                      )}
                    </div>
                    <div className="text-gray-400 text-xs font-medium">{t("order_status.pending")}</div>
                  </div>
                  <div className="p-4 bg-[#1A1C1E] rounded-xl border border-site-border hover:border-site-accent/50 transition-colors group">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <History size={18} className="text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                      {isLoading ? (
                        <Loader2 size={24} className="animate-spin mx-auto text-site-accent" />
                      ) : (
                        orderStats.sending
                      )}
                    </div>
                    <div className="text-gray-400 text-xs font-medium">
                      {t("order_status.processing")}
                    </div>
                  </div>
                  <div className="p-4 bg-[#1A1C1E] rounded-xl border border-site-border hover:border-site-accent/50 transition-colors group">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <History size={18} className="text-green-400" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                      {isLoading ? (
                        <Loader2 size={24} className="animate-spin mx-auto text-site-accent" />
                      ) : (
                        orderStats.completed
                      )}
                    </div>
                    <div className="text-gray-400 text-xs font-medium">
                      {t("order_status.completed")}
                    </div>
                  </div>
                  <div className="p-4 bg-[#1A1C1E] rounded-xl border border-site-border hover:border-site-accent/50 transition-colors group">
                    <div className="w-10 h-10 rounded-lg bg-[#181A1D]0/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <History size={18} className="text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                      {isLoading ? (
                        <Loader2 size={24} className="animate-spin mx-auto text-site-accent" />
                      ) : (
                        orderStats.refunded
                      )}
                    </div>
                    <div className="text-gray-400 text-xs font-medium">
                      {t("order_status.refunded")}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Recently Purchased */}
            <motion.div
              className="bg-[#222427] border border-site-border rounded-xl shadow-ocean overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <div className="p-6">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center">
                  <span className="w-1.5 h-5 bg-purple-500 mr-3 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]"></span>
                  {t("recent_purchases")}
                </h2>
                {recentlyPurchased.length > 0 ? (
                  <div className="space-y-3">
                    {recentlyPurchased.map((item) => (
                      <motion.div
                        key={item.itemId}
                        className="flex items-center p-4 bg-[#1A1C1E] border border-site-border rounded-xl hover:bg-[#212328]/5 transition-colors group"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden mr-4 bg-[#16181A] flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white text-sm truncate">{item.name}</h3>
                          <p className="text-xs text-site-accent mt-1">
                            {item.amount}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4 flex-shrink-0">
                          <motion.button
                            className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500 hover:bg-yellow-500 hover:text-white transition-colors border border-yellow-500/30/20 hover:border-transparent"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            title="Favorite"
                          >
                            <Star size={14} />
                          </motion.button>
                          <Link
                            href={`/dashboard/orders/${item.id}`}
                            className="w-8 h-8 rounded-lg bg-site-accent/10 flex items-center justify-center text-site-accent hover:bg-site-accent hover:text-[#1A1C1E] transition-colors border border-site-accent/20 hover:border-transparent"
                            title="View Details"
                          >
                            <ChevronRight size={14} />
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#1A1C1E] rounded-xl text-gray-400 text-center py-10 border border-site-border">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#212328]/5 flex items-center justify-center">
                      <History size={24} className="text-gray-500" />
                    </div>
                    <p className="text-sm font-medium">{t("no_recent_purchases")}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
