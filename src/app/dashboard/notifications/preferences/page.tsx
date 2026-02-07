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
      accent: 'bg-brutal-blue',
    },
    {
      key: 'pushNotifications' as const,
      title: 'การแจ้งเตือนแบบ Push',
      description: 'รับการแจ้งเตือนบนเบราว์เซอร์ของคุณ',
      icon: <Bell className="h-5 w-5" />,
      accent: 'bg-brutal-pink',
    },
    {
      key: 'orderUpdates' as const,
      title: 'อัปเดตคำสั่งซื้อ',
      description: 'รับการแจ้งเตือนเมื่อสถานะคำสั่งซื้อเปลี่ยนแปลง',
      icon: <Globe className="h-5 w-5" />,
      accent: 'bg-brutal-green',
    },
    {
      key: 'promotions' as const,
      title: 'โปรโมชั่นและข้อเสนอ',
      description: 'รับข้อมูลโปรโมชั่นและส่วนลดพิเศษ',
      icon: <Check className="h-5 w-5" />,
      accent: 'bg-brutal-yellow',
    },
  ];

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 thai-font">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page header with back navigation */}
      <div className="flex items-center mb-6">
        <Link href="/dashboard/notifications" className="mr-4 text-gray-600 hover:text-black transition-colors border-[2px] border-gray-300 hover:border-black p-1">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <div>
          <motion.h2
            className="text-xl font-bold text-gray-900 thai-font flex items-center"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="w-1.5 h-5 bg-brutal-blue mr-2"></span>
            ตั้งค่าการแจ้งเตือน
          </motion.h2>
          <p className="text-gray-600 text-sm">จัดการการตั้งค่าการแจ้งเตือนของคุณ</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <motion.div
          className="bg-white border-[3px] border-black overflow-hidden"
          style={{ boxShadow: '4px 4px 0 0 #000000' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="p-6 border-b-[3px] border-black bg-gray-50">
            <h3 className="text-lg font-bold text-black flex items-center thai-font">
              <Bell size={18} className="text-brutal-blue mr-2" />
              การตั้งค่าการแจ้งเตือน
            </h3>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {preferenceItems.map((item) => (
                <motion.div
                  key={item.key}
                  whileHover={{ y: -2 }}
                  className="flex items-center justify-between p-4 bg-white border-[3px] border-black hover:bg-gray-50 transition-colors"
                  style={{ boxShadow: '3px 3px 0 0 #000000' }}
                >
                  <div className="flex items-center">
                    <div className={`h-10 w-10 border-[3px] border-black flex items-center justify-center mr-4 text-white ${item.accent}`}>
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-black font-bold thai-font">{item.title}</h4>
                      <p className="text-gray-600 text-sm">{item.description}</p>
                    </div>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences[item.key]}
                      onChange={() => togglePreference(item.key)}
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-300 border-[2px] border-black peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-[2px] after:border-black after:h-5 after:w-5 after:transition-all peer-checked:bg-brutal-green"></div>
                  </label>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t-[2px] border-gray-200 flex justify-end">
              <motion.button
                onClick={savePreferences}
                disabled={isSaving}
                whileHover={{ y: -2 }}
                className="flex items-center bg-black hover:bg-gray-800 text-white px-6 py-2.5 border-[3px] border-black font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed thai-font"
                style={{ boxShadow: '4px 4px 0 0 #000000' }}
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
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
