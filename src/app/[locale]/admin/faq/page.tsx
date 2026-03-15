"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "@/lib/framer-exports";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  HelpCircle,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  X,
  Loader2,
  RefreshCw,
  Tag,
  Eye,
  ThumbsUp,
  Pin,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Save,
  ArrowLeft,
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
  FaqArticle,
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

export default function AdminFaqPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Expanded article for preview
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  // Form data
  const [categoryForm, setCategoryForm] = useState<CreateCategoryData>({
    name: "",
    slug: "",
    description: "",
    icon: "",
    sortOrder: 0,
  });

  const [categorySlugEditedManually, setCategorySlugEditedManually] =
    useState(false);

  const [articleForm, setArticleForm] = useState<CreateArticleData>({
    categoryId: "",
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    isActive: true,
    isPinned: false,
  });

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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showCategoryModal || showArticleModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showCategoryModal, showArticleModal]);

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
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        ...categoryForm,
        slug: categoryForm.slug?.trim() || slugify(categoryForm.name),
        locale: "th" as const,
      };
      const response = await supportApi.createFaqCategory(payload);
      if (response.success) {
        setShowCategoryModal(false);
        setCategoryForm({
          name: "",
          slug: "",
          description: "",
          icon: "",
          sortOrder: 0,
        });
        setCategorySlugEditedManually(false);
        loadData();
      }
    } catch (err) {
      setError(supportApi.getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !categoryForm.name.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        ...categoryForm,
        slug: categoryForm.slug?.trim() || slugify(categoryForm.name),
      };
      const response = await supportApi.updateFaqCategory(
        editingCategory.id,
        payload,
      );
      if (response.success) {
        setShowCategoryModal(false);
        setEditingCategory(null);
        setCategoryForm({
          name: "",
          slug: "",
          description: "",
          icon: "",
          sortOrder: 0,
        });
        setCategorySlugEditedManually(false);
        loadData();
      }
    } catch (err) {
      setError(supportApi.getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (
      !confirm(
        "คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้? บทความทั้งหมดในหมวดหมู่นี้จะถูกลบด้วย",
      )
    )
      return;

    try {
      await supportApi.deleteFaqCategory(categoryId);
      loadData();
    } catch (err) {
      setError(supportApi.getErrorMessage(err));
    }
  };

  // Article CRUD
  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !articleForm.title.trim() ||
      !articleForm.content.trim() ||
      !articleForm.categoryId
    )
      return;

    setIsSubmitting(true);
    try {
      const response = await supportApi.createFaqArticle(articleForm);
      if (response.success) {
        setShowArticleModal(false);
        setArticleForm({
          categoryId: "",
          title: "",
          slug: "",
          content: "",
          excerpt: "",
          isActive: true,
          isPinned: false,
        });
        setSlugEditedManually(false);
        loadData();
      }
    } catch (err) {
      setError(supportApi.getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !editingArticle ||
      !articleForm.title.trim() ||
      !articleForm.content.trim()
    )
      return;

    setIsSubmitting(true);
    try {
      const response = await supportApi.updateFaqArticle(
        editingArticle.id,
        articleForm,
      );
      if (response.success) {
        setShowArticleModal(false);
        setEditingArticle(null);
        setArticleForm({
          categoryId: "",
          title: "",
          slug: "",
          content: "",
          excerpt: "",
          isActive: true,
          isPinned: false,
        });
        setSlugEditedManually(false);
        loadData();
      }
    } catch (err) {
      setError(supportApi.getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบบทความนี้?")) return;

    try {
      await supportApi.deleteFaqArticle(articleId);
      loadData();
    } catch (err) {
      setError(supportApi.getErrorMessage(err));
    }
  };

  // Open edit modals
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
      toast.error(`สร้าง FAQ ล้มเหลว: ${err instanceof Error ? err.message : "Unknown error"}`);
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

  return (
    <AdminLayout title="จัดการคำถามที่พบบ่อย (FAQ)">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="w-1.5 h-5 bg-brutal-yellow mr-2"></span>
            <h1 className="text-xl font-bold text-black">จัดการ FAQ</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAIGenerate(!showAIGenerate)}
              className={`border-[2px] border-black px-3 py-1.5 font-medium flex items-center transition-colors text-sm ${showAIGenerate
                ? "bg-brutal-blue text-white"
                : "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600"
                }`}
              style={{ boxShadow: "3px 3px 0 0 #000000" }}
            >
              <Sparkles size={16} className="mr-2" />
              AI สร้าง FAQ
            </button>
            <button
              onClick={() => {
                setEditingCategory(null);
                setCategoryForm({
                  name: "",
                  slug: "",
                  description: "",
                  icon: "",
                  sortOrder: 0,
                });
                setShowCategoryModal(true);
              }}
              className="bg-white border-[2px] border-black px-3 py-1.5 font-medium flex items-center hover:bg-gray-50 transition-colors text-sm"
              style={{ boxShadow: "3px 3px 0 0 #000000" }}
            >
              <Tag size={16} className="mr-2" />
              เพิ่มหมวดหมู่
            </button>
            <button
              onClick={() => {
                setEditingArticle(null);
                setArticleForm({
                  categoryId: categories[0]?.id || "",
                  title: "",
                  slug: "",
                  content: "",
                  excerpt: "",
                  isActive: true,
                  isPinned: false,
                });
                setSlugEditedManually(false);
                setShowArticleModal(true);
              }}
              disabled={categories.length === 0}
              className="bg-black text-white border-[2px] border-black px-3 py-1.5 font-medium flex items-center hover:bg-gray-800 transition-colors disabled:opacity-50 text-sm"
              style={{ boxShadow: "3px 3px 0 0 #000000" }}
            >
              <Plus size={16} className="mr-2" />
              เพิ่มบทความ
            </button>
          </div>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-100 border-[2px] border-red-500 p-3 flex items-center"
              style={{ boxShadow: "3px 3px 0 0 #000000" }}
            >
              <AlertCircle className="text-red-600 mr-3" size={18} />
              <span className="text-red-700 text-sm">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-700"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Generate Panel */}
        <AnimatePresence>
          {showAIGenerate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gradient-to-br from-purple-50 to-blue-50 border-[2px] border-black overflow-hidden"
              style={{ boxShadow: "3px 3px 0 0 #000000" }}
            >
              <div className="p-3 border-b-[2px] border-black bg-gradient-to-r from-purple-100 to-blue-100">
                <h2 className="text-base font-bold text-black flex items-center">
                  <Bot size={18} className="mr-2 text-purple-600" />
                  AI สร้าง FAQ อัตโนมัติ
                </h2>
              </div>
              <div className="p-4 space-y-4">
                {/* Row 1: Topic + Category + Count */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-5">
                    <label className="block text-xs font-bold text-black mb-1">หัวข้อ / คีย์เวิร์ด</label>
                    <input
                      type="text"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="เช่น: การเติมเกม, วิธีชำระเงิน, การสั่งซื้อ"
                      className="w-full py-2 px-3 bg-white border-[2px] border-black text-sm focus:outline-none focus:border-brutal-blue"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-black mb-1">หมวดหมู่เป้าหมาย</label>
                    <select
                      value={aiCategoryId}
                      onChange={(e) => setAiCategoryId(e.target.value)}
                      className="w-full py-2 px-3 bg-white border-[2px] border-black text-sm focus:outline-none focus:border-brutal-blue cursor-pointer"
                    >
                      <option value="">เลือกหมวดหมู่...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-black mb-1">จำนวน</label>
                    <select
                      value={aiCount}
                      onChange={(e) => setAiCount(Number(e.target.value))}
                      className="w-full py-2 px-3 bg-white border-[2px] border-black text-sm focus:outline-none focus:border-brutal-blue cursor-pointer"
                    >
                      {[3, 5, 10, 15, 20].map((n) => (
                        <option key={n} value={n}>{n} ข้อ</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-black mb-1">Model</label>
                    <select
                      value={selectedModel}
                      onChange={(e) => {
                        setSelectedModel(e.target.value);
                        aiService.setModel(e.target.value);
                      }}
                      disabled={isLoadingModels}
                      className="w-full py-2 px-3 bg-white border-[2px] border-black text-sm focus:outline-none focus:border-brutal-blue cursor-pointer disabled:opacity-50"
                    >
                      {availableModels.map((m) => (
                        <option key={m.id} value={m.id}>{m.id}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Locale Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-black">ภาษาที่ต้องการสร้าง ({aiLocales.length} เลือก)</label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setAiLocales(SUPPORTED_LOCALES.map(l => l.code))}
                        className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-200 transition-colors"
                      >
                        เลือกทั้งหมด
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiLocales(["th"])}
                        className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition-colors"
                      >
                        รีเซ็ต
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SUPPORTED_LOCALES.map((locale) => (
                      <label
                        key={locale.code}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 border-[2px] border-black text-xs font-medium cursor-pointer transition-colors ${aiLocales.includes(locale.code)
                          ? "bg-purple-500 text-white"
                          : "bg-white text-black hover:bg-gray-50"
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={aiLocales.includes(locale.code)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAiLocales([...aiLocales, locale.code]);
                            } else {
                              setAiLocales(aiLocales.filter(l => l !== locale.code));
                            }
                          }}
                          className="sr-only"
                        />
                        {locale.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* System Prompt (collapsible) */}
                <div className="border-[2px] border-black bg-white">
                  <button
                    onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-black hover:bg-gray-50 transition-colors"
                  >
                    <span className="flex items-center">
                      <Settings2 size={14} className="mr-1.5 text-gray-600" />
                      AI System Prompt (แก้ไขได้)
                    </span>
                    {showSystemPrompt ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <AnimatePresence>
                    {showSystemPrompt && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3">
                          <textarea
                            value={aiSystemPrompt}
                            onChange={(e) => setAiSystemPrompt(e.target.value)}
                            rows={6}
                            className="w-full bg-gray-50 border-[2px] border-gray-300 px-3 py-2 text-xs font-mono focus:outline-none focus:border-black resize-y"
                            placeholder="กำหนด system prompt สำหรับ AI..."
                          />
                          <p className="text-[10px] text-gray-500 mt-1">
                            กำหนดบทบาทและกฎของ AI เช่น โทนเสียง, ความยาวคำตอบ, รูปแบบเฉพาะของเว็บ
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Generate Button */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleAIGenerate}
                    disabled={isGeneratingAI || !aiTopic.trim() || !aiCategoryId}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white border-[2px] border-black font-medium text-sm hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{ boxShadow: "2px 2px 0 0 #000" }}
                  >
                    {isGeneratingAI ? (
                      <><Loader2 size={16} className="animate-spin" /> กำลังสร้าง...</>
                    ) : (
                      <><Sparkles size={16} /> สร้าง FAQ</>
                    )}
                  </button>
                  {aiProgress && (
                    <span className="text-xs text-purple-700 font-medium animate-pulse">{aiProgress}</span>
                  )}
                </div>

                {/* Generated FAQs Preview */}
                {aiGeneratedFAQs.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-black flex items-center">
                        <CheckCircle size={16} className="mr-1.5 text-green-600" />
                        ผลลัพธ์ ({aiGeneratedFAQs.filter((f) => f.selected).length}/{aiGeneratedFAQs.length} ข้อ)
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setAiGeneratedFAQs((prev) => prev.map((f) => ({ ...f, selected: true })))}
                          className="text-xs text-brutal-blue hover:underline"
                        >
                          เลือกทั้งหมด
                        </button>
                        <button
                          onClick={() => setAiGeneratedFAQs((prev) => prev.map((f) => ({ ...f, selected: false })))}
                          className="text-xs text-gray-500 hover:underline"
                        >
                          ยกเลิกทั้งหมด
                        </button>
                      </div>
                    </div>

                    {aiGeneratedFAQs.map((faq, index) => (
                      <div
                        key={index}
                        className={`border-[2px] bg-white p-3 transition-all ${faq.selected
                          ? "border-green-500"
                          : "border-gray-300 opacity-60"
                          }`}
                        style={{ boxShadow: faq.selected ? "2px 2px 0 0 #22c55e" : "none" }}
                      >
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => toggleFaqSelection(index)}
                            className={`mt-0.5 w-5 h-5 border-[2px] border-black flex items-center justify-center flex-shrink-0 ${faq.selected ? "bg-green-500 text-white" : "bg-white"
                              }`}
                          >
                            {faq.selected && <Check size={12} />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-black">{faq.title}</h4>
                              <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 border border-purple-300 font-bold shrink-0">
                                {SUPPORTED_LOCALES.find(l => l.code === faq.locale)?.label || faq.locale}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 italic">{faq.excerpt}</p>
                            <p className="text-xs text-gray-700 mt-1 line-clamp-3">{faq.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={handleSaveGeneratedFAQs}
                      disabled={isSavingFAQs || aiGeneratedFAQs.filter((f) => f.selected).length === 0}
                      className="w-full py-2.5 bg-green-500 text-white border-[2px] border-black font-bold text-sm hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{ boxShadow: "3px 3px 0 0 #000" }}
                    >
                      {isSavingFAQs ? (
                        <><Loader2 size={16} className="animate-spin" /> กำลังบันทึก...</>
                      ) : (
                        <><Save size={16} /> บันทึกที่เลือก ({aiGeneratedFAQs.filter((f) => f.selected).length} ข้อ)</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {[
            {
              label: "หมวดหมู่",
              value: categories.length,
              color: "bg-blue-100 text-blue-700 border-blue-500",
            },
            {
              label: "บทความทั้งหมด",
              value: articles.length,
              color: "bg-green-100 text-green-700 border-green-500",
            },
            {
              label: "บทความที่ปักหมุด",
              value: articles.filter((a) => a.isPinned).length,
              color: "bg-yellow-100 text-yellow-700 border-yellow-500",
            },
            {
              label: "ไม่แสดง",
              value: articles.filter((a) => !a.isActive).length,
              color: "bg-gray-100 text-gray-700 border-gray-500",
            },
          ].map((stat, index) => (
            <div
              key={index}
              className={`p-3 text-center border-[2px] ${stat.color}`}
              style={{ boxShadow: "3px 3px 0 0 #000000" }}
            >
              <div className="text-xl font-bold">{stat.value}</div>
              <div className="text-[10px] mt-1 font-medium">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Categories Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border-[2px] border-black overflow-hidden"
          style={{ boxShadow: "3px 3px 0 0 #000000" }}
        >
          <div className="p-3 border-b-[2px] border-black bg-gray-50">
            <h2 className="text-base font-bold text-black flex items-center">
              <Tag size={18} className="mr-2" />
              หมวดหมู่ ({categories.length})
            </h2>
          </div>
          <div className="p-3">
            {categories.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Tag size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">ยังไม่มีหมวดหมู่</p>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryForm({
                      name: "",
                      slug: "",
                      description: "",
                      icon: "",
                      sortOrder: 0,
                    });
                    setShowCategoryModal(true);
                  }}
                  className="text-brutal-blue hover:underline mt-1 text-sm"
                >
                  สร้างหมวดหมู่แรก
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="border-[2px] border-black p-3 hover:bg-gray-50 transition-colors"
                    style={{ boxShadow: "2px 2px 0 0 #000000" }}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center">
                        {category.icon && (
                          <span className="text-xl mr-2">{category.icon}</span>
                        )}
                        <h3 className="font-bold text-black text-sm">
                          {category.name}
                        </h3>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditCategory(category)}
                          className="p-1 text-gray-600 hover:text-black hover:bg-gray-200 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-1.5 line-clamp-1">
                      {category.description || "ไม่มีคำอธิบาย"}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-gray-500">
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
        </motion.div>

        {/* Articles Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border-[2px] border-black overflow-hidden"
          style={{ boxShadow: "3px 3px 0 0 #000000" }}
        >
          <div className="p-3 border-b-[2px] border-black bg-gray-50">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <h2 className="text-base font-bold text-black flex items-center">
                <HelpCircle size={18} className="mr-2" />
                บทความ ({filteredArticles.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {/* Search */}
                <div className="relative">
                  <Search
                    className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={14}
                  />
                  <input
                    type="text"
                    placeholder="ค้นหาบทความ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="py-1.5 pl-8 pr-3 bg-white border-[2px] border-gray-300 text-black text-xs placeholder-gray-400 focus:outline-none focus:border-black"
                  />
                </div>
                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="py-1.5 px-2 bg-white border-[2px] border-gray-300 text-black text-xs focus:outline-none focus:border-black"
                >
                  <option value="ALL">ทุกหมวดหมู่</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="py-1.5 px-2 bg-white border-[2px] border-gray-300 text-black text-xs focus:outline-none focus:border-black"
                >
                  <option value="ALL">ทุกสถานะ</option>
                  <option value="ACTIVE">แสดง</option>
                  <option value="INACTIVE">ไม่แสดง</option>
                  <option value="PINNED">ปักหมุด</option>
                </select>
                {/* Locale Filter */}
                <select
                  value={localeFilter}
                  onChange={(e) => setLocaleFilter(e.target.value)}
                  className="py-1.5 px-2 bg-white border-[2px] border-gray-300 text-black text-xs focus:outline-none focus:border-black"
                >
                  <option value="ALL">ทุกภาษา</option>
                  {SUPPORTED_LOCALES.map((loc) => (
                    <option key={loc.code} value={loc.code}>
                      {loc.label}
                    </option>
                  ))}
                </select>
                {/* Refresh */}
                <button
                  onClick={loadData}
                  disabled={isLoading}
                  className="py-1.5 px-2 bg-gray-100 hover:bg-gray-200 border-[2px] border-gray-300 text-black text-xs flex items-center transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    size={12}
                    className={`mr-1.5 ${isLoading ? "animate-spin" : ""}`}
                  />
                  รีเฟรช
                </button>
              </div>
            </div>
          </div>

          <div className="divide-y-[2px] divide-gray-200">
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2
                  className="animate-spin mx-auto text-black mb-3"
                  size={36}
                />
                <p className="text-gray-600 text-sm">กำลังโหลด...</p>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="p-8 text-center">
                <HelpCircle size={36} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-600 text-sm">ไม่พบบทความ</p>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setCategoryFilter("ALL");
                      setStatusFilter("ALL");
                      setLocaleFilter("ALL");
                    }}
                    className="text-brutal-blue hover:underline mt-1 text-sm"
                  >
                    ล้างตัวกรอง
                  </button>
                )}
              </div>
            ) : (
              filteredArticles.map((article) => (
                <div
                  key={article.id}
                  className="p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {article.isPinned && (
                        <Pin size={14} className="text-brutal-yellow" />
                      )}
                      {!article.isActive && (
                        <AlertCircle size={14} className="text-gray-400" />
                      )}
                      <h3
                        className={`font-bold text-sm ${!article.isActive ? "text-gray-400" : "text-black"}`}
                      >
                        {article.title}
                      </h3>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditArticle(article)}
                        className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-200 transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteArticle(article.id)}
                        className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mb-1.5">
                    <span className="bg-brutal-blue/10 px-1.5 py-0.5 border-[1px] border-brutal-blue/30">
                      {article.categoryName}
                    </span>
                    <span className="bg-purple-50 px-1.5 py-0.5 border-[1px] border-purple-300 text-purple-700 text-[10px] font-bold">
                      {SUPPORTED_LOCALES.find(l => l.code === article.locale)?.label || article.locale}
                    </span>
                    <span className="flex items-center">
                      <Eye size={12} className="mr-1" />
                      {article.viewCount}
                    </span>
                    <span className="flex items-center">
                      <ThumbsUp size={12} className="mr-1" />
                      {article.helpfulCount}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(article.createdAt).toLocaleDateString("th-TH")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {article.excerpt || article.content}
                  </p>

                  {/* Preview */}
                  <button
                    onClick={() =>
                      setExpandedArticle(
                        expandedArticle === article.id ? null : article.id,
                      )
                    }
                    className="mt-1.5 text-xs text-brutal-blue hover:underline flex items-center"
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
                  <AnimatePresence>
                    {expandedArticle === article.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 p-2 bg-gray-100 border-[2px] border-gray-300 overflow-hidden"
                      >
                        <p className="text-xs text-gray-700 whitespace-pre-line">
                          {article.content}
                        </p>
                        <Link
                          href={`/support/faq/${article.slug}`}
                          target="_blank"
                          className="mt-1.5 inline-flex items-center text-xs text-brutal-blue hover:underline"
                        >
                          <Eye size={12} className="mr-1" />
                          ดูหน้าเว็บ
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Category Modal */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {showCategoryModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white border-[2px] border-black w-full max-w-lg max-h-[90vh] overflow-y-auto"
                  style={{ boxShadow: "6px 6px 0 0 #000000" }}
                >
                  <div className="p-4 border-b-[2px] border-black">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-black">
                        {editingCategory ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}
                      </h2>
                      <button
                        onClick={() => setShowCategoryModal(false)}
                        className="text-gray-600 hover:text-black"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                  <form
                    onSubmit={
                      editingCategory
                        ? handleUpdateCategory
                        : handleCreateCategory
                    }
                    className="p-4 space-y-3"
                  >
                    <div>
                      <label className="block text-gray-700 mb-1.5 font-medium text-sm">
                        ชื่อหมวดหมู่ *
                      </label>
                      <input
                        type="text"
                        value={categoryForm.name}
                        onChange={(e) => {
                          const value = e.target.value;
                          setCategoryForm((prev) => ({
                            ...prev,
                            name: value,
                            slug: categorySlugEditedManually
                              ? prev.slug
                              : slugify(value),
                          }));
                        }}
                        placeholder="เช่น การสั่งซื้อ, การชำระเงิน"
                        required
                        className="w-full py-1.5 px-3 bg-white border-[2px] border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:border-black transition-colors text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1.5 font-medium text-sm">
                        Slug (ไม่บังคับ)
                      </label>
                      <input
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
                        className="w-full py-1.5 px-3 bg-white border-[2px] border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:border-black transition-colors text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1.5 font-medium text-sm">
                        คำอธิบาย
                      </label>
                      <textarea
                        value={categoryForm.description}
                        onChange={(e) =>
                          setCategoryForm({
                            ...categoryForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="คำอธิบายสั้น ๆ เกี่ยวกับหมวดหมู่นี้"
                        rows={3}
                        className="w-full py-1.5 px-3 bg-white border-[2px] border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:border-black transition-colors resize-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1.5 font-medium text-sm">
                        ไอคอน (emoji)
                      </label>
                      <input
                        type="text"
                        value={categoryForm.icon}
                        onChange={(e) =>
                          setCategoryForm({
                            ...categoryForm,
                            icon: e.target.value,
                          })
                        }
                        placeholder="เช่️ 🛒 💳 🎮"
                        className="w-full py-1.5 px-3 bg-white border-[2px] border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:border-black transition-colors text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1.5 font-medium text-sm">
                        ลำดับการแสดง
                      </label>
                      <input
                        type="number"
                        value={categoryForm.sortOrder}
                        onChange={(e) =>
                          setCategoryForm({
                            ...categoryForm,
                            sortOrder: parseInt(e.target.value) || 0,
                          })
                        }
                        min={0}
                        className="w-full py-1.5 px-3 bg-white border-[2px] border-gray-300 text-black focus:outline-none focus:border-black transition-colors text-sm"
                      />
                    </div>
                    <div className="flex gap-2 pt-3">
                      <button
                        type="button"
                        onClick={() => setShowCategoryModal(false)}
                        className="flex-1 py-2 px-3 border-[2px] border-black text-black hover:bg-gray-100 transition-colors font-medium text-sm"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !categoryForm.name.trim()}
                        className="flex-1 py-2 px-3 bg-black text-white border-[2px] border-black disabled:opacity-50 disabled:cursor-not-allowed font-medium hover:bg-gray-800 transition-colors text-sm"
                        style={{ boxShadow: "3px 3px 0 0 #000000" }}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center">
                            <Loader2 size={16} className="animate-spin mr-2" />
                            กำลังบันทึก...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center">
                            <Save size={16} className="mr-2" />
                            บันทึก
                          </span>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}

      {/* Article Modal */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {showArticleModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white border-[2px] border-black w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                  style={{ boxShadow: "6px 6px 0 0 #000000" }}
                >
                  <div className="p-4 border-b-[2px] border-black">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-black">
                        {editingArticle ? "แก้ไขบทความ" : "เพิ่มบทความ"}
                      </h2>
                      <button
                        onClick={() => setShowArticleModal(false)}
                        className="text-gray-600 hover:text-black"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                  <form
                    onSubmit={
                      editingArticle ? handleUpdateArticle : handleCreateArticle
                    }
                    className="p-4 space-y-3"
                  >
                    <div>
                      <label className="block text-gray-700 mb-1.5 font-medium text-sm">
                        หมวดหมู่ *
                      </label>
                      <select
                        value={articleForm.categoryId}
                        onChange={(e) =>
                          setArticleForm({
                            ...articleForm,
                            categoryId: e.target.value,
                          })
                        }
                        required
                        className="w-full py-1.5 px-3 bg-white border-[2px] border-gray-300 text-black focus:outline-none focus:border-black transition-colors text-sm"
                      >
                        <option value="">เลือกหมวดหมู่</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1.5 font-medium text-sm">
                        หัวข้อ *
                      </label>
                      <input
                        type="text"
                        value={articleForm.title}
                        onChange={(e) => {
                          const value = e.target.value;
                          setArticleForm((prev) => ({
                            ...prev,
                            title: value,
                            slug: slugEditedManually
                              ? prev.slug
                              : slugify(value),
                          }));
                        }}
                        placeholder="หัวข้อคำถาม"
                        required
                        className="w-full py-1.5 px-3 bg-white border-[2px] border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:border-black transition-colors text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1.5 font-medium text-sm">
                        Slug (ไม่บังคับ)
                      </label>
                      <input
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
                        className="w-full py-1.5 px-3 bg-white border-[2px] border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:border-black transition-colors text-sm"
                      />
                    </div>

                    {/* AI Generate Section */}
                    <div className="bg-brutal-pink/10 border-[2px] border-brutal-pink p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Sparkles className="w-4 h-4 text-brutal-pink mr-2" />
                          <span className="font-medium text-black text-sm">
                            สร้างด้วย AI
                          </span>
                        </div>
                        {!showAIGenerate && (
                          <button
                            type="button"
                            onClick={() => setShowAIGenerate(true)}
                            disabled={!articleForm.categoryId}
                            className="text-xs bg-brutal-pink text-white px-2 py-1 border-[2px] border-black hover:bg-brutal-pink/80 transition-colors disabled:opacity-50"
                            style={{ boxShadow: "2px 2px 0 0 #000000" }}
                          >
                            <Wand2 className="w-3 h-3 inline mr-1" />
                            เปิดใช้งาน
                          </button>
                        )}
                      </div>

                      <AnimatePresence>
                        {showAIGenerate && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2"
                          >
                            <div>
                              <label className="block text-gray-700 mb-1 text-xs">
                                หัวข้อที่ต้องการให้ AI เขียน
                              </label>
                              <input
                                type="text"
                                value={aiTopic}
                                onChange={(e) => setAiTopic(e.target.value)}
                                placeholder="เช่น วิธีเติมเพชร Free Fire, ขั้นตอนสั่งซื้อสินค้า"
                                className="w-full py-1.5 px-3 bg-white border-[2px] border-gray-300 text-black text-sm placeholder-gray-500 focus:outline-none focus:border-black"
                              />
                            </div>

                            {/* Model Selector */}
                            <div>
                              <label className="block text-gray-700 mb-1 text-xs">
                                เลือก AI Model
                              </label>
                              <select
                                value={selectedModel}
                                onChange={(e) => {
                                  setSelectedModel(e.target.value);
                                  aiService.setModel(e.target.value);
                                }}
                                disabled={
                                  isLoadingModels ||
                                  availableModels.length === 0
                                }
                                className="w-full py-1.5 px-3 bg-white border-[2px] border-gray-300 text-black text-sm focus:outline-none focus:border-black disabled:opacity-50"
                              >
                                {isLoadingModels ? (
                                  <option value="">กำลังโหลด models...</option>
                                ) : availableModels.length === 0 ? (
                                  <option value="">
                                    ไม่พบ model ที่ใช้ได้
                                  </option>
                                ) : (
                                  availableModels.map((model) => (
                                    <option key={model.id} value={model.id}>
                                      {model.name || model.id}
                                    </option>
                                  ))
                                )}
                              </select>
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  if (
                                    !aiTopic.trim() ||
                                    !articleForm.categoryId
                                  )
                                    return;

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
                                    const result =
                                      await aiService.generateFaqContent(
                                        aiTopic,
                                        categoryName,
                                        (progress) => {
                                          // Optional: show progress in console or UI
                                          console.log(
                                            `[AI] ${progress.stage}: ${progress.message}`,
                                          );
                                        },
                                      );
                                    const aiSlug =
                                      result.slug || slugify(result.title);
                                    // Apply AI output; keep manual flag false so auto slug sticks unless user edits
                                    setSlugEditedManually(false);
                                    setArticleForm((prev) => ({
                                      ...prev,
                                      title: result.title,
                                      content: result.content,
                                      excerpt: result.excerpt,
                                      slug: slugEditedManually
                                        ? prev.slug
                                        : aiSlug,
                                    }));
                                    setError(null);
                                  } catch (err: any) {
                                    setError(
                                      err.message ||
                                      "ไม่สามารถสร้างเนื้อหาด้วย AI ได้",
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
                                className="flex-1 bg-brutal-pink text-white border-[2px] border-black py-1.5 text-sm font-medium flex items-center justify-center disabled:opacity-50 transition-colors"
                                style={{ boxShadow: "2px 2px 0 0 #000000" }}
                              >
                                {isGeneratingAI ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin mr-2" />
                                    กำลังสร้าง...
                                  </>
                                ) : (
                                  <>
                                    <Wand2 className="w-3 h-3 mr-2" />
                                    สร้างบทความ
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAIGenerate(false);
                                  setAiTopic("");
                                }}
                                className="px-2 py-1.5 border-[2px] border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            {isGeneratingAI && (
                              <p className="text-[10px] text-gray-600">
                                AI กำลังสร้างเนื้อหา กรุณารอสักครู่...
                              </p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {!aiService.isConfigured() && showAIGenerate && (
                        <div className="mt-2 p-2 bg-red-50 border-[1px] border-red-300 text-red-700 text-[10px]">
                          กรุณาตั้งค่า NEXT_PUBLIC_LITELLM_API_KEY ในไฟล์ .env
                          ก่อนใช้งาน AI
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-1.5 font-medium text-sm">
                        เนื้อหา *
                      </label>
                      <textarea
                        value={articleForm.content}
                        onChange={(e) =>
                          setArticleForm({
                            ...articleForm,
                            content: e.target.value,
                          })
                        }
                        placeholder="คำตอบโดยละเอียด"
                        required
                        rows={6}
                        className="w-full py-1.5 px-3 bg-white border-[2px] border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:border-black transition-colors resize-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1.5 font-medium text-sm">
                        บทสรุป (excerpt)
                      </label>
                      <textarea
                        value={articleForm.excerpt}
                        onChange={(e) =>
                          setArticleForm({
                            ...articleForm,
                            excerpt: e.target.value,
                          })
                        }
                        placeholder="สรุปสั้น ๆ สำหรับแสดงในรายการ (ไม่บังคับ)"
                        rows={2}
                        className="w-full py-1.5 px-3 bg-white border-[2px] border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:border-black transition-colors resize-none text-sm"
                      />
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={articleForm.isActive}
                          onChange={(e) =>
                            setArticleForm({
                              ...articleForm,
                              isActive: e.target.checked,
                            })
                          }
                          className="mr-2 w-3.5 h-3.5"
                        />
                        <span className="text-gray-700 text-sm">
                          แสดงบทความ
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={articleForm.isPinned}
                          onChange={(e) =>
                            setArticleForm({
                              ...articleForm,
                              isPinned: e.target.checked,
                            })
                          }
                          className="mr-2 w-3.5 h-3.5"
                        />
                        <span className="text-gray-700 text-sm">ปักหมุด</span>
                      </label>
                    </div>
                    <div className="flex gap-2 pt-3">
                      <button
                        type="button"
                        onClick={() => setShowArticleModal(false)}
                        className="flex-1 py-2 px-3 border-[2px] border-black text-black hover:bg-gray-100 transition-colors font-medium text-sm"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        disabled={
                          isSubmitting ||
                          !articleForm.title.trim() ||
                          !articleForm.content.trim() ||
                          !articleForm.categoryId
                        }
                        className="flex-1 py-2 px-3 bg-black text-white border-[2px] border-black disabled:opacity-50 disabled:cursor-not-allowed font-medium hover:bg-gray-800 transition-colors text-sm"
                        style={{ boxShadow: "3px 3px 0 0 #000000" }}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center">
                            <Loader2 size={16} className="animate-spin mr-2" />
                            กำลังบันทึก...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center">
                            <Save size={16} className="mr-2" />
                            บันทึก
                          </span>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </AdminLayout>
  );
}
