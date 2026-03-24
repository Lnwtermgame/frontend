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
          <RefreshCw className="h-8 w-8 text-pink-400 animate-spin" />
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
            <span className="w-1.5 h-6 bg-orange-500/10 mr-2"></span>
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
              className="bg-[#212328] text-white border border-site-border/30 rounded-[12px] px-4 py-2 hover:bg-[#212328]/5 transition-colors flex items-center font-medium disabled:opacity-60">
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              รีเฟรช
            </button>
            <button
              onClick={handleCreateNew}
              className="bg-pink-500 text-white border border-site-border/30 rounded-[12px] px-4 py-2 hover:opacity-90 transition-colors flex items-center font-medium">
              <Plus className="w-4 h-4 mr-2" />
              เพิ่ม Provider
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-site-accent border border-site-border/30 rounded-[12px] p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-white">
              การตั้งค่า OAuth ผ่าน Environment Variables
            </h3>
            <p className="text-sm text-white mt-1">
              ข้อมูลรับรอง (Client ID, Client Secret) ถูกย้ายไปอยู่ในไฟล์{" "}
              <code>.env</code> แล้ว ไม่จำเป็นต้องตั้งค่าในนี้อีกต่อไป
              หน้านี้ใช้สำหรับเปิด/ปิดการใช้งาน Provider เท่านั้น
            </p>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            className="bg-[#212328] border border-site-border/30 rounded-[16px] p-4">
            <p className="text-gray-400 text-xs mb-1">ทั้งหมด</p>
            <p className="text-2xl font-black text-white">{providers.length}</p>
          </div>
          <div
            className="bg-[#212328] border border-site-border/30 rounded-[16px] p-4">
            <p className="text-gray-400 text-xs mb-1">เปิดใช้งาน</p>
            <p className="text-2xl font-black text-green-600">
              {providers.filter((p) => p.isEnabled).length}
            </p>
          </div>
        </div>

        {/* Providers Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 text-pink-400 animate-spin" />
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-12 bg-[#212328] border border-site-border/30 rounded-[16px]">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">
              ยังไม่มี OAuth Provider
            </h3>
            <p className="text-gray-400 mb-4">
              เพิ่ม Provider เพื่อเปิดใช้งานการล็อกอินภายนอก
            </p>
            <button
              onClick={handleCreateNew}
              className="bg-pink-500 text-white border border-site-border/30 rounded-[12px] px-6 py-2 hover:opacity-90 transition-colors font-medium">
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
                className="bg-[#212328] border border-site-border/30 rounded-[16px] overflow-hidden">
                {/* Provider Header */}
                <div className="p-4 border-b-[3px] border-site-border/50 bg-[#181A1D]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {provider.iconUrl ? (
                        <img
                          src={provider.iconUrl}
                          alt={provider.displayName}
                          className="w-10 h-10 object-contain"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-site-border/30 border border-site-border/30 rounded-[12px] shadow-sm flex items-center justify-center">
                          <Globe className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-white">
                          {provider.displayName}
                        </h3>
                        <p className="text-xs text-gray-500 font-mono">
                          {provider.name}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle(provider)}
                      className={`relative w-14 h-8 border border-site-border/30 rounded-[12px] transition-colors ${
                        provider.isEnabled ? "bg-green-500" : "bg-gray-300"
                      }`}
                      title={provider.isEnabled ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm transition-transform ${
                          provider.isEnabled ? "left-7" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Provider Details */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">สถานะ</span>
                    <span
                      className={`px-2 py-0.5 text-xs font-bold border border-site-border/30 rounded-[12px] shadow-sm ${
                        provider.isEnabled
                          ? "bg-green-500/10 text-green-400 border-green-500/30/30"
                          : "bg-[#1A1C1E] text-gray-400 border-gray-400"
                      }`}>
                      {provider.isEnabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">ลำดับ</span>
                    <span className="text-xs font-mono bg-[#1A1C1E] px-2 py-0.5">
                      {provider.sortOrder}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 border-t-[3px] border-site-border/50 flex gap-2">
                  <button
                    onClick={() => handleEdit(provider)}
                    className="flex-1 py-2 text-sm bg-[#212328] text-white border border-site-border/30 rounded-[12px] shadow-sm hover:bg-[#212328]/5 transition-colors font-medium flex items-center justify-center gap-2">
                    <Pencil className="w-4 h-4" /> แก้ไข
                  </button>
                  <button
                    onClick={() => handleDelete(provider)}
                    disabled={provider.isEnabled}
                    className={`py-2 px-4 text-sm border border-site-border/30 rounded-[12px] shadow-sm transition-colors flex items-center justify-center ${
                      provider.isEnabled
                        ? "text-gray-400 border-gray-300 cursor-not-allowed"
                        : "bg-red-500/10 text-red-400 hover:bg-red-200"
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
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
              <div
                className="bg-[#212328] border border-site-border/30 rounded-[16px] w-full max-w-lg max-h-[90vh] overflow-y-auto my-8">
                <div className="flex items-center justify-between p-4 border-b-[3px] border-site-border/50 bg-orange-500/10 sticky top-0 z-10">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    {editingProvider
                      ? `แก้ไข ${editingProvider.displayName}`
                      : "เพิ่ม OAuth Provider"}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 text-white hover:bg-black/10 transition-colors border border-site-border/30 rounded-[12px] shadow-sm">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Preset buttons (for new providers) */}
                  {!editingProvider && (
                    <div className="bg-[#181A1D] border border-site-border/30 rounded-[12px] shadow-sm p-4">
                      <label className="block text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <Globe className="w-4 h-4" /> เลือกจาก Template
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {Object.keys(DEFAULT_OAUTH_CONFIGS).map(
                          (presetName) => (
                            <button
                              key={presetName}
                              type="button"
                              onClick={() => handlePresetSelect(presetName)}
                              className="px-3 py-2 text-sm bg-[#212328] text-white border border-site-border/30 rounded-[12px] shadow-sm hover:bg-orange-500/10 transition-colors font-medium">
                              {DEFAULT_OAUTH_CONFIGS[presetName].displayName}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Basic Info */}
                  <div className="bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm p-4">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <Globe className="w-4 h-4" /> ข้อมูลพื้นฐาน
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-white mb-2">
                          Provider Name *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="google, discord, facebook"
                          disabled={!!editingProvider}
                          className="w-full px-3 py-2 border border-site-border/30 rounded-[12px] shadow-sm bg-[#212328] text-white disabled:opacity-50 disabled:bg-[#1A1C1E] text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          ใช้ตัวพิมพ์เล็ก ไม่มีช่องว่าง (ต้องตรงกับชื่อใน .env)
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-white mb-2">
                          Display Name *
                        </label>
                        <input
                          type="text"
                          value={formData.displayName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              displayName: e.target.value,
                            })
                          }
                          placeholder="Google, Discord, Facebook"
                          className="w-full px-3 py-2 border border-site-border/30 rounded-[12px] shadow-sm bg-[#212328] text-white text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          ชื่อที่แสดงให้ผู้ใช้เห็น
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Display Settings */}
                  <div className="bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm p-4">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <Image className="w-4 h-4" /> การตั้งค่าการแสดงผล
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-white mb-2 flex items-center gap-1">
                          <Image className="w-4 h-4" /> Icon URL
                        </label>
                        <input
                          type="url"
                          value={formData.iconUrl}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              iconUrl: e.target.value,
                            })
                          }
                          placeholder="/brand-icons/google.svg"
                          className="w-full px-3 py-2 border border-site-border/30 rounded-[12px] shadow-sm bg-[#212328] text-white font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          ไอคอนที่แสดงบนหน้า Login (ใช้ path หรือ URL)
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-white mb-2 flex items-center gap-1">
                          <SortAsc className="w-4 h-4" /> Sort Order
                        </label>
                        <input
                          type="number"
                          value={formData.sortOrder}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sortOrder: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 border border-site-border/30 rounded-[12px] shadow-sm bg-[#212328] text-white text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          ตัวเลขน้อยแสดงก่อน
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Credentials Info */}
                  <div className="bg-site-accent border border-site-border/30 rounded-[12px] shadow-sm p-4">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <Info className="w-4 h-4" /> การตั้งค่าข้อมูลรับรอง
                    </h3>
                    <p className="text-sm text-white mb-3">
                      ข้อมูลรับรอง (Client ID, Client Secret)
                      ถูกย้ายไปอยู่ในไฟล์
                      <code className="bg-[#212328]/50 px-1 py-0.5 border border-site-border/50 mx-1">
                        services/frontend/.env
                      </code>{" "}
                      แล้ว
                    </p>
                    <ul className="text-xs text-white space-y-1 list-disc list-inside">
                      <li>DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET</li>
                      <li>GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET</li>
                    </ul>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex justify-end gap-3 pt-6 border-t-[3px] border-site-border/50 bg-[#181A1D] -mx-6 px-6 -mb-6">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-6 py-2 text-white border border-site-border/30 rounded-[12px] shadow-sm hover:bg-[#212328]/5 transition-colors font-medium">
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white border border-site-border/30 rounded-[12px] shadow-sm hover:opacity-90 disabled:opacity-50 transition-colors font-bold">
                      {saving ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {editingProvider ? "อัปเดต" : "สร้าง"}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )}
      </div>
    </AdminLayout>
  );
}
