"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "@/lib/framer-exports";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  AdminLayout,
  AdminPageHeader,
  PageContainer,
} from "@/components/admin";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  Link2,
  Eye,
  Radio,
  Target,
  Sparkles,
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

type NotifType = "ORDER" | "PAYMENT" | "PROMOTION" | "SYSTEM";

const TYPE_OPTIONS: {
  key: NotifType;
  label: string;
  icon: typeof Bell;
  accentClass: string;
  activeClass: string;
}[] = [
  {
    key: "SYSTEM",
    label: "ระบบ",
    icon: Info,
    accentClass: "text-[rgb(var(--status-info-rgb))]",
    activeClass:
      "border-[rgb(var(--status-info-rgb)/0.4)] bg-[rgb(var(--status-info-rgb)/0.1)] text-[rgb(var(--status-info-rgb))]",
  },
  {
    key: "ORDER",
    label: "คำสั่งซื้อ",
    icon: CheckCircle,
    accentClass: "text-[rgb(var(--status-success-rgb))]",
    activeClass:
      "border-[rgb(var(--status-success-rgb)/0.4)] bg-[rgb(var(--status-success-rgb)/0.1)] text-[rgb(var(--status-success-rgb))]",
  },
  {
    key: "PAYMENT",
    label: "การชำระเงิน",
    icon: TrendingUp,
    accentClass: "text-[rgb(var(--status-warning-rgb))]",
    activeClass:
      "border-[rgb(var(--status-warning-rgb)/0.4)] bg-[rgb(var(--status-warning-rgb)/0.1)] text-[rgb(var(--status-warning-rgb))]",
  },
  {
    key: "PROMOTION",
    label: "โปรโมชั่น",
    icon: Megaphone,
    accentClass: "text-site-accent",
    activeClass: "border-site-accent/40 bg-site-accent/10 text-site-accent",
  },
];

const typeMeta = (t: string) =>
  TYPE_OPTIONS.find((option) => option.key === t) ?? TYPE_OPTIONS[3];

export default function AdminNotificationPage() {
  const { isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotifType>("SYSTEM");
  const [targetMode, setTargetMode] = useState<"all" | "specific">("all");
  const [userIds, setUserIds] = useState("");
  const [sendPush, setSendPush] = useState(true);
  const [link, setLink] = useState("");

  // Stats
  const [stats, setStats] = useState<NotificationStats | null>(null);

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

  const parsedUserIds = useMemo(
    () =>
      userIds
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    [userIds],
  );

  const charLimit = 120;
  const messageChars = message.length;

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("กรุณากรอกหัวข้อและข้อความ");
      return;
    }

    if (targetMode === "specific" && parsedUserIds.length === 0) {
      toast.error("กรุณาระบุ User ID อย่างน้อย 1 รายการ");
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

  const canSend =
    !isSending && title.trim() && message.trim() &&
    !(targetMode === "specific" && parsedUserIds.length === 0);

  return (
    <AdminLayout>
      <PageContainer>
        <AdminPageHeader
          title="ศูนย์การแจ้งเตือน"
          description="แต่งข้อความ กลั่นกรองกลุ่มเป้าหมาย แล้วยิง push ในหน้าเดียว"
          icon={Radio}
        />

        {/* ===== Stats strip ===== */}
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {isLoading && !stats ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-[74px] animate-pulse rounded-xl border border-site-border-soft bg-site-surface"
              />
            ))
          ) : stats ? (
            [
              {
                label: "แจ้งเตือนสะสม",
                value: stats.total,
                icon: Bell,
                valueClass: "text-site-text",
                chipClass: "border-site-border bg-site-raised text-site-muted",
              },
              {
                label: "ยังไม่อ่าน",
                value: stats.unread,
                icon: AlertTriangle,
                valueClass: "text-[rgb(var(--status-warning-rgb))]",
                chipClass:
                  "border-[rgb(var(--status-warning-rgb)/0.3)] bg-[rgb(var(--status-warning-rgb)/0.1)] text-[rgb(var(--status-warning-rgb))]",
              },
              {
                label: "อุปกรณ์ติดตาม push",
                value: stats.pushSubscriptions,
                icon: Smartphone,
                valueClass: "text-site-accent",
                chipClass: "border-site-accent/30 bg-site-accent/10 text-site-accent",
              },
              {
                label: "ออนไลน์ตอนนี้",
                value: stats.connectedUsers,
                icon: Users,
                valueClass: "text-[rgb(var(--status-success-rgb))]",
                chipClass:
                  "border-[rgb(var(--status-success-rgb)/0.3)] bg-[rgb(var(--status-success-rgb)/0.1)] text-[rgb(var(--status-success-rgb))]",
              },
            ].map((card) => (
              <div
                key={card.label}
                className="flex items-center gap-3 rounded-xl border border-site-border-soft bg-site-surface px-3.5 py-3">
                <span
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border ${card.chipClass}`}>
                  <card.icon size={16} />
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-site-dim">
                    {card.label}
                  </div>
                  <div
                    className={`font-mono text-lg font-bold leading-tight ${card.valueClass}`}>
                    {card.value.toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full rounded-xl border border-site-border-soft bg-site-surface p-3 text-center text-xs text-site-dim">
              โหลดสถิติไม่สำเร็จ — ลองรีเฟรชหน้าใหม่
            </div>
          )}
        </div>

        {/* ===== Main split: composer + live preview ===== */}
        <div className="grid grid-cols-1 items-start gap-3.5 xl:grid-cols-[1fr_380px]">
          {/* Composer panel */}
          <div className="overflow-hidden rounded-2xl border border-site-border-soft bg-site-surface">
            <div className="flex items-center gap-2 border-b border-site-border-soft bg-site-raised px-4 py-3">
              <Send size={14} className="text-site-accent" />
              <h2 className="text-sm font-bold text-site-text">เขียนการแจ้งเตือน</h2>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-site-dim">
                ขั้นที่ 1–3
              </span>
            </div>

            <div className="space-y-5 p-4">
              {/* Step 1: type */}
              <section className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-site-accent/15 font-mono text-[10px] font-bold text-site-accent">
                    1
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-site-muted">
                    ประเภทการแจ้งเตือน
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {TYPE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isActive = type === option.key;
                    return (
                      <button
                        key={option.key}
                        onClick={() => setType(option.key)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition-all ${
                          isActive
                            ? `${option.activeClass} shadow-[inset_0_0_0_1px_rgb(var(--site-accent-rgb)/0.2)]`
                            : "border-site-border bg-site-raised text-site-muted hover:border-site-dim hover:text-site-text"
                        }`}>
                        <Icon size={14} className={isActive ? "" : "text-site-dim"} />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Step 2: content */}
              <section className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-site-accent/15 font-mono text-[10px] font-bold text-site-accent">
                    2
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-site-muted">
                    เนื้อหาข้อความ
                  </h3>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-site-muted">
                      หัวข้อ <span className="text-[rgb(var(--status-danger-rgb))]">*</span>
                    </label>
                    <span
                      className={`font-mono text-[10px] ${title.length > 60 ? "text-[rgb(var(--status-warning-rgb))]" : "text-site-dim"}`}>
                      {title.length}/60 แนะนำ
                    </span>
                  </div>
                  <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="เช่น โปรโมชั่นพิเศษวันนี้! รับโบนัส 20%"
                    className="h-10 rounded-xl border-site-border bg-site-raised text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-site-muted">
                      ข้อความ <span className="text-[rgb(var(--status-danger-rgb))]">*</span>
                    </label>
                    <span
                      className={`font-mono text-[10px] ${messageChars > charLimit ? "text-[rgb(var(--status-danger-rgb))]" : messageChars > charLimit * 0.8 ? "text-[rgb(var(--status-warning-rgb))]" : "text-site-dim"}`}>
                      {messageChars}/{charLimit} ตัวอักษร
                    </span>
                  </div>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="เขียนข้อความที่ต้องการส่ง... กระชับ ชัดเจน และบอกสิ่งที่ผู้ใช้ต้องทำ"
                    rows={4}
                    className="rounded-xl border-site-border bg-site-raised text-sm resize-none"
                  />
                  {messageChars > charLimit && (
                    <p className="flex items-center gap-1.5 text-[11px] text-[rgb(var(--status-warning-rgb))]">
                      <AlertTriangle size={12} />
                      ข้อความยาวเกินความแนะนำสำหรับ push notification — อาจถูกตัดในบางอุปกรณ์
                    </p>
                  )}
                </div>
              </section>

              {/* Step 3: audience */}
              <section className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-site-accent/15 font-mono text-[10px] font-bold text-site-accent">
                    3
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-site-muted">
                    ผู้รับ
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    onClick={() => setTargetMode("all")}
                    className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all ${
                      targetMode === "all"
                        ? "border-site-accent/50 bg-site-accent/10"
                        : "border-site-border bg-site-raised hover:border-site-dim"
                    }`}>
                    <Users
                      size={16}
                      className={targetMode === "all" ? "mt-0.5 text-site-accent" : "mt-0.5 text-site-dim"}
                    />
                    <span>
                      <span className={`block text-xs font-bold ${targetMode === "all" ? "text-site-accent" : "text-site-text"}`}>
                        ผู้ใช้ทั้งหมด
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-site-dim">
                        ส่งถึงทุกคนที่มีบัญชีในระบบ
                      </span>
                    </span>
                  </button>
                  <button
                    onClick={() => setTargetMode("specific")}
                    className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all ${
                      targetMode === "specific"
                        ? "border-site-accent/50 bg-site-accent/10"
                        : "border-site-border bg-site-raised hover:border-site-dim"
                    }`}>
                    <Target
                      size={16}
                      className={targetMode === "specific" ? "mt-0.5 text-site-accent" : "mt-0.5 text-site-dim"}
                    />
                    <span>
                      <span className={`block text-xs font-bold ${targetMode === "specific" ? "text-site-accent" : "text-site-text"}`}>
                        เฉพาะราย
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-site-dim">
                        ระบุ User ID ที่ต้องการ
                      </span>
                    </span>
                  </button>
                </div>

                {targetMode === "specific" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="overflow-hidden">
                    <div className="space-y-2 rounded-xl border border-site-border-soft bg-site-raised/50 p-3">
                      <label className="block text-xs font-bold text-site-muted">
                        User IDs (คั่นด้วยลูกน้ำ)
                      </label>
                      <Textarea
                        value={userIds}
                        onChange={(e) => setUserIds(e.target.value)}
                        placeholder="user-id-1, user-id-2, user-id-3"
                        rows={2}
                        className="rounded-xl border-site-border bg-site-surface font-mono text-xs resize-none"
                      />
                      <div className="flex items-center gap-1.5 text-[11px] text-site-dim">
                        <Target size={11} />
                        ตรวจพบ{" "}
                        <b className="font-mono text-site-accent">
                          {parsedUserIds.length}
                        </b>{" "}
                        รายการที่จะส่ง
                      </div>
                    </div>
                  </motion.div>
                )}
              </section>

              {/* Advanced options */}
              <div className="rounded-xl border border-site-border-soft bg-site-raised/50">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-bold text-site-muted transition-colors hover:text-site-text">
                  <Sparkles size={13} className="text-site-dim" />
                  ตัวเลือกเพิ่มเติม
                  <ChevronDown
                    size={13}
                    className={`ml-auto text-site-dim transition-transform ${showAdvanced ? "rotate-180" : ""}`}
                  />
                </button>

                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="overflow-hidden">
                    <div className="space-y-3 border-t border-site-border-soft px-3 py-3">
                      {/* Delivery options */}
                      <div className="flex flex-wrap gap-3">
                        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-site-text">
                          <Checkbox
                            checked={sendPush}
                            onCheckedChange={(c) => setSendPush(c === true)}
                          />
                          <Smartphone size={13} className="text-site-dim" />
                          <span className="font-bold">Push Notification</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-site-dim opacity-60">
                          <Checkbox disabled />
                          <Mail size={13} />
                          <span>Email (เร็วๆ นี้)</span>
                        </label>
                      </div>

                      {/* Link */}
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-site-muted">
                          <Link2 size={12} />
                          ลิงก์เมื่อกดที่การแจ้งเตือน (ไม่บังคับ)
                        </label>
                        <Input
                          type="text"
                          value={link}
                          onChange={(e) => setLink(e.target.value)}
                          placeholder="/dashboard/promotions"
                          className="h-8 rounded-lg border-site-border bg-site-surface font-mono text-xs"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Send */}
              <div className="flex flex-wrap items-center gap-3 border-t border-site-border-soft pt-4">
                <Button
                  onClick={handleSendNotification}
                  disabled={!canSend}
                  className="gap-2 rounded-xl px-6">
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
                </Button>
                <span className="text-[11px] leading-snug text-site-dim">
                  {targetMode === "all"
                    ? "กำลังจะส่งถึงผู้ใช้ทั้งหมด"
                    : parsedUserIds.length > 0
                      ? `กำลังจะส่งถึง ${parsedUserIds.length} รายการ`
                      : "ยังไม่ได้ระบุผู้รับ"}{" "}
                  · ส่งแล้วไม่สามารถเรียกคืนได้
                </span>
              </div>
            </div>
          </div>

          {/* Live preview panel */}
          <div className="sticky top-4 space-y-3.5">
            <div className="overflow-hidden rounded-2xl border border-site-border-soft bg-site-surface">
              <div className="flex items-center gap-2 border-b border-site-border-soft bg-site-raised px-4 py-3">
                <Eye size={14} className="text-site-accent" />
                <h2 className="text-sm font-bold text-site-text">พรีวิวบนอุปกรณ์</h2>
              </div>

              <div className="space-y-4 p-4">
                {/* Phone-style push preview */}
                <div className="rounded-2xl border border-site-border-soft bg-site-bg p-3.5">
                  <div className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-site-dim">
                    <Smartphone size={11} />
                    Push Notification
                  </div>
                  <div className="rounded-xl border border-site-border bg-site-raised p-3 shadow-lg">
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border ${typeMeta(type).activeClass}`}>
                        {(() => {
                          const Icon = typeMeta(type).icon;
                          return <Icon size={15} />;
                        })()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[11px] font-bold text-site-muted">
                            GameTopup
                          </span>
                          <span className="font-mono text-[9px] text-site-dim">ตอนนี้</span>
                        </div>
                        <div
                          className={`mt-0.5 truncate text-[12.5px] font-bold text-site-text ${title ? "" : "opacity-40"}`}>
                          {title || "หัวข้อการแจ้งเตือน"}
                        </div>
                        <div
                          className={`mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-site-muted ${message ? "" : "opacity-40"}`}>
                          {message || "เนื้อหาข้อความจะแสดงที่นี่ — สองบรรทัดแรกของ push"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* In-app bell preview */}
                <div className="rounded-2xl border border-site-border-soft bg-site-bg p-3.5">
                  <div className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-site-dim">
                    <Bell size={11} />
                    ในหน้าเว็บ (รถไถลการแจ้งเตือน)
                  </div>
                  <div
                    className={`flex items-start gap-2.5 rounded-xl border p-3 ${typeMeta(type).activeClass}`}>
                    {(() => {
                      const Icon = typeMeta(type).icon;
                      return <Icon size={15} className="mt-0.5 flex-shrink-0" />;
                    })()}
                    <div className="min-w-0">
                      <div className={`truncate text-xs font-bold ${title ? "" : "opacity-50"}`}>
                        {title || "หัวข้อการแจ้งเตือน"}
                      </div>
                      <div className={`mt-0.5 line-clamp-2 text-[11.5px] leading-snug opacity-80 ${message ? "" : "opacity-50"}`}>
                        {message || "เนื้อหาข้อความ"}
                      </div>
                      {link && (
                        <div className="mt-1.5 flex items-center gap-1 font-mono text-[10px] opacity-70">
                          <Link2 size={10} />
                          {link}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Meta summary */}
                <div className="space-y-1.5 rounded-xl border border-site-border-soft bg-site-raised/50 p-3 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-site-dim">ประเภท</span>
                    <span className="flex items-center gap-1.5 font-bold text-site-text">
                      {(() => {
                        const Icon = typeMeta(type).icon;
                        return <Icon size={12} className={typeMeta(type).accentClass} />;
                      })()}
                      {typeMeta(type).label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-site-dim">ผู้รับ</span>
                    <span className="font-bold text-site-text">
                      {targetMode === "all"
                        ? "ผู้ใช้ทั้งหมด"
                        : parsedUserIds.length > 0
                          ? `${parsedUserIds.length} รายการ`
                          : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-site-dim">ช่องทาง</span>
                    <span className="font-bold text-site-text">
                      {sendPush ? "Push" : "In-app เท่านั้น"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-site-dim">ลิงก์</span>
                    <span className="max-w-[150px] truncate font-mono text-[10px] text-site-text">
                      {link || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Type distribution */}
            {stats?.byType && Object.keys(stats.byType).length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-site-border-soft bg-site-surface">
                <div className="flex items-center gap-2 border-b border-site-border-soft bg-site-raised px-4 py-3">
                  <TrendingUp size={14} className="text-site-accent" />
                  <h2 className="text-sm font-bold text-site-text">สถิติตามประเภท</h2>
                </div>
                <div className="space-y-2.5 p-4">
                  {Object.entries(stats.byType)
                    .sort(([, a], [, b]) => b - a)
                    .map(([typeKey, count]) => {
                      const meta = typeMeta(typeKey);
                      const Icon = meta.icon;
                      const total = Object.values(stats.byType).reduce((sum, value) => sum + value, 0);
                      const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={typeKey} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 font-bold text-site-muted">
                              <Icon size={12} className={meta.accentClass} />
                              {meta.label}
                            </span>
                            <span className="font-mono text-site-dim">
                              {count.toLocaleString()} · {percent}%
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-site-raised">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                              className="h-full rounded-full bg-site-accent/70"
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </AdminLayout>
  );
}
