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
} from "lucide-react";
import {
  supportApi,
  FaqCategory,
  FaqArticle,
  FaqArticleListItem,
} from "@/lib/services";
import { aiService } from "@/lib/services/ai-api";
import Link from "next/link";

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
    return matchesSearch && matchesCategory && matchesStatus;
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

  return (
    <AdminLayout title="จัดการคำถามที่พบบ่อย (FAQ)">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="w-1.5 h-6 bg-brutal-yellow mr-2"></span>
            <h1 className="text-2xl font-bold text-black">จัดการ FAQ</h1>
          </div>
          <div className="flex gap-3">
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
              className="bg-white border-[3px] border-black px-4 py-2 font-medium flex items-center hover:bg-gray-50 transition-colors"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
            >
              <Tag size={18} className="mr-2" />
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
              className="bg-black text-white border-[3px] border-black px-4 py-2 font-medium flex items-center hover:bg-gray-800 transition-colors disabled:opacity-50"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
            >
              <Plus size={18} className="mr-2" />
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
              className="bg-red-100 border-[3px] border-red-500 p-4 flex items-center"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
            >
              <AlertCircle className="text-red-600 mr-3" size={20} />
              <span className="text-red-700">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-700"
              >
                <X size={18} />
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
              className={`p-4 text-center border-[3px] ${stat.color}`}
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
            >
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs mt-1 font-medium">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Categories Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border-[3px] border-black overflow-hidden"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
        >
          <div className="p-4 border-b-[3px] border-black bg-gray-50">
            <h2 className="text-lg font-bold text-black flex items-center">
              <Tag size={20} className="mr-2" />
              หมวดหมู่ ({categories.length})
            </h2>
          </div>
          <div className="p-4">
            {categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Tag size={48} className="mx-auto mb-4 opacity-30" />
                <p>ยังไม่มีหมวดหมู่</p>
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
                  className="text-brutal-blue hover:underline mt-2"
                >
                  สร้างหมวดหมู่แรก
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="border-[2px] border-black p-4 hover:bg-gray-50 transition-colors"
                    style={{ boxShadow: "2px 2px 0 0 #000000" }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center">
                        {category.icon && (
                          <span className="text-2xl mr-2">{category.icon}</span>
                        )}
                        <h3 className="font-bold text-black">
                          {category.name}
                        </h3>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditCategory(category)}
                          className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-200 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {category.description || "ไม่มีคำอธิบาย"}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
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
          className="bg-white border-[3px] border-black overflow-hidden"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
        >
          <div className="p-4 border-b-[3px] border-black bg-gray-50">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-lg font-bold text-black flex items-center">
                <HelpCircle size={20} className="mr-2" />
                บทความ ({filteredArticles.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {/* Search */}
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="ค้นหาบทความ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="py-2 pl-10 pr-4 bg-white border-[2px] border-gray-300 text-black text-sm placeholder-gray-400 focus:outline-none focus:border-black"
                  />
                </div>
                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="py-2 px-3 bg-white border-[2px] border-gray-300 text-black text-sm focus:outline-none focus:border-black"
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
                  className="py-2 px-3 bg-white border-[2px] border-gray-300 text-black text-sm focus:outline-none focus:border-black"
                >
                  <option value="ALL">ทุกสถานะ</option>
                  <option value="ACTIVE">แสดง</option>
                  <option value="INACTIVE">ไม่แสดง</option>
                  <option value="PINNED">ปักหมุด</option>
                </select>
                {/* Refresh */}
                <button
                  onClick={loadData}
                  disabled={isLoading}
                  className="py-2 px-3 bg-gray-100 hover:bg-gray-200 border-[2px] border-gray-300 text-black text-sm flex items-center transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    size={14}
                    className={`mr-2 ${isLoading ? "animate-spin" : ""}`}
                  />
                  รีเฟรช
                </button>
              </div>
            </div>
          </div>

          <div className="divide-y-[2px] divide-gray-200">
            {isLoading ? (
              <div className="p-12 text-center">
                <Loader2
                  className="animate-spin mx-auto text-black mb-4"
                  size={48}
                />
                <p className="text-gray-600">กำลังโหลด...</p>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="p-12 text-center">
                <HelpCircle size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">ไม่พบบทความ</p>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setCategoryFilter("ALL");
                      setStatusFilter("ALL");
                    }}
                    className="text-brutal-blue hover:underline mt-2"
                  >
                    ล้างตัวกรอง
                  </button>
                )}
              </div>
            ) : (
              filteredArticles.map((article) => (
                <div
                  key={article.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {article.isPinned && (
                        <Pin size={16} className="text-brutal-yellow" />
                      )}
                      {!article.isActive && (
                        <AlertCircle size={16} className="text-gray-400" />
                      )}
                      <h3
                        className={`font-bold ${!article.isActive ? "text-gray-400" : "text-black"}`}
                      >
                        {article.title}
                      </h3>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditArticle(article)}
                        className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-200 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteArticle(article.id)}
                        className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-2">
                    <span className="bg-brutal-blue/10 px-2 py-0.5 border-[1px] border-brutal-blue/30">
                      {article.categoryName}
                    </span>
                    <span className="flex items-center">
                      <Eye size={14} className="mr-1" />
                      {article.viewCount}
                    </span>
                    <span className="flex items-center">
                      <ThumbsUp size={14} className="mr-1" />
                      {article.helpfulCount}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(article.createdAt).toLocaleDateString("th-TH")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {article.excerpt || article.content}
                  </p>

                  {/* Preview */}
                  <button
                    onClick={() =>
                      setExpandedArticle(
                        expandedArticle === article.id ? null : article.id,
                      )
                    }
                    className="mt-2 text-sm text-brutal-blue hover:underline flex items-center"
                  >
                    {expandedArticle === article.id ? (
                      <>
                        <ChevronUp size={16} className="mr-1" />
                        ซ่อนเนื้อหา
                      </>
                    ) : (
                      <>
                        <ChevronDown size={16} className="mr-1" />
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
                        className="mt-3 p-3 bg-gray-100 border-[2px] border-gray-300 overflow-hidden"
                      >
                        <p className="text-sm text-gray-700 whitespace-pre-line">
                          {article.content}
                        </p>
                        <Link
                          href={`/support/faq/${article.slug}`}
                          target="_blank"
                          className="mt-2 inline-flex items-center text-sm text-brutal-blue hover:underline"
                        >
                          <Eye size={14} className="mr-1" />
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
                  className="bg-white border-[3px] border-black w-full max-w-lg max-h-[90vh] overflow-y-auto"
                  style={{ boxShadow: "8px 8px 0 0 #000000" }}
                >
                  <div className="p-6 border-b-[3px] border-black">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-black">
                        {editingCategory ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}
                      </h2>
                      <button
                        onClick={() => setShowCategoryModal(false)}
                        className="text-gray-600 hover:text-black"
                      >
                        <X size={24} />
                      </button>
                    </div>
                  </div>
                  <form
                    onSubmit={
                      editingCategory
                        ? handleUpdateCategory
                        : handleCreateCategory
                    }
                    className="p-6 space-y-4"
                  >
                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">
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
                        className="w-full py-2.5 px-4 bg-white border-[2px] border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:border-black transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">
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
                        className="w-full py-2.5 px-4 bg-white border-[2px] border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:border-black transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">
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
                        className="w-full py-2.5 px-4 bg-white border-[2px] border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:border-black transition-colors resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">
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
                        className="w-full py-2.5 px-4 bg-white border-[2px] border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:border-black transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">
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
                        className="w-full py-2.5 px-4 bg-white border-[2px] border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowCategoryModal(false)}
                        className="flex-1 py-2.5 px-4 border-[3px] border-black text-black hover:bg-gray-100 transition-colors font-medium"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !categoryForm.name.trim()}
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
                  className="bg-white border-[3px] border-black w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                  style={{ boxShadow: "8px 8px 0 0 #000000" }}
                >
                  <div className="p-6 border-b-[3px] border-black">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-black">
                        {editingArticle ? "แก้ไขบทความ" : "เพิ่มบทความ"}
                      </h2>
                      <button
                        onClick={() => setShowArticleModal(false)}
                        className="text-gray-600 hover:text-black"
                      >
                        <X size={24} />
                      </button>
                    </div>
                  </div>
                  <form
                    onSubmit={
                      editingArticle ? handleUpdateArticle : handleCreateArticle
                    }
                    className="p-6 space-y-4"
                  >
                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">
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
                        className="w-full py-2.5 px-4 bg-white border-[2px] border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
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
                      <label className="block text-gray-700 mb-2 font-medium">
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
                        className="w-full py-2.5 px-4 bg-white border-[2px] border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:border-black transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">
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
                        className="w-full py-2.5 px-4 bg-white border-[2px] border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:border-black transition-colors"
                      />
                    </div>

                    {/* AI Generate Section */}
                    <div className="bg-brutal-pink/10 border-[2px] border-brutal-pink p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <Sparkles className="w-5 h-5 text-brutal-pink mr-2" />
                          <span className="font-medium text-black">
                            สร้างด้วย AI
                          </span>
                        </div>
                        {!showAIGenerate && (
                          <button
                            type="button"
                            onClick={() => setShowAIGenerate(true)}
                            disabled={!articleForm.categoryId}
                            className="text-sm bg-brutal-pink text-white px-3 py-1.5 border-[2px] border-black hover:bg-brutal-pink/80 transition-colors disabled:opacity-50"
                            style={{ boxShadow: "2px 2px 0 0 #000000" }}
                          >
                            <Wand2 className="w-4 h-4 inline mr-1" />
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
                            className="space-y-3"
                          >
                            <div>
                              <label className="block text-gray-700 mb-1 text-sm">
                                หัวข้อที่ต้องการให้ AI เขียน
                              </label>
                              <input
                                type="text"
                                value={aiTopic}
                                onChange={(e) => setAiTopic(e.target.value)}
                                placeholder="เช่น วิธีเติมเพชร Free Fire, ขั้นตอนสั่งซื้อสินค้า"
                                className="w-full py-2 px-3 bg-white border-[2px] border-gray-300 text-black text-sm placeholder-gray-500 focus:outline-none focus:border-black"
                              />
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
                                className="flex-1 bg-brutal-pink text-white border-[2px] border-black py-2 font-medium flex items-center justify-center disabled:opacity-50 transition-colors"
                                style={{ boxShadow: "2px 2px 0 0 #000000" }}
                              >
                                {isGeneratingAI ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    กำลังสร้าง...
                                  </>
                                ) : (
                                  <>
                                    <Wand2 className="w-4 h-4 mr-2" />
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
                                className="px-3 py-2 border-[2px] border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            {isGeneratingAI && (
                              <p className="text-xs text-gray-600">
                                AI กำลังสร้างเนื้อหา กรุณารอสักครู่...
                              </p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {!aiService.isConfigured() && showAIGenerate && (
                        <div className="mt-3 p-2 bg-red-50 border-[1px] border-red-300 text-red-700 text-xs">
                          กรุณาตั้งค่า NEXT_PUBLIC_ZAI_API_KEY ในไฟล์ .env
                          ก่อนใช้งาน AI
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">
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
                        rows={8}
                        className="w-full py-2.5 px-4 bg-white border-[2px] border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:border-black transition-colors resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">
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
                        className="w-full py-2.5 px-4 bg-white border-[2px] border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:border-black transition-colors resize-none"
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
                          className="mr-2"
                        />
                        <span className="text-gray-700">แสดงบทความ</span>
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
                          className="mr-2"
                        />
                        <span className="text-gray-700">ปักหมุด</span>
                      </label>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowArticleModal(false)}
                        className="flex-1 py-2.5 px-4 border-[3px] border-black text-black hover:bg-gray-100 transition-colors font-medium"
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
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </AdminLayout>
  );
}
