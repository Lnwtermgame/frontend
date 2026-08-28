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
  Trash2,
  ShoppingBag,
  CreditCard,
  Megaphone,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton, SkeletonListRow } from "@/components/ui/Skeleton";

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
        return <ShoppingBag className="text-status-info" size={16} />;
      case "PAYMENT":
        return <CreditCard className="text-status-success" size={16} />;
      case "PROMOTION":
        return <Megaphone className="text-site-accent" size={16} />;
      case "SYSTEM":
        return <Info className="text-status-warning" size={16} />;
      default:
        return <Bell className="text-site-muted" size={16} />;
    }
  };

  // Helper for background color based on type
  const getIconBg = (type: string) => {
    switch (type) {
      case "ORDER":
        return "bg-status-info/10 border border-status-info/20";
      case "PAYMENT":
        return "bg-status-success/10 border border-status-success/20";
      case "PROMOTION":
        return "bg-site-accent/10 border border-site-accent/20";
      case "SYSTEM":
        return "bg-status-warning/10 border border-status-warning/20";
      default:
        return "bg-site-raised border border-site-border-soft";
    }
  };

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-8" />
          <p className="text-site-muted font-medium">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header with unread badge */}
      <div className="mb-4">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-site-text leading-none mb-1 flex items-center">
              {t("title")}
              {unreadCount > 0 && (
                <span className="ml-3">
                  <Badge variant="info">
                    {t("unread_badge", { count: unreadCount })}
                  </Badge>
                </span>
              )}
            </h1>
            <p className="text-[11px] text-site-dim uppercase font-bold tracking-widest leading-none">
              {t("subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-site-text hover:text-site-accent transition-colors bg-site-surface border border-site-border-soft rounded-6 px-3 py-1.5 font-medium hover:border-site-accent/50"
              >
                {t("mark_all_read")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters - underline tab style */}
      <div className="flex gap-0 mb-6 overflow-x-auto pb-0 scrollbar-none border-b border-site-border-soft">
        {[
          { key: "all", label: t("filters.all") },
          { key: "unread", label: t("filters.unread") },
          { key: "order", label: t("filters.order") },
          { key: "payment", label: t("filters.payment") },
          { key: "promotion", label: t("filters.promotion") },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${filter === tab.key
              ? "text-site-text border-site-accent"
              : "text-site-muted border-transparent hover:text-site-text"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => <SkeletonListRow key={i} />)}
          </div>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`site-card relative group overflow-hidden transition-colors hover:bg-site-raised ${!notification.isRead ? "before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-site-accent" : ""
                }`}
            >
              <Link
                href={getNotificationLink(notification)}
                className="p-4 sm:p-5 flex items-start gap-4 cursor-pointer block"
              >
                <div
                  className={`p-2 rounded-6 flex-shrink-0 ${getIconBg(notification.type)}`}
                >
                  {renderIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0 pr-8 sm:pr-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1 sm:mb-0.5 gap-1 sm:gap-2">
                    <h3
                      className={`font-semibold text-sm sm:text-base truncate ${!notification.isRead ? "text-site-text" : "text-site-muted"}`}
                    >
                      {notification.title}
                    </h3>
                    <span className="text-[11px] text-site-dim flex-shrink-0 flex items-center gap-1 font-medium">
                      <Clock size={11} className="opacity-70" />
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p
                    className={`text-xs sm:text-sm mb-2 line-clamp-2 ${!notification.isRead ? "text-site-muted" : "text-site-dim"}`}
                  >
                    {notification.message}
                  </p>

                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-site-accent font-medium hover:underline inline-flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {t("view_details")}
                    </span>
                  </div>

                  {/* Action Buttons - Absolute visible on hover */}
                  <div className="absolute right-4 top-4 sm:top-1/2 sm:-translate-y-1/2 flex flex-col sm:flex-row gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {!notification.isRead && (
                      <button
                        onClick={(e) => markAsRead(notification.id, e)}
                        className="p-1.5 rounded-6 bg-site-surface border border-site-border-soft text-site-muted hover:text-site-text hover:border-status-success/50 hover:bg-status-success/10 transition-colors"
                        title={t("mark_read")}
                        aria-label={t("mark_read")}
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      onClick={(e) =>
                        deleteNotification(notification.id, e)
                      }
                      className="p-1.5 rounded-6 bg-site-surface border border-site-border-soft text-site-muted hover:text-site-text hover:border-status-danger/50 hover:bg-status-danger/10 transition-colors"
                      title={t("delete")}
                      aria-label={t("delete")}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Link>
            </div>
          ))
        ) : (
          <div className="site-card p-12 text-center">
            <EmptyState icon={Bell} message={
              filter !== "all"
                ? t("empty_filter_desc")
                : t("empty_desc")
            } />
          </div>
        )}
      </div>

      {/* Preferences Link */}
      <div className="mt-8 text-center flex justify-center">
        <Link
          href="/dashboard/notifications/preferences"
          className="text-site-muted hover:text-site-text text-sm font-medium transition-colors inline-flex items-center px-4 py-2 rounded-6 bg-site-surface border border-site-border-soft hover:border-site-accent/50"
        >
          {t("manage_settings")}
        </Link>
      </div>
    </div>
  );
}
