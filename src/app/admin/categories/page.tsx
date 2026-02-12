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

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
}

export default function AdminCategories() {
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
      setError("ไม่สามารถโหลดหมวดหมู่ได้");
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
      toast.error("กรุณากรอกชื่อหมวดหมู่");
      return;
    }
    if (!formData.slug.trim()) {
      toast.error("กรุณากรอก Slug");
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
          toast.success(`อัพเดท "${formData.name}" สำเร็จ`);
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
          toast.success(`สร้าง "${formData.name}" สำเร็จ`);
          closeModal();
          fetchCategories();
        }
      }
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || "เกิดข้อผิดพลาด";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete category
  const handleDelete = async (category: Category) => {
    if (category.productCount && category.productCount > 0) {
      toast.error(
        `ไม่สามารถลบ "${category.name}" ได้ เนื่องจากมีสินค้า ${category.productCount} รายการอยู่ในหมวดหมู่นี้`,
      );
      return;
    }

    if (
      !confirm(
        `คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่ "${category.name}"?\n\nการกระทำนี้จะทำให้หมวดหมู่ไม่แสดงในระบบ (Soft Delete)`,
      )
    )
      return;

    try {
      const res = await productApi.deleteCategory(category.id);
      if (res.success) {
        toast.success(`ลบ "${category.name}" สำเร็จ`);
        fetchCategories();
      }
    } catch (err) {
      toast.error("ไม่สามารถลบหมวดหมู่ได้");
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="w-1.5 h-6 bg-brutal-blue mr-2"></span>
            <h1 className="text-2xl font-bold text-black">จัดการหมวดหมู่</h1>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-black text-white border-[3px] border-black flex items-center gap-2 px-4 py-2 hover:bg-gray-800 transition-colors font-medium"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <Plus className="h-5 w-5" />
            <span>เพิ่มหมวดหมู่</span>
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border-[2px] border-blue-300 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">
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
          <div className="bg-red-100 border-[3px] border-red-500 text-red-700 px-4 py-3">
            {error}
          </div>
        )}

        {/* Categories Table */}
        <motion.div
          className="bg-white border-[3px] border-black overflow-hidden"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="p-5 border-b-[2px] border-black bg-gray-50">
            <h3 className="text-lg font-semibold text-black flex items-center">
              <Layers className="mr-2 h-5 w-5 text-brutal-blue" />
              รายการหมวดหมู่
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({categories.length} หมวดหมู่)
              </span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-brutal-pink animate-spin" />
              </div>
            ) : categories.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="text-gray-600 text-sm border-b border-gray-200">
                    <th className="px-3 py-3 text-center w-12">#</th>
                    <th className="px-5 py-3 text-left">ชื่อหมวดหมู่</th>
                    <th className="px-5 py-3 text-left">Slug</th>
                    <th className="px-5 py-3 text-left">คำอธิบาย</th>
                    <th className="px-5 py-3 text-center">สินค้า</th>
                    <th className="px-5 py-3 text-center">ลำดับ</th>
                    <th className="px-5 py-3 text-left">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {categories.map((category, index) => (
                    <tr
                      key={category.id}
                      className="text-sm hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 py-4 text-center">
                        <GripVertical className="w-4 h-4 text-gray-300 mx-auto" />
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-black">
                          {category.name}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <code className="px-2 py-0.5 text-xs bg-gray-100 border border-gray-200 text-gray-700">
                          {category.slug}
                        </code>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-gray-600 text-xs max-w-xs truncate">
                          {category.description || "-"}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border ${
                            (category.productCount || 0) > 0
                              ? "bg-blue-50 text-blue-700 border-blue-300"
                              : "bg-gray-50 text-gray-500 border-gray-300"
                          }`}
                        >
                          <Package className="w-3 h-3" />
                          {category.productCount || 0}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => moveCategory(index, "up")}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
                            title="ขึ้น"
                          >
                            <svg
                              className="w-4 h-4"
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
                          <span className="text-xs text-gray-400 font-mono w-4 text-center">
                            {index + 1}
                          </span>
                          <button
                            onClick={() => moveCategory(index, "down")}
                            disabled={index === categories.length - 1}
                            className="p-1 text-gray-400 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
                            title="ลง"
                          >
                            <svg
                              className="w-4 h-4"
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
                      <td className="px-5 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(category)}
                            className="p-2 bg-gray-100 border-[2px] border-gray-300 text-black hover:bg-brutal-blue hover:text-white hover:border-black transition-colors"
                            title="แก้ไข"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(category)}
                            className="p-2 bg-gray-100 border-[2px] border-gray-300 text-black hover:bg-red-500 hover:text-white hover:border-black transition-colors"
                            title="ลบ"
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
              <div className="text-center py-12 text-gray-500">
                <Layers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">ยังไม่มีหมวดหมู่</p>
                <p className="text-sm mt-1">
                  รัน{" "}
                  <code className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 text-xs">
                    npm run db:seed
                  </code>{" "}
                  เพื่อสร้างหมวดหมู่เริ่มต้น
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Seed Info */}
        <div className="bg-gray-50 border-[2px] border-gray-300 p-4">
          <h4 className="text-sm font-bold text-gray-700 mb-2">
            คำสั่ง Seed หมวดหมู่:
          </h4>
          <code className="block px-3 py-2 bg-black text-green-400 text-sm font-mono">
            npm run db:seed
          </code>
          <p className="text-xs text-gray-500 mt-2">
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
              className="bg-white border-[3px] border-black w-full max-w-lg overflow-hidden"
              style={{ boxShadow: "8px 8px 0 0 #000000" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-5 border-b-[3px] border-black bg-brutal-blue flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  {editingCategory ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่"}
                </h3>
                <button
                  onClick={closeModal}
                  disabled={isSaving}
                  className="p-2 bg-white border-[2px] border-black hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-bold text-black mb-1.5">
                    ชื่อหมวดหมู่ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full bg-white border-[2px] border-black px-3 py-2 text-sm focus:ring-2 focus:ring-brutal-blue/50 outline-none"
                    placeholder="เช่น Steam, PlayStation"
                    disabled={isSaving}
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-bold text-black mb-1.5">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    className="w-full bg-gray-50 border-[2px] border-gray-400 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-brutal-blue/50 outline-none"
                    placeholder="steam"
                    disabled={isSaving}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL-friendly identifier (ภาษาอังกฤษ, ตัวพิมพ์เล็ก, ขีดกลาง)
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-bold text-black mb-1.5">
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
                    className="w-full bg-white border-[2px] border-gray-400 px-3 py-2 text-sm focus:ring-2 focus:ring-brutal-blue/50 outline-none resize-none"
                    placeholder="คำอธิบายหมวดหมู่ - ใช้ประกอบกับ AI Generate"
                    disabled={isSaving}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    คำอธิบายนี้จะถูกส่งให้ AI ใช้เป็นบริบทในการ Generate
                    เนื้อหาสินค้า
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t-[3px] border-black bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  disabled={isSaving}
                  className="px-4 py-2 bg-white border-[2px] border-black text-black hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-brutal-blue border-[2px] border-black text-white hover:bg-blue-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                  style={{ boxShadow: "2px 2px 0 0 rgba(0,0,0,1)" }}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
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
