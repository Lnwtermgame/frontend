"use client";

import { useEffect, useMemo, useState, ReactNode } from "react";
import {
  GripVertical,
  Loader2,
  Plus,
  RefreshCcw,
  Save,
  Settings2,
  Upload,
  X,
  Globe,
  Palette,
  ShoppingCart,
  LayoutGrid,
  Calendar,
  Shield,
  History,
  Eye,
  Users,
  ExternalLink,
  Bell,
  Tag,
  Type,
  Megaphone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  AdminLayout,
  AdminPageHeader,
  PageContainer,
} from "@/components/admin";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  AdminSettingsAuditLog,
  AdminSettingsPermissionRow,
  AdminSiteSettings,
  adminSettingsApi,
} from "@/lib/services/admin-settings-api";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type LandingBlockKey = "promoCards" | "newsItems" | "seasonalEvents";

type PromoCardItem = AdminSiteSettings["homepage"]["promoCards"][number];
type NewsItem = AdminSiteSettings["homepage"]["newsItems"][number];
type SeasonalEventItem =
  AdminSiteSettings["homepage"]["seasonalEvents"][number];
type HeroSlideItem = AdminSiteSettings["homepage"]["heroSlides"][number];
type CategoryTabItem = AdminSiteSettings["homepage"]["categoryTabs"][number];
type QuickActionItem = AdminSiteSettings["homepage"]["quickActions"][number];
type TrustBadgeItem = AdminSiteSettings["homepage"]["trustBadges"][number];

const getEmptySettings = (t: (key: string) => string): AdminSiteSettings => ({
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
      featuredProductsTitle: t("settings.section_labels.featured_products"),
      specialsTitle: t("settings.section_labels.specials"),
      newsTitle: t("settings.section_labels.news"),
      viewAllText: t("settings.section_labels.view_all"),
      heroButtonText: t("settings.section_labels.hero_button"),
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
});

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
  image: "/images/placeholder-game.svg",
  date: "",
  category: "",
  href: "",
});

const createSeasonalEvent = (): SeasonalEventItem => ({
  id: uid(),
  title: "",
  description: "",
  image: "/images/placeholder-hero.svg",
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
  image: "/images/placeholder-hero.svg",
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

// ── UI Helper sub-components (outside main component to prevent focus loss) ──

const SectionCard = ({ title, description, accent = "bg-site-accent", icon, children }: { title: string; description?: string; accent?: string; icon?: ReactNode; children: ReactNode }) => (
  <div className="bg-site-surface border border-white/5 rounded-2xl overflow-hidden">
    <div className="p-5 border-b border-white/5 bg-site-surface/50">
      <h2 className="text-base font-bold text-white flex items-center">
        <span className={`w-1.5 h-5 ${accent} mr-2`}></span>
        {icon && <span className="mr-2 text-gray-400">{icon}</span>}
        {title}
      </h2>
      {description && <p className="text-xs text-gray-400 mt-1 ml-3.5">{description}</p>}
    </div>
    <div className="p-5 space-y-4">{children}</div>
  </div>
);

const FormField = ({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) => (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const FormRow = ({ children }: { children: ReactNode }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
);

const ToggleField = ({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center justify-between p-4 bg-site-raised border border-white/5 rounded-xl hover:border-white/10 transition-colors cursor-pointer">
    <div>
      <span className="text-sm font-semibold text-white">{label}</span>
      {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
    </div>
    <Switch
      className="ml-4"
      checked={checked}
      onCheckedChange={(checked) => onChange(checked)}
    />
  </label>
);

const ItemCard = ({ index, label, onRemove, draggable: isDraggable, onDragStart, onDragOver, onDrop, children }: {
  index: number; label: string; onRemove: () => void; draggable?: boolean;
  onDragStart?: () => void; onDragOver?: (e: React.DragEvent) => void; onDrop?: () => void; children: ReactNode;
}) => (
  <div
    draggable={isDraggable}
    onDragStart={onDragStart}
    onDragOver={onDragOver}
    onDrop={onDrop}
    className="border border-white/5 bg-site-raised rounded-xl p-4 hover:border-white/10 transition-colors">
    <div className="mb-3 flex items-center justify-between">
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400">
        {isDraggable && <GripVertical size={14} className="text-gray-400" />}
        {label} #{index + 1}
      </span>
      <Button
        onClick={onRemove}
        variant="ghost"
        size="icon"
        className="h-7 w-7 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10"
        title="ลบ"
        aria-label="ลบ"
      >
        <X size={16} />
      </Button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
  </div>
);

const AddButton = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <Button onClick={onClick} variant="secondary" size="sm" className="rounded-xl">
    <Plus size={14} /> {label}
  </Button>
);

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
  const { isAdmin, isInitialized, isSessionChecked } = useAuth();
  const t = useTranslations("AdminPage");
  const EMPTY_SETTINGS = useMemo(() => getEmptySettings(t), [t]);

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

  const [activeTab, setActiveTab] = useState('general');
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
    if (!isInitialized || !isSessionChecked) return;
    loadSettings();
    loadPermissions();
    loadAuditLogs(1);
  }, [isInitialized, isSessionChecked]);

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

  // ── CSS classes ──────────────────────────────
  const inputCls = "w-full bg-site-raised border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:border-site-accent/50 focus:ring-1 focus:ring-site-accent/50 outline-none transition-all";
  const selectCls = inputCls;

  const tabs = [
    { id: 'general', label: 'ทั่วไป & SEO', icon: <Settings2 size={16} /> },
    { id: 'features', label: 'ร้านค้า & ฟีเจอร์', icon: <ShoppingCart size={16} /> },
    { id: 'landing', label: 'หน้าแรก', icon: <LayoutGrid size={16} /> },
    { id: 'events', label: 'อีเวนต์ & ข่าว', icon: <Calendar size={16} /> },
    { id: 'system', label: 'ระบบ', icon: <Shield size={16} /> },
  ];

  return (
    <AdminLayout>
      <PageContainer>
        {/* ── Header & Actions ── */}
        <div className="bg-site-surface border border-white/5 rounded-2xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <AdminPageHeader
              title="Site Settings CMS"
              description="แก้ไข Draft → Preview → Publish เป็น Live"
              icon={Settings2}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" className="rounded-xl" onClick={loadSettings} disabled={loading || saving || publishing}>
                <RefreshCcw size={14} /> โหลดใหม่
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-500" onClick={resetDraft} disabled={resetting || saving || publishing}>
                {resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw size={14} />}
                {resetting ? "กำลังรีเซ็ต..." : "รีเซ็ต Draft"}
              </Button>
              <Button variant="secondary" size="sm" className="rounded-xl" onClick={saveSettings} disabled={!hasChanges || saving || loading || publishing}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save size={14} />}
                Save Draft
              </Button>
              <Button size="sm" className="rounded-xl bg-gradient-to-r from-site-accent to-site-accent/80 hover:from-site-accent hover:to-site-accent/60" onClick={publishSettings} disabled={publishing || saving || !isDraftDirty}>
                {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload size={14} />}
                Publish Live
              </Button>
            </div>
          </div>

          {/* Status bar */}
          <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-site-accent/10 border border-white/10"></span>
              <span className="font-semibold">Draft:</span>
              {updatedAt ? new Date(updatedAt).toLocaleString("th-TH") : "-"} โดย {updatedBy || "-"}
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 border border-white/10"></span>
              <span className="font-semibold">Live:</span>
              {publishedAt ? new Date(publishedAt).toLocaleString("th-TH") : "-"} โดย {publishedBy || "-"}
            </div>
          </div>
        </div>

        {/* ── Alerts ── */}
        {error && (
          <div className="border border-red-500/20 rounded-xl bg-red-500/10 p-4 text-sm text-red-400 flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500/50 shrink-0 mt-1.5"></span> <span className="whitespace-pre-line">{error}</span>
          </div>
        )}
        {success && (
          <div className="border border-green-500/20 rounded-xl bg-green-500/10 p-4 text-sm text-green-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span> {success}
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center bg-site-surface border border-white/5 rounded-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-site-accent" />
          </div>
        ) : (
          <>
            {/* ── Tab Navigation ── */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap flex items-center gap-2 border rounded-xl px-4 py-2 text-sm font-medium transition-all ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-site-accent to-site-accent/80 text-white border-transparent'
                    : 'bg-site-surface text-gray-400 hover:bg-site-raised hover:text-white border-white/5'
                    }`}

                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>


            {/* ── Tab Content ── */}
            <div className="space-y-6 mt-4">
              {activeTab === 'general' && (
                <div className="grid grid-cols-1 gap-6">
                  <SectionCard title="General Settings" description="Basic site information and support contacts" icon={<Globe />}>
                    <FormRow>
                      <FormField label="Site Name">
                        <Input size="sm" className="rounded-xl border-site-border bg-site-raised" placeholder="Site name" value={settings.general.siteName} onChange={(e) => setSettings((s) => ({ ...s, general: { ...s.general, siteName: e.target.value } }))} />
                      </FormField>
                      <FormField label="Tagline">
                        <Input size="sm" className="rounded-xl border-site-border bg-site-raised" placeholder="Tagline" value={settings.general.siteTagline || ""} onChange={(e) => setSettings((s) => ({ ...s, general: { ...s.general, siteTagline: e.target.value } }))} />
                      </FormField>
                    </FormRow>
                    <FormRow>
                      <FormField label="Support Email">
                        <Input size="sm" className="rounded-xl border-site-border bg-site-raised" placeholder="Support email" value={settings.general.supportEmail} onChange={(e) => setSettings((s) => ({ ...s, general: { ...s.general, supportEmail: e.target.value } }))} />
                      </FormField>
                      <FormField label="Support Phone">
                        <Input size="sm" className="rounded-xl border-site-border bg-site-raised" placeholder="Support phone" value={settings.general.supportPhone || ""} onChange={(e) => setSettings((s) => ({ ...s, general: { ...s.general, supportPhone: e.target.value } }))} />
                      </FormField>
                    </FormRow>
                  </SectionCard>

                  <SectionCard title="Branding & Colors" description="Site appearance, logos and colors" icon={<Palette />} accent="bg-site-accent/10">
                    <FormRow>
                      <FormField label="Logo URL">
                        <Input size="sm" className="rounded-xl border-site-border bg-site-raised" placeholder="Logo URL" value={settings.branding.logoUrl || ""} onChange={(e) => setSettings((s) => ({ ...s, branding: { ...s.branding, logoUrl: e.target.value } }))} />
                      </FormField>
                      <FormField label="Favicon URL">
                        <Input size="sm" className="rounded-xl border-site-border bg-site-raised" placeholder="Favicon URL" value={settings.branding.faviconUrl || ""} onChange={(e) => setSettings((s) => ({ ...s, branding: { ...s.branding, faviconUrl: e.target.value } }))} />
                      </FormField>
                    </FormRow>
                    <FormRow>
                      <FormField label="Primary Color">
                        <div className="flex gap-2">
                          <input type="color" className="h-10 w-12 border border-white/5 rounded-xl bg-site-raised p-1 cursor-pointer" value={settings.branding.primaryColor || "#000000"} onChange={(e) => setSettings((s) => ({ ...s, branding: { ...s.branding, primaryColor: e.target.value } }))} />
                          <Input size="sm" className="rounded-xl border-site-border bg-site-raised" placeholder="#FF6B9D" value={settings.branding.primaryColor} onChange={(e) => setSettings((s) => ({ ...s, branding: { ...s.branding, primaryColor: e.target.value } }))} />
                        </div>
                      </FormField>
                      <FormField label="Secondary Color">
                        <div className="flex gap-2">
                          <input type="color" className="h-10 w-12 border border-white/5 rounded-xl bg-site-raised p-1 cursor-pointer" value={settings.branding.secondaryColor || "#000000"} onChange={(e) => setSettings((s) => ({ ...s, branding: { ...s.branding, secondaryColor: e.target.value } }))} />
                          <Input size="sm" className="rounded-xl border-site-border bg-site-raised" placeholder="#95E1D3" value={settings.branding.secondaryColor} onChange={(e) => setSettings((s) => ({ ...s, branding: { ...s.branding, secondaryColor: e.target.value } }))} />
                        </div>
                      </FormField>
                    </FormRow>
                  </SectionCard>

                  <SectionCard title="SEO Settings" description="Search engine optimization metadata" icon={<Megaphone />} accent="bg-green-500">
                    <FormField label="Meta Title">
                      <Input size="sm" className="rounded-xl border-site-border bg-site-raised" placeholder="Meta title" value={settings.seo.metaTitle || ""} onChange={(e) => setSettings((s) => ({ ...s, seo: { ...s.seo, metaTitle: e.target.value } }))} />
                    </FormField>
                    <FormField label="Meta Description">
                      <Textarea rows={2} className="rounded-xl border-site-border bg-site-raised px-4 py-2 text-sm text-white" placeholder="Meta description" value={settings.seo.metaDescription || ""} onChange={(e) => setSettings((s) => ({ ...s, seo: { ...s.seo, metaDescription: e.target.value } }))} />
                    </FormField>
                    <FormField label="Meta Keywords">
                      <Input size="sm" className="rounded-xl border-site-border bg-site-raised" placeholder="Keyword1, Keyword2, Keyword3" value={toCsv(settings.seo.metaKeywords)} onChange={(e) => setSettings((s) => ({ ...s, seo: { ...s.seo, metaKeywords: parseCsv(e.target.value) } }))} />
                    </FormField>
                  </SectionCard>
                </div>
              )}

              {activeTab === 'landing' && (
                <div className="grid grid-cols-1 gap-6">
                  <SectionCard title="Landing Header" description="Top section of the homepage" icon={<LayoutGrid />} accent="bg-site-accent">
                    <FormField label="Hero Title">
                      <Input size="sm" className="rounded-xl border-site-border bg-site-raised" placeholder="Hero title" value={settings.homepage.heroTitle || ""} onChange={(e) => setSettings((s) => ({ ...s, homepage: { ...s.homepage, heroTitle: e.target.value } }))} />
                    </FormField>
                    <FormField label="Hero Subtitle">
                      <Textarea rows={2} className="rounded-xl border-site-border bg-site-raised px-4 py-2 text-sm text-white" placeholder="Hero subtitle" value={settings.homepage.heroSubtitle || ""} onChange={(e) => setSettings((s) => ({ ...s, homepage: { ...s.homepage, heroSubtitle: e.target.value } }))} />
                    </FormField>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                      <ToggleField label="Enable Announcement" checked={settings.homepage.announcementEnabled} onChange={(v) => setSettings((s) => ({ ...s, homepage: { ...s.homepage, announcementEnabled: v } }))} />
                      <FormField label="Announcement Text">
                        <Input size="sm" className="rounded-xl border-site-border bg-site-raised" placeholder="Announcement text" value={settings.homepage.announcementText || ""} onChange={(e) => setSettings((s) => ({ ...s, homepage: { ...s.homepage, announcementText: e.target.value } }))} />
                      </FormField>
                    </div>
                    <div className="h-[1px] w-full bg-site-border/30 my-2"></div>
                    <FormField label="Featured Category Slugs" hint="Comma-separated list of category slugs to feature.">
                      <Input size="sm" className="rounded-xl border-site-border bg-site-raised" placeholder="hot, popular, new" value={toCsv(settings.homepage.featuredCategorySlugs)} onChange={(e) => setSettings((s) => ({ ...s, homepage: { ...s.homepage, featuredCategorySlugs: parseCsv(e.target.value) } }))} />
                    </FormField>
                    <h3 className="font-bold text-sm text-gray-300 pt-2 border-t-[1px] border-white/5 mt-2">Section Labels</h3>
                    <FormRow>
                      <FormField label="Featured Products Title"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={settings.homepage.sectionLabels.featuredProductsTitle} onChange={(e) => setSettings((s) => ({ ...s, homepage: { ...s.homepage, sectionLabels: { ...s.homepage.sectionLabels, featuredProductsTitle: e.target.value } } }))} /></FormField>
                      <FormField label="Specials Title"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={settings.homepage.sectionLabels.specialsTitle} onChange={(e) => setSettings((s) => ({ ...s, homepage: { ...s.homepage, sectionLabels: { ...s.homepage.sectionLabels, specialsTitle: e.target.value } } }))} /></FormField>
                    </FormRow>
                    <FormRow>
                      <FormField label="News Title"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={settings.homepage.sectionLabels.newsTitle} onChange={(e) => setSettings((s) => ({ ...s, homepage: { ...s.homepage, sectionLabels: { ...s.homepage.sectionLabels, newsTitle: e.target.value } } }))} /></FormField>
                      <FormField label="View All Text"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={settings.homepage.sectionLabels.viewAllText} onChange={(e) => setSettings((s) => ({ ...s, homepage: { ...s.homepage, sectionLabels: { ...s.homepage.sectionLabels, viewAllText: e.target.value } } }))} /></FormField>
                    </FormRow>
                    <FormField label="Hero Button Text"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={settings.homepage.sectionLabels.heroButtonText} onChange={(e) => setSettings((s) => ({ ...s, homepage: { ...s.homepage, sectionLabels: { ...s.homepage.sectionLabels, heroButtonText: e.target.value } } }))} /></FormField>
                  </SectionCard>

                  <SectionCard title="Category Tabs" description="Navigation tabs on homepage" icon={<Tag />} accent="bg-site-accent/10">
                    <div className="mb-4">
                      <AddButton onClick={addCategoryTab} label="Add Category Tab" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {settings.homepage.categoryTabs.map((item, index) => (
                        <ItemCard key={`${item.id}-${index}`} index={index} label="Tab" onRemove={() => removeCategoryTab(index)}>
                          <FormField label="ID">
                            <Select value={item.id} onValueChange={(value) => updateCategoryTab(index, "id", value)}>
                              <SelectTrigger className="h-9 rounded-xl border-site-border bg-site-raised text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">all</SelectItem>
                                <SelectItem value="hot">hot</SelectItem>
                                <SelectItem value="cards">cards</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormField>
                          <FormField label="Label"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={item.label} onChange={(e) => updateCategoryTab(index, "label", e.target.value)} /></FormField>
                          <div className="md:col-span-2">
                            <FormField label="Icon">
                              <Select value={item.icon} onValueChange={(value) => updateCategoryTab(index, "icon", value)}>
                                <SelectTrigger className="h-9 rounded-xl border-site-border bg-site-raised text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="gamepad">gamepad</SelectItem>
                                  <SelectItem value="flame">flame</SelectItem>
                                  <SelectItem value="card">card</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormField>
                          </div>
                        </ItemCard>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard title="Quick Actions" description="Fast links for users" icon={<ExternalLink />} accent="bg-green-500">
                    <div className="mb-4">
                      <AddButton onClick={addQuickAction} label="Add Quick Action" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {settings.homepage.quickActions.map((item, index) => (
                        <ItemCard key={item.id} index={index} label="Action" onRemove={() => removeQuickAction(index)}>
                          <FormField label="Label"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={item.label} onChange={(e) => updateQuickAction(index, "label", e.target.value)} /></FormField>
                          <FormField label="URL"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={item.href} onChange={(e) => updateQuickAction(index, "href", e.target.value)} /></FormField>
                          <FormField label="Icon">
                            <Select value={item.icon} onValueChange={(value) => updateQuickAction(index, "icon", value)}>
                              <SelectTrigger className="h-9 rounded-xl border-site-border bg-site-raised text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="credit-card">credit-card</SelectItem>
                                <SelectItem value="gift">gift</SelectItem>
                                <SelectItem value="star">star</SelectItem>
                                <SelectItem value="headphones">headphones</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormField>
                          <FormField label="Color">
                            <Select value={item.color} onValueChange={(value) => updateQuickAction(index, "color", value)}>
                              <SelectTrigger className="h-9 rounded-xl border-site-border bg-site-raised text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yellow">yellow</SelectItem>
                                <SelectItem value="pink">pink</SelectItem>
                                <SelectItem value="green">green</SelectItem>
                                <SelectItem value="blue">blue</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormField>
                        </ItemCard>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard title="Trust Badges" description="Badges shown to build customer trust" icon={<Shield />} accent="bg-blue-400">
                    <div className="mb-4">
                      <AddButton onClick={addTrustBadge} label="Add Trust Badge" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {settings.homepage.trustBadges.map((item, index) => (
                        <ItemCard key={item.id} index={index} label="Badge" onRemove={() => removeTrustBadge(index)}>
                          <FormField label="Title"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={item.title} onChange={(e) => updateTrustBadge(index, "title", e.target.value)} /></FormField>
                          <FormField label="Icon">
                            <Select value={item.icon} onValueChange={(value) => updateTrustBadge(index, "icon", value)}>
                              <SelectTrigger className="h-9 rounded-xl border-site-border bg-site-raised text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="shield">shield</SelectItem>
                                <SelectItem value="headphones">headphones</SelectItem>
                                <SelectItem value="zap">zap</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormField>
                          <div className="md:col-span-2">
                            <FormField label="Description"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={item.description || ""} onChange={(e) => updateTrustBadge(index, "description", e.target.value)} /></FormField>
                          </div>
                        </ItemCard>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard title="Promo Cards" description="Promotional cards shown on the landing page (Drag to Reorder)" icon={<ShoppingCart />} accent="bg-site-accent">
                    <div className="mb-4">
                      <AddButton onClick={() => addBlockItem("promoCards")} label="Add Promo Card" />
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {settings.homepage.promoCards.map((item, index) => (
                        <ItemCard key={item.id} index={index} label="Promo Card" draggable onDragStart={() => handleDragStart("promoCards", index)} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop("promoCards", index)} onRemove={() => removeBlockItem("promoCards", index)}>
                          <FormField label="Title"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={item.title} onChange={(e) => updatePromo(index, "title", e.target.value)} /></FormField>
                          <FormField label="Badge"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={item.badge || ""} onChange={(e) => updatePromo(index, "badge", e.target.value)} /></FormField>
                          <div className="md:col-span-2">
                            <FormField label="Description"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={item.description || ""} onChange={(e) => updatePromo(index, "description", e.target.value)} /></FormField>
                          </div>
                          <FormField label="CTA Text"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={item.ctaText || ""} onChange={(e) => updatePromo(index, "ctaText", e.target.value)} /></FormField>
                          <FormRow>
                            <FormField label="URL"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={item.href || ""} onChange={(e) => updatePromo(index, "href", e.target.value)} /></FormField>
                            <FormField label="Theme">
                              <Select value={item.theme} onValueChange={(value) => updatePromo(index, "theme", value)}>
                                <SelectTrigger className="h-9 rounded-xl border-site-border bg-site-raised text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="blue">blue</SelectItem>
                                  <SelectItem value="pink">pink</SelectItem>
                                  <SelectItem value="yellow">yellow</SelectItem>
                                  <SelectItem value="green">green</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormField>
                          </FormRow>
                        </ItemCard>
                      ))}
                    </div>
                  </SectionCard>
                </div>
              )}

              {activeTab === 'events' && (
                <div className="grid grid-cols-1 gap-6">
                  <SectionCard title="Hero Slides" description="Main banner carousel" icon={<Eye />} accent="bg-site-accent">
                    <div className="mb-4">
                      <AddButton onClick={addHeroSlide} label="Add Hero Slide" />
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {settings.homepage.heroSlides.map((item, index) => (
                        <ItemCard key={item.id} index={index} label="Slide" onRemove={() => removeHeroSlide(index)}>
                          <FormField label="Title"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={item.title} onChange={(e) => updateHeroSlide(index, "title", e.target.value)} /></FormField>
                          <FormField label="Badge Text"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={item.badgeText || ""} onChange={(e) => updateHeroSlide(index, "badgeText", e.target.value)} /></FormField>
                          <div className="md:col-span-2"><FormField label="Subtitle"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={item.subtitle || ""} onChange={(e) => updateHeroSlide(index, "subtitle", e.target.value)} /></FormField></div>
                          <div className="md:col-span-2"><FormField label="Image URL"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={item.image} onChange={(e) => updateHeroSlide(index, "image", e.target.value)} /></FormField></div>
                          <FormField label="Link URL"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={item.link || ""} onChange={(e) => updateHeroSlide(index, "link", e.target.value)} /></FormField>
                          <FormField label="Color">
                            <Select value={item.color} onValueChange={(value) => updateHeroSlide(index, "color", value)}>
                              <SelectTrigger className="h-9 rounded-xl border-site-border bg-site-raised text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yellow">yellow</SelectItem>
                                <SelectItem value="pink">pink</SelectItem>
                                <SelectItem value="blue">blue</SelectItem>
                                <SelectItem value="green">green</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormField>
                        </ItemCard>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard title="News Items" description="Recent news and updates (Drag to Reorder)" icon={<Type />} accent="bg-site-accent/10">
                    <div className="mb-4">
                      <AddButton onClick={() => addBlockItem("newsItems")} label="Add News Item" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {settings.homepage.newsItems.map((item, index) => (
                        <ItemCard key={item.id} index={index} label="News" draggable onDragStart={() => handleDragStart("newsItems", index)} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop("newsItems", index)} onRemove={() => removeBlockItem("newsItems", index)}>
                          <div className="md:col-span-2"><FormField label="Title"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={item.title} onChange={(e) => updateNews(index, "title", e.target.value)} /></FormField></div>
                          <FormField label="Category"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={item.category} onChange={(e) => updateNews(index, "category", e.target.value)} /></FormField>
                          <FormField label="Date"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={item.date} onChange={(e) => updateNews(index, "date", e.target.value)} /></FormField>
                          <div className="md:col-span-2"><FormField label="Image URL"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={item.image} onChange={(e) => updateNews(index, "image", e.target.value)} /></FormField></div>
                          <div className="md:col-span-2"><FormField label="Link URL"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={item.href || ""} onChange={(e) => updateNews(index, "href", e.target.value)} /></FormField></div>
                        </ItemCard>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard title="Seasonal Events" description="Special event promotions (Drag to Reorder)" icon={<Calendar />} accent="bg-green-500">
                    <div className="mb-4">
                      <AddButton onClick={() => addBlockItem("seasonalEvents")} label="Add Event" />
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {settings.homepage.seasonalEvents.map((item, index) => (
                        <ItemCard key={item.id} index={index} label="Event" draggable onDragStart={() => handleDragStart("seasonalEvents", index)} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop("seasonalEvents", index)} onRemove={() => removeBlockItem("seasonalEvents", index)}>
                          <div className="md:col-span-2"><FormField label="Title"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={item.title} onChange={(e) => updateEvent(index, "title", e.target.value)} /></FormField></div>
                          <div className="md:col-span-2"><FormField label="Description"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={item.description} onChange={(e) => updateEvent(index, "description", e.target.value)} /></FormField></div>
                          <FormField label="Start Date"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" placeholder="YYYY-MM-DD" value={item.startDate} onChange={(e) => updateEvent(index, "startDate", e.target.value)} /></FormField>
                          <FormField label="End Date"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" placeholder="YYYY-MM-DD" value={item.endDate} onChange={(e) => updateEvent(index, "endDate", e.target.value)} /></FormField>
                          <div className="md:col-span-2"><FormField label="Image URL"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={item.image} onChange={(e) => updateEvent(index, "image", e.target.value)} /></FormField></div>
                          <FormField label="Discount"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={item.discount || ""} onChange={(e) => updateEvent(index, "discount", e.target.value)} /></FormField>
                          <FormField label="Games (Comma-separated)"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={toCsv(item.games || [])} onChange={(e) => updateEvent(index, "games", e.target.value)} /></FormField>
                          <FormField label="Type">
                            <Select value={item.type} onValueChange={(value) => updateEvent(index, "type", value)}>
                              <SelectTrigger className="h-9 rounded-xl border-site-border bg-site-raised text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cashback">cashback</SelectItem>
                                <SelectItem value="discount">discount</SelectItem>
                                <SelectItem value="bonus">bonus</SelectItem>
                                <SelectItem value="special">special</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormField>
                          <FormField label="Discount Color">
                            <Select value={item.discountColor || "blue"} onValueChange={(value) => updateEvent(index, "discountColor", value)}>
                              <SelectTrigger className="h-9 rounded-xl border-site-border bg-site-raised text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="blue">blue</SelectItem>
                                <SelectItem value="purple">purple</SelectItem>
                                <SelectItem value="green">green</SelectItem>
                                <SelectItem value="pink">pink</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormField>
                          <div className="md:col-span-2"><FormField label="Link URL"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={item.href || ""} onChange={(e) => updateEvent(index, "href", e.target.value)} /></FormField></div>
                        </ItemCard>
                      ))}
                    </div>
                  </SectionCard>
                </div>
              )}

              {activeTab === 'features' && (
                <div className="grid grid-cols-1 gap-6">
                  <SectionCard title="System Features" description="Enable or disable main system modules" icon={<Settings2 />} accent="bg-site-accent">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ToggleField label="Enable Promotions" description="Show promotion pages and banners" checked={settings.features.enablePromotions} onChange={(v) => setSettings((s) => ({ ...s, features: { ...s.features, enablePromotions: v } }))} />
                      <ToggleField label="Enable Support Tickets" description="Allow users to create tickets" checked={settings.features.enableSupportTickets} onChange={(v) => setSettings((s) => ({ ...s, features: { ...s.features, enableSupportTickets: v } }))} />
                      <ToggleField label="Enable User Registration" description="Allow new user signups" checked={settings.features.enableUserRegistration} onChange={(v) => setSettings((s) => ({ ...s, features: { ...s.features, enableUserRegistration: v } }))} />
                      <ToggleField label="Enable Maintenance Mode" description="Disable frontend access" checked={settings.features.enableMaintenanceMode} onChange={(v) => setSettings((s) => ({ ...s, features: { ...s.features, enableMaintenanceMode: v } }))} />
                    </div>
                    {settings.features.enableMaintenanceMode && (
                      <div className="mt-4">
                        <FormField label="Maintenance Message">
                          <Textarea rows={2} className="rounded-xl border-site-border bg-site-raised px-4 py-2 text-sm text-white" placeholder="Maintenance message" value={settings.features.maintenanceMessage || ""} onChange={(e) => setSettings((s) => ({ ...s, features: { ...s.features, maintenanceMessage: e.target.value } }))} />
                        </FormField>
                      </div>
                    )}
                  </SectionCard>

                  <SectionCard title="Commerce Config" description="Rules for purchases and checkouts" icon={<ShoppingCart />} accent="bg-site-accent/10">
                    <ToggleField label="Allow Guest Checkout" description="Users can buy without logging in" checked={settings.commerce.allowGuestCheckout} onChange={(v) => setSettings((s) => ({ ...s, commerce: { ...s.commerce, allowGuestCheckout: v } }))} />
                    <div className="mt-4">
                      <FormRow>
                        <FormField label="Tax %"><Input size="sm" type="number" className="rounded-xl border-site-border bg-site-raised" value={settings.commerce.taxPercent} onChange={(e) => setSettings((s) => ({ ...s, commerce: { ...s.commerce, taxPercent: Number(e.target.value) || 0 } }))} /></FormField>
                        <FormField label="Order Auto Cancel (Minutes)"><Input size="sm" type="number" className="rounded-xl border-site-border bg-site-raised" value={settings.commerce.orderAutoCancelMinutes} onChange={(e) => setSettings((s) => ({ ...s, commerce: { ...s.commerce, orderAutoCancelMinutes: Number(e.target.value) || 1 } }))} /></FormField>
                      </FormRow>
                      <FormRow>
                        <FormField label="Min Topup Amount"><Input size="sm" type="number" className="rounded-xl border-site-border bg-site-raised" value={settings.commerce.minTopupAmount} onChange={(e) => setSettings((s) => ({ ...s, commerce: { ...s.commerce, minTopupAmount: Number(e.target.value) || 0 } }))} /></FormField>
                        <FormField label="Max Topup Amount"><Input size="sm" type="number" className="rounded-xl border-site-border bg-site-raised" value={settings.commerce.maxTopupAmount} onChange={(e) => setSettings((s) => ({ ...s, commerce: { ...s.commerce, maxTopupAmount: Number(e.target.value) || 0 } }))} /></FormField>
                      </FormRow>
                    </div>
                  </SectionCard>

                  <SectionCard title="Social Media Links" description="External community links" icon={<Globe />} accent="bg-green-500">
                    <FormRow>
                      <FormField label="Facebook URL"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={settings.social.facebookUrl || ""} onChange={(e) => setSettings((s) => ({ ...s, social: { ...s.social, facebookUrl: e.target.value } }))} /></FormField>
                      <FormField label="LINE URL"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={settings.social.lineUrl || ""} onChange={(e) => setSettings((s) => ({ ...s, social: { ...s.social, lineUrl: e.target.value } }))} /></FormField>
                    </FormRow>
                    <FormField label="Discord URL"><Input size="sm" className="rounded-xl border-site-border bg-site-raised" value={settings.social.discordUrl || ""} onChange={(e) => setSettings((s) => ({ ...s, social: { ...s.social, discordUrl: e.target.value } }))} /></FormField>
                  </SectionCard>
                </div>
              )}

              {activeTab === 'system' && (
                <div className="grid grid-cols-1 gap-6">
                  <SectionCard title="Permissions" description="Admin user roles" icon={<Users />} accent="bg-site-accent">
                    <div className="overflow-x-auto border border-white/5 rounded-2xl bg-site-surface">
                      <Table className="min-w-full text-sm">
                        <TableHeader className="bg-site-raised">
                          <TableRow className="border-site-border-soft hover:bg-transparent text-left">
                            <TableHead className="h-auto px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-site-dim border-r border-white/5">Admin</TableHead>
                            <TableHead className="h-auto px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-site-dim border-r border-white/5">Email</TableHead>
                            <TableHead className="h-auto px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-site-dim border-r border-white/5 text-center">Read</TableHead>
                            <TableHead className="h-auto px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-site-dim text-center">Write</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {permissions.map((item) => (
                            <TableRow key={item.adminId} className="border-site-border-soft hover:bg-site-raised/50">
                              <TableCell className="px-3 py-3 border-r border-white/5 font-semibold">{item.username}</TableCell>
                              <TableCell className="px-3 py-3 border-r border-white/5 text-gray-400">{item.email}</TableCell>
                              <TableCell className="px-3 py-3 border-r border-white/5 text-center">
                                <Checkbox className="h-5 w-5 cursor-pointer" checked={item.read} onCheckedChange={(checked) => updatePermission(item.adminId, "read", checked === true)} />
                              </TableCell>
                              <TableCell className="px-3 py-3 text-center">
                                <Checkbox className="h-5 w-5 cursor-pointer" checked={item.write} onCheckedChange={(checked) => updatePermission(item.adminId, "write", checked === true)} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </SectionCard>

                  <SectionCard title="Preview Draft vs Live" description="Compare current changes to live data" icon={<History />} accent="bg-site-accent/10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-white/5 rounded-2xl bg-site-surface overflow-hidden">
                        <div className="bg-site-raised p-2 border-b border-white/5 font-bold flex items-center justify-between">
                          <span>Draft Promo</span>
                          <span className="bg-white/5 border border-white/10 px-2 py-0.5 text-xs rounded-full">{settings.homepage.promoCards.length} items</span>
                        </div>
                        <div className="p-3 space-y-2">
                          {settings.homepage.promoCards.slice(0, 3).map((item) => (
                            <div key={item.id} className="rounded-xl border border-white/5 bg-site-raised p-3 text-sm text-white">
                              <p className="font-bold">{item.title || "(no title)"}</p>
                              <p className="text-xs text-gray-400 truncate">{item.ctaText || "-"}</p>
                            </div>
                          ))}
                          {settings.homepage.promoCards.length > 3 && <p className="text-xs text-center text-gray-400 font-bold">+ {settings.homepage.promoCards.length - 3} more</p>}
                        </div>
                      </div>

                      <div className="border border-white/5 rounded-2xl bg-site-surface overflow-hidden">
                        <div className="bg-green-500 text-white p-2 border-b border-white/5 font-bold flex items-center justify-between">
                          <span>Live Promo</span>
                          <span className="bg-site-surface border border-white/5 rounded-2xl px-2 text-xs rounded-full">{liveSettings.homepage.promoCards.length} items</span>
                        </div>
                        <div className="p-3 space-y-2">
                          {liveSettings.homepage.promoCards.slice(0, 3).map((item) => (
                            <div key={item.id} className="rounded-xl border border-white/5 bg-site-raised p-3 text-sm text-white">
                              <p className="font-bold">{item.title || "(no title)"}</p>
                              <p className="text-xs text-gray-400 truncate">{item.ctaText || "-"}</p>
                            </div>
                          ))}
                          {liveSettings.homepage.promoCards.length > 3 && <p className="text-xs text-center text-gray-400 font-bold">+ {liveSettings.homepage.promoCards.length - 3} more</p>}
                        </div>
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard title="Audit Log" description="Item-level diff on publish actions" icon={<History />} accent="bg-green-500">
                    <div className="space-y-3">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="bg-site-raised border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
                          <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
                            <span className="text-xs font-bold bg-site-accent/10 text-site-accent px-2 py-1 rounded border border-site-accent/20 uppercase">{log.action}</span>
                            <span className="text-xs font-medium text-gray-400">{new Date(log.createdAt).toLocaleString("th-TH")}</span>
                          </div>
                          <div className="text-sm font-semibold mb-2">By: {log.actor?.username || log.actorId || "system"}</div>
                          {flattenDiff(log.diff).length > 0 ? (
                            <div className="bg-black/50 p-3 rounded-lg border border-white/5">
                              <ul className="list-disc space-y-1 pl-5 text-xs text-gray-300 font-mono">
                                {flattenDiff(log.diff).map((line, idx) => (
                                  <li key={`${log.id}-${idx}`}>{line}</li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400 italic">No visible diff data</div>
                          )}
                        </div>
                      ))}
                      {auditLogs.length === 0 && (
                        <div className="text-center py-6 text-sm text-gray-400 font-medium border border-white/5 rounded-xl border-dashed border-gray-300">
                          No audit logs found
                        </div>
                      )}
                    </div>

                    {auditTotalPages > 1 && (
                      <div className="flex items-center justify-between text-sm mt-4 font-bold">
                        <Button variant="secondary" size="sm" className="rounded-xl" disabled={auditPage <= 1} onClick={() => loadAuditLogs(Math.max(1, auditPage - 1))}>
                          Prev
                        </Button>
                        <span>Page {auditPage} of {auditTotalPages}</span>
                        <Button variant="secondary" size="sm" className="rounded-xl" disabled={auditPage >= auditTotalPages} onClick={() => loadAuditLogs(auditPage + 1)}>
                          Next
                        </Button>
                      </div>
                    )}
                  </SectionCard>
                </div>
              )}
            </div>
          </>
        )}
      </PageContainer>
    </AdminLayout>
  );
}
