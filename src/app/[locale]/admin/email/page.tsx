"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "@/lib/framer-exports";
import { useAuth } from "@/lib/hooks/use-auth";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Mail,
  Send,
  FileText,
  Bell,
  Settings,
  Loader2,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  RefreshCw,
  AlertCircle,
  Palette,
  Image,
  Globe,
  Phone,
  Mail as MailIcon,
  Save,
} from "lucide-react";
import toast from "react-hot-toast";
import { notificationClient } from "@/lib/client/gateway";

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

const CATEGORY_COLORS: Record<string, string> = {
  AUTHENTICATION: "bg-purple-100 text-purple-700 border-purple-300",
  ORDER: "bg-[#181A1D]0/10 text-blue-400 border-blue-300",
  PAYMENT: "bg-green-500/10 text-green-400 border-green-300",
  PROMOTION: "bg-pink-100 text-pink-700 border-pink-300",
  SUPPORT: "bg-orange-100 text-orange-700 border-orange-300",
  SYSTEM: "bg-[#1A1C1E] text-gray-300 border-gray-300",
  GENERAL: "bg-yellow-500/10 text-yellow-400 border-yellow-300",
};

export default function AdminEmailPage() {
  const router = useRouter();
  const { isAdmin, isInitialized } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("templates");

  // Templates state
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateCategory, setTemplateCategory] = useState<string>("");

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

  // Redirect non-admin users
  useEffect(() => {
    if (isInitialized && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, isInitialized, router]);

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
      !templateCategory || t.category === templateCategory;
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

  if (!isInitialized || !isAdmin) {
    return (
      <AdminLayout title="จัดการอีเมล">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-pink-400 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="จัดการอีเมล">
      <div className="space-y-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Mail className="h-5 w-5 text-pink-400" />
              จัดการอีเมล
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              จัดการเทมเพลตอีเมล อีเวนต์ และดูสถิติ
            </p>
          </div>
          <button
            onClick={fetchAllData}
            className="flex items-center gap-2 px-3 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm bg-[#212328] hover:bg-[#212328]/5 font-bold text-sm">
            <RefreshCw className="h-3.5 w-3.5" />
            รีเฟรช
          </button>
        </motion.div>

        {/* SMTP Status */}
        {smtpConfig && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 border border-site-border/30 rounded-[12px] shadow-sm flex items-center gap-3 ${
              smtpConfig.configured
                ? "bg-green-50 border-green-300"
                : "bg-red-500/5 border-red-300"
            }`}>
            {smtpConfig.configured ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <div>
              <p className="font-bold text-sm">
                {smtpConfig.configured
                  ? "SMTP พร้อมใช้งาน"
                  : "SMTP ยังไม่ได้กำหนดค่า"}
              </p>
              {smtpConfig.configured && (
                <p className="text-xs text-gray-400">
                  {smtpConfig.smtp.host}:{smtpConfig.smtp.port} •{" "}
                  {smtpConfig.smtp.from}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <StatCard
              title="ส่งแล้ว"
              value={stats.totalSent.toLocaleString()}
              icon={<CheckCircle className="h-4 w-4" />}
              color="green"
            />
            <StatCard
              title="ล้มเหลว"
              value={stats.totalFailed.toLocaleString()}
              icon={<XCircle className="h-4 w-4" />}
              color="red"
            />
            <StatCard
              title="อัตราส่งถึง"
              value={`${stats.deliveryRate.toFixed(1)}%`}
              icon={<Send className="h-4 w-4" />}
              color="blue"
            />
            <StatCard
              title="24 ชม. ล่าสุด"
              value={stats.last24Hours.sent.toLocaleString()}
              icon={<Clock className="h-4 w-4" />}
              color="pink"
            />
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b-[2px] border-site-border/50">
          <div className="flex gap-0 flex-wrap">
            {[
              {
                id: "templates",
                label: "เทมเพลต",
                icon: <FileText className="h-3.5 w-3.5" />,
              },
              {
                id: "events",
                label: "อีเวนต์",
                icon: <Bell className="h-3.5 w-3.5" />,
              },
              {
                id: "branding",
                label: "แบรนด์",
                icon: <Palette className="h-3.5 w-3.5" />,
              },
              {
                id: "logs",
                label: "ประวัติ",
                icon: <Clock className="h-3.5 w-3.5" />,
              },
              {
                id: "settings",
                label: "ตั้งค่า SMTP",
                icon: <Settings className="h-3.5 w-3.5" />,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2 font-bold text-sm border border-site-border/30 rounded-[12px] shadow-sm border-b-0 transition-all ${
                  activeTab === tab.id
                    ? "bg-orange-500/10 border-site-border/50 -mb-[2px]"
                    : "bg-[#212328] border-gray-300 hover:border-gray-400"
                }`}>
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "templates" && (
            <motion.div
              key="templates"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3">
              {/* Toolbar */}
              <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                <div className="flex flex-1 gap-2">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="ค้นหาเทมเพลต..."
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                    />
                  </div>
                  <select
                    value={templateCategory}
                    onChange={(e) => setTemplateCategory(e.target.value)}
                    className="px-3 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm bg-[#212328] focus:outline-none text-sm">
                    <option value="">ทุกหมวดหมู่</option>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  {templates.length === 0 && (
                    <button
                      onClick={handleSeedTemplates}
                      className="flex items-center gap-2 px-3 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm bg-[#1A1C1E] hover:bg-site-border/30 font-bold text-sm">
                      <RefreshCw className="h-3.5 w-3.5" />
                      สร้างเทมเพลตเริ่มต้น
                    </button>
                  )}
                  <button
                    onClick={() => router.push("/admin/email/new")}
                    className="flex items-center gap-2 px-3 py-1.5 bg-pink-500 text-white border border-site-border/30 rounded-[12px] shadow-sm font-bold text-sm">
                    <Plus className="h-3.5 w-3.5" />
                    สร้างเทมเพลต
                  </button>
                </div>
              </div>

              {/* Templates List */}
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-pink-400" />
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8 bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm">
                  <FileText className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 mb-3 text-sm">ไม่พบเทมเพลต</p>
                  <button
                    onClick={handleSeedTemplates}
                    className="px-3 py-1.5 bg-pink-500 text-white border border-site-border/30 rounded-[12px] shadow-sm font-bold text-sm">
                    สร้างเทมเพลตเริ่มต้น
                  </button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredTemplates.map((template) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm p-3 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h3 className="font-bold text-base">
                              {template.name}
                            </h3>
                            <span
                              className={`px-1.5 py-0.5 text-[10px] font-bold border-[1px] ${
                                CATEGORY_COLORS[template.category]
                              }`}>
                              {CATEGORY_LABELS[template.category]}
                            </span>
                            {template.isSystem && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gray-800 text-white border-[1px] border-gray-800">
                                ระบบ
                              </span>
                            )}
                            {!template.isActive && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500/10 text-red-400 border-[1px] border-red-300">
                                ปิดใช้งาน
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-xs mb-1.5">
                            <code className="bg-[#1A1C1E] px-1 py-0.5 rounded text-pink-400">
                              {template.code}
                            </code>
                            {" • "}
                            {template.subject}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {template.placeholders.map((p) => (
                              <span
                                key={p}
                                className="px-1.5 py-0.5 text-[10px] bg-[#1A1C1E] text-gray-400 border border-site-border/30">
                                {`{{${p}}}`}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              router.push(`/admin/email/${template.id}`)
                            }
                            className="p-1.5 border border-site-border/30 rounded-[12px] shadow-sm hover:bg-[#212328]/5"
                            title="แก้ไข"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicateTemplate(template.id)}
                            className="p-1.5 border border-site-border/30 rounded-[12px] shadow-sm hover:bg-[#212328]/5"
                            title="คัดลอก"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              router.push(`/admin/email/${template.id}/preview`)
                            }
                            className="p-1.5 border border-site-border/30 rounded-[12px] shadow-sm hover:bg-[#212328]/5"
                            title="ดูตัวอย่าง"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              handleToggleTemplate(
                                template.id,
                                template.isActive,
                              )
                            }
                            className={`p-1.5 border border-site-border/30 rounded-[12px] shadow-sm ${
                              template.isActive
                                ? "bg-green-500/10 hover:bg-green-200"
                                : "bg-[#1A1C1E] hover:bg-site-border/30"
                            }`}
                            title={
                              template.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"
                            }
                          >
                            {template.isActive ? (
                              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-gray-400" />
                            )}
                          </button>
                          {!template.isSystem && (
                            <button
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="p-1.5 border border-site-border/30 rounded-[12px] shadow-sm hover:bg-red-500/100/10 text-red-600"
                              title="ลบ"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "events" && (
            <motion.div
              key="events"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3">
              {/* Toolbar */}
              <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาอีเวนต์..."
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  {events.length === 0 && (
                    <button
                      onClick={handleSeedEvents}
                      className="flex items-center gap-2 px-3 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm bg-[#1A1C1E] hover:bg-site-border/30 font-bold text-sm">
                      <RefreshCw className="h-3.5 w-3.5" />
                      สร้างอีเวนต์เริ่มต้น
                    </button>
                  )}
                  <button
                    onClick={() => router.push("/admin/email/events/new")}
                    className="flex items-center gap-2 px-3 py-1.5 bg-pink-500 text-white border border-site-border/30 rounded-[12px] shadow-sm font-bold text-sm">
                    <Plus className="h-3.5 w-3.5" />
                    สร้างอีเวนต์
                  </button>
                </div>
              </div>

              {/* Events List */}
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-pink-400" />
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="text-center py-8 bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm">
                  <Bell className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 mb-3 text-sm">ไม่พบอีเวนต์</p>
                  <button
                    onClick={handleSeedEvents}
                    className="px-3 py-1.5 bg-pink-500 text-white border border-site-border/30 rounded-[12px] shadow-sm font-bold text-sm">
                    สร้างอีเวนต์เริ่มต้น
                  </button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm p-3 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h3 className="font-bold text-base">{event.name}</h3>
                            {!event.isActive && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500/10 text-red-400 border-[1px] border-red-300">
                                ปิดใช้งาน
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-xs mb-1.5">
                            <code className="bg-[#1A1C1E] px-1 py-0.5 rounded text-pink-400">
                              {event.code}
                            </code>
                            {" → "}
                            <code className="bg-[#1A1C1E] px-1 py-0.5 rounded text-site-accent">
                              {event.triggerEvent}
                            </code>
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>เทมเพลต: {event.template?.name || "-"}</span>
                            {event.delayMinutes > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                หน่วงเวลา {event.delayMinutes} นาที
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              router.push(`/admin/email/events/${event.id}`)
                            }
                            className="p-1.5 border border-site-border/30 rounded-[12px] shadow-sm hover:bg-[#212328]/5"
                            title="แก้ไข"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              handleToggleEvent(event.id, event.isActive)
                            }
                            className={`p-1.5 border border-site-border/30 rounded-[12px] shadow-sm ${
                              event.isActive
                                ? "bg-green-500/10 hover:bg-green-200"
                                : "bg-[#1A1C1E] hover:bg-site-border/30"
                            }`}
                            title={event.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                          >
                            {event.isActive ? (
                              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-gray-400" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="p-1.5 border border-site-border/30 rounded-[12px] shadow-sm hover:bg-red-500/100/10 text-red-600"
                            title="ลบ"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "logs" && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <EmailLogsSection />
            </motion.div>
          )}

          {activeTab === "branding" && (
            <motion.div
              key="branding"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4">
              <EmailBrandingSection
                branding={branding}
                onSave={handleSaveBranding}
                isSaving={isSavingBranding}
              />
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm p-4">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                การตั้งค่า SMTP
              </h2>

              {smtpConfig ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1">
                        Host
                      </label>
                      <p className="p-2 bg-[#1A1C1E] border-[1px] border-site-border/30 text-sm">
                        {smtpConfig.smtp.host}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">
                        Port
                      </label>
                      <p className="p-2 bg-[#1A1C1E] border-[1px] border-site-border/30 text-sm">
                        {smtpConfig.smtp.port}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold mb-1">
                        From Email
                      </label>
                      <p className="p-2 bg-[#1A1C1E] border-[1px] border-site-border/30 text-sm">
                        {smtpConfig.smtp.from}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-yellow-50 border-[1px] border-yellow-300 mt-3">
                    <p className="text-xs">
                      <strong>หมายเหตุ:</strong> หากต้องการเปลี่ยนการตั้งค่า
                      SMTP กรุณาแก้ไขไฟล์ <code>.env</code> ในเซิร์ฟเวอร์
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <AlertCircle className="h-10 w-10 mx-auto text-red-500 mb-3" />
                  <p className="text-gray-500 mb-3 text-sm">SMTP ยังไม่ได้กำหนดค่า</p>
                  <p className="text-xs text-gray-400">
                    กรุณาเพิ่มค่า SMTP_* ในไฟล์ .env
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}

// Email Logs Section Component
function EmailLogsSection() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [page]);

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

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-[#1A1C1E] text-gray-300 border-gray-300",
      SENT: "bg-[#181A1D]0/10 text-blue-400 border-blue-300",
      DELIVERED: "bg-green-500/10 text-green-400 border-green-300",
      FAILED: "bg-red-500/10 text-red-400 border-red-300",
      BOUNCED: "bg-orange-100 text-orange-700 border-orange-300",
      OPENED: "bg-purple-100 text-purple-700 border-purple-300",
      CLICKED: "bg-pink-100 text-pink-700 border-pink-300",
    };
    return styles[status] || styles.PENDING;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SENT":
      case "DELIVERED":
        return <CheckCircle className="h-3.5 w-3.5" />;
      case "FAILED":
      case "BOUNCED":
        return <XCircle className="h-3.5 w-3.5" />;
      case "PENDING":
        return <Clock className="h-3.5 w-3.5" />;
      default:
        return <Mail className="h-3.5 w-3.5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-pink-400" />
      </div>
    );
  }

  return (
    <div
      className="bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm">
      <div className="p-3 border-b-[2px] border-site-border/50 bg-[#181A1D]">
        <h3 className="font-bold flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" />
          ประวัติการส่งอีเมล
        </h3>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-8">
          <Mail className="h-10 w-10 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">ยังไม่มีประวัติการส่งอีเมล</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-[1px] border-site-border/30 bg-[#181A1D]">
                <th className="text-left p-2 font-bold text-sm">ผู้รับ</th>
                <th className="text-left p-2 font-bold text-sm">หัวข้อ</th>
                <th className="text-left p-2 font-bold text-sm">สถานะ</th>
                <th className="text-left p-2 font-bold text-sm">เวลา</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-gray-100 hover:bg-[#212328]/5">
                  <td className="p-2 text-xs">{log.recipient}</td>
                  <td className="p-2 text-xs max-w-xs truncate">
                    {log.subject}
                  </td>
                  <td className="p-2">
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold border-[1px] ${getStatusBadge(
                        log.status,
                      )}`}>
                      {getStatusIcon(log.status)}
                      {log.status}
                    </span>
                  </td>
                  <td className="p-2 text-xs text-gray-500">
                    {new Date(log.createdAt).toLocaleString("th-TH")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="p-3 border-t-[2px] border-site-border/30 flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm disabled:opacity-50 text-sm">
            ก่อนหน้า
          </button>
          <span className="px-3 py-1.5 bg-[#1A1C1E] border border-site-border/30 rounded-[12px] shadow-sm text-sm">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm disabled:opacity-50 text-sm">
            ถัดไป
          </button>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "red" | "pink";
}

const statColorClasses = {
  blue: "bg-[#181A1D]0/10 text-blue-400 border-blue-300",
  green: "bg-green-500/10 text-green-400 border-green-300",
  red: "bg-red-500/10 text-red-400 border-red-300",
  pink: "bg-pink-100 text-pink-700 border-pink-300",
};

// Email Branding Section Component
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
    if (branding) setForm(branding);
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

  const ColorInput = ({
    label,
    value,
    field,
  }: {
    label: string;
    value: string;
    field: keyof EmailBranding;
  }) => (
    <div>
      <label className="block text-xs font-bold mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => update(field, e.target.value)}
          className="w-8 h-8 border border-site-border/30 rounded-[12px] shadow-sm cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => update(field, e.target.value)}
          className="flex-1 px-2 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 focus:border-site-accent focus:outline-none text-xs font-mono"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Logo & Branding */}
      <div
        className="bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm p-4">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Image className="h-4 w-4" />
          โลโก้และแบรนด์
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1">URL โลโก้</label>
            <input
              type="url"
              value={form.logoUrl || ""}
              onChange={(e) => update("logoUrl", e.target.value || null)}
              placeholder="https://example.com/logo.png"
              className="w-full px-2 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 focus:border-site-accent focus:outline-none text-sm"
            />
            {form.logoUrl && (
              <div className="mt-2 p-3 bg-[#181A1D] border border-site-border/30 rounded-[12px] shadow-sm border-site-border/30 flex items-center justify-center">
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
              <label className="block text-xs font-bold mb-1">
                ชื่อเว็บไซต์
              </label>
              <input
                type="text"
                value={form.siteName || ""}
                onChange={(e) => update("siteName", e.target.value)}
                className="w-full px-2 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 focus:border-site-accent focus:outline-none text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">
                  ความกว้างโลโก้ (px)
                </label>
                <input
                  type="number"
                  value={form.logoWidth || 150}
                  onChange={(e) =>
                    update("logoWidth", parseInt(e.target.value))
                  }
                  className="w-full px-2 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 focus:border-site-accent focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">
                  ความสูงโลโก้ (px)
                </label>
                <input
                  type="number"
                  value={form.logoHeight || 50}
                  onChange={(e) =>
                    update("logoHeight", parseInt(e.target.value))
                  }
                  className="w-full px-2 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 focus:border-site-accent focus:outline-none text-sm"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.showLogoInHeader ?? true}
                onChange={(e) => update("showLogoInHeader", e.target.checked)}
                className="w-3.5 h-3.5"
              />
              <span className="text-xs font-bold">แสดงโลโก้ใน Header</span>
            </label>
          </div>
        </div>
      </div>

      {/* Colors */}
      <div
        className="bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm p-4">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Palette className="h-4 w-4" />
          สีของอีเมล
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <ColorInput
            label="สีหลัก"
            value={form.primaryColor || "#6366f1"}
            field="primaryColor"
          />
          <ColorInput
            label="สีรอง"
            value={form.secondaryColor || "#8b5cf6"}
            field="secondaryColor"
          />
          <ColorInput
            label="สีพื้นหลัง"
            value={form.backgroundColor || "#f3f4f6"}
            field="backgroundColor"
          />
          <ColorInput
            label="สีข้อความ"
            value={form.textColor || "#374151"}
            field="textColor"
          />
          <ColorInput
            label="สีลิงก์"
            value={form.linkColor || "#6366f1"}
            field="linkColor"
          />
        </div>
      </div>

      {/* Header Settings */}
      <div
        className="bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm p-4">
        <h2 className="text-lg font-bold mb-4">ตั้งค่า Header</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ColorInput
            label="สีพื้นหลัง Header"
            value={form.headerBgColor || "#6366f1"}
            field="headerBgColor"
          />
          <ColorInput
            label="สีข้อความ Header"
            value={form.headerTextColor || "#ffffff"}
            field="headerTextColor"
          />
          <div className="md:col-span-2">
            <label className="block text-xs font-bold mb-1">
              ข้อความ Header (ไม่บังคับ)
            </label>
            <input
              type="text"
              value={form.headerText || ""}
              onChange={(e) => update("headerText", e.target.value || null)}
              placeholder="เช่น Lnwtermgame - บริการเติมเกมออนไลน์"
              className="w-full px-2 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 focus:border-site-accent focus:outline-none text-sm"
            />
          </div>
        </div>
        {/* Header preview */}
        <div className="mt-3">
          <label className="block text-xs font-bold mb-2">
            ตัวอย่าง Header
          </label>
          <div
            className="p-4 text-center rounded"
            style={{
              backgroundColor: form.headerBgColor || "#1E3A8A",
            }}
          >
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
                style={{ color: form.headerTextColor || "#ffffff" }}
              >
                {form.headerText}
              </p>
            )}
            {!form.logoUrl && !form.headerText && (
              <p
                style={{ color: form.headerTextColor || "#ffffff" }}
                className="font-bold text-base">
                {form.siteName || "Lnwtermgame"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Settings */}
      <div
        className="bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm p-4">
        <h2 className="text-lg font-bold mb-4">ตั้งค่า Footer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ColorInput
            label="สีพื้นหลัง Footer"
            value={form.footerBgColor || "#f9fafb"}
            field="footerBgColor"
          />
          <ColorInput
            label="สีข้อความ Footer"
            value={form.footerTextColor || "#6b7280"}
            field="footerTextColor"
          />
          <div>
            <label className="block text-xs font-bold mb-1">
              ข้อความ Footer
            </label>
            <input
              type="text"
              value={form.footerText || ""}
              onChange={(e) => update("footerText", e.target.value || null)}
              placeholder="ข้อความแสดงใน Footer"
              className="w-full px-2 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 focus:border-site-accent focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">
              ข้อความลิขสิทธิ์
            </label>
            <input
              type="text"
              value={form.copyrightText || ""}
              onChange={(e) => update("copyrightText", e.target.value || null)}
              placeholder={`© ${new Date().getFullYear()} Lnwtermgame. All rights reserved.`}
              className="w-full px-2 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 focus:border-site-accent focus:outline-none text-sm"
            />
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.showSocialLinks ?? true}
              onChange={(e) => update("showSocialLinks", e.target.checked)}
              className="w-3.5 h-3.5"
            />
            <span className="text-xs font-bold">
              แสดงลิงก์โซเชียลมีเดียใน Footer
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.showUnsubscribe ?? true}
              onChange={(e) => update("showUnsubscribe", e.target.checked)}
              className="w-3.5 h-3.5"
            />
            <span className="text-xs font-bold">
              แสดงลิงก์ยกเลิกการรับข่าวสาร
            </span>
          </label>
        </div>
      </div>

      {/* Social Links */}
      <div
        className="bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm p-4">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Globe className="h-4 w-4" />
          โซเชียลมีเดียและข้อมูลติดต่อ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold mb-1">Facebook</label>
            <input
              type="url"
              value={form.facebookUrl || ""}
              onChange={(e) => update("facebookUrl", e.target.value || null)}
              placeholder="https://facebook.com/..."
              className="w-full px-2 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 focus:border-site-accent focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">LINE</label>
            <input
              type="url"
              value={form.lineUrl || ""}
              onChange={(e) => update("lineUrl", e.target.value || null)}
              placeholder="https://line.me/..."
              className="w-full px-2 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 focus:border-site-accent focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Discord</label>
            <input
              type="url"
              value={form.discordUrl || ""}
              onChange={(e) => update("discordUrl", e.target.value || null)}
              placeholder="https://discord.gg/..."
              className="w-full px-2 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 focus:border-site-accent focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Twitter/X</label>
            <input
              type="url"
              value={form.twitterUrl || ""}
              onChange={(e) => update("twitterUrl", e.target.value || null)}
              placeholder="https://twitter.com/..."
              className="w-full px-2 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 focus:border-site-accent focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">YouTube</label>
            <input
              type="url"
              value={form.youtubeUrl || ""}
              onChange={(e) => update("youtubeUrl", e.target.value || null)}
              placeholder="https://youtube.com/..."
              className="w-full px-2 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 focus:border-site-accent focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Instagram</label>
            <input
              type="url"
              value={form.instagramUrl || ""}
              onChange={(e) => update("instagramUrl", e.target.value || null)}
              placeholder="https://instagram.com/..."
              className="w-full px-2 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 focus:border-site-accent focus:outline-none text-sm"
            />
          </div>
        </div>

        <hr className="my-4 border-site-border/30" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold mb-1 flex items-center gap-1">
              <MailIcon className="h-3.5 w-3.5" /> อีเมลฝ่ายสนับสนุน
            </label>
            <input
              type="email"
              value={form.supportEmail || ""}
              onChange={(e) => update("supportEmail", e.target.value || null)}
              placeholder="support@example.com"
              className="w-full px-2 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 focus:border-site-accent focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" /> เบอร์โทรศัพท์
            </label>
            <input
              type="text"
              value={form.supportPhone || ""}
              onChange={(e) => update("supportPhone", e.target.value || null)}
              placeholder="02-xxx-xxxx"
              className="w-full px-2 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 focus:border-site-accent focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">URL เว็บไซต์</label>
            <input
              type="url"
              value={form.websiteUrl || ""}
              onChange={(e) => update("websiteUrl", e.target.value || null)}
              placeholder="https://www.example.com"
              className="w-full px-2 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 focus:border-site-accent focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">
              URL ยกเลิกรับข่าวสาร
            </label>
            <input
              type="url"
              value={form.unsubscribeUrl || ""}
              onChange={(e) => update("unsubscribeUrl", e.target.value || null)}
              placeholder="https://www.example.com/unsubscribe"
              className="w-full px-2 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 focus:border-site-accent focus:outline-none text-sm"
            />
          </div>
        </div>

        <hr className="my-4 border-site-border/30" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold mb-1">ชื่อบริษัท</label>
            <input
              type="text"
              value={form.companyName || ""}
              onChange={(e) => update("companyName", e.target.value || null)}
              placeholder="บริษัท ตัวอย่าง จำกัด"
              className="w-full px-2 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 focus:border-site-accent focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">
              ที่อยู่บริษัท
            </label>
            <input
              type="text"
              value={form.companyAddress || ""}
              onChange={(e) => update("companyAddress", e.target.value || null)}
              placeholder="123 ถนนตัวอย่าง แขวง/ตำบล..."
              className="w-full px-2 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 focus:border-site-accent focus:outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* Tracking */}
      <div
        className="bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm p-4">
        <h2 className="text-lg font-bold mb-3">การติดตาม</h2>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.trackOpens ?? true}
              onChange={(e) => update("trackOpens", e.target.checked)}
              className="w-3.5 h-3.5"
            />
            <span className="text-xs font-bold">ติดตามการเปิดอ่าน</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.trackClicks ?? true}
              onChange={(e) => update("trackClicks", e.target.checked)}
              className="w-3.5 h-3.5"
            />
            <span className="text-xs font-bold">ติดตามการคลิกลิงก์</span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row gap-3">
        <button
          onClick={() => onSave(form)}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-pink-500 text-white border border-site-border/30 rounded-[12px] shadow-sm font-bold disabled:opacity-50 text-sm">
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          บันทึกการตั้งค่า
        </button>
        <button
          onClick={handlePreview}
          disabled={isLoadingPreview}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm font-bold hover:bg-[#212328]/5 disabled:opacity-50 text-sm">
          {isLoadingPreview ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
          บันทึกและดูตัวอย่างอีเมล
        </button>
      </div>

      {/* Email Preview */}
      {previewHtml && (
        <div
          className="bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm">
          <div className="p-3 border-b-[2px] border-site-border/50 bg-[#181A1D] flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2 text-sm">
              <Eye className="h-4 w-4" />
              ตัวอย่างอีเมล
            </h3>
            <button
              onClick={() => setPreviewHtml("")}
              className="p-1 hover:bg-site-border/30 rounded">
              <XCircle className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="p-3">
            <iframe
              srcDoc={previewHtml}
              className="w-full border-[1px] border-site-border/30 rounded"
              style={{ minHeight: 600 }}
              title="Email Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`p-3 border border-site-border/30 rounded-[12px] shadow-sm ${statColorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{title}</span>
        <span className="p-1.5 bg-[#212328] border-[1px] border-site-border/50">{icon}</span>
      </div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </motion.div>
  );
}
