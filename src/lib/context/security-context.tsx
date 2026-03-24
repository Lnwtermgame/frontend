"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useAuth } from "../hooks/use-auth";
import {
  securityApi,
  Device,
  SecurityActivity,
  SecuritySettings,
} from "../services/security-api";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

// Minimum time between security data refreshes (5 seconds)
const MIN_REFRESH_INTERVAL = 5000;

export interface SecuritySettingsExtended extends SecuritySettings {
  passwordLastChanged: string | null;
  recentDevices: Device[];
  suspiciousActivities: SecurityActivity[];
}

type SecurityContextType = {
  securitySettings: SecuritySettingsExtended;
  updateSecuritySettings: (settings: Partial<SecuritySettingsExtended>) => void;
  sendVerificationEmail: () => Promise<boolean>;
  setupTwoFactor: (
    method: "2fa-app" | "sms" | "email",
  ) => Promise<{ success: boolean; secret?: string; qrCodeUrl?: string }>;
  verifyTwoFactorCode: (code: string) => Promise<boolean>;
  disableTwoFactor: (password: string) => Promise<boolean>;
  logoutAllDevices: () => Promise<boolean>;
  removeDevice: (deviceId: string) => Promise<boolean>;
  resolveActivity: (activityId: string) => Promise<void>;
  isLoadingSettings: boolean;
  is2FAVerified: boolean;
  generateBackupCodes: () => Promise<string[]>;
  refreshSecurityData: () => Promise<void>;
};

export const SecurityContext = createContext<SecurityContextType | undefined>(
  undefined,
);

export function SecurityProvider({ children }: { children: ReactNode }) {
  const t = useTranslations();
  const { user } = useAuth();
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [is2FAVerified, setIs2FAVerified] = useState(false);

  // Refs for request deduplication
  const lastFetchTime = useRef<number>(0);
  const isFetching = useRef<boolean>(false);
  const pendingPromise = useRef<Promise<void> | null>(null);

  const [securitySettings, setSecuritySettings] =
    useState<SecuritySettingsExtended>({
      twoFactorEnabled: false,
      twoFactorMethod: null,
      emailVerified: false,
      passwordLastChanged: null,
      loginNotifications: true,
      securityQuestions: false,
      recentDevices: [],
      suspiciousActivities: [],
    });

  // Fetch security data from API with deduplication
  const refreshSecurityData = useCallback(async () => {
    if (!user) return;

    // Return existing promise if fetch is already in progress
    if (pendingPromise.current) {
      return pendingPromise.current;
    }

    // Skip if fetched recently (within MIN_REFRESH_INTERVAL)
    const now = Date.now();
    if (
      now - lastFetchTime.current < MIN_REFRESH_INTERVAL &&
      !isFetching.current
    ) {
      return;
    }

    // Create the fetch promise
    const fetchPromise = (async () => {
      isFetching.current = true;
      setIsLoadingSettings(true);

      try {
        const [settingsRes, devicesRes, activitiesRes] = await Promise.all([
          securityApi.getSecuritySettings(),
          securityApi.getDevices(),
          securityApi.getSuspiciousActivities(),
        ]);

        if (settingsRes.success) {
          setSecuritySettings((prev) => ({
            ...prev,
            twoFactorEnabled: settingsRes.data.twoFactorEnabled,
            twoFactorMethod: settingsRes.data.twoFactorMethod,
            emailVerified: settingsRes.data.emailVerified,
            loginNotifications: settingsRes.data.loginNotifications,
            securityQuestions: settingsRes.data.securityQuestions,
          }));
        }

        if (devicesRes.success) {
          setSecuritySettings((prev) => ({
            ...prev,
            recentDevices: devicesRes.data,
          }));
        }

        if (activitiesRes.success) {
          setSecuritySettings((prev) => ({
            ...prev,
            suspiciousActivities: activitiesRes.data,
          }));
        }

        lastFetchTime.current = Date.now();
      } catch (error) {
        console.error("Error fetching security data:", error);
        toast.error(t("security_data_load_error"));
      } finally {
        setIsLoadingSettings(false);
        isFetching.current = false;
        pendingPromise.current = null;
      }
    })();

    pendingPromise.current = fetchPromise;
    return fetchPromise;
  }, [user, t]);

  // Security data is loaded lazily - only when refreshSecurityData() is called
  // (e.g., on the security settings page), NOT on every page load

  const updateSecuritySettings = useCallback(async (
    settings: Partial<SecuritySettingsExtended>,
  ) => {
    // Update local state immediately for responsiveness
    setSecuritySettings((prevSettings) => ({
      ...prevSettings,
      ...settings,
    }));

    // Persist settings that have backend fields
    const apiFields: Partial<SecuritySettings> = {};
    if (settings.loginNotifications !== undefined)
      apiFields.loginNotifications = settings.loginNotifications;
    if (settings.securityQuestions !== undefined)
      apiFields.securityQuestions = settings.securityQuestions;

    if (Object.keys(apiFields).length > 0) {
      try {
        await securityApi.updateSecuritySettings(apiFields);
      } catch (error) {
        const message = securityApi.getErrorMessage(error);
        toast.error(message || t("settings_save_error"));
        // Revert on failure
        setSecuritySettings((prevSettings) => ({
          ...prevSettings,
          ...Object.fromEntries(
            Object.keys(apiFields).map((key) => [
              key,
              !apiFields[key as keyof typeof apiFields],
            ]),
          ),
        }));
      }
    }
  }, [t]);

  const sendVerificationEmail = useCallback(async (): Promise<boolean> => {
    setIsLoadingSettings(true);
    try {
      const response = await securityApi.sendVerificationEmail();
      if (response.success) {
        updateSecuritySettings({ emailVerified: true });
        toast.success(t("email_verified_success"));
        return true;
      }
      return false;
    } catch (error) {
      const message = securityApi.getErrorMessage(error);
      toast.error(message || t("email_verify_send_error"));
      return false;
    } finally {
      setIsLoadingSettings(false);
    }
  }, [updateSecuritySettings, t]);

  const setupTwoFactor = useCallback(async (
    method: "2fa-app" | "sms" | "email",
  ): Promise<{ success: boolean; secret?: string; qrCodeUrl?: string }> => {
    setIsLoadingSettings(true);
    try {
      const response = await securityApi.setupTwoFactor(method);

      if (response.success) {
        updateSecuritySettings({ twoFactorMethod: method });
        return {
          success: true,
          secret: response.data.secret,
          qrCodeUrl: response.data.qrCodeUrl,
        };
      }
      return { success: false };
    } catch (error) {
      const message = securityApi.getErrorMessage(error);
      toast.error(message || t("2fa_setup_error"));
      return { success: false };
    } finally {
      setIsLoadingSettings(false);
    }
  }, [updateSecuritySettings, t]);

  const verifyTwoFactorCode = useCallback(async (code: string): Promise<boolean> => {
    setIsLoadingSettings(true);
    try {
      const response = await securityApi.verifyTwoFactor(code);

      if (response.success && response.data.verified) {
        setIs2FAVerified(true);
        updateSecuritySettings({
          twoFactorEnabled: true,
        });
        toast.success(t("2fa_enable_success"));
        return true;
      }
      return false;
    } catch (error) {
      const message = securityApi.getErrorMessage(error);
      toast.error(message || t("invalid_verify_code"));
      return false;
    } finally {
      setIsLoadingSettings(false);
    }
  }, [updateSecuritySettings, t]);

  const disableTwoFactor = useCallback(async (password: string): Promise<boolean> => {
    setIsLoadingSettings(true);
    try {
      const response = await securityApi.disableTwoFactor(password);

      if (response.success && response.data.disabled) {
        updateSecuritySettings({
          twoFactorEnabled: false,
          twoFactorMethod: null,
        });
        toast.success(t("2fa_disable_success"));
        return true;
      }
      return false;
    } catch (error) {
      const message = securityApi.getErrorMessage(error);
      toast.error(message || t("invalid_password"));
      return false;
    } finally {
      setIsLoadingSettings(false);
    }
  }, [updateSecuritySettings, t]);

  const logoutAllDevices = useCallback(async (): Promise<boolean> => {
    setIsLoadingSettings(true);
    try {
      const response = await securityApi.logoutAllDevices();

      if (response.success) {
        const devicesRes = await securityApi.getDevices();
        if (devicesRes.success) {
          updateSecuritySettings({
            recentDevices: devicesRes.data,
          });
        }
        toast.success(t("logout_all_success"));
        return true;
      }
      return false;
    } catch (error) {
      const message = securityApi.getErrorMessage(error);
      toast.error(message || t("logout_all_error"));
      return false;
    } finally {
      setIsLoadingSettings(false);
    }
  }, [updateSecuritySettings, t]);

  const removeDevice = useCallback(async (deviceId: string): Promise<boolean> => {
    setIsLoadingSettings(true);
    try {
      const response = await securityApi.removeDevice(deviceId);

      if (response.success) {
        setSecuritySettings((prev) => ({
          ...prev,
          recentDevices: prev.recentDevices.filter((d) => d.id !== deviceId),
        }));
        toast.success(t("device_remove_success"));
        return true;
      }
      return false;
    } catch (error) {
      const message = securityApi.getErrorMessage(error);
      toast.error(message || t("device_remove_error"));
      return false;
    } finally {
      setIsLoadingSettings(false);
    }
  }, [t]);

  const resolveActivity = useCallback(async (activityId: string): Promise<void> => {
    try {
      const response = await securityApi.resolveActivity(activityId);

      if (response.success) {
        setSecuritySettings((prev) => ({
          ...prev,
          suspiciousActivities: prev.suspiciousActivities.map(
            (activity) =>
              activity.id === activityId
                ? { ...activity, resolved: true }
                : activity,
          ),
        }));
        toast.success(t("marked_as_verified"));
      }
    } catch (error) {
      const message = securityApi.getErrorMessage(error);
      toast.error(message || t("status_update_error"));
    }
  }, [t]);

  const generateBackupCodes = useCallback(async (): Promise<string[]> => {
    setIsLoadingSettings(true);
    try {
      const response = await securityApi.regenerateBackupCodes();

      if (response.success) {
        return response.data;
      }
      return [];
    } catch (error) {
      const message = securityApi.getErrorMessage(error);
      toast.error(message || t("backup_code_error"));
      return [];
    } finally {
      setIsLoadingSettings(false);
    }
  }, [t]);

  const contextValue = useMemo(() => ({
    securitySettings,
    updateSecuritySettings,
    sendVerificationEmail,
    setupTwoFactor,
    verifyTwoFactorCode,
    disableTwoFactor,
    logoutAllDevices,
    removeDevice,
    resolveActivity,
    isLoadingSettings,
    is2FAVerified,
    generateBackupCodes,
    refreshSecurityData,
  }), [
    securitySettings, updateSecuritySettings, sendVerificationEmail,
    setupTwoFactor, verifyTwoFactorCode, disableTwoFactor,
    logoutAllDevices, removeDevice, resolveActivity,
    isLoadingSettings, is2FAVerified, generateBackupCodes, refreshSecurityData,
  ]);

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  );
}

// Custom hook to use the security context
export function useSecurity() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error("useSecurity must be used within a SecurityProvider");
  }
  return context;
}
