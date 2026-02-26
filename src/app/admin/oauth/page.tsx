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
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Key,
  Copy,
  Check,
  Pencil,
  X,
  Save,
  Shield,
  Globe,
  Lock,
  Link2,
  Image,
  SortAsc,
} from "lucide-react";
import toast from "react-hot-toast";

interface ProviderFormData {
  name: string;
  displayName: string;
  isEnabled: boolean;
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string;
  iconUrl: string;
  sortOrder: number;
}

const emptyFormData: ProviderFormData = {
  name: "",
  displayName: "",
  isEnabled: false,
  clientId: "",
  clientSecret: "",
  authorizationUrl: "",
  tokenUrl: "",
  userInfoUrl: "",
  scope: "",
  iconUrl: "",
  sortOrder: 0,
};

export default function OAuthProvidersPage() {
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
  const [copied, setCopied] = useState<string | null>(null);

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
      toast.error("ไม่สามารถโหลดข้อมูล OAuth Providers ได้");
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
      clientId: provider.clientId || "",
      clientSecret: "",
      authorizationUrl: provider.authorizationUrl || "",
      tokenUrl: provider.tokenUrl || "",
      userInfoUrl: provider.userInfoUrl || "",
      scope: provider.scope || "",
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
        authorizationUrl: preset.authorizationUrl || "",
        tokenUrl: preset.tokenUrl || "",
        userInfoUrl: preset.userInfoUrl || "",
        scope: preset.scope || "",
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
        if (formData.clientId) updateData.clientId = formData.clientId;
        if (formData.clientSecret)
          updateData.clientSecret = formData.clientSecret;
        if (formData.authorizationUrl)
          updateData.authorizationUrl = formData.authorizationUrl;
        if (formData.tokenUrl) updateData.tokenUrl = formData.tokenUrl;
        if (formData.userInfoUrl) updateData.userInfoUrl = formData.userInfoUrl;
        if (formData.scope) updateData.scope = formData.scope;
        if (formData.iconUrl) updateData.iconUrl = formData.iconUrl;
        updateData.sortOrder = formData.sortOrder;

        await oauthProviderApi.updateProvider(editingProvider.id, updateData);
        toast.success(`อัปเดต ${formData.displayName} สำเร็จ`);
      } else {
        // Create new
        await oauthProviderApi.createProvider({
          name: formData.name.toLowerCase().replace(/\s+/g, "-"),
          displayName: formData.displayName,
          isEnabled: false,
          clientId: formData.clientId || undefined,
          clientSecret: formData.clientSecret || undefined,
          authorizationUrl: formData.authorizationUrl || undefined,
          tokenUrl: formData.tokenUrl || undefined,
          userInfoUrl: formData.userInfoUrl || undefined,
          scope: formData.scope || undefined,
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

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const getRedirectUri = (providerName: string) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/api/auth/callback/${providerName}`;
  };

  if (!isInitialized || !isAdmin) {
    return (
      <AdminLayout title="OAuth Providers">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-brutal-pink animate-spin" />
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
            <span className="w-1.5 h-6 bg-brutal-yellow mr-2"></span>
            <div>
              <h1 className="text-2xl font-bold text-black">
                จัดการ OAuth Providers
              </h1>
              <p className="text-gray-600 text-sm">
                ตั้งค่าระบบล็อกอินภายนอก (Google, Discord, ฯลฯ)
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchProviders}
              disabled={loading}
              className="bg-white text-black border-[3px] border-black px-4 py-2 hover:bg-gray-50 transition-colors flex items-center font-medium disabled:opacity-60"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              รีเฟรช
            </button>
            <button
              onClick={handleCreateNew}
              className="bg-brutal-pink text-white border-[3px] border-black px-4 py-2 hover:opacity-90 transition-colors flex items-center font-medium"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
            >
              <Plus className="w-4 h-4 mr-2" />
              เพิ่ม Provider
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            className="bg-white border-[3px] border-black p-4"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <p className="text-xs text-gray-500">ทั้งหมด</p>
            <p className="text-2xl font-bold text-black">{providers.length}</p>
          </div>
          <div
            className="bg-white border-[3px] border-black p-4"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <p className="text-xs text-gray-500">เปิดใช้งาน</p>
            <p className="text-2xl font-bold text-green-600">
              {providers.filter((p) => p.isEnabled).length}
            </p>
          </div>
          <div
            className="bg-white border-[3px] border-black p-4"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <p className="text-xs text-gray-500">ปิดใช้งาน</p>
            <p className="text-2xl font-bold text-gray-400">
              {providers.filter((p) => !p.isEnabled).length}
            </p>
          </div>
          <div
            className="bg-white border-[3px] border-black p-4"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <p className="text-xs text-gray-500">พร้อมใช้งาน</p>
            <p className="text-2xl font-bold text-brutal-blue">
              {providers.filter((p) => p.clientId && p.clientSecret).length}
            </p>
          </div>
        </div>

        {/* Providers Grid */}
        {loading ? (
          <div
            className="flex items-center justify-center py-12 bg-white border-[3px] border-black"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <Loader2 className="w-8 h-8 animate-spin text-brutal-pink" />
            <span className="ml-3 text-gray-600">กำลังโหลด...</span>
          </div>
        ) : providers.length === 0 ? (
          <motion.div
            className="text-center py-12 bg-white border-[3px] border-black"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Key className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-black mb-2">
              ยังไม่มี OAuth Providers
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              เริ่มต้นโดยเพิ่ม provider เช่น Google หรือ Discord
              เพื่อให้ผู้ใช้สามารถล็อกอินด้วยบัญชีภายนอกได้
            </p>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 px-6 py-3 bg-brutal-yellow text-black border-[3px] border-black font-bold hover:opacity-90 transition-colors"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
            >
              <Plus className="w-5 h-5" />
              เพิ่ม Provider แรก
            </button>
          </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider, index) => (
              <motion.div
                key={provider.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white border-[3px] border-black ${
                  provider.isEnabled ? "" : "opacity-75"
                }`}
                style={{ boxShadow: "4px 4px 0 0 #000000" }}
              >
                {/* Provider Header */}
                <div className="flex items-center justify-between p-4 border-b-[3px] border-black bg-gray-50">
                  <div className="flex items-center gap-3">
                    {provider.iconUrl ? (
                      <img
                        src={provider.iconUrl}
                        alt={provider.displayName}
                        className="w-10 h-10"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-brutal-blue flex items-center justify-center">
                        <Key className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-black">
                        {provider.displayName}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono">
                        {provider.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle(provider)}
                    className={`relative w-14 h-8 border-[3px] border-black transition-colors ${
                      provider.isEnabled ? "bg-green-500" : "bg-gray-300"
                    }`}
                    title={provider.isEnabled ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white border-[2px] border-black transition-transform ${
                        provider.isEnabled ? "left-7" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* Provider Details */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Client ID
                    </span>
                    <span className="font-mono text-xs text-black bg-gray-100 px-2 py-0.5 border border-gray-300">
                      {provider.clientId
                        ? `${provider.clientId.slice(0, 12)}...`
                        : "ไม่ได้ตั้งค่า"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Client Secret
                    </span>
                    <span className="font-mono text-xs text-black bg-gray-100 px-2 py-0.5 border border-gray-300">
                      {provider.clientSecret ? "••••••••" : "ไม่ได้ตั้งค่า"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">สถานะ</span>
                    <span
                      className={`px-2 py-0.5 text-xs font-bold border-[2px] ${
                        provider.isEnabled
                          ? "bg-green-100 text-green-700 border-green-500"
                          : "bg-gray-100 text-gray-600 border-gray-400"
                      }`}
                    >
                      {provider.isEnabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    </span>
                  </div>
                </div>

                {/* Redirect URI */}
                <div className="p-4 bg-brutal-blue border-t-[3px] border-black">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-black font-bold flex items-center gap-1">
                      <Link2 className="w-3 h-3" /> Redirect URI:
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(
                          getRedirectUri(provider.name),
                          `redirect-${provider.id}`,
                        )
                      }
                      className="text-black hover:text-gray-700"
                    >
                      {copied === `redirect-${provider.id}` ? (
                        <Check className="w-4 h-4 text-green-700" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs font-mono text-black bg-white/50 px-2 py-1 border-[2px] border-black break-all">
                    {getRedirectUri(provider.name)}
                  </p>
                </div>

                {/* Actions */}
                <div className="p-4 border-t-[3px] border-black flex gap-2">
                  <button
                    onClick={() => handleEdit(provider)}
                    className="flex-1 py-2 text-sm bg-white text-black border-[2px] border-black hover:bg-gray-100 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Pencil className="w-4 h-4" /> แก้ไข
                  </button>
                  <button
                    onClick={() => handleDelete(provider)}
                    disabled={provider.isEnabled}
                    className={`py-2 px-4 text-sm border-[2px] border-black transition-colors flex items-center justify-center ${
                      provider.isEnabled
                        ? "text-gray-400 border-gray-300 cursor-not-allowed"
                        : "bg-red-100 text-red-700 hover:bg-red-200"
                    }`}
                  >
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
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white border-[3px] border-black w-full max-w-2xl max-h-[90vh] overflow-y-auto my-8"
                style={{ boxShadow: "8px 8px 0 0 #000000" }}
              >
                <div className="flex items-center justify-between p-4 border-b-[3px] border-black bg-brutal-yellow sticky top-0 z-10">
                  <h2 className="text-xl font-bold text-black flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    {editingProvider
                      ? `แก้ไข ${editingProvider.displayName}`
                      : "เพิ่ม OAuth Provider"}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 text-black hover:bg-black/10 transition-colors border-[2px] border-black"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                  {/* Preset buttons (for new providers) */}
                  {!editingProvider && (
                    <div>
                      <label className="block text-sm font-bold text-black mb-2">
                        เลือกจาก Template
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {Object.keys(DEFAULT_OAUTH_CONFIGS).map(
                          (presetName) => (
                            <button
                              key={presetName}
                              type="button"
                              onClick={() => handlePresetSelect(presetName)}
                              className="px-4 py-2 text-sm bg-gray-100 text-black border-[2px] border-black hover:bg-gray-200 transition-colors font-medium"
                              style={{ boxShadow: "2px 2px 0 0 #000000" }}
                            >
                              {DEFAULT_OAUTH_CONFIGS[presetName].displayName}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-black mb-1 flex items-center gap-1">
                        <Globe className="w-4 h-4" /> Provider Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="google, discord, facebook"
                        disabled={!!editingProvider}
                        className="w-full px-3 py-2 border-[2px] border-black bg-white text-black disabled:opacity-50 disabled:bg-gray-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        ใช้ตัวพิมพ์เล็ก ไม่มีช่องว่าง
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-black mb-1">
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
                        className="w-full px-3 py-2 border-[2px] border-black bg-white text-black"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        ชื่อที่แสดงให้ผู้ใช้เห็น
                      </p>
                    </div>
                  </div>

                  {/* Credentials */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-black mb-1 flex items-center gap-1">
                        <Lock className="w-4 h-4" /> Client ID
                      </label>
                      <input
                        type="text"
                        value={formData.clientId}
                        onChange={(e) =>
                          setFormData({ ...formData, clientId: e.target.value })
                        }
                        placeholder="Your OAuth Client ID"
                        className="w-full px-3 py-2 border-[2px] border-black bg-white text-black font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-black mb-1 flex items-center gap-1">
                        <Shield className="w-4 h-4" /> Client Secret
                      </label>
                      <input
                        type="password"
                        value={formData.clientSecret}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            clientSecret: e.target.value,
                          })
                        }
                        placeholder={
                          editingProvider
                            ? "•••••••• (เว้นว่างเพื่อคงค่าเดิม)"
                            : "Your OAuth Client Secret"
                        }
                        className="w-full px-3 py-2 border-[2px] border-black bg-white text-black font-mono text-sm"
                      />
                    </div>
                  </div>

                  {/* URLs */}
                  <div>
                    <label className="block text-sm font-bold text-black mb-1 flex items-center gap-1">
                      <Globe className="w-4 h-4" /> Authorization URL
                    </label>
                    <input
                      type="url"
                      value={formData.authorizationUrl}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          authorizationUrl: e.target.value,
                        })
                      }
                      placeholder="https://..."
                      className="w-full px-3 py-2 border-[2px] border-black bg-white text-black font-mono text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-black mb-1">
                        Token URL
                      </label>
                      <input
                        type="url"
                        value={formData.tokenUrl}
                        onChange={(e) =>
                          setFormData({ ...formData, tokenUrl: e.target.value })
                        }
                        placeholder="https://..."
                        className="w-full px-3 py-2 border-[2px] border-black bg-white text-black font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-black mb-1">
                        User Info URL
                      </label>
                      <input
                        type="url"
                        value={formData.userInfoUrl}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            userInfoUrl: e.target.value,
                          })
                        }
                        placeholder="https://..."
                        className="w-full px-3 py-2 border-[2px] border-black bg-white text-black font-mono text-sm"
                      />
                    </div>
                  </div>

                  {/* Scope */}
                  <div>
                    <label className="block text-sm font-bold text-black mb-1">
                      Scopes (คั่นด้วยช่องว่าง)
                    </label>
                    <input
                      type="text"
                      value={formData.scope}
                      onChange={(e) =>
                        setFormData({ ...formData, scope: e.target.value })
                      }
                      placeholder="openid email profile"
                      className="w-full px-3 py-2 border-[2px] border-black bg-white text-black font-mono text-sm"
                    />
                  </div>

                  {/* Icon URL & Sort Order */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-black mb-1 flex items-center gap-1">
                        <Image className="w-4 h-4" /> Icon URL
                      </label>
                      <input
                        type="url"
                        value={formData.iconUrl}
                        onChange={(e) =>
                          setFormData({ ...formData, iconUrl: e.target.value })
                        }
                        placeholder="/brand-icons/google.svg"
                        className="w-full px-3 py-2 border-[2px] border-black bg-white text-black font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-black mb-1 flex items-center gap-1">
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
                        className="w-full px-3 py-2 border-[2px] border-black bg-white text-black"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        ตัวเลขน้อยแสดงก่อน
                      </p>
                    </div>
                  </div>

                  {/* Redirect URI Info */}
                  {formData.name && (
                    <div className="p-4 bg-brutal-blue border-[2px] border-black">
                      <p className="text-sm text-black font-bold mb-2 flex items-center gap-1">
                        <Link2 className="w-4 h-4" /> Redirect URI ที่ต้องใส่ใน
                        OAuth Provider Console:
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-mono text-black bg-white/50 px-2 py-1 border-[2px] border-black flex-1 break-all">
                          {getRedirectUri(formData.name)}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              getRedirectUri(formData.name),
                              "modal-redirect",
                            )
                          }
                          className="p-2 bg-white border-[2px] border-black hover:bg-gray-100"
                        >
                          {copied === "modal-redirect" ? (
                            <Check className="w-4 h-4 text-green-700" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Submit Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t-[3px] border-black">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-6 py-2 text-black border-[2px] border-black hover:bg-gray-100 transition-colors font-medium"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2 bg-brutal-green text-black border-[2px] border-black hover:opacity-90 disabled:opacity-50 transition-colors font-bold"
                      style={{ boxShadow: "4px 4px 0 0 #000000" }}
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {editingProvider ? "บันทึก" : "สร้าง Provider"}
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
