"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "@/lib/framer-exports";
import { useAuth } from "@/lib/hooks/use-auth";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Mail,
  Send,
  Save,
  Eye,
  Code,
  FileText,
  Loader2,
  ArrowLeft,
  AlertCircle,
  Info,
  Copy,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { notificationClient } from "@/lib/client/gateway";

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
}

const CATEGORY_OPTIONS = [
  { value: "AUTHENTICATION", label: "การยืนยันตัวตน" },
  { value: "ORDER", label: "คำสั่งซื้อ" },
  { value: "PAYMENT", label: "การชำระเงิน" },
  { value: "PROMOTION", label: "โปรโมชั่น" },
  { value: "SUPPORT", label: "การสนับสนุน" },
  { value: "SYSTEM", label: "ระบบ" },
  { value: "GENERAL", label: "ทั่วไป" },
];

const COMMON_PLACEHOLDERS = [
  { name: "username", description: "ชื่อผู้ใช้" },
  { name: "email", description: "อีเมลผู้ใช้" },
  { name: "siteName", description: "ชื่อเว็บไซต์" },
  { name: "orderNumber", description: "เลขที่คำสั่งซื้อ" },
  { name: "orderDate", description: "วันที่สั่งซื้อ" },
  { name: "totalAmount", description: "ยอดรวม" },
  { name: "finalAmount", description: "ยอดสุทธิ" },
  { name: "discountAmount", description: "ส่วนลด" },
  { name: "resetUrl", description: "ลิงก์รีเซ็ตรหัสผ่าน" },
  { name: "verificationUrl", description: "ลิงก์ยืนยันอีเมล" },
  { name: "ticketNumber", description: "เลขที่ตั๋ว" },
  { name: "expiresIn", description: "เวลาหมดอายุ" },
];

export default function EmailTemplateEditorPage() {
  const router = useRouter();
  const params = useParams();
  const { isAdmin, isInitialized } = useAuth();
  const isNew = params.id === "new";

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [showVariableHelper, setShowVariableHelper] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    subject: "",
    htmlContent: getDefaultTemplate(),
    textContent: "",
    description: "",
    category: "GENERAL",
    isActive: true,
    placeholders: [] as string[],
  });

  // Preview variables
  const [previewVars, setPreviewVars] = useState<Record<string, string>>({
    username: "ผู้ใช้ทดสอบ",
    email: "test@example.com",
    siteName: "Lnwtermgame",
    orderNumber: "ORD-2024-001",
    orderDate: "22 กุมภาพันธ์ 2024",
    totalAmount: "500",
    finalAmount: "450",
    discountAmount: "50",
    resetUrl: "https://example.com/reset?token=abc123",
    verificationUrl: "https://example.com/verify?token=abc123",
    ticketNumber: "TKT-2024-001",
    expiresIn: "1 ชั่วโมง",
  });

  const [testEmail, setTestEmail] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Redirect non-admin
  useEffect(() => {
    if (isInitialized && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, isInitialized, router]);

  // Fetch template if editing
  useEffect(() => {
    if (!isNew && isAdmin) {
      fetchTemplate();
    }
  }, [params.id, isAdmin]);

  const fetchTemplate = async () => {
    try {
      const response = await notificationClient.get(
        `/api/admin/email/templates/${params.id}`,
      );
      if (response.data.success) {
        const template: EmailTemplate = response.data.data;
        setFormData({
          code: template.code,
          name: template.name,
          subject: template.subject,
          htmlContent: template.htmlContent,
          textContent: template.textContent || "",
          description: template.description || "",
          category: template.category,
          isActive: template.isActive,
          placeholders: template.placeholders,
        });
        setPreviewHtml(template.htmlContent);
      }
    } catch (error) {
      toast.error("ไม่พบเทมเพลต");
      router.push("/admin/email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.code.trim()) {
      toast.error("กรุณากรอกรหัสเทมเพลต");
      return;
    }
    if (!formData.name.trim()) {
      toast.error("กรุณากรอกชื่อเทมเพลต");
      return;
    }
    if (!formData.subject.trim()) {
      toast.error("กรุณากรอกหัวข้ออีเมล");
      return;
    }
    if (!formData.htmlContent.trim()) {
      toast.error("กรุณากรอกเนื้อหา HTML");
      return;
    }

    // Validate code format
    if (!/^[a-z0-9_]+$/.test(formData.code)) {
      toast.error("รหัสเทมเพลตต้องเป็นตัวพิมพ์เล็ก ตัวเลข และ _ เท่านั้น");
      return;
    }

    setIsSaving(true);
    try {
      if (isNew) {
        const response = await notificationClient.post(
          "/api/admin/email/templates",
          formData,
        );
        if (response.data.success) {
          toast.success("สร้างเทมเพลตเรียบร้อยแล้ว");
          router.push(`/admin/email/${response.data.data.id}`);
        }
      } else {
        const response = await notificationClient.put(
          `/api/admin/email/templates/${params.id}`,
          {
            name: formData.name,
            subject: formData.subject,
            htmlContent: formData.htmlContent,
            textContent: formData.textContent || null,
            description: formData.description || null,
            category: formData.category,
            isActive: formData.isActive,
            placeholders: formData.placeholders,
          },
        );
        if (response.data.success) {
          toast.success("บันทึกเรียบร้อยแล้ว");
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "ไม่สามารถบันทึกได้");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      toast.error("กรุณากรอกอีเมลที่จะส่งทดสอบ");
      return;
    }

    setIsSendingTest(true);
    try {
      const response = await notificationClient.post(
        "/api/admin/email/send-test",
        {
          to: testEmail,
          subject: formData.subject,
          htmlContent: formData.htmlContent,
          variables: previewVars,
        },
      );
      if (response.data.success) {
        toast.success(`ส่งอีเมลทดสอบไปที่ ${testEmail} เรียบร้อยแล้ว`);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || "ไม่สามารถส่งอีเมลได้",
      );
    } finally {
      setIsSendingTest(false);
    }
  };

  const handlePreview = useCallback(() => {
    let html = formData.htmlContent;
    // Replace placeholders with preview values
    Object.entries(previewVars).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      html = html.replace(regex, value);
    });
    setPreviewHtml(html);
    setShowPreview(true);
  }, [formData.htmlContent, previewVars]);

  const insertPlaceholder = (placeholder: string) => {
    const textarea = document.getElementById(
      "htmlContent",
    ) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.htmlContent;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = before + `{{${placeholder}}}` + after;
      setFormData({ ...formData, htmlContent: newText });
      // Update cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + placeholder.length + 4,
          start + placeholder.length + 4,
        );
      }, 0);
    }
    // Add to placeholders array if not exists
    if (!formData.placeholders.includes(placeholder)) {
      setFormData({
        ...formData,
        placeholders: [...formData.placeholders, placeholder],
      });
    }
  };

  if (!isInitialized || !isAdmin) {
    return (
      <AdminLayout title="แก้ไขเทมเพลต">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-brutal-pink animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (isLoading) {
    return (
      <AdminLayout title="แก้ไขเทมเพลต">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-brutal-pink animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isNew ? "สร้างเทมเพลตใหม่" : "แก้ไขเทมเพลต"}>
      <div className="space-y-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin/email")}
              className="p-1.5 border-[2px] border-black hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-black flex items-center gap-2">
                <Mail className="h-5 w-5 text-brutal-pink" />
                {isNew ? "สร้างเทมเพลตใหม่" : `แก้ไข: ${formData.name}`}
              </h1>
              <p className="text-gray-600 mt-0.5 text-xs">
                สร้างและแก้ไขเทมเพลตอีเมลพร้อม placeholder
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreview}
              className="flex items-center gap-2 px-3 py-1.5 border-[2px] border-black bg-white hover:bg-gray-50 font-bold text-sm"
              style={{ boxShadow: "2px 2px 0 0 #000000" }}
            >
              <Eye className="h-3.5 w-3.5" />
              ดูตัวอย่าง
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-1.5 bg-brutal-pink text-white border-[2px] border-black font-bold text-sm"
              style={{ boxShadow: "2px 2px 0 0 #000000" }}
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {isNew ? "สร้าง" : "บันทึก"}
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-4">
            {/* Basic Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-[2px] border-black"
              style={{ boxShadow: "3px 3px 0 0 #000000" }}
            >
              <div className="p-3 border-b-[2px] border-black bg-gray-50">
                <h2 className="font-bold flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  ข้อมูลเทมเพลต
                </h2>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">
                      รหัสเทมเพลต *
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          code: e.target.value.toLowerCase(),
                        })
                      }
                      disabled={!isNew}
                      placeholder="เช่น order_confirmation"
                      className="w-full px-3 py-2 border-[2px] border-black focus:outline-none focus:ring-2 focus:ring-brutal-pink disabled:bg-gray-100 text-sm"
                    />
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      ตัวพิมพ์เล็ก ตัวเลข และ _ เท่านั้น แก้ไขไม่ได้หลังสร้าง
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">
                      หมวดหมู่
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full px-3 py-2 border-[2px] border-black focus:outline-none bg-white text-sm"
                    >
                      {CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    ชื่อเทมเพลต *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="เช่น อีเมลยืนยันคำสั่งซื้อ"
                    className="w-full px-3 py-2 border-[2px] border-black focus:outline-none focus:ring-2 focus:ring-brutal-pink text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    หัวข้ออีเมล *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    placeholder="เช่น ยืนยันคำสั่งซื้อ #{{orderNumber}}"
                    className="w-full px-3 py-2 border-[2px] border-black focus:outline-none focus:ring-2 focus:ring-brutal-pink text-sm"
                  />
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    รองรับ placeholder เช่น {`{{orderNumber}}`}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    คำอธิบาย
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="อธิบายว่าเทมเพลตนี้ใช้เมื่อไหร่..."
                    rows={2}
                    className="w-full px-3 py-2 border-[2px] border-black focus:outline-none focus:ring-2 focus:ring-brutal-pink resize-none text-sm"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <span className="font-bold text-xs">เปิดใช้งาน</span>
                  </label>
                </div>
              </div>
            </motion.div>

            {/* HTML Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border-[2px] border-black"
              style={{ boxShadow: "3px 3px 0 0 #000000" }}
            >
              <div className="p-3 border-b-[2px] border-black bg-gray-50 flex items-center justify-between">
                <h2 className="font-bold flex items-center gap-2 text-base">
                  <Code className="h-4 w-4" />
                  เนื้อหา HTML
                </h2>
                <button
                  onClick={() => setShowVariableHelper(!showVariableHelper)}
                  className={`flex items-center gap-1 px-2 py-0.5 text-xs border-[2px] border-black ${
                    showVariableHelper
                      ? "bg-brutal-yellow"
                      : "bg-white hover:bg-gray-100"
                  }`}
                >
                  <Sparkles className="h-3 w-3" />
                  ตัวแปร
                </button>
              </div>

              {showVariableHelper && (
                <div className="p-3 border-b-[2px] border-gray-200 bg-blue-50">
                  <p className="text-xs font-bold mb-1.5 flex items-center gap-2">
                    <Info className="h-3.5 w-3.5" />
                    คลิกเพื่อแทรก placeholder:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_PLACEHOLDERS.map((p) => (
                      <button
                        key={p.name}
                        onClick={() => insertPlaceholder(p.name)}
                        className="px-1.5 py-0.5 text-[10px] bg-white border-[1px] border-black hover:bg-brutal-yellow transition-colors"
                        title={p.description}
                      >
                        {`{{${p.name}}}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4">
                <textarea
                  id="htmlContent"
                  value={formData.htmlContent}
                  onChange={(e) =>
                    setFormData({ ...formData, htmlContent: e.target.value })
                  }
                  placeholder="เขียน HTML สำหรับอีเมล..."
                  rows={20}
                  className="w-full px-3 py-2 border-[2px] border-black focus:outline-none focus:ring-2 focus:ring-brutal-pink font-mono text-xs resize-none"
                />
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Send Test */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border-[2px] border-black"
              style={{ boxShadow: "3px 3px 0 0 #000000" }}
            >
              <div className="p-3 border-b-[2px] border-black bg-gray-50">
                <h2 className="font-bold flex items-center gap-2 text-base">
                  <Send className="h-4 w-4" />
                  ส่งทดสอบ
                </h2>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold mb-1">
                    อีเมลที่จะส่ง
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-1.5 border-[2px] border-black focus:outline-none focus:ring-2 focus:ring-brutal-pink text-sm"
                  />
                </div>
                <button
                  onClick={handleSendTest}
                  disabled={isSendingTest || !testEmail}
                  className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-brutal-blue text-white border-[2px] border-black font-bold disabled:opacity-50 text-sm"
                >
                  {isSendingTest ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  ส่งอีเมลทดสอบ
                </button>
              </div>
            </motion.div>

            {/* Preview Variables */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white border-[2px] border-black"
              style={{ boxShadow: "3px 3px 0 0 #000000" }}
            >
              <div className="p-3 border-b-[2px] border-black bg-gray-50">
                <h2 className="font-bold flex items-center gap-2 text-base">
                  <Eye className="h-4 w-4" />
                  ค่าตัวอย่างสำหรับดูตัวอย่าง
                </h2>
              </div>
              <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                {Object.entries(previewVars).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-[10px] font-bold text-gray-500 mb-0.5">
                      {`{{${key}}}`}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) =>
                        setPreviewVars({
                          ...previewVars,
                          [key]: e.target.value,
                        })
                      }
                      className="w-full px-2 py-1.5 border-[1px] border-gray-300 focus:outline-none focus:border-black text-xs"
                    />
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Placeholders */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white border-[2px] border-black"
              style={{ boxShadow: "3px 3px 0 0 #000000" }}
            >
              <div className="p-3 border-b-[2px] border-black bg-gray-50">
                <h2 className="font-bold text-base">Placeholders ที่ใช้</h2>
              </div>
              <div className="p-3">
                {formData.placeholders.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {formData.placeholders.map((p) => (
                      <span
                        key={p}
                        className="px-1.5 py-0.5 text-[10px] bg-gray-100 border border-gray-200"
                      >
                        {`{{${p}}}`}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    ยังไม่มี placeholder ที่ใช้
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border-[2px] border-black max-w-4xl w-full max-h-[90vh] overflow-hidden"
            style={{ boxShadow: "6px 6px 0 0 #000000" }}
          >
            <div className="p-3 border-b-[2px] border-black bg-gray-50 flex items-center justify-between">
              <h2 className="font-bold flex items-center gap-2 text-base">
                <Eye className="h-4 w-4" />
                ตัวอย่างอีเมล
              </h2>
              <button
                onClick={() => setShowPreview(false)}
                className="px-3 py-1.5 border-[2px] border-black hover:bg-gray-100 text-sm"
              >
                ปิด
              </button>
            </div>
            <div className="p-3 overflow-auto max-h-[calc(90vh-60px)]">
              <iframe
                title="Email Preview"
                className="w-full min-h-[500px] border border-gray-200 bg-white"
                sandbox=""
                srcDoc={previewHtml}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AdminLayout>
  );
}

function getDefaultTemplate(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #6366f1, #8b5cf6);">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">{{siteName}}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi <strong>{{username}}</strong>,</p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">เนื้อหาอีเมลของคุณที่นี่...</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 30px; background-color: #f9fafb; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© {{siteName}}. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
