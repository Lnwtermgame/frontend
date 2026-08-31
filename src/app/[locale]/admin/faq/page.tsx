"use client";

import { useState, useEffect } from "react";
import {
  AdminLayout,
  AdminPageHeader,
  ConfirmDialog,
  FormModal,
  ModelSelect,
  PageContainer,
  StatCard,
} from "@/components/admin";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/Badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HelpCircle,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Loader2,
  RefreshCw,
  Tag,
  Eye,
  ThumbsUp,
  Pin,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Save,
  Sparkles,
  Wand2,
  Settings2,
  Check,
  Bot,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  supportApi,
  FaqCategory,
  FaqArticleListItem,
} from "@/lib/services";
import { aiService, AIModel } from "@/lib/services/ai-api";
import Link from "next/link";

// Supported locales
const SUPPORTED_LOCALES = [
  { code: "th", label: "🇹🇭 ไทย" },
  { code: "en", label: "🇺🇸 English" },
  { code: "zh", label: "🇨🇳 中文" },
  { code: "ja", label: "🇯🇵 日本語" },
  { code: "ko", label: "🇰🇷 한국어" },
  { code: "ms", label: "🇲🇾 Melayu" },
  { code: "hi", label: "🇮🇳 हिन्दी" },
  { code: "es", label: "🇪🇸 Español" },
  { code: "fr", label: "🇫🇷 Français" },
];

// Slugify helper: English-only URL-safe, with fallback if text is non-Latin
const slugify = (text: string) => {
  const base = text
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFKD") // remove accents
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "") // keep only latin letters, numbers, spaces, dashes
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (base) return base;
  // Fallback when title is non-Latin (e.g., Thai) to avoid empty slug
  return `faq-${Math.random().toString(36).slice(2, 8)}`;
};

// Types for admin
interface FaqArticleWithCategory {
  id: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  categoryName?: string;
  title: string;
  slug: string;
  locale: string;
  content: string;
  excerpt?: string;
  isActive: boolean;
  isPinned: boolean;
  helpfulCount: number;
  unhelpfulCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sortOrder: number;
}

interface CreateArticleData {
  categoryId: string;
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  isActive?: boolean;
  isPinned?: boolean;
}

const EMPTY_CATEGORY_FORM: CreateCategoryData = {
  name: "",
  slug: "",
  description: "",
  icon: "",
  sortOrder: 0,
};

const EMPTY_ARTICLE_FORM: CreateArticleData = {
  categoryId: "",
  title: "",
  slug: "",
  content: "",
  excerpt: "",
  isActive: true,
  isPinned: false,
};

export default function AdminFaqPage() {
  // Data states
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [articles, setArticles] = useState<FaqArticleWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [localeFilter, setLocaleFilter] = useState<string>("ALL");

  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FaqCategory | null>(
    null,
  );
  const [editingArticle, setEditingArticle] =
    useState<FaqArticleWithCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Destructive confirm (replaces window.confirm)
  const [pendingDelete, setPendingDelete] = useState<
    { type: "category" | "article"; id: string } | null
  >(null);

  // Expanded article for preview
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  // Form data
  const [categoryForm, setCategoryForm] =
    useState<CreateCategoryData>(EMPTY_CATEGORY_FORM);

  const [categorySlugEditedManually, setCategorySlugEditedManually] =
    useState(false);

  const [articleForm, setArticleForm] =
    useState<CreateArticleData>(EMPTY_ARTICLE_FORM);

  const [slugEditedManually, setSlugEditedManually] = useState(false);

  // AI Generation states
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  const [aiCount, setAiCount] = useState(5);
  const [aiCategoryId, setAiCategoryId] = useState("");
  const [aiSystemPrompt, setAiSystemPrompt] = useState(`[Business DNA — Lnwtermgame]
ชื่อแบรนด์: Lnwtermgame (เทพเติมเกม) | URL: https://lnwtermgame.com
ธุรกิจ: แพลตฟอร์ม E-commerce เติมเกมออนไลน์และสินค้าดิจิทัลครบวงจร
กลุ่มเป้าหมาย: เกมเมอร์ไทยและเอเชียตะวันออกเฉียงใต้
บริการ: เติมเกมตรง (Direct Top-Up ผ่าน User ID), บัตรของขวัญดิจิทัล (Steam, PSN, Xbox, Nintendo, Google Play, iTunes), บัตรเติมเงินมือถือ
จุดเด่น: จัดส่งอัตโนมัติทันที, ราคาเป็นธรรม, ปลอดภัย 100%, ซัพพอร์ต 24 ชม., ครอบคลุมทุกเกมทุกแพลตฟอร์ม
ชำระเงิน: PromptPay, โอนธนาคาร, TrueMoney Wallet, บัตรเครดิต/เดบิต, 7-Eleven

คุณคือ FAQ Content Writer ผู้เชี่ยวชาญสำหรับ Lnwtermgame
หน้าที่: สร้างคำถามที่พบบ่อย (FAQ) เป็นภาษาไทยที่ครบถ้วน ชัดเจน และเป็นประโยชน์
กฎ:
- ตอบกลับเป็น JSON array เท่านั้น ไม่ใส่ markdown code block
- ทุกคำตอบต้องละเอียดและเป็นประโยชน์จริง ไม่ generic
- ใช้ภาษาที่เข้าใจง่ายสำหรับผู้ใช้ทั่วไป
- content ต้องยาวพอสมควร (3-5 ย่อหน้า) อธิบายอย่างครบถ้วน
- อ้างอิงบริการ แพลตฟอร์ม และจุดเด่นของ Lnwtermgame ตาม Business DNA`);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [aiGeneratedFAQs, setAiGeneratedFAQs] = useState<{ title: string; content: string; excerpt: string; locale: string; selected: boolean }[]>([]);
  const [aiProgress, setAiProgress] = useState("");
  const [isSavingFAQs, setIsSavingFAQs] = useState(false);
  const [aiLocales, setAiLocales] = useState<string[]>(["th"]);

  // AI Model selection states
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      setIsLoadingModels(true);
      try {
        const models = await aiService.fetchModels();
        setAvailableModels(models);
        if (models.length > 0 && !selectedModel) {
          const defaultModel = aiService.getSelectedModel() || models[0].id;
          setSelectedModel(defaultModel);
          aiService.setModel(defaultModel);
        }
      } catch (error) {
        console.error("[FaqPage] Failed to fetch models:", error);
      } finally {
        setIsLoadingModels(false);
      }
    };
    fetchModels();
  }, [selectedModel]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [categoriesRes, articlesRes] = await Promise.all([
        supportApi.getFaqCategories(),
        supportApi.getFaqArticles(1, 100),
      ]);

      if (categoriesRes.success) {
        setCategories(categoriesRes.data);
      }

      if (articlesRes.success) {
        // Map category names to articles
        const articlesWithCategory: FaqArticleWithCategory[] =
          articlesRes.data.map((article: FaqArticleListItem) => {
            const cat = categoriesRes.data.find(
              (c: FaqCategory) => c.id === article.categoryId,
            );
            return {
              id: article.id,
              categoryId: article.categoryId,
              category: {
                id: cat?.id || article.categoryId,
                name: cat?.name || article.categoryName || "Unknown",
                slug: cat?.slug || "",
              },
              categoryName: cat?.name || article.categoryName || "Unknown",
              title: article.title,
              slug: article.slug,
              locale: article.locale || "th",
              content: article.content || "",
              excerpt: article.excerpt,
              isActive: true,
              isPinned: article.isPinned,
              helpfulCount: 0,
              unhelpfulCount: 0,
              viewCount: article.viewCount,
              createdAt: article.createdAt,
              updatedAt: article.createdAt,
            };
          });
        setArticles(articlesWithCategory);
      }
    } catch (err) {
      setError(supportApi.getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered articles
  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "ALL" || article.categoryId === categoryFilter;
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && article.isActive) ||
      (statusFilter === "INACTIVE" && !article.isActive) ||
      (statusFilter === "PINNED" && article.isPinned);
    const matchesLocale =
      localeFilter === "ALL" || article.locale === localeFilter;
    return matchesSearch && matchesCategory && matchesStatus && matchesLocale;
  });

  // Category CRUD
  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) return;
    const editing = !!editingCategory;

    setIsSubmitting(true);
    try {
      const payload = {
        ...categoryForm,
        slug: categoryForm.slug?.trim() || slugify(categoryForm.name),
        locale: "th" as const,
      };
      const response = editing
        ? await supportApi.updateFaqCategory(editingCategory!.id, payload)
        : await supportApi.createFaqCategory(payload);
      if (response.success) {
        setShowCategoryModal(false);
        setEditingCategory(null);
        setCategoryForm(EMPTY_CATEGORY_FORM);
        setCategorySlugEditedManually(false);
        loadData();
      }
    } catch (err) {
      setError(supportApi.getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDelete) return;
    const { type, id } = pendingDelete;
    setPendingDelete(null);
    try {
      if (type === "category") {
        await supportApi.deleteFaqCategory(id);
      } else {
        await supportApi.deleteFaqArticle(id);
      }
      loadData();
    } catch (err) {
      setError(supportApi.getErrorMessage(err));
    }
  };

  // Article CRUD
  const handleSaveArticle = async () => {
    if (
      !articleForm.title.trim() ||
      !articleForm.content.trim() ||
      !articleForm.categoryId
    )
      return;
    const editing = !!editingArticle;

    setIsSubmitting(true);
    try {
      const response = editing
        ? await supportApi.updateFaqArticle(editingArticle!.id, articleForm)
        : await supportApi.createFaqArticle(articleForm);
      if (response.success) {
        setShowArticleModal(false);
        setEditingArticle(null);
        setArticleForm(EMPTY_ARTICLE_FORM);
        setSlugEditedManually(false);
        loadData();
      }
    } catch (err) {
      setError(supportApi.getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open create/edit modals
  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm(EMPTY_CATEGORY_FORM);
    setCategorySlugEditedManually(false);
    setShowCategoryModal(true);
  };

  const openEditCategory = (category: FaqCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      icon: category.icon || "",
      sortOrder: category.sortOrder,
    });
    setCategorySlugEditedManually(true);
    setShowCategoryModal(true);
  };

  const openCreateArticle = () => {
    setEditingArticle(null);
    setArticleForm({
      ...EMPTY_ARTICLE_FORM,
      categoryId: categories[0]?.id || "",
    });
    setSlugEditedManually(false);
    setShowArticleModal(true);
  };

  const openEditArticle = (article: FaqArticleWithCategory) => {
    setEditingArticle(article);
    setArticleForm({
      categoryId: article.categoryId,
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt || "",
      isActive: article.isActive,
      isPinned: article.isPinned,
    });
    setSlugEditedManually(true);
    setShowArticleModal(true);
  };

  // AI FAQ Generation
  const handleAIGenerate = async () => {
    if (!aiTopic.trim() || !aiCategoryId) {
      toast.error("กรุณาใส่หัวข้อและเลือกหมวดหมู่");
      return;
    }
    if (aiLocales.length === 0) {
      toast.error("กรุณาเลือกภาษาอย่างน้อย 1 ภาษา");
      return;
    }

    const cat = categories.find((c) => c.id === aiCategoryId);
    if (!cat) return;

    setIsGeneratingAI(true);
    setAiGeneratedFAQs([]);

    try {
      if (selectedModel) aiService.setModel(selectedModel);
      const allFaqs: { title: string; content: string; excerpt: string; locale: string; selected: boolean }[] = [];

      for (const locale of aiLocales) {
        const localeLabel = SUPPORTED_LOCALES.find(l => l.code === locale)?.label || locale;
        setAiProgress(`กำลังสร้าง FAQ ${aiCount} ข้อ (${localeLabel})...`);

        const faqs = await aiService.generateFAQs(
          aiTopic,
          cat.name,
          aiCount,
          aiSystemPrompt,
          locale,
        );
        allFaqs.push(...faqs.map((f) => ({ ...f, locale, selected: true })));
      }

      setAiGeneratedFAQs(allFaqs);
      setAiProgress("");
      toast.success(`สร้าง FAQ สำเร็จ ${allFaqs.length} ข้อ (${aiLocales.length} ภาษา)`);
    } catch (err) {
      console.error("[AI FAQ] Generation failed:", err);
      toast.error(`ส้าง FAQ ล้มเหลว: ${err instanceof Error ? err.message : "Unknown error"}`);
      setAiProgress("");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSaveGeneratedFAQs = async () => {
    const selected = aiGeneratedFAQs.filter((f) => f.selected);
    if (selected.length === 0) {
      toast.error("กรุณาเลือก FAQ อย่างน้อย 1 ข้อ");
      return;
    }

    setIsSavingFAQs(true);
    let saved = 0;
    for (const faq of selected) {
      try {
        const response = await supportApi.createFaqArticle({
          categoryId: aiCategoryId,
          title: faq.title,
          slug: slugify(faq.title),
          locale: faq.locale,
          content: faq.content,
          excerpt: faq.excerpt,
          isActive: true,
          isPinned: false,
        });
        if (response.success) saved++;
      } catch (err) {
        console.error(`[AI FAQ] Failed to save: ${faq.title}`, err);
      }
    }
    toast.success(`บันทึก FAQ ${saved}/${selected.length} สำเร็จ`);
    setAiGeneratedFAQs([]);
    setIsSavingFAQs(false);
    loadData();
  };

  const toggleFaqSelection = (index: number) => {
    setAiGeneratedFAQs((prev) =>
      prev.map((f, i) => (i === index ? { ...f, selected: !f.selected } : f)),
    );
  };

  const toggleAiLocale = (code: string, checked: boolean) => {
    setAiLocales((prev) =>
      checked ? [...prev, code] : prev.filter((l) => l !== code),
    );
  };

  return (
    <AdminLayout>
      <PageContainer>
        <AdminPageHeader title="จัดการคำถามที่พบบ่อย (FAQ)" />

        <div className="space-y-4">
          {/* Header actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-bold text-site-text">จัดการ FAQ</h1>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={showAIGenerate ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAIGenerate(!showAIGenerate)}
              >
                <Sparkles className="h-4 w-4" />
                AI สร้าง FAQ
              </Button>
              <Button variant="outline" size="sm" onClick={openCreateCategory}>
                <Tag className="h-4 w-4" />
                เพิ่มหมวดหมู่
              </Button>
              <Button
                size="sm"
                onClick={openCreateArticle}
                disabled={categories.length === 0}
              >
                <Plus className="h-4 w-4" />
                เพิ่มบทความ
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-status-danger/10 border border-status-danger/30 rounded-10 p-3 flex items-center">
              <AlertCircle className="text-status-danger mr-3" size={18} />
              <span className="text-site-text text-sm">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-site-muted hover:text-site-text"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* AI Generate Panel */}
          {showAIGenerate && (
            <div className="site-card overflow-hidden">
              <div className="py-3.5 px-5 border-b-2 border-site-accent flex items-center text-sm font-bold text-site-text uppercase tracking-wide">
                <Bot size={18} className="mr-2 text-site-accent" aria-hidden="true" />
                AI สร้าง FAQ อัตโนมัติ
              </div>

              <div className="p-5 space-y-4">
                {/* Row 1: Topic + Category + Count + Model */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-5">
                    <Input
                      label="หัวข้อ / คีย์เวิร์ด"
                      type="text"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="เช่น: การเติมเกม, วิธีชำระเงิน, การสั่งซื้อ"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Label className="text-xs font-medium text-site-muted mb-1.5 block">
                      หมวดหมู่เป้าหมาย
                    </Label>
                    <Select value={aiCategoryId} onValueChange={setAiCategoryId}>
                      <SelectTrigger className="w-full" aria-label="หมวดหมู่เป้าหมาย">
                        <SelectValue placeholder="เลือกหมวดหมู่..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs font-medium text-site-muted mb-1.5 block">
                      จำนวน
                    </Label>
                    <Select
                      value={String(aiCount)}
                      onValueChange={(v) => setAiCount(Number(v))}
                    >
                      <SelectTrigger className="w-full" aria-label="จำนวน">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[3, 5, 10, 15, 20].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n} ข้อ
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs font-medium text-site-muted mb-1.5 block">
                      Model
                    </Label>
                    <ModelSelect
                      models={availableModels}
                      value={selectedModel}
                      onValueChange={(v) => {
                        setSelectedModel(v);
                        aiService.setModel(v);
                      }}
                      disabled={isLoadingModels}
                      loading={isLoadingModels}
                    />
                  </div>
                </div>

                {/* Row 2: Locale Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-medium text-site-muted">
                      ภาษาที่ต้องการสร้าง ({aiLocales.length} เลือก)
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-site-accent"
                        onClick={() =>
                          setAiLocales(SUPPORTED_LOCALES.map((l) => l.code))
                        }
                      >
                        เลือกทั้งหมด
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-site-muted"
                        onClick={() => setAiLocales(["th"])}
                      >
                        รีเซ็ต
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SUPPORTED_LOCALES.map((locale) => (
                      <label
                        key={locale.code}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-10 text-xs font-medium cursor-pointer transition-colors ${
                          aiLocales.includes(locale.code)
                            ? "bg-site-accent/15 border-site-accent/40 text-site-accent"
                            : "bg-site-raised/60 border-site-border-soft text-site-muted hover:text-site-text"
                        }`}
                      >
                        <Checkbox
                          checked={aiLocales.includes(locale.code)}
                          onCheckedChange={(v) =>
                            toggleAiLocale(locale.code, v === true)
                          }
                          className="h-3.5 w-3.5"
                        />
                        {locale.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* System Prompt (collapsible) */}
                <div className="border border-site-border-soft rounded-10 bg-site-raised/50">
                  <button
                    type="button"
                    onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-site-text hover:bg-site-raised/60 transition-colors rounded-10"
                  >
                    <span className="flex items-center">
                      <Settings2 size={14} className="mr-1.5 text-site-muted" />
                      AI System Prompt (แก้ไขได้)
                    </span>
                    {showSystemPrompt ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                  {showSystemPrompt && (
                    <div className="px-3 pb-3">
                      <Textarea
                        value={aiSystemPrompt}
                        onChange={(e) => setAiSystemPrompt(e.target.value)}
                        rows={6}
                        className="font-mono text-xs resize-y"
                        placeholder="กำหนด system prompt สำหรับ AI..."
                      />
                      <p className="text-[10px] text-site-dim mt-1">
                        กำหนดบทบาทและกฎของ AI เช่น โทนเสียง, ความยาวคำตอบ,
                        รูปแบบเฉพาะของเว็บ
                      </p>
                    </div>
                  )}
                </div>

                {/* Generate Button */}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleAIGenerate}
                    disabled={isGeneratingAI || !aiTopic.trim() || !aiCategoryId}
                  >
                    {isGeneratingAI ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        กำลังสร้าง...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        สร้าง FAQ
                      </>
                    )}
                  </Button>
                  {aiProgress && (
                    <span className="text-xs text-site-accent font-medium animate-pulse">
                      {aiProgress}
                    </span>
                  )}
                </div>

                {/* Generated FAQs Preview */}
                {aiGeneratedFAQs.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-site-text">
                        ผลลัพธ์ ({aiGeneratedFAQs.filter((f) => f.selected).length}/
                        {aiGeneratedFAQs.length} ข้อ)
                      </h3>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-site-accent"
                          onClick={() =>
                            setAiGeneratedFAQs((prev) =>
                              prev.map((f) => ({ ...f, selected: true })),
                            )
                          }
                        >
                          เลือกทั้งหมด
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-site-muted"
                          onClick={() =>
                            setAiGeneratedFAQs((prev) =>
                              prev.map((f) => ({ ...f, selected: false })),
                            )
                          }
                        >
                          ยกเลิกทั้งหมด
                        </Button>
                      </div>
                    </div>

                    {aiGeneratedFAQs.map((faq, index) => (
                      <div
                        key={index}
                        className={`border rounded-10 bg-site-raised/50 p-3 transition-colors ${
                          faq.selected
                            ? "border-status-success/40"
                            : "border-site-border-soft opacity-60"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Checkbox
                            checked={faq.selected}
                            onCheckedChange={() => toggleFaqSelection(index)}
                            className="mt-0.5"
                            aria-label={`เลือก ${faq.title}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-site-text">
                                {faq.title}
                              </h4>
                              <Badge variant="neutral" className="shrink-0">
                                {SUPPORTED_LOCALES.find((l) => l.code === faq.locale)
                                  ?.label || faq.locale}
                              </Badge>
                            </div>
                            <p className="text-xs text-site-muted mt-0.5 italic">
                              {faq.excerpt}
                            </p>
                            <p className="text-xs text-site-muted mt-1 line-clamp-3">
                              {faq.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button
                      fullWidth
                      className="bg-status-success text-white hover:bg-status-success/90"
                      onClick={handleSaveGeneratedFAQs}
                      disabled={
                        isSavingFAQs ||
                        aiGeneratedFAQs.filter((f) => f.selected).length === 0
                      }
                    >
                      {isSavingFAQs ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          กำลังบันทึก...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          บันทึกที่เลือก (
                          {aiGeneratedFAQs.filter((f) => f.selected).length} ข้อ)
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard title="หมวดหมู่" value={categories.length} semantic="blue" icon={Tag} />
            <StatCard
              title="บทความทั้งหมด"
              value={articles.length}
              semantic="green"
              icon={HelpCircle}
            />
            <StatCard
              title="บทความที่ปักหมุด"
              value={articles.filter((a) => a.isPinned).length}
              semantic="amber"
              icon={Pin}
            />
            <StatCard
              title="ไม่แสดง"
              value={articles.filter((a) => !a.isActive).length}
              semantic="dim"
              icon={AlertCircle}
            />
          </div>

          {/* Categories Section */}
          <div className="site-card overflow-hidden">
            <div className="py-3.5 px-5 border-b border-site-border-soft flex items-center text-sm font-bold text-site-text">
              <Tag size={18} className="mr-2 text-site-accent" aria-hidden="true" />
              หมวดหมู่ ({categories.length})
            </div>
            <div className="p-4">
              {categories.length === 0 ? (
                <div className="text-center py-6 text-site-muted">
                  <Tag size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">ยังไม่มีหมวดหมู่</p>
                  <button
                    onClick={openCreateCategory}
                    className="text-site-accent hover:text-site-accent-hover mt-1 text-sm font-medium"
                  >
                    สร้างหมวดหมู่แรก
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="border border-site-border-soft rounded-10 bg-site-raised/40 p-3 hover:bg-site-raised/70 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex items-center min-w-0">
                          {category.icon && (
                            <span className="text-xl mr-2">{category.icon}</span>
                          )}
                          <h3 className="font-bold text-site-text text-sm truncate">
                            {category.name}
                          </h3>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-site-muted"
                            onClick={() => openEditCategory(category)}
                            aria-label={`แก้ไข ${category.name}`}
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-status-danger"
                            onClick={() =>
                              setPendingDelete({
                                type: "category",
                                id: category.id,
                              })
                            }
                            aria-label={`ลบ ${category.name}`}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-site-muted mb-1.5 line-clamp-1">
                        {category.description || "ไม่มีคำอธิบาย"}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-site-dim">
                        <span>Slug: {category.slug}</span>
                        <span>
                          {
                            articles.filter((a) => a.categoryId === category.id)
                              .length
                          }{" "}
                          บทความ
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Articles Section */}
          <div className="site-card overflow-hidden">
            <div className="py-3.5 px-5 border-b border-site-border-soft">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <h2 className="text-sm font-bold text-site-text flex items-center">
                  <HelpCircle size={18} className="mr-2 text-site-accent" aria-hidden="true" />
                  บทความ ({filteredArticles.length})
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Search */}
                  <Input
                    type="text"
                    placeholder="ค้นหาบทความ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Search size={14} />}
                    className="w-48"
                    size="sm"
                  />
                  {/* Category Filter */}
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger className="w-40 h-9" aria-label="กรองหมวดหมู่">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">ทุกหมวดหมู่</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32 h-9" aria-label="กรองสถานะ">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">ทุกสถานะ</SelectItem>
                      <SelectItem value="ACTIVE">แสดง</SelectItem>
                      <SelectItem value="INACTIVE">ไม่แสดง</SelectItem>
                      <SelectItem value="PINNED">ปักหมุด</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* Locale Filter */}
                  <Select value={localeFilter} onValueChange={setLocaleFilter}>
                    <SelectTrigger className="w-36 h-9" aria-label="กรองภาษา">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">ทุกภาษา</SelectItem>
                      {SUPPORTED_LOCALES.map((loc) => (
                        <SelectItem key={loc.code} value={loc.code}>
                          {loc.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Refresh */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadData}
                    disabled={isLoading}
                  >
                    <RefreshCw
                      size={12}
                      className={isLoading ? "animate-spin" : ""}
                    />
                    รีเฟรช
                  </Button>
                </div>
              </div>
            </div>

            <div className="divide-y divide-site-border-soft">
              {isLoading ? (
                <div className="p-8 text-center">
                  <Loader2
                    className="animate-spin mx-auto text-site-accent mb-3"
                    size={28}
                  />
                  <p className="text-site-muted text-sm">กำลังโหลด...</p>
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="p-8 text-center">
                  <HelpCircle size={36} className="mx-auto text-site-dim mb-3" />
                  <p className="text-site-muted text-sm">ไม่พบบทความ</p>
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setCategoryFilter("ALL");
                        setStatusFilter("ALL");
                        setLocaleFilter("ALL");
                      }}
                      className="text-site-accent hover:text-site-accent-hover mt-1 text-sm font-medium"
                    >
                      ล้างตัวกรอง
                    </button>
                  )}
                </div>
              ) : (
                filteredArticles.map((article) => (
                  <div
                    key={article.id}
                    className="p-4 hover:bg-site-raised/40 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-1.5 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {article.isPinned && (
                          <Pin size={14} className="text-site-accent flex-shrink-0" />
                        )}
                        {!article.isActive && (
                          <AlertCircle
                            size={14}
                            className="text-site-dim flex-shrink-0"
                          />
                        )}
                        <h3
                          className={`font-bold text-sm truncate ${
                            !article.isActive ? "text-site-dim" : "text-site-text"
                          }`}
                        >
                          {article.title}
                        </h3>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-site-muted"
                          onClick={() => openEditArticle(article)}
                          aria-label={`แก้ไข ${article.title}`}
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-status-danger"
                          onClick={() =>
                            setPendingDelete({ type: "article", id: article.id })
                          }
                          aria-label={`ลบ ${article.title}`}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-site-muted mb-1.5">
                      <Badge variant="neutral">{article.categoryName}</Badge>
                      <Badge variant="accent">
                        {SUPPORTED_LOCALES.find((l) => l.code === article.locale)
                          ?.label || article.locale}
                      </Badge>
                      <span className="flex items-center">
                        <Eye size={12} className="mr-1" />
                        {article.viewCount}
                      </span>
                      <span className="flex items-center">
                        <ThumbsUp size={12} className="mr-1" />
                        {article.helpfulCount}
                      </span>
                      <span className="tabular-nums">
                        {new Date(article.createdAt).toLocaleDateString("th-TH")}
                      </span>
                    </div>
                    <p className="text-xs text-site-muted line-clamp-2">
                      {article.excerpt || article.content}
                    </p>

                    {/* Preview */}
                    <button
                      onClick={() =>
                        setExpandedArticle(
                          expandedArticle === article.id ? null : article.id,
                        )
                      }
                      className="mt-1.5 text-xs text-site-accent hover:text-site-accent-hover font-medium flex items-center"
                    >
                      {expandedArticle === article.id ? (
                        <>
                          <ChevronUp size={14} className="mr-1" />
                          ซ่อนเนื้อหา
                        </>
                      ) : (
                        <>
                          <ChevronDown size={14} className="mr-1" />
                          แสดงเนื้อหา
                        </>
                      )}
                    </button>
                    {expandedArticle === article.id && (
                      <div className="mt-2 p-3 bg-site-raised/60 border border-site-border-soft rounded-10">
                        <p className="text-xs text-site-muted whitespace-pre-line">
                          {article.content}
                        </p>
                        <Link
                          href={`/support/faq/${article.slug}`}
                          target="_blank"
                          className="mt-1.5 inline-flex items-center text-xs text-site-accent hover:text-site-accent-hover font-medium"
                        >
                          <Eye size={12} className="mr-1" />
                          ดูหน้าเว็บ
                        </Link>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Category Modal */}
        <FormModal
          open={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          onSubmit={handleSaveCategory}
          title={editingCategory ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}
          loading={isSubmitting}
          size="sm"
        >
          <div className="space-y-3">
            <Input
              label="ชื่อหมวดหมู่ *"
              type="text"
              value={categoryForm.name}
              onChange={(e) => {
                const value = e.target.value;
                setCategoryForm((prev) => ({
                  ...prev,
                  name: value,
                  slug: categorySlugEditedManually ? prev.slug : slugify(value),
                }));
              }}
              placeholder="เช่น การสั่งซื้อ, การชำระเงิน"
            />
            <Input
              label="Slug (ไม่บังคับ)"
              type="text"
              value={categoryForm.slug}
              onChange={(e) => {
                setCategorySlugEditedManually(true);
                setCategoryForm({
                  ...categoryForm,
                  slug: e.target.value,
                });
              }}
              placeholder="จะสร้างอัตโนมัติจากชื่อหมวดหมู่"
            />
            <div>
              <Label className="text-sm font-medium text-site-text mb-1.5 block">
                คำอธิบาย
              </Label>
              <Textarea
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    description: e.target.value,
                  })
                }
                placeholder="คำอธิบายสั้น ๆ เกี่ยวกับหมวดหมู่นี้"
                rows={3}
              />
            </div>
            <Input
              label="ไอคอน (emoji)"
              type="text"
              value={categoryForm.icon}
              onChange={(e) =>
                setCategoryForm({
                  ...categoryForm,
                  icon: e.target.value,
                })
              }
              placeholder="เช่️ 🛒 💳 🎮"
            />
            <Input
              label="ลำดับการแสดง"
              type="number"
              value={categoryForm.sortOrder}
              onChange={(e) =>
                setCategoryForm({
                  ...categoryForm,
                  sortOrder: parseInt(e.target.value) || 0,
                })
              }
              min={0}
            />
          </div>
        </FormModal>

        {/* Article Modal */}
        <FormModal
          open={showArticleModal}
          onClose={() => setShowArticleModal(false)}
          onSubmit={handleSaveArticle}
          title={editingArticle ? "แก้ไขบทความ" : "เพิ่มบทความ"}
          loading={isSubmitting}
          size="lg"
        >
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-site-text mb-1.5 block">
                หมวดหมู่ *
              </Label>
              <Select
                value={articleForm.categoryId}
                onValueChange={(v) =>
                  setArticleForm({ ...articleForm, categoryId: v })
                }
              >
                <SelectTrigger className="w-full" aria-label="หมวดหมู่">
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              label="หัวข้อ *"
              type="text"
              value={articleForm.title}
              onChange={(e) => {
                const value = e.target.value;
                setArticleForm((prev) => ({
                  ...prev,
                  title: value,
                  slug: slugEditedManually ? prev.slug : slugify(value),
                }));
              }}
              placeholder="หัวข้อคำถาม"
            />
            <Input
              label="Slug (ไม่บังคับ)"
              type="text"
              value={articleForm.slug}
              onChange={(e) => {
                setSlugEditedManually(true);
                setArticleForm({
                  ...articleForm,
                  slug: e.target.value,
                });
              }}
              onFocus={() => {
                // If slug is empty when focusing, auto-fill from title
                setArticleForm((prev) => {
                  if ((prev.slug || "").trim()) return prev;
                  return {
                    ...prev,
                    slug: slugify(prev.title || ""),
                  };
                });
              }}
              placeholder="จะสร้างอัตโนมัติจากหัวข้อ"
            />

            {/* AI Generate Section */}
            <div className="bg-site-accent/5 border border-site-accent/20 rounded-10 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Sparkles className="w-4 h-4 text-site-accent mr-2" />
                  <span className="font-semibold text-site-text text-sm">
                    สร้างด้วย AI
                  </span>
                </div>
                {!showAIGenerate && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setShowAIGenerate(true)}
                    disabled={!articleForm.categoryId}
                  >
                    <Wand2 className="w-3 h-3" />
                    เปิดใช้งาน
                  </Button>
                )}
              </div>

              {showAIGenerate && (
                <div className="space-y-2">
                  <Input
                    label="หัวข้อที่ต้องการให้ AI เขียน"
                    type="text"
                    size="sm"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="เช่น วิธีเติมเพชร Free Fire, ขั้นตอนสั่งซื้อสินค้า"
                  />

                  <div>
                    <Label className="text-xs font-medium text-site-muted mb-1 block">
                      เลือก AI Model
                    </Label>
                    <ModelSelect
                      models={availableModels}
                      value={selectedModel}
                      onValueChange={(v) => {
                        setSelectedModel(v);
                        aiService.setModel(v);
                      }}
                      disabled={isLoadingModels || availableModels.length === 0}
                      loading={isLoadingModels}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={async () => {
                        if (!aiTopic.trim() || !articleForm.categoryId) return;

                        // Set the selected model before generating
                        if (selectedModel) {
                          aiService.setModel(selectedModel);
                        }

                        setIsGeneratingAI(true);
                        try {
                          const categoryName =
                            categories.find(
                              (c) => c.id === articleForm.categoryId,
                            )?.name || "ทั่วไป";
                          const result = await aiService.generateFaqContent(
                            aiTopic,
                            categoryName,
                            (progress) => {
                              // Optional: show progress in console or UI
                              console.log(
                                `[AI] ${progress.stage}: ${progress.message}`,
                              );
                            },
                          );
                          const aiSlug = result.slug || slugify(result.title);
                          // Apply AI output; keep manual flag false so auto slug sticks unless user edits
                          setSlugEditedManually(false);
                          setArticleForm((prev) => ({
                            ...prev,
                            title: result.title,
                            content: result.content,
                            excerpt: result.excerpt,
                            slug: slugEditedManually ? prev.slug : aiSlug,
                          }));
                          setError(null);
                        } catch (err: any) {
                          setError(
                            err.message || "ไม่สามารถสร้างเนื้อหาด้วย AI ได้",
                          );
                        } finally {
                          setIsGeneratingAI(false);
                        }
                      }}
                      disabled={
                        isGeneratingAI ||
                        !aiTopic.trim() ||
                        !articleForm.categoryId
                      }
                    >
                      {isGeneratingAI ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          กำลังสร้าง...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3 h-3" />
                          สร้างบทความ
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setShowAIGenerate(false);
                        setAiTopic("");
                      }}
                      aria-label="ปิดส่วนสร้างด้วย AI"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  {isGeneratingAI && (
                    <p className="text-[10px] text-site-muted">
                      AI กำลังสร้างเนื้อหา กรุณารอสักครู่...
                    </p>
                  )}
                </div>
              )}

              {!aiService.isConfigured() && showAIGenerate && (
                <div className="mt-2 p-2 bg-status-danger/10 border border-status-danger/30 rounded-6 text-status-danger text-[10px]">
                  กรุณาตั้งค่า LITELLM_API_KEY ในไฟล์ .env ของ server ก่อนใช้งาน AI
                </div>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium text-site-text mb-1.5 block">
                เนื้อหา *
              </Label>
              <Textarea
                value={articleForm.content}
                onChange={(e) =>
                  setArticleForm({
                    ...articleForm,
                    content: e.target.value,
                  })
                }
                placeholder="คำตอบโดยละเอียด"
                rows={6}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-site-text mb-1.5 block">
                บทสรุป (excerpt)
              </Label>
              <Textarea
                value={articleForm.excerpt}
                onChange={(e) =>
                  setArticleForm({
                    ...articleForm,
                    excerpt: e.target.value,
                  })
                }
                placeholder="สรุปสั้น ๆ สำหรับแสดงในรายการ (ไม่บังคับ)"
                rows={2}
              />
            </div>
            <div className="flex gap-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={articleForm.isActive}
                  onCheckedChange={(v) =>
                    setArticleForm({
                      ...articleForm,
                      isActive: v === true,
                    })
                  }
                />
                <span className="text-sm text-site-text">แสดงบทความ</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={articleForm.isPinned}
                  onCheckedChange={(v) =>
                    setArticleForm({
                      ...articleForm,
                      isPinned: v === true,
                    })
                  }
                />
                <span className="text-sm text-site-text">ปักหมุด</span>
              </label>
            </div>
          </div>
        </FormModal>

        {/* Delete confirmations (replace window.confirm) */}
        <ConfirmDialog
          open={!!pendingDelete}
          onClose={() => setPendingDelete(null)}
          onConfirm={handleDeleteConfirmed}
          title={
            pendingDelete?.type === "category"
              ? "ลบหมวดหมู่นี้?"
              : "ลบบทความนี้?"
          }
          description={
            pendingDelete?.type === "category"
              ? "บทความทั้งหมดในหมวดหมู่นี้จะถูกลบด้วย การกระทำนี้ไม่สามารถย้อนกลับได้"
              : "การกระทำนี้ไม่สามารถย้อนกลับได้"
          }
          destructive
        />
      </PageContainer>
    </AdminLayout>
  );
}
