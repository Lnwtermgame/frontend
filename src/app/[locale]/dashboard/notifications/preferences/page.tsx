"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { useNotifications } from "@/lib/context/notification-context";
import {
  notificationApi,
  NotificationPreferences,
} from "@/lib/services/notification-api";
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
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

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
      accent: "bg-status-info/10 text-status-info border-status-info/20",
    },
    {
      key: "pushNotifications" as const,
      title: t("channels.web"),
      description: t("channels.web_desc"),
      icon: <Bell className="h-4 w-4" />,
      accent: "bg-site-accent/10 text-site-accent border-site-accent/20",
    },
    {
      key: "orderUpdates" as const,
      title: t("types.orders"),
      description: t("types.orders_desc"),
      icon: <Globe className="h-4 w-4" />,
      accent: "bg-status-success/10 text-status-success border-status-success/20",
    },
    {
      key: "promotions" as const,
      title: t("types.promotions"),
      description: t("types.promotions_desc"),
      icon: <Check className="h-4 w-4" />,
      accent: "bg-status-warning/10 text-status-warning border-status-warning/20",
    },
  ];

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-8" />
          <p className="text-site-muted">{tCommon("loading")}</p>
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
          className="mr-4 text-site-muted hover:text-site-text transition-colors border border-site-border-soft hover:border-site-accent p-1.5 rounded-6 bg-site-surface"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-site-text leading-none mb-1 flex items-center">
            <span className="w-1.5 h-6 bg-site-accent mr-3 rounded-full"></span>
            {t("title")}
          </h2>
          <p className="text-[11px] text-site-dim uppercase font-bold tracking-widest leading-none ml-4 pl-3.5 border-l-2 border-site-border-soft">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="site-card p-12 text-center">
          <Skeleton className="w-8 h-8 rounded-full mx-auto mb-4" />
          <p className="text-site-muted">{tCommon("loading")}</p>
        </div>
      ) : (
        <div className="site-card overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-site-border-soft bg-site-raised">
            <h3 className="text-base font-bold text-site-text flex items-center">
              <Bell size={18} className="text-site-accent mr-2.5" />
              {t("title")}
            </h3>
          </div>

          <div className="p-4 sm:p-5">
            {/* Push Notification Status */}
            {isPushSupported && (
              <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-site-surface border border-site-border-soft rounded-8 mb-4 gap-4">
                <div className="flex items-start md:items-center w-full md:w-auto">
                  <div className="h-10 w-10 min-w-[2.5rem] bg-site-accent/10 border border-site-accent/20 rounded-6 flex items-center justify-center mr-4 text-site-accent shrink-0">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-site-text font-semibold text-sm">
                        {t("channels.web")}
                      </h4>
                      {isPushSubscribed && (
                        <Badge variant="success">Enabled</Badge>
                      )}
                    </div>
                    <p className="text-site-muted text-xs font-medium pr-2 md:pr-0">
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
                    className="flex items-center justify-center bg-site-surface hover:bg-status-danger/10 text-site-muted hover:text-status-danger hover:border-status-danger/30 px-4 py-2 border border-site-border-soft rounded-6 font-semibold transition-colors disabled:opacity-50 text-xs w-full md:w-auto uppercase shrink-0"
                  >
                    {isSubscribing ? (
                      <div className="w-3.5 h-3.5 border-2 border-status-danger/20 border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <X className="h-3.5 w-3.5 mr-2" />
                    )}
                    Disable
                  </button>
                ) : (
                  <button
                    onClick={handleSubscribePush}
                    disabled={isSubscribing}
                    className="flex items-center justify-center bg-site-accent hover:bg-site-accent-hover text-site-bg px-4 py-2 border border-transparent rounded-6 font-semibold transition-colors disabled:opacity-50 text-xs w-full md:w-auto uppercase shrink-0"
                  >
                    {isSubscribing ? (
                      <div className="w-3.5 h-3.5 border-2 border-site-bg/30 border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <Bell className="h-3.5 w-3.5 mr-2" />
                    )}
                    Enable
                  </button>
                )}
              </div>
            )}

            <div className="space-y-3">
              {preferenceItems.map((item) => (
                <div
                  key={item.key}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-site-surface border border-site-border-soft rounded-8 transition-colors hover:border-site-accent/30 gap-4"
                >
                  <div className="flex items-start md:items-center">
                    <div
                      className={`h-10 w-10 min-w-[2.5rem] border ${item.accent} rounded-6 flex items-center justify-center mr-4 shrink-0`}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-site-text font-semibold mb-1 md:mb-0.5 text-sm">
                        {item.title}
                      </h4>
                      <p className="text-site-muted text-xs font-medium pr-6 md:pr-0">
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
                      <div className="relative w-11 h-6 bg-site-surface border border-site-border-soft peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-site-bg after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-site-muted peer-checked:after:bg-site-bg after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-site-accent peer-checked:border-site-accent shadow-inner"></div>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-site-border-soft flex justify-end">
              <button
                onClick={savePreferences}
                disabled={isSaving}
                className="flex items-center bg-site-accent hover:bg-site-accent-hover text-site-bg px-6 py-2.5 rounded-6 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-site-bg/30 border-t-transparent rounded-full animate-spin mr-2"></div>
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
        </div>
      )}
    </div>
  );
}
