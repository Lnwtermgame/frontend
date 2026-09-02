"use client";

import { useCallback, useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { motion } from "@/lib/framer-exports";
import {
  AdminLayout,
  AdminPageHeader,
  PageContainer,
} from "@/components/admin";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/switch";
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
  const { isAdmin } = useAuth();

  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<OAuthProvider | null>(
    null,
  );
  const [formData, setFormData] = useState<ProviderFormData>(emptyFormData);

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

  return (
    <AdminLayout>
      <PageContainer>
        <AdminPageHeader
          title="จัดการ OAuth Providers"
          description="เปิด/ปิด การล็อกอินภายนอก (Google, Discord, ฯลฯ)"
          icon={Globe}
          actions={
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={fetchProviders}
                disabled={loading}
                className="gap-2 rounded-xl"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                รีเฟรช
              </Button>
              <Button onClick={handleCreateNew} className="gap-2 rounded-xl">
                <Plus className="w-4 h-4" />
                เพิ่ม Provider
              </Button>
            </div>
          }
        />

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
            <p className="text-2xl font-extrabold text-white">{providers.length}</p>
          </div>
          <div
            className="bg-site-surface border border-white/5 rounded-2xl p-4">
            <p className="text-gray-400 text-xs mb-1">เปิดใช้งาน</p>
            <p className="text-2xl font-extrabold text-green-600">
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
            <Button onClick={handleCreateNew} className="gap-2 rounded-xl text-sm">
              <Plus className="w-4 h-4" />
              เพิ่ม Provider
            </Button>
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
                    <Switch
                      checked={provider.isEnabled}
                      onCheckedChange={() => handleToggle(provider)}
                      className="h-8 w-14 data-[state=checked]:bg-status-success data-[state=unchecked]:bg-site-raised"
                      aria-label={provider.isEnabled ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                    />
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
                  <Button
                    variant="secondary"
                    onClick={() => handleEdit(provider)}
                    className="flex-1 gap-2 rounded-xl py-2 text-sm"
                  >
                    <Pencil className="w-4 h-4" /> แก้ไข
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(provider)}
                    disabled={provider.isEnabled}
                    className={`h-10 w-12 rounded-xl ${
                      provider.isEnabled
                        ? "text-site-dim bg-site-raised/50 border-transparent"
                        : "text-status-danger bg-status-danger/10 hover:bg-status-danger/20 hover:border-status-danger/20 border-status-danger/20"
                    }`}
                    aria-label="ลบ provider"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        <DialogPrimitive.Root
          open={showModal}
          onOpenChange={(open) => {
            if (!open && !saving) setShowModal(false);
          }}
        >
          <DialogPortal>
            <DialogOverlay className="bg-black/60 z-[100]" />
            <DialogPrimitive.Content
              className="fixed left-1/2 top-1/2 z-[100] flex w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col bg-site-raised border border-white/10 rounded-3xl max-w-lg max-h-[90vh] shadow-2xl overflow-hidden focus:outline-none"
              onEscapeKeyDown={(e) => saving && e.preventDefault()}
              onPointerDownOutside={(e) => saving && e.preventDefault()}
              onInteractOutside={(e) => saving && e.preventDefault()}
              aria-describedby={undefined}
            >

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                  <DialogPrimitive.Title className="text-xl font-bold text-white flex items-center gap-2">
                    <Globe className="w-6 h-6 text-site-accent" />
                    {editingProvider
                      ? `แก้ไข ${editingProvider.displayName}`
                      : "เพิ่ม OAuth Provider"}
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Close
                    className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors hidden sm:block">
                    <X className="w-4 h-4 text-gray-400" />
                  </DialogPrimitive.Close>
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
                            <Button
                              key={presetName}
                              variant="secondary"
                              size="sm"
                              onClick={() => handlePresetSelect(presetName)}
                              className="rounded-lg px-3 py-1.5 text-xs font-medium hover:border-site-accent/30 hover:text-site-accent hover:bg-site-raised"
                            >
                              {DEFAULT_OAUTH_CONFIGS[presetName].displayName}
                            </Button>
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
                          <Input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="google, discord, facebook"
                            disabled={!!editingProvider}
                            className="h-10 rounded-xl border-white/5 bg-site-raised font-normal"
                          />
                          <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                            <Info className="w-3 h-3" /> ใช้ตัวพิมพ์เล็ก ไม่มีช่องว่าง (ต้องตรงกับชื่อใน .env)
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-300 mb-2">
                            Display Name <span className="text-red-400">*</span>
                          </label>
                          <Input
                            type="text"
                            value={formData.displayName}
                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                            placeholder="Google, Discord, Facebook"
                            className="h-10 rounded-xl border-white/5 bg-site-raised font-normal"
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
                          <Input
                            type="text"
                            value={formData.iconUrl}
                            onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                            placeholder="/brand-icons/google.svg"
                            className="h-10 rounded-xl border-white/5 bg-site-raised font-mono font-normal"
                          />
                          <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                            <Info className="w-3 h-3" /> ไอคอนที่แสดงบนหน้า Login (ใช้ path หรือ URL)
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-300 mb-2 flex items-center gap-1">
                            <SortAsc className="w-3.5 h-3.5" /> Sort Order
                          </label>
                          <Input
                            type="number"
                            value={formData.sortOrder}
                            onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                            className="h-10 rounded-xl border-white/5 bg-site-raised font-normal"
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
                    <Button
                      variant="secondary"
                      onClick={() => setShowModal(false)}
                      className="rounded-xl px-5 py-2.5 text-sm"
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      type="submit"
                      disabled={saving}
                      className="gap-2 rounded-xl px-6 py-2.5 text-sm"
                    >
                      {saving ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {editingProvider ? "อัปเดต" : "สร้าง Provider"}
                    </Button>
                  </div>
                </form>
            </DialogPrimitive.Content>
          </DialogPortal>
        </DialogPrimitive.Root>
      </PageContainer>
    </AdminLayout>
  );
}
