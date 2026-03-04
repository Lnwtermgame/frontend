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
        return <ShoppingBag className="text-brutal-blue" size={16} />;
      case "PAYMENT":
        return <CreditCard className="text-brutal-green" size={16} />;
      case "PROMOTION":
        return <Megaphone className="text-brutal-pink" size={16} />;
      case "SYSTEM":
        return <Info className="text-brutal-yellow" size={16} />;
      default:
        return <Bell className="text-gray-600" size={16} />;
    }
  };

  // Helper for background color based on type
  const getIconBg = (type: string) => {
    switch (type) {
      case "ORDER":
        return "bg-brutal-blue/20 border-brutal-blue";
      case "PAYMENT":
        return "bg-brutal-green/20 border-brutal-green";
      case "PROMOTION":
        return "bg-brutal-pink/20 border-brutal-pink";
      case "SYSTEM":
        return "bg-brutal-yellow/20 border-brutal-yellow";
      default:
        return "bg-gray-100 border-gray-300";
    }
  };

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="relative mb-4">
        <div className="flex justify-between items-start">
          <div>
            <motion.h2
              className="text-lg font-bold text-gray-900 mb-1 relative flex items-center"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <span className="w-1.5 h-4 bg-brutal-pink mr-2"></span>
              {t("title")}
              {unreadCount > 0 && (
                <span className="ml-2 bg-brutal-pink text-white text-[10px] px-1.5 py-0.5 border-2 border-black font-bold">
                  {t("unread_badge", { count: unreadCount })}
                </span>
              )}
            </motion.h2>
            <p className="text-gray-600 text-xs relative">
              {t("subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <motion.button
                onClick={markAllAsRead}
                whileHover={{ y: -2 }}
                className="text-[10px] text-gray-700 hover:text-black transition-colors bg-white border-[2px] border-black px-2 py-1 font-medium"
                style={{ boxShadow: "2px 2px 0 0 #000000" }}
              >
                {t("mark_all_read")}
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setFilter("all")}
          className={`px-2.5 py-1 border-[2px] text-xs font-bold whitespace-nowrap transition-all ${
            filter === "all"
              ? "bg-black text-white border-black"
              : "bg-white border-black text-gray-700 hover:bg-gray-50"
          }`}
          style={filter === "all" ? { boxShadow: "2px 2px 0 0 #000000" } : {}}
        >
          {t("filters.all")}
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-2.5 py-1 border-[2px] text-xs font-bold whitespace-nowrap transition-all ${
            filter === "unread"
              ? "bg-brutal-pink text-white border-black"
              : "bg-white border-black text-gray-700 hover:bg-gray-50"
          }`}
          style={
            filter === "unread" ? { boxShadow: "2px 2px 0 0 #000000" } : {}
          }
        >
          {t("filters.unread")}
        </button>
        <button
          onClick={() => setFilter("order")}
          className={`px-2.5 py-1 border-[2px] text-xs font-bold whitespace-nowrap transition-all ${
            filter === "order"
              ? "bg-brutal-blue text-white border-black"
              : "bg-white border-black text-gray-700 hover:bg-gray-50"
          }`}
          style={filter === "order" ? { boxShadow: "2px 2px 0 0 #000000" } : {}}
        >
          {t("filters.order")}
        </button>
        <button
          onClick={() => setFilter("payment")}
          className={`px-2.5 py-1 border-[2px] text-xs font-bold whitespace-nowrap transition-all ${
            filter === "payment"
              ? "bg-brutal-green text-white border-black"
              : "bg-white border-black text-gray-700 hover:bg-gray-50"
          }`}
          style={
            filter === "payment" ? { boxShadow: "2px 2px 0 0 #000000" } : {}
          }
        >
          {t("filters.payment")}
        </button>
        <button
          onClick={() => setFilter("promotion")}
          className={`px-2.5 py-1 border-[2px] text-xs font-bold whitespace-nowrap transition-all ${
            filter === "promotion"
              ? "bg-brutal-yellow text-black border-black"
              : "bg-white border-black text-gray-700 hover:bg-gray-50"
          }`}
          style={
            filter === "promotion" ? { boxShadow: "2px 2px 0 0 #000000" } : {}
          }
        >
          {t("filters.promotion")}
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        <AnimatePresence>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                whileHover={{ y: -2 }}
                className={`bg-white border-[2px] border-black relative group overflow-hidden ${
                  !notification.isRead ? "border-l-brutal-pink" : ""
                }`}
                style={{ boxShadow: "3px 3px 0 0 #000000" }}
              >
                {!notification.isRead && (
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-brutal-pink border-l-[2px] border-b-[2px] border-black z-10"></div>
                )}

                <Link
                  href={getNotificationLink(notification)}
                  className="p-3 flex items-start gap-3 cursor-pointer hover:bg-gray-50 transition-colors block"
                >
                  <div
                    className={`p-2 border-[2px] border-black flex-shrink-0 ${getIconBg(notification.type)}`}
                  >
                    {renderIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <h3
                        className={`font-bold text-sm truncate pr-2 ${!notification.isRead ? "text-black" : "text-gray-700"}`}
                      >
                        {notification.title}
                      </h3>
                      <span className="text-[10px] text-gray-600 flex-shrink-0 flex items-center gap-1 font-bold">
                        <Clock size={10} />
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p
                      className={`text-xs mb-1.5 line-clamp-2 ${!notification.isRead ? "text-gray-800" : "text-gray-600"}`}
                    >
                      {notification.message}
                    </p>

                    <div className="flex justify-between items-center mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] text-brutal-blue font-bold hover:underline">
                        {t("view_details")}
                      </span>

                      <div className="flex gap-1.5">
                        {!notification.isRead && (
                          <button
                            onClick={(e) => markAsRead(notification.id, e)}
                            className="p-1 border-[2px] border-black bg-brutal-green text-white hover:bg-brutal-green/80 transition-colors"
                            title={t("mark_read")}
                          >
                            <Check size={12} />
                          </button>
                        )}
                        <button
                          onClick={(e) =>
                            deleteNotification(notification.id, e)
                          }
                          className="p-1 border-[2px] border-black bg-brutal-pink text-white hover:bg-brutal-pink/80 transition-colors"
                          title={t("delete")}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white border-[3px] border-black p-8 text-center"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
            >
              <div className="w-12 h-12 bg-gray-100 border-[2px] border-black flex items-center justify-center mx-auto mb-3">
                <Bell size={24} className="text-gray-400" />
              </div>
              <h3 className="text-base font-bold text-black mb-1">
                {t("empty_title")}
              </h3>
              <p className="text-gray-600 text-xs font-bold">
                {filter !== "all"
                  ? t("empty_filter_desc")
                  : t("empty_desc")}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Preferences Link */}
      <div className="mt-4 text-center">
        <Link
          href="/dashboard/notifications/preferences"
          className="text-gray-600 hover:text-black text-xs font-bold transition-colors inline-flex items-center border-b border-transparent hover:border-black"
        >
          {t("manage_settings")}
        </Link>
      </div>
    </div>
  );
}
