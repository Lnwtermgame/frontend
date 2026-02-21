import { authClient } from "@/lib/client/gateway";

export interface AdminSiteSettings {
  general: {
    siteName: string;
    siteTagline?: string;
    supportEmail: string;
    supportPhone?: string;
    defaultLanguage: string;
    defaultCurrency: string;
    timezone: string;
  };
  branding: {
    logoUrl?: string | null;
    faviconUrl?: string | null;
    primaryColor: string;
    secondaryColor: string;
  };
  homepage: {
    heroTitle?: string;
    heroSubtitle?: string;
    announcementEnabled: boolean;
    announcementText?: string;
    featuredCategorySlugs: string[];
    promoCards: Array<{
      id: string;
      badge?: string;
      title: string;
      description?: string;
      ctaText?: string;
      href?: string;
      theme: "blue" | "pink" | "yellow" | "green";
    }>;
    newsItems: Array<{
      id: string;
      title: string;
      image: string;
      date: string;
      category: string;
      href?: string;
    }>;
    seasonalEvents: Array<{
      id: string;
      title: string;
      description: string;
      image: string;
      startDate: string;
      endDate: string;
      type: "cashback" | "discount" | "bonus" | "special";
      discount?: string;
      discountColor?: "blue" | "purple" | "green" | "pink";
      games?: string[];
      href?: string;
    }>;
    heroSlides: Array<{
      id: string;
      title: string;
      subtitle?: string;
      image: string;
      link?: string;
      color: "yellow" | "pink" | "blue" | "green";
      badgeText?: string;
    }>;
    categoryTabs: Array<{
      id: "all" | "hot" | "cards";
      label: string;
      icon: "gamepad" | "flame" | "card";
    }>;
    quickActions: Array<{
      id: string;
      label: string;
      href: string;
      icon: "credit-card" | "gift" | "star" | "headphones";
      color: "yellow" | "pink" | "green" | "blue";
    }>;
    trustBadges: Array<{
      id: string;
      title: string;
      description?: string;
      icon: "shield" | "headphones" | "zap";
    }>;
    sectionLabels: {
      featuredProductsTitle: string;
      specialsTitle: string;
      newsTitle: string;
      viewAllText: string;
      heroButtonText: string;
    };
  };
  commerce: {
    allowGuestCheckout: boolean;
    taxPercent: number;
    minTopupAmount: number;
    maxTopupAmount: number;
    orderAutoCancelMinutes: number;
  };
  features: {
    enablePromotions: boolean;
    enableSupportTickets: boolean;
    enableUserRegistration: boolean;
    enableMaintenanceMode: boolean;
    maintenanceMessage?: string;
  };
  social: {
    facebookUrl?: string | null;
    lineUrl?: string | null;
    discordUrl?: string | null;
  };
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords: string[];
  };
}

export interface AdminSiteSettingsMeta {
  updatedBy: string | null;
  updatedAt: string | null;
  publishedBy: string | null;
  publishedAt: string | null;
  isDraftDirty: boolean;
}

export interface AdminSettingsPermissionRow {
  adminId: string;
  username: string;
  email: string;
  read: boolean;
  write: boolean;
}

export interface AdminSettingsAuditLog {
  id: string;
  action: "UPDATE" | "RESET" | string;
  diff: unknown;
  createdAt: string;
  actorId: string | null;
  actor: { username: string; email: string } | null;
}

type SettingsEnvelope = {
  settings: AdminSiteSettings;
  liveSettings: AdminSiteSettings;
  meta: AdminSiteSettingsMeta;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

class AdminSettingsApiService {
  async getSettings(): Promise<ApiResponse<SettingsEnvelope>> {
    const response = await authClient.get<ApiResponse<SettingsEnvelope>>(
      "/api/admin/settings",
    );
    return response.data;
  }

  async updateSettings(
    payload: Partial<AdminSiteSettings>,
  ): Promise<ApiResponse<SettingsEnvelope>> {
    const response = await authClient.put<ApiResponse<SettingsEnvelope>>(
      "/api/admin/settings",
      payload,
    );
    return response.data;
  }

  async resetSettings(): Promise<ApiResponse<SettingsEnvelope>> {
    const response = await authClient.post<ApiResponse<SettingsEnvelope>>(
      "/api/admin/settings/reset",
    );
    return response.data;
  }

  async publishSettings(): Promise<ApiResponse<SettingsEnvelope>> {
    const response = await authClient.post<ApiResponse<SettingsEnvelope>>(
      "/api/admin/settings/publish",
    );
    return response.data;
  }

  async getPermissions(): Promise<ApiResponse<AdminSettingsPermissionRow[]>> {
    const response = await authClient.get<
      ApiResponse<AdminSettingsPermissionRow[]>
    >("/api/admin/settings/permissions");
    return response.data;
  }

  async updatePermission(
    adminId: string,
    payload: { read?: boolean; write?: boolean },
  ): Promise<ApiResponse<AdminSettingsPermissionRow | null>> {
    const response = await authClient.put<
      ApiResponse<AdminSettingsPermissionRow | null>
    >(`/api/admin/settings/permissions/${adminId}`, payload);
    return response.data;
  }

  async getAuditLogs(
    page = 1,
    limit = 20,
  ): Promise<
    ApiResponse<{
      logs: AdminSettingsAuditLog[];
      meta: { total: number; page: number; limit: number; totalPages: number };
    }>
  > {
    const response = await authClient.get<
      ApiResponse<{
        logs: AdminSettingsAuditLog[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }>
    >(`/api/admin/settings/audit?page=${page}&limit=${limit}`);
    return response.data;
  }

  getErrorMessage(error: unknown): string {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      return axiosError.response?.data?.error?.message || "เกิดข้อผิดพลาด";
    }
    if (error instanceof Error) {
      return error.message;
    }
    return "เกิดข้อผิดพลาดที่ไม่คาดคิด";
  }
}

export const adminSettingsApi = new AdminSettingsApiService();
