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
      accent: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    },
    {
      key: "pushNotifications" as const,
      title: t("channels.web"),
      description: t("channels.web_desc"),
      icon: <Bell className="h-4 w-4" />,
      accent: "bg-[var(--site-accent)]/10 text-[var(--site-accent)] border-[var(--site-accent)]/20",
    },
    {
      key: "orderUpdates" as const,
      title: t("types.orders"),
      description: t("types.orders_desc"),
      icon: <Globe className="h-4 w-4" />,
      accent: "bg-green-500/10 text-green-500 border-green-500/30/20",
    },
    {
      key: "promotions" as const,
      title: t("types.promotions"),
      description: t("types.promotions_desc"),
      icon: <Check className="h-4 w-4" />,
      accent: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30/20",
    },
  ];

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#222427] border-t-[var(--site-accent)] rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400 font-medium">{tCommon("loading")}</p>
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
          className="mr-4 text-gray-400 hover:text-white transition-colors border border-site-border hover:border-[var(--site-accent)]/50 p-1.5 rounded-lg bg-[#222427] shadow-sm"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <motion.h2
            className="text-2xl font-bold text-white flex items-center mb-1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="w-1.5 h-6 bg-[var(--site-accent)] mr-3 rounded-full"></span>
            {t("title")}
          </motion.h2>
          <p className="text-gray-400 text-sm ml-4 border-l-2 border-site-border pl-3">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 bg-[#222427] border border-site-border rounded-xl shadow-ocean">
          <div className="w-8 h-8 border-3 border-[#1A1C1E] border-t-[var(--site-accent)] rounded-full animate-spin"></div>
        </div>
      ) : (
        <motion.div
          className="bg-[#222427] border border-site-border shadow-ocean rounded-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="p-4 sm:p-5 border-b border-site-border bg-[#1A1C1E]">
            <h3 className="text-base font-bold text-white flex items-center">
              <Bell size={18} className="text-[var(--site-accent)] mr-2.5" />
              {t("title")}
            </h3>
          </div>

          <div className="p-4 sm:p-5">
            {/* Push Notification Status */}
            {isPushSupported && (
              <motion.div
                className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[#1A1C1E] border border-site-border rounded-xl mb-4 gap-4"
              >
                <div className="flex items-start md:items-center w-full md:w-auto">
                  <div className="h-10 w-10 min-w-[2.5rem] bg-[var(--site-accent)]/10 border border-[var(--site-accent)]/20 rounded-lg flex items-center justify-center mr-4 text-[var(--site-accent)] shrink-0 shadow-sm">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-white font-semibold text-sm">
                        {t("channels.web")}
                      </h4>
                      {isPushSubscribed && (
                        <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 border border-green-500/30/20 rounded-md font-bold uppercase tracking-wider">
                          Enabled
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs font-medium pr-2 md:pr-0">
                      {isPushSubscribed
                        ? "Push notifications are currently enabled"
                        : "Enable push notifications to receive updates on your device"}
                    </p>
                  </div>
                </div>
                {isPushSubscribed ? (
                  <button
                    onClick={handleUnsubscribePush}
                    disabled={isSubscribing}
                    className="flex items-center justify-center bg-[#222427] hover:bg-red-500/10 text-gray-300 hover:text-red-500 hover:border-red-500/30/50 px-4 py-2 border border-site-border rounded-lg font-semibold transition-all disabled:opacity-50 text-xs w-full md:w-auto uppercase shadow-sm shrink-0"
                  >
                    {isSubscribing ? (
                      <div className="w-3.5 h-3.5 border-2 border-red-500/30 border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <X className="h-3.5 w-3.5 mr-2" />
                    )}
                    Disable
                  </button>
                ) : (
                  <button
                    onClick={handleSubscribePush}
                    disabled={isSubscribing}
                    className="flex items-center justify-center bg-[var(--site-accent)] hover:bg-[var(--site-accent)]/90 text-white px-4 py-2 border border-transparent rounded-lg font-semibold transition-all disabled:opacity-50 text-xs w-full md:w-auto uppercase shadow-[0_0_15px_rgba(103,176,186,0.3)] shrink-0"
                  >
                    {isSubscribing ? (
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <Bell className="h-3.5 w-3.5 mr-2" />
                    )}
                    Enable
                  </button>
                )}
              </motion.div>
            )}

            <div className="space-y-3">
              {preferenceItems.map((item) => (
                <div
                  key={item.key}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[#1A1C1E] border border-site-border rounded-xl transition-colors hover:border-[var(--site-accent)]/30 gap-4"
                >
                  <div className="flex items-start md:items-center">
                    <div
                      className={`h-10 w-10 min-w-[2.5rem] border ${item.accent} rounded-lg flex items-center justify-center mr-4 shrink-0 shadow-sm`}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1 md:mb-0.5 text-sm">
                        {item.title}
                      </h4>
                      <p className="text-gray-400 text-xs font-medium pr-6 md:pr-0">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end md:block mt-2 md:mt-0 shrink-0">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences[item.key]}
                        onChange={() => togglePreference(item.key)}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-[#222427] border border-site-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 peer-checked:after:bg-[#212328] after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--site-accent)] peer-checked:border-[var(--site-accent)] shadow-inner"></div>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-site-border flex justify-end">
              <button
                onClick={savePreferences}
                disabled={isSaving}
                className="flex items-center bg-[var(--site-accent)] hover:bg-[var(--site-accent)]/90 text-white px-6 py-2.5 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase shadow-[0_0_15px_rgba(103,176,186,0.2)]"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                    {t("saving")}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t("save_button")}
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
