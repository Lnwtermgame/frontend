"use client";

import { useEffect, useMemo, useState } from "react";
import {
  GripVertical,
  Loader2,
  Plus,
  RefreshCcw,
  Save,
  Settings2,
  Upload,
  X,
} from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  AdminSettingsAuditLog,
  AdminSettingsPermissionRow,
  AdminSiteSettings,
  adminSettingsApi,
} from "@/lib/services/admin-settings-api";

type LandingBlockKey = "promoCards" | "newsItems" | "seasonalEvents";

type PromoCardItem = AdminSiteSettings["homepage"]["promoCards"][number];
type NewsItem = AdminSiteSettings["homepage"]["newsItems"][number];
type SeasonalEventItem =
  AdminSiteSettings["homepage"]["seasonalEvents"][number];
type HeroSlideItem = AdminSiteSettings["homepage"]["heroSlides"][number];
type CategoryTabItem = AdminSiteSettings["homepage"]["categoryTabs"][number];
type QuickActionItem = AdminSiteSettings["homepage"]["quickActions"][number];
type TrustBadgeItem = AdminSiteSettings["homepage"]["trustBadges"][number];

const EMPTY_SETTINGS: AdminSiteSettings = {
  general: {
    siteName: "",
    siteTagline: "",
    supportEmail: "",
    supportPhone: "",
    defaultLanguage: "th",
    defaultCurrency: "THB",
    timezone: "Asia/Bangkok",
  },
  branding: {
    logoUrl: "",
    faviconUrl: "",
    primaryColor: "#FF6B9D",
    secondaryColor: "#95E1D3",
  },
  homepage: {
    heroTitle: "",
    heroSubtitle: "",
    announcementEnabled: false,
    announcementText: "",
    featuredCategorySlugs: [],
    promoCards: [],
    newsItems: [],
    seasonalEvents: [],
    heroSlides: [],
    categoryTabs: [],
    quickActions: [],
    trustBadges: [],
    sectionLabels: {
      featuredProductsTitle: "เกมแนะนำ",
      specialsTitle: "โปรโมชั่นพิเศษ",
      newsTitle: "ข่าวสารล่าสุด",
      viewAllText: "ทั้งหมด",
      heroButtonText: "ดูรายละเอียด",
    },
  },
  commerce: {
    allowGuestCheckout: false,
    taxPercent: 0,
    minTopupAmount: 0,
    maxTopupAmount: 20000,
    orderAutoCancelMinutes: 30,
  },
  features: {
    enablePromotions: true,
    enableSupportTickets: true,
    enableUserRegistration: true,
    enableMaintenanceMode: false,
    maintenanceMessage: "",
  },
  social: {
    facebookUrl: "",
    lineUrl: "",
    discordUrl: "",
  },
  seo: {
    metaTitle: "",
    metaDescription: "",
    metaKeywords: [],
  },
};

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createPromoCard = (): PromoCardItem => ({
  id: uid(),
  title: "",
  badge: "",
  description: "",
  ctaText: "",
  href: "",
  theme: "blue",
});

const createNewsItem = (): NewsItem => ({
  id: uid(),
  title: "",
  image: "https://placehold.co/400x250?text=News",
  date: "",
  category: "",
  href: "",
});

const createSeasonalEvent = (): SeasonalEventItem => ({
  id: uid(),
  title: "",
  description: "",
  image: "https://placehold.co/1200x400?text=Event",
  startDate: "",
  endDate: "",
  type: "special",
  discount: "",
  discountColor: "blue",
  games: [],
  href: "",
});

const createHeroSlide = (): HeroSlideItem => ({
  id: uid(),
  title: "",
  subtitle: "",
  image: "https://placehold.co/1200x400?text=Hero",
  link: "",
  color: "yellow",
  badgeText: "",
});

const createCategoryTab = (): CategoryTabItem => ({
  id: "all",
  label: "",
  icon: "gamepad",
});

const createQuickAction = (): QuickActionItem => ({
  id: uid(),
  label: "",
  href: "/",
  icon: "credit-card",
  color: "yellow",
});

const createTrustBadge = (): TrustBadgeItem => ({
  id: uid(),
  title: "",
  description: "",
  icon: "shield",
});

function parseCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toCsv(values: string[]): string {
  return values.join(", ");
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSiteSettings>(EMPTY_SETTINGS);
  const [liveSettings, setLiveSettings] =
    useState<AdminSiteSettings>(EMPTY_SETTINGS);
  const [baseline, setBaseline] = useState<AdminSiteSettings>(EMPTY_SETTINGS);

  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [updatedBy, setUpdatedBy] = useState<string | null>(null);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [publishedBy, setPublishedBy] = useState<string | null>(null);
  const [isDraftDirty, setIsDraftDirty] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [permissions, setPermissions] = useState<AdminSettingsPermissionRow[]>(
    [],
  );
  const [auditLogs, setAuditLogs] = useState<AdminSettingsAuditLog[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);

  const [dragState, setDragState] = useState<{
    block: LandingBlockKey;
    index: number;
  } | null>(null);

  const hasChanges = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(baseline),
    [settings, baseline],
  );

  const applyEnvelope = (data: {
    settings: AdminSiteSettings;
    liveSettings: AdminSiteSettings;
    meta: {
      updatedBy: string | null;
      updatedAt: string | null;
      publishedBy: string | null;
      publishedAt: string | null;
      isDraftDirty: boolean;
    };
  }) => {
    setSettings(data.settings);
    setBaseline(data.settings);
    setLiveSettings(data.liveSettings);
    setUpdatedBy(data.meta.updatedBy);
    setUpdatedAt(data.meta.updatedAt);
    setPublishedBy(data.meta.publishedBy);
    setPublishedAt(data.meta.publishedAt);
    setIsDraftDirty(data.meta.isDraftDirty);
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await adminSettingsApi.getSettings();
      applyEnvelope(response.data);
      setError(null);
    } catch (err) {
      setError(adminSettingsApi.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      const response = await adminSettingsApi.getPermissions();
      setPermissions(response.data);
    } catch (err) {
      setError(adminSettingsApi.getErrorMessage(err));
    }
  };

  const loadAuditLogs = async (page = auditPage) => {
    try {
      const response = await adminSettingsApi.getAuditLogs(page, 10);
      setAuditLogs(response.data.logs);
      setAuditPage(response.data.meta.page);
      setAuditTotalPages(response.data.meta.totalPages);
    } catch (err) {
      setError(adminSettingsApi.getErrorMessage(err));
    }
  };

  useEffect(() => {
    loadSettings();
    loadPermissions();
    loadAuditLogs(1);
  }, []);

  const updatePermission = async (
    adminId: string,
    key: "read" | "write",
    value: boolean,
  ) => {
    try {
      await adminSettingsApi.updatePermission(adminId, { [key]: value });
      await Promise.all([loadPermissions(), loadAuditLogs(1)]);
      setSuccess("อัปเดตสิทธิ์เรียบร้อยแล้ว");
      setError(null);
    } catch (err) {
      setError(adminSettingsApi.getErrorMessage(err));
    }
  };

  const flattenDiff = (node: unknown, prefix = ""): string[] => {
    if (!node || typeof node !== "object") return [];
    const obj = node as Record<string, unknown>;
    if ("before" in obj && "after" in obj) {
      return [
        `${prefix}: ${JSON.stringify(obj.before)} -> ${JSON.stringify(obj.after)}`,
      ];
    }
    return Object.entries(obj).flatMap(([key, value]) =>
      flattenDiff(value, prefix ? `${prefix}.${key}` : key),
    );
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await adminSettingsApi.updateSettings(settings);
      applyEnvelope(response.data);
      setSuccess("บันทึกฉบับร่างเรียบร้อยแล้ว");
      setError(null);
      await loadAuditLogs(1);
    } catch (err) {
      setError(adminSettingsApi.getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const publishSettings = async () => {
    try {
      setPublishing(true);
      const response = await adminSettingsApi.publishSettings();
      applyEnvelope(response.data);
      setSuccess("เผยแพร่ draft ไป live เรียบร้อยแล้ว");
      setError(null);
      await loadAuditLogs(1);
    } catch (err) {
      setError(adminSettingsApi.getErrorMessage(err));
    } finally {
      setPublishing(false);
    }
  };

  const resetDraft = async () => {
    try {
      setResetting(true);
      const response = await adminSettingsApi.resetSettings();
      applyEnvelope(response.data);
      setSuccess("รีเซ็ต draft เป็นค่าเริ่มต้นแล้ว");
      setError(null);
      await loadAuditLogs(1);
    } catch (err) {
      setError(adminSettingsApi.getErrorMessage(err));
    } finally {
      setResetting(false);
    }
  };

  const reorderBlock = (block: LandingBlockKey, from: number, to: number) => {
    if (from === to) return;

    setSettings((prev) => {
      const list = [...prev.homepage[block]];
      const [moved] = list.splice(from, 1);
      list.splice(to, 0, moved as never);
      return {
        ...prev,
        homepage: {
          ...prev.homepage,
          [block]: list,
        },
      };
    });
  };

  const handleDragStart = (block: LandingBlockKey, index: number) => {
    setDragState({ block, index });
  };

  const handleDrop = (block: LandingBlockKey, targetIndex: number) => {
    if (!dragState || dragState.block !== block) return;
    reorderBlock(block, dragState.index, targetIndex);
    setDragState(null);
  };

  const addBlockItem = (block: LandingBlockKey) => {
    setSettings((prev) => {
      const item =
        block === "promoCards"
          ? createPromoCard()
          : block === "newsItems"
            ? createNewsItem()
            : createSeasonalEvent();

      return {
        ...prev,
        homepage: {
          ...prev.homepage,
          [block]: [...prev.homepage[block], item as never],
        },
      };
    });
  };

  const removeBlockItem = (block: LandingBlockKey, index: number) => {
    setSettings((prev) => ({
      ...prev,
      homepage: {
        ...prev.homepage,
        [block]: prev.homepage[block].filter((_, i) => i !== index),
      },
    }));
  };

  const updatePromo = (
    index: number,
    field: keyof PromoCardItem,
    value: string,
  ) => {
    setSettings((prev) => {
      const list = [...prev.homepage.promoCards];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, homepage: { ...prev.homepage, promoCards: list } };
    });
  };

  const updateNews = (index: number, field: keyof NewsItem, value: string) => {
    setSettings((prev) => {
      const list = [...prev.homepage.newsItems];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, homepage: { ...prev.homepage, newsItems: list } };
    });
  };

  const updateEvent = (
    index: number,
    field: keyof SeasonalEventItem,
    value: string,
  ) => {
    setSettings((prev) => {
      const list = [...prev.homepage.seasonalEvents];
      const target = { ...list[index], [field]: value };
      if (field === "games") {
        target.games = parseCsv(value);
      }
      list[index] = target;
      return { ...prev, homepage: { ...prev.homepage, seasonalEvents: list } };
    });
  };

  const addHeroSlide = () => {
    setSettings((prev) => ({
      ...prev,
      homepage: {
        ...prev.homepage,
        heroSlides: [...prev.homepage.heroSlides, createHeroSlide()],
      },
    }));
  };

  const updateHeroSlide = (
    index: number,
    field: keyof HeroSlideItem,
    value: string,
  ) => {
    setSettings((prev) => {
      const list = [...prev.homepage.heroSlides];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, homepage: { ...prev.homepage, heroSlides: list } };
    });
  };

  const removeHeroSlide = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      homepage: {
        ...prev.homepage,
        heroSlides: prev.homepage.heroSlides.filter((_, i) => i !== index),
      },
    }));
  };

  const addCategoryTab = () => {
    setSettings((prev) => ({
      ...prev,
      homepage: {
        ...prev.homepage,
        categoryTabs: [...prev.homepage.categoryTabs, createCategoryTab()],
      },
    }));
  };

  const updateCategoryTab = (
    index: number,
    field: keyof CategoryTabItem,
    value: string,
  ) => {
    setSettings((prev) => {
      const list = [...prev.homepage.categoryTabs];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, homepage: { ...prev.homepage, categoryTabs: list } };
    });
  };

  const removeCategoryTab = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      homepage: {
        ...prev.homepage,
        categoryTabs: prev.homepage.categoryTabs.filter((_, i) => i !== index),
      },
    }));
  };

  const addQuickAction = () => {
    setSettings((prev) => ({
      ...prev,
      homepage: {
        ...prev.homepage,
        quickActions: [...prev.homepage.quickActions, createQuickAction()],
      },
    }));
  };

  const updateQuickAction = (
    index: number,
    field: keyof QuickActionItem,
    value: string,
  ) => {
    setSettings((prev) => {
      const list = [...prev.homepage.quickActions];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, homepage: { ...prev.homepage, quickActions: list } };
    });
  };

  const removeQuickAction = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      homepage: {
        ...prev.homepage,
        quickActions: prev.homepage.quickActions.filter((_, i) => i !== index),
      },
    }));
  };

  const addTrustBadge = () => {
    setSettings((prev) => ({
      ...prev,
      homepage: {
        ...prev.homepage,
        trustBadges: [...prev.homepage.trustBadges, createTrustBadge()],
      },
    }));
  };

  const updateTrustBadge = (
    index: number,
    field: keyof TrustBadgeItem,
    value: string,
  ) => {
    setSettings((prev) => {
      const list = [...prev.homepage.trustBadges];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, homepage: { ...prev.homepage, trustBadges: list } };
    });
  };

  const removeTrustBadge = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      homepage: {
        ...prev.homepage,
        trustBadges: prev.homepage.trustBadges.filter((_, i) => i !== index),
      },
    }));
  };

  return (
    <AdminLayout title="ตั้งค่าเว็บไซต์">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-black">
              <Settings2 className="h-6 w-6" />
              Site Settings CMS
            </h1>
            <p className="text-sm text-gray-600">
              แก้ draft, preview, reorder แล้ว publish เป็น live
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadSettings}
              disabled={loading || saving || publishing}
              className="flex items-center gap-2 border-[2px] border-gray-400 px-3 py-2 text-sm disabled:opacity-50"
            >
              <RefreshCcw size={16} /> โหลดใหม่
            </button>
            <button
              onClick={resetDraft}
              disabled={resetting || saving || publishing}
              className="border-[2px] border-red-400 px-3 py-2 text-sm text-red-700 disabled:opacity-50"
            >
              {resetting ? "กำลังรีเซ็ต..." : "รีเซ็ต Draft"}
            </button>
            <button
              onClick={saveSettings}
              disabled={!hasChanges || saving || loading || publishing}
              className="flex items-center gap-2 border-[2px] border-black bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Save Draft
            </button>
            <button
              onClick={publishSettings}
              disabled={publishing || saving || !isDraftDirty}
              className="flex items-center gap-2 border-[2px] border-black bg-brutal-green px-3 py-2 text-sm text-black disabled:opacity-50"
            >
              {publishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              Publish Live
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 rounded border-[2px] border-gray-300 bg-white p-3 text-xs text-gray-700 md:grid-cols-2">
          <div>
            Draft updated:{" "}
            {updatedAt ? new Date(updatedAt).toLocaleString("th-TH") : "-"} by{" "}
            {updatedBy || "-"}
          </div>
          <div>
            Live published:{" "}
            {publishedAt ? new Date(publishedAt).toLocaleString("th-TH") : "-"}{" "}
            by {publishedBy || "-"}
          </div>
        </div>

        {error && (
          <div className="rounded border-[2px] border-red-400 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded border-[2px] border-green-400 bg-green-50 p-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center rounded border-[3px] border-black bg-white">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section className="space-y-3 rounded border-[3px] border-black bg-white p-4 lg:col-span-2">
              <h2 className="text-lg font-bold">General</h2>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <input
                  className="border-[2px] border-gray-300 px-3 py-2"
                  placeholder="Site name"
                  value={settings.general.siteName}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      general: { ...s.general, siteName: e.target.value },
                    }))
                  }
                />
                <input
                  className="border-[2px] border-gray-300 px-3 py-2"
                  placeholder="Tagline"
                  value={settings.general.siteTagline || ""}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      general: { ...s.general, siteTagline: e.target.value },
                    }))
                  }
                />
                <input
                  className="border-[2px] border-gray-300 px-3 py-2"
                  placeholder="Support email"
                  value={settings.general.supportEmail}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      general: { ...s.general, supportEmail: e.target.value },
                    }))
                  }
                />
                <input
                  className="border-[2px] border-gray-300 px-3 py-2"
                  placeholder="Support phone"
                  value={settings.general.supportPhone || ""}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      general: { ...s.general, supportPhone: e.target.value },
                    }))
                  }
                />
              </div>
            </section>

            <section className="space-y-3 rounded border-[3px] border-black bg-white p-4 lg:col-span-2">
              <h2 className="text-lg font-bold">Landing Header</h2>
              <input
                className="w-full border-[2px] border-gray-300 px-3 py-2"
                placeholder="Hero title"
                value={settings.homepage.heroTitle || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    homepage: { ...s.homepage, heroTitle: e.target.value },
                  }))
                }
              />
              <textarea
                className="w-full border-[2px] border-gray-300 px-3 py-2"
                rows={2}
                placeholder="Hero subtitle"
                value={settings.homepage.heroSubtitle || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    homepage: { ...s.homepage, heroSubtitle: e.target.value },
                  }))
                }
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.homepage.announcementEnabled}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      homepage: {
                        ...s.homepage,
                        announcementEnabled: e.target.checked,
                      },
                    }))
                  }
                />{" "}
                Announcement enabled
              </label>
              <input
                className="w-full border-[2px] border-gray-300 px-3 py-2"
                placeholder="Announcement text"
                value={settings.homepage.announcementText || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    homepage: {
                      ...s.homepage,
                      announcementText: e.target.value,
                    },
                  }))
                }
              />
              <input
                className="w-full border-[2px] border-gray-300 px-3 py-2"
                placeholder="Featured category slugs (comma-separated)"
                value={toCsv(settings.homepage.featuredCategorySlugs)}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    homepage: {
                      ...s.homepage,
                      featuredCategorySlugs: parseCsv(e.target.value),
                    },
                  }))
                }
              />
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <input
                  className="border-[2px] border-gray-300 px-3 py-2"
                  placeholder="Featured products title"
                  value={settings.homepage.sectionLabels.featuredProductsTitle}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      homepage: {
                        ...s.homepage,
                        sectionLabels: {
                          ...s.homepage.sectionLabels,
                          featuredProductsTitle: e.target.value,
                        },
                      },
                    }))
                  }
                />
                <input
                  className="border-[2px] border-gray-300 px-3 py-2"
                  placeholder="Specials title"
                  value={settings.homepage.sectionLabels.specialsTitle}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      homepage: {
                        ...s.homepage,
                        sectionLabels: {
                          ...s.homepage.sectionLabels,
                          specialsTitle: e.target.value,
                        },
                      },
                    }))
                  }
                />
                <input
                  className="border-[2px] border-gray-300 px-3 py-2"
                  placeholder="News title"
                  value={settings.homepage.sectionLabels.newsTitle}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      homepage: {
                        ...s.homepage,
                        sectionLabels: {
                          ...s.homepage.sectionLabels,
                          newsTitle: e.target.value,
                        },
                      },
                    }))
                  }
                />
                <input
                  className="border-[2px] border-gray-300 px-3 py-2"
                  placeholder="View all text"
                  value={settings.homepage.sectionLabels.viewAllText}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      homepage: {
                        ...s.homepage,
                        sectionLabels: {
                          ...s.homepage.sectionLabels,
                          viewAllText: e.target.value,
                        },
                      },
                    }))
                  }
                />
                <input
                  className="border-[2px] border-gray-300 px-3 py-2 md:col-span-2"
                  placeholder="Hero button text"
                  value={settings.homepage.sectionLabels.heroButtonText}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      homepage: {
                        ...s.homepage,
                        sectionLabels: {
                          ...s.homepage.sectionLabels,
                          heroButtonText: e.target.value,
                        },
                      },
                    }))
                  }
                />
              </div>
            </section>

            <section className="space-y-3 rounded border-[3px] border-black bg-white p-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Hero Slides</h2>
                <button
                  onClick={addHeroSlide}
                  className="inline-flex items-center gap-1 border-[2px] border-black px-3 py-1 text-sm"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
              <div className="space-y-3">
                {settings.homepage.heroSlides.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded border-[2px] border-gray-300 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Slide #{index + 1}
                      </span>
                      <button
                        onClick={() => removeHeroSlide(index)}
                        className="text-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <input
                        className="border-[2px] border-gray-300 px-2 py-1"
                        placeholder="Title"
                        value={item.title}
                        onChange={(e) =>
                          updateHeroSlide(index, "title", e.target.value)
                        }
                      />
                      <input
                        className="border-[2px] border-gray-300 px-2 py-1"
                        placeholder="Badge text"
                        value={item.badgeText || ""}
                        onChange={(e) =>
                          updateHeroSlide(index, "badgeText", e.target.value)
                        }
                      />
                      <input
                        className="border-[2px] border-gray-300 px-2 py-1 md:col-span-2"
                        placeholder="Subtitle"
                        value={item.subtitle || ""}
                        onChange={(e) =>
                          updateHeroSlide(index, "subtitle", e.target.value)
                        }
                      />
                      <input
                        className="border-[2px] border-gray-300 px-2 py-1 md:col-span-2"
                        placeholder="Image URL"
                        value={item.image}
                        onChange={(e) =>
                          updateHeroSlide(index, "image", e.target.value)
                        }
                      />
                      <input
                        className="border-[2px] border-gray-300 px-2 py-1"
                        placeholder="Link URL"
                        value={item.link || ""}
                        onChange={(e) =>
                          updateHeroSlide(index, "link", e.target.value)
                        }
                      />
                      <select
                        className="border-[2px] border-gray-300 px-2 py-1"
                        value={item.color}
                        onChange={(e) =>
                          updateHeroSlide(index, "color", e.target.value)
                        }
                      >
                        <option value="yellow">yellow</option>
                        <option value="pink">pink</option>
                        <option value="blue">blue</option>
                        <option value="green">green</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3 rounded border-[3px] border-black bg-white p-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Category Tabs</h2>
                <button
                  onClick={addCategoryTab}
                  className="inline-flex items-center gap-1 border-[2px] border-black px-3 py-1 text-sm"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
              <div className="space-y-3">
                {settings.homepage.categoryTabs.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="rounded border-[2px] border-gray-300 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Tab #{index + 1}
                      </span>
                      <button
                        onClick={() => removeCategoryTab(index)}
                        className="text-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                      <select
                        className="border-[2px] border-gray-300 px-2 py-1"
                        value={item.id}
                        onChange={(e) =>
                          updateCategoryTab(index, "id", e.target.value)
                        }
                      >
                        <option value="all">all</option>
                        <option value="hot">hot</option>
                        <option value="cards">cards</option>
                      </select>
                      <input
                        className="border-[2px] border-gray-300 px-2 py-1"
                        placeholder="Label"
                        value={item.label}
                        onChange={(e) =>
                          updateCategoryTab(index, "label", e.target.value)
                        }
                      />
                      <select
                        className="border-[2px] border-gray-300 px-2 py-1"
                        value={item.icon}
                        onChange={(e) =>
                          updateCategoryTab(index, "icon", e.target.value)
                        }
                      >
                        <option value="gamepad">gamepad</option>
                        <option value="flame">flame</option>
                        <option value="card">card</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3 rounded border-[3px] border-black bg-white p-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Quick Actions</h2>
                <button
                  onClick={addQuickAction}
                  className="inline-flex items-center gap-1 border-[2px] border-black px-3 py-1 text-sm"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
              <div className="space-y-3">
                {settings.homepage.quickActions.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded border-[2px] border-gray-300 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Action #{index + 1}
                      </span>
                      <button
                        onClick={() => removeQuickAction(index)}
                        className="text-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <input
                        className="border-[2px] border-gray-300 px-2 py-1"
                        placeholder="Label"
                        value={item.label}
                        onChange={(e) =>
                          updateQuickAction(index, "label", e.target.value)
                        }
                      />
                      <input
                        className="border-[2px] border-gray-300 px-2 py-1"
                        placeholder="URL"
                        value={item.href}
                        onChange={(e) =>
                          updateQuickAction(index, "href", e.target.value)
                        }
                      />
                      <select
                        className="border-[2px] border-gray-300 px-2 py-1"
                        value={item.icon}
                        onChange={(e) =>
                          updateQuickAction(index, "icon", e.target.value)
                        }
                      >
                        <option value="credit-card">credit-card</option>
                        <option value="gift">gift</option>
                        <option value="star">star</option>
                        <option value="headphones">headphones</option>
                      </select>
                      <select
                        className="border-[2px] border-gray-300 px-2 py-1"
                        value={item.color}
                        onChange={(e) =>
                          updateQuickAction(index, "color", e.target.value)
                        }
                      >
                        <option value="yellow">yellow</option>
                        <option value="pink">pink</option>
                        <option value="green">green</option>
                        <option value="blue">blue</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3 rounded border-[3px] border-black bg-white p-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Trust Badges</h2>
                <button
                  onClick={addTrustBadge}
                  className="inline-flex items-center gap-1 border-[2px] border-black px-3 py-1 text-sm"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
              <div className="space-y-3">
                {settings.homepage.trustBadges.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded border-[2px] border-gray-300 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Badge #{index + 1}
                      </span>
                      <button
                        onClick={() => removeTrustBadge(index)}
                        className="text-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <input
                        className="border-[2px] border-gray-300 px-2 py-1"
                        placeholder="Title"
                        value={item.title}
                        onChange={(e) =>
                          updateTrustBadge(index, "title", e.target.value)
                        }
                      />
                      <select
                        className="border-[2px] border-gray-300 px-2 py-1"
                        value={item.icon}
                        onChange={(e) =>
                          updateTrustBadge(index, "icon", e.target.value)
                        }
                      >
                        <option value="shield">shield</option>
                        <option value="headphones">headphones</option>
                        <option value="zap">zap</option>
                      </select>
                      <input
                        className="border-[2px] border-gray-300 px-2 py-1 md:col-span-2"
                        placeholder="Description"
                        value={item.description || ""}
                        onChange={(e) =>
                          updateTrustBadge(index, "description", e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3 rounded border-[3px] border-black bg-white p-4">
              <h2 className="text-lg font-bold">Branding + SEO</h2>
              <input
                className="w-full border-[2px] border-gray-300 px-3 py-2"
                placeholder="Logo URL"
                value={settings.branding.logoUrl || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    branding: { ...s.branding, logoUrl: e.target.value },
                  }))
                }
              />
              <input
                className="w-full border-[2px] border-gray-300 px-3 py-2"
                placeholder="Favicon URL"
                value={settings.branding.faviconUrl || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    branding: { ...s.branding, faviconUrl: e.target.value },
                  }))
                }
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="border-[2px] border-gray-300 px-3 py-2"
                  placeholder="Primary color"
                  value={settings.branding.primaryColor}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      branding: { ...s.branding, primaryColor: e.target.value },
                    }))
                  }
                />
                <input
                  className="border-[2px] border-gray-300 px-3 py-2"
                  placeholder="Secondary color"
                  value={settings.branding.secondaryColor}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      branding: {
                        ...s.branding,
                        secondaryColor: e.target.value,
                      },
                    }))
                  }
                />
              </div>
              <input
                className="w-full border-[2px] border-gray-300 px-3 py-2"
                placeholder="Meta title"
                value={settings.seo.metaTitle || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    seo: { ...s.seo, metaTitle: e.target.value },
                  }))
                }
              />
              <textarea
                className="w-full border-[2px] border-gray-300 px-3 py-2"
                rows={2}
                placeholder="Meta description"
                value={settings.seo.metaDescription || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    seo: { ...s.seo, metaDescription: e.target.value },
                  }))
                }
              />
              <input
                className="w-full border-[2px] border-gray-300 px-3 py-2"
                placeholder="Meta keywords comma-separated"
                value={toCsv(settings.seo.metaKeywords)}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    seo: { ...s.seo, metaKeywords: parseCsv(e.target.value) },
                  }))
                }
              />
            </section>

            <section className="space-y-3 rounded border-[3px] border-black bg-white p-4">
              <h2 className="text-lg font-bold">
                Features + Social + Commerce
              </h2>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.features.enablePromotions}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      features: {
                        ...s.features,
                        enablePromotions: e.target.checked,
                      },
                    }))
                  }
                />{" "}
                Enable promotions
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.features.enableSupportTickets}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      features: {
                        ...s.features,
                        enableSupportTickets: e.target.checked,
                      },
                    }))
                  }
                />{" "}
                Enable support tickets
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.features.enableUserRegistration}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      features: {
                        ...s.features,
                        enableUserRegistration: e.target.checked,
                      },
                    }))
                  }
                />{" "}
                Enable registration
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.features.enableMaintenanceMode}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      features: {
                        ...s.features,
                        enableMaintenanceMode: e.target.checked,
                      },
                    }))
                  }
                />{" "}
                Enable maintenance
              </label>
              <textarea
                className="w-full border-[2px] border-gray-300 px-3 py-2"
                rows={2}
                placeholder="Maintenance message"
                value={settings.features.maintenanceMessage || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    features: {
                      ...s.features,
                      maintenanceMessage: e.target.value,
                    },
                  }))
                }
              />
              <input
                className="w-full border-[2px] border-gray-300 px-3 py-2"
                placeholder="Facebook URL"
                value={settings.social.facebookUrl || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    social: { ...s.social, facebookUrl: e.target.value },
                  }))
                }
              />
              <input
                className="w-full border-[2px] border-gray-300 px-3 py-2"
                placeholder="LINE URL"
                value={settings.social.lineUrl || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    social: { ...s.social, lineUrl: e.target.value },
                  }))
                }
              />
              <input
                className="w-full border-[2px] border-gray-300 px-3 py-2"
                placeholder="Discord URL"
                value={settings.social.discordUrl || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    social: { ...s.social, discordUrl: e.target.value },
                  }))
                }
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.commerce.allowGuestCheckout}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      commerce: {
                        ...s.commerce,
                        allowGuestCheckout: e.target.checked,
                      },
                    }))
                  }
                />{" "}
                Allow guest checkout
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  className="border-[2px] border-gray-300 px-3 py-2"
                  placeholder="Tax %"
                  value={settings.commerce.taxPercent}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      commerce: {
                        ...s.commerce,
                        taxPercent: Number(e.target.value) || 0,
                      },
                    }))
                  }
                />
                <input
                  type="number"
                  className="border-[2px] border-gray-300 px-3 py-2"
                  placeholder="Auto cancel minutes"
                  value={settings.commerce.orderAutoCancelMinutes}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      commerce: {
                        ...s.commerce,
                        orderAutoCancelMinutes: Number(e.target.value) || 1,
                      },
                    }))
                  }
                />
                <input
                  type="number"
                  className="border-[2px] border-gray-300 px-3 py-2"
                  placeholder="Min topup"
                  value={settings.commerce.minTopupAmount}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      commerce: {
                        ...s.commerce,
                        minTopupAmount: Number(e.target.value) || 0,
                      },
                    }))
                  }
                />
                <input
                  type="number"
                  className="border-[2px] border-gray-300 px-3 py-2"
                  placeholder="Max topup"
                  value={settings.commerce.maxTopupAmount}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      commerce: {
                        ...s.commerce,
                        maxTopupAmount: Number(e.target.value) || 0,
                      },
                    }))
                  }
                />
              </div>
            </section>

            <section className="space-y-3 rounded border-[3px] border-black bg-white p-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">
                  Promo Cards (Drag to Reorder)
                </h2>
                <button
                  onClick={() => addBlockItem("promoCards")}
                  className="inline-flex items-center gap-1 border-[2px] border-black px-3 py-1 text-sm"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
              <div className="space-y-3">
                {settings.homepage.promoCards.map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart("promoCards", index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop("promoCards", index)}
                    className="rounded border-[2px] border-gray-300 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <GripVertical size={14} /> Item #{index + 1}
                      </span>
                      <button
                        onClick={() => removeBlockItem("promoCards", index)}
                        className="text-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <input
                        className="border-[2px] border-gray-300 px-2 py-1"
                        placeholder="Title"
                        value={item.title}
                        onChange={(e) =>
                          updatePromo(index, "title", e.target.value)
                        }
                      />
                      <input
                        className="border-[2px] border-gray-300 px-2 py-1"
                        placeholder="Badge"
                        value={item.badge || ""}
                        onChange={(e) =>
                          updatePromo(index, "badge", e.target.value)
                        }
                      />
                      <input
                        className="border-[2px] border-gray-300 px-2 py-1 md:col-span-2"
                        placeholder="Description"
                        value={item.description || ""}
                        onChange={(e) =>
                          updatePromo(index, "description", e.target.value)
                        }
                      />
                      <input
                        className="border-[2px] border-gray-300 px-2 py-1"
                        placeholder="CTA text"
                        value={item.ctaText || ""}
                        onChange={(e) =>
                          updatePromo(index, "ctaText", e.target.value)
                        }
                      />
                      <input
                        className="border-[2px] border-gray-300 px-2 py-1"
                        placeholder="URL"
                        value={item.href || ""}
                        onChange={(e) =>
                          updatePromo(index, "href", e.target.value)
                        }
                      />
                      <select
                        className="border-[2px] border-gray-300 px-2 py-1"
                        value={item.theme}
                        onChange={(e) =>
                          updatePromo(index, "theme", e.target.value)
                        }
                      >
                        <option value="blue">blue</option>
                        <option value="pink">pink</option>
                        <option value="yellow">yellow</option>
                        <option value="green">green</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3 rounded border-[3px] border-black bg-white p-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">
                  News Items (Drag to Reorder)
                </h2>
                <button
                  onClick={() => addBlockItem("newsItems")}
                  className="inline-flex items-center gap-1 border-[2px] border-black px-3 py-1 text-sm"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
              <div className="space-y-3">
                {settings.homepage.newsItems.map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart("newsItems", index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop("newsItems", index)}
                    className="rounded border-[2px] border-gray-300 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <GripVertical size={14} /> Item #{index + 1}
                      </span>
                      <button
                        onClick={() => removeBlockItem("newsItems", index)}
                        className="text-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <input
                        className="border-[2px] border-gray-300 px-2 py-1 md:col-span-2"
                        placeholder="Title"
                        value={item.title}
                        onChange={(e) =>
                          updateNews(index, "title", e.target.value)
                        }
                      />
                      <input
                        className="border-[2px] border-gray-300 px-2 py-1"
                        placeholder="Category"
                        value={item.category}
                        onChange={(e) =>
                          updateNews(index, "category", e.target.value)
                        }
                      />
                      <input
                        className="border-[2px] border-gray-300 px-2 py-1"
                        placeholder="Date"
                        value={item.date}
                        onChange={(e) =>
                          updateNews(index, "date", e.target.value)
                        }
                      />
                      <input
                        className="border-[2px] border-gray-300 px-2 py-1 md:col-span-2"
                        placeholder="Image URL"
                        value={item.image}
                        onChange={(e) =>
                          updateNews(index, "image", e.target.value)
                        }
                      />
                      <input
                        className="border-[2px] border-gray-300 px-2 py-1 md:col-span-2"
                        placeholder="URL"
                        value={item.href || ""}
                        onChange={(e) =>
                          updateNews(index, "href", e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3 rounded border-[3px] border-black bg-white p-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">
                  Seasonal Events (Drag to Reorder)
                </h2>
                <button
                  onClick={() => addBlockItem("seasonalEvents")}
                  className="inline-flex items-center gap-1 border-[2px] border-black px-3 py-1 text-sm"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
              <div className="space-y-3">
                {settings.homepage.seasonalEvents.map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart("seasonalEvents", index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop("seasonalEvents", index)}
                    className="rounded border-[2px] border-gray-300 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <GripVertical size={14} /> Item #{index + 1}
                      </span>
                      <button
                        onClick={() => removeBlockItem("seasonalEvents", index)}
                        className="text-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <input
                        className="border-[2px] border-gray-300 px-2 py-1 md:col-span-2"
                        placeholder="Title"
                        value={item.title}
                        onChange={(e) =>
                          updateEvent(index, "title", e.target.value)
                        }
                      />
                      <input
                        className="border-[2px] border-gray-300 px-2 py-1 md:col-span-2"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) =>
                          updateEvent(index, "description", e.target.value)
                        }
                      />
                      <input
                        className="border-[2px] border-gray-300 px-2 py-1"
                        placeholder="Start date (YYYY-MM-DD)"
                        value={item.startDate}
                        onChange={(e) =>
                          updateEvent(index, "startDate", e.target.value)
                        }
                      />
                      <input
                        className="border-[2px] border-gray-300 px-2 py-1"
                        placeholder="End date (YYYY-MM-DD)"
                        value={item.endDate}
                        onChange={(e) =>
                          updateEvent(index, "endDate", e.target.value)
                        }
                      />
                      <input
                        className="border-[2px] border-gray-300 px-2 py-1 md:col-span-2"
                        placeholder="Image URL"
                        value={item.image}
                        onChange={(e) =>
                          updateEvent(index, "image", e.target.value)
                        }
                      />
                      <input
                        className="border-[2px] border-gray-300 px-2 py-1"
                        placeholder="Discount"
                        value={item.discount || ""}
                        onChange={(e) =>
                          updateEvent(index, "discount", e.target.value)
                        }
                      />
                      <input
                        className="border-[2px] border-gray-300 px-2 py-1"
                        placeholder="Games (comma-separated)"
                        value={toCsv(item.games || [])}
                        onChange={(e) =>
                          updateEvent(index, "games", e.target.value)
                        }
                      />
                      <select
                        className="border-[2px] border-gray-300 px-2 py-1"
                        value={item.type}
                        onChange={(e) =>
                          updateEvent(index, "type", e.target.value)
                        }
                      >
                        <option value="cashback">cashback</option>
                        <option value="discount">discount</option>
                        <option value="bonus">bonus</option>
                        <option value="special">special</option>
                      </select>
                      <select
                        className="border-[2px] border-gray-300 px-2 py-1"
                        value={item.discountColor || "blue"}
                        onChange={(e) =>
                          updateEvent(index, "discountColor", e.target.value)
                        }
                      >
                        <option value="blue">blue</option>
                        <option value="purple">purple</option>
                        <option value="green">green</option>
                        <option value="pink">pink</option>
                      </select>
                      <input
                        className="border-[2px] border-gray-300 px-2 py-1 md:col-span-2"
                        placeholder="URL"
                        value={item.href || ""}
                        onChange={(e) =>
                          updateEvent(index, "href", e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3 rounded border-[3px] border-black bg-white p-4 lg:col-span-2">
              <h2 className="text-lg font-bold">Preview Draft vs Live</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded border-[2px] border-black p-3">
                  <p className="mb-2 text-xs font-bold">
                    Draft Promo ({settings.homepage.promoCards.length})
                  </p>
                  {settings.homepage.promoCards.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      className="mb-2 rounded border border-gray-300 p-2 text-sm"
                    >
                      <p className="font-bold">{item.title || "(no title)"}</p>
                      <p className="text-xs text-gray-500">
                        {item.ctaText || "-"}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="rounded border-[2px] border-black p-3">
                  <p className="mb-2 text-xs font-bold">
                    Live Promo ({liveSettings.homepage.promoCards.length})
                  </p>
                  {liveSettings.homepage.promoCards.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      className="mb-2 rounded border border-gray-300 p-2 text-sm"
                    >
                      <p className="font-bold">{item.title || "(no title)"}</p>
                      <p className="text-xs text-gray-500">
                        {item.ctaText || "-"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-3 rounded border-[3px] border-black bg-white p-4 lg:col-span-2">
              <h2 className="text-lg font-bold">Permissions</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b-[2px] border-gray-300 text-left">
                      <th className="px-2 py-2">Admin</th>
                      <th className="px-2 py-2">Email</th>
                      <th className="px-2 py-2">Read</th>
                      <th className="px-2 py-2">Write</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map((item) => (
                      <tr
                        key={item.adminId}
                        className="border-b border-gray-200"
                      >
                        <td className="px-2 py-2">{item.username}</td>
                        <td className="px-2 py-2 text-gray-600">
                          {item.email}
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="checkbox"
                            checked={item.read}
                            onChange={(e) =>
                              updatePermission(
                                item.adminId,
                                "read",
                                e.target.checked,
                              )
                            }
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="checkbox"
                            checked={item.write}
                            onChange={(e) =>
                              updatePermission(
                                item.adminId,
                                "write",
                                e.target.checked,
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-3 rounded border-[3px] border-black bg-white p-4 lg:col-span-2">
              <h2 className="text-lg font-bold">
                Audit Log (Item-level diff on publish)
              </h2>
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded border-[2px] border-gray-300 p-3"
                  >
                    <div className="text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleString("th-TH")} |{" "}
                      {log.action} |{" "}
                      {log.actor?.username || log.actorId || "system"}
                    </div>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-gray-700">
                      {flattenDiff(log.diff).map((line, idx) => (
                        <li key={`${log.id}-${idx}`}>{line}</li>
                      ))}
                    </ul>
                  </div>
                ))}
                {auditLogs.length === 0 && (
                  <div className="text-sm text-gray-500">No logs</div>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <button
                  className="border-[2px] border-gray-300 px-2 py-1 disabled:opacity-50"
                  disabled={auditPage <= 1}
                  onClick={() => loadAuditLogs(Math.max(1, auditPage - 1))}
                >
                  Prev
                </button>
                <span>
                  Page {auditPage}/{auditTotalPages}
                </span>
                <button
                  className="border-[2px] border-gray-300 px-2 py-1 disabled:opacity-50"
                  disabled={auditPage >= auditTotalPages}
                  onClick={() => loadAuditLogs(auditPage + 1)}
                >
                  Next
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
