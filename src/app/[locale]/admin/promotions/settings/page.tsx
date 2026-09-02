"use client";

import { useState } from "react";
import { motion } from "@/lib/framer-exports";
import {
  AdminLayout,
  AdminPageHeader,
  PageContainer,
} from "@/components/admin";
import { Settings, Save, ChevronLeft, Tag, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function AdminPromotionSettings() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state for coupon settings
  const [settings, setSettings] = useState({
    // Coupon Display Settings
    showCouponsOnHomepage: true,
    highlightNewCoupons: true,
    expiringSoonDays: 3,

    // Coupon Usage Settings
    allowMultipleCoupons: false,
    maxCouponsPerOrder: 1,
    allowCouponStacking: false,
    minOrderValueForCoupons: 10,

    // Coupon Generation Settings
    defaultCouponLength: 8,
    includeSpecialCharacters: false,
    useRandomCodes: true,

    // Notification Settings
    notifyBeforeCouponExpiry: true,
    expiryNotificationDays: 3,

    // Security Settings
    maxFailedAttempts: 5,
    blockDurationMinutes: 30,
    restrictToLoggedInUsers: true,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      setSettings({
        ...settings,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else if (type === "number") {
      setSettings({
        ...settings,
        [name]: parseInt(value, 10),
      });
    } else {
      setSettings({
        ...settings,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: This will be implemented by backend
      console.log("Settings to be saved:", settings);

      // For UI demonstration purposes only
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle switch component
  const ToggleSwitch = ({
    name,
    label,
    description,
    checked,
    onChange,
  }: {
    name: string;
    label: string;
    description?: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <div className="flex items-start space-x-2">
      <div className="mt-0.5">
        <Switch
          id={name}
          name={name}
          checked={checked}
          onCheckedChange={(value) =>
            onChange({
              target: { name, checked: value, type: "checkbox" },
            } as unknown as React.ChangeEvent<HTMLInputElement>)
          }
        />
      </div>
      <div>
        <label
          htmlFor={name}
          className="text-white text-sm font-medium block cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-gray-400 text-[10px] mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <PageContainer className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => router.push("/admin/promotions")}
            variant="secondary"
            size="icon"
            aria-label="ย้อนกลับ"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <AdminPageHeader title="ตั้งค่าโปรโมชั่น" icon={Settings} />
        </div>

        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border-2 border-green-500/30/30 text-green-400 px-3 py-2 rounded-lg mb-4 flex items-center text-sm">
            <CheckCircle className="h-4 w-4 mr-2" />
            บันทึกการตั้งค่าเรียบร้อยแล้ว
          </motion.div>
        )}

        {/* Settings Container */}
        <motion.div
          className="bg-site-surface border border-white/5 rounded-2xl rounded-xl overflow-hidden"

          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="p-3 border-b-2 border-white/10 bg-site-surface">
            <h3 className="text-base font-semibold text-white flex items-center">
              <Settings className="mr-2 h-4 w-4 text-site-accent" />
              ตั้งค่าคูปองและโปรโมชั่น
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
              {/* Coupon Display Settings */}
              <div className="lg:col-span-2">
                <h4 className="text-white text-sm font-medium mb-2 flex items-center">
                  <Tag className="h-3.5 w-3.5 mr-2 text-site-accent" />
                  การตั้งค่าการแสดงคูปอง
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-site-surface p-3 rounded-lg border-2 border-white/5">
                  <ToggleSwitch
                    name="showCouponsOnHomepage"
                    label="แสดงคูปองบนหน้าแรก"
                    description="แสดงคูปองที่ใช้ได้บนหน้าแรกเพื่อให้มองเห็นได้ชัดเจน"
                    checked={settings.showCouponsOnHomepage}
                    onChange={handleChange}
                  />

                  <ToggleSwitch
                    name="highlightNewCoupons"
                    label="ไฮไลท์คูปองใหม่"
                    description="ไฮไลท์คูปองที่เพิ่งเพิ่มด้วยตัวบ่งชี้พิเศษ"
                    checked={settings.highlightNewCoupons}
                    onChange={handleChange}
                  />

                  <div className="space-y-1">
                    <Label
                      htmlFor="expiringSoonDays"
                      className="text-white text-xs font-medium"
                    >
                      เกณฑ์ "ใกล้หมดอายุ" (วัน)
                    </Label>
                    <Input
                      type="number"
                      id="expiringSoonDays"
                      name="expiringSoonDays"
                      min={1}
                      max={30}
                      size="sm"
                      className="border-site-border bg-site-raised text-white"
                      value={settings.expiringSoonDays}
                      onChange={handleChange}
                    />
                    <p className="text-gray-400 text-[10px] mt-1">
                      คูปองที่เหลือวันน้อยกว่านี้จะถูกทำเครื่องหมายว่า
                      "ใกล้หมดอายุ"
                    </p>
                  </div>
                </div>
              </div>

              {/* Coupon Usage Settings */}
              <div>
                <h4 className="text-white text-sm font-medium mb-2">
                  การตั้งค่าการใช้คูปอง
                </h4>
                <div className="space-y-3 bg-site-surface p-3 rounded-lg border-2 border-white/5">
                  <ToggleSwitch
                    name="allowMultipleCoupons"
                    label="อนุญาตหลายคูปอง"
                    description="เปิดให้ผู้ใช้สามารถใช้คูปองหลายใบในรายการเดียว"
                    checked={settings.allowMultipleCoupons}
                    onChange={handleChange}
                  />

                  {settings.allowMultipleCoupons && (
                    <div className="space-y-1">
                      <Label
                        htmlFor="maxCouponsPerOrder"
                        className="text-white text-xs font-medium"
                      >
                        คูปองสูงสุดต่อรายการ
                      </Label>
                      <Input
                        type="number"
                        id="maxCouponsPerOrder"
                        name="maxCouponsPerOrder"
                        min={1}
                        max={10}
                        size="sm"
                        className="border-site-border bg-site-raised text-white"
                        value={settings.maxCouponsPerOrder}
                        onChange={handleChange}
                      />
                    </div>
                  )}

                  <ToggleSwitch
                    name="allowCouponStacking"
                    label="อนุญาตให้ซ้อนคูปอง"
                    description="ให้ส่วนลดจากคูปองหลายใบซ้อนทับกันในสินค้าเดียวกัน"
                    checked={settings.allowCouponStacking}
                    onChange={handleChange}
                  />

                  <div className="space-y-1">
                    <Label
                      htmlFor="minOrderValueForCoupons"
                      className="text-white text-xs font-medium"
                    >
                      ยอดสั่งซื้อขั้นต่ำ (฿)
                    </Label>
                    <Input
                      type="number"
                      id="minOrderValueForCoupons"
                      name="minOrderValueForCoupons"
                      min={0}
                      size="sm"
                      className="border-site-border bg-site-raised text-white"
                      value={settings.minOrderValueForCoupons}
                      onChange={handleChange}
                    />
                    <p className="text-gray-400 text-[10px] mt-1">
                      ยอดสั่งซื้อขั้นต่ำเริ่มต้นที่ต้องการเพื่อใช้คูปอง
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              <div>
                <h4 className="text-white text-sm font-medium mb-2">
                  การตั้งค่าความปลอดภัย
                </h4>
                <div className="space-y-3 bg-site-surface p-3 rounded-lg border-2 border-white/5">
                  <ToggleSwitch
                    name="restrictToLoggedInUsers"
                    label="จำกัดเฉพาะผู้ใช้ที่ลงชื่อเข้าใช้"
                    description="อนุญาตให้เฉพาะผู้ใช้ที่ลงชื่อเข้าใช้เท่านั้นที่สามารถใช้คูปอง"
                    checked={settings.restrictToLoggedInUsers}
                    onChange={handleChange}
                  />

                  <div className="space-y-1">
                    <Label
                      htmlFor="maxFailedAttempts"
                      className="text-white text-xs font-medium"
                    >
                      ความพยายามผิดพลาดสูงสุด
                    </Label>
                    <Input
                      type="number"
                      id="maxFailedAttempts"
                      name="maxFailedAttempts"
                      min={1}
                      max={20}
                      size="sm"
                      className="border-site-border bg-site-raised text-white"
                      value={settings.maxFailedAttempts}
                      onChange={handleChange}
                    />
                    <p className="text-gray-400 text-[10px] mt-1">
                      จำนวนครั้งที่ใช้คูปองผิดพลาดก่อนถูกบล็อกชั่วคราว
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="blockDurationMinutes"
                      className="text-white text-xs font-medium"
                    >
                      ระยะเวลาบล็อก (นาที)
                    </Label>
                    <Input
                      type="number"
                      id="blockDurationMinutes"
                      name="blockDurationMinutes"
                      min={5}
                      max={1440}
                      size="sm"
                      className="border-site-border bg-site-raised text-white"
                      value={settings.blockDurationMinutes}
                      onChange={handleChange}
                    />
                    <p className="text-gray-400 text-[10px] mt-1">
                      ระยะเวลาบล็อกการใช้คูปองหลังจากความพยายามผิดพลาดมากเกินไป
                    </p>
                  </div>
                </div>
              </div>

              {/* Coupon Generation Settings */}
              <div className="lg:col-span-2">
                <h4 className="text-white text-sm font-medium mb-2">
                  การตั้งค่าการสร้างคูปอง
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-site-surface p-3 rounded-lg border-2 border-white/5">
                  <div className="space-y-1">
                    <Label
                      htmlFor="defaultCouponLength"
                      className="text-white text-xs font-medium"
                    >
                      ความยาวรหัสคูปองเริ่มต้น
                    </Label>
                    <Input
                      type="number"
                      id="defaultCouponLength"
                      name="defaultCouponLength"
                      min={4}
                      max={16}
                      size="sm"
                      className="border-site-border bg-site-raised text-white"
                      value={settings.defaultCouponLength}
                      onChange={handleChange}
                    />
                  </div>

                  <ToggleSwitch
                    name="includeSpecialCharacters"
                    label="รวมอักขระพิเศษ"
                    description="รวมอักขระพิเศษในรหัสคูปองที่สร้าง"
                    checked={settings.includeSpecialCharacters}
                    onChange={handleChange}
                  />

                  <ToggleSwitch
                    name="useRandomCodes"
                    label="ใช้รหัสแบบสุ่ม"
                    description="สร้างรหัสแบบสุ่มแทนรหัสตามลำดับ"
                    checked={settings.useRandomCodes}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Notification Settings */}
              <div className="lg:col-span-2">
                <h4 className="text-white text-sm font-medium mb-2">
                  การตั้งค่าการแจ้งเตือน
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-site-surface p-3 rounded-lg border-2 border-white/5">
                  <ToggleSwitch
                    name="notifyBeforeCouponExpiry"
                    label="แจ้งเตือนก่อนคูปองหมดอายุ"
                    description="ส่งการแจ้งเตือนให้ผู้ใช้ก่อนที่คูปองจะหมดอายุ"
                    checked={settings.notifyBeforeCouponExpiry}
                    onChange={handleChange}
                  />

                  {settings.notifyBeforeCouponExpiry && (
                    <div className="space-y-1">
                      <Label
                        htmlFor="expiryNotificationDays"
                        className="text-white text-xs font-medium"
                      >
                        วันแจ้งเตือนก่อนหมดอายุ
                      </Label>
                      <Input
                        type="number"
                        id="expiryNotificationDays"
                        name="expiryNotificationDays"
                        min={1}
                        max={30}
                        size="sm"
                        className="border-site-border bg-site-raised text-white"
                        value={settings.expiryNotificationDays}
                        onChange={handleChange}
                      />
                      <p className="text-gray-400 text-[10px] mt-1">
                        จำนวนวันก่อนหมดอายุที่จะส่งการแจ้งเตือน
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push("/admin/promotions")}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                isLoading={isSubmitting}
                className="bg-black text-white border border-white/5 hover:bg-gray-800"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
              </Button>
            </div>
          </form>
        </motion.div>
      </PageContainer>
    </AdminLayout>
  );
}
