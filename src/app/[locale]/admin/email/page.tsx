"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "@/lib/framer-exports";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  AdminLayout,
  AdminPageHeader,
  PageContainer,
} from "@/components/admin";
import {
  Mail,
  FileText,
  Settings,
  Loader2,
  Plus,
  Search,
  Edit,
  Copy,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  Palette,
  Image,
  Globe,
  Phone,
  Mail as MailIcon,
  Save,
  Send,
  LayoutTemplate,
  Zap,
  Gauge,
} from "lucide-react";
import toast from "react-hot-toast";
import { notificationClient } from "@/lib/client/gateway";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Types
interface EmailTemplate {
  id: string;
  code: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string | null;
  description: string | null;
  placeholders: string[];
  category: string;
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EmailEvent {
  id: string;
  code: string;
  name: string;
  description: string | null;
  templateId: string;
  template?: {
    id: string;
    code: string;
    name: string;
    category: string;
  };
  triggerEvent: string;
  priority: number;
  delayMinutes: number;
  isActive: boolean;
  conditions: Record<string, any> | null;
}

interface EmailStats {
  totalSent: number;
  totalFailed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  last24Hours: { sent: number; failed: number };
}

interface EmailBranding {
  id: string;
  logoUrl: string | null;
  logoWidth: number;
  logoHeight: number;
  siteName: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  linkColor: string;
  headerBgColor: string;
  headerTextColor: string;
  showLogoInHeader: boolean;
  headerText: string | null;
  footerBgColor: string;
  footerTextColor: string;
  showSocialLinks: boolean;
  facebookUrl: string | null;
  lineUrl: string | null;
  discordUrl: string | null;
  twitterUrl: string | null;
  youtubeUrl: string | null;
  instagramUrl: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  websiteUrl: string | null;
  companyName: string | null;
  companyAddress: string | null;
  footerText: string | null;
  copyrightText: string | null;
  showUnsubscribe: boolean;
  unsubscribeUrl: string | null;
  trackOpens: boolean;
  trackClicks: boolean;
}

type TabType = "templates" | "events" | "logs" | "branding" | "settings";

const CATEGORY_LABELS: Record<string, string> = {
  AUTHENTICATION: "การยืนยันตัวตน",
  ORDER: "คำสั่งซื้อ",
  PAYMENT: "การชำระเงิน",
  PROMOTION: "โปรโมชั่น",
  SUPPORT: "การสนับสนุน",
  SYSTEM: "ระบบ",
  GENERAL: "ทั่วไป",
};

const CATEGORY_VARIANTS: Record<string, BadgeVariant> = {
  AUTHENTICATION: "info",
  ORDER: "info",
  PAYMENT: "success",
  PROMOTION: "info",
  SUPPORT: "info",
  SYSTEM: "neutral",
  GENERAL: "warning",
};

const TABS: { id: TabType; label: string; icon: typeof FileText }[] = [
  { id: "templates", label: "เทมเพลต", icon: FileText },
  { id: "events", label: "อีเวนต์อัตโนมัติ", icon: Zap },
  { id: "logs", label: "ประวัติการส่ง", icon: Clock },
  { id: "branding", label: "แบรนด์อีเมล", icon: Palette },
  { id: "settings", label: "SMTP", icon: Settings },
];

export default function AdminEmailPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("templates");

  // Templates state
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateCategory, setTemplateCategory] = useState<string>("ALL");

  // Events state
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [eventSearch, setEventSearch] = useState("");

  // Stats
  const [stats, setStats] = useState<EmailStats | null>(null);

  // Branding state
  const [branding, setBranding] = useState<EmailBranding | null>(null);
  const [isSavingBranding, setIsSavingBranding] = useState(false);

  // SMTP Config
  const [smtpConfig, setSmtpConfig] = useState<{
    configured: boolean;
    smtp: { host: string; port: number; from: string };
  } | null>(null);

  // Fetch data on mount
  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin]);

  const fetchAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchTemplates(),
      fetchEvents(),
      fetchStats(),
      fetchConfig(),
      fetchBranding(),
    ]);
    setIsLoading(false);
  };

  const fetchTemplates = async () => {
    try {
      const response = await notificationClient.get(
        "/api/admin/email/templates",
      );
      if (response.data.success) {
        setTemplates(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await notificationClient.get("/api/admin/email/events");
      if (response.data.success) {
        setEvents(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await notificationClient.get("/api/admin/email/stats");
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await notificationClient.get("/api/admin/email/config");
      if (response.data.success) {
        setSmtpConfig(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch config:", error);
    }
  };

  const fetchBranding = async () => {
    try {
      const response = await notificationClient.get(
        "/api/admin/email/branding",
      );
      if (response.data.success) {
        setBranding(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch branding:", error);
    }
  };

  const handleSaveBranding = async (data: Partial<EmailBranding>) => {
    setIsSavingBranding(true);
    try {
      const response = await notificationClient.put(
        "/api/admin/email/branding",
        data,
      );
      if (response.data.success) {
        setBranding(response.data.data);
        toast.success("บันทึกการตั้งค่าแบรนด์เรียบร้อยแล้ว");
      }
    } catch (error) {
      toast.error("ไม่สามารถบันทึกการตั้งค่าได้");
    } finally {
      setIsSavingBranding(false);
    }
  };

  const handleSeedTemplates = async () => {
    try {
      const response = await notificationClient.post(
        "/api/admin/email/seed/templates",
      );
      if (response.data.success) {
        toast.success("สร้างเทมเพลตเริ่มต้นเรียบร้อยแล้ว");
        fetchTemplates();
      }
    } catch (error) {
      toast.error("ไม่สามารถสร้างเทมเพลตได้");
    }
  };

  const handleSeedEvents = async () => {
    try {
      const response = await notificationClient.post(
        "/api/admin/email/seed/events",
      );
      if (response.data.success) {
        toast.success("สร้างอีเวนต์เริ่มต้นเรียบร้อยแล้ว");
        fetchEvents();
      }
    } catch (error) {
      toast.error("ไม่สามารถสร้างอีเวนต์ได้");
    }
  };

  const handleToggleTemplate = async (id: string, isActive: boolean) => {
    try {
      const response = await notificationClient.put(
        `/api/admin/email/templates/${id}`,
        {
          isActive: !isActive,
        },
      );
      if (response.data.success) {
        toast.success(
          isActive ? "ปิดใช้งานเทมเพลตแล้ว" : "เปิดใช้งานเทมเพลตแล้ว",
        );
        fetchTemplates();
      }
    } catch (error) {
      toast.error("ไม่สามารถอัพเดตสถานะได้");
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบเทมเพลตนี้?")) return;

    try {
      const response = await notificationClient.delete(
        `/api/admin/email/templates/${id}`,
      );
      if (response.data.success) {
        toast.success("ลบเทมเพลตเรียบร้อยแล้ว");
        fetchTemplates();
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || "ไม่สามารถลบเทมเพลตได้",
      );
    }
  };

  const handleDuplicateTemplate = async (id: string) => {
    try {
      const response = await notificationClient.post(
        `/api/admin/email/templates/${id}/duplicate`,
      );
      if (response.data.success) {
        toast.success("คัดลอกเทมเพลตเรียบร้อยแล้ว");
        fetchTemplates();
      }
    } catch (error) {
      toast.error("ไม่สามารถคัดลอกเทมเพลตได้");
    }
  };

  const handleToggleEvent = async (id: string, isActive: boolean) => {
    try {
      const response = await notificationClient.put(
        `/api/admin/email/events/${id}`,
        {
          isActive: !isActive,
        },
      );
      if (response.data.success) {
        toast.success(
          isActive ? "ปิดใช้งานอีเวนต์แล้ว" : "เปิดใช้งานอีเวนต์แล้ว",
        );
        fetchEvents();
      }
    } catch (error) {
      toast.error("ไม่สามารถอัพเดตสถานะได้");
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบอีเวนต์นี้?")) return;

    try {
      const response = await notificationClient.delete(
        `/api/admin/email/events/${id}`,
      );
      if (response.data.success) {
        toast.success("ลบอีเวนต์เรียบร้อยแล้ว");
        fetchEvents();
      }
    } catch (error) {
      toast.error("ไม่สามารถลบอีเวนต์ได้");
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      !templateSearch ||
      t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.code.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.subject.toLowerCase().includes(templateSearch.toLowerCase());
    const matchesCategory =
      templateCategory === "ALL" || t.category === templateCategory;
    return matchesSearch && matchesCategory;
  });

  // Filter events
  const filteredEvents = events.filter((e) => {
    return (
      !eventSearch ||
      e.name.toLowerCase().includes(eventSearch.toLowerCase()) ||
      e.code.toLowerCase().includes(eventSearch.toLowerCase()) ||
      e.triggerEvent.toLowerCase().includes(eventSearch.toLowerCase())
    );
  });

  const activeTemplates = templates.filter((t) => t.isActive).length;
  const activeEvents = events.filter((e) => e.isActive).length;

  return (
    <AdminLayout>
      <PageContainer>
        <AdminPageHeader
          title="ศูนย์อีเมล"
          description="เทมเพลต อีเวนต์อัตโนมัติ แบรนด์ และประวัติการส่ง — จัดการครบในหน้าเดียว"
          icon={Mail}
          actions={
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchAllData}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              รีเฟรช
            </Button>
          }
        />

        {/* ===== SMTP status + stats strip ===== */}
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {isLoading && !stats ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-[74px] animate-pulse rounded-xl border border-site-border-soft bg-site-surface"
              />
            ))
          ) : (
            <>
              <StatStrip
                label="ส่งแล้วทั้งหมด"
                value={stats ? stats.totalSent.toLocaleString() : "—"}
                sub={stats ? `24 ชม. ${stats.last24Hours.sent} ฉบับ` : undefined}
                icon={Send}
                valueClass="text-site-text"
                chipClass="border-site-border bg-site-raised text-site-muted"
              />
              <StatStrip
                label="ส่งไม่สำเร็จ"
                value={stats ? stats.totalFailed.toLocaleString() : "—"}
                icon={XCircle}
                valueClass="text-[rgb(var(--status-danger-rgb))]"
                chipClass="border-[rgb(var(--status-danger-rgb)/0.3)] bg-[rgb(var(--status-danger-rgb)/0.1)] text-[rgb(var(--status-danger-rgb))]"
              />
              <StatStrip
                label="อัตราส่งถึง"
                value={stats ? `${stats.deliveryRate.toFixed(1)}%` : "—"}
                icon={Gauge}
                valueClass={
                  stats && stats.deliveryRate >= 95
                    ? "text-[rgb(var(--status-success-rgb))]"
                    : "text-[rgb(var(--status-warning-rgb))]"
                }
                chipClass={
                  stats && stats.deliveryRate >= 95
                    ? "border-[rgb(var(--status-success-rgb)/0.3)] bg-[rgb(var(--status-success-rgb)/0.1)] text-[rgb(var(--status-success-rgb))]"
                    : "border-[rgb(var(--status-warning-rgb)/0.3)] bg-[rgb(var(--status-warning-rgb)/0.1)] text-[rgb(var(--status-warning-rgb))]"
                }
              />
              {/* SMTP status card */}
              <div
                className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 ${
                  smtpConfig?.configured
                    ? "border-[rgb(var(--status-success-rgb)/0.3)] bg-[rgb(var(--status-success-rgb)/0.06)]"
                    : "border-[rgb(var(--status-danger-rgb)/0.3)] bg-[rgb(var(--status-danger-rgb)/0.06)]"
                }`}>
                <span
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border ${
                    smtpConfig?.configured
                      ? "border-[rgb(var(--status-success-rgb)/0.3)] bg-[rgb(var(--status-success-rgb)/0.1)] text-[rgb(var(--status-success-rgb))]"
                      : "border-[rgb(var(--status-danger-rgb)/0.3)] bg-[rgb(var(--status-danger-rgb)/0.1)] text-[rgb(var(--status-danger-rgb))]"
                  }`}>
                  {smtpConfig?.configured ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-site-dim">
                    SMTP
                  </div>
                  <div
                    className={`truncate text-sm font-bold leading-tight ${
                      smtpConfig?.configured
                        ? "text-[rgb(var(--status-success-rgb))]"
                        : "text-[rgb(var(--status-danger-rgb))]"
                    }`}>
                    {smtpConfig
                      ? smtpConfig.configured
                        ? "พร้อมใช้งาน"
                        : "ยังไม่ได้ตั้งค่า"
                      : "—"}
                  </div>
                  {smtpConfig?.configured && (
                    <div className="truncate font-mono text-[10px] text-site-dim">
                      {smtpConfig.smtp.host}:{smtpConfig.smtp.port}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ===== Segmented tabs ===== */}
        <div className="flex flex-wrap gap-1 rounded-xl border border-site-border-soft bg-site-raised p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-site-accent text-site-bg shadow-sm"
                    : "text-site-muted hover:bg-site-surface hover:text-site-text"
                }`}>
                <Icon size={13} />
                {tab.label}
                {tab.id === "templates" && templates.length > 0 && (
                  <span
                    className={`rounded-md px-1.5 font-mono text-[10px] ${
                      isActive
                        ? "bg-site-bg/20 text-site-bg"
                        : "bg-site-surface text-site-dim"
                    }`}>
                    {activeTemplates}/{templates.length}
                  </span>
                )}
                {tab.id === "events" && events.length > 0 && (
                  <span
                    className={`rounded-md px-1.5 font-mono text-[10px] ${
                      isActive
                        ? "bg-site-bg/20 text-site-bg"
                        : "bg-site-surface text-site-dim"
                    }`}>
                    {activeEvents}/{events.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ===== Tab content ===== */}
        <AnimatePresence mode="wait">
          {/* ---- TEMPLATES ---- */}
          {activeTab === "templates" && (
            <motion.div
              key="templates"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <div className="flex w-full max-w-md flex-1 gap-2">
                  <div className="flex flex-1 items-center gap-2 rounded-lg border border-site-border bg-site-raised px-3 py-1.5">
                    <Search size={14} className="flex-shrink-0 text-site-dim" />
                    <input
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                      placeholder="ค้นหาชื่อ / โค้ด / หัวข้อเทมเพลต…"
                      className="w-full bg-transparent text-[13px] text-site-text outline-none placeholder:text-site-dim"
                    />
                  </div>
                  <Select
                    value={templateCategory}
                    onValueChange={setTemplateCategory}
                  >
                    <SelectTrigger
                      className="h-[34px] w-40 rounded-lg border-site-border bg-site-raised text-xs"
                      aria-label="กรองหมวดหมู่"
                    >
                      <SelectValue placeholder="ทุกหมวดหมู่" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">ทุกหมวดหมู่</SelectItem>
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  {templates.length === 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSeedTemplates}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      สร้างเทมเพลตเริ่มต้น
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => router.push("/admin/email/new")}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    สร้างเทมเพลต
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-site-accent" />
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="rounded-2xl border border-site-border-soft bg-site-surface py-10 text-center">
                  <LayoutTemplate size={32} className="mx-auto mb-3 text-site-border" />
                  <p className="mb-3 text-sm text-site-muted">ไม่พบเทมเพลต</p>
                  <Button size="sm" onClick={handleSeedTemplates}>
                    สร้างเทมเพลตเริ่มต้น
                  </Button>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-site-border-soft bg-site-surface">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="bg-site-raised px-3.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-site-dim">
                            เทมเพลต
                          </th>
                          <th className="whitespace-nowrap bg-site-raised px-3.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-site-dim">
                            หมวดหมู่
                          </th>
                          <th className="bg-site-raised px-3.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-site-dim">
                            ตัวแปร
                          </th>
                          <th className="whitespace-nowrap bg-site-raised px-3.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-site-dim">
                            สถานะ
                          </th>
                          <th className="whitespace-nowrap bg-site-raised px-3.5 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-site-dim">
                            จัดการ
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTemplates.map((template) => (
                          <tr
                            key={template.id}
                            className="border-b border-site-border-soft transition-colors last:border-0 hover:bg-site-accent/[0.03]">
                            <td className="px-3.5 py-3">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-[13px] font-bold text-site-text">
                                  {template.name}
                                </span>
                                {template.isSystem && (
                                  <Badge variant="neutral">ระบบ</Badge>
                                )}
                              </div>
                              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-site-dim">
                                <code className="rounded bg-site-raised px-1.5 py-0.5 font-mono text-site-accent">
                                  {template.code}
                                </code>
                                <span className="truncate">{template.subject}</span>
                              </div>
                            </td>
                            <td className="px-3.5 py-3">
                              <Badge
                                variant={
                                  CATEGORY_VARIANTS[template.category] ??
                                  "neutral"
                                }>
                                {CATEGORY_LABELS[template.category] ??
                                  template.category}
                              </Badge>
                            </td>
                            <td className="px-3.5 py-3">
                              <div className="flex max-w-[220px] flex-wrap gap-1">
                                {template.placeholders.length === 0 ? (
                                  <span className="text-[11px] text-site-dim">—</span>
                                ) : (
                                  template.placeholders.slice(0, 3).map((p) => (
                                    <span
                                      key={p}
                                      className="rounded border border-site-border bg-site-raised px-1.5 py-0.5 font-mono text-[9.5px] text-site-muted">
                                      {`{{${p}}}`}
                                    </span>
                                  ))
                                )}
                                {template.placeholders.length > 3 && (
                                  <span className="font-mono text-[9.5px] text-site-dim">
                                    +{template.placeholders.length - 3}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3.5 py-3">
                              <button
                                onClick={() =>
                                  handleToggleTemplate(
                                    template.id,
                                    template.isActive,
                                  )
                                }
                                title={
                                  template.isActive
                                    ? "คลิกเพื่อปิดใช้งาน"
                                    : "คลิกเพื่อเปิดใช้งาน"
                                }
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                                  template.isActive
                                    ? "border-[rgb(var(--status-success-rgb)/0.3)] bg-[rgb(var(--status-success-rgb)/0.1)] text-[rgb(var(--status-success-rgb))] hover:bg-[rgb(var(--status-success-rgb)/0.2)]"
                                    : "border-site-border bg-site-raised text-site-dim hover:text-site-muted"
                                }`}>
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    template.isActive
                                      ? "bg-[rgb(var(--status-success-rgb))]"
                                      : "bg-site-dim"
                                  }`}
                                />
                                {template.isActive ? "ใช้งาน" : "ปิด"}
                              </button>
                            </td>
                            <td className="px-3.5 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <IconAction
                                  icon={Edit}
                                  title="แก้ไข"
                                  onClick={() =>
                                    router.push(`/admin/email/${template.id}`)
                                  }
                                />
                                <IconAction
                                  icon={Copy}
                                  title="คัดลอก"
                                  onClick={() =>
                                    handleDuplicateTemplate(template.id)
                                  }
                                />
                                <IconAction
                                  icon={Eye}
                                  title="ดูตัวอย่าง"
                                  onClick={() =>
                                    router.push(
                                      `/admin/email/${template.id}/preview`,
                                    )
                                  }
                                />
                                {!template.isSystem && (
                                  <IconAction
                                    icon={Trash2}
                                    title="ลบ"
                                    danger
                                    onClick={() =>
                                      handleDeleteTemplate(template.id)
                                    }
                                  />
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ---- EVENTS ---- */}
          {activeTab === "events" && (
            <motion.div
              key="events"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <div className="flex w-full max-w-md flex-1 items-center gap-2 rounded-lg border border-site-border bg-site-raised px-3 py-1.5">
                  <Search size={14} className="flex-shrink-0 text-site-dim" />
                  <input
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    placeholder="ค้นหาชื่อ / โค้ด / trigger ของอีเวนต์…"
                    className="w-full bg-transparent text-[13px] text-site-text outline-none placeholder:text-site-dim"
                  />
                </div>
                <div className="flex gap-2">
                  {events.length === 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSeedEvents}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      สร้างอีเวนต์เริ่มต้น
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => router.push("/admin/email/events/new")}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    สร้างอีเวนต์
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-site-accent" />
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="rounded-2xl border border-site-border-soft bg-site-surface py-10 text-center">
                  <Zap size={32} className="mx-auto mb-3 text-site-border" />
                  <p className="mb-3 text-sm text-site-muted">ไม่พบอีเวนต์</p>
                  <Button size="sm" onClick={handleSeedEvents}>
                    สร้างอีเวนต์เริ่มต้น
                  </Button>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-site-border-soft bg-site-surface">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="bg-site-raised px-3.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-site-dim">
                            อีเวนต์
                          </th>
                          <th className="whitespace-nowrap bg-site-raised px-3.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-site-dim">
                            Trigger
                          </th>
                          <th className="bg-site-raised px-3.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-site-dim">
                            เทมเพลตที่ใช้
                          </th>
                          <th className="whitespace-nowrap bg-site-raised px-3.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-site-dim">
            สถานะ
                          </th>
                          <th className="whitespace-nowrap bg-site-raised px-3.5 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-site-dim">
                            จัดการ
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEvents.map((event) => (
                          <tr
                            key={event.id}
                            className="border-b border-site-border-soft transition-colors last:border-0 hover:bg-site-accent/[0.03]">
                            <td className="px-3.5 py-3">
                              <div className="text-[13px] font-bold text-site-text">
                                {event.name}
                              </div>
                              <code className="mt-0.5 inline-block rounded bg-site-raised px-1.5 py-0.5 font-mono text-[10px] text-site-accent">
                                {event.code}
                              </code>
                            </td>
                            <td className="px-3.5 py-3">
                              <code className="rounded border border-site-border bg-site-raised px-1.5 py-0.5 font-mono text-[10px] text-site-muted">
                                {event.triggerEvent}
                              </code>
                              {event.delayMinutes > 0 && (
                                <div className="mt-1 flex items-center gap-1 text-[10.5px] text-site-dim">
                                  <Clock size={10} />
                                  หน่วง {event.delayMinutes} นาที
                                </div>
                              )}
                            </td>
                            <td className="px-3.5 py-3 text-[12px] text-site-muted">
                              {event.template?.name || "—"}
                            </td>
                            <td className="px-3.5 py-3">
                              <button
                                onClick={() =>
                                  handleToggleEvent(event.id, event.isActive)
                                }
                                title={
                                  event.isActive
                                    ? "คลิกเพื่อปิดใช้งาน"
                                    : "คลิกเพื่อเปิดใช้งาน"
                                }
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                                  event.isActive
                                    ? "border-[rgb(var(--status-success-rgb)/0.3)] bg-[rgb(var(--status-success-rgb)/0.1)] text-[rgb(var(--status-success-rgb))] hover:bg-[rgb(var(--status-success-rgb)/0.2)]"
                                    : "border-site-border bg-site-raised text-site-dim hover:text-site-muted"
                                }`}>
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    event.isActive
                                      ? "bg-[rgb(var(--status-success-rgb))]"
                                      : "bg-site-dim"
                                  }`}
                                />
                                {event.isActive ? "ทำงาน" : "ปิด"}
                              </button>
                            </td>
                            <td className="px-3.5 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <IconAction
                                  icon={Edit}
                                  title="แก้ไข"
                                  onClick={() =>
                                    router.push(`/admin/email/events/${event.id}`)
                                  }
                                />
                                <IconAction
                                  icon={Trash2}
                                  title="ลบ"
                                  danger
                                  onClick={() => handleDeleteEvent(event.id)}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ---- LOGS ---- */}
          {activeTab === "logs" && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}>
              <EmailLogsSection />
            </motion.div>
          )}

          {/* ---- BRANDING ---- */}
          {activeTab === "branding" && (
            <motion.div
              key="branding"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4">
              <EmailBrandingSection
                branding={branding}
                onSave={handleSaveBranding}
                isSaving={isSavingBranding}
              />
            </motion.div>
          )}

          {/* ---- SETTINGS ---- */}
          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="overflow-hidden rounded-2xl border border-site-border-soft bg-site-surface">
              <div className="flex items-center gap-2 border-b border-site-border-soft bg-site-raised px-4 py-3">
                <Settings size={14} className="text-site-accent" />
                <h2 className="text-sm font-bold text-site-text">การตั้งค่า SMTP</h2>
              </div>

              {smtpConfig && smtpConfig.configured ? (
                <div className="space-y-3 p-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div>
                      <Label className="mb-1 block text-xs font-bold text-site-muted">
                        Host
                      </Label>
                      <p className="rounded-lg border border-site-border bg-site-raised p-2 font-mono text-sm text-site-text">
                        {smtpConfig.smtp.host}
                      </p>
                    </div>
                    <div>
                      <Label className="mb-1 block text-xs font-bold text-site-muted">
                        Port
                      </Label>
                      <p className="rounded-lg border border-site-border bg-site-raised p-2 font-mono text-sm text-site-text">
                        {smtpConfig.smtp.port}
                      </p>
                    </div>
                    <div>
                      <Label className="mb-1 block text-xs font-bold text-site-muted">
                        From Email
                      </Label>
                      <p className="rounded-lg border border-site-border bg-site-raised p-2 font-mono text-sm text-site-text">
                        {smtpConfig.smtp.from}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-xl border border-[rgb(var(--status-warning-rgb)/0.3)] bg-[rgb(var(--status-warning-rgb)/0.08)] p-3">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-[rgb(var(--status-warning-rgb))]" />
                    <p className="text-xs leading-relaxed text-site-muted">
                      หากต้องการเปลี่ยนการตั้งค่า SMTP กรุณาแก้ไขไฟล์{" "}
                      <code className="rounded bg-site-raised px-1 py-0.5 font-mono text-site-accent">.env</code>{" "}
                      ในเซิร์ฟเวอร์แล้วรีสตาร์ทแอปพลิเคชัน
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center">
                  <AlertCircle size={32} className="mx-auto mb-3 text-[rgb(var(--status-danger-rgb))]" />
                  <p className="mb-1 text-sm font-bold text-site-text">
                    SMTP ยังไม่ได้กำหนดค่า
                  </p>
                  <p className="text-xs text-site-dim">
                    เพิ่มค่า SMTP_* ในไฟล์ .env แล้วรีสตาร์ทแอปพลิเคชัน
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </PageContainer>
    </AdminLayout>
  );
}

// ===== Small shared pieces =====

function StatStrip({
  label,
  value,
  sub,
  icon: Icon,
  valueClass,
  chipClass,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof Send;
  valueClass: string;
  chipClass: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-site-border-soft bg-site-surface px-3.5 py-3">
      <span
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border ${chipClass}`}>
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-site-dim">
          {label}
        </div>
        <div className={`font-mono text-lg font-bold leading-tight ${valueClass}`}>
          {value}
        </div>
        {sub && (
          <div className="truncate font-mono text-[10px] text-site-dim">{sub}</div>
        )}
      </div>
    </div>
  );
}

function IconAction({
  icon: Icon,
  title,
  onClick,
  danger,
}: {
  icon: typeof Edit;
  title: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`flex h-7 w-7 items-center justify-center rounded-lg border border-site-border bg-site-raised transition-colors ${
        danger
          ? "text-site-dim hover:border-[rgb(var(--status-danger-rgb)/0.4)] hover:bg-[rgb(var(--status-danger-rgb)/0.1)] hover:text-[rgb(var(--status-danger-rgb))]"
          : "text-site-muted hover:border-site-accent/40 hover:bg-site-accent/10 hover:text-site-accent"
      }`}>
      <Icon size={13} />
    </button>
  );
}

// ===== Logs Section =====

function EmailLogsSection() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await notificationClient.get("/api/admin/email/logs", {
        params: { page, limit: 20 },
      });
      if (response.data.success) {
        setLogs(response.data.data);
        setTotalPages(response.data.meta?.totalPages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const id = setTimeout(() => fetchLogs(), 0);
    return () => clearTimeout(id);
  }, [page]);

  const STATUS_STYLES: Record<string, { chip: string; dot: string }> = {
    PENDING: {
      chip: "border-site-border bg-site-raised text-site-dim",
      dot: "bg-site-dim",
    },
    SENT: {
      chip: "border-[rgb(var(--status-info-rgb)/0.3)] bg-[rgb(var(--status-info-rgb)/0.1)] text-[rgb(var(--status-info-rgb))]",
      dot: "bg-[rgb(var(--status-info-rgb))]",
    },
    DELIVERED: {
      chip: "border-[rgb(var(--status-success-rgb)/0.3)] bg-[rgb(var(--status-success-rgb)/0.1)] text-[rgb(var(--status-success-rgb))]",
      dot: "bg-[rgb(var(--status-success-rgb))]",
    },
    FAILED: {
      chip: "border-[rgb(var(--status-danger-rgb)/0.3)] bg-[rgb(var(--status-danger-rgb)/0.1)] text-[rgb(var(--status-danger-rgb))]",
      dot: "bg-[rgb(var(--status-danger-rgb))]",
    },
    BOUNCED: {
      chip: "border-[rgb(var(--status-danger-rgb)/0.3)] bg-[rgb(var(--status-danger-rgb)/0.1)] text-[rgb(var(--status-danger-rgb))]",
      dot: "bg-[rgb(var(--status-danger-rgb))]",
    },
    OPENED: {
      chip: "border-site-accent/30 bg-site-accent/10 text-site-accent",
      dot: "bg-site-accent",
    },
    CLICKED: {
      chip: "border-site-accent/30 bg-site-accent/10 text-site-accent",
      dot: "bg-site-accent",
    },
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-site-border-soft bg-site-surface">
      <div className="flex items-center gap-2 border-b border-site-border-soft bg-site-raised px-4 py-3">
        <Clock size={14} className="text-site-accent" />
        <h3 className="text-sm font-bold text-site-text">ประวัติการส่งอีเมล</h3>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-site-accent" />
        </div>
      ) : logs.length === 0 ? (
        <div className="py-10 text-center">
          <MailIcon size={32} className="mx-auto mb-3 text-site-border" />
          <p className="text-sm text-site-muted">ยังไม่มีประวัติการส่งอีเมล</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-[560px]">
            <TableHeader>
              <TableRow className="border-site-border-soft hover:bg-transparent">
                <TableHead className="h-auto px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-site-dim">ผู้รับ</TableHead>
                <TableHead className="h-auto px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-site-dim">หัวข้อ</TableHead>
                <TableHead className="h-auto px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-site-dim">สถานะ</TableHead>
                <TableHead className="h-auto px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-site-dim">เวลา</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => {
                const style = STATUS_STYLES[log.status] ?? STATUS_STYLES.PENDING;
                return (
                  <TableRow
                    key={log.id}
                    className="border-site-border-soft hover:bg-site-accent/[0.03]"
                  >
                    <TableCell className="px-3.5 py-2.5 font-mono text-xs text-site-text">
                      {log.recipient}
                    </TableCell>
                    <TableCell className="max-w-xs truncate px-3.5 py-2.5 text-xs text-site-muted">
                      {log.subject}
                    </TableCell>
                    <TableCell className="px-3.5 py-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.chip}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                        {log.status}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-3.5 py-2.5 font-mono text-[11px] text-site-dim">
                      {new Date(log.createdAt).toLocaleString("th-TH")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 border-t border-site-border-soft p-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ก่อนหน้า
          </Button>
          <span className="rounded-lg border border-site-border bg-site-raised px-3 py-1.5 font-mono text-xs text-site-muted">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            ถัดไป
          </Button>
        </div>
      )}
    </div>
  );
}

// ===== Branding Section =====

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label className="mb-1 block text-xs font-bold text-site-muted">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded-lg border border-site-border bg-site-raised"
        />
        <Input
          type="text"
          size="sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="border-site-border bg-site-raised font-mono text-xs"
        />
      </div>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Palette;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-site-border-soft bg-site-surface">
      <div className="flex items-center gap-2 border-b border-site-border-soft bg-site-raised px-4 py-3">
        <Icon size={14} className="text-site-accent" />
        <h2 className="text-sm font-bold text-site-text">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function EmailBrandingSection({
  branding,
  onSave,
  isSaving,
}: {
  branding: EmailBranding | null;
  onSave: (data: Partial<EmailBranding>) => Promise<void>;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<Partial<EmailBranding>>(branding || {});
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    if (branding) {
      // Defer to avoid cascading render (sync setState in effect)
      const id = requestAnimationFrame(() => setForm(branding));
      return () => cancelAnimationFrame(id);
    }
  }, [branding]);

  const update = (key: keyof EmailBranding, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePreview = async () => {
    setIsLoadingPreview(true);
    try {
      // Save first then preview
      await onSave(form);
      const res = await notificationClient.post(
        "/api/admin/email/branding/preview",
        {
          content: `
            <h2 style="margin: 0 0 15px 0;">สวัสดี คุณผู้ใช้งาน,</h2>
            <p style="margin: 0 0 20px 0; line-height: 1.6;">นี่คือตัวอย่างอีเมลที่จะถูกส่งไปยังลูกค้าของคุณ โดยใช้การตั้งค่าแบรนด์ปัจจุบัน</p>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid ${form.primaryColor || "#2563EB"}; margin: 20px 0;">
              <h3 style="margin: 0 0 8px 0;">รายการสั่งซื้อ #GT-20260001</h3>
              <p style="margin: 0; color: #6b7280;">Free Fire - 100 Diamonds</p>
              <p style="margin: 8px 0 0 0; font-weight: bold; color: ${form.primaryColor || "#2563EB"};">฿35.00</p>
            </div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
              <tr><td align="center">
                <a href="#" style="display: inline-block; padding: 14px 32px; background-color: ${form.primaryColor || "#2563EB"}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;">ดูรายละเอียดคำสั่งซื้อ</a>
              </td></tr>
            </table>
          `,
          title: "ตัวอย่างอีเมล",
        },
      );
      if (res.data.success) {
        setPreviewHtml(res.data.data.html);
      }
    } catch {
      toast.error("ไม่สามารถโหลดตัวอย่างได้");
    }
    setIsLoadingPreview(false);
  };

  return (
    <div className="grid grid-cols-1 items-start gap-3.5 xl:grid-cols-[1fr_360px]">
      {/* Left column: all settings */}
      <div className="space-y-3.5">
        {/* Logo & Branding */}
        <SectionCard title="โลโก้และแบรนด์" icon={Image}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label className="mb-1 block text-xs font-bold text-site-muted">
                URL โลโก้
              </Label>
              <Input
                type="url"
                size="sm"
                value={form.logoUrl || ""}
                onChange={(e) => update("logoUrl", e.target.value || null)}
                placeholder="https://example.com/logo.png"
                className="border-site-border bg-site-raised"
              />
              {form.logoUrl && (
                <div className="mt-2 flex items-center justify-center rounded-xl border border-site-border-soft bg-site-raised p-3">
                  <img
                    src={form.logoUrl}
                    alt="Logo preview"
                    style={{
                      maxWidth: form.logoWidth || 150,
                      maxHeight: form.logoHeight || 50,
                    }}
                    className="object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <Label className="mb-1 block text-xs font-bold text-site-muted">
                  ชื่อเว็บไซต์
                </Label>
                <Input
                  type="text"
                  size="sm"
                  value={form.siteName || ""}
                  onChange={(e) => update("siteName", e.target.value)}
                  className="border-site-border bg-site-raised"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1 block text-xs font-bold text-site-muted">
                    ความกว้างโลโก้ (px)
                  </Label>
                  <Input
                    type="number"
                    size="sm"
                    value={form.logoWidth || 150}
                    onChange={(e) =>
                      update("logoWidth", parseInt(e.target.value))
                    }
                    className="border-site-border bg-site-raised"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs font-bold text-site-muted">
                    ความสูงโลโก้ (px)
                  </Label>
                  <Input
                    type="number"
                    size="sm"
                    value={form.logoHeight || 50}
                    onChange={(e) =>
                      update("logoHeight", parseInt(e.target.value))
                    }
                    className="border-site-border bg-site-raised"
                  />
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2">
                <Switch
                  checked={form.showLogoInHeader ?? true}
                  onCheckedChange={(checked) =>
                    update("showLogoInHeader", checked)
                  }
                />
                <span className="text-xs font-bold text-site-text">
                  แสดงโลโก้ใน Header
                </span>
              </label>
            </div>
          </div>
        </SectionCard>

        {/* Colors */}
        <SectionCard title="สีของอีเมล" icon={Palette}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <ColorInput
              label="สีหลัก"
              value={form.primaryColor || "#6366f1"}
              onChange={(v) => update("primaryColor", v)}
            />
            <ColorInput
              label="สีรอง"
              value={form.secondaryColor || "#8b5cf6"}
              onChange={(v) => update("secondaryColor", v)}
            />
            <ColorInput
              label="สีพื้นหลัง"
              value={form.backgroundColor || "#f3f4f6"}
              onChange={(v) => update("backgroundColor", v)}
            />
            <ColorInput
              label="สีข้อความ"
              value={form.textColor || "#374151"}
              onChange={(v) => update("textColor", v)}
            />
            <ColorInput
              label="สีลิงก์"
              value={form.linkColor || "#6366f1"}
              onChange={(v) => update("linkColor", v)}
            />
          </div>
        </SectionCard>

        {/* Header Settings */}
        <SectionCard title="ตั้งค่า Header" icon={LayoutTemplate}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ColorInput
              label="สีพื้นหลัง Header"
              value={form.headerBgColor || "#6366f1"}
              onChange={(v) => update("headerBgColor", v)}
            />
            <ColorInput
              label="สีข้อความ Header"
              value={form.headerTextColor || "#ffffff"}
              onChange={(v) => update("headerTextColor", v)}
            />
            <div className="md:col-span-2">
              <Label className="mb-1 block text-xs font-bold text-site-muted">
                ข้อความ Header (ไม่บังคับ)
              </Label>
              <Input
                type="text"
                size="sm"
                value={form.headerText || ""}
                onChange={(e) => update("headerText", e.target.value || null)}
                placeholder="เช่น Lnwtermgame - บริการเติมเกมออนไลน์"
                className="border-site-border bg-site-raised"
              />
            </div>
          </div>
          {/* Header preview */}
          <div className="mt-3">
            <Label className="mb-2 block text-xs font-bold text-site-muted">
              ตัวอย่าง Header
            </Label>
            <div
              className="rounded-xl p-4 text-center"
              style={{
                backgroundColor: form.headerBgColor || "#1E3A8A",
              }}>
              {form.showLogoInHeader && form.logoUrl && (
                <img
                  src={form.logoUrl}
                  alt="Logo"
                  style={{
                    maxWidth: form.logoWidth || 150,
                    maxHeight: form.logoHeight || 50,
                    margin: "0 auto",
                  }}
                  className="block"
                />
              )}
              {form.headerText && (
                <p
                  className="mt-2 text-base font-bold"
                  style={{ color: form.headerTextColor || "#ffffff" }}>
                  {form.headerText}
                </p>
              )}
              {!form.logoUrl && !form.headerText && (
                <p
                  style={{ color: form.headerTextColor || "#ffffff" }}
                  className="text-base font-bold">
                  {form.siteName || "Lnwtermgame"}
                </p>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Footer Settings */}
        <SectionCard title="ตั้งค่า Footer" icon={FileText}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ColorInput
              label="สีพื้นหลัง Footer"
              value={form.footerBgColor || "#f9fafb"}
              onChange={(v) => update("footerBgColor", v)}
            />
            <ColorInput
              label="สีข้อความ Footer"
              value={form.footerTextColor || "#6b7280"}
              onChange={(v) => update("footerTextColor", v)}
            />
            <div>
              <Label className="mb-1 block text-xs font-bold text-site-muted">
                ข้อความ Footer
              </Label>
              <Input
                type="text"
                size="sm"
                value={form.footerText || ""}
                onChange={(e) => update("footerText", e.target.value || null)}
                placeholder="ข้อความแสดงใน Footer"
                className="border-site-border bg-site-raised"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs font-bold text-site-muted">
                ข้อความลิขสิทธิ์
              </Label>
              <Input
                type="text"
                size="sm"
                value={form.copyrightText || ""}
                onChange={(e) => update("copyrightText", e.target.value || null)}
                placeholder={`© ${new Date().getFullYear()} Lnwtermgame. All rights reserved.`}
                className="border-site-border bg-site-raised"
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <Switch
                checked={form.showSocialLinks ?? true}
                onCheckedChange={(checked) =>
                  update("showSocialLinks", checked)
                }
              />
              <span className="text-xs font-bold text-site-text">
                แสดงลิงก์โซเชียลมีเดียใน Footer
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <Switch
                checked={form.showUnsubscribe ?? true}
                onCheckedChange={(checked) =>
                  update("showUnsubscribe", checked)
                }
              />
              <span className="text-xs font-bold text-site-text">
                แสดงลิงก์ยกเลิกการรับข่าวสาร
              </span>
            </label>
          </div>
        </SectionCard>

        {/* Social Links */}
        <SectionCard title="โซเชียลมีเดียและข้อมูลติดต่อ" icon={Globe}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label className="mb-1 block text-xs font-bold text-site-muted">Facebook</Label>
              <Input
                type="url"
                size="sm"
                value={form.facebookUrl || ""}
                onChange={(e) => update("facebookUrl", e.target.value || null)}
                placeholder="https://facebook.com/..."
                className="border-site-border bg-site-raised"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs font-bold text-site-muted">LINE</Label>
              <Input
                type="url"
                size="sm"
                value={form.lineUrl || ""}
                onChange={(e) => update("lineUrl", e.target.value || null)}
                placeholder="https://line.me/..."
                className="border-site-border bg-site-raised"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs font-bold text-site-muted">Discord</Label>
              <Input
                type="url"
                size="sm"
                value={form.discordUrl || ""}
                onChange={(e) => update("discordUrl", e.target.value || null)}
                placeholder="https://discord.gg/..."
                className="border-site-border bg-site-raised"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs font-bold text-site-muted">Twitter/X</Label>
              <Input
                type="url"
                size="sm"
                value={form.twitterUrl || ""}
                onChange={(e) => update("twitterUrl", e.target.value || null)}
                placeholder="https://twitter.com/..."
                className="border-site-border bg-site-raised"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs font-bold text-site-muted">YouTube</Label>
              <Input
                type="url"
                size="sm"
                value={form.youtubeUrl || ""}
                onChange={(e) => update("youtubeUrl", e.target.value || null)}
                placeholder="https://youtube.com/..."
                className="border-site-border bg-site-raised"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs font-bold text-site-muted">Instagram</Label>
              <Input
                type="url"
                size="sm"
                value={form.instagramUrl || ""}
                onChange={(e) => update("instagramUrl", e.target.value || null)}
                placeholder="https://instagram.com/..."
                className="border-site-border bg-site-raised"
              />
            </div>
          </div>

          <hr className="my-4 border-site-border-soft" />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label className="mb-1 flex items-center gap-1 text-xs font-bold text-site-muted">
                <MailIcon className="h-3.5 w-3.5" /> อีเมลฝ่ายสนับสนุน
              </Label>
              <Input
                type="email"
                size="sm"
                value={form.supportEmail || ""}
                onChange={(e) => update("supportEmail", e.target.value || null)}
                placeholder="support@example.com"
                className="border-site-border bg-site-raised"
              />
            </div>
            <div>
              <Label className="mb-1 flex items-center gap-1 text-xs font-bold text-site-muted">
                <Phone className="h-3.5 w-3.5" /> เบอร์โทรศัพท์
              </Label>
              <Input
                type="text"
                size="sm"
                value={form.supportPhone || ""}
                onChange={(e) => update("supportPhone", e.target.value || null)}
                placeholder="02-xxx-xxxx"
                className="border-site-border bg-site-raised"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs font-bold text-site-muted">
                URL เว็บไซต์
              </Label>
              <Input
                type="url"
                size="sm"
                value={form.websiteUrl || ""}
                onChange={(e) => update("websiteUrl", e.target.value || null)}
                placeholder="https://www.example.com"
                className="border-site-border bg-site-raised"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs font-bold text-site-muted">
                URL ยกเลิกรับข่าวสาร
              </Label>
              <Input
                type="url"
                size="sm"
                value={form.unsubscribeUrl || ""}
                onChange={(e) => update("unsubscribeUrl", e.target.value || null)}
                placeholder="https://www.example.com/unsubscribe"
                className="border-site-border bg-site-raised"
              />
            </div>
          </div>

          <hr className="my-4 border-site-border-soft" />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label className="mb-1 block text-xs font-bold text-site-muted">
                ชื่อบริษัท
              </Label>
              <Input
                type="text"
                size="sm"
                value={form.companyName || ""}
                onChange={(e) => update("companyName", e.target.value || null)}
                placeholder="บริษัท ตัวอย่าง จำกัด"
                className="border-site-border bg-site-raised"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs font-bold text-site-muted">
                ที่อยู่บริษัท
              </Label>
              <Input
                type="text"
                size="sm"
                value={form.companyAddress || ""}
                onChange={(e) => update("companyAddress", e.target.value || null)}
                placeholder="123 ถนนตัวอย่าง แขวง/ตำบล..."
                className="border-site-border bg-site-raised"
              />
            </div>
          </div>
        </SectionCard>

        {/* Tracking */}
        <SectionCard title="การติดตาม" icon={Gauge}>
          <div className="flex flex-wrap gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <Switch
                checked={form.trackOpens ?? true}
                onCheckedChange={(checked) => update("trackOpens", checked)}
              />
              <span className="text-xs font-bold text-site-text">
                ติดตามการเปิดอ่าน
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <Switch
                checked={form.trackClicks ?? true}
                onCheckedChange={(checked) => update("trackClicks", checked)}
              />
              <span className="text-xs font-bold text-site-text">
                ติดตามการคลิกลิงก์
              </span>
            </label>
          </div>
        </SectionCard>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 rounded-2xl border border-site-border-soft bg-site-surface p-4 md:flex-row">
          <Button size="sm" onClick={() => onSave(form)} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            บันทึกการตั้งค่า
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePreview}
            disabled={isLoadingPreview}
          >
            {isLoadingPreview ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            บันทึกและดูตัวอย่างอีเมล
          </Button>
        </div>
      </div>

      {/* Right column: live preview */}
      <div className="sticky top-4">
        <SectionCard title="พรีวิวสด" icon={Eye}>
          {/* Mini header preview */}
          <div
            className="rounded-xl p-3 text-center"
            style={{ backgroundColor: form.headerBgColor || "#1E3A8A" }}>
            {form.showLogoInHeader && form.logoUrl && (
              <img
                src={form.logoUrl}
                alt="Logo"
                style={{
                  maxWidth: form.logoWidth || 150,
                  maxHeight: form.logoHeight || 50,
                  margin: "0 auto",
                }}
                className="block"
              />
            )}
            <p
              className="text-sm font-bold"
              style={{ color: form.headerTextColor || "#ffffff" }}>
              {form.headerText || form.siteName || "Lnwtermgame"}
            </p>
          </div>

          {/* Body preview */}
          <div
            className="mt-2 space-y-2 rounded-xl border p-3.5 text-xs leading-relaxed"
            style={{
              backgroundColor: form.backgroundColor || "#f3f4f6",
              color: form.textColor || "#374151",
            }}>
            <p>
              สวัสดี คุณผู้ใช้งาน,
            </p>
            <p>
              นี่คือตัวอย่างอีเมลที่ใช้การตั้งค่าแบรนด์
              ของคุณในขณะนี้ แก้ค่าทางซ้ายแล้วพรีวิวจะอัปเดตทันที
            </p>
            <div
              className="rounded-lg p-3"
              style={{
                borderLeft: `4px solid ${form.primaryColor || "#2563EB"}`,
                backgroundColor: "rgba(0,0,0,0.04)",
              }}>
              <p className="text-xs font-bold">รายการสั่งซื้อ #GT-20260001</p>
              <p className="mt-1 text-[11px] opacity-70">
                Free Fire - 100 Diamonds
              </p>
              <p
                className="mt-1.5 text-sm font-bold"
                style={{ color: form.primaryColor || "#2563EB" }}>
                ฿35.00
              </p>
            </div>
            <div className="pt-1 text-center">
              <span
                className="inline-block rounded-lg px-4 py-2 text-xs font-bold text-white"
                style={{ backgroundColor: form.primaryColor || "#2563EB" }}>
                ดูรายละเอียดคำสั่งซื้อ
              </span>
            </div>
            <a
              className="block pt-1 text-center text-[11px] underline"
              style={{ color: form.linkColor || "#6366f1" }}
              href="#">
              ลิงก์ตัวอย่าง (สีลิงก์)
            </a>
          </div>

          {/* Mini footer preview */}
          <div
            className="mt-2 rounded-xl p-3 text-center"
            style={{
              backgroundColor: form.footerBgColor || "#f9fafb",
              color: form.footerTextColor || "#6b7280",
            }}>
            {form.footerText && (
              <p className="text-[11px]">{form.footerText}</p>
            )}
            <p className="mt-1 text-[10px]">
              {form.copyrightText ||
                `© ${new Date().getFullYear()} ${form.siteName || "Lnwtermgame"}`}
            </p>
            {form.showSocialLinks && (
              <p className="mt-1 text-[10px] opacity-70">
                Facebook · LINE · Discord
              </p>
            )}
            {form.showUnsubscribe && (
              <p className="mt-1 text-[10px] underline opacity-70">
                ยกเลิกการรับข่าวสาร
              </p>
            )}
          </div>

          {/* Full HTML preview button result */}
          {previewHtml && (
            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between">
                <Label className="text-xs font-bold text-site-muted">
                  ผลจากเซิร์ฟเวอร์ (หลังบันทึก)
                </Label>
                <button
                  onClick={() => setPreviewHtml("")}
                  aria-label="ปิดตัวอย่าง"
                  className="text-site-dim hover:text-site-muted"
                >
                  <XCircle size={14} />
                </button>
              </div>
              <iframe
                srcDoc={previewHtml}
                className="w-full rounded-xl border border-site-border-soft"
                style={{ minHeight: 420 }}
                title="Email Preview"
              />
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
