"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "@/lib/framer-exports";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Newspaper,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Eye,
  Save,
  Pin,
  Tag,
  Calendar,
  Sparkles,
  Wand2,
} from "lucide-react";
import {
  cmsApi,
  NewsArticle,
  CreateNewsArticleData,
  UpdateNewsArticleData,
  NewsCategory,
} from "@/lib/services";
import { aiService } from "@/lib/services/ai-api";
import type { PerplexicaProvider } from "@/lib/services/ai-api";
import { useAuth } from "@/lib/hooks/use-auth";
import Link from "next/link";
import AINewsProgressPanel from "@/components/admin/AINewsProgressPanel";

// Slugify helper
const slugify = (text: string) => {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

const categories: { value: NewsCategory; label: string; color: string }[] = [
  { value: "general", label: "ทั่วไป", color: "bg-gray-100 text-gray-700" },
  {
    value: "promotion",
    label: "โปรโมชั่น",
    color: "bg-pink-100 text-pink-700",
  },
  { value: "update", label: "อัปเดต", color: "bg-blue-100 text-blue-700" },
  { value: "event", label: "กิจกรรม", color: "bg-yellow-100 text-yellow-700" },
];

export default function AdminCmsNewsPage() {
  const [mounted, setMounted] = useState(false);

  const { isSessionChecked, isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState<CreateNewsArticleData>({
    slug: "",
    title: "",
    excerpt: "",
    content: "",
    coverImage: "",
    category: "general",
    tags: [],
    sources: [],
    isPublished: false,
    isFeatured: false,
  });

  const [tagInput, setTagInput] = useState("");

  // AI Generation states
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  const [aiGeneratedSources, setAiGeneratedSources] = useState<string[]>([]);
  const [aiVariation, setAiVariation] = useState<string>("random");
  const [aiProgress, setAiProgress] = useState<{
    stage: string;
    message: string;
  } | null>(null);

  // Perplexica settings
  const [perplexicaProviders, setPerplexicaProviders] = useState<
    PerplexicaProvider[]
  >([]);
  const [selectedPerplexicaChatModel, setSelectedPerplexicaChatModel] =
    useState<string>("");
  const [
    selectedPerplexicaEmbeddingModel,
    setSelectedPerplexicaEmbeddingModel,
  ] = useState<string>("");
  const [perplexicaOptimizationMode, setPerplexicaOptimizationMode] = useState<
    "speed" | "balanced" | "quality"
  >("balanced");
  const [isLoadingPerplexica, setIsLoadingPerplexica] = useState(false);

  // Fetch Perplexica providers
  useEffect(() => {
    const fetchPerplexicaProviders = async () => {
      setIsLoadingPerplexica(true);
      try {
        const providers = await aiService.getPerplexicaProviders();
        setPerplexicaProviders(providers);

        // Set default models from config
        const config = aiService.getPerplexicaConfig();
        setSelectedPerplexicaChatModel(config.chatModel);
        setSelectedPerplexicaEmbeddingModel(config.embeddingModel);

        console.log(
          "[NewsPage] Perplexica providers loaded:",
          providers.length,
        );
      } catch (error) {
        console.error(
          "[NewsPage] Failed to fetch Perplexica providers:",
          error,
        );
      } finally {
        setIsLoadingPerplexica(false);
      }
    };
    fetchPerplexicaProviders();
  }, []);

  // Get available chat models from all providers
  const availableChatModels = perplexicaProviders.flatMap((p) =>
    p.chatModels.map((m) => ({ ...m, providerName: p.name, providerId: p.id })),
  );

  // Get available embedding models from all providers (sorted: mxbai-embed-large-v1 first)
  const availableEmbeddingModels = perplexicaProviders
    .flatMap((p) =>
      p.embeddingModels.map((m) => ({
        ...m,
        providerName: p.name,
        providerId: p.id,
      })),
    )
    .sort((a, b) => {
      // Prioritize mxbai-embed-large-v1
      if (a.key.includes("mxbai-embed-large-v1")) return -1;
      if (b.key.includes("mxbai-embed-large-v1")) return 1;
      return a.key.localeCompare(b.key);
    });

  const aiStageOrder = [
    "preparing",
    "searching",
    "generating",
    "parsing",
    "completed",
    "error",
  ];
  const aiStageLabels: Record<string, string> = {
    preparing: "เตรียมข้อมูล",
    searching: "ค้นหาข้อมูล",
    generating: "สร้างเนื้อหา",
    parsing: "ประมวลผลผลลัพธ์",
    completed: "เสร็จสมบูรณ์",
    error: "เกิดปัญหา",
  };

  // AI content variations
  const aiVariations = [
    {
      value: "random",
      label: "🎲 สุ่มอัตโนมัติ",
      description: "สุ่มมุมมองข่าวอัตโนมัติ",
    },
    {
      value: "breaking-news",
      label: "📰 ข่าวล่าสุด",
      description: "ข่าวอัปเดตและประกาศใหม่",
    },
    {
      value: "guide",
      label: "📖 คู่มือ/เคล็ดลับ",
      description: "แนะนำวิธีการและเทคนิค",
    },
    {
      value: "analysis",
      label: "🔍 วิเคราะห์",
      description: "วิเคราะห์เชิงลึกและรีวิว",
    },
    {
      value: "event",
      label: "🎉 กิจกรรม/โปรโมชั่น",
      description: "กิจกรรมพิเศษและโปรโมชั่น",
    },
    {
      value: "esports",
      label: "🏆 อีสปอร์ต",
      description: "ข่าวการแข่งขันและทีม",
    },
    {
      value: "community",
      label: "👥 ชุมชน",
      description: "เรื่องราวจากผู้เล่น",
    },
    {
      value: "comparison",
      label: "⚖️ เปรียบเทียบ",
      description: "เปรียบเทียบและจัดอันดับ",
    },
    {
      value: "behind-scenes",
      label: "🎬 เบื้องหลัง",
      description: "เบื้องหลังการพัฒนา",
    },
  ];

  const loadArticles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const category =
        categoryFilter === "ALL" ? undefined : (categoryFilter as NewsCategory);
      const isPublished =
        statusFilter === "ALL" ? undefined : statusFilter === "PUBLISHED";
      const response = await cmsApi.getAllNewsArticles(1, 100, {
        search: searchQuery,
        category,
        isPublished,
      });
      if (response.success) {
        setArticles(response.data);
      }
    } catch (err) {
      setError(cmsApi.getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Wait until auth state is ready to avoid 401 on first load
    if (!isSessionChecked) return;

    if (!isAuthenticated || !isAdmin) {
      setIsLoading(false);
      setError("กรุณาเข้าสู่ระบบแอดมินเพื่อดูข่าว CMS");
      return;
    }

    loadArticles();
  }, [
    searchQuery,
    categoryFilter,
    statusFilter,
    isSessionChecked,
    isAuthenticated,
    isAdmin,
  ]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showModal]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.title.trim() ||
      !formData.content.trim() ||
      !formData.excerpt.trim()
    )
      return;

    setIsSubmitting(true);
    try {
      const data: CreateNewsArticleData = {
        ...formData,
        slug: formData.slug?.trim() || slugify(formData.title),
        // Only include coverImage if it's a valid URL
        ...(formData.coverImage?.trim() &&
        formData.coverImage.startsWith("http")
          ? { coverImage: formData.coverImage.trim() }
          : {}),
      };
      const response = await cmsApi.createNewsArticle(data);
      if (response.success) {
        setShowModal(false);
        resetForm();
        loadArticles();
      }
    } catch (err) {
      setError(cmsApi.getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle || !formData.title?.trim() || !formData.content?.trim())
      return;

    setIsSubmitting(true);
    try {
      const data: UpdateNewsArticleData = {
        slug: formData.slug,
        title: formData.title,
        excerpt: formData.excerpt,
        content: formData.content,
        // Only include coverImage if it's a valid URL
        ...(formData.coverImage?.trim() &&
        formData.coverImage.startsWith("http")
          ? { coverImage: formData.coverImage.trim() }
          : {}),
        category: formData.category,
        tags: formData.tags,
        sources: formData.sources,
        isPublished: formData.isPublished,
        isFeatured: formData.isFeatured,
      };
      const response = await cmsApi.updateNewsArticle(editingArticle.id, data);
      if (response.success) {
        setShowModal(false);
        setEditingArticle(null);
        resetForm();
        loadArticles();
      }
    } catch (err) {
      setError(cmsApi.getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (articleId: string) => {
    try {
      await cmsApi.deleteNewsArticle(articleId);
      setDeleteConfirm(null);
      loadArticles();
    } catch (err) {
      setError(cmsApi.getErrorMessage(err));
    }
  };

  const openCreateModal = () => {
    setEditingArticle(null);
    resetForm();
    setAiTopic("");
    setShowAIGenerate(false);
    setShowModal(true);
  };

  const openEditModal = (article: NewsArticle) => {
    setEditingArticle(article);
    setFormData({
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      coverImage: article.coverImage || "",
      category: article.category as NewsCategory,
      tags: article.tags,
      sources: article.sources || [],
      isPublished: article.isPublished,
      isFeatured: article.isFeatured,
    });
    setAiTopic("");
    setShowAIGenerate(false);
    setAiGeneratedSources(article.sources || []);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      slug: "",
      title: "",
      excerpt: "",
      content: "",
      coverImage: "",
      category: "general",
      tags: [],
      sources: [],
      isPublished: false,
      isFeatured: false,
    });
    setTagInput("");
    setAiTopic("");
    setShowAIGenerate(false);
    setAiGeneratedSources([]);
    setAiVariation("random");
    setAiProgress(null);
  };

  const handleGenerateAIContent = async () => {
    const startTime = Date.now();
    if (!aiTopic.trim()) return;

    setIsGeneratingAI(true);
    setError(null);
    setAiProgress({
      stage: "preparing",
      message: "กำลังเริ่มต้นการสร้างเนื้อหา...",
    });

    console.log("[Generate AI Page] ========== GENERATION START ==========");
    console.log("[Generate AI Page] Topic:", aiTopic);
    console.log("[Generate AI Page] Category:", formData.category);
    console.log("[Generate AI Page] Variation:", aiVariation);
    console.log("[Generate AI Page] Chat Model:", selectedPerplexicaChatModel);
    console.log("[Generate AI Page] Embedding Model:", selectedPerplexicaEmbeddingModel);
    console.log("[Generate AI Page] Optimization Mode:", perplexicaOptimizationMode);

    try {
      const categoryLabel =
        categories.find((cat) => cat.value === formData.category)?.label ||
        "ทั่วไป";

      // Get existing article slugs to prevent duplicates
      const existingSlugs = articles.map((article) => article.slug);

      console.log("[Generate AI Page] Existing slugs count:", existingSlugs.length);
      console.log("[Generate AI Page] Calling aiService.generateNewsContent...");

      const result = await aiService.generateNewsContent(
        aiTopic,
        categoryLabel,
        (progress) => {
          console.log(`[Generate AI Page] Progress: ${progress.stage} - ${progress.message}`);
          setAiProgress({
            stage: progress.stage,
            message: progress.message,
          });
        },
        existingSlugs,
        aiVariation !== "random" ? aiVariation : undefined,
        perplexicaOptimizationMode,
      );

      const elapsed = Date.now() - startTime;
      console.log(`[Generate AI Page] ========== GENERATION SUCCESS (${elapsed}ms) ==========`);
      console.log("[Generate AI Page] Result:", {
        title: result.title,
        slug: result.slug,
        contentLength: result.content?.length,
        sourcesCount: result.sources?.length || 0,
        tagsCount: result.tags?.length || 0,
      });

      // Ensure unique slug
      let aiSlug = result.slug || slugify(result.title);
      let counter = 1;
      const baseSlug = aiSlug;

      // Keep modifying slug until it's unique
      while (existingSlugs.includes(aiSlug)) {
        aiSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      setFormData((prev) => ({
        ...prev,
        title: result.title,
        content: result.content,
        excerpt: result.excerpt,
        slug: !editingArticle && !prev.slug?.trim() ? aiSlug : prev.slug,
        tags: result.tags && result.tags.length > 0 ? result.tags : prev.tags,
        coverImage: result.coverImage || "",
        sources:
          result.sources && result.sources.length > 0
            ? result.sources
            : prev.sources,
      }));

      // Store sources in state for display
      setAiGeneratedSources(result.sources || []);
      setError(null);
      setAiProgress({ stage: "completed", message: "สร้างเสร็จสมบูรณ์!" });
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      console.error(`[Generate AI Page] ========== GENERATION FAILED (${elapsed}ms) ==========`);
      console.error("[Generate AI Page] Error details:", {
        message: err?.message,
        code: err?.code,
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        data: err?.response?.data,
        stack: err?.stack,
      });
      setError(cmsApi.getErrorMessage(err));
      setAiProgress({
        stage: "error",
        message: cmsApi.getErrorMessage(err),
      });
    } finally {
      console.log("[Generate AI Page] Generation finished, isGeneratingAI = false");
      setIsGeneratingAI(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((tag) => tag !== tagToRemove) || [],
    });
  };

  const getCategoryLabel = (value: string) => {
    return categories.find((c) => c.value === value) || categories[0];
  };

  return (
    <AdminLayout title="จัดการข่าวสาร">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="w-1.5 h-4 bg-brutal-yellow mr-2"></span>
            <h1 className="text-lg font-bold text-black">จัดการข่าวสาร</h1>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-black text-white border-[2px] border-black px-2.5 py-1 font-medium flex items-center hover:bg-gray-800 transition-colors"
            style={{ boxShadow: "2px 2px 0 0 #000000" }}
          >
            <Plus size={14} className="mr-1.5" />
            <span className="text-xs">เพิ่มข่าวใหม่</span>
          </button>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-100 border-[2px] border-red-500 p-2.5 flex items-center"
              style={{ boxShadow: "2px 2px 0 0 #000000" }}
            >
              <AlertCircle className="text-red-600 mr-2" size={16} />
              <span className="text-red-700 text-xs">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-700"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-2.5"
        >
          {[
            {
              label: "ข่าวทั้งหมด",
              value: articles.length,
              color: "bg-blue-100 text-blue-700 border-blue-500",
            },
            {
              label: "เผยแพร่แล้ว",
              value: articles.filter((a) => a.isPublished).length,
              color: "bg-green-100 text-green-700 border-green-500",
            },
            {
              label: "ข่าวเด่น",
              value: articles.filter((a) => a.isFeatured).length,
              color: "bg-yellow-100 text-yellow-700 border-yellow-500",
            },
            {
              label: "ยอดเข้าชมรวม",
              value: articles
                .reduce((sum, a) => sum + a.viewCount, 0)
                .toLocaleString(),
              color: "bg-purple-100 text-purple-700 border-purple-500",
            },
          ].map((stat, index) => (
            <div
              key={index}
              className={`p-2.5 text-center border-[2px] ${stat.color}`}
              style={{ boxShadow: "2px 2px 0 0 #000000" }}
            >
              <div className="text-lg font-bold">{stat.value}</div>
              <div className="text-[10px] mt-0.5 font-medium">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border-[2px] border-black p-2.5"
          style={{ boxShadow: "2px 2px 0 0 #000000" }}
        >
          <div className="flex flex-wrap gap-2.5">
            <div className="relative flex-1 min-w-[180px]">
              <Search
                className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={12}
              />
              <input
                type="text"
                placeholder="ค้นหาข่าว..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-1 pl-8 pr-3 bg-white border-[2px] border-gray-300 text-black text-xs placeholder-gray-400 focus:outline-none focus:border-black"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-1 px-2.5 bg-white border-[2px] border-gray-300 text-black text-xs focus:outline-none focus:border-black"
            >
              <option value="ALL">ทุกหมวดหมู่</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1 px-2.5 bg-white border-[2px] border-gray-300 text-black text-xs focus:outline-none focus:border-black"
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="PUBLISHED">เผยแพร่แล้ว</option>
              <option value="DRAFT">ฉบับร่าง</option>
            </select>
            <button
              onClick={loadArticles}
              disabled={isLoading}
              className="py-1 px-2.5 bg-gray-100 hover:bg-gray-200 border-[2px] border-gray-300 text-black text-xs flex items-center transition-colors disabled:opacity-50"
            >
              <RefreshCw
                size={12}
                className={`mr-1.5 ${isLoading ? "animate-spin" : ""}`}
              />
              รีเฟรช
            </button>
          </div>
        </motion.div>

        {/* Articles List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border-[2px] border-black overflow-hidden"
          style={{ boxShadow: "2px 2px 0 0 #000000" }}
        >
          <div className="p-2.5 border-b-[2px] border-black bg-gray-50">
            <h2 className="text-sm font-bold text-black flex items-center">
              <Newspaper size={16} className="mr-2" />
              รายการข่าว ({articles.length})
            </h2>
          </div>

          <div className="divide-y-[2px] divide-gray-200">
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2
                  className="animate-spin mx-auto text-black mb-2"
                  size={28}
                />
                <p className="text-gray-600 text-xs">กำลังโหลด...</p>
              </div>
            ) : articles.length === 0 ? (
              <div className="p-8 text-center">
                <Newspaper size={28} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-600 text-xs">ไม่พบข่าว</p>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setCategoryFilter("ALL");
                      setStatusFilter("ALL");
                    }}
                    className="text-brutal-blue hover:underline mt-1.5 text-xs"
                  >
                    ล้างตัวกรอง
                  </button>
                )}
              </div>
            ) : (
              articles.map((article) => {
                const category = getCategoryLabel(article.category);
                return (
                  <div
                    key={article.id}
                    className="p-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Cover Image */}
                      <div className="w-16 h-16 bg-gray-100 border-[2px] border-gray-300 flex-shrink-0 overflow-hidden">
                        {article.coverImage ? (
                          <img
                            src={article.coverImage}
                            alt={article.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Newspaper size={16} />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          {article.isPublished ? (
                            <span className="inline-flex items-center px-1 py-0.5 bg-green-100 text-green-700 text-[9px] font-medium border border-green-500">
                              <CheckCircle size={8} className="mr-1" />
                              เผยแพร่
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1 py-0.5 bg-gray-100 text-gray-600 text-[9px] font-medium border border-gray-400">
                              ฉบับร่าง
                            </span>
                          )}
                          {article.isFeatured && (
                            <span className="inline-flex items-center px-1 py-0.5 bg-yellow-100 text-yellow-700 text-[9px] font-medium border border-yellow-500">
                              <Pin size={8} className="mr-1" />
                              เด่น
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center px-1 py-0.5 text-[9px] font-medium border ${category.color}`}
                          >
                            {category.label}
                          </span>
                        </div>

                        <h3 className="font-bold text-black mb-0.5 truncate text-xs">
                          {article.title}
                        </h3>
                        <p className="text-[10px] text-gray-600 line-clamp-2 mb-1">
                          {article.excerpt}
                        </p>

                        <div className="flex items-center gap-2.5 text-[9px] text-gray-500">
                          <span className="flex items-center">
                            <Eye size={9} className="mr-1" />
                            {article.viewCount.toLocaleString()} views
                          </span>
                          <span className="flex items-center">
                            <Calendar size={9} className="mr-1" />
                            {article.publishedAt
                              ? new Date(
                                  article.publishedAt,
                                ).toLocaleDateString("th-TH")
                              : new Date(article.createdAt).toLocaleDateString(
                                  "th-TH",
                                )}
                          </span>
                          {article.tags.length > 0 && (
                            <span className="flex items-center">
                              <Tag size={9} className="mr-1" />
                              {article.tags.join(", ")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {article.isPublished && (
                          <Link
                            href={`/news/${article.slug}`}
                            target="_blank"
                            className="p-1 text-gray-600 hover:text-black hover:bg-gray-200 transition-colors"
                            title="ดูหน้าเว็บ"
                          >
                            <Eye size={14} />
                          </Link>
                        )}
                        <button
                          onClick={() => openEditModal(article)}
                          className="p-1 text-gray-600 hover:text-black hover:bg-gray-200 transition-colors"
                          title="แก้ไข"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(article.id)}
                          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                          title="ลบ"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Delete Confirmation */}
                    <AnimatePresence>
                      {deleteConfirm === article.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2.5 p-2 bg-red-50 border-[2px] border-red-300"
                        >
                          <p className="text-xs text-red-700 mb-2">
                            คุณแน่ใจหรือไม่ว่าต้องการลบข่าวนี้?
                          </p>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1 text-xs border-[2px] border-gray-300 text-gray-700 hover:bg-gray-100"
                            >
                              ยกเลิก
                            </button>
                            <button
                              onClick={() => handleDelete(article.id)}
                              className="px-2 py-1 text-xs bg-red-600 text-white border-[2px] border-red-600 hover:bg-red-700"
                            >
                              ยืนยันการลบ
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>

      {/* Modal */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {showModal && (
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
                  className="bg-white border-[3px] border-black w-full max-w-3xl max-h-[90vh] flex flex-col"
                  style={{ boxShadow: "6px 6px 0 0 #000000" }}
                >
                  {/* Sticky Header */}
                  <div className="sticky top-0 z-10 p-4 border-b-[3px] border-black bg-white">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-black">
                        {editingArticle ? "แก้ไขข่าว" : "เพิ่มข่าวใหม่"}
                      </h2>
                      <button
                        onClick={() => {
                          setShowModal(false);
                          setEditingArticle(null);
                          resetForm();
                        }}
                        className="text-gray-600 hover:text-black p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Content */}
                  <div className="overflow-y-auto flex-1">
                    <form
                      onSubmit={editingArticle ? handleUpdate : handleCreate}
                      className="p-4 space-y-3"
                    >
                    {/* Slug */}
                    <div>
                      <label className="block text-gray-700 mb-1.5 font-medium text-sm">
                        URL Slug *{" "}
                        {editingArticle && (
                          <span className="text-amber-600 text-[10px]">
                            (ระวัง: การแก้ไขจะทำให้ลิงก์เดิมใช้ไม่ได้)
                          </span>
                        )}
                      </label>
                      <div className="flex items-center">
                        <span className="px-3 py-1.5 bg-gray-100 border-[2px] border-r-0 border-gray-300 text-gray-500 text-sm">
                          /news/
                        </span>
                        <input
                          type="text"
                          value={formData.slug}
                          onChange={(e) =>
                            setFormData({ ...formData, slug: e.target.value })
                          }
                          placeholder="article-slug"
                          required
                          className="flex-1 py-1.5 px-3 bg-white border-[2px] border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:border-black transition-colors text-sm"
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">
                        {editingArticle
                          ? "คำเตือน: หากแก้ไข slug ลิงก์เดิมจะใช้งานไม่ได้ ควรตั้งค่า redirect หากจำเป็น"
                          : "จะสร้างอัตโนมัติจากชื่อถ้าไม่กรอก (ใช้ตัวพิมพ์เล็กและขีดกลางเท่านั้น)"}
                      </p>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-gray-700 mb-1.5 font-medium text-sm">
                        หัวข้อข่าว *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder="หัวข้อข่าว"
                        required
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
                            className="text-xs bg-brutal-pink text-white px-2 py-1 border-[2px] border-black hover:bg-brutal-pink/80 transition-colors"
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
                                placeholder="เช่น อัปเดตระบบใหม่, โปรโมชันประจำเดือน"
                                className="w-full py-1.5 px-3 bg-white border-[2px] border-gray-300 text-black text-sm placeholder-gray-500 focus:outline-none focus:border-black"
                              />
                              <p className="text-[10px] text-gray-500 mt-1">
                                AI จะค้นหาข้อมูลจาก Perplexica
                                และสร้างเนื้อหาข่าว
                              </p>
                            </div>

                            {/* Variation Selector */}
                            <div>
                              <label className="block text-gray-700 mb-1 text-xs">
                                มุมมองข่าว (เลือกเพื่อกันซ้ำ)
                              </label>
                              <select
                                value={aiVariation}
                                onChange={(e) => setAiVariation(e.target.value)}
                                className="w-full py-1.5 px-3 bg-white border-[2px] border-gray-300 text-black text-sm focus:outline-none focus:border-black"
                              >
                                {aiVariations.map((variation) => (
                                  <option
                                    key={variation.value}
                                    value={variation.value}
                                  >
                                    {variation.label} - {variation.description}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Perplexica Chat Model Selector */}
                            <div>
                              <label className="block text-gray-700 mb-1 text-xs">
                                🤖 Perplexica Chat Model
                              </label>
                              <select
                                value={selectedPerplexicaChatModel}
                                onChange={(e) => {
                                  setSelectedPerplexicaChatModel(
                                    e.target.value,
                                  );
                                  aiService.setPerplexicaChatModel(
                                    e.target.value,
                                  );
                                }}
                                disabled={
                                  isLoadingPerplexica ||
                                  availableChatModels.length === 0
                                }
                                className="w-full py-1.5 px-3 bg-white border-[2px] border-gray-300 text-black text-sm focus:outline-none focus:border-black disabled:opacity-50"
                              >
                                {isLoadingPerplexica ? (
                                  <option value="">กำลังโหลด...</option>
                                ) : availableChatModels.length === 0 ? (
                                  <option value="">ไม่พบ model</option>
                                ) : (
                                  availableChatModels.map((model) => (
                                    <option key={model.key} value={model.key}>
                                      {model.name} ({model.providerName})
                                    </option>
                                  ))
                                )}
                              </select>
                            </div>

                            {/* Perplexica Embedding Model Selector */}
                            <div>
                              <label className="block text-gray-700 mb-1 text-xs">
                                🔍 Perplexica Embedding Model
                              </label>
                              <select
                                value={selectedPerplexicaEmbeddingModel}
                                onChange={(e) => {
                                  setSelectedPerplexicaEmbeddingModel(
                                    e.target.value,
                                  );
                                  aiService.setPerplexicaEmbeddingModel(
                                    e.target.value,
                                  );
                                }}
                                disabled={
                                  isLoadingPerplexica ||
                                  availableEmbeddingModels.length === 0
                                }
                                className="w-full py-1.5 px-3 bg-white border-[2px] border-gray-300 text-black text-sm focus:outline-none focus:border-black disabled:opacity-50"
                              >
                                {isLoadingPerplexica ? (
                                  <option value="">กำลังโหลด...</option>
                                ) : availableEmbeddingModels.length === 0 ? (
                                  <option value="">ไม่พบ model</option>
                                ) : (
                                  availableEmbeddingModels.map((model) => (
                                    <option key={model.key} value={model.key}>
                                      {model.name} ({model.providerName})
                                    </option>
                                  ))
                                )}
                              </select>
                            </div>

                            {/* Optimization Mode Selector */}
                            <div>
                              <label className="block text-gray-700 mb-1 text-xs">
                                ⚡ Optimization Mode
                              </label>
                              <select
                                value={perplexicaOptimizationMode}
                                onChange={(e) =>
                                  setPerplexicaOptimizationMode(
                                    e.target.value as
                                      | "speed"
                                      | "balanced"
                                      | "quality",
                                  )
                                }
                                className="w-full py-1.5 px-3 bg-white border-[2px] border-gray-300 text-black text-sm focus:outline-none focus:border-black"
                              >
                                <option value="speed">
                                  Speed (เร็วที่สุด)
                                </option>
                                <option value="balanced">
                                  Balanced (สมดุล)
                                </option>
                                <option value="quality">
                                  Quality (คุณภาพสูงสุด)
                                </option>
                              </select>
                              <p className="text-[10px] text-gray-500 mt-1">
                                Speed: เร็วแต่อาจขาดรายละเอียด | Quality:
                                ละเอียดแต่ช้า
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={handleGenerateAIContent}
                                disabled={isGeneratingAI || !aiTopic.trim()}
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
                                    สร้างเนื้อหา
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAIGenerate(false);
                                  setAiTopic("");
                                  setAiProgress(null);
                                }}
                                className="px-2 py-1.5 border-[2px] border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            {aiProgress && (
                              <div className="mt-3">
                                <AINewsProgressPanel
                                  progress={aiProgress}
                                  isGenerating={isGeneratingAI}
                                  error={error}
                                  onClose={() => {
                                    if (!isGeneratingAI) {
                                      setAiProgress(null);
                                    }
                                  }}
                                />
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {!aiService.isConfigured() && showAIGenerate && (
                        <div className="mt-3 p-2 bg-red-50 border-[1px] border-red-300 text-red-700 text-xs">
                          กรุณาตั้งค่า NEXT_PUBLIC_LITELLM_API_KEY ในไฟล์ .env
                          ก่อนใช้งาน AI
                        </div>
                      )}
                    </div>

                    {/* Category & Cover */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 mb-2 font-medium">
                          หมวดหมู่ *
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              category: e.target.value as NewsCategory,
                            })
                          }
                          className="w-full py-2.5 px-4 bg-white border-[2px] border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
                        >
                          {categories.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2 font-medium">
                          รูปปก (URL){" "}
                          {showAIGenerate && (
                            <span className="text-brutal-pink text-xs">
                              (AI จะค้นหารูปให้อัตโนมัติ)
                            </span>
                          )}
                        </label>
                        <input
                          type="url"
                          value={formData.coverImage}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              coverImage: e.target.value,
                            })
                          }
                          placeholder="https://example.com/image.jpg"
                          className="w-full py-2.5 px-4 bg-white border-[2px] border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:border-black transition-colors"
                        />
                        {formData.coverImage && (
                          <div className="mt-2">
                            <img
                              src={formData.coverImage}
                              alt="Preview"
                              className="h-20 w-auto object-cover border border-gray-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Excerpt */}
                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">
                        บทสรุป (Excerpt) *
                      </label>
                      <textarea
                        value={formData.excerpt}
                        onChange={(e) =>
                          setFormData({ ...formData, excerpt: e.target.value })
                        }
                        placeholder="สรุปเนื้อหาสั้นๆ (แสดงในรายการ)"
                        required
                        rows={2}
                        className="w-full py-2.5 px-4 bg-white border-[2px] border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:border-black transition-colors resize-none"
                      />
                    </div>

                    {/* Content */}
                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">
                        เนื้อหา *
                      </label>
                      <textarea
                        value={formData.content}
                        onChange={(e) =>
                          setFormData({ ...formData, content: e.target.value })
                        }
                        placeholder="เนื้อหาข่าวฉบับเต็ม (รองรับ HTML)"
                        required
                        rows={10}
                        className="w-full py-2.5 px-4 bg-white border-[2px] border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:border-black transition-colors resize-none font-mono text-sm"
                      />
                    </div>

                    {/* AI Generated Sources Preview */}
                    {aiGeneratedSources.length > 0 && (
                      <div className="bg-green-50 border-[2px] border-green-200 p-4 rounded">
                        <h4 className="font-medium text-green-800 mb-2">
                          ✓ AI ค้นพบข้อมูลเพิ่มเติม
                        </h4>
                        {aiGeneratedSources.length > 0 && (
                          <div>
                            <p className="text-sm text-green-700 mb-1">
                              แหล่งข่าว:
                            </p>
                            <ul className="text-sm space-y-1">
                              {aiGeneratedSources.map((source, idx) => (
                                <li key={idx}>
                                  <a
                                    href={source}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    {new URL(source).hostname}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tags */}
                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">
                        แท็ก{" "}
                        {showAIGenerate && (
                          <span className="text-brutal-pink text-xs">
                            (AI จะค้นหาและสร้างให้อัตโนมัติ)
                          </span>
                        )}
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addTag();
                            }
                          }}
                          placeholder="เพิ่มแท็กแล้วกด Enter"
                          className="flex-1 py-2 px-4 bg-white border-[2px] border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:border-black"
                        />
                        <button
                          type="button"
                          onClick={addTag}
                          className="px-4 py-2 border-[2px] border-black bg-gray-100 hover:bg-gray-200"
                        >
                          เพิ่ม
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.tags?.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 bg-brutal-blue/10 text-brutal-blue text-sm border border-brutal-blue/30"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1 hover:text-red-600"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Sources */}
                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">
                        แหล่งข่าว (Sources){" "}
                        {showAIGenerate && (
                          <span className="text-brutal-pink text-xs">
                            (AI จะค้นหาแหล่งข่าวให้อัตโนมัติ)
                          </span>
                        )}
                      </label>
                      <div className="space-y-2">
                        {formData.sources?.map((source, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="url"
                              value={source}
                              onChange={(e) => {
                                const newSources = [
                                  ...(formData.sources || []),
                                ];
                                newSources[index] = e.target.value;
                                setFormData({
                                  ...formData,
                                  sources: newSources,
                                });
                              }}
                              placeholder="https://example.com/news"
                              className="flex-1 py-2 px-4 bg-white border-[2px] border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:border-black"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newSources =
                                  formData.sources?.filter(
                                    (_, i) => i !== index,
                                  ) || [];
                                setFormData({
                                  ...formData,
                                  sources: newSources,
                                });
                              }}
                              className="px-3 py-2 border-[2px] border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              sources: [...(formData.sources || []), ""],
                            });
                          }}
                          className="w-full py-2 px-4 border-[2px] border-dashed border-gray-300 text-gray-600 hover:border-black hover:text-black transition-colors"
                        >
                          + เพิ่มแหล่งข่าว
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        แหล่งข่าวจะแสดงในหน้าข่าวเพื่อความน่าเชื่อถือ
                      </p>
                    </div>

                    {/* Options */}
                    <div className="flex flex-wrap gap-6">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isPublished}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              isPublished: e.target.checked,
                            })
                          }
                          className="w-5 h-5 mr-2"
                        />
                        <span className="text-gray-700">เผยแพร่</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isFeatured}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              isFeatured: e.target.checked,
                            })
                          }
                          className="w-5 h-5 mr-2"
                        />
                        <span className="text-gray-700">
                          ข่าวเด่น (Featured)
                        </span>
                      </label>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t-[2px] border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setShowModal(false);
                          setEditingArticle(null);
                          resetForm();
                        }}
                        className="flex-1 py-2.5 px-4 border-[3px] border-black text-black hover:bg-gray-100 transition-colors font-medium"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        disabled={
                          isSubmitting ||
                          !formData.title?.trim() ||
                          !formData.content?.trim() ||
                          !formData.excerpt?.trim()
                        }
                        className="flex-1 py-2.5 px-4 bg-black text-white border-[3px] border-black disabled:opacity-50 disabled:cursor-not-allowed font-medium hover:bg-gray-800 transition-colors"
                        style={{ boxShadow: "4px 4px 0 0 #000000" }}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center">
                            <Loader2 size={18} className="animate-spin mr-2" />
                            กำลังบันทึก...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center">
                            <Save size={18} className="mr-2" />
                            บันทึก
                          </span>
                        )}
                      </button>
                    </div>
                  </form>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </AdminLayout>
  );
}
