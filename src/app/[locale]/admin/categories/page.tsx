"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "@/lib/framer-exports";
import {
  AdminLayout,
  AdminPageHeader,
  PageContainer,
  DataTable,
  type Column,
} from "@/components/admin";
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  Loader2,
  X,
  Save,
  Package,
  AlertCircle,
} from "lucide-react";
import { productApi, Category } from "@/lib/services/product-api";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
}

export default function AdminCategories() {
  const t = useTranslations("AdminPage");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    slug: "",
    description: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await productApi.getCategories();
      // Sort by sortOrder
      const sorted = [...res.data].sort(
        (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
      );
      setCategories(sorted);
    } catch (err) {
      setError(t("categories.load_failed"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: "", slug: "", description: "" });
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
    });
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: "", slug: "", description: "" });
  };

  // Handle name change - auto-generate slug if creating
  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: !editingCategory ? generateSlug(name) : prev.slug,
    }));
  };

  // Save category
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error(t("categories.name_required"));
      return;
    }
    if (!formData.slug.trim()) {
      toast.error(t("categories.slug_required"));
      return;
    }

    setIsSaving(true);
    try {
      if (editingCategory) {
        // Update
        const res = await productApi.updateCategory(editingCategory.id, {
          name: formData.name,
          slug: formData.slug,
          description: formData.description || undefined,
        });
        if (res.success) {
          toast.success(t("categories.save_success"));
          closeModal();
          fetchCategories();
        }
      } else {
        // Create
        const res = await productApi.createCategory({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || undefined,
        });
        if (res.success) {
          toast.success(t("categories.save_success"));
          closeModal();
          fetchCategories();
        }
      }
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || t("common.error");
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete category
  const handleDelete = async (category: Category) => {
    if (category.productCount && category.productCount > 0) {
      toast.error(
        t("categories.delete_has_products", { name: category.name, count: category.productCount }),
      );
      return;
    }

    if (
      !confirm(
        t("categories.delete_confirm", { name: category.name }),
      )
    )
      return;

    try {
      const res = await productApi.deleteCategory(category.id);
      if (res.success) {
        toast.success(t("categories.delete_success"));
        fetchCategories();
      }
    } catch (err) {
      toast.error(t("categories.delete_failed"));
    }
  };

  // Move category up/down
  const moveCategory = async (index: number, direction: "up" | "down") => {
    const newCategories = [...categories];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newCategories.length) return;

    [newCategories[index], newCategories[swapIndex]] = [
      newCategories[swapIndex],
      newCategories[index],
    ];
    setCategories(newCategories);

    try {
      await productApi.reorderCategories(newCategories.map((c) => c.id));
      toast.success("เรียงลำดับสำเร็จ");
    } catch (err) {
      toast.error("ไม่สามารถเรียงลำดับได้");
      fetchCategories(); // Revert
    }
  };

  const columns: Column<Category>[] = [
    {
      key: "name",
      header: "ชื่อหมวดหมู่ & ย่อ (Slug)",
      sortable: true,
      sortAccessor: (c) => c.name,
      render: (c) => (
        <div className="flex flex-col gap-1">
          <span className="font-bold text-[13px] text-site-text">
            {c.name}
          </span>
          <code className="text-[11px] font-mono text-site-dim bg-site-raised px-2 py-0.5 rounded-md border border-site-border-soft w-fit">
            /{c.slug}
          </code>
        </div>
      ),
    },
    {
      key: "description",
      header: "คำอธิบาย",
      render: (c) => (
        <p
          className="text-site-dim text-[12px] line-clamp-2 max-w-sm"
          title={c.description || ""}
        >
          {c.description || (
            <span className="text-site-dim italic">ไม่มีคำอธิบาย</span>
          )}
        </p>
      ),
    },
    {
      key: "productCount",
      header: "สินค้า",
      align: "center",
      sortable: true,
      sortAccessor: (c) => c.productCount || 0,
      render: (c) => {
        const count = c.productCount || 0;
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
              count > 0
                ? "bg-site-accent/10 text-site-accent border border-site-accent/20"
                : "bg-site-raised text-site-dim border border-site-border-soft"
            }`}
          >
            <Package
              className={`w-3.5 h-3.5 ${count > 0 ? "text-site-accent" : "text-site-dim"}`}
            />
            {count}
          </span>
        );
      },
    },
    {
      key: "order",
      header: "จัดเรียง",
      align: "center",
      render: (c) => {
        const index = categories.findIndex((x) => x.id === c.id);
        return (
          <div className="flex items-center justify-center gap-1 bg-site-raised rounded-xl border border-site-border-soft p-1">
            <button
              onClick={() => moveCategory(index, "up")}
              disabled={index === 0}
              className="p-1 rounded-lg text-site-dim hover:text-site-text hover:bg-site-surface disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              title="เลื่อนขึ้น"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <span className="text-[12px] font-bold text-site-text w-5 text-center">
              {index + 1}
            </span>
            <button
              onClick={() => moveCategory(index, "down")}
              disabled={index === categories.length - 1}
              className="p-1 rounded-lg text-site-dim hover:text-site-text hover:bg-site-surface disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              title="เลื่อนลง"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (c) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => openEditModal(c)}
            className="p-2 bg-site-raised border border-site-border-soft rounded-xl text-site-dim hover:text-site-text hover:bg-site-accent/20 hover:border-site-accent/30 transition-all"
            title="แก้ไขหมวดหมู่"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(c)}
            className="p-2 bg-site-raised border border-site-border-soft rounded-xl text-site-dim hover:text-semantic-rose hover:bg-semantic-rose/20 hover:border-semantic-rose/30 transition-all"
            title="ลบหมวดหมู่"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
  <AdminLayout>
    <PageContainer className="pb-12">
      <AdminPageHeader
        title="จัดการหมวดหมู่"
        description="จัดการและจัดกลุ่มแพลตฟอร์มเกม"
        icon={Layers}
        actions={
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-site-accent text-site-bg border border-site-accent/50 rounded-lg px-4 py-2 hover:bg-site-accent-hover transition-all font-bold text-[13px]"
          >
            <Plus className="h-4 w-4" />
            <span>เพิ่มหมวดหมู่ใหม่</span>
          </button>
        }
      />

      {/* Info Banner */}
      <div className="bg-site-raised border border-site-accent/20 rounded-12 p-4 flex items-start gap-3">
        <div className="p-2 bg-site-accent/10 rounded-lg shrink-0">
          <AlertCircle className="w-5 h-5 text-site-accent" />
        </div>
        <div className="text-sm text-site-muted leading-relaxed">
          <p className="font-bold text-site-accent mb-1">
            หมวดหมู่คือแพลตฟอร์มเกมที่กำหนดไว้ล่วงหน้า
          </p>
          <p>
            ใช้สำหรับจัดกลุ่มสินค้าตามแพลตฟอร์ม (Steam, PlayStation, Mobile Games ฯลฯ) และช่วยให้ AI Generate เนื้อหาได้แม่นยำยิ่งขึ้นสามารถใช้คำสั่ง <code className="px-1.5 py-0.5 bg-site-bg rounded-md text-site-accent font-mono text-xs border border-site-border mx-1">npm run db:seed</code> เพื่อสร้างข้อมูลเริ่มต้นได้
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-semantic-rose/10 border border-semantic-rose/30 rounded-lg text-semantic-rose px-4 py-3 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Categories Table */}
      <motion.div
        className="bg-site-surface border border-site-border-soft rounded-12 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="px-4 py-3 border-b border-site-border-soft flex items-center gap-3">
          <div className="p-2 bg-site-raised rounded-lg border border-site-border">
            <Layers className="h-5 w-5 text-site-dim" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-site-text">
              รายการแพลตฟอร์มหมวดหมู่
            </h3>
            <p className="text-xs text-site-muted">
              {categories.length} หมวดหมู่ในระบบ
            </p>
          </div>
        </div>

        <div className="min-h-[300px]">
          <DataTable
            columns={columns}
            data={categories}
            rowKey={(c) => c.id}
            loading={loading}
            empty={{
              icon: Layers,
              title: "ยังไม่มีหมวดหมู่ในระบบ",
              description:
                "คุณสามารถเพิ่มหมวดหมู่ใหม่ หรือรันคำสั่ง Seed เพื่อสร้างข้อมูลเริ่มต้นแบบอัตโนมัติ (npm run db:seed)",
            }}
          />
        </div>
      </motion.div>

      {/* Seed Info */}
      <div className="bg-site-surface border border-site-border-soft rounded-12 p-3">
        <h4 className="text-xs font-bold text-site-muted mb-1.5">
          คำสั่ง Seed หมวดหมู่:
        </h4>
        <code className="block px-2 py-1.5 bg-site-bg text-semantic-green text-xs font-mono rounded">
          npm run db:seed
        </code>
        <p className="text-[11px] text-site-dim mt-1.5">
          คำสั่งนี้จะสร้าง/อัพเดทหมวดหมู่แพลตฟอร์มเกม 11 รายการ (Mobile Games,
          Steam, PlayStation, Xbox, Nintendo, Epic Games, Garena, Roblox, PC
          Gaming, Google Play, App Store)
        </p>
      </div>

    {/* Create/Edit Modal */}
    {isModalOpen &&
      typeof window !== "undefined" &&
      createPortal(
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={() => !isSaving && closeModal()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-site-surface border border-site-border rounded-12 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-site-border-soft flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold text-site-text flex items-center gap-2.5">
                <div className="p-1.5 bg-site-accent/10 rounded-lg">
                  <Layers className="h-4 w-4 text-site-accent" />
                </div>
                {editingCategory ? "แก้ไขข้อมูลหมวดหมู่" : "เพิ่มหมวดหมู่เกมใหม่"}
              </h3>
              <button
                onClick={closeModal}
                disabled={isSaving}
                className="p-2 bg-site-raised border border-site-border rounded-lg hover:bg-site-raised transition-all text-site-dim disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <label className="block text-[13px] font-bold text-site-text">
                  ชื่อแพลตฟอร์ม/หมวดหมู่ <span className="text-semantic-rose">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-site-raised border border-site-border rounded-lg px-4 py-3 text-sm text-site-text focus:ring-2 focus:ring-site-accent/50 focus:border-site-accent outline-none transition-all placeholder:text-site-dim"
                  placeholder="เช่น Steam, PlayStation, Mobile Games"
                  disabled={isSaving}
                  autoFocus
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <label className="block text-[13px] font-bold text-site-text">
                  Slug (URL Path) <span className="text-semantic-rose">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-site-dim font-mono text-[13px]">/category/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))
                    }
                    className="w-full bg-site-raised border border-site-border rounded-lg pl-[85px] pr-4 py-3 text-[13px] text-site-accent font-mono focus:ring-2 focus:ring-site-accent/50 focus:border-site-accent outline-none transition-all placeholder:text-site-dim"
                    placeholder="steam"
                    disabled={isSaving}
                  />
                </div>
                <p className="text-[11px] text-site-muted">
                  * สร้างอัตโนมัติจากชื่อ (ภาษาอังกฤษ, ตัวพิมพ์เล็ก, เลข, ขีดกลางเท่านั้น)
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-[13px] font-bold text-site-text">
                  คำอธิบาย (สำหรับ AI Context)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full bg-site-raised border border-site-border rounded-lg px-4 py-3 text-[13px] text-site-text focus:ring-2 focus:ring-site-accent/50 focus:border-site-accent outline-none transition-all resize-none placeholder:text-site-dim leading-relaxed"
                  placeholder="อธิบายลักษณะของสินค้านี้ เพื่อให้ AI ทำความเข้าใจหมวดหมู่นี้ได้ดียิ่งขึ้นเวลาเขียนคำอธิบายสินค้า..."
                  disabled={isSaving}
                />
                <div className="flex bg-site-accent/10 p-2.5 rounded-lg border border-site-accent/20 gap-2 items-start mt-2">
                  <AlertCircle className="w-3.5 h-3.5 text-site-accent mt-0.5 shrink-0" />
                  <p className="text-[11px] text-site-muted leading-snug">
                    คำอธิบายนี้จะทำงานร่วมกับ GPT-4o ในตอนที่กด<span className="font-bold text-site-accent"> Generate เนื้อหาสินค้าอัตโนมัติ </span>เพื่อให้เนื้อหาตรงหมวดหมู่มากที่สุด
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-site-border-soft flex justify-end gap-3 shrink-0">
              <button
                onClick={closeModal}
                disabled={isSaving}
                className="px-5 py-2.5 bg-site-raised border border-site-border rounded-lg text-site-muted hover:text-site-text hover:bg-site-raised transition-all font-bold text-[13px] disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !formData.name || !formData.slug}
                className="px-6 py-2.5 bg-site-accent text-site-bg border border-site-accent/50 rounded-lg hover:bg-site-accent-hover transition-all font-bold text-[13px] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving
                  ? "กำลังบันทึก..."
                  : editingCategory
                    ? "บันทึกการแก้ไข"
                    : "สร้างหมวดหมู่ใหม่"}
              </button>
            </div>
          </motion.div>
        </div>,
        document.body,
      )}
    </PageContainer>
  </AdminLayout>
  );
}
