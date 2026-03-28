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
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="w-1.5 h-4 bg-pink-500 mr-2"></span>
            <h1 className="text-lg font-bold text-white">
              จัดการหน้าเว็บ (CMS)
            </h1>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-black text-white border border-site-border/30 rounded-[12px] shadow-sm px-2.5 py-1 font-medium flex items-center hover:bg-gray-800 transition-colors">
            <Plus size={14} className="mr-2" />
            <span className="text-xs">เพิ่มหน้าใหม่</span>
          </button>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/10 border border-site-border/30 rounded-[12px] shadow-sm border-red-500/30/30 p-2 flex items-center">
              <AlertCircle className="text-red-600 mr-2" size={16} />
              <span className="text-red-400 text-xs">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-400">
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            {
              label: "หน้าทั้งหมด",
              value: pages.length,
              color: "bg-[#181A1D]0/10 text-blue-400 border-blue-500/30",
            },
            {
              label: "เผยแพร่แล้ว",
              value: pages.filter((p) => p.isPublished).length,
              color: "bg-green-500/10 text-green-400 border-green-500/30/30",
            },
            {
              label: "ฉบับร่าง",
              value: pages.filter((p) => !p.isPublished).length,
              color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30/30",
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
              color: "bg-purple-100 text-purple-700 border-purple-500",
            },
          ].map((stat, index) => (
            <div
              key={index}
              className={`p-2 text-center border border-site-border/30 rounded-[12px] shadow-sm ${stat.color}`}>
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
          className="bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm p-2">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search
                className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={12}
              />
              <input
                type="text"
                placeholder="ค้นหาหน้า..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-1 pl-8 pr-3 bg-[#212328] border-[1px] border-gray-300 text-white text-xs placeholder-gray-400 focus:outline-none focus:border-site-accent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1 px-2 bg-[#212328] border-[1px] border-gray-300 text-white text-xs focus:outline-none focus:border-site-accent">
              <option value="ALL">ทุกสถานะ</option>
              <option value="PUBLISHED">เผยแพร่แล้ว</option>
              <option value="DRAFT">ฉบับร่าง</option>
            </select>
            <button
              onClick={loadPages}
              disabled={isLoading}
              className="py-1 px-2 bg-[#1A1C1E] hover:bg-site-border/30 border-[1px] border-gray-300 text-white text-xs flex items-center transition-colors disabled:opacity-50">
              <RefreshCw
                size={12}
                className={`mr-1.5 ${isLoading ? "animate-spin" : ""}`}
              />
              รีเฟรช
            </button>
          </div>
        </motion.div>

        {/* Pages List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm overflow-hidden">
          <div className="p-2 border-b-[2px] border-site-border/50 bg-[#181A1D]">
            <h2 className="text-sm font-bold text-white flex items-center">
              <FileText size={16} className="mr-2" />
              รายการหน้า ({filteredPages.length})
            </h2>
          </div>

          <div className="divide-y-[1px] divide-site-border/30">
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2
                  className="animate-spin mx-auto text-white mb-2"
                  size={28}
                />
                <p className="text-gray-400 text-xs">กำลังโหลด...</p>
              </div>
            ) : filteredPages.length === 0 ? (
              <div className="p-8 text-center">
                <FileText size={28} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-400 text-xs">ไม่พบหน้าเว็บ</p>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("ALL");
                    }}
                    className="text-site-accent hover:underline mt-1 text-xs">
                    ล้างตัวกรอง
                  </button>
                )}
              </div>
            ) : (
              filteredPages.map((page) => (
                <div
                  key={page.id}
                  className="p-2 hover:bg-[#212328]/5 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {page.isPublished ? (
                          <span className="inline-flex items-center px-1 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-medium border border-green-500/30/30">
                            <CheckCircle size={8} className="mr-1" />
                            เผยแพร่
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1 py-0.5 bg-[#1A1C1E] text-gray-400 text-[10px] font-medium border border-gray-400">
                            ฉบับร่าง
                          </span>
                        )}
                        <span className="text-[10px] text-gray-500">
                          /{page.slug}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          v{page.version}
                        </span>
                      </div>
                      <h3 className="font-bold text-white mb-0.5 text-xs">
                        {page.title}
                      </h3>
                      {page.metaDescription && (
                        <p className="text-[10px] text-gray-400 line-clamp-1">
                          {page.metaDescription}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                        <span>
                          แก้ไขล่าสุด:{" "}
                          {new Date(page.updatedAt).toLocaleDateString("th-TH")}
                        </span>
                        {page.publishedAt && (
                          <span>
                            เผยแพร่:{" "}
                            {new Date(page.publishedAt).toLocaleDateString(
                              "th-TH",
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {page.isPublished && (
                        <Link
                          href={`/${page.slug}`}
                          target="_blank"
                          className="p-1 text-gray-400 hover:text-white hover:bg-site-border/30 transition-colors"
                          title="ดูหน้าเว็บ"
                        >
                          <Eye size={14} />
                        </Link>
                      )}
                      <button
                        onClick={() => openEditModal(page)}
                        className="p-1 text-gray-400 hover:text-white hover:bg-site-border/30 transition-colors"
                        title="แก้ไข"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(page.id)}
                        className="p-1 text-red-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="ลบ"
                      >
                        <Trash2 size={14} />
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
                        className="mt-2 p-2 bg-red-500/5 border-[1px] border-red-300">
                        <p className="text-xs text-red-400 mb-2">
                          คุณแน่ใจหรือไม่ว่าต้องการลบหน้านี้?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-2 py-1 text-xs border-[1px] border-gray-300 text-gray-300 hover:bg-[#212328]/5">
                            ยกเลิก
                          </button>
                          <button
                            onClick={() => handleDelete(page.id)}
                            className="px-2 py-1 text-xs bg-red-600 text-white border-[1px] border-red-600 hover:bg-red-700">
                            ยืนยันการลบ
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
              className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-3"
              style={{ zIndex: 9999 }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-3 border-b-[2px] border-site-border/50">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-white">
                      {editingPage ? "แก้ไขหน้า" : "เพิ่มหน้าใหม่"}
                    </h2>
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setEditingPage(null);
                        resetForm();
                      }}
                      className="text-gray-400 hover:text-white">
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <form
                  onSubmit={editingPage ? handleUpdate : handleCreate}
                  className="p-3 space-y-2.5">
                  {/* Slug */}
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium text-xs">
                      URL Slug {editingPage ? "*" : ""}
                    </label>
                    <div className="flex items-center">
                      <span className="px-2 py-1 bg-[#1A1C1E] border-[1px] border-r-0 border-gray-300 text-gray-500 text-xs">
                        /
                      </span>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) =>
                          setFormData({ ...formData, slug: e.target.value })
                        }
                        placeholder="terms, privacy, about"
                        className="flex-1 py-1 px-2 bg-[#212328] border-[1px] border-gray-300 text-white placeholder-gray-500 focus:outline-none focus:border-site-accent transition-colors text-xs"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {editingPage
                        ? "แก้ไข URL ของหน้านี้ได้ (เฉพาะตัวพิมพ์เล็ก, ตัวเลข, และขีดกลาง)"
                        : "จะสร้างอัตโนมัติจากชื่อถ้าไม่กรอก (เฉพาะตัวพิมพ์เล็ก, ตัวเลข, และขีดกลาง)"}
                    </p>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium text-xs">
                      ชื่อหน้า *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="เช่น เงื่อนไขการใช้งาน, นโยบายความเป็นส่วนตัว"
                      required
                      className="w-full py-1 px-2 bg-[#212328] border-[1px] border-gray-300 text-white placeholder-gray-500 focus:outline-none focus:border-site-accent transition-colors text-xs"
                    />
                  </div>

                  {/* AI Generate Section */}
                  <div className="bg-pink-500/10 border-[1px] border-pink-500 p-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center">
                        <Sparkles className="w-3 h-3 text-pink-400 mr-1.5" />
                        <span className="font-medium text-white text-xs">
                          สร้างด้วย AI
                        </span>
                      </div>
                      {!showAIGenerate && (
                        <button
                          type="button"
                          onClick={() => setShowAIGenerate(true)}
                          className="text-[10px] bg-pink-500 text-white px-1.5 py-0.5 border-[1px] border-site-border/50 hover:bg-pink-500/80 transition-colors">
                          <Wand2 className="w-2.5 h-2.5 inline mr-1" />
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
                          className="space-y-1.5">
                          <div>
                            <label className="block text-gray-300 mb-0.5 text-[10px]">
                              หัวข้อที่ต้องการให้ AI เขียน
                            </label>
                            <input
                              type="text"
                              value={aiTopic}
                              onChange={(e) => setAiTopic(e.target.value)}
                              placeholder="เช่น นโยบายความเป็นส่วนตัว, เงื่อนไขการใช้งาน"
                              className="w-full py-1 px-2 bg-[#212328] border-[1px] border-gray-300 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-site-accent"
                            />
                          </div>

                          {/* Model Selector */}
                          <div>
                            <label className="block text-gray-300 mb-0.5 text-[10px]">
                              เลือก AI Model
                            </label>
                            <select
                              value={selectedModel}
                              onChange={(e) => {
                                setSelectedModel(e.target.value);
                                aiService.setModel(e.target.value);
                              }}
                              disabled={
                                isLoadingModels || availableModels.length === 0
                              }
                              className="w-full py-1 px-2 bg-[#212328] border-[1px] border-gray-300 text-white text-xs focus:outline-none focus:border-site-accent disabled:opacity-50">
                              {isLoadingModels ? (
                                <option value="">กำลังโหลด models...</option>
                              ) : availableModels.length === 0 ? (
                                <option value="">ไม่พบ model ที่ใช้ได้</option>
                              ) : (
                                availableModels.map((model) => (
                                  <option key={model.id} value={model.id}>
                                    {model.name || model.id}
                                  </option>
                                ))
                              )}
                            </select>
                          </div>

                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={handleGenerateAIContent}
                              disabled={isGeneratingAI || !aiTopic.trim()}
                              className="flex-1 bg-pink-500 text-white border-[1px] border-site-border/50 py-1 text-xs font-medium flex items-center justify-center disabled:opacity-50 transition-colors">
                              {isGeneratingAI ? (
                                <>
                                  <Loader2 className="w-2.5 h-2.5 animate-spin mr-1.5" />
                                  กำลังสร้าง...
                                </>
                              ) : (
                                <>
                                  <Wand2 className="w-2.5 h-2.5 mr-1.5" />
                                  สร้างเนื้อหา
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowAIGenerate(false);
                                setAiTopic("");
                              }}
                              className="px-1.5 py-1 border-[1px] border-gray-300 text-gray-400 hover:bg-[#212328]/5 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {!aiService.isConfigured() && showAIGenerate && (
                      <div className="mt-1.5 p-1.5 bg-red-500/5 border-[1px] border-red-300 text-red-400 text-[10px]">
                        กรุณาตั้งค่า LITELLM_API_KEY ในไฟล์ .env ของ server
                        ก่อนใช้งาน AI
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium text-xs">
                      เนื้อหา *
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      placeholder="เนื้อหาของหน้า (รองรับ HTML)"
                      required
                      rows={8}
                      className="w-full py-1 px-2 bg-[#212328] border-[1px] border-gray-300 text-white placeholder-gray-500 focus:outline-none focus:border-site-accent transition-colors resize-none font-mono text-xs"
                    />
                  </div>

                  {/* SEO */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-gray-300 mb-1 font-medium text-xs">
                        Meta Title
                      </label>
                      <input
                        type="text"
                        value={formData.metaTitle}
                        onChange={(e) =>
                          setFormData({ ...formData, metaTitle: e.target.value })
                        }
                        placeholder="Title สำหรับ SEO"
                        className="w-full py-1 px-2 bg-[#212328] border-[1px] border-gray-300 text-white placeholder-gray-500 focus:outline-none focus:border-site-accent transition-colors text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-1 font-medium text-xs">
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
                        placeholder="Description สำหรับ SEO"
                        className="w-full py-1 px-2 bg-[#212328] border-[1px] border-gray-300 text-white placeholder-gray-500 focus:outline-none focus:border-site-accent transition-colors text-xs"
                      />
                    </div>
                  </div>

                  {/* Publish Status */}
                  <div className="flex items-center">
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
                        className="w-3 h-3 mr-1.5"
                      />
                      <span className="text-gray-300 text-xs">
                        เผยแพร่หน้านี้
                      </span>
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t-[1px] border-site-border/30">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingPage(null);
                        resetForm();
                      }}
                      className="flex-1 py-1.5 px-2 border border-site-border/30 rounded-[12px] shadow-sm text-white hover:bg-[#212328]/5 transition-colors font-medium text-xs">
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={
                        isSubmitting ||
                        !formData.title?.trim() ||
                        !formData.content?.trim()
                      }
                      className="flex-1 py-1.5 px-2 bg-black text-white border border-site-border/30 rounded-[12px] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed font-medium hover:bg-gray-800 transition-colors text-xs">
                      {isSubmitting ? (
                        <span className="flex items-center justify-center">
                          <Loader2 size={14} className="animate-spin mr-1.5" />
                          กำลังบันทึก...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          <Save size={14} className="mr-1.5" />
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
        document.body
      )}
    </AdminLayout>
  );
}
