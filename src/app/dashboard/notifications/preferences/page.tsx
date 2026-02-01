"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { notificationApi, NotificationPreferences } from "@/lib/services/notification-api";
import { motion } from "@/lib/framer-exports";
import { Bell, Mail, Globe, Save, AlertCircle, ChevronLeft, Check } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function NotificationPreferencesPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    orderUpdates: true,
    promotions: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch preferences from API
  useEffect(() => {
    if (isInitialized && user) {
      fetchPreferences();
    }
  }, [isInitialized, user]);

  const fetchPreferences = async () => {
    setIsLoading(true);
    try {
      const response = await notificationApi.getPreferences();
      if (response.success) {
        setPreferences(response.data);
      }
    } catch (error) {
      toast.error('ไม่สามารถโหลดการตั้งค่าได้');
    } finally {
      setIsLoading(false);
    }
  };

  // If not logged in, redirect to login page
  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [user, router, isInitialized]);

  // Handle saving preferences
  const savePreferences = async () => {
    setIsSaving(true);
    try {
      const response = await notificationApi.updatePreferences(preferences);
      if (response.success) {
        toast.success('บันทึกการตั้งค่าเรียบร้อยแล้ว');
      }
    } catch (error) {
      toast.error('ไม่สามารถบันทึกการตั้งค่าได้');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle a specific notification preference
  const togglePreference = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Preference items configuration
  const preferenceItems = [
    {
      key: 'emailNotifications' as const,
      title: 'การแจ้งเตือนทางอีเมล',
      description: 'รับการแจ้งเตือนสำคัญทางอีเมล',
      icon: <Mail className="h-5 w-5" />,
    },
    {
      key: 'pushNotifications' as const,
      title: 'การแจ้งเตือนแบบ Push',
      description: 'รับการแจ้งเตือนบนเบราว์เซอร์ของคุณ',
      icon: <Bell className="h-5 w-5" />,
    },
    {
      key: 'orderUpdates' as const,
      title: 'อัปเดตคำสั่งซื้อ',
      description: 'รับการแจ้งเตือนเมื่อสถานะคำสั่งซื้อเปลี่ยนแปลง',
      icon: <Globe className="h-5 w-5" />,
    },
    {
      key: 'promotions' as const,
      title: 'โปรโมชั่นและข้อเสนอ',
      description: 'รับข้อมูลโปรโมชั่นและส่วนลดพิเศษ',
      icon: <Check className="h-5 w-5" />,
    },
  ];

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-mali-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-mali-text-secondary thai-font">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page header with back navigation */}
      <div className="flex items-center mb-6">
        <Link href="/dashboard/notifications" className="mr-4 text-mali-text-secondary hover:text-white transition-colors">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <div>
          <motion.h2
            className="text-xl font-bold text-white thai-font"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            ตั้งค่าการแจ้งเตือน
          </motion.h2>
          <p className="text-mali-text-secondary text-sm">จัดการการตั้งค่าการแจ้งเตือนของคุณ</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-mali-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <motion.div
          className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="p-6 border-b border-mali-blue/20 bg-mali-blue/5">
            <h3 className="text-lg font-bold text-white flex items-center thai-font">
              <Bell size={18} className="text-mali-blue-accent mr-2" />
              การตั้งค่าการแจ้งเตือน
            </h3>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {preferenceItems.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-4 bg-mali-blue/5 border border-mali-blue/10 rounded-xl hover:bg-mali-blue/10 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-lg bg-mali-blue/20 flex items-center justify-center mr-4 text-mali-blue-accent">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-white font-medium thai-font">{item.title}</h4>
                      <p className="text-mali-text-secondary text-sm">{item.description}</p>
                    </div>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences[item.key]}
                      onChange={() => togglePreference(item.key)}
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-mali-blue/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mali-blue-accent"></div>
                  </label>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-mali-blue/10 flex justify-end">
              <button
                onClick={savePreferences}
                disabled={isSaving}
                className="flex items-center bg-mali-blue hover:bg-mali-blue/90 text-white px-6 py-2.5 rounded-lg font-medium shadow-button-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed thai-font"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    บันทึกการตั้งค่า
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
