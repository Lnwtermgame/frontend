"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "@/lib/framer-exports";
import { useAuth } from "@/lib/hooks/use-auth";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Bell,
  Send,
  Users,
  Smartphone,
  Mail,
  Info,
  CheckCircle,
  AlertTriangle,
  Megaphone,
  TrendingUp,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { notificationClient } from "@/lib/client/gateway";

interface NotificationStats {
  total: number;
  unread: number;
  pushSubscriptions: number;
  connectedUsers: number;
  byType: Record<string, number>;
}

export default function AdminNotificationPage() {
  const router = useRouter();
  const { isAdmin, isInitialized } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<
    "ORDER" | "PAYMENT" | "PROMOTION" | "SYSTEM"
  >("SYSTEM");
  const [targetMode, setTargetMode] = useState<"all" | "specific">("all");
  const [userIds, setUserIds] = useState("");
  const [sendPush, setSendPush] = useState(true);
  const [link, setLink] = useState("");

  // Stats
  const [stats, setStats] = useState<NotificationStats | null>(null);

  // Redirect non-admin users
  useEffect(() => {
    if (isInitialized && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, isInitialized, router]);

  // Fetch stats
  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      const response = await notificationClient.get(
        "/api/admin/notifications/stats",
      );
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("กรุณากรอกหัวข้อและข้อความ");
      return;
    }

    setIsSending(true);

    try {
      const payload: any = {
        title: title.trim(),
        message: message.trim(),
        type,
        sendPush,
        data: {},
      };

      if (link.trim()) {
        payload.data.url = link.trim();
      }

      if (targetMode === "specific" && userIds.trim()) {
        payload.userIds = userIds
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean);
      }

      const response = await notificationClient.post(
        "/api/admin/notifications/send",
        payload,
      );

      if (response.data.success) {
        const { results } = response.data.data;
        const failedText =
          results.failed > 0 ? `(${results.failed} ไม่สำเร็จ)` : "";
        toast.success(`ส่งสำเร็จ ${results.success} รายการ ${failedText}`);

        // Reset form
        setTitle("");
        setMessage("");
        setLink("");
        setUserIds("");

        // Refresh stats
        fetchStats();
      }
    } catch (error) {
      toast.error("ไม่สามารถส่งการแจ้งเตือนได้");
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const getTypeIcon = (t: string) => {
    switch (t) {
      case "ORDER":
        return <CheckCircle className="h-4 w-4" />;
      case "PAYMENT":
        return <TrendingUp className="h-4 w-4" />;
      case "PROMOTION":
        return <Megaphone className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getTypeColor = (t: string) => {
    switch (t) {
      case "ORDER":
        return "bg-site-surface0/10 text-site-accent border-blue-300";
      case "PAYMENT":
        return "bg-green-500/10 text-green-400 border-green-300";
      case "PROMOTION":
        return "bg-site-accent/10 text-site-accent border-site-accent/30";
      default:
        return "bg-site-raised text-gray-300 border-gray-300";
    }
  };

  if (!isInitialized || !isAdmin) {
    return (
      <AdminLayout title="จัดการการแจ้งเตือน">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-site-accent animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="จัดการการแจ้งเตือน">
      <div className="space-y-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-site-accent" />
              จัดการการแจ้งเตือน
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              ส่งการแจ้งเตือนไปยังผู้ใช้ทั้งหมดหรือเฉพาะราย
            </p>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <StatCard
              title="การแจ้งเตือนทั้งหมด"
              value={stats.total.toLocaleString()}
              icon={<Bell className="h-4 w-4" />}
              color="blue"
            />
            <StatCard
              title="ยังไม่อ่าน"
              value={stats.unread.toLocaleString()}
              icon={<AlertTriangle className="h-4 w-4" />}
              color="yellow"
            />
            <StatCard
              title="Push Subscriptions"
              value={stats.pushSubscriptions.toLocaleString()}
              icon={<Smartphone className="h-4 w-4" />}
              color="pink"
            />
            <StatCard
              title="Online Now"
              value={stats.connectedUsers.toLocaleString()}
              icon={<Users className="h-4 w-4" />}
              color="green"
            />
          </motion.div>
        )}

        {/* Main Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-site-surface border border-white/5 rounded-2xl">
          <div className="p-4 border-b-[3px] border-white/10 bg-site-surface">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Send className="h-4 w-4 text-site-accent" />
              เขียนการแจ้งเตือน
            </h2>
          </div>

          <div className="p-4 space-y-4">
            {/* Type Selection */}
            <div>
              <label className="block text-xs font-bold mb-2">
                ประเภทการแจ้งเตือน
              </label>
              <div className="flex flex-wrap gap-2">
                {["SYSTEM", "ORDER", "PAYMENT", "PROMOTION"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t as any)}
                    className={`flex items-center gap-2 px-3 py-1.5 border border-white/5 rounded-xl text-xs font-medium transition-all ${
                      type === t
                        ? `${getTypeColor(t)} border-white/10`
                        : "bg-site-raised border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {getTypeIcon(t)}
                    {t === "SYSTEM" && "ระบบ"}
                    {t === "ORDER" && "คำสั่งซื้อ"}
                    {t === "PAYMENT" && "การชำระเงิน"}
                    {t === "PROMOTION" && "โปรโมชั่น"}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold mb-2">หัวข้อ *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น โปรโมชั่นพิเศษ!"
                className="w-full px-3 py-2 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-site-accent text-sm"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-bold mb-2">ข้อความ *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="เขียนข้อความที่ต้องการส่ง..."
                rows={3}
                className="w-full px-3 py-2 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-site-accent resize-none text-sm"
              />
            </div>

            {/* Target Selection */}
            <div className="border border-white/5 rounded-xl border-white/5 p-3">
              <label className="block text-xs font-bold mb-2">ผู้รับ</label>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="radio"
                    checked={targetMode === "all"}
                    onChange={() => setTargetMode("all")}
                    className="w-3 h-3"
                  />
                  <span>ผู้ใช้ทั้งหมด</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="radio"
                    checked={targetMode === "specific"}
                    onChange={() => setTargetMode("specific")}
                    className="w-3 h-3"
                  />
                  <span>เฉพาะราย</span>
                </label>
              </div>

              {targetMode === "specific" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-2">
                  <label className="block text-xs mb-1">
                    User IDs (คั่นด้วยลูกน้ำ)
                  </label>
                  <textarea
                    value={userIds}
                    onChange={(e) => setUserIds(e.target.value)}
                    placeholder="user-id-1, user-id-2, user-id-3"
                    rows={2}
                    className="w-full px-2 py-1.5 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-site-accent resize-none text-xs font-mono"
                  />
                </motion.div>
              )}
            </div>

            {/* Advanced Options */}
            <div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white">
                {showAdvanced ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                ตัวเลือกเพิ่มเติม
              </button>

              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 space-y-3 border border-white/5 rounded-xl border-white/5 p-3">
                  {/* Delivery Options */}
                  <div>
                    <label className="block text-xs font-bold mb-1">
                      ช่องทางการส่ง
                    </label>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={sendPush}
                          onChange={(e) => setSendPush(e.target.checked)}
                          className="w-3 h-3"
                        />
                        <Smartphone className="h-3 w-3" />
                        <span>Push Notification</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer opacity-50 text-xs">
                        <input type="checkbox" disabled className="w-3 h-3" />
                        <Mail className="h-3 w-3" />
                        <span>Email (เร็วๆ นี้)</span>
                      </label>
                    </div>
                  </div>

                  {/* Link */}
                  <div>
                    <label className="block text-xs font-bold mb-1">
                      ลิงก์ (ไม่บังคับ)
                    </label>
                    <input
                      type="text"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="/dashboard/promotions"
                      className="w-full px-2 py-1.5 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-site-accent text-xs"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Send Button */}
            <div className="pt-3 border-t-[2px] border-white/5">
              <motion.button
                onClick={handleSendNotification}
                disabled={isSending || !title.trim() || !message.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-site-accent to-site-accent/80 hover:from-site-accent hover:to-site-accent/60 text-white px-6 py-2.5 border border-white/5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังส่ง...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    ส่งการแจ้งเตือน
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Type Distribution */}
        {stats?.byType && Object.keys(stats.byType).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-site-surface border border-white/5 rounded-2xl">
            <div className="p-4 border-b-[3px] border-white/10 bg-site-surface">
              <h2 className="text-base font-bold">สถิติตามประเภท</h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(stats.byType).map(([type, count]) => (
                  <div
                    key={type}
                    className={`p-3 border border-white/5 rounded-xl ${getTypeColor(type)}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      {getTypeIcon(type)}
                      <span className="font-bold text-xs">
                        {type === "SYSTEM" && "ระบบ"}
                        {type === "ORDER" && "คำสั่งซื้อ"}
                        {type === "PAYMENT" && "ชำระเงิน"}
                        {type === "PROMOTION" && "โปรโมชั่น"}
                      </span>
                    </div>
                    <div className="text-xl font-bold">
                      {count.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "blue" | "yellow" | "pink" | "green";
}

const colorClasses = {
  blue: "bg-site-surface0/10 text-site-accent border-blue-300",
  yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-300",
  pink: "bg-site-accent/10 text-site-accent border-site-accent/30",
  green: "bg-green-500/10 text-green-400 border-green-300",
};

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`p-3 border border-white/5 rounded-xl ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{title}</span>
        <span className="p-1.5 bg-site-surface border border-white/5 rounded-2xl">{icon}</span>
      </div>
      <div className="text-xl font-bold mt-1.5">{value}</div>
    </motion.div>
  );
}
