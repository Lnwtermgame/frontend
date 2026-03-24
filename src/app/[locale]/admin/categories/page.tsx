"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "@/lib/framer-exports";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  Loader2,
  X,
  Save,
  GripVertical,
  Package,
  AlertCircle,
  CheckCircle2,
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

  return (
    <AdminLayout title={"หมวดหมู่" as any}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="w-1.5 h-5 bg-site-accent mr-2"></span>
            <h1 className="text-lg font-bold text-white">จัดการหมวดหมู่</h1>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-black text-white border border-site-border/30 rounded-[12px] shadow-sm flex items-center gap-1.5 px-2.5 py-1 hover:bg-gray-800 transition-colors font-medium">
            <Plus className="h-3.5 w-3.5" />
            <span className="text-xs">เพิ่มหมวดหมู่</span>
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-[#181A1D] border-[1px] border-blue-300 p-2 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-[10px] text-blue-800">
            <p className="font-medium mb-0.5">
              หมวดหมู่คือแพลตฟอร์มเกมที่กำหนดไว้ล่วงหน้า
            </p>
            <p>
              ใช้สำหรับจัดกลุ่มสินค้าตามแพลตฟอร์ม (Steam, PlayStation, Mobile
              Games ฯลฯ) และช่วยให้ AI Generate เนื้อหาได้แม่นยำยิ่งขึ้น
              หมวดหมู่สามารถเพิ่ม/แก้ไขได้ แต่แนะนำให้ใช้ Seed ที่กำหนดไว้
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-site-border/30 rounded-[12px] shadow-sm border-red-500/30/30 text-red-400 px-3 py-2 text-xs">
            {error}
          </div>
        )}

        {/* Categories Table */}
        <motion.div
          className="bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm overflow-hidden"
          
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="p-3 border-b-[2px] border-site-border/50 bg-[#181A1D]">
            <h3 className="text-sm font-semibold text-white flex items-center">
              <Layers className="mr-2 h-3.5 w-3.5 text-site-accent" />
              รายการหมวดหมู่
              <span className="ml-2 text-[10px] font-normal text-gray-500">
                ({categories.length} หมวดหมู่)
              </span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 text-pink-400 animate-spin" />
              </div>
            ) : categories.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-[10px] border-b border-site-border/30">
                    <th className="px-3 py-1.5 text-center w-8">#</th>
                    <th className="px-3 py-1.5 text-left">ชื่อหมวดหมู่</th>
                    <th className="px-3 py-1.5 text-left">Slug</th>
                    <th className="px-3 py-1.5 text-left">คำอธิบาย</th>
                    <th className="px-3 py-1.5 text-center">สินค้า</th>
                    <th className="px-3 py-1.5 text-center">ลำดับ</th>
                    <th className="px-3 py-1.5 text-left">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-site-border/30">
                  {categories.map((category, index) => (
                    <tr
                      key={category.id}
                      className="text-[10px] hover:bg-[#212328]/5 transition-colors">
                      <td className="px-3 py-2 text-center">
                        <GripVertical className="w-2.5 h-2.5 text-gray-300 mx-auto" />
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-white">
                          {category.name}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <code className="px-1 py-0.5 text-[9px] bg-[#1A1C1E] border border-site-border/30 text-gray-300">
                          {category.slug}
                        </code>
                      </td>
                      <td className="px-3 py-2">
                        <p className="text-gray-400 text-[9px] max-w-xs truncate">
                          {category.description || "-"}
                        </p>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-1 py-0.5 text-[9px] font-medium border ${
                            (category.productCount || 0)> 0
                              ? "bg-[#181A1D] text-blue-400 border-blue-300"
                              : "bg-[#181A1D] text-gray-500 border-gray-300"
                          }`}
                        >
                          <Package className="w-2.5 h-2.5" />
                          {category.productCount || 0}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            onClick={() => moveCategory(index, "up")}
                            disabled={index === 0}
                            className="p-0.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                            title="ขึ้น"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 15l7-7 7 7"
                              />
                            </svg>
                          </button>
                          <span className="text-[9px] text-gray-400 font-mono w-3 text-center">
                            {index + 1}
                          </span>
                          <button
                            onClick={() => moveCategory(index, "down")}
                            disabled={index === categories.length - 1}
                            className="p-0.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                            title="ลง"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => openEditModal(category)}
                            className="p-1 bg-[#1A1C1E] border-[1px] border-gray-300 text-white hover:bg-site-accent hover:text-white hover:border-site-border/50 transition-colors"
                            title="แก้ไข"
                          >
                            <Edit className="h-2.5 w-2.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(category)}
                            className="p-1 bg-[#1A1C1E] border-[1px] border-gray-300 text-white hover:bg-red-500/100 hover:text-white hover:border-site-border/50 transition-colors"
                            title="ลบ"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Layers className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="font-medium text-xs">ยังไม่มีหมวดหมู่</p>
                <p className="text-[10px] mt-1">
                  รัน{" "}
                  <code className="px-1 py-0.5 bg-[#1A1C1E] border border-site-border/30 text-[10px]">
                    npm run db:seed
                  </code>{" "}
                  เพื่อสร้างหมวดหมู่เริ่มต้น
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Seed Info */}
        <div className="bg-[#181A1D] border-[1px] border-gray-300 p-3">
          <h4 className="text-xs font-bold text-gray-300 mb-1.5">
            คำสั่ง Seed หมวดหมู่:
          </h4>
          <code className="block px-2 py-1.5 bg-black text-green-400 text-xs font-mono">
            npm run db:seed
          </code>
          <p className="text-[10px] text-gray-500 mt-1.5">
            คำสั่งนี้จะสร้าง/อัพเดทหมวดหมู่แพลตฟอร์มเกม 11 รายการ (Mobile Games,
            Steam, PlayStation, Xbox, Nintendo, Epic Games, Garena, Roblox, PC
            Gaming, Google Play, App Store)
          </p>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
            onClick={() => !isSaving && closeModal()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm w-full max-w-lg overflow-hidden"
              
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-3 border-b-[2px] border-site-border/50 bg-site-accent flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5" />
                  {editingCategory ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่"}
                </h3>
                <button
                  onClick={closeModal}
                  disabled={isSaving}
                  className="p-1 bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm hover:bg-[#212328]/5 transition-colors disabled:opacity-50">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-3 space-y-2.5">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    ชื่อหมวดหมู่ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm px-2 py-1 text-xs focus:ring-2 focus:ring-site-accent/50 outline-none"
                    placeholder="เช่น Steam, PlayStation"
                    disabled={isSaving}
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    className="w-full bg-[#181A1D] border border-site-border/30 rounded-[12px] shadow-sm border-gray-400 px-2 py-1 text-xs font-mono focus:ring-2 focus:ring-site-accent/50 outline-none"
                    placeholder="steam"
                    disabled={isSaving}
                  />
                  <p className="text-[9px] text-gray-500 mt-0.5">
                    URL-friendly identifier (ภาษาอังกฤษ, ตัวพิมพ์เล็ก, ขีดกลาง)
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    คำอธิบาย
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm border-gray-400 px-2 py-1 text-xs focus:ring-2 focus:ring-site-accent/50 outline-none resize-none"
                    placeholder="คำอธิบายหมวดหมู่ - ใช้ประกอบกับ AI Generate"
                    disabled={isSaving}
                  />
                  <p className="text-[9px] text-gray-500 mt-0.5">
                    คำอธิบายนี้จะถูกส่งให้ AI ใช้เป็นบริบทในการ Generate
                    เนื้อหาสินค้า
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3 border-t-[2px] border-site-border/50 bg-[#181A1D] flex justify-end gap-2">
                <button
                  onClick={closeModal}
                  disabled={isSaving}
                  className="px-2.5 py-1 bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm text-white hover:bg-[#212328]/5 transition-colors font-medium text-xs disabled:opacity-50">
                  ยกเลิก
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-2.5 py-1 bg-site-accent border border-site-border/30 rounded-[12px] shadow-sm text-white hover:bg-blue-600 transition-colors font-medium flex items-center gap-1.5 text-xs disabled:opacity-50">
                  {isSaving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Save className="h-3 w-3" />
                  )}
                  {isSaving
                    ? "กำลังบันทึก..."
                    : editingCategory
                      ? "อัพเดท"
                      : "สร้างหมวดหมู่"}
                </button>
              </div>
            </motion.div>
          </div>,
          document.body,
        )}
    </AdminLayout>
  );
}
