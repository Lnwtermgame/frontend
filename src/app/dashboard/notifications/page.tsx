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
        return <ShoppingBag className="text-brutal-blue" size={20} />;
      case "PAYMENT":
        return <CreditCard className="text-brutal-green" size={20} />;
      case "PROMOTION":
        return <Megaphone className="text-brutal-pink" size={20} />;
      case "SYSTEM":
        return <Info className="text-brutal-yellow" size={20} />;
      default:
        return <Bell className="text-gray-600" size={20} />;
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
          <p className="mt-4 text-gray-600 thai-font">กำลังโหลด...</p>
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
              className="text-xl font-bold text-gray-900 mb-1 relative thai-font flex items-center"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <span className="w-1.5 h-5 bg-brutal-pink mr-2"></span>
              การแจ้งเตือน
              {unreadCount > 0 && (
                <span className="ml-2 bg-brutal-pink text-white text-xs px-2 py-0.5 border-2 border-black font-bold">
                  {unreadCount} ใหม่
                </span>
              )}
            </motion.h2>
            <p className="text-gray-600 text-sm relative thai-font">
              ติดตามความเคลื่อนไหวบัญชีของคุณ
            </p>
          </div>

          {unreadCount > 0 && (
            <motion.button
              onClick={markAllAsRead}
              whileHover={{ y: -2 }}
              className="text-xs text-gray-700 hover:text-black transition-colors bg-white border-[3px] border-black px-3 py-1.5 font-medium thai-font"
              style={{ boxShadow: '3px 3px 0 0 #000000' }}
            >
              ทำเครื่องหมายว่าอ่านแล้วทั้งหมด
            </motion.button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 border-[3px] text-sm font-bold whitespace-nowrap transition-all thai-font ${filter === "all"
            ? "bg-black text-white border-black"
            : "bg-white border-black text-gray-700 hover:bg-gray-50"
            }`}
          style={filter === "all" ? { boxShadow: '3px 3px 0 0 #000000' } : {}}
        >
          ทั้งหมด
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-3 py-1.5 border-[3px] text-sm font-bold whitespace-nowrap transition-all thai-font ${filter === "unread"
            ? "bg-brutal-pink text-white border-black"
            : "bg-white border-black text-gray-700 hover:bg-gray-50"
            }`}
          style={filter === "unread" ? { boxShadow: '3px 3px 0 0 #000000' } : {}}
        >
          ยังไม่อ่าน
        </button>
        <button
          onClick={() => setFilter("order")}
          className={`px-3 py-1.5 border-[3px] text-sm font-bold whitespace-nowrap transition-all thai-font ${filter === "order"
            ? "bg-brutal-blue text-white border-black"
            : "bg-white border-black text-gray-700 hover:bg-gray-50"
            }`}
          style={filter === "order" ? { boxShadow: '3px 3px 0 0 #000000' } : {}}
        >
          คำสั่งซื้อ
        </button>
        <button
          onClick={() => setFilter("payment")}
          className={`px-3 py-1.5 border-[3px] text-sm font-bold whitespace-nowrap transition-all thai-font ${filter === "payment"
            ? "bg-brutal-green text-white border-black"
            : "bg-white border-black text-gray-700 hover:bg-gray-50"
            }`}
          style={filter === "payment" ? { boxShadow: '3px 3px 0 0 #000000' } : {}}
        >
          การชำระเงิน
        </button>
        <button
          onClick={() => setFilter("promotion")}
          className={`px-3 py-1.5 border-[3px] text-sm font-bold whitespace-nowrap transition-all thai-font ${filter === "promotion"
            ? "bg-brutal-yellow text-black border-black"
            : "bg-white border-black text-gray-700 hover:bg-gray-50"
            }`}
          style={filter === "promotion" ? { boxShadow: '3px 3px 0 0 #000000' } : {}}
        >
          โปรโมชั่น
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
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
                transition={{ duration: 0.2, delay: index * 0.05 }}
                whileHover={{ y: -2 }}
                className={`bg-white border-[3px] border-black relative group overflow-hidden ${!notification.isRead
                  ? "border-l-brutal-pink"
                  : ""
                  }`}
                style={{ boxShadow: '4px 4px 0 0 #000000' }}
              >
                {!notification.isRead && (
                  <div className="absolute top-0 right-0 w-3 h-3 bg-brutal-pink border-l-[2px] border-b-[2px] border-black z-10"></div>
                )}

                <Link
                  href={getNotificationLink(notification)}
                  className="p-4 flex items-start gap-4 cursor-pointer hover:bg-gray-50 transition-colors block"
                >
                  <div className={`p-3 border-[3px] border-black flex-shrink-0 ${getIconBg(notification.type)}`}>
                    {renderIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`font-bold text-base truncate pr-2 ${!notification.isRead ? "text-black" : "text-gray-700"}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-gray-600 flex-shrink-0 flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(notification.createdAt).toLocaleDateString('th-TH')}
                      </span>
                    </div>

                    <p className={`text-sm mb-2 line-clamp-2 ${!notification.isRead ? "text-gray-800" : "text-gray-600"}`}>
                      {notification.message}
                    </p>

                    <div className="flex justify-between items-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-brutal-blue font-bold hover:underline thai-font">
                        ดูรายละเอียด
                      </span>

                      <div className="flex gap-2">
                        {!notification.isRead && (
                          <button
                            onClick={(e) => markAsRead(notification.id, e)}
                            className="p-1.5 border-[2px] border-black bg-brutal-green text-white hover:bg-brutal-green/80 transition-colors"
                            title="ทำเครื่องหมายว่าอ่านแล้ว"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <button
                          onClick={(e) => deleteNotification(notification.id, e)}
                          className="p-1.5 border-[2px] border-black bg-brutal-pink text-white hover:bg-brutal-pink/80 transition-colors"
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
              className="bg-white border-[3px] border-black p-12 text-center"
              style={{ boxShadow: '4px 4px 0 0 #000000' }}
            >
              <div className="w-16 h-16 bg-gray-100 border-[3px] border-black flex items-center justify-center mx-auto mb-4">
                <Bell size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-black mb-1 thai-font">ไม่มีการแจ้งเตือน</h3>
              <p className="text-gray-600 thai-font">
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
          className="text-gray-600 hover:text-black text-sm font-medium transition-colors thai-font inline-flex items-center border-b-2 border-transparent hover:border-black"
        >
          จัดการการตั้งค่าการแจ้งเตือน
        </Link>
      </div>
    </div>
  );
}
