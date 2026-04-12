"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "@/lib/framer-exports";
import AdminLayout from "@/components/layout/AdminLayout";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  oauthProviderApi,
  OAuthProvider,
  DEFAULT_OAUTH_CONFIGS,
} from "@/lib/services/oauth-provider-api";
import {
  Trash2,
  Plus,
  RefreshCw,
  Pencil,
  X,
  Save,
  Globe,
  Image,
  SortAsc,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

interface ProviderFormData {
  name: string;
  displayName: string;
  isEnabled: boolean;
  iconUrl: string;
  sortOrder: number;
}

const emptyFormData: ProviderFormData = {
  name: "",
  displayName: "",
  isEnabled: false,
  iconUrl: "",
  sortOrder: 0,
};

export default function OAuthProvidersPage() {
  const t = useTranslations("AdminPage");
  const router = useRouter();
  const { isAdmin, isInitialized } = useAuth();

  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<OAuthProvider | null>(
    null,
  );
  const [formData, setFormData] = useState<ProviderFormData>(emptyFormData);

  // Redirect non-admin users
  useEffect(() => {
    if (isInitialized && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, isInitialized, router]);

  const fetchProviders = useCallback(async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      const response = await oauthProviderApi.getProviders();
      setProviders(response.data || []);
    } catch (error) {
      toast.error(t("oauth.load_error"));
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleToggle = async (provider: OAuthProvider) => {
    try {
      await oauthProviderApi.toggleProvider(provider.id);
      toast.success(
        provider.isEnabled
          ? `ปิดใช้งาน ${provider.displayName} แล้ว`
          : `เปิดใช้งาน ${provider.displayName} แล้ว`,
      );
      fetchProviders();
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || "ไม่สามารถเปลี่ยนสถานะได้",
      );
    }
  };

  const handleDelete = async (provider: OAuthProvider) => {
    if (
      !confirm(
        `ยืนยันการลบ ${provider.displayName}?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`,
      )
    ) {
      return;
    }

    try {
      await oauthProviderApi.deleteProvider(provider.id);
      toast.success(`ลบ ${provider.displayName} สำเร็จ`);
      fetchProviders();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "ไม่สามารถลบได้");
    }
  };

  const handleCreateNew = () => {
    setEditingProvider(null);
    setFormData(emptyFormData);
    setShowModal(true);
  };

  const handleEdit = (provider: OAuthProvider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      displayName: provider.displayName,
      isEnabled: provider.isEnabled,
      iconUrl: provider.iconUrl || "",
      sortOrder: provider.sortOrder,
    });
    setShowModal(true);
  };

  const handlePresetSelect = (presetName: string) => {
    const preset = DEFAULT_OAUTH_CONFIGS[presetName];
    if (preset) {
      setFormData({
        ...emptyFormData,
        name: preset.name || presetName,
        displayName: preset.displayName || presetName,
        iconUrl: preset.iconUrl || "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.displayName) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      setSaving(true);

      if (editingProvider) {
        // Update existing
        const updateData: Record<string, any> = {};
        if (formData.displayName !== editingProvider.displayName)
          updateData.displayName = formData.displayName;
        if (formData.iconUrl !== editingProvider.iconUrl)
          updateData.iconUrl = formData.iconUrl;
        updateData.sortOrder = formData.sortOrder;

        await oauthProviderApi.updateProvider(editingProvider.id, updateData);
        toast.success(`อัปเดต ${formData.displayName} สำเร็จ`);
      } else {
        // Create new
        await oauthProviderApi.createProvider({
          name: formData.name.toLowerCase().replace(/\s+/g, "-"),
          displayName: formData.displayName,
          isEnabled: false,
          iconUrl: formData.iconUrl || undefined,
          sortOrder: formData.sortOrder,
        });
        toast.success(`สร้าง ${formData.displayName} สำเร็จ`);
      }

      setShowModal(false);
      fetchProviders();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "ไม่สามารถบันทึกได้");
    } finally {
      setSaving(false);
    }
  };

  if (!isInitialized || !isAdmin) {
    return (
      <AdminLayout title="OAuth Providers">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 text-site-accent animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="OAuth Providers">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-site-accent to-site-accent/80 rounded-xl flex items-center justify-center mr-3"><Globe className="w-5 h-5 text-white" /></div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                จัดการ OAuth Providers
              </h1>
              <p className="text-gray-400 text-sm">
                เปิด/ปิด การล็อกอินภายนอก (Google, Discord, ฯลฯ)
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchProviders}
              disabled={loading}
              className="bg-site-raised text-white border border-white/5 rounded-xl px-4 py-2 hover:bg-white/5 transition-all flex items-center font-medium disabled:opacity-60">
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              รีเฟรช
            </button>
            <button
              onClick={handleCreateNew}
              className="bg-gradient-to-r from-site-accent to-site-accent/80 text-white border border-white/5 rounded-xl px-4 py-2 hover:from-site-accent hover:to-site-accent/60 transition-all flex items-center font-medium">
              <Plus className="w-4 h-4 mr-2" />
              เพิ่ม Provider
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-site-accent/10 border border-site-accent/20 rounded-2xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-site-accent flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-site-accent">
              การตั้งค่า OAuth ผ่าน Environment Variables
            </h3>
            <p className="text-sm text-site-accent mt-1">
              ข้อมูลรับรอง (Client ID, Client Secret) ถูกย้ายไปอยู่ในไฟล์{" "}
              <code>.env</code> แล้ว ไม่จำเป็นต้องตั้งค่าในนี้อีกต่อไป
              หน้านี้ใช้สำหรับเปิด/ปิดการใช้งาน Provider เท่านั้น
            </p>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            className="bg-site-surface border border-white/5 rounded-2xl p-4">
            <p className="text-gray-400 text-xs mb-1">ทั้งหมด</p>
            <p className="text-2xl font-black text-white">{providers.length}</p>
          </div>
          <div
            className="bg-site-surface border border-white/5 rounded-2xl p-4">
            <p className="text-gray-400 text-xs mb-1">เปิดใช้งาน</p>
            <p className="text-2xl font-black text-green-600">
              {providers.filter((p) => p.isEnabled).length}
            </p>
          </div>
        </div>

        {/* Providers Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 text-site-accent animate-spin" />
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-12 bg-site-surface border border-white/5 rounded-2xl">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">
              ยังไม่มี OAuth Provider
            </h3>
            <p className="text-gray-400 mb-4">
              เพิ่ม Provider เพื่อเปิดใช้งานการล็อกอินภายนอก
            </p>
            <button
              onClick={handleCreateNew}
              className="bg-gradient-to-r from-site-accent to-site-accent/80 text-white px-6 py-2 rounded-xl text-sm font-medium hover:from-site-accent hover:to-site-accent/60 transition-all">
              <Plus className="w-4 h-4 inline mr-2" />
              เพิ่ม Provider
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <motion.div
                key={provider.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-site-surface border border-white/5 rounded-2xl overflow-hidden">
                {/* Provider Header */}
                <div className="p-5 border-b border-white/5 bg-site-surface/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {provider.iconUrl ? (
                        <img
                          src={provider.iconUrl}
                          alt={provider.displayName}
                          className="w-10 h-10 object-contain"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-site-raised border border-white/5 rounded-xl flex items-center justify-center">
                          <Globe className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-site-accent">
                          {provider.displayName}
                        </h3>
                        <p className="text-xs text-gray-400 font-mono">
                          {provider.name}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle(provider)}
                      className={`relative w-14 h-8 border border-white/5 rounded-full transition-colors ${provider.isEnabled ? "bg-green-500" : "bg-site-raised hover:bg-white/5"
                        }`}
                      title={provider.isEnabled ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                    >
                      <span
                        className={`absolute top-1 w-6 h-6 bg-site-raised border border-white/10 rounded-full transition-transform ${provider.isEnabled ? "left-7" : "left-1"
                          }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Provider Details */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">สถานะ</span>
                    <span
                      className={`px-2 py-0.5 text-xs font-bold border rounded bg-site-raised ${provider.isEnabled
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : "bg-site-raised text-gray-400 border-white/5"
                        }`}>
                      {provider.isEnabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">ลำดับ</span>
                    <span className="text-xs font-mono bg-site-raised border border-white/5 rounded px-2 py-0.5 text-gray-300">
                      {provider.sortOrder}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-white/5 flex gap-2">
                  <button
                    onClick={() => handleEdit(provider)}
                    className="flex-1 py-2 px-4 text-sm bg-site-raised text-white border border-white/5 rounded-xl hover:bg-white/5 transition-all font-medium flex items-center justify-center gap-2">
                    <Pencil className="w-4 h-4" /> แก้ไข
                  </button>
                  <button
                    onClick={() => handleDelete(provider)}
                    disabled={provider.isEnabled}
                    className={`py-2 px-4 text-sm border border-white/5 rounded-xl transition-all flex items-center justify-center ${provider.isEnabled
                      ? "text-gray-400 bg-site-raised/50 cursor-not-allowed border-transparent"
                      : "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"
                      }`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal &&
          typeof window !== "undefined" &&
          createPortal(
            <div
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4"
              onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-site-raised border border-white/10 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Globe className="w-6 h-6 text-site-accent" />
                    {editingProvider
                      ? `แก้ไข ${editingProvider.displayName}`
                      : "เพิ่ม OAuth Provider"}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors hidden sm:block">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                  <div className="p-5 overflow-y-auto space-y-5">

                    {/* Preset buttons (for new providers) */}
                    {!editingProvider && (
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                          <Globe className="w-4 h-4 text-site-accent" /> เลือกจาก Template
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {Object.keys(DEFAULT_OAUTH_CONFIGS).map((presetName) => (
                            <button
                              key={presetName}
                              type="button"
                              onClick={() => handlePresetSelect(presetName)}
                              className="px-3 py-1.5 text-xs bg-white/5 text-white border border-white/10 rounded-lg hover:border-site-accent/50 hover:text-site-accent transition-all font-medium">
                              {DEFAULT_OAUTH_CONFIGS[presetName].displayName}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Basic Info */}
                    <div className="bg-site-surface border border-white/5 rounded-2xl p-5 space-y-4">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                        <Globe className="w-4 h-4 text-site-accent" /> ข้อมูลพื้นฐาน
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-300 mb-2">
                            Provider Name <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="google, discord, facebook"
                            disabled={!!editingProvider}
                            className="w-full bg-site-raised border border-white/5 rounded-xl px-4 py-2.5 text-white placeholder-[var(--site-text-muted)] text-sm focus:ring-1 focus:ring-site-accent/50 focus:border-site-accent/50 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                            <Info className="w-3 h-3" /> ใช้ตัวพิมพ์เล็ก ไม่มีช่องว่าง (ต้องตรงกับชื่อใน .env)
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-300 mb-2">
                            Display Name <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.displayName}
                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                            placeholder="Google, Discord, Facebook"
                            className="w-full bg-site-raised border border-white/5 rounded-xl px-4 py-2.5 text-white placeholder-[var(--site-text-muted)] text-sm focus:ring-1 focus:ring-site-accent/50 focus:border-site-accent/50 outline-none transition-all"
                          />
                          <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                            <Info className="w-3 h-3" /> ชื่อที่แสดงให้ผู้ใช้เห็น
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Display Settings */}
                    <div className="bg-site-surface border border-white/5 rounded-2xl p-5 space-y-4">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                        <Image className="w-4 h-4 text-site-accent" /> การตั้งค่าการแสดงผล
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-300 mb-2 flex items-center gap-1">
                            <Image className="w-3.5 h-3.5" /> Icon URL
                          </label>
                          <input
                            type="text"
                            value={formData.iconUrl}
                            onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                            placeholder="/brand-icons/google.svg"
                            className="w-full bg-site-raised border border-white/5 rounded-xl px-4 py-2.5 text-white font-mono placeholder-[var(--site-text-muted)] text-sm focus:ring-1 focus:ring-site-accent/50 focus:border-site-accent/50 outline-none transition-all"
                          />
                          <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                            <Info className="w-3 h-3" /> ไอคอนที่แสดงบนหน้า Login (ใช้ path หรือ URL)
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-300 mb-2 flex items-center gap-1">
                            <SortAsc className="w-3.5 h-3.5" /> Sort Order
                          </label>
                          <input
                            type="number"
                            value={formData.sortOrder}
                            onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                            className="w-full bg-site-raised border border-white/5 rounded-xl px-4 py-2.5 text-white placeholder-[var(--site-text-muted)] text-sm focus:ring-1 focus:ring-site-accent/50 focus:border-site-accent/50 outline-none transition-all"
                          />
                          <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                            <Info className="w-3 h-3" /> ตัวเลขน้อยแสดงก่อน
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Credentials Info */}
                    <div className="bg-site-accent/10 border border-site-accent/20 rounded-2xl p-5">
                      <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4 text-site-accent" /> การตั้งค่าข้อมูลรับรอง
                      </h3>
                      <p className="text-[11px] text-gray-300 mb-2 leading-relaxed">
                        ข้อมูลรับรอง (Client ID, Client Secret) ถูกย้ายไปอยู่ในไฟล์{" "}
                        <code className="bg-site-accent/20 text-site-accent px-1.5 py-0.5 rounded font-mono border border-site-accent/30">
                          services/frontend/.env
                        </code>{" "}
                        แล้ว
                      </p>
                      <ul className="text-[11px] text-site-accent/70/70 space-y-1 list-disc list-inside bg-black/20 p-3 rounded-xl border border-site-accent/10 font-mono mt-3">
                        <li>DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET</li>
                        <li>GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET</li>
                      </ul>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t border-white/5 bg-site-raised flex items-center justify-end gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-5 py-2.5 bg-white/5 text-white border border-white/5 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium">
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 bg-gradient-to-r from-site-accent to-site-accent/80 text-white rounded-xl text-sm font-medium hover:from-site-accent hover:to-site-accent/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                      {saving ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {editingProvider ? "อัปเดต" : "สร้าง Provider"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>,
            document.body,
          )}
      </div>
    </AdminLayout>
  );
}
