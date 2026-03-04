"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  Megaphone,
  Info,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

export default function NotificationPreferencesPage() {
  const t = useTranslations("NotificationPreferences");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const pathname = usePathname();
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
        toast.error(tCommon("error_occurred") || "Could not load preferences");
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
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, router, isInitialized, pathname]);

  // Handle saving preferences
  const savePreferences = async () => {
    setIsSaving(true);
    try {
      const response = await notificationApi.updatePreferences(preferences);
      if (response.success) {
        toast.success(t("save_success"));
      }
    } catch (error) {
      toast.error(tCommon("error_occurred") || "Could not save preferences");
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
        toast.success("Push notifications enabled successfully");
      } else {
        toast.error("Could not enable push notifications");
      }
    } catch (error) {
      toast.error("Error occurred while enabling push notifications");
    } finally {
      setIsSubscribing(false);
    }
  };

  // Handle push notification unsubscription
  const handleUnsubscribePush = async () => {
    setIsSubscribing(true);
    try {
      await unsubscribePush();
      toast.success("Push notifications disabled successfully");
    } catch (error) {
      toast.error("Error occurred while disabling push notifications");
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
      title: t("channels.email"),
      description: t("channels.email_desc"),
      icon: <Mail className="h-4 w-4" />,
      accent: "bg-brutal-blue",
    },
    {
      key: "pushNotifications" as const,
      title: t("channels.web"),
      description: t("channels.web_desc"),
      icon: <Bell className="h-4 w-4" />,
      accent: "bg-brutal-pink",
    },
    {
      key: "orderUpdates" as const,
      title: t("types.orders"),
      description: t("types.orders_desc"),
      icon: <Globe className="h-4 w-4" />,
      accent: "bg-brutal-green",
    },
    {
      key: "promotions" as const,
      title: t("types.promotions"),
      description: t("types.promotions_desc"),
      icon: <Check className="h-4 w-4" />,
      accent: "bg-brutal-yellow",
    },
  ];

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page header with back navigation */}
      <div className="flex items-center mb-4">
        <Link
          href="/dashboard/notifications"
          className="mr-3 text-gray-600 hover:text-black transition-colors border-[2px] border-gray-300 hover:border-black p-1 shadow-[2px_2px_0_0_#000]"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <motion.h2
            className="text-lg font-bold text-gray-900 flex items-center"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="w-1.5 h-4 bg-brutal-blue mr-2"></span>
            {t("title")}
          </motion.h2>
          <p className="text-gray-600 text-xs font-bold">
            {t("subtitle")}
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
          <div className="p-4 border-b-[3px] border-black bg-gray-50">
            <h3 className="text-base font-bold text-black flex items-center">
              <Bell size={16} className="text-brutal-blue mr-2" />
              {t("title")}
            </h3>
          </div>

          <div className="p-4">
            {/* Push Notification Status */}
            {isPushSupported && (
              <motion.div
                whileHover={{ y: -2 }}
                className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-white border-[2px] border-black hover:bg-gray-50 transition-colors mb-3 gap-3"
                style={{ boxShadow: "2px 2px 0 0 #000000" }}
              >
                <div className="flex items-start md:items-center">
                  <div className="h-8 w-8 min-w-[2rem] border-[2px] border-black flex items-center justify-center mr-3 text-white bg-brutal-pink shrink-0">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <h4 className="text-black font-bold text-sm">
                        {t("channels.web")}
                      </h4>
                      {isPushSubscribed && (
                        <span className="text-[10px] bg-brutal-green text-white px-1.5 py-0.5 border border-black font-bold uppercase">
                          Enabled
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-xs font-bold">
                      {isPushSubscribed
                        ? "Push notifications are currently enabled"
                        : "Enable push notifications to receive updates on your device"}
                    </p>
                  </div>
                </div>
                {isPushSubscribed ? (
                  <motion.button
                    onClick={handleUnsubscribePush}
                    disabled={isSubscribing}
                    whileHover={{ y: -2 }}
                    className="flex items-center justify-center bg-brutal-pink hover:bg-red-600 text-white px-3 py-1.5 border-[2px] border-black font-bold transition-all disabled:opacity-50 text-xs w-full md:w-auto uppercase shadow-[2px_2px_0_0_#000]"
                  >
                    {isSubscribing ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <X className="h-3 w-3 mr-2" />
                    )}
                    Disable
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={handleSubscribePush}
                    disabled={isSubscribing}
                    whileHover={{ y: -2 }}
                    className="flex items-center justify-center bg-brutal-green hover:bg-green-600 text-white px-3 py-1.5 border-[2px] border-black font-bold transition-all disabled:opacity-50 text-xs w-full md:w-auto uppercase shadow-[2px_2px_0_0_#000]"
                  >
                    {isSubscribing ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <Bell className="h-3 w-3 mr-2" />
                    )}
                    Enable
                  </motion.button>
                )}
              </motion.div>
            )}

            <div className="space-y-3">
              {preferenceItems.map((item) => (
                <motion.div
                  key={item.key}
                  whileHover={{ y: -2 }}
                  className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-white border-[2px] border-black hover:bg-gray-50 transition-colors gap-3"
                  style={{ boxShadow: "2px 2px 0 0 #000000" }}
                >
                  <div className="flex items-start md:items-center">
                    <div
                      className={`h-8 w-8 min-w-[2rem] border-[2px] border-black flex items-center justify-center mr-3 text-white ${item.accent} shrink-0`}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-black font-bold mb-0.5 md:mb-0 text-sm">
                        {item.title}
                      </h4>
                      <p className="text-gray-600 text-xs font-bold">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end md:block mt-1 md:mt-0">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences[item.key]}
                        onChange={() => togglePreference(item.key)}
                        className="sr-only peer"
                      />
                      <div className="relative w-12 h-6 bg-gray-200 border-[2px] border-black peer-checked:bg-brutal-green transition-colors after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-[2px] after:border-black after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-6 shadow-[1px_1px_0_0_#000]"></div>
                    </label>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t-[2px] border-gray-200 flex justify-end">
              <motion.button
                onClick={savePreferences}
                disabled={isSaving}
                whileHover={{ y: -2 }}
                className="flex items-center bg-black hover:bg-gray-800 text-white px-4 py-2 border-[2px] border-black font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase"
                style={{ boxShadow: "3px 3px 0 0 #000000" }}
              >
                {isSaving ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {t("saving")}
                  </>
                ) : (
                  <>
                    <Save className="h-3 w-3 mr-2" />
                    {t("save_button")}
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
