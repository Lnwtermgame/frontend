import { authClient } from "@/lib/client/gateway";

export interface Device {
  id: string;
  name: string;
  browser: string;
  os: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface SecurityActivity {
  id: string;
  type: "login" | "password-change" | "security-settings" | "payment" | "other";
  description: string;
  ip: string;
  location: string;
  timestamp: string;
  suspicious: boolean;
  resolved: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorMethod: "2fa-app" | "sms" | "email" | null;
  emailVerified: boolean;
  loginNotifications: boolean;
  securityQuestions: boolean;
}

export interface TwoFactorSetupResponse {
  success: boolean;
  data: {
    secret: string;
    qrCodeUrl: string;
  };
}

export interface DevicesResponse {
  success: boolean;
  data: Device[];
}

export interface SecuritySettingsResponse {
  success: boolean;
  data: SecuritySettings;
}

export interface ActivitiesResponse {
  success: boolean;
  data: SecurityActivity[];
}

export interface BackupCodesResponse {
  success: boolean;
  data: string[];
}

export interface GenericResponse {
  success: boolean;
  data?: { message?: string; [key: string]: any };
  message?: string;
}

// Merged: Security service now part of Auth service (port 3001)
// All endpoints prefixed with /api/auth/security instead of /api/security
class SecurityApiService {
  /**
   * Get user's devices
   */
  async getDevices(): Promise<DevicesResponse> {
    const response = await authClient.get<DevicesResponse>(
      "/api/auth/security/devices",
    );
    return response.data;
  }

  /**
   * Remove a device
   */
  async removeDevice(deviceId: string): Promise<GenericResponse> {
    const response = await authClient.delete<GenericResponse>(
      `/api/auth/security/devices/${deviceId}`,
    );
    return response.data;
  }

  /**
   * Logout from all devices
   */
  async logoutAllDevices(): Promise<GenericResponse> {
    const response = await authClient.post<GenericResponse>(
      "/api/auth/security/logout-all",
    );
    return response.data;
  }

  /**
   * Setup 2FA
   */
  async setupTwoFactor(
    method: "2fa-app" | "sms" | "email",
  ): Promise<TwoFactorSetupResponse> {
    const response = await authClient.post<TwoFactorSetupResponse>(
      "/api/auth/security/2fa/setup",
      { method },
    );
    return response.data;
  }

  /**
   * Verify 2FA code and enable 2FA
   */
  async verifyTwoFactor(
    code: string,
  ): Promise<{ success: boolean; data: { verified: boolean } }> {
    const response = await authClient.post<{
      success: boolean;
      data: { verified: boolean };
    }>("/api/auth/security/2fa/verify", { code });
    return response.data;
  }

  /**
   * Disable 2FA
   */
  async disableTwoFactor(
    password: string,
  ): Promise<{ success: boolean; data: { disabled: boolean } }> {
    const response = await authClient.post<{
      success: boolean;
      data: { disabled: boolean };
    }>("/api/auth/security/2fa/disable", { password });
    return response.data;
  }

  /**
   * Get backup codes
   */
  async getBackupCodes(): Promise<BackupCodesResponse> {
    const response = await authClient.get<BackupCodesResponse>(
      "/api/auth/security/backup-codes",
    );
    return response.data;
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(): Promise<BackupCodesResponse> {
    const response = await authClient.post<BackupCodesResponse>(
      "/api/auth/security/backup-codes/regenerate",
    );
    return response.data;
  }

  /**
   * Get security settings
   */
  async getSecuritySettings(): Promise<SecuritySettingsResponse> {
    const response = await authClient.get<SecuritySettingsResponse>(
      "/api/auth/security/settings",
    );
    return response.data;
  }

  /**
   * Update security settings
   */
  async updateSecuritySettings(
    settings: Partial<SecuritySettings>,
  ): Promise<GenericResponse> {
    const response = await authClient.put<GenericResponse>(
      "/api/auth/security/settings",
      settings,
    );
    return response.data;
  }

  /**
   * Get suspicious activities
   */
  async getSuspiciousActivities(): Promise<ActivitiesResponse> {
    const response = await authClient.get<ActivitiesResponse>(
      "/api/auth/security/activities",
    );
    return response.data;
  }

  /**
   * Resolve suspicious activity
   */
  async resolveActivity(activityId: string): Promise<GenericResponse> {
    const response = await authClient.put<GenericResponse>(
      `/api/auth/security/activities/${activityId}/resolve`,
    );
    return response.data;
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(): Promise<GenericResponse> {
    const response = await authClient.post<GenericResponse>(
      "/api/auth/security/send-verification-email",
    );
    return response.data;
  }

  getErrorMessage(error: unknown): string {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      return axiosError.response?.data?.error?.message || "An error occurred";
    }
    if (error instanceof Error) {
      return error.message;
    }
    return "An unexpected error occurred";
  }
}

export const securityApi = new SecurityApiService();
