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
  Tag,
  DollarSign,
  FileText,
  Search,
  Calendar,
  Layers,
  Globe,
  Archive,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { productApi, Product, Category } from "@/lib/services/product-api";
import DynamicProductFields from "@/components/products/DynamicProductFields";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshingFields, setRefreshingFields] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    shortDescription: "",
    price: 0,
    comparePrice: 0,
    stockQuantity: 0,
    categoryId: "",
    imageUrl: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    isActive: true,
    isFeatured: false,
    isBestseller: false,
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
            price: productRes.data.price,
            comparePrice: productRes.data.comparePrice || 0,
            stockQuantity: productRes.data.stockQuantity,
            categoryId: productRes.data.categoryId,
            imageUrl: productRes.data.imageUrl || "",
            metaTitle: productRes.data.metaTitle || "",
            metaDescription: productRes.data.metaDescription || "",
            metaKeywords: productRes.data.metaKeywords || "",
            isActive: productRes.data.isActive,
            isFeatured: productRes.data.isFeatured || false,
            isBestseller: productRes.data.isBestseller || false,
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
      const response = await productApi.updateProduct(id, formData);
      if (response.success) {
        router.push("/admin/products");
      }
    } catch (error) {
      console.error("Failed to update product:", error);
      alert("Failed to update product");
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
        alert(`Fields refreshed! Found ${response.data.fields.length} fields.`);
      }
    } catch (error) {
      console.error("Failed to refresh fields:", error);
      alert("Failed to refresh fields");
    } finally {
      setRefreshingFields(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Edit Product">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-mali-blue animate-spin" />
            <p className="text-gray-400 font-medium tracking-wide animate-pulse">
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
            <div className="bg-mali-card p-6 rounded-full inline-block border border-mali-blue/20">
              <Package className="w-12 h-12 text-gray-500" />
            </div>
            <h2 className="text-xl font-semibold text-white">ไม่พบสินค้า</h2>
            <Link
              href="/admin/products"
              className="inline-flex items-center text-mali-blue hover:text-white transition-colors gap-2"
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
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/products"
              className="group p-2.5 bg-mali-card border border-mali-blue/20 rounded-xl text-gray-400 hover:text-white hover:border-mali-blue/50 transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  แก้ไขสินค้า
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    formData.isActive
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                  }`}
                >
                  {formData.isActive ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-1 font-medium">
                {product.name} <span className="mx-2 text-gray-600">•</span>{" "}
                รหัส: {product.id.slice(0, 8)}...
              </p>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="group relative inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-mali-blue to-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 hover:from-blue-500 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
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
              className="bg-mali-card border border-mali-blue/20 rounded-2xl p-6 overflow-hidden relative group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <FileText className="w-24 h-24 text-mali-blue transform rotate-12 translate-x-8 -translate-y-8" />
              </div>

              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
                <div className="p-2 bg-mali-blue/10 rounded-lg text-mali-blue">
                  <FileText className="w-5 h-5" />
                </div>
                ข้อมูลทั่วไป
              </h2>

              <div className="space-y-5 relative z-10">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ชื่อสินค้า
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full bg-mali-dark border border-mali-blue/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-mali-blue/50 focus:border-transparent outline-none transition-all"
                    placeholder="เช่น Mobile Legends Diamonds"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    URL สินค้า (Slug)
                  </label>
                  <div className="flex rounded-xl bg-mali-dark border border-mali-blue/20 focus-within:ring-2 focus-within:ring-mali-blue/50 focus-within:border-transparent transition-all overflow-hidden">
                    <span className="px-4 py-3 text-gray-500 bg-black/20 border-r border-mali-blue/10 text-sm flex items-center">
                      /products/
                    </span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({ ...formData, slug: e.target.value })
                      }
                      className="flex-1 bg-transparent px-4 py-3 text-white placeholder-gray-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      คำอธิบายสั้น
                    </label>
                    <textarea
                      value={formData.shortDescription}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shortDescription: e.target.value,
                        })
                      }
                      rows={2}
                      maxLength={255}
                      className="w-full bg-mali-dark border border-mali-blue/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-mali-blue/50 outline-none resize-none transition-all"
                    />
                    <div className="flex justify-end mt-1">
                      <span className="text-xs text-gray-500">
                        {formData.shortDescription.length}/255
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      คำอธิบายแบบเต็ม
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={6}
                      className="w-full bg-mali-dark border border-mali-blue/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-mali-blue/50 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Media Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-mali-card border border-mali-blue/20 rounded-2xl p-6 relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ImageIcon className="w-24 h-24 text-mali-blue transform -rotate-12 translate-x-8 -translate-y-8" />
              </div>

              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
                <div className="p-2 bg-mali-blue/10 rounded-lg text-mali-blue">
                  <ImageIcon className="w-5 h-5" />
                </div>
                รูปภาพและสื่อ
              </h2>

              <div className="flex flex-col md:flex-row gap-6 relative z-10">
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
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
                        className="w-full bg-mali-dark border border-mali-blue/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-mali-blue/50 outline-none transition-all"
                      />
                      <Globe className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      ใส่ลิงก์ HTTPS ที่ปลอดภัยสำหรับรูปภาพสินค้า
                    </p>
                  </div>
                </div>

                <div className="w-full md:w-48 shrink-0">
                  <label className="block text-sm font-medium text-gray-300 mb-2 text-center md:text-left">
                    ดูตัวอย่าง
                  </label>
                  <div className="aspect-square rounded-2xl border-2 border-dashed border-mali-blue/30 bg-mali-dark/30 flex items-center justify-center overflow-hidden relative group/preview">
                    {formData.imageUrl && !imageError ? (
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/preview:scale-110"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="text-center p-4">
                        <ImageIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <span className="text-xs text-gray-600 block">
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

            {/* Inventory & Pricing Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-mali-card border border-mali-blue/20 rounded-2xl p-6 relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Tag className="w-24 h-24 text-mali-blue transform rotate-6 translate-x-8 -translate-y-8" />
              </div>

              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
                <div className="p-2 bg-mali-blue/10 rounded-lg text-mali-blue">
                  <Tag className="w-5 h-5" />
                </div>
                ราคาและสต็อก
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ราคาขาย
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                      ฿
                    </span>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: parseFloat(e.target.value),
                        })
                      }
                      className="w-full bg-mali-dark border border-mali-blue/20 rounded-xl pl-8 pr-4 py-3 text-white font-medium focus:ring-2 focus:ring-mali-blue/50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ราคาเปรียบเทียบ
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                      ฿
                    </span>
                    <input
                      type="number"
                      value={formData.comparePrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          comparePrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-mali-dark border border-mali-blue/20 rounded-xl pl-8 pr-4 py-3 text-white font-medium focus:ring-2 focus:ring-mali-blue/50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    จำนวนสต็อก
                    <span className="text-xs text-mali-blue bg-mali-blue/10 px-2 py-0.5 rounded-full">
                      ทั้งหมด
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.stockQuantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          stockQuantity: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-mali-dark border border-mali-blue/20 rounded-xl px-4 py-3 text-white font-medium focus:ring-2 focus:ring-mali-blue/50 outline-none transition-all"
                    />
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
                className="bg-mali-card border border-mali-blue/20 rounded-2xl p-6 relative"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                      <Zap className="w-5 h-5" />
                    </div>
                    การตั้งค่า SEAGM
                  </h2>
                  <button
                    onClick={handleRefreshFields}
                    disabled={refreshingFields}
                    className="text-sm font-medium text-mali-blue hover:text-white bg-mali-blue/10 hover:bg-mali-blue/30 px-3 py-1.5 rounded-lg transition-all flex items-center gap-2"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${refreshingFields ? "animate-spin" : ""}`}
                    />
                    ซิงค์ฟิลด์
                  </button>
                </div>

                <div className="bg-mali-dark/30 rounded-xl p-5 border border-mali-blue/10">
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
                  <div className="mt-4 flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-200/80">
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
              className="bg-mali-card border border-mali-blue/20 rounded-2xl p-5 space-y-4"
            >
              <h3 className="font-semibold text-white text-base flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-mali-blue" />
                การแสดงผล
              </h3>

              <div className="space-y-1">
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    formData.isActive
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-mali-dark/30 border-transparent hover:bg-mali-dark"
                  }`}
                >
                  <div
                    className={`w-10 h-6 rounded-full relative transition-colors ${
                      formData.isActive ? "bg-green-500" : "bg-gray-600"
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
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
                    className={`font-medium ${formData.isActive ? "text-green-400" : "text-gray-400"}`}
                  >
                    {formData.isActive ? "เผยแพร่แล้ว" : "ซ่อน"}
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t border-mali-blue/10 space-y-2">
                <label className="flex items-center justify-between group cursor-pointer p-2 hover:bg-mali-blue/5 rounded-lg transition-colors">
                  <span className="text-gray-300 group-hover:text-white transition-colors">
                    สินค้าแนะนำ
                  </span>
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-500 text-mali-blue focus:ring-mali-blue/50"
                    checked={formData.isFeatured}
                    onChange={(e) =>
                      setFormData({ ...formData, isFeatured: e.target.checked })
                    }
                  />
                </label>
                <label className="flex items-center justify-between group cursor-pointer p-2 hover:bg-mali-blue/5 rounded-lg transition-colors">
                  <span className="text-gray-300 group-hover:text-white transition-colors">
                    สินค้าขายดี
                  </span>
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-500 text-mali-blue focus:ring-mali-blue/50"
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
              className="bg-mali-card border border-mali-blue/20 rounded-2xl p-5 space-y-4"
            >
              <h3 className="font-semibold text-white text-base flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-mali-blue" />
                การจัดหมวดหมู่
              </h3>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                  หมวดหมู่
                </label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                    className="w-full bg-mali-dark border border-mali-blue/20 rounded-xl pl-9 pr-4 py-2.5 text-white appearance-none focus:ring-2 focus:ring-mali-blue/50 outline-none cursor-pointer hover:bg-mali-dark/70 transition-colors"
                  >
                    <option value="" className="bg-gray-900">
                      เลือกหมวดหมู่
                    </option>
                    {categories.map((cat) => (
                      <option
                        key={cat.id}
                        value={cat.id}
                        className="bg-gray-900"
                      >
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ArrowLeft className="w-4 h-4 text-gray-500 -rotate-90" />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-mali-blue/10">
                <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                  ประเภทสินค้า
                </label>
                <div
                  className={`p-3 rounded-xl border flex items-center gap-3 ${
                    isDirectTopUp
                      ? "bg-orange-500/10 border-orange-500/20"
                      : "bg-blue-500/10 border-blue-500/20"
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg ${
                      isDirectTopUp
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-blue-500/20 text-blue-400"
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
                      className={`font-medium ${isDirectTopUp ? "text-orange-400" : "text-blue-400"}`}
                    >
                      {isDirectTopUp ? "เติมตรง" : "บัตรของขวัญ"}
                    </p>
                    <p className="text-xs text-gray-500">
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
              className="bg-mali-card border border-mali-blue/20 rounded-2xl p-5 space-y-4"
            >
              <h3 className="font-semibold text-white text-base flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-mali-blue" />
                การตั้งค่า SEO
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    ชื่อ Meta
                  </label>
                  <input
                    type="text"
                    value={formData.metaTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, metaTitle: e.target.value })
                    }
                    className="w-full bg-mali-dark border border-mali-blue/20 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-mali-blue/50 outline-none"
                    placeholder="เหมือนชื่อสินค้า"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
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
                    className="w-full bg-mali-dark border border-mali-blue/20 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-mali-blue/50 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    คีย์เวิร์ด
                  </label>
                  <input
                    type="text"
                    value={formData.metaKeywords}
                    onChange={(e) =>
                      setFormData({ ...formData, metaKeywords: e.target.value })
                    }
                    className="w-full bg-mali-dark border border-mali-blue/20 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-mali-blue/50 outline-none"
                    placeholder="เติมเกม, ราคาถูก, โปรโมชั่น"
                  />
                </div>
              </div>
            </motion.div>

            {/* Metadata Info */}
            <div className="px-2">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Calendar className="w-3 h-3" />
                สร้างเมื่อ: {new Date(product.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <RefreshCw className="w-3 h-3" />
                แก้ไขล่าสุด: {new Date(product.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
