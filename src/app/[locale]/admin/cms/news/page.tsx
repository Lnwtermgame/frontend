"use client";

import { useState, useEffect, useRef } from "react";
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
  ImagePlus,
} from "lucide-react";
import {
  cmsApi,
  NewsArticle,
  CreateNewsArticleData,
  UpdateNewsArticleData,
  NewsCategory,
} from "@/lib/services";
import { aiService } from "@/lib/services/ai-api";
import type { DDGImageResult } from "@/lib/services/ai-api";
import type { AIModel } from "@/lib/services/ai-api";
import { useAuth } from "@/lib/hooks/use-auth";
import Link from "next/link";
import AINewsProgressPanel from "@/components/admin/AINewsProgressPanel";
import MediaPickerPanel from "@/components/admin/MediaPickerPanel";
import { useTranslations } from "next-intl";

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

export default function AdminCmsNewsPage() {
  const t = useTranslations("AdminPage");
  const [mounted, setMounted] = useState(false);

  const { isSessionChecked, isAuthenticated, isAdmin } = useAuth();

  // Category options with translations
  const categories: { value: NewsCategory; label: string; color: string }[] = [
    { value: "general", label: t("cms_news.categories.general"), color: "bg-site-raised text-gray-300" },
    { value: "promotion", label: t("cms_news.categories.promotion"), color: "bg-site-accent/10 text-site-accent" },
    { value: "update", label: t("cms_news.categories.update"), color: "bg-site-surface0/10 text-site-accent" },
    { value: "event", label: t("cms_news.categories.event"), color: "bg-yellow-500/10 text-yellow-400" },
  ];

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
  const [newsProvider, setNewsProvider] = useState<"thenewsapi" | "newsapi">("thenewsapi");

  const [aiProgress, setAiProgress] = useState<{
    stage: string;
    message: string;
  } | null>(null);

  // Media picker states
  const [mediaImages, setMediaImages] = useState<DDGImageResult[]>([]);
  const [mediaVideos, setMediaVideos] = useState<
    { videoId: string; title: string; url: string }[]
  >([]);
  const [isSearchingMedia, setIsSearchingMedia] = useState(false);
  const [mediaSearchQuery, setMediaSearchQuery] = useState("");

  // Content textarea ref for cursor position tracking
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);

  // LiteLLM model selector
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Fetch available LiteLLM models
  useEffect(() => {
    const loadModels = async () => {
      setIsLoadingModels(true);
      try {
        const models = await aiService.fetchModels();
        setAvailableModels(models);
        const currentModel = aiService.getSelectedModel();
        if (currentModel) {
          setSelectedModel(currentModel);
        } else if (models.length > 0) {
          setSelectedModel(models[0].id);
          aiService.setModel(models[0].id);
        }
        console.log("[NewsPage] LiteLLM models loaded:", models.length);
      } catch (error) {
        console.error("[NewsPage] Failed to fetch LiteLLM models:", error);
      } finally {
        setIsLoadingModels(false);
      }
    };
    loadModels();
  }, []);



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

  // AI content variations - ตัวเลือกแนวข่าวที่ต้องการค้นหา
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
    setMediaImages([]);
    setMediaVideos([]);
    setMediaSearchQuery("");
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

    try {
      const categoryLabel =
        categories.find((cat) => cat.value === formData.category)?.label ||
        "ทั่วไป";

      // Get existing article slugs to prevent duplicates
      const existingSlugs = articles.map((article) => article.slug);

      // Get variation description for LiteLLM writing style
      const variationDesc = aiVariation !== "random"
        ? aiVariations.find(v => v.value === aiVariation)?.description || ""
        : "";

      console.log("[Generate AI Page] Search topic:", aiTopic);
      console.log("[Generate AI Page] Variation:", variationDesc || "(random)");
      console.log("[Generate AI Page] Calling aiService.generateNewsContent...");

      const result = await aiService.generateNewsContent(
        aiTopic,
        categoryLabel,
        variationDesc,
        (progress) => {
          console.log(`[Generate AI Page] Progress: ${progress.stage} - ${progress.message}`);
          setAiProgress({
            stage: progress.stage,
            message: progress.message,
          });
        },
        existingSlugs,
        newsProvider,
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

      // Automatically trigger media search using the generated title for better relevance
      handleSearchMedia(result.title || aiTopic);
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

  // Media search handler
  const handleSearchMedia = async (query?: string) => {
    const searchTopic = query || mediaSearchQuery;
    if (!searchTopic.trim()) return;

    setIsSearchingMedia(true);
    setMediaSearchQuery(searchTopic);
    try {
      const result = await aiService.searchMediaForNews(searchTopic);
      setMediaImages(result.images);
      setMediaVideos(result.videos);
    } catch (err) {
      console.error("[Media Search] Failed:", err);
    } finally {
      setIsSearchingMedia(false);
    }
  };

  // Media insert handlers
  const handleSetCoverImage = (url: string) => {
    setFormData((prev) => ({ ...prev, coverImage: url }));
  };

  const handleInsertImageToContent = (url: string, alt: string) => {
    const imageMarkdown = `\n\n![${alt.replace(/[\[\]]/g, "")}](${url})\n`;
    const content = formData.content || "";
    const pos = cursorPosition ?? content.length;
    const newContent = content.slice(0, pos) + imageMarkdown + content.slice(pos);
    setFormData((prev) => ({ ...prev, content: newContent }));
    // Move cursor after inserted text
    const newPos = pos + imageMarkdown.length;
    setCursorPosition(newPos);
    // Restore cursor in textarea
    setTimeout(() => {
      if (contentTextareaRef.current) {
        contentTextareaRef.current.focus();
        contentTextareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 50);
  };

  const handleInsertVideoToContent = (videoId: string, title: string) => {
    const videoEmbed = `\n\n<div class="video-embed" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;border-radius:12px;"><iframe src="https://www.youtube.com/embed/${videoId}" title="${title.replace(/"/g, "&quot;")}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe></div>\n`;
    const content = formData.content || "";
    const pos = cursorPosition ?? content.length;
    const newContent = content.slice(0, pos) + videoEmbed + content.slice(pos);
    setFormData((prev) => ({ ...prev, content: newContent }));
    // Move cursor after inserted text
    const newPos = pos + videoEmbed.length;
    setCursorPosition(newPos);
    setTimeout(() => {
      if (contentTextareaRef.current) {
        contentTextareaRef.current.focus();
        contentTextareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 50);
  };

  return (
    <AdminLayout title={"จัดการข่าวสาร" as any}>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-wide flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-site-accent/20 to-site-accent/20 rounded-xl border border-white/5">
                <Newspaper className="h-6 w-6 text-site-accent" />
              </div>
              จัดการข่าวสาร
            </h1>
            <p className="text-gray-400 text-sm mt-1 ml-14">จัดการบทความ ข้อมูล และข่าวสารทั้งหมด</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openCreateModal}
              className="bg-gradient-to-r from-site-accent to-site-accent/80 hover:from-site-accent hover:to-site-accent/60 text-white rounded-xl shadow-lg hover:shadow-accent-glow flex items-center gap-2 px-5 py-2.5 transition-all font-bold text-sm">
              <Plus className="h-4 w-4" />
              <span>เพิ่มข่าวใหม่</span>
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
              className="bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 px-4 py-3 text-sm flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="font-medium flex-1">{error}</span>
              <button
                onClick={() => setError(null)}
                className="p-1 hover:bg-rose-500/20 rounded-lg transition-colors text-rose-400/70 hover:text-rose-400"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            {
              label: "ข่าวทั้งหมด",
              value: articles.length,
              icon: Newspaper,
              color: "text-site-accent",
              bg: "bg-site-accent/10",
              border: "border-site-accent/20",
            },
            {
              label: "เผยแพร่แล้ว",
              value: articles.filter((a) => a.isPublished).length,
              icon: CheckCircle,
              color: "text-site-accent",
              bg: "bg-site-accent/10",
              border: "border-site-accent/20",
            },
            {
              label: "ข่าวเด่น",
              value: articles.filter((a) => a.isFeatured).length,
              icon: Sparkles,
              color: "text-site-accent",
              bg: "bg-site-accent/10",
              border: "border-site-accent/20",
            },
            {
              label: "ยอดเข้าชมรวม",
              value: articles
                .reduce((sum, a) => sum + (a.viewCount || 0), 0)
                .toLocaleString(),
              icon: Eye,
              color: "text-site-accent",
              bg: "bg-site-accent/10",
              border: "border-site-accent/20",
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-site-raised border border-white/5 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.border} border shrink-0 relative z-10`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="relative z-10 min-w-0">
                <p className="text-gray-400 text-sm font-medium mb-1 truncate">{stat.label}</p>
                <div className="text-2xl font-black text-white tracking-tight">
                  {stat.value}
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-site-raised border border-white/5 rounded-2xl p-2 gap-2 flex flex-col md:flex-row md:items-center justify-between"
        >
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อข่าว..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-site-surface border-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-site-accent/50 outline-none transition-all placeholder-gray-600"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-site-surface border border-white/5 rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:ring-2 focus:ring-site-accent/50 outline-none hover:border-white/10 transition-colors cursor-pointer appearance-none min-w-[140px]"
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
              className="bg-site-surface border border-white/5 rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:ring-2 focus:ring-site-accent/50 outline-none hover:border-white/10 transition-colors cursor-pointer appearance-none min-w-[140px]"
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="PUBLISHED">เผยแพร่แล้ว</option>
              <option value="DRAFT">ฉบับร่าง</option>
            </select>
            <button
              onClick={loadArticles}
              disabled={isLoading}
              className="p-2.5 bg-site-raised border border-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-[#2a2d35] transition-all flex items-center gap-2 group shrink-0"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
            </button>
          </div>
        </motion.div>

        {/* Articles List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-site-raised border border-white/5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden"
        >
          <div className="p-5 border-b border-white/5 bg-site-surface/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-site-raised rounded-xl border border-white/5">
                <Newspaper className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <h3 className="text-[15px] font-black text-white tracking-wide">
                  รายการข่าวทั้งหมด
                </h3>
                <p className="text-[12px] text-gray-400 font-medium">
                  {articles.length} รายการ
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-white/5 min-h-[300px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 text-site-accent animate-spin" />
                <p className="text-gray-400 text-sm font-medium">กำลังโหลดข้อมูล...</p>
              </div>
            ) : articles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-site-raised rounded-full flex items-center justify-center mb-4 border border-white/5 shadow-inner">
                  <Newspaper className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-[16px] font-black text-white mb-2">ไม่พบข่าวสาร</h3>
                <p className="text-gray-400 text-[14px] max-w-sm mb-6">
                  คุณสามารถเพิ่มข่าวใหม่ได้เลย หรือลองเปลี่ยนเงื่อนไขการค้นหา
                </p>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setCategoryFilter("ALL");
                      setStatusFilter("ALL");
                    }}
                    className="text-site-accent hover:text-blue-300 transition-colors font-medium text-sm flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
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
                    className="p-5 hover:bg-site-raised/50 transition-colors group"
                  >
                    <div className="flex items-start gap-5">
                      {/* Cover Image */}
                      <div className="w-24 h-24 bg-site-surface border border-white/5 rounded-xl flex-shrink-0 overflow-hidden relative">
                        {article.coverImage ? (
                          <img
                            src={article.coverImage}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-site-raised">
                            <Newspaper size={24} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[6rem]">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {article.isPublished ? (
                            <span className="inline-flex items-center px-2 py-0.5 bg-site-accent/10 text-site-accent text-[11px] font-black border border-site-accent/20 rounded-md">
                              <CheckCircle size={10} className="mr-1" />
                              เผยแพร่
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 bg-site-raised text-gray-400 text-[11px] font-black border border-white/10 rounded-md">
                              ฉบับร่าง
                            </span>
                          )}
                          {article.isFeatured && (
                            <span className="inline-flex items-center px-2 py-0.5 bg-site-accent/10 text-site-accent text-[11px] font-black border border-site-accent/20 rounded-md">
                              <Pin size={10} className="mr-1" />
                              เด่น
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center px-2 py-0.5 text-[11px] font-black border border-white/5 rounded-md ${category.color}`}>
                            {category.label}
                          </span>
                        </div>

                        <h3 className="font-bold text-white text-[15px] group-hover:text-site-accent transition-colors line-clamp-1 mb-1">
                          {article.title}
                        </h3>
                        <p className="text-[13px] text-gray-400 line-clamp-1 mb-3">
                          {article.excerpt}
                        </p>

                        <div className="flex items-center gap-4 text-[12px] text-gray-400 font-medium">
                          <span className="flex items-center bg-site-surface px-2 py-1 rounded-lg border border-white/5">
                            <Eye size={12} className="mr-1.5 text-site-accent" />
                            {article.viewCount.toLocaleString()} views
                          </span>
                          <span className="flex items-center bg-site-surface px-2 py-1 rounded-lg border border-white/5">
                            <Calendar size={12} className="mr-1.5 text-site-accent" />
                            {article.publishedAt
                              ? new Date(
                                article.publishedAt,
                              ).toLocaleDateString("th-TH")
                              : new Date(article.createdAt).toLocaleDateString(
                                "th-TH",
                              )}
                          </span>
                          {article.tags.length > 0 && (
                            <div className="flex items-center bg-site-surface px-2 py-1 rounded-lg border border-white/5 max-w-[200px] truncate">
                              <Tag size={12} className="mr-1.5 text-site-accent shrink-0" />
                              <span className="truncate">{article.tags.join(", ")}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {article.isPublished && (
                          <Link
                            href={`/news/${article.slug}`}
                            target="_blank"
                            className="p-2 bg-site-surface border border-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-site-accent/20 hover:border-site-accent/30 transition-all"
                            title="ดูหน้าเว็บ"
                          >
                            <Eye size={16} />
                          </Link>
                        )}
                        <button
                          onClick={() => openEditModal(article)}
                          className="p-2 bg-site-surface border border-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-site-accent/20 hover:border-blue-500/30 transition-all"
                          title="แก้ไข"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(article.id)}
                          className="p-2 bg-site-surface border border-white/5 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/30 transition-all"
                          title="ลบ"
                        >
                          <Trash2 size={16} />
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
                          className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl shadow-inner flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-500/20 rounded-lg">
                              <AlertCircle className="w-5 h-5 text-rose-400" />
                            </div>
                            <p className="text-sm font-bold text-rose-300">
                              คุณแน่ใจหรือไม่ว่าต้องการลบข่าวนี้? การกระทำนี้ไม่สามารถย้อนกลับได้
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-4 py-2 bg-site-raised border border-white/5 rounded-xl text-gray-300 hover:bg-[#2a2d35] hover:text-white transition-all text-sm font-bold"
                            >
                              ยกเลิก
                            </button>
                            <button
                              onClick={() => handleDelete(article.id)}
                              className="px-4 py-2 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white rounded-xl shadow-lg hover:shadow-rose-500/25 transition-all text-sm font-black border border-rose-400/50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" /> ยืนยันการลบ
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
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 20 }}
                  className="bg-site-raised border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

                  {/* Sticky Header */}
                  <div className="p-5 border-b border-white/5 bg-site-surface flex items-center justify-between shrink-0 z-10">
                    <h3 className="text-[15px] font-black text-white tracking-wide flex items-center gap-2.5">
                      <div className="p-1.5 bg-site-accent/10 rounded-lg">
                        <Newspaper className="h-4 w-4 text-site-accent" />
                      </div>
                      {editingArticle ? "แก้ไขข่าวสาร" : "เพิ่มข่าวสารใหม่"}
                    </h3>
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setEditingArticle(null);
                        resetForm();
                      }}
                      className="p-2 bg-site-raised border border-white/5 rounded-xl hover:bg-[#2a2d35] hover:border-white/10 transition-all text-gray-400 disabled:opacity-50">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="overflow-y-auto flex-1 custom-scrollbar">
                    <form
                      onSubmit={editingArticle ? handleUpdate : handleCreate}
                      className="p-6 space-y-6">

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Title */}
                        <div className="space-y-2">
                          <label className="block text-[13px] font-bold text-gray-300">
                            หัวข้อข่าว <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) =>
                              setFormData({ ...formData, title: e.target.value })
                            }
                            placeholder="พิมพ์หัวข้อข่าวที่น่าสนใจ..."
                            required
                            className="w-full bg-site-surface border border-white/10 rounded-xl shadow-inner px-4 py-3 text-[14px] text-white focus:ring-2 focus:ring-site-accent/50 focus:border-site-accent/50 outline-none transition-all placeholder-gray-600"
                          />
                        </div>

                        {/* Slug */}
                        <div className="space-y-2">
                          <label className="block text-[13px] font-bold text-gray-300 flex items-center justify-between">
                            <span>URL Slug <span className="text-rose-500">*</span></span>
                            {editingArticle && (
                              <span className="text-site-accent text-[10px] flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                เปลี่ยนอาจทำลิงก์เดิมเสีย
                              </span>
                            )}
                          </label>
                          <div className="relative flex items-center">
                            <span className="absolute left-4 text-gray-400 font-mono text-[13px]">/news/</span>
                            <input
                              type="text"
                              value={formData.slug}
                              onChange={(e) =>
                                setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })
                              }
                              placeholder="article-slug"
                              className="w-full bg-site-surface border border-white/10 rounded-xl shadow-inner pl-[70px] pr-4 py-3 text-[13px] text-site-accent font-mono focus:ring-2 focus:ring-site-accent/50 focus:border-site-accent/50 outline-none transition-all placeholder-gray-700"
                            />
                          </div>
                          <p className="text-[11px] text-gray-400 font-medium mt-1">
                            {!editingArticle && "* สร้างอัตโนมัติจากชื่อ (ภาษาอังกฤษ, ตัวพิมพ์เล็ก, เลข, ขีดกลางเท่านั้น)"}
                          </p>
                        </div>
                      </div>

                      {/* AI Generate Section */}
                      <div className="bg-site-accent/10 border border-white/5 rounded-xl border-site-accent p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Sparkles className="w-4 h-4 text-site-accent mr-2" />
                            <span className="font-medium text-white text-sm">
                              สร้างด้วย AI
                            </span>
                          </div>
                          {!showAIGenerate && (
                            <button
                              type="button"
                              onClick={() => setShowAIGenerate(true)}
                              className="text-xs bg-site-accent text-white px-2 py-1 border border-white/5 rounded-xl hover:bg-site-accent/80 transition-colors">
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
                              className="space-y-2">
                              <div>
                                <label className="block text-gray-300 mb-1 text-xs">
                                  หัวข้อที่ต้องการให้ AI เขียน
                                </label>
                                <input
                                  type="text"
                                  value={aiTopic}
                                  onChange={(e) => setAiTopic(e.target.value)}
                                  placeholder="เช่น อัปเดตระบบใหม่, โปรโมชันประจำเดือน"
                                  className="w-full py-1.5 px-3 bg-site-surface border border-white/5 rounded-2xl border-gray-300 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-site-accent"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">
                                  AI จะค้นหาข้อมูลจาก TheNewsAPI
                                  และสร้างเนื้อหาข่าว
                                </p>
                              </div>

                              {/* Variation Selector */}
                              <div>
                                <label className="block text-gray-300 mb-1 text-xs">
                                  มุมมองข่าว (เลือกแนวข่าวที่ต้องการ)
                                </label>
                                <select
                                  value={aiVariation}
                                  onChange={(e) => setAiVariation(e.target.value)}
                                  className="w-full py-1.5 px-3 bg-site-surface border border-white/5 rounded-2xl border-gray-300 text-white text-sm focus:outline-none focus:border-site-accent">
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

                              {/* LiteLLM Model Selector */}
                              <div>
                                <label className="block text-gray-300 mb-1 text-xs">
                                  🤖 AI Model
                                </label>
                                <select
                                  value={selectedModel}
                                  onChange={(e) => {
                                    setSelectedModel(e.target.value);
                                    aiService.setModel(e.target.value);
                                  }}
                                  disabled={isLoadingModels || availableModels.length === 0}
                                  className="w-full py-1.5 px-3 bg-site-surface border border-white/5 rounded-2xl border-gray-300 text-white text-sm focus:outline-none focus:border-site-accent disabled:opacity-50">
                                  {isLoadingModels ? (
                                    <option value="">กำลังโหลด model...</option>
                                  ) : availableModels.length === 0 ? (
                                    <option value="">ไม่พบ model</option>
                                  ) : (
                                    availableModels.map((model) => (
                                      <option key={model.id} value={model.id}>
                                        {model.name || model.id} {model.owned_by ? `(${model.owned_by})` : ""}
                                      </option>
                                    ))
                                  )}
                                </select>
                                <p className="text-[10px] text-gray-400 mt-1">
                                  เลือก model ที่ใช้สำหรับเขียนบทความข่าว
                                </p>
                              </div>

                              {/* News Provider Selector */}
                              <div>
                                <label className="block text-gray-300 mb-1 text-xs">
                                  📡 แหล่งข่าว
                                </label>
                                <select
                                  value={newsProvider}
                                  onChange={(e) => setNewsProvider(e.target.value as "thenewsapi" | "newsapi")}
                                  className="w-full py-1.5 px-3 bg-site-surface border border-white/5 rounded-2xl border-gray-300 text-white text-sm focus:outline-none focus:border-site-accent">
                                  <option value="thenewsapi">TheNewsAPI (ค่าเริ่มต้น)</option>
                                  <option value="newsapi">NewsAPI.org (สำรอง)</option>
                                </select>
                                <p className="text-[10px] text-gray-400 mt-1">
                                  เลือกแหล่งข่าวสำรองหากโควตาเต็ม
                                </p>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={handleGenerateAIContent}
                                  disabled={isGeneratingAI || !aiTopic.trim()}
                                  className="flex-1 bg-site-accent text-white border border-white/5 rounded-xl py-1.5 text-sm font-medium flex items-center justify-center disabled:opacity-50 transition-colors">
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
                                  className="px-2 py-1.5 border border-white/5 rounded-xl border-gray-300 text-gray-400 hover:bg-site-raised/5 transition-colors">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              {aiProgress && (
                                <div className="mt-3">
                                  <AINewsProgressPanel
                                    progress={aiProgress}
                                    isGenerating={isGeneratingAI}
                                    error={error ?? undefined}
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
                          <div className="mt-3 p-2 bg-red-500/5 border-[1px] border-red-300 text-red-400 text-xs">
                            กรุณาตั้งค่า LITELLM_API_KEY ในไฟล์ .env ของ server
                            ก่อนใช้งาน AI
                          </div>
                        )}
                      </div>

                      {/* Category & Cover */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-[13px] font-bold text-gray-300">
                            หมวดหมู่ <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={formData.category}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                category: e.target.value as NewsCategory,
                              })
                            }
                            className="w-full bg-site-surface border border-white/10 rounded-xl shadow-inner px-4 py-3 text-[14px] text-white focus:ring-2 focus:ring-site-accent/50 focus:border-site-accent/50 outline-none transition-all cursor-pointer appearance-none">
                            {categories.map((cat) => (
                              <option key={cat.value} value={cat.value}>
                                {cat.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[13px] font-bold text-gray-300">
                            รูปปก (URL){" "}
                            {showAIGenerate && (
                              <span className="text-site-accent font-normal text-[11px] ml-1">
                                (AI ค้นหาให้อัตโนมัติ)
                              </span>
                            )}
                          </label>
                          <div className="flex gap-2">
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
                              className="flex-1 bg-site-surface border border-white/10 rounded-xl shadow-inner px-4 py-3 text-[13px] text-white focus:ring-2 focus:ring-site-accent/50 focus:border-site-accent/50 outline-none transition-all placeholder-gray-600 truncate"
                            />
                            {formData.coverImage && (
                              <div className="w-12 h-[46px] rounded-xl border border-white/10 shrink-0 overflow-hidden bg-[#1D1E20]">
                                <img
                                  src={formData.coverImage}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display =
                                      "none";
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Excerpt */}
                      <div className="space-y-2">
                        <label className="block text-[13px] font-bold text-gray-300">
                          บทสรุป (Excerpt) <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          value={formData.excerpt}
                          onChange={(e) =>
                            setFormData({ ...formData, excerpt: e.target.value })
                          }
                          placeholder="สรุปเนื้อหาสั้นๆ (แสดงในรายการ)..."
                          required
                          rows={2}
                          className="w-full bg-site-surface border border-white/10 rounded-xl shadow-inner px-4 py-3 text-[13px] text-white focus:ring-2 focus:ring-site-accent/50 focus:border-site-accent/50 outline-none transition-all placeholder-gray-600 resize-none leading-relaxed"
                        />
                      </div>

                      {/* Content */}
                      <div className="space-y-2">
                        <label className="block text-[13px] font-bold text-gray-300">
                          เนื้อหา <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <textarea
                            ref={contentTextareaRef}
                            value={formData.content}
                            onChange={(e) => {
                              setFormData({ ...formData, content: e.target.value });
                              setCursorPosition(e.target.selectionStart);
                            }}
                            onClick={(e) => setCursorPosition((e.target as HTMLTextAreaElement).selectionStart)}
                            onKeyUp={(e) => setCursorPosition((e.target as HTMLTextAreaElement).selectionStart)}
                            placeholder="พิมพ์เนื้อหาข่าว (รองรับ Markdown/HTML)... คลิกตรงที่ต้องการแทรกรูป/คลิป"
                            required
                            rows={12}
                            className="w-full bg-site-surface border border-white/10 rounded-xl shadow-inner px-4 py-3 text-[13px] text-gray-300 focus:ring-2 focus:ring-site-accent/50 focus:border-site-accent/50 outline-none transition-all resize-none font-mono leading-relaxed"
                          />
                          {cursorPosition !== null && formData.content && (
                            <div className="absolute -bottom-6 right-0 text-[10px] text-site-accent/80 font-medium">
                              📍 แทรกสื่อที่บรรทัด {formData.content.slice(0, cursorPosition).split('\n').length}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Media Picker Panel */}
                      {(mediaImages.length > 0 || mediaVideos.length > 0 || isSearchingMedia) && (
                        <div className="pt-4 border-t border-white/5">
                          <MediaPickerPanel
                            images={mediaImages}
                            videos={mediaVideos}
                            isSearching={isSearchingMedia}
                            searchQuery={mediaSearchQuery}
                            onSearchQueryChange={setMediaSearchQuery}
                            onSearch={() => handleSearchMedia()}
                            onSetCoverImage={handleSetCoverImage}
                            onInsertImage={handleInsertImageToContent}
                            onInsertVideo={handleInsertVideoToContent}
                            currentCoverImage={formData.coverImage}
                          />
                        </div>
                      )}

                      {/* Manual media search button when AI panel is open but no media yet */}
                      {showAIGenerate && mediaImages.length === 0 && mediaVideos.length === 0 && !isSearchingMedia && formData.content && (
                        <button
                          type="button"
                          onClick={() => handleSearchMedia(aiTopic || formData.title)}
                          className="w-full py-3 bg-site-accent/5 border border-dashed border-blue-500/30 rounded-xl text-site-accent font-bold text-[13px] hover:bg-site-accent/10 transition-colors flex items-center justify-center gap-2"
                        >
                          <ImagePlus className="w-4 h-4" />
                          ค้นหารูปภาพและวิดีโอ YouTube ประกอบบทความ
                        </button>
                      )}

                      {/* AI Generated Sources Preview */}
                      {aiGeneratedSources.length > 0 && (
                        <div className="bg-site-accent/10 border border-site-accent/20 p-4 rounded-xl shadow-inner">
                          <h4 className="font-bold text-site-accent mb-2 flex items-center gap-2 text-[13px]">
                            <CheckCircle className="w-4 h-4" /> AI สรุปข้อมูลจากแหล่งข่าวเหล่านี้
                          </h4>
                          <ul className="text-[12px] space-y-1 mt-2">
                            {aiGeneratedSources.map((source, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-site-accent/50" />
                                <a
                                  href={source}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-site-accent hover:text-blue-300 hover:underline truncate">
                                  {source}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Tags & Sources Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                        {/* Tags */}
                        <div className="space-y-2">
                          <label className="block text-[13px] font-bold text-gray-300">
                            แท็ก
                            {showAIGenerate && (
                              <span className="text-site-accent font-normal text-[11px] ml-1">
                                (AI ค้นหาให้อัตโนมัติ)
                              </span>
                            )}
                          </label>
                          <div className="flex gap-2">
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
                              placeholder="เพิ่มแท็กแล้วกด Enter..."
                              className="flex-1 bg-site-surface border border-white/10 rounded-xl shadow-inner px-4 py-2.5 text-[13px] text-white focus:ring-2 focus:ring-site-accent/50 focus:border-site-accent/50 outline-none transition-all placeholder-gray-600"
                            />
                            <button
                              type="button"
                              onClick={addTag}
                              className="px-4 py-2.5 bg-site-raised border border-white/5 rounded-xl text-gray-300 hover:bg-[#2a2d35] transition-all text-[13px] font-bold">
                              เพิ่ม
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-2">
                            {formData.tags?.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2.5 py-1 bg-site-accent/10 text-site-accent text-[12px] font-medium border border-site-accent/20 rounded-lg group">
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => removeTag(tag)}
                                  className="ml-1.5 text-site-accent/50 group-hover:text-rose-400 transition-colors">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Sources */}
                        <div className="space-y-2">
                          <label className="block text-[13px] font-bold text-gray-300">
                            แหล่งอ้างอิง
                            {showAIGenerate && (
                              <span className="text-site-accent font-normal text-[11px] ml-1">
                                (AI ค้นหาให้อัตโนมัติ)
                              </span>
                            )}
                          </label>
                          <div className="space-y-2">
                            {formData.sources?.map((source, index) => (
                              <div key={index} className="flex gap-2 relative group">
                                <input
                                  type="url"
                                  value={source}
                                  onChange={(e) => {
                                    const newSources = [...(formData.sources || [])];
                                    newSources[index] = e.target.value;
                                    setFormData({ ...formData, sources: newSources });
                                  }}
                                  placeholder="https://example.com/source"
                                  className="flex-1 bg-site-surface border border-white/10 rounded-xl shadow-inner px-4 py-2.5 text-[13px] text-white focus:ring-2 focus:ring-site-accent/50 focus:border-site-accent/50 outline-none transition-all placeholder-gray-600 pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newSources = formData.sources?.filter((_, i) => i !== index) || [];
                                    setFormData({ ...formData, sources: newSources });
                                  }}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, sources: [...(formData.sources || []), ""] })}
                              className="w-full py-2.5 border border-dashed border-white/10 rounded-xl text-gray-400 font-bold text-[13px] hover:bg-white/5 hover:border-white/20 hover:text-white transition-colors"
                            >
                              + เพิ่มแหล่งอ้างอิง
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Options */}
                      <div className="flex flex-wrap gap-8 py-2">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={formData.isPublished}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  isPublished: e.target.checked,
                                })
                              }
                              className="sr-only peer"
                            />
                            <div className="w-10 h-6 bg-site-surface border border-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-site-accent/20 peer-checked:border-site-accent/50"></div>
                          </div>
                          <span className="text-[14px] font-bold text-gray-300 group-hover:text-white transition-colors">เผยแพร่</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={formData.isFeatured}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  isFeatured: e.target.checked,
                                })
                              }
                              className="sr-only peer"
                            />
                            <div className="w-10 h-6 bg-site-surface border border-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-site-accent/20 peer-checked:border-site-accent/50"></div>
                          </div>
                          <span className="text-[14px] font-bold text-gray-300 group-hover:text-white transition-colors">
                            รายการแนะนำ (Featured)
                          </span>
                        </label>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-6 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => {
                            setShowModal(false);
                            setEditingArticle(null);
                            resetForm();
                          }}
                          className="flex-1 py-3 px-4 bg-site-raised border border-white/5 rounded-xl text-gray-300 hover:bg-[#2a2d35] hover:text-white transition-all font-bold text-[14px]">
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
                          className="flex-1 py-2.5 px-4 bg-black text-white border border-white/5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium hover:bg-gray-800 transition-colors">
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
