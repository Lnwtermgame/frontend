"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { useNotifications } from "@/lib/context/notification-context";
import { notificationApi, Notification } from "@/lib/services/notification-api";
import {
  Bell,
  Check,
  Clock,
  Info,
  AlertTriangle,
  Gift,
  Tag,
  CheckCircle,
  Trash2,
  ShoppingBag,
  CreditCard,
  Megaphone,
  Wifi,
  WifiOff,
} from "lucide-react";
import { motion, AnimatePresence } from "@/lib/framer-exports";
import toast from "react-hot-toast";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function NotificationsPage() {
  const t = useTranslations("Notifications");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const pathname = usePathname();
  const { user, isInitialized } = useAuth();
  const { isWebSocketConnected } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch notifications from API
  useEffect(() => {
    if (isInitialized && user) {
      fetchNotifications();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isInitialized, user]);

  const fetchNotifications = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    try {
      const response = await notificationApi.getNotifications(
        1,
        50,
        false,
        controller.signal,
      );
      if (response.success) {
        setNotifications(response.data);
        setUnreadCount(response.unreadCount || 0);
      }
    } catch (error: any) {
      if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") {
        toast.error(t("error_loading"));
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  // If not logged in, redirect to login page
  useEffect(() => {
    if (isInitialized && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, router, isInitialized, pathname]);

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await notificationApi.markAllAsRead();
      if (response.success) {
        toast.success(t("mark_read_success"));
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, isRead: true })),
        );
        setUnreadCount(0);
      }
    } catch (error) {
      toast.error(tCommon("error_occurred") || "Could not mark as read");
    }
  };

  // Mark single as read
  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await notificationApi.markAsRead(id);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === id ? { ...notif, isRead: true } : notif,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      toast.error(tCommon("error_occurred") || "Could not mark as read");
    }
  };

  // Delete notification
  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await notificationApi.deleteNotification(id);
      if (response.success) {
        toast.success(t("delete_success"));
        const deletedNotif = notifications.find((n) => n.id === id);
        setNotifications((prev) => prev.filter((notif) => notif.id !== id));
        if (deletedNotif && !deletedNotif.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      toast.error(tCommon("error_occurred") || "Could not delete notification");
    }
  };

  // Filter notifications
  const filteredNotifications =
    filter === "all"
      ? notifications
      : filter === "unread"
        ? notifications.filter((n) => !n.isRead)
        : notifications.filter((n) => {
          if (filter === "order") return n.type === "ORDER";
          if (filter === "payment") return n.type === "PAYMENT";
          if (filter === "promotion") return n.type === "PROMOTION";
          if (filter === "system") return n.type === "SYSTEM";
          return true;
        });

  // Get notification link based on type and data
  const getNotificationLink = (notification: Notification): string => {
    if (notification.data?.orderId) {
      return `/dashboard/orders/${notification.data.orderId}`;
    }
    if (notification.data?.link) {
      return notification.data.link;
    }
    return "#";
  };

  // Helper to render icon based on type
  const renderIcon = (type: string) => {
    switch (type) {
      case "ORDER":
        return <ShoppingBag className="text-blue-500" size={16} />;
      case "PAYMENT":
        return <CreditCard className="text-green-500" size={16} />;
      case "PROMOTION":
        return <Megaphone className="text-[var(--site-accent)]" size={16} />;
      case "SYSTEM":
        return <Info className="text-yellow-500" size={16} />;
      default:
        return <Bell className="text-gray-400" size={16} />;
    }
  };

  // Helper for background color based on type
  const getIconBg = (type: string) => {
    switch (type) {
      case "ORDER":
        return "bg-blue-500/10 border border-blue-500/20";
      case "PAYMENT":
        return "bg-green-500/10 border border-green-500/30/20";
      case "PROMOTION":
        return "bg-[var(--site-accent)]/10 border border-[var(--site-accent)]/20";
      case "SYSTEM":
        return "bg-yellow-500/10 border border-yellow-500/30/20";
      default:
        return "bg-[#1A1C1E] border border-site-border";
    }
  };

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#222427] border-t-[var(--site-accent)] rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400 font-medium">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="relative mb-6">
        <div className="flex justify-between items-start">
          <div>
            <motion.h2
              className="text-2xl font-bold text-white mb-2 relative flex items-center"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <span className="w-1.5 h-6 bg-[var(--site-accent)] mr-3 rounded-full"></span>
              {t("title")}
              {unreadCount > 0 && (
                <span className="ml-3 bg-[var(--site-accent)]/10 text-[var(--site-accent)] border border-[var(--site-accent)]/20 rounded-md text-xs px-2 py-0.5 font-bold">
                  {t("unread_badge", { count: unreadCount })}
                </span>
              )}
            </motion.h2>
            <p className="text-gray-400 text-sm ml-4 border-l-2 border-site-border pl-3">
              {t("subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <motion.button
                onClick={markAllAsRead}
                whileHover={{ y: -2 }}
                className="text-xs text-white hover:text-[var(--site-accent)] transition-colors bg-[#222427] border border-site-border rounded-lg px-3 py-1.5 font-medium hover:border-[var(--site-accent)]/50"
              >
                {t("mark_all_read")}
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all border ${filter === "all"
              ? "bg-[#222427] text-white border-site-border shadow-sm"
              : "bg-[#1A1C1E] border-transparent text-gray-400 hover:text-white"
            }`}
        >
          {t("filters.all")}
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all border ${filter === "unread"
              ? "bg-[#222427] text-white border-site-border shadow-sm"
              : "bg-[#1A1C1E] border-transparent text-gray-400 hover:text-white"
            }`}
        >
          {t("filters.unread")}
        </button>
        <button
          onClick={() => setFilter("order")}
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all border ${filter === "order"
              ? "bg-[#222427] text-white border-site-border shadow-sm"
              : "bg-[#1A1C1E] border-transparent text-gray-400 hover:text-white"
            }`}
        >
          {t("filters.order")}
        </button>
        <button
          onClick={() => setFilter("payment")}
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all border ${filter === "payment"
              ? "bg-[#222427] text-white border-site-border shadow-sm"
              : "bg-[#1A1C1E] border-transparent text-gray-400 hover:text-white"
            }`}
        >
          {t("filters.payment")}
        </button>
        <button
          onClick={() => setFilter("promotion")}
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all border ${filter === "promotion"
              ? "bg-[#222427] text-white border-site-border shadow-sm"
              : "bg-[#1A1C1E] border-transparent text-gray-400 hover:text-white"
            }`}
        >
          {t("filters.promotion")}
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 bg-[#222427] border border-site-border rounded-xl shadow-ocean">
              <div className="w-8 h-8 border-3 border-[#1A1C1E] border-t-[var(--site-accent)] rounded-full animate-spin"></div>
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <motion.div
                key={notification.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`bg-[#222427] border border-site-border shadow-ocean rounded-xl relative group overflow-hidden transition-all hover:border-[var(--site-accent)]/50 ${!notification.isRead ? "before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-[var(--site-accent)]" : ""
                  }`}
              >
                <Link
                  href={getNotificationLink(notification)}
                  className="p-4 sm:p-5 flex items-start gap-4 cursor-pointer block"
                >
                  <div
                    className={`p-2.5 rounded-xl flex-shrink-0 shadow-sm ${getIconBg(notification.type)}`}
                  >
                    {renderIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0 pr-8 sm:pr-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1 sm:mb-0.5 gap-1 sm:gap-2">
                      <h3
                        className={`font-semibold text-sm sm:text-base truncate ${!notification.isRead ? "text-white" : "text-gray-300"}`}
                      >
                        {notification.title}
                      </h3>
                      <span className="text-xs text-gray-500 flex-shrink-0 flex items-center gap-1.5 font-medium">
                        <Clock size={12} className="opacity-70" />
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p
                      className={`text-xs sm:text-sm mb-2 line-clamp-2 ${!notification.isRead ? "text-gray-300" : "text-gray-500"}`}
                    >
                      {notification.message}
                    </p>

                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-[var(--site-accent)] font-medium hover:underline inline-flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {t("view_details")}
                      </span>
                    </div>

                    {/* Action Buttons - Absolute visible on hover */}
                    <div className="absolute right-4 top-4 sm:top-1/2 sm:-translate-y-1/2 flex flex-col sm:flex-row gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      {!notification.isRead && (
                        <button
                          onClick={(e) => markAsRead(notification.id, e)}
                          className="p-2 rounded-lg bg-[#1A1C1E] border border-site-border text-gray-400 hover:text-white hover:border-green-500/30/50 hover:bg-green-500/10 transition-all shadow-sm"
                          title={t("mark_read")}
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button
                        onClick={(e) =>
                          deleteNotification(notification.id, e)
                        }
                        className="p-2 rounded-lg bg-[#1A1C1E] border border-site-border text-gray-400 hover:text-white hover:border-red-500/30/50 hover:bg-red-500/10 transition-all shadow-sm"
                        title={t("delete")}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[#222427] border border-site-border rounded-xl shadow-ocean p-12 text-center"
            >
              <div className="w-16 h-16 bg-[#1A1C1E] border border-site-border rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell size={28} className="text-gray-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {t("empty_title")}
              </h3>
              <p className="text-gray-400 text-sm max-w-sm mx-auto">
                {filter !== "all"
                  ? t("empty_filter_desc")
                  : t("empty_desc")}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Preferences Link */}
      <div className="mt-8 text-center flex justify-center">
        <Link
          href="/dashboard/notifications/preferences"
          className="text-gray-400 hover:text-white text-sm font-medium transition-colors inline-flex items-center px-4 py-2 rounded-lg bg-[#222427] border border-site-border hover:border-[var(--site-accent)]/50"
        >
          {t("manage_settings")}
        </Link>
      </div>
    </div>
  );
}
