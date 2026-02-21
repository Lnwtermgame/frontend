"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "../hooks/use-auth";
import {
  securityApi,
  Device,
  SecurityActivity,
  SecuritySettings,
} from "../services/security-api";
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
        toast.error("ไม่สามารถโหลดข้อมูลความปลอดภัยได้");
      } finally {
        setIsLoadingSettings(false);
        isFetching.current = false;
        pendingPromise.current = null;
      }
    })();

    pendingPromise.current = fetchPromise;
    return fetchPromise;
  }, [user]);

  // Security data is loaded lazily - only when refreshSecurityData() is called
  // (e.g., on the security settings page), NOT on every page load

  const updateSecuritySettings = async (
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
        toast.error(message || "ไม่สามารถบันทึกการตั้งค่าได้");
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
  };

  const sendVerificationEmail = async (): Promise<boolean> => {
    setIsLoadingSettings(true);
    try {
      const response = await securityApi.sendVerificationEmail();
      if (response.success) {
        updateSecuritySettings({ emailVerified: true });
        toast.success("ยืนยันอีเมลสำเร็จ");
        return true;
      }
      return false;
    } catch (error) {
      const message = securityApi.getErrorMessage(error);
      toast.error(message || "ไม่สามารถส่งอีเมลยืนยันได้");
      return false;
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const setupTwoFactor = async (
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
      toast.error(message || "ไม่สามารถตั้งค่า 2FA ได้");
      return { success: false };
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const verifyTwoFactorCode = async (code: string): Promise<boolean> => {
    setIsLoadingSettings(true);
    try {
      const response = await securityApi.verifyTwoFactor(code);

      if (response.success && response.data.verified) {
        setIs2FAVerified(true);
        updateSecuritySettings({
          twoFactorEnabled: true,
        });
        toast.success("เปิดใช้งาน 2FA สำเร็จ");
        return true;
      }
      return false;
    } catch (error) {
      const message = securityApi.getErrorMessage(error);
      toast.error(message || "รหัสยืนยันไม่ถูกต้อง");
      return false;
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const disableTwoFactor = async (password: string): Promise<boolean> => {
    setIsLoadingSettings(true);
    try {
      const response = await securityApi.disableTwoFactor(password);

      if (response.success && response.data.disabled) {
        updateSecuritySettings({
          twoFactorEnabled: false,
          twoFactorMethod: null,
        });
        toast.success("ปิดใช้งาน 2FA สำเร็จ");
        return true;
      }
      return false;
    } catch (error) {
      const message = securityApi.getErrorMessage(error);
      toast.error(message || "รหัสผ่านไม่ถูกต้อง");
      return false;
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const logoutAllDevices = async (): Promise<boolean> => {
    setIsLoadingSettings(true);
    try {
      const response = await securityApi.logoutAllDevices();

      if (response.success) {
        // Refresh devices list
        const devicesRes = await securityApi.getDevices();
        if (devicesRes.success) {
          updateSecuritySettings({
            recentDevices: devicesRes.data,
          });
        }
        toast.success("ออกจากระบบทุกอุปกรณ์สำเร็จ");
        return true;
      }
      return false;
    } catch (error) {
      const message = securityApi.getErrorMessage(error);
      toast.error(message || "ไม่สามารถออกจากระบบทุกอุปกรณ์ได้");
      return false;
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const removeDevice = async (deviceId: string): Promise<boolean> => {
    setIsLoadingSettings(true);
    try {
      const response = await securityApi.removeDevice(deviceId);

      if (response.success) {
        // Update local state
        updateSecuritySettings({
          recentDevices: securitySettings.recentDevices.filter(
            (d) => d.id !== deviceId,
          ),
        });
        toast.success("ลบอุปกรณ์สำเร็จ");
        return true;
      }
      return false;
    } catch (error) {
      const message = securityApi.getErrorMessage(error);
      toast.error(message || "ไม่สามารถลบอุปกรณ์ได้");
      return false;
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const resolveActivity = async (activityId: string): Promise<void> => {
    try {
      const response = await securityApi.resolveActivity(activityId);

      if (response.success) {
        updateSecuritySettings({
          suspiciousActivities: securitySettings.suspiciousActivities.map(
            (activity) =>
              activity.id === activityId
                ? { ...activity, resolved: true }
                : activity,
          ),
        });
        toast.success("ทำเครื่องหมายว่าตรวจสอบแล้ว");
      }
    } catch (error) {
      const message = securityApi.getErrorMessage(error);
      toast.error(message || "ไม่สามารถอัปเดตสถานะได้");
    }
  };

  const generateBackupCodes = async (): Promise<string[]> => {
    setIsLoadingSettings(true);
    try {
      const response = await securityApi.regenerateBackupCodes();

      if (response.success) {
        return response.data;
      }
      return [];
    } catch (error) {
      const message = securityApi.getErrorMessage(error);
      toast.error(message || "ไม่สามารถสร้างรหัสสำรองได้");
      return [];
    } finally {
      setIsLoadingSettings(false);
    }
  };

  return (
    <SecurityContext.Provider
      value={{
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
      }}
    >
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
