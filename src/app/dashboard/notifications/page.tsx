"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { Bell, Check, Clock, Info, AlertTriangle, Gift, Tag, CheckCircle, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "@/lib/framer-exports";

// Mock notifications data
const initialNotifications = [
  {
    id: "NOTIF1",
    title: "Order Completed",
    message: "Your order #ORD-1001 containing Steam Gift Card has been successfully processed.",
    type: "success",
    date: "2023-11-20T14:30:00Z",
    read: false,
    link: "/orders/ORD-1001"
  },
  {
    id: "NOTIF2",
    title: "New Reward Available",
    message: "You have earned enough credits to redeem a $5 Discount Voucher!",
    type: "reward",
    date: "2023-11-19T09:15:00Z",
    read: true,
    link: "/dashboard/credits"
  },
  {
    id: "NOTIF3",
    title: "Account Security Alert",
    message: "We noticed a login from a new device. If this wasn't you, please secure your account.",
    type: "warning",
    date: "2023-11-18T20:45:00Z",
    read: true,
    link: "/dashboard/account/security"
  },
  {
    id: "NOTIF4",
    title: "Winter Sale Is Here!",
    message: "Get up to 50% off on selected game credits and gift cards. Limited time offer.",
    type: "promo",
    date: "2023-11-15T10:00:00Z",
    read: false,
    link: "/promotions"
  },
  {
    id: "NOTIF5",
    title: "Payment Method Added",
    message: "Your Visa ending in 4242 has been added to your payment methods.",
    type: "info",
    date: "2023-11-12T16:20:00Z",
    read: true,
    link: "/dashboard/account/payment"
  }
];

export default function NotificationsPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState("all");

  // If not logged in, redirect to login page
  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [user, router, isInitialized]);

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  // Mark single as read
  const markAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev =>
      prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
    );
  };

  // Delete notification
  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Filter notifications
  const filteredNotifications = filter === "all"
    ? notifications
    : filter === "unread"
      ? notifications.filter(n => !n.read)
      : notifications.filter(n => n.type === filter);

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-mali-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-mali-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  // Helper to render icon based on type
  const renderIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="text-green-400" size={20} />;
      case "warning":
        return <AlertTriangle className="text-amber-400" size={20} />;
      case "info":
        return <Info className="text-blue-400" size={20} />;
      case "reward":
        return <Gift className="text-purple-400" size={20} />;
      case "promo":
        return <Tag className="text-pink-400" size={20} />;
      default:
        return <Bell className="text-mali-blue-light" size={20} />;
    }
  };

  // Helper for background color based on type
  const getIconBg = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-900/20 border-green-500/20";
      case "warning":
        return "bg-amber-900/20 border-amber-500/20";
      case "info":
        return "bg-blue-900/20 border-blue-500/20";
      case "reward":
        return "bg-purple-900/20 border-purple-500/20";
      case "promo":
        return "bg-pink-900/20 border-pink-500/20";
      default:
        return "bg-mali-blue/20 border-mali-blue/30";
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="relative mb-6">
        <div className="flex justify-between items-start">
          <div>
            <motion.h2
              className="text-xl font-bold text-white mb-1 relative"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              Notifications
            </motion.h2>
            <p className="text-mali-text-secondary text-sm relative">
              Stay updated with your account activity
            </p>
          </div>

          <button
            onClick={markAllAsRead}
            className="text-xs text-mali-blue-accent hover:text-white transition-colors bg-mali-blue/10 hover:bg-mali-blue/20 px-3 py-1.5 rounded-lg border border-mali-blue/20"
          >
            Mark all as read
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filter === "all"
              ? "bg-mali-blue text-white shadow-button-glow"
              : "bg-mali-card border border-mali-blue/20 text-mali-text-secondary hover:text-white hover:border-mali-blue/40"
            }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filter === "unread"
              ? "bg-mali-blue text-white shadow-button-glow"
              : "bg-mali-card border border-mali-blue/20 text-mali-text-secondary hover:text-white hover:border-mali-blue/40"
            }`}
        >
          Unread
        </button>
        <button
          onClick={() => setFilter("success")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filter === "success"
              ? "bg-mali-blue text-white shadow-button-glow"
              : "bg-mali-card border border-mali-blue/20 text-mali-text-secondary hover:text-white hover:border-mali-blue/40"
            }`}
        >
          Orders
        </button>
        <button
          onClick={() => setFilter("promo")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filter === "promo"
              ? "bg-mali-blue text-white shadow-button-glow"
              : "bg-mali-card border border-mali-blue/20 text-mali-text-secondary hover:text-white hover:border-mali-blue/40"
            }`}
        >
          Promotions
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={`bg-mali-card rounded-xl border relative group overflow-hidden ${!notification.read
                    ? "border-mali-blue-accent/50 shadow-[0_0_10px_rgba(78,137,232,0.1)]"
                    : "border-mali-blue/20 hover:border-mali-blue/40"
                  }`}
              >
                {!notification.read && (
                  <div className="absolute top-0 right-0 w-3 h-3 bg-mali-blue-accent rounded-bl-lg z-10"></div>
                )}

                <div
                  className="p-4 flex items-start gap-4 cursor-pointer hover:bg-mali-blue/5 transition-colors"
                  onClick={() => router.push(notification.link)}
                >
                  <div className={`p-3 rounded-xl border flex-shrink-0 ${getIconBg(notification.type)}`}>
                    {renderIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`font-semibold text-base truncate pr-2 ${!notification.read ? "text-white" : "text-white/80"}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-mali-text-secondary flex-shrink-0 flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(notification.date).toLocaleDateString()}
                      </span>
                    </div>

                    <p className={`text-sm mb-2 line-clamp-2 ${!notification.read ? "text-white/90" : "text-mali-text-secondary"}`}>
                      {notification.message}
                    </p>

                    <div className="flex justify-between items-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-mali-blue-accent font-medium hover:underline">
                        View details
                      </span>

                      <div className="flex gap-2">
                        {!notification.read && (
                          <button
                            onClick={(e) => markAsRead(notification.id, e)}
                            className="p-1.5 rounded-lg bg-mali-blue/20 text-mali-blue-light hover:bg-mali-blue/40 hover:text-white transition-colors"
                            title="Mark as read"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <button
                          onClick={(e) => deleteNotification(notification.id, e)}
                          className="p-1.5 rounded-lg bg-mali-red/10 text-mali-red hover:bg-mali-red/20 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
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
              <h3 className="text-lg font-bold text-white mb-1">No notifications</h3>
              <p className="text-mali-text-secondary">
                {filter !== "all"
                  ? `You don't have any ${filter} notifications.`
                  : "You're all caught up! Check back later for updates."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 
