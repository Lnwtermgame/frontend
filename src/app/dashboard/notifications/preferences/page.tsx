"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { useNotifications } from "@/lib/context/notification-context";
import {
  notificationApi,
  NotificationPreferences,
} from "@/lib/services/notification-api";
import { motion } from "@/lib/framer-exports";
import {
  Bell,
  Mail,
  Globe,
  Save,
  AlertCircle,
  ChevronLeft,
  Check,
  Smartphone,
  X,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function NotificationPreferencesPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();
  const { isPushSupported, isPushSubscribed, subscribePush, unsubscribePush } =
    useNotifications();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    orderUpdates: true,
    promotions: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch preferences from API
  useEffect(() => {
    if (isInitialized && user) {
      fetchPreferences();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isInitialized, user]);

  const fetchPreferences = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    try {
      const response = await notificationApi.getPreferences(controller.signal);
      if (response.success) {
        setPreferences(response.data);
      }
    } catch (error: any) {
      if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") {
        toast.error("ไม่สามารถโหลดการตั้งค่าได้");
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
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
        toast.success("บันทึกการตั้งค่าเรียบร้อยแล้ว");
      }
    } catch (error) {
      toast.error("ไม่สามารถบันทึกการตั้งค่าได้");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle push notification subscription
  const handleSubscribePush = async () => {
    setIsSubscribing(true);
    try {
      const success = await subscribePush();
      if (success) {
        toast.success("เปิดใช้งานการแจ้งเตือน Push เรียบร้อยแล้ว");
      } else {
        toast.error("ไม่สามารถเปิดใช้งานการแจ้งเตือน Push ได้");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเปิดใช้งานการแจ้งเตือน Push");
    } finally {
      setIsSubscribing(false);
    }
  };

  // Handle push notification unsubscription
  const handleUnsubscribePush = async () => {
    setIsSubscribing(true);
    try {
      await unsubscribePush();
      toast.success("ปิดใช้งานการแจ้งเตือน Push เรียบร้อยแล้ว");
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการปิดใช้งานการแจ้งเตือน Push");
    } finally {
      setIsSubscribing(false);
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
      key: "emailNotifications" as const,
      title: "การแจ้งเตือนทางอีเมล",
      description: "รับการแจ้งเตือนสำคัญทางอีเมล",
      icon: <Mail className="h-5 w-5" />,
      accent: "bg-brutal-blue",
    },
    {
      key: "pushNotifications" as const,
      title: "การแจ้งเตือนแบบ Push",
      description: "รับการแจ้งเตือนบนเบราว์เซอร์ของคุณ",
      icon: <Bell className="h-5 w-5" />,
      accent: "bg-brutal-pink",
    },
    {
      key: "orderUpdates" as const,
      title: "อัปเดตคำสั่งซื้อ",
      description: "รับการแจ้งเตือนเมื่อสถานะคำสั่งซื้อเปลี่ยนแปลง",
      icon: <Globe className="h-5 w-5" />,
      accent: "bg-brutal-green",
    },
    {
      key: "promotions" as const,
      title: "โปรโมชั่นและข้อเสนอ",
      description: "รับข้อมูลโปรโมชั่นและส่วนลดพิเศษ",
      icon: <Check className="h-5 w-5" />,
      accent: "bg-brutal-yellow",
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
        <Link
          href="/dashboard/notifications"
          className="mr-4 text-gray-600 hover:text-black transition-colors border-[2px] border-gray-300 hover:border-black p-1"
        >
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
          <p className="text-gray-600 text-sm">
            จัดการการตั้งค่าการแจ้งเตือนของคุณ
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <motion.div
          className="bg-white border-[3px] border-black overflow-hidden"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
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
            {/* Push Notification Status */}
            {isPushSupported && (
              <motion.div
                whileHover={{ y: -2 }}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white border-[3px] border-black hover:bg-gray-50 transition-colors mb-4 gap-4"
                style={{ boxShadow: "3px 3px 0 0 #000000" }}
              >
                <div className="flex items-start md:items-center">
                  <div className="h-10 w-10 min-w-[2.5rem] border-[3px] border-black flex items-center justify-center mr-4 text-white bg-brutal-pink shrink-0">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-black font-bold thai-font">
                        การแจ้งเตือนแบบ Push
                      </h4>
                      {isPushSubscribed && (
                        <span className="text-[10px] md:text-xs bg-brutal-green text-white px-2 py-0.5 border border-black font-bold">
                          เปิดใช้งาน
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">
                      {isPushSubscribed
                        ? "คุณกำลังรับการแจ้งเตือนแบบ Push อยู่"
                        : "เปิดใช้งานการแจ้งเตือนแบบ Push เพื่อรับการแจ้งเตือนบนอุปกรณ์ของคุณ"}
                    </p>
                  </div>
                </div>
                {isPushSubscribed ? (
                  <motion.button
                    onClick={handleUnsubscribePush}
                    disabled={isSubscribing}
                    whileHover={{ y: -2 }}
                    className="flex items-center justify-center bg-brutal-pink hover:bg-red-600 text-white px-4 py-2 border-[3px] border-black font-bold transition-all disabled:opacity-50 text-sm w-full md:w-auto"
                    style={{ boxShadow: "3px 3px 0 0 #000000" }}
                  >
                    {isSubscribing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <X className="h-4 w-4 mr-2" />
                    )}
                    ปิดใช้งาน
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={handleSubscribePush}
                    disabled={isSubscribing}
                    whileHover={{ y: -2 }}
                    className="flex items-center justify-center bg-brutal-green hover:bg-green-600 text-white px-4 py-2 border-[3px] border-black font-bold transition-all disabled:opacity-50 text-sm w-full md:w-auto"
                    style={{ boxShadow: "3px 3px 0 0 #000000" }}
                  >
                    {isSubscribing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <Bell className="h-4 w-4 mr-2" />
                    )}
                    เปิดใช้งาน
                  </motion.button>
                )}
              </motion.div>
            )}

            <div className="space-y-4">
              {preferenceItems.map((item) => (
                <motion.div
                  key={item.key}
                  whileHover={{ y: -2 }}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white border-[3px] border-black hover:bg-gray-50 transition-colors gap-4"
                  style={{ boxShadow: "3px 3px 0 0 #000000" }}
                >
                  <div className="flex items-start md:items-center">
                    <div
                      className={`h-10 w-10 min-w-[2.5rem] border-[3px] border-black flex items-center justify-center mr-4 text-white ${item.accent} shrink-0`}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-black font-bold thai-font mb-1 md:mb-0">
                        {item.title}
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end md:block mt-2 md:mt-0">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences[item.key]}
                        onChange={() => togglePreference(item.key)}
                        className="sr-only peer"
                      />
                      <div className="relative w-14 h-8 bg-gray-200 border-[3px] border-black peer-checked:bg-brutal-green transition-colors after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-[3px] after:border-black after:h-6 after:w-6 after:transition-transform peer-checked:after:translate-x-6 shadow-[2px_2px_0_0_#000]"></div>
                    </label>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t-[2px] border-gray-200 flex justify-end">
              <motion.button
                onClick={savePreferences}
                disabled={isSaving}
                whileHover={{ y: -2 }}
                className="flex items-center bg-black hover:bg-gray-800 text-white px-6 py-2.5 border-[3px] border-black font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed thai-font"
                style={{ boxShadow: "4px 4px 0 0 #000000" }}
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
