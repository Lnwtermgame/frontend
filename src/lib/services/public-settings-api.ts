import { publicClient } from "@/lib/client/gateway";

export interface PublicSiteSettings {
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

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

class PublicSettingsApiService {
  async getPublicSettings(): Promise<ApiResponse<PublicSiteSettings>> {
    const response = await publicClient.get<ApiResponse<PublicSiteSettings>>(
      "/api/public/settings",
    );
    return response.data;
  }
}

export const publicSettingsApi = new PublicSettingsApiService();
