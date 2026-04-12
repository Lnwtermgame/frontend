"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "@/lib/framer-exports";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  FileText,
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
  Sparkles,
  Wand2,
} from "lucide-react";
import {
  cmsApi,
  CmsPage,
  CreateCmsPageData,
  UpdateCmsPageData,
} from "@/lib/services";
import { aiService, AIModel } from "@/lib/services/ai-api";
import { useAuth } from "@/lib/hooks/use-auth";
import Link from "next/link";

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

export default function AdminCmsPagesPage() {
  const { isAdmin, isInitialized, isSessionChecked } = useAuth();
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingPage, setEditingPage] = useState<CmsPage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Form data
  const [formData, setFormData] = useState<CreateCmsPageData>({
    slug: "",
    title: "",
    content: "",
    metaTitle: "",
    metaDescription: "",
    isPublished: false,
  });

  // AI Generation states
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [showAIGenerate, setShowAIGenerate] = useState(false);

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
        console.error("[CmsPages] Failed to fetch models:", error);
      } finally {
        setIsLoadingModels(false);
      }
    };
    fetchModels();
  }, [selectedModel]);

  const loadPages = async () => {
    if (!isInitialized || !isSessionChecked || !isAdmin) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const isPublished =
        statusFilter === "ALL" ? undefined : statusFilter === "PUBLISHED";
      const response = await cmsApi.getPages(1, 100, searchQuery, isPublished);
      if (response.success) {
        setPages(response.data);
      }
    } catch (err) {
      setError(cmsApi.getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, [searchQuery, statusFilter, isInitialized, isSessionChecked, isAdmin]);

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
    if (!formData.title.trim() || !formData.content.trim()) return;

    setIsSubmitting(true);
    try {
      const data: CreateCmsPageData = {
        ...formData,
        slug: formData.slug?.trim() || slugify(formData.title),
      };
      const response = await cmsApi.createPage(data);
      if (response.success) {
        setShowModal(false);
        resetForm();
        loadPages();
      }
    } catch (err) {
      setError(cmsApi.getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPage || !formData.title?.trim() || !formData.content?.trim())
      return;

    setIsSubmitting(true);
    try {
      const data: UpdateCmsPageData = {
        slug: formData.slug?.trim() || editingPage.slug,
        title: formData.title,
        content: formData.content,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        isPublished: formData.isPublished,
      };
      const response = await cmsApi.updatePage(editingPage.id, data);
      if (response.success) {
        setShowModal(false);
        setEditingPage(null);
        resetForm();
        loadPages();
      }
    } catch (err) {
      setError(cmsApi.getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (pageId: string) => {
    try {
      await cmsApi.deletePage(pageId);
      setDeleteConfirm(null);
      loadPages();
    } catch (err) {
      setError(cmsApi.getErrorMessage(err));
    }
  };

  const openCreateModal = () => {
    setEditingPage(null);
    resetForm();
    setAiTopic("");
    setShowAIGenerate(false);
    setShowModal(true);
  };

  const openEditModal = (page: CmsPage) => {
    setEditingPage(page);
    setFormData({
      slug: page.slug,
      title: page.title,
      content: page.content,
      metaTitle: page.metaTitle || "",
      metaDescription: page.metaDescription || "",
      isPublished: page.isPublished,
    });
    setAiTopic("");
    setShowAIGenerate(false);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      slug: "",
      title: "",
      content: "",
      metaTitle: "",
      metaDescription: "",
      isPublished: false,
    });
    setAiTopic("");
    setShowAIGenerate(false);
  };

  const handleGenerateAIContent = async () => {
    if (!aiTopic.trim()) return;

    // Set the selected model before generating
    if (selectedModel) {
      aiService.setModel(selectedModel);
    }

    setIsGeneratingAI(true);
    try {
      const result = await aiService.generateCmsPageContent(
        aiTopic,
        "หน้าเว็บ CMS",
      );
      const aiSlug = result.slug || slugify(result.title);

      setFormData((prev) => ({
        ...prev,
        title: result.title,
        content: result.content,
        slug: !editingPage && !prev.slug?.trim() ? aiSlug : prev.slug,
        metaTitle: prev.metaTitle?.trim() ? prev.metaTitle : result.title,
        metaDescription: prev.metaDescription?.trim()
          ? prev.metaDescription
          : result.excerpt,
      }));
      setError(null);
    } catch (err) {
      setError(cmsApi.getErrorMessage(err));
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const filteredPages = pages.filter((page) => {
    const matchesSearch =
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PUBLISHED" && page.isPublished) ||
      (statusFilter === "DRAFT" && !page.isPublished);
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout title="จัดการหน้าเว็บ (CMS)">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-site-raised p-6 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-site-accent/5 via-transparent to-site-accent/5 pointer-events-none" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-site-accent/20 to-site-accent/20 rounded-xl border border-site-accent/20 shadow-inner">
              <FileText className="w-8 h-8 text-site-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-wide mb-1">
                จัดการหน้าเว็บ (CMS)
              </h1>
              <p className="text-sm text-gray-400 font-medium">
                จัดการระบบเนื้อหาและคอนเทนต์หน้าเว็บทั้งหมด
              </p>
            </div>
          </div>
          <button
            onClick={openCreateModal}
            className="relative z-10 bg-gradient-to-r from-site-accent to-site-accent/80 hover:from-site-accent hover:to-site-accent/60 text-white rounded-xl px-5 py-2.5 font-bold flex items-center gap-2 shadow-lg shadow-accent-glow hover:shadow-accent-glow transition-all border border-site-accent/30 group shrink-0">
            <Plus size={18} className="group-hover:scale-110 transition-transform" />
            <span>เพิ่มหน้าใหม่</span>
          </button>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center overflow-hidden">
              <AlertCircle className="text-rose-400 mr-3 shrink-0" size={20} />
              <span className="text-rose-300 text-sm font-medium">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-rose-400/50 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg transition-colors">
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            {
              label: "หน้าทั้งหมด",
              value: pages.length,
              color: "text-site-accent",
              bgPattern: "from-site-accent/5 to-transparent border-blue-500/10",
              icon: <FileText className="w-5 h-5 text-site-accent/50" />
            },
            {
              label: "เผยแพร่แล้ว",
              value: pages.filter((p) => p.isPublished).length,
              color: "text-site-accent",
              bgPattern: "from-site-accent/5 to-transparent border-site-accent/10",
              icon: <CheckCircle className="w-5 h-5 text-site-accent/50" />
            },
            {
              label: "ฉบับร่าง",
              value: pages.filter((p) => !p.isPublished).length,
              color: "text-site-accent",
              bgPattern: "from-site-accent/5 to-transparent border-site-accent/10",
              icon: <Edit2 className="w-5 h-5 text-site-accent/50" />
            },
            {
              label: "Terms/Privacy",
              value: pages.filter((p) =>
                [
                  "terms",
                  "privacy",
                  "terms-of-service",
                  "privacy-policy",
                ].includes(p.slug),
              ).length,
              color: "text-site-accent",
              bgPattern: "from-site-accent/5 to-transparent border-site-accent/10",
              icon: <Sparkles className="w-5 h-5 text-site-accent/50" />
            },
          ].map((stat, index) => (
            <div
              key={index}
              className={`p-5 bg-site-raised border border-white/5 rounded-2xl relative overflow-hidden group`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgPattern} opacity-50`} />
              <div className="relative z-10 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm font-medium">{stat.label}</span>
                  {stat.icon}
                </div>
                <div className={`text-3xl font-black tracking-tight ${stat.color}`}>
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
          className="bg-site-raised border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row gap-4"
        >
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="ค้นหาหน้าเว็บ (ชื่อ หรือ slug)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-site-surface border border-white/5 rounded-xl text-[14px] text-white focus:ring-2 focus:ring-site-accent/50 outline-none transition-all placeholder-gray-600 shadow-inner"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-site-surface border border-white/5 rounded-xl px-4 py-3 text-[14px] font-medium text-gray-300 focus:ring-2 focus:ring-site-accent/50 outline-none hover:border-white/10 transition-colors cursor-pointer appearance-none min-w-[140px]"
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="PUBLISHED">เผยแพร่แล้ว</option>
              <option value="DRAFT">ฉบับร่าง</option>
            </select>
            <button
              onClick={loadPages}
              disabled={isLoading}
              className="p-3 bg-site-surface border border-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-site-raised transition-all flex items-center gap-2 group shrink-0"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin text-site-accent" : "group-hover:rotate-180 transition-transform duration-500"}`} />
            </button>
          </div>
        </motion.div>

        {/* Pages List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-site-raised border border-white/5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden"
        >
          <div className="p-5 border-b border-white/5 bg-site-surface/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-site-raised rounded-xl border border-white/5">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <h3 className="text-[15px] font-black text-white tracking-wide">
                  รายการหน้าเว็บไซต์ทั้งหมด
                </h3>
                <p className="text-[12px] text-gray-400 font-medium">
                  {filteredPages.length} รายการ
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
            ) : filteredPages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-site-raised rounded-full flex items-center justify-center mb-4 border border-white/5 shadow-inner">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-[16px] font-black text-white mb-2">ไม่พบหน้าเว็บ</h3>
                <p className="text-gray-400 text-[14px] max-w-sm mb-6">
                  ยังไม่มีหน้าเว็บที่ตรงกับเงื่อนไขการค้นหา
                </p>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
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
              filteredPages.map((page) => (
                <div
                  key={page.id}
                  className="p-5 hover:bg-site-raised/50 transition-colors group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        {page.isPublished ? (
                          <span className="inline-flex items-center px-2 py-0.5 bg-site-accent/10 text-site-accent text-[11px] font-black border border-site-accent/20 rounded-md">
                            <CheckCircle size={10} className="mr-1" />
                            เผยแพร่
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 bg-site-raised text-gray-400 text-[11px] font-black border border-white/10 rounded-md">
                            ฉบับร่าง
                          </span>
                        )}
                        <span className="inline-flex items-center px-2 py-0.5 bg-site-accent/10 text-site-accent text-[11px] font-mono border border-site-accent/20 rounded-md truncate max-w-[200px]">
                          /{page.slug}
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium">
                          v{page.version}
                        </span>
                      </div>

                      <h3 className="font-bold text-white text-[15px] group-hover:text-site-accent transition-colors mb-1 truncate">
                        {page.title}
                      </h3>

                      {page.metaDescription ? (
                        <p className="text-[13px] text-gray-400 line-clamp-1 mb-2">
                          {page.metaDescription}
                        </p>
                      ) : (
                        <p className="text-[13px] text-gray-600 line-clamp-1 mb-2 italic">
                          ไม่มีคำอธิบาย Meta Description
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-[12px] text-gray-400 font-medium mt-2">
                        <span className="flex items-center gap-1.5">
                          <Edit2 className="w-3.5 h-3.5 text-site-accent" />
                          แก้ไขล่าสุด:{" "}
                          {new Date(page.updatedAt).toLocaleDateString("th-TH")}
                        </span>
                        {page.publishedAt && (
                          <span className="flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-site-accent" />
                            เผยแพร่:{" "}
                            {new Date(page.publishedAt).toLocaleDateString(
                              "th-TH",
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {page.isPublished && (
                        <Link
                          href={`/${page.slug}`}
                          target="_blank"
                          className="p-2 bg-site-surface border border-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-site-accent/20 hover:border-site-accent/30 transition-all"
                          title="ดูหน้าเว็บ"
                        >
                          <Eye size={16} />
                        </Link>
                      )}
                      <button
                        onClick={() => openEditModal(page)}
                        className="p-2 bg-site-surface border border-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-site-accent/20 hover:border-blue-500/30 transition-all"
                        title="แก้ไข"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(page.id)}
                        className="p-2 bg-site-surface border border-white/5 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/30 transition-all"
                        title="ลบ"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Delete Confirmation */}
                  <AnimatePresence>
                    {deleteConfirm === page.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl shadow-inner flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-rose-500/20 rounded-lg shrink-0">
                            <AlertCircle className="w-5 h-5 text-rose-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-rose-300">คุณแน่ใจหรือไม่ว่าต้องการลบหน้าเว็บนี้?</p>
                            <p className="text-xs text-rose-400/80">คุณอาจจะต้องเปลี่ยนลิงก์ที่ชี้มายังหน้านี้ด้วย</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-4 py-2 bg-site-raised border border-white/5 rounded-xl text-gray-300 hover:bg-[#2a2d35] hover:text-white transition-all text-sm font-bold"
                          >
                            ยกเลิก
                          </button>
                          <button
                            onClick={() => handleDelete(page.id)}
                            className="px-4 py-2 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white rounded-xl shadow-lg hover:shadow-rose-500/25 transition-all text-sm font-black border border-rose-400/50 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" /> ยืนยันการลบ
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Modal */}
      {mounted && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
              style={{ zIndex: 9999 }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-site-raised border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="p-5 border-b border-white/5 bg-site-surface flex items-center justify-between shrink-0">
                  <h3 className="text-[15px] font-black text-white tracking-wide flex items-center gap-2.5">
                    <div className="p-1.5 bg-site-accent/10 rounded-lg">
                      <FileText className="h-4 w-4 text-site-accent" />
                    </div>
                    {editingPage ? "แก้ไขหน้าเว็บไซต์" : "เพิ่มหน้าเว็บไซต์ใหม่"}
                  </h3>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setEditingPage(null);
                      resetForm();
                    }}
                    className="p-2 bg-site-raised border border-white/5 rounded-xl hover:bg-[#2a2d35] hover:border-white/10 transition-all text-gray-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 custom-scrollbar">
                  <form
                    onSubmit={editingPage ? handleUpdate : handleCreate}
                    className="p-6 space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Title */}
                      <div className="space-y-2">
                        <label className="block text-[13px] font-bold text-gray-300">
                          ชื่อหน้า <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          placeholder="เช่น เงื่อนไขการใช้งาน, นโยบายความเป็นส่วนตัว..."
                          required
                          className="w-full bg-site-surface border border-white/10 rounded-xl shadow-inner px-4 py-3 text-[14px] text-white focus:ring-2 focus:ring-site-accent/50 focus:border-site-accent/50 outline-none transition-all placeholder-gray-600"
                        />
                      </div>

                      {/* Slug */}
                      <div className="space-y-2">
                        <label className="block text-[13px] font-bold text-gray-300 flex items-center justify-between">
                          <span>URL Slug <span className="text-rose-500">*</span></span>
                          {editingPage && (
                            <span className="text-site-accent text-[10px] flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              เปลี่ยนอาจทำลิงก์เดิมเสีย
                            </span>
                          )}
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-4 text-gray-400 font-mono text-[13px] z-10 w-4 text-center">
                            /
                          </span>
                          <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) =>
                              setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })
                            }
                            placeholder="about, terms, privacy..."
                            className="w-full bg-site-surface border border-white/10 rounded-xl shadow-inner pl-9 pr-4 py-3 text-[13px] text-site-accent font-mono focus:ring-2 focus:ring-site-accent/50 focus:border-site-accent/50 outline-none transition-all placeholder-gray-700"
                          />
                        </div>
                        <p className="text-[11px] text-gray-400 font-medium mt-1">
                          {!editingPage && "* สร้างอัตโนมัติจากชื่อ (ภาษาอังกฤษ, ตัวพิมพ์เล็ก, เลข, ขีดกลางเท่านั้น)"}
                        </p>
                      </div>
                    </div>

                    {/* AI Generate Section */}
                    <div className="bg-site-accent/5 border border-site-accent/20 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between p-4 bg-site-accent/5 border-b border-site-accent/10">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-site-accent/20 rounded-lg">
                            <Sparkles className="w-4 h-4 text-site-accent" />
                          </div>
                          <span className="font-bold text-site-accent text-[13px]">
                            สร้างเนื้อหาด้วย AI (Draft)
                          </span>
                        </div>
                        {!showAIGenerate && (
                          <button
                            type="button"
                            onClick={() => setShowAIGenerate(true)}
                            className="text-[12px] font-bold bg-gradient-to-r from-site-accent to-site-accent/80 hover:from-site-accent hover:to-site-accent/60 text-white px-3 py-1.5 rounded-lg border border-site-accent/50 transition-colors flex items-center gap-1.5"
                          >
                            <Wand2 className="w-3.5 h-3.5" /> เปิดใช้งาน
                          </button>
                        )}
                      </div>

                      <AnimatePresence>
                        {showAIGenerate && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-4 space-y-4"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="block text-gray-400 font-bold text-[12px]">
                                  หัวข้อที่ต้องการให้ AI ช่วยร่าง
                                </label>
                                <input
                                  type="text"
                                  value={aiTopic}
                                  onChange={(e) => setAiTopic(e.target.value)}
                                  placeholder="เช่น นโยบายความเป็นส่วนตัว, เงื่อนไขการใช้งานระบบ..."
                                  className="w-full py-2.5 px-3 bg-site-surface border border-white/10 rounded-xl text-[13px] text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-site-accent/50 focus:border-site-accent/50"
                                />
                              </div>

                              {/* Model Selector */}
                              <div className="space-y-2">
                                <label className="block text-gray-400 font-bold text-[12px]">
                                  เลือก AI Model
                                </label>
                                <select
                                  value={selectedModel}
                                  onChange={(e) => {
                                    setSelectedModel(e.target.value);
                                    aiService.setModel(e.target.value);
                                  }}
                                  disabled={isLoadingModels || availableModels.length === 0}
                                  className="w-full py-2.5 px-3 bg-site-surface border border-white/10 rounded-xl text-[13px] text-white focus:outline-none focus:ring-2 focus:ring-site-accent/50 focus:border-site-accent/50 disabled:opacity-50 appearance-none cursor-pointer"
                                >
                                  {isLoadingModels ? (
                                    <option value="">กำลังโหลด models...</option>
                                  ) : availableModels.length === 0 ? (
                                    <option value="">ไม่พบ model ที่ใช้ได้</option>
                                  ) : (
                                    availableModels.map((model) => (
                                      <option key={model.id} value={model.id}>
                                        {model.name || model.id} {model.owned_by ? `(${model.owned_by})` : ""}
                                      </option>
                                    ))
                                  )}
                                </select>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <button
                                type="button"
                                onClick={handleGenerateAIContent}
                                disabled={isGeneratingAI || !aiTopic.trim()}
                                className="flex-1 bg-gradient-to-r from-site-accent to-site-accent/80 hover:from-site-accent hover:to-site-accent/60 text-white rounded-xl py-2.5 text-[13px] font-bold shadow-md shadow-accent-glow disabled:opacity-50 transition-all flex items-center justify-center gap-2 border border-site-accent/30"
                              >
                                {isGeneratingAI ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    กำลังสร้างเนื้อหา...
                                  </>
                                ) : (
                                  <>
                                    <Wand2 className="w-4 h-4" />
                                    ร่างเนื้อหาด้วย AI
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAIGenerate(false);
                                  setAiTopic("");
                                }}
                                className="px-4 py-2.5 bg-site-raised border border-white/5 rounded-xl text-gray-400 hover:bg-[#2a2d35] hover:text-white transition-all flex items-center justify-center"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {!aiService.isConfigured() && showAIGenerate && (
                        <div className="m-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[12px] font-medium flex items-center gap-2">
                          <AlertCircle className="shrink-0 w-4 h-4" />
                          กรุณาตั้งค่า LITELLM_API_KEY ในไฟล์ .env ของ Backend ก่อนใช้งาน AI
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <label className="block text-[13px] font-bold text-gray-300">
                        เนื้อหา <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        value={formData.content}
                        onChange={(e) =>
                          setFormData({ ...formData, content: e.target.value })
                        }
                        placeholder="พิมพ์เนื้อหาของหน้าเว็บ (รองรับ HTML/Markdown)..."
                        required
                        rows={12}
                        className="w-full bg-site-surface border border-white/10 rounded-xl shadow-inner px-4 py-3 text-[13px] text-gray-300 focus:ring-2 focus:ring-site-accent/50 focus:border-site-accent/50 outline-none transition-all resize-none font-mono leading-relaxed"
                      />
                      <p className="text-[11px] text-gray-400 font-medium">แนะนำให้ใช้ HTML หรือ Markdown พื้นฐานในการจัดรูปแบบ</p>
                    </div>

                    {/* SEO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                      <div className="space-y-2">
                        <label className="block text-[13px] font-bold text-gray-300">
                          Meta Title
                        </label>
                        <input
                          type="text"
                          value={formData.metaTitle}
                          onChange={(e) =>
                            setFormData({ ...formData, metaTitle: e.target.value })
                          }
                          placeholder="Title สำหรับ SEO (Google Search)"
                          className="w-full bg-site-surface border border-white/10 rounded-xl shadow-inner px-4 py-3 text-[13px] text-white focus:ring-2 focus:ring-site-accent/50 focus:border-site-accent/50 outline-none transition-all placeholder-gray-600"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[13px] font-bold text-gray-300">
                          Meta Description
                        </label>
                        <input
                          type="text"
                          value={formData.metaDescription}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              metaDescription: e.target.value,
                            })
                          }
                          placeholder="คำอธิบายสั้นๆ สำหรับ SEO"
                          className="w-full bg-site-surface border border-white/10 rounded-xl shadow-inner px-4 py-3 text-[13px] text-white focus:ring-2 focus:ring-site-accent/50 focus:border-site-accent/50 outline-none transition-all placeholder-gray-600"
                        />
                      </div>
                    </div>

                    {/* Publish Status Options */}
                    <div className="pt-2">
                      <label className="inline-flex items-center gap-3 cursor-pointer group">
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
                        <span className="text-[14px] font-bold text-gray-300 group-hover:text-white transition-colors">
                          เผยแพร่หน้าเว็บ (เปิดให้ใช้งานสาธารณะ)
                        </span>
                      </label>
                    </div>

                    {/* Modal Actions */}
                    <div className="flex gap-3 pt-6 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => {
                          setShowModal(false);
                          setEditingPage(null);
                          resetForm();
                        }}
                        className="flex-1 py-3 px-4 bg-site-raised border border-white/5 rounded-xl text-gray-300 hover:bg-[#2a2d35] hover:text-white transition-all font-bold text-[14px]"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        disabled={
                          isSubmitting ||
                          !formData.title?.trim() ||
                          !formData.content?.trim()
                        }
                        className="flex-xl py-3 px-8 bg-gradient-to-r from-site-accent to-site-accent/80 hover:from-site-accent hover:to-site-accent/60 text-white rounded-xl shadow-lg hover:shadow-accent-glow transition-all text-[14px] font-black border border-site-accent/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            กำลังบันทึก...
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            บันทึกการเปลี่ยนแปลง
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </AdminLayout>
  );
}
