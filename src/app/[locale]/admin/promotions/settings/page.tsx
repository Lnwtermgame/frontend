"use client";

import { useState } from "react";
import { motion } from "@/lib/framer-exports";
import AdminLayout from "@/components/layout/AdminLayout";
import { Settings, Save, ChevronLeft, Tag, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
        <label
          htmlFor={name}
          className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            id={name}
            name={name}
            className="sr-only"
            checked={checked}
            onChange={onChange}
          />
          <div
            className={`w-9 h-5 rounded-full transition-colors ${checked ? "bg-site-accent" : "bg-site-border/30"}`}>
            <div
              className={`h-4 w-4 rounded-full bg-site-raised absolute left-0.5 top-0.5 transition-transform ${checked ? "translate-x-4" : ""}`}></div>
          </div>
        </label>
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
    <AdminLayout title={"ตั้งค่าโปรโมชั่น" as any}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-4">
          <button
            onClick={() => router.push("/admin/promotions")}
            className="mr-3 p-1.5 rounded-lg bg-site-raised border-2 border-gray-300 text-white hover:bg-site-border/30 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center">
            <span className="w-1.5 h-5 bg-site-accent mr-2"></span>
            <h1 className="text-xl font-bold text-white">ตั้งค่าโปรโมชั่น</h1>
          </div>
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

                  <div>
                    <label
                      htmlFor="expiringSoonDays"
                      className="block text-white text-xs font-medium mb-1">
                      เกณฑ์ "ใกล้หมดอายุ" (วัน)
                    </label>
                    <input
                      type="number"
                      id="expiringSoonDays"
                      name="expiringSoonDays"
                      min="1"
                      max="30"
                      value={settings.expiringSoonDays}
                      onChange={handleChange}
                      className="bg-site-raised border-2 border-gray-300 text-white rounded-lg px-3 py-1.5 w-full text-sm focus:border-site-accent focus:outline-none"
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
                    <div>
                      <label
                        htmlFor="maxCouponsPerOrder"
                        className="block text-white text-xs font-medium mb-1">
                        คูปองสูงสุดต่อรายการ
                      </label>
                      <input
                        type="number"
                        id="maxCouponsPerOrder"
                        name="maxCouponsPerOrder"
                        min="1"
                        max="10"
                        value={settings.maxCouponsPerOrder}
                        onChange={handleChange}
                        className="bg-site-raised border-2 border-gray-300 text-white rounded-lg px-3 py-1.5 w-full text-sm focus:border-site-accent focus:outline-none"
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

                  <div>
                    <label
                      htmlFor="minOrderValueForCoupons"
                      className="block text-white text-xs font-medium mb-1">
                      ยอดสั่งซื้อขั้นต่ำ (฿)
                    </label>
                    <input
                      type="number"
                      id="minOrderValueForCoupons"
                      name="minOrderValueForCoupons"
                      min="0"
                      value={settings.minOrderValueForCoupons}
                      onChange={handleChange}
                      className="bg-site-raised border-2 border-gray-300 text-white rounded-lg px-3 py-1.5 w-full text-sm focus:border-site-accent focus:outline-none"
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

                  <div>
                    <label
                      htmlFor="maxFailedAttempts"
                      className="block text-white text-xs font-medium mb-1">
                      ความพยายามผิดพลาดสูงสุด
                    </label>
                    <input
                      type="number"
                      id="maxFailedAttempts"
                      name="maxFailedAttempts"
                      min="1"
                      max="20"
                      value={settings.maxFailedAttempts}
                      onChange={handleChange}
                      className="bg-site-raised border-2 border-gray-300 text-white rounded-lg px-3 py-1.5 w-full text-sm focus:border-site-accent focus:outline-none"
                    />
                    <p className="text-gray-400 text-[10px] mt-1">
                      จำนวนครั้งที่ใช้คูปองผิดพลาดก่อนถูกบล็อกชั่วคราว
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="blockDurationMinutes"
                      className="block text-white text-xs font-medium mb-1">
                      ระยะเวลาบล็อก (นาที)
                    </label>
                    <input
                      type="number"
                      id="blockDurationMinutes"
                      name="blockDurationMinutes"
                      min="5"
                      max="1440"
                      value={settings.blockDurationMinutes}
                      onChange={handleChange}
                      className="bg-site-raised border-2 border-gray-300 text-white rounded-lg px-3 py-1.5 w-full text-sm focus:border-site-accent focus:outline-none"
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
                  <div>
                    <label
                      htmlFor="defaultCouponLength"
                      className="block text-white text-xs font-medium mb-1">
                      ความยาวรหัสคูปองเริ่มต้น
                    </label>
                    <input
                      type="number"
                      id="defaultCouponLength"
                      name="defaultCouponLength"
                      min="4"
                      max="16"
                      value={settings.defaultCouponLength}
                      onChange={handleChange}
                      className="bg-site-raised border-2 border-gray-300 text-white rounded-lg px-3 py-1.5 w-full text-sm focus:border-site-accent focus:outline-none"
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
                    <div>
                      <label
                        htmlFor="expiryNotificationDays"
                        className="block text-white text-xs font-medium mb-1">
                        วันแจ้งเตือนก่อนหมดอายุ
                      </label>
                      <input
                        type="number"
                        id="expiryNotificationDays"
                        name="expiryNotificationDays"
                        min="1"
                        max="30"
                        value={settings.expiryNotificationDays}
                        onChange={handleChange}
                        className="bg-site-raised border-2 border-gray-300 text-white rounded-lg px-3 py-1.5 w-full text-sm focus:border-site-accent focus:outline-none"
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
              <button
                type="button"
                onClick={() => router.push("/admin/promotions")}
                className="px-4 py-2 bg-site-surface border border-white/5 rounded-2xl text-white rounded-lg hover:bg-site-raised/5 transition-colors font-medium text-sm">
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 bg-black text-white border border-white/5 rounded-lg rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center text-sm ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
