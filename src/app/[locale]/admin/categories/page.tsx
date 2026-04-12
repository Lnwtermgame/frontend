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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-wide flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-site-accent/20 to-site-accent/20 rounded-xl border border-white/5">
              <Layers className="h-6 w-6 text-site-accent" />
            </div>
            จัดการหมวดหมู่
          </h1>
          <p className="text-gray-400 text-sm mt-1 ml-14">จัดการและจัดกลุ่มแพลตฟอร์มเกม</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="bg-gradient-to-r from-site-accent to-site-accent/80 hover:from-site-accent hover:to-site-accent/60 text-white rounded-xl shadow-lg hover:shadow-accent-glow flex items-center gap-2 px-5 py-2.5 transition-all font-bold text-sm">
            <Plus className="h-4 w-4" />
            <span>เพิ่มหมวดหมู่ใหม่</span>
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-site-raised border border-site-accent/20 rounded-2xl p-4 flex items-start gap-3 shadow-inner relative overflow-hidden group">
        <div className="absolute inset-0 bg-site-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="p-2 bg-site-accent/10 rounded-xl shrink-0">
          <AlertCircle className="w-5 h-5 text-site-accent" />
        </div>
        <div className="text-sm text-blue-100/70 leading-relaxed z-10">
          <p className="font-bold text-blue-300 mb-1">
            หมวดหมู่คือแพลตฟอร์มเกมที่กำหนดไว้ล่วงหน้า
          </p>
          <p>
            ใช้สำหรับจัดกลุ่มสินค้าตามแพลตฟอร์ม (Steam, PlayStation, Mobile Games ฯลฯ) และช่วยให้ AI Generate เนื้อหาได้แม่นยำยิ่งขึ้นสามารถใช้คำสั่ง <code className="px-1.5 py-0.5 bg-black/30 rounded-md text-blue-300 font-mono text-xs border border-site-accent/20 mx-1">npm run db:seed</code> เพื่อสร้างข้อมูลเริ่มต้นได้
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 px-4 py-3 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Categories Table */}
      <motion.div
        className="bg-site-raised border border-white/5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="p-5 border-b border-white/5 bg-site-surface/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-site-raised rounded-xl border border-white/5">
              <Layers className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <h3 className="text-[15px] font-black text-white tracking-wide">
                รายการแพลตฟอร์มหมวดหมู่
              </h3>
              <p className="text-[12px] text-gray-400 font-medium">
                {categories.length} หมวดหมู่ในระบบ
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 text-site-accent animate-spin" />
              <p className="text-gray-400 text-sm font-medium">กำลังโหลดข้อมูล...</p>
            </div>
          ) : categories.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-site-surface border-b border-white/5">
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center w-12">#</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">ชื่อหมวดหมู่ & ย่อ (Slug)</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider hidden md:table-cell">คำอธิบาย</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center">สินค้า</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center w-24">จัดเรียง</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {categories.map((category, index) => (
                  <tr
                    key={category.id}
                    className="group hover:bg-site-raised/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-center">
                      <GripVertical className="w-4 h-4 text-gray-600 mx-auto cursor-ns-resize hover:text-gray-400 transition-colors group-hover:text-site-accent/50" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-bold text-[14px] text-white group-hover:text-site-accent transition-colors">
                          {category.name}
                        </span>
                        <code className="text-[11px] font-mono text-gray-400 bg-site-surface px-2 py-0.5 rounded-md border border-white/5 w-fit group-hover:border-site-accent/20 transition-colors">
                          /{category.slug}
                        </code>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-gray-400 text-[13px] line-clamp-2 max-w-sm" title={category.description || ""}>
                        {category.description || <span className="text-gray-700 italic">ไม่มีคำอธิบาย</span>}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${(category.productCount || 0) > 0
                            ? "bg-site-accent/10 text-site-accent border border-site-accent/20"
                            : "bg-site-surface text-gray-400 border border-white/5"
                          } rounded-lg text-[12px] font-bold transition-colors`}>
                          <Package className={`w-3.5 h-3.5 ${(category.productCount || 0) > 0 ? "text-site-accent" : "text-gray-400"}`} />
                          {category.productCount || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1 bg-site-surface rounded-xl border border-white/5 p-1">
                        <button
                          onClick={() => moveCategory(index, "up")}
                          disabled={index === 0}
                          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#2a2d35] disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                          title="เลื่อนขึ้น"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <span className="text-[13px] font-black text-gray-300 w-5 text-center">
                          {index + 1}
                        </span>
                        <button
                          onClick={() => moveCategory(index, "down")}
                          disabled={index === categories.length - 1}
                          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#2a2d35] disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                          title="เลื่อนลง"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(category)}
                          className="p-2 bg-site-surface border border-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-site-accent/20 hover:border-blue-500/30 transition-all"
                          title="แก้ไขหมวดหมู่"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className="p-2 bg-site-surface border border-white/5 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/30 transition-all"
                          title="ลบหมวดหมู่"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-site-raised rounded-full flex items-center justify-center mb-4 border border-white/5 shadow-inner">
                <Layers className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-[16px] font-black text-white mb-2">ยังไม่มีหมวดหมู่ในระบบ</h3>
              <p className="text-gray-400 text-[14px] max-w-sm mb-6">
                คุณสามารถเพิ่มหมวดหมู่ใหม่ หรือรันคำสั่ง Seed เพื่อสร้างข้อมูลเริ่มต้นแบบอัตโนมัติ
              </p>
              <div className="bg-site-surface p-3 rounded-xl border border-white/5 flex items-center gap-3">
                <div className="p-2 bg-site-accent/10 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-site-accent" />
                </div>
                <code className="text-[13px] font-mono text-site-accent font-bold">npm run db:seed</code>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Seed Info */}
      <div className="bg-site-surface border-[1px] border-gray-300 p-3">
        <h4 className="text-xs font-bold text-gray-300 mb-1.5">
          คำสั่ง Seed หมวดหมู่:
        </h4>
        <code className="block px-2 py-1.5 bg-black text-green-400 text-xs font-mono">
          npm run db:seed
        </code>
        <p className="text-[10px] text-gray-400 mt-1.5">
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={() => !isSaving && closeModal()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-site-raised border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-white/5 bg-site-surface flex items-center justify-between shrink-0">
              <h3 className="text-[15px] font-black text-white tracking-wide flex items-center gap-2.5">
                <div className="p-1.5 bg-site-accent/10 rounded-lg">
                  <Layers className="h-4 w-4 text-site-accent" />
                </div>
                {editingCategory ? "แก้ไขข้อมูลหมวดหมู่" : "เพิ่มหมวดหมู่เกมใหม่"}
              </h3>
              <button
                onClick={closeModal}
                disabled={isSaving}
                className="p-2 bg-site-raised border border-white/5 rounded-xl hover:bg-[#2a2d35] hover:border-white/10 transition-all text-gray-400 disabled:opacity-50">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <label className="block text-[13px] font-bold text-gray-300">
                  ชื่อแพลตฟอร์ม/หมวดหมู่ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-site-surface border border-white/10 rounded-xl shadow-inner px-4 py-3 text-[14px] text-white focus:ring-2 focus:ring-site-accent/50 focus:border-site-accent/50 outline-none transition-all placeholder-gray-600"
                  placeholder="เช่น Steam, PlayStation, Mobile Games"
                  disabled={isSaving}
                  autoFocus
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <label className="block text-[13px] font-bold text-gray-300">
                  Slug (URL Path) <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-gray-400 font-mono text-[13px]">/category/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))
                    }
                    className="w-full bg-site-surface border border-white/10 rounded-xl shadow-inner pl-[85px] pr-4 py-3 text-[13px] text-site-accent font-mono focus:ring-2 focus:ring-site-accent/50 focus:border-site-accent/50 outline-none transition-all placeholder-gray-700"
                    placeholder="steam"
                    disabled={isSaving}
                  />
                </div>
                <p className="text-[11px] text-gray-400 font-medium">
                  * สร้างอัตโนมัติจากชื่อ (ภาษาอังกฤษ, ตัวพิมพ์เล็ก, เลข, ขีดกลางเท่านั้น)
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-[13px] font-bold text-gray-300">
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
                  className="w-full bg-site-surface border border-white/10 rounded-xl shadow-inner px-4 py-3 text-[13px] text-gray-300 focus:ring-2 focus:ring-site-accent/50 focus:border-site-accent/50 outline-none transition-all resize-none placeholder-gray-600 leading-relaxed"
                  placeholder="อธิบายลักษณะของสินค้านี้ เพื่อให้ AI ทำความเข้าใจหมวดหมู่นี้ได้ดียิ่งขึ้นเวลาเขียนคำอธิบายสินค้า..."
                  disabled={isSaving}
                />
                <div className="flex bg-site-accent/10 p-2.5 rounded-lg border border-site-accent/20 gap-2 items-start mt-2">
                  <AlertCircle className="w-3.5 h-3.5 text-site-accent mt-0.5 shrink-0" />
                  <p className="text-[11px] text-blue-300/80 leading-snug">
                    คำอธิบายนี้จะทำงานร่วมกับ GPT-4o ในตอนที่กด<span className="font-bold text-blue-300"> Generate เนื้อหาสินค้าอัตโนมัติ </span>เพื่อให้เนื้อหาตรงหมวดหมู่มากที่สุด
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/5 bg-site-surface flex justify-end gap-3 shrink-0">
              <button
                onClick={closeModal}
                disabled={isSaving}
                className="px-5 py-2.5 bg-site-raised border border-white/5 rounded-xl text-gray-300 hover:text-white hover:bg-[#2a2d35] transition-all font-bold text-[13px] disabled:opacity-50">
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !formData.name || !formData.slug}
                className="px-6 py-2.5 bg-gradient-to-r from-site-accent to-site-accent/80 text-white rounded-xl shadow-lg hover:shadow-accent-glow border border-site-accent/50 hover:from-site-accent hover:to-site-accent/60 transition-all font-black text-[13px] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none">
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
  </AdminLayout>
  );
}
