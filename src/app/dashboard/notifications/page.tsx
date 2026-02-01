"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { notificationApi, Notification } from "@/lib/services/notification-api";
import { Bell, Check, Clock, Info, AlertTriangle, Gift, Tag, CheckCircle, Trash2, ShoppingBag, CreditCard, Megaphone } from "lucide-react";
import { motion, AnimatePresence } from "@/lib/framer-exports";
import toast from "react-hot-toast";
import Link from "next/link";

export default function NotificationsPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications from API
  useEffect(() => {
    if (isInitialized && user) {
      fetchNotifications();
    }
  }, [isInitialized, user]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await notificationApi.getNotifications(1, 50);
      if (response.success) {
        setNotifications(response.data);
        setUnreadCount(response.unreadCount || 0);
      }
    } catch (error) {
      toast.error('ไม่สามารถโหลดการแจ้งเตือนได้');
    } finally {
      setIsLoading(false);
    }
  };

  // If not logged in, redirect to login page
  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [user, router, isInitialized]);

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await notificationApi.markAllAsRead();
      if (response.success) {
        toast.success('ทำเครื่องหมายว่าอ่านแล้วทั้งหมด');
        setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      toast.error('ไม่สามารถทำเครื่องหมายว่าอ่านแล้วได้');
    }
  };

  // Mark single as read
  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await notificationApi.markAsRead(id);
      if (response.success) {
        setNotifications(prev =>
          prev.map(notif => notif.id === id ? { ...notif, isRead: true } : notif)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      toast.error('ไม่สามารถทำเครื่องหมายว่าอ่านแล้วได้');
    }
  };

  // Delete notification
  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await notificationApi.deleteNotification(id);
      if (response.success) {
        toast.success('ลบการแจ้งเตือนแล้ว');
        const deletedNotif = notifications.find(n => n.id === id);
        setNotifications(prev => prev.filter(notif => notif.id !== id));
        if (deletedNotif && !deletedNotif.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      toast.error('ไม่สามารถลบการแจ้งเตือนได้');
    }
  };

  // Filter notifications
  const filteredNotifications = filter === "all"
    ? notifications
    : filter === "unread"
      ? notifications.filter(n => !n.isRead)
      : notifications.filter(n => {
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
        return <ShoppingBag className="text-blue-400" size={20} />;
      case "PAYMENT":
        return <CreditCard className="text-green-400" size={20} />;
      case "PROMOTION":
        return <Megaphone className="text-pink-400" size={20} />;
      case "SYSTEM":
        return <Info className="text-amber-400" size={20} />;
      default:
        return <Bell className="text-mali-blue-light" size={20} />;
    }
  };

  // Helper for background color based on type
  const getIconBg = (type: string) => {
    switch (type) {
      case "ORDER":
        return "bg-blue-900/20 border-blue-500/20";
      case "PAYMENT":
        return "bg-green-900/20 border-green-500/20";
      case "PROMOTION":
        return "bg-pink-900/20 border-pink-500/20";
      case "SYSTEM":
        return "bg-amber-900/20 border-amber-500/20";
      default:
        return "bg-mali-blue/20 border-mali-blue/30";
    }
  };

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-mali-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-mali-text-secondary thai-font">กำลังโหลด...</p>
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
              className="text-xl font-bold text-white mb-1 relative thai-font"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              การแจ้งเตือน
              {unreadCount > 0 && (
                <span className="ml-2 bg-mali-blue-accent text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount} ใหม่
                </span>
              )}
            </motion.h2>
            <p className="text-mali-text-secondary text-sm relative thai-font">
              ติดตามความเคลื่อนไหวบัญชีของคุณ
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-mali-blue-accent hover:text-white transition-colors bg-mali-blue/10 hover:bg-mali-blue/20 px-3 py-1.5 rounded-lg border border-mali-blue/20 thai-font"
            >
              ทำเครื่องหมายว่าอ่านแล้วทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all thai-font ${filter === "all"
            ? "bg-mali-blue text-white shadow-button-glow"
            : "bg-mali-card border border-mali-blue/20 text-mali-text-secondary hover:text-white hover:border-mali-blue/40"
            }`}
        >
          ทั้งหมด
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all thai-font ${filter === "unread"
            ? "bg-mali-blue text-white shadow-button-glow"
            : "bg-mali-card border border-mali-blue/20 text-mali-text-secondary hover:text-white hover:border-mali-blue/40"
            }`}
        >
          ยังไม่อ่าน
        </button>
        <button
          onClick={() => setFilter("order")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all thai-font ${filter === "order"
            ? "bg-mali-blue text-white shadow-button-glow"
            : "bg-mali-card border border-mali-blue/20 text-mali-text-secondary hover:text-white hover:border-mali-blue/40"
            }`}
        >
          คำสั่งซื้อ
        </button>
        <button
          onClick={() => setFilter("payment")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all thai-font ${filter === "payment"
            ? "bg-mali-blue text-white shadow-button-glow"
            : "bg-mali-card border border-mali-blue/20 text-mali-text-secondary hover:text-white hover:border-mali-blue/40"
            }`}
        >
          การชำระเงิน
        </button>
        <button
          onClick={() => setFilter("promotion")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all thai-font ${filter === "promotion"
            ? "bg-mali-blue text-white shadow-button-glow"
            : "bg-mali-card border border-mali-blue/20 text-mali-text-secondary hover:text-white hover:border-mali-blue/40"
            }`}
        >
          โปรโมชั่น
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        <AnimatePresence>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-mali-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={`bg-mali-card rounded-xl border relative group overflow-hidden ${!notification.isRead
                  ? "border-mali-blue-accent/50 shadow-[0_0_10px_rgba(78,137,232,0.1)]"
                  : "border-mali-blue/20 hover:border-mali-blue/40"
                  }`}
              >
                {!notification.isRead && (
                  <div className="absolute top-0 right-0 w-3 h-3 bg-mali-blue-accent rounded-bl-lg z-10"></div>
                )}

                <Link
                  href={getNotificationLink(notification)}
                  className="p-4 flex items-start gap-4 cursor-pointer hover:bg-mali-blue/5 transition-colors block"
                >
                  <div className={`p-3 rounded-xl border flex-shrink-0 ${getIconBg(notification.type)}`}>
                    {renderIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`font-semibold text-base truncate pr-2 ${!notification.isRead ? "text-white" : "text-white/80"}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-mali-text-secondary flex-shrink-0 flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(notification.createdAt).toLocaleDateString('th-TH')}
                      </span>
                    </div>

                    <p className={`text-sm mb-2 line-clamp-2 ${!notification.isRead ? "text-white/90" : "text-mali-text-secondary"}`}>
                      {notification.message}
                    </p>

                    <div className="flex justify-between items-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-mali-blue-accent font-medium hover:underline thai-font">
                        ดูรายละเอียด
                      </span>

                      <div className="flex gap-2">
                        {!notification.isRead && (
                          <button
                            onClick={(e) => markAsRead(notification.id, e)}
                            className="p-1.5 rounded-lg bg-mali-blue/20 text-mali-blue-light hover:bg-mali-blue/40 hover:text-white transition-colors"
                            title="ทำเครื่องหมายว่าอ่านแล้ว"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <button
                          onClick={(e) => deleteNotification(notification.id, e)}
                          className="p-1.5 rounded-lg bg-mali-red/10 text-mali-red hover:bg-mali-red/20 transition-colors"
                          title="ลบ"
                        >
                          <Trash2 size={14} />
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
              className="bg-mali-card border border-mali-blue/20 rounded-xl p-12 text-center"
            >
              <div className="w-16 h-16 bg-mali-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell size={32} className="text-mali-text-secondary opacity-50" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1 thai-font">ไม่มีการแจ้งเตือน</h3>
              <p className="text-mali-text-secondary thai-font">
                {filter !== "all"
                  ? `คุณไม่มีการแจ้งเตือนในหมวดหมู่นี้`
                  : "คุณอ่านครบแล้ว! กลับมาตรวจสอบใหม่ภายหลัง"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Preferences Link */}
      <div className="mt-6 text-center">
        <Link
          href="/dashboard/notifications/preferences"
          className="text-mali-text-secondary hover:text-mali-blue-accent text-sm transition-colors thai-font"
        >
          จัดการการตั้งค่าการแจ้งเตือน
        </Link>
      </div>
    </div>
  );
}
