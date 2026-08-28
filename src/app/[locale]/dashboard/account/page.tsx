"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Star,
  History,
  Mail,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { orderApi, Order } from "@/lib/services/order-api";
import { securityApi } from "@/lib/services/security-api";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

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
      <SectionHeader level={1} title={t("title")} sublabel={t("subtitle")} />

      <div className="grid gap-4">
        <div className="w-full">
          <div className="grid gap-6">
            {/* User profile */}
            <div className="site-card p-6">
              <div className="flex flex-col md:flex-row justify-between items-center md:items-start text-center md:text-left gap-4">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="relative">
                    <div className="h-16 w-16 md:h-20 md:w-20 rounded-8 bg-site-raised border border-site-border-soft flex items-center justify-center text-site-accent text-xl md:text-3xl font-bold overflow-hidden">
                      {user?.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                  </div>
                  <div className="flex flex-col items-center md:items-start gap-1.5">
                    <h2 className="text-xl md:text-2xl font-bold text-site-text">
                      {user?.username || "User"}
                    </h2>
                    <div className="flex flex-col md:flex-row items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-site-muted text-sm">
                          {t("email_label")}
                        </span>
                        <span className="text-site-text text-sm font-medium">
                          {user?.email || "user@example.com"}
                        </span>
                      </div>
                      {isEmailVerified ? (
                        <Badge variant="success">
                          <CheckCircle size={12} />
                          {t("verified")}
                        </Badge>
                      ) : (
                        <Badge variant="danger">
                          <AlertCircle size={12} />
                          {t("not_verified")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Email verification banner - shown if not verified */}
              {!isEmailVerified && (
                <div className="mt-5 p-4 rounded-8 bg-status-danger/10 border border-status-danger/20">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-6 bg-status-danger/20 flex items-center justify-center flex-shrink-0">
                        <Mail size={16} className="text-status-danger" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-status-danger">
                          {t("verify_email_banner")}
                        </p>
                        <p className="text-xs text-status-danger/70 mt-1">
                          {t("verify_email_desc")}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleSendVerificationEmail}
                      disabled={cooldownSeconds > 0 || isSendingVerification}
                      className={`
                        flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-6 border
                        transition-colors whitespace-nowrap md:w-auto w-full
                        ${cooldownSeconds > 0 || isSendingVerification
                          ? "bg-site-raised text-site-muted border-site-border-soft cursor-not-allowed"
                          : "bg-status-danger/20 text-status-danger border-status-danger/20 hover:bg-status-danger hover:text-site-bg hover:border-status-danger/20"
                        }
                      `}
                    >
                      {isSendingVerification ? (
                        <>
                          <RefreshCw size={14} className="opacity-50" />
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
                    <p className="text-xs text-status-danger/60 mt-2 text-center md:text-right">
                      {t("spam_hint")}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Order statistics */}
            <div className="site-card p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-base font-bold text-site-text flex items-center">
                  {t("my_orders")}
                </h2>
                <Link
                  href="/dashboard/orders"
                  className="text-site-accent text-xs flex items-center hover:text-site-text transition-colors font-medium px-2 py-1 rounded-6 hover:bg-site-raised"
                >
                  {t("view_all_orders")} <ChevronRight size={14} className="ml-1" />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="site-card p-4">
                  <div className="w-9 h-9 rounded-6 bg-status-warning/10 flex items-center justify-center mx-auto mb-3">
                    <History size={16} className="text-status-warning" />
                  </div>
                  <div className="text-xl font-black text-site-text mb-1">
                    {isLoading ? (
                      <Skeleton className="h-6 w-8 mx-auto" />
                    ) : (
                      orderStats.waitSend
                    )}
                  </div>
                  <div className="text-[11px] uppercase text-site-dim font-medium">{t("order_status.pending")}</div>
                </div>
                <div className="site-card p-4">
                  <div className="w-9 h-9 rounded-6 bg-status-info/10 flex items-center justify-center mx-auto mb-3">
                    <History size={16} className="text-status-info" />
                  </div>
                  <div className="text-xl font-black text-site-text mb-1">
                    {isLoading ? (
                      <Skeleton className="h-6 w-8 mx-auto" />
                    ) : (
                      orderStats.sending
                    )}
                  </div>
                  <div className="text-[11px] uppercase text-site-dim font-medium">
                    {t("order_status.processing")}
                  </div>
                </div>
                <div className="site-card p-4">
                  <div className="w-9 h-9 rounded-6 bg-status-success/10 flex items-center justify-center mx-auto mb-3">
                    <History size={16} className="text-status-success" />
                  </div>
                  <div className="text-xl font-black text-site-text mb-1">
                    {isLoading ? (
                      <Skeleton className="h-6 w-8 mx-auto" />
                    ) : (
                      orderStats.completed
                    )}
                  </div>
                  <div className="text-[11px] uppercase text-site-dim font-medium">
                    {t("order_status.completed")}
                  </div>
                </div>
                <div className="site-card p-4">
                  <div className="w-9 h-9 rounded-6 bg-site-raised flex items-center justify-center mx-auto mb-3">
                    <History size={16} className="text-site-muted" />
                  </div>
                  <div className="text-xl font-black text-site-text mb-1">
                    {isLoading ? (
                      <Skeleton className="h-6 w-8 mx-auto" />
                    ) : (
                      orderStats.refunded
                    )}
                  </div>
                  <div className="text-[11px] uppercase text-site-dim font-medium">
                    {t("order_status.refunded")}
                  </div>
                </div>
              </div>
            </div>

            {/* Recently Purchased */}
            <div className="site-card p-6">
              <h2 className="text-base font-bold text-site-text mb-6">
                {t("recent_purchases")}
              </h2>
              {recentlyPurchased.length > 0 ? (
                <div className="space-y-0">
                  {recentlyPurchased.map((item) => (
                    <div
                      key={item.itemId}
                      className="flex items-center p-3 border-b border-site-border-soft last:border-b-0 hover:bg-site-raised transition-colors rounded-6"
                    >
                      <div className="w-10 h-10 rounded-6 overflow-hidden mr-3 bg-site-raised flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-site-text text-sm truncate">{item.name}</h3>
                        <p className="text-xs text-site-accent mt-0.5">
                          {item.amount}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-3 flex-shrink-0">
                        <button
                          className="w-7 h-7 rounded-6 bg-status-warning/10 flex items-center justify-center text-status-warning hover:bg-status-warning hover:text-site-bg transition-colors border border-status-warning/20 hover:border-transparent"
                          title="Favorite"
                        >
                          <Star size={12} />
                        </button>
                        <Link
                          href={`/dashboard/orders/${item.id}`}
                          className="w-7 h-7 rounded-6 bg-site-accent/10 flex items-center justify-center text-site-accent hover:bg-site-accent hover:text-site-bg transition-colors border border-site-accent/20 hover:border-transparent"
                          title="View Details"
                        >
                          <ChevronRight size={12} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={History} message={t("no_recent_purchases")} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
