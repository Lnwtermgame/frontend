"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "@/lib/framer-exports";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  ArrowLeft,
  Save,
  Loader2,
  Package,
  CreditCard,
  Zap,
  RefreshCw,
  ImageIcon,
  FileText,
  Calendar,
  Layers,
  Globe,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { productApi, Product, Category } from "@/lib/services/product-api";
import { GeneratedContent } from "@/lib/services/ai-api";
import DynamicProductFields from "@/components/products/DynamicProductFields";
import AIGenerateButton from "@/components/admin/AIGenerateButton";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshingFields, setRefreshingFields] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    shortDescription: "",
    categoryId: "",
    imageUrl: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    isActive: true,
    isFeatured: false,
    isBestseller: false,
    gameDetails: {
      developer: "",
      publisher: "",
      platforms: [] as string[],
    },
  });
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (typeof id !== "string") return;

      try {
        setLoading(true);
        const [productRes, categoriesRes] = await Promise.all([
          productApi.getProductById(id),
          productApi.getCategories(),
        ]);

        if (productRes.success) {
          setProduct(productRes.data);
          setFormData({
            name: productRes.data.name,
            slug: productRes.data.slug,
            description: productRes.data.description || "",
            shortDescription: productRes.data.shortDescription || "",
            categoryId: productRes.data.categoryId,
            imageUrl: productRes.data.imageUrl || "",
            metaTitle: productRes.data.metaTitle || "",
            metaDescription: productRes.data.metaDescription || "",
            metaKeywords: productRes.data.metaKeywords || "",
            isActive: productRes.data.isActive,
            isFeatured: productRes.data.isFeatured || false,
            isBestseller: productRes.data.isBestseller || false,
            gameDetails: {
              developer: productRes.data.gameDetails?.developer || "",
              publisher: productRes.data.gameDetails?.publisher || "",
              platforms: productRes.data.gameDetails?.platforms || [],
            },
          });
          setImageError(false);
        }

        if (categoriesRes.success) {
          setCategories(categoriesRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Reset image error when imageUrl changes
  useEffect(() => {
    setImageError(false);
  }, [formData.imageUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof id !== "string") return;

    setSaving(true);
    try {
      console.log("[EditProduct] Submitting update for product:", id);
      console.log("[EditProduct] Form data:", formData);

      const response = await productApi.updateProduct(id, formData);
      console.log("[EditProduct] Update response:", response);

      if (response.success) {
        // Update local product state with new data
        setProduct(response.data);
        // Show success toast
        toast.success("บันทึกการเปลี่ยนแปลงสำเร็จ!", {
          duration: 3000,
          position: "top-center",
        });
        // Show success banner temporarily
        setShowSuccessBanner(true);
        setTimeout(() => setShowSuccessBanner(false), 5000);
        // Stay on the same page - no redirect
      } else {
        toast.error(
          "ไม่สามารถบันทึกได้: " +
            ((response as any).error?.message || "เกิดข้อผิดพลาด"),
        );
      }
    } catch (error) {
      console.error("[EditProduct] Failed to update product:", error);
      const errorMessage =
        error instanceof Error ? error.message : "ไม่สามารถบันทึกสินค้าได้";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshFields = async () => {
    if (typeof id !== "string") return;

    setRefreshingFields(true);
    try {
      const response = await productApi.refreshProductFields(id);
      if (response.success) {
        toast.success(
          `ซิงค์ฟิลด์สำเร็จ! พบ ${response.data.fields.length} ฟิลด์`,
        );
      }
    } catch (error) {
      console.error("Failed to refresh fields:", error);
      toast.error("ไม่สามารถซิงค์ฟิลด์ได้");
    } finally {
      setRefreshingFields(false);
    }
  };

  // Handle AI generated content
  const handleAIGenerated = (content: GeneratedContent) => {
    console.log("[AI Generated] Received content:", content);
    console.log("[AI Generated] Description:", content.description);
    console.log("[AI Generated] Short Description:", content.shortDescription);

    setFormData((prev) => {
      const newFormData = {
        ...prev,
        description: content.description || "",
        shortDescription: content.shortDescription || "",
        metaTitle: content.metaTitle || "",
        metaDescription: content.metaDescription || "",
        metaKeywords: content.metaKeywords || "",
        gameDetails: {
          developer: content.gameDetails?.developer || "",
          publisher: content.gameDetails?.publisher || "",
          platforms: content.gameDetails?.platforms || [],
        },
      };
      console.log("[AI Generated] New formData:", newFormData);
      return newFormData;
    });

    toast.success("AI สร้างเนื้อหาสำเร็จ!", {
      duration: 3000,
      position: "top-center",
    });
  };

  if (loading) {
    return (
      <AdminLayout title="Edit Product">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-brutal-blue animate-spin" />
            <p className="text-gray-600 font-medium tracking-wide animate-pulse">
              กำลังโหลดข้อมูลสินค้า...
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!product) {
    return (
      <AdminLayout title="Edit Product">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="bg-white border-[3px] border-black p-6 inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Package className="w-12 h-12 text-gray-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">ไม่พบสินค้า</h2>
            <Link
              href="/admin/products"
              className="inline-flex items-center text-brutal-blue hover:text-black transition-colors gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              กลับไปหน้ารายการสินค้า
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const isDirectTopUp = product.productType === "DIRECT_TOPUP";

  return (
    <AdminLayout title={`Edit: ${formData.name || "Product"}`}>
      <div className="pb-10 space-y-8 max-w-7xl mx-auto">
        {/* Success Banner */}
        {showSuccessBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-brutal-green border-[3px] border-black p-4 flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="p-2 bg-white border-2 border-black">
              <CheckCircle2 className="w-5 h-5 text-black" />
            </div>
            <div className="flex-1">
              <p className="text-black font-medium">
                บันทึกการเปลี่ยนแปลงสำเร็จ!
              </p>
              <p className="text-sm text-gray-700">
                ข้อมูลสินค้าถูกอัปเดตเรียบร้อยแล้ว
              </p>
            </div>
            <button
              onClick={() => setShowSuccessBanner(false)}
              className="p-1.5 hover:bg-black/10 transition-colors"
            >
              <span className="sr-only">ปิด</span>
              <svg
                className="w-4 h-4 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </motion.div>
        )}

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/products"
              className="group p-2.5 bg-white border-[3px] border-black text-gray-600 hover:text-black hover:bg-gray-50 transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  แก้ไขสินค้า
                </h1>
                <span
                  className={`px-2.5 py-0.5 text-xs font-medium border-[2px] border-black ${
                    formData.isActive
                      ? "bg-brutal-green text-black"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {formData.isActive ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
                </span>
              </div>
              <p className="text-gray-600 text-sm mt-1 font-medium">
                {product.name} <span className="mx-2 text-gray-400">•</span>{" "}
                รหัส: {product.id.slice(0, 8)}...
              </p>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="group relative inline-flex items-center gap-2 px-6 py-2.5 bg-brutal-blue text-white border-[3px] border-black font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>บันทึกการเปลี่ยนแปลง</span>
              </>
            )}
          </button>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* LEFT COLUMN - Main Content */}
          <div className="xl:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-[3px] border-black p-6 overflow-hidden relative group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <FileText className="w-24 h-24 text-brutal-blue transform rotate-12 translate-x-8 -translate-y-8" />
              </div>

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <div className="p-2 bg-brutal-blue/10 border-2 border-black text-brutal-blue">
                    <FileText className="w-5 h-5" />
                  </div>
                  ข้อมูลทั่วไป
                </h2>
                <AIGenerateButton
                  productName={formData.name || product.name}
                  productType={product.productType}
                  categoryName={
                    categories.find((c) => c.id === formData.categoryId)?.name
                  }
                  onGenerated={handleAIGenerated}
                  disabled={!formData.name}
                />
              </div>

              <div className="space-y-5 relative z-10">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    ชื่อสินค้า
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full bg-gray-50 border-[2px] border-black px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-brutal-blue/50 focus:border-black outline-none transition-all"
                    placeholder="เช่น Mobile Legends Diamonds"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    URL สินค้า (Slug)
                  </label>
                  <div className="flex bg-gray-50 border-[2px] border-black focus-within:ring-2 focus-within:ring-brutal-blue/50 focus-within:border-black transition-all overflow-hidden">
                    <span className="px-4 py-3 text-gray-500 bg-gray-100 border-r-2 border-black text-sm flex items-center">
                      /products/
                    </span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({ ...formData, slug: e.target.value })
                      }
                      className="flex-1 bg-transparent px-4 py-3 text-gray-900 placeholder-gray-400 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      คำอธิบายสั้น
                    </label>
                    <textarea
                      value={formData.shortDescription}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          shortDescription: e.target.value,
                        }))
                      }
                      rows={2}
                      maxLength={255}
                      className="w-full bg-gray-50 border-[2px] border-black px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-brutal-blue/50 outline-none resize-none transition-all"
                    />
                    <div className="flex justify-end mt-1">
                      <span className="text-xs text-gray-500">
                        {formData.shortDescription.length}/255
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      คำอธิบายแบบเต็ม
                    </label>
                    <textarea
                      key={`desc-${formData.description?.length || 0}`}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={6}
                      className="w-full bg-gray-50 border-[2px] border-black px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-brutal-blue/50 outline-none transition-all"
                    />
                    {process.env.NODE_ENV === "development" && (
                      <div className="text-xs text-gray-500 mt-1">
                        Debug: length={formData.description?.length || 0}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Media Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border-[3px] border-black p-6 relative group overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <ImageIcon className="w-24 h-24 text-brutal-blue transform -rotate-12 translate-x-8 -translate-y-8" />
              </div>

              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-6">
                <div className="p-2 bg-brutal-blue/10 border-2 border-black text-brutal-blue">
                  <ImageIcon className="w-5 h-5" />
                </div>
                รูปภาพและสื่อ
              </h2>

              <div className="flex flex-col md:flex-row gap-6 relative z-10">
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      ลิงก์รูปภาพหน้าปก
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.imageUrl}
                        onChange={(e) =>
                          setFormData({ ...formData, imageUrl: e.target.value })
                        }
                        placeholder="https://..."
                        className="w-full bg-gray-50 border-[2px] border-black pl-10 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-brutal-blue/50 outline-none transition-all"
                      />
                      <Globe className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      ใส่ลิงก์ HTTPS ที่ปลอดภัยสำหรับรูปภาพสินค้า
                    </p>
                  </div>
                </div>

                <div className="w-full md:w-48 shrink-0">
                  <label className="block text-sm font-medium text-gray-600 mb-2 text-center md:text-left">
                    ดูตัวอย่าง
                  </label>
                  <div className="aspect-square border-[3px] border-dashed border-gray-400 bg-gray-50 flex items-center justify-center overflow-hidden relative group/preview">
                    {formData.imageUrl && !imageError ? (
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/preview:scale-110"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="text-center p-4">
                        <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <span className="text-xs text-gray-500 block">
                          {formData.imageUrl
                            ? "โหลดรูปภาพไม่สำเร็จ"
                            : "ยังไม่มีรูปภาพ"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* SEAGM Fields / Dynamic Fields - Conditional */}
            {isDirectTopUp && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white border-[3px] border-black p-6 relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="p-2 bg-orange-100 border-2 border-black text-orange-600">
                      <Zap className="w-5 h-5" />
                    </div>
                    การตั้งค่า SEAGM
                  </h2>
                  <button
                    onClick={handleRefreshFields}
                    disabled={refreshingFields}
                    className="text-sm font-medium text-brutal-blue hover:text-black bg-brutal-blue/10 hover:bg-brutal-blue/20 px-3 py-1.5 border-[2px] border-black transition-all flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${refreshingFields ? "animate-spin" : ""}`}
                    />
                    ซิงค์ฟิลด์
                  </button>
                </div>

                <div className="bg-gray-50 p-5 border-[2px] border-black">
                  <DynamicProductFields
                    productId={product.id}
                    onFieldsChange={(values, isValid) => {
                      console.log(
                        "Fields changed during edit (readonly mode):",
                        values,
                      );
                    }}
                    disabled={true}
                  />
                  <div className="mt-4 flex items-start gap-3 p-3 bg-brutal-blue/10 border-[2px] border-brutal-blue">
                    <AlertCircle className="w-5 h-5 text-brutal-blue shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      ฟิลด์เหล่านี้ถูกกำหนดโดย API ของ Seagm
                      ค่าที่ผู้ใช้กรอกจะถูกตรวจสอบตามรูปแบบนี้เมื่อชำระเงิน
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* RIGHT COLUMN - Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white border-[3px] border-black p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-brutal-blue" />
                การแสดงผล
              </h3>

              <div className="space-y-1">
                <label
                  className={`flex items-center gap-3 p-3 border-[2px] border-black transition-all cursor-pointer ${
                    formData.isActive
                      ? "bg-brutal-green/20"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <div
                    className={`w-10 h-6 relative transition-colors ${
                      formData.isActive ? "bg-brutal-green" : "bg-gray-400"
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white border border-black transition-transform ${
                        formData.isActive ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="hidden"
                  />
                  <span
                    className={`font-medium ${formData.isActive ? "text-black" : "text-gray-600"}`}
                  >
                    {formData.isActive ? "เผยแพร่แล้ว" : "ซ่อน"}
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t-2 border-gray-200 space-y-2">
                <label className="flex items-center justify-between group cursor-pointer p-2 hover:bg-gray-100 transition-colors">
                  <span className="text-gray-600 group-hover:text-gray-900 transition-colors">
                    สินค้าแนะนำ
                  </span>
                  <input
                    type="checkbox"
                    className="w-4 h-4 border-2 border-black text-brutal-blue focus:ring-brutal-blue/50"
                    checked={formData.isFeatured}
                    onChange={(e) =>
                      setFormData({ ...formData, isFeatured: e.target.checked })
                    }
                  />
                </label>
                <label className="flex items-center justify-between group cursor-pointer p-2 hover:bg-gray-100 transition-colors">
                  <span className="text-gray-600 group-hover:text-gray-900 transition-colors">
                    สินค้าขายดี
                  </span>
                  <input
                    type="checkbox"
                    className="w-4 h-4 border-2 border-black text-brutal-blue focus:ring-brutal-blue/50"
                    checked={formData.isBestseller}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isBestseller: e.target.checked,
                      })
                    }
                  />
                </label>
              </div>
            </motion.div>

            {/* Organization Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border-[3px] border-black p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-brutal-blue" />
                การจัดหมวดหมู่
              </h3>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                  หมวดหมู่
                </label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                    className="w-full bg-gray-50 border-[2px] border-black pl-9 pr-4 py-2.5 text-gray-900 appearance-none focus:ring-2 focus:ring-brutal-blue/50 outline-none cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <option value="" className="bg-white">
                      เลือกหมวดหมู่
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-white">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ArrowLeft className="w-4 h-4 text-gray-500 -rotate-90" />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-gray-200">
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                  ประเภทสินค้า
                </label>
                <div
                  className={`p-3 border-[2px] border-black flex items-center gap-3 ${
                    isDirectTopUp ? "bg-orange-100" : "bg-blue-100"
                  }`}
                >
                  <div
                    className={`p-1.5 border-2 border-black ${
                      isDirectTopUp
                        ? "bg-orange-200 text-orange-700"
                        : "bg-blue-200 text-blue-700"
                    }`}
                  >
                    {isDirectTopUp ? (
                      <Zap className="w-5 h-5" />
                    ) : (
                      <CreditCard className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p
                      className={`font-medium ${isDirectTopUp ? "text-orange-700" : "text-blue-700"}`}
                    >
                      {isDirectTopUp ? "เติมตรง" : "บัตรของขวัญ"}
                    </p>
                    <p className="text-xs text-gray-600">
                      {isDirectTopUp ? "ต้องใช้ User ID" : "ส่ง PIN ทันที"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* SEO Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border-[3px] border-black p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-brutal-blue" />
                การตั้งค่า SEO
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    ชื่อ Meta
                  </label>
                  <input
                    type="text"
                    value={formData.metaTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, metaTitle: e.target.value })
                    }
                    className="w-full bg-gray-50 border-[2px] border-black px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-brutal-blue/50 outline-none"
                    placeholder="เหมือนชื่อสินค้า"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    คำอธิบาย Meta
                  </label>
                  <textarea
                    value={formData.metaDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        metaDescription: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full bg-gray-50 border-[2px] border-black px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-brutal-blue/50 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    คีย์เวิร์ด
                  </label>
                  <input
                    type="text"
                    value={formData.metaKeywords}
                    onChange={(e) =>
                      setFormData({ ...formData, metaKeywords: e.target.value })
                    }
                    className="w-full bg-gray-50 border-[2px] border-black px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-brutal-blue/50 outline-none"
                    placeholder="เติมเกม, ราคาถูก, โปรโมชั่น"
                  />
                </div>
              </div>
            </motion.div>

            {/* Game Details Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white border-[3px] border-black p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-500" />
                ข้อมูลเกม
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    ผู้พัฒนา (Developer)
                  </label>
                  <input
                    type="text"
                    value={formData.gameDetails.developer}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gameDetails: {
                          ...formData.gameDetails,
                          developer: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-gray-50 border-[2px] border-black px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-brutal-blue/50 outline-none"
                    placeholder="เช่น Riot Games, miHoYo"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    ผู้จัดจำหน่าย (Publisher)
                  </label>
                  <input
                    type="text"
                    value={formData.gameDetails.publisher}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gameDetails: {
                          ...formData.gameDetails,
                          publisher: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-gray-50 border-[2px] border-black px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-brutal-blue/50 outline-none"
                    placeholder="เช่น Tencent, Blizzard"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    แพลตฟอร์ม (Platforms)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["iOS", "Android", "PC", "Console"].map((platform) => (
                      <label
                        key={platform}
                        className={`flex items-center gap-2 p-2.5 border-[2px] border-black cursor-pointer transition-all ${
                          formData.gameDetails.platforms.includes(platform)
                            ? "bg-purple-100 border-black"
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.gameDetails.platforms.includes(
                            platform,
                          )}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setFormData({
                              ...formData,
                              gameDetails: {
                                ...formData.gameDetails,
                                platforms: isChecked
                                  ? [
                                      ...formData.gameDetails.platforms,
                                      platform,
                                    ]
                                  : formData.gameDetails.platforms.filter(
                                      (p) => p !== platform,
                                    ),
                              },
                            });
                          }}
                          className="w-4 h-4 border-2 border-black text-purple-600 focus:ring-purple-500/50"
                        />
                        <span className="text-sm text-gray-900">
                          {platform}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Metadata Info */}
            <div className="px-2">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Calendar className="w-3 h-3" />
                สร้างเมื่อ:{" "}
                {product.createdAt
                  ? new Date(product.createdAt).toLocaleDateString("th-TH")
                  : "-"}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <RefreshCw className="w-3 h-3" />
                แก้ไขล่าสุด:{" "}
                {product.updatedAt
                  ? new Date(product.updatedAt).toLocaleDateString("th-TH")
                  : "-"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
