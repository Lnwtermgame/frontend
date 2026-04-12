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
  Upload,
  Copy,
  Search,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { productApi, Product, Category } from "@/lib/services/product-api";
import { GeneratedContent } from "@/lib/services/ai-api";
import { processImageUrl } from "@/lib/services/storage-api";
import DynamicProductFields from "@/components/products/DynamicProductFields";
import AIGenerateButton from "@/components/admin/AIGenerateButton";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshingFields, setRefreshingFields] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [imageSearch, setImageSearch] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    shortDescription: "",
    categoryId: "",
    imageUrl: "",
    coverImageUrl: "",
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
      mode: "" as "directtopup" | "card" | "mobile-recharge" | "gift-card" | "",
      region: "" as string,
      autoDelivery: true,
    },
  });
  const [imageError, setImageError] = useState(false);
  const [coverImageError, setCoverImageError] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (typeof id !== "string") return;

      try {
        setLoading(true);
        const [productRes, categoriesRes, productsRes] = await Promise.all([
          productApi.getProductById(id),
          productApi.getCategories(),
          productApi.getProducts({ limit: 100, isActive: true }),
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
            coverImageUrl: productRes.data.coverImageUrl || "",
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
              mode: (productRes.data.gameDetails as any)?.mode || "",
              region: (productRes.data.gameDetails as any)?.region || "",
              autoDelivery:
                (productRes.data.gameDetails as any)?.autoDelivery ?? true,
            },
          });
          setImageError(false);
          setCoverImageError(false);
        }

        if (categoriesRes.success) {
          setCategories(categoriesRes.data);
        }

        if (productsRes.success) {
          setAllProducts(productsRes.data.filter((p) => p.id !== id));
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

  // Reset cover image error when coverImageUrl changes
  useEffect(() => {
    setCoverImageError(false);
  }, [formData.coverImageUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof id !== "string") return;

    setSaving(true);
    try {
      console.log("[EditProduct] Submitting update for product:", id);
      console.log("[EditProduct] Form data:", formData);
      console.log("[EditProduct] gameDetails:", formData.gameDetails);
      console.log("[EditProduct] imageUrl:", formData.imageUrl);
      console.log("[EditProduct] coverImageUrl:", formData.coverImageUrl);

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
      // Resolve categoryId from AI-selected categorySlug
      let categoryId = prev.categoryId;
      if (content.categorySlug) {
        const matchedCategory = categories.find(
          (c) => c.slug === content.categorySlug,
        );
        if (matchedCategory) {
          categoryId = matchedCategory.id;
        }
      }

      const newFormData = {
        ...prev,
        description: content.description || "",
        shortDescription: content.shortDescription || "",
        metaTitle: content.metaTitle || "",
        metaDescription: content.metaDescription || "",
        metaKeywords: content.metaKeywords || "",
        gameDetails: {
          ...prev.gameDetails,
          developer: content.gameDetails?.developer || "",
          publisher: content.gameDetails?.publisher || "",
          platforms: content.gameDetails?.platforms || [],
        },
        categoryId,
        ...(content.isFeatured !== undefined && {
          isFeatured: content.isFeatured,
        }),
        ...(content.isBestseller !== undefined && {
          isBestseller: content.isBestseller,
        }),
      };
      console.log("[AI Generated] New formData:", newFormData);
      return newFormData;
    });

    toast.success("AI สร้างเนื้อหาสำเร็จ!", {
      duration: 3000,
      position: "top-center",
    });
  };

  const handleCopyImages = () => {
    const selectedProduct = allProducts.find((p) => p.id === selectedProductId);
    if (!selectedProduct) return;

    const imageUrlToUse = selectedProduct.imageUrl || "";
    if (!imageUrlToUse) {
      toast.error("สินค้าที่เลือกไม่มีรูปภาพ");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      imageUrl: imageUrlToUse,
      coverImageUrl: imageUrlToUse,
    }));

    toast.success("คัดลอกรูปภาพจาก " + selectedProduct.name, {
      duration: 3000,
      position: "top-center",
    });
  };

  // Handle image upload to Appwrite Storage
  const handleUploadLogo = async () => {
    if (!formData.imageUrl?.trim()) {
      toast.error("กรุณาใส่ URL รูปภาพก่อน");
      return;
    }

    // Store old image URL before uploading
    const oldImageUrl = formData.imageUrl;

    setUploadingLogo(true);
    try {
      const appwriteUrl = await processImageUrl(
        formData.imageUrl,
        "products/logos",
        oldImageUrl, // Pass old URL to delete after upload
      );
      if (appwriteUrl) {
        // Update form state with new URL
        const newFormData = { ...formData, imageUrl: appwriteUrl };
        setFormData(newFormData);
        setImageError(false);

        // Auto-save to database
        if (typeof id === "string") {
          console.log("[EditProduct] Auto-saving logo URL...", appwriteUrl);
          const response = await productApi.updateProduct(id, newFormData);
          if (response.success) {
            setProduct(response.data);
            toast.success("อัปโหลดและบันทึกโลโก้สำเร็จ!");
          } else {
            toast.error("บันทึกโลโก้ไม่สำเร็จ");
          }
        }
      }
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleUploadCover = async () => {
    if (!formData.coverImageUrl?.trim()) {
      toast.error("กรุณาใส่ URL รูปภาพก่อน");
      return;
    }

    // Store old image URL before uploading
    const oldImageUrl = formData.coverImageUrl;

    setUploadingCover(true);
    try {
      const appwriteUrl = await processImageUrl(
        formData.coverImageUrl,
        "products/covers",
        oldImageUrl, // Pass old URL to delete after upload
      );
      if (appwriteUrl) {
        // Update form state with new URL
        const newFormData = { ...formData, coverImageUrl: appwriteUrl };
        setFormData(newFormData);
        setCoverImageError(false);

        // Auto-save to database
        if (typeof id === "string") {
          console.log("[EditProduct] Auto-saving cover URL...", appwriteUrl);
          const response = await productApi.updateProduct(id, newFormData);
          if (response.success) {
            setProduct(response.data);
            toast.success("อัปโหลดและบันทึกรูปหน้าปกสำเร็จ!");
          } else {
            toast.error("บันทึกรูปหน้าปกไม่สำเร็จ");
          }
        }
      }
    } finally {
      setUploadingCover(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Edit Product">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-site-accent animate-spin" />
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
            <div className="bg-site-surface border border-white/5 rounded-2xl p-6 inline-block shadow-lg">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">ไม่พบสินค้า</h2>
            <Link
              href="/admin/products"
              className="inline-flex items-center text-site-accent hover:text-white transition-colors gap-2">
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
      <div className="pb-8 space-y-6 max-w-7xl mx-auto">
        {/* Success Banner */}
        {showSuccessBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-500 border border-white/5 rounded-xl p-3 flex items-center gap-3 shadow-lg">
            <div className="p-1.5 bg-site-raised border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">
                บันทึกการเปลี่ยนแปลงสำเร็จ!
              </p>
            </div>
            <button
              onClick={() => setShowSuccessBanner(false)}
              className="p-1 hover:bg-black/10 transition-colors">
              <span className="sr-only">ปิด</span>
              <svg
                className="w-4 h-4 text-white"
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
          <div className="flex items-center gap-3">
            <Link
              href="/admin/products"
              className="group p-2 bg-site-surface border border-white/5 rounded-2xl text-gray-400 hover:text-white hover:bg-site-raised/5 transition-all duration-300 shadow-lg hover:shadow-lg hover:translate-x-[1px] hover:translate-y-[1px]">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  แก้ไขสินค้า
                </h1>
                <span
                  className={`px-2 py-0.5 text-[10px] font-medium border-[1px] border-white/10 ${formData.isActive
                      ? "bg-green-500 text-white"
                      : "bg-site-border/30 text-gray-400"
                    }`}>
                  {formData.isActive ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
                </span>
              </div>
              <p className="text-gray-400 text-xs mt-0.5 font-medium">
                {product.name} <span className="mx-1 text-gray-400">•</span>{" "}
                รหัส: {product.id.slice(0, 8)}...
              </p>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="group relative inline-flex items-center gap-2 px-4 py-2 bg-site-accent text-white border border-white/5 rounded-xl font-medium shadow-lg hover:shadow-lg hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden text-sm">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>บันทึกการเปลี่ยนแปลง</span>
              </>
            )}
          </button>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
          {/* LEFT COLUMN - Main Content */}
          <div className="xl:col-span-2 space-y-5">
            {/* Basic Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-site-surface border border-white/5 rounded-2xl p-4 overflow-hidden relative group shadow-lg">
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                <FileText className="w-20 h-20 text-site-accent transform rotate-12 translate-x-6 -translate-y-6" />
              </div>

              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <div className="p-1.5 bg-site-accent/10 border border-white/5 rounded-lg text-site-accent">
                    <FileText className="w-4 h-4" />
                  </div>
                  ข้อมูลทั่วไป
                </h2>
                <AIGenerateButton
                  productName={formData.name || product.name}
                  productType={product.productType}
                  categoryName={
                    categories.find((c) => c.id === formData.categoryId)?.name
                  }
                  categories={categories.map((c) => ({
                    name: c.name,
                    slug: c.slug,
                  }))}
                  onGenerated={handleAIGenerated}
                  disabled={!formData.name}
                />
              </div>

              <div className="space-y-4 relative z-10">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    ชื่อสินค้า
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full bg-site-surface border border-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-site-accent/50 focus:border-site-accent outline-none transition-all"
                    placeholder="เช่น Mobile Legends Diamonds"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    URL สินค้า (Slug)
                  </label>
                  <div className="flex bg-site-surface border border-white/5 rounded-xl focus-within:ring-2 focus-within:ring-site-accent/50 focus-within:border-white/10 transition-all overflow-hidden">
                    <span className="px-3 py-2 text-gray-400 bg-site-raised border-r-2 border-white/10 text-xs flex items-center">
                      /products/
                    </span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({ ...formData, slug: e.target.value })
                      }
                      className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-gray-400 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
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
                      className="w-full bg-site-surface border border-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-site-accent/50 outline-none resize-none transition-all"
                    />
                    <div className="flex justify-end mt-1">
                      <span className="text-[10px] text-gray-400">
                        {formData.shortDescription.length}/255
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
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
                      className="w-full bg-site-surface border border-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-site-accent/50 outline-none transition-all"
                    />
                    {process.env.NODE_ENV === "development" && (
                      <div className="text-[10px] text-gray-400 mt-1">
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
              className="bg-site-surface border border-white/5 rounded-2xl p-5 relative group overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <ImageIcon className="w-20 h-20 text-site-accent transform -rotate-12 translate-x-6 -translate-y-6" />
              </div>

              <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-5">
                <div className="p-1.5 bg-site-accent/10 border border-white/10 text-site-accent">
                  <ImageIcon className="w-4 h-4" />
                </div>
                รูปภาพและสื่อ
              </h2>

              <div className="space-y-6 relative z-10">
                {/* Logo Image */}
                <div className="flex flex-col md:flex-row gap-5">
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">
                        ลิงก์โลโก้สินค้า
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.imageUrl}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              imageUrl: e.target.value,
                            })
                          }
                          placeholder="https://..."
                          className="w-full bg-site-surface border border-white/5 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-site-accent/50 outline-none transition-all"
                        />
                        <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        ใส่ลิงก์ HTTPS สำหรับโลโก้สินค้า (แสดงในรายการสินค้า)
                      </p>
                      <button
                        type="button"
                        onClick={handleUploadLogo}
                        disabled={
                          uploadingLogo ||
                          !(
                            typeof formData.imageUrl === "string" &&
                            formData.imageUrl.trim()
                          )
                        }
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-site-accent text-white border border-white/5 rounded-xl font-medium shadow-lg hover:shadow-lg hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs">
                        {uploadingLogo ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>กำลังอัปโหลด...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3 h-3" />
                            <span>อัปโหลดไปยัง Storage</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="w-full md:w-36 shrink-0">
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 text-center md:text-left">
                      ดูตัวอย่างโลโก้
                    </label>
                    <div className="aspect-square border border-white/5 rounded-xl border-dashed border-gray-400 bg-site-surface flex items-center justify-center overflow-hidden relative group/preview">
                      {formData.imageUrl && !imageError ? (
                        <img
                          src={formData.imageUrl}
                          alt="Logo Preview"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover/preview:scale-110"
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        <div className="text-center p-3">
                          <ImageIcon className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                          <span className="text-[10px] text-gray-400 block">
                            {formData.imageUrl
                              ? "โหลดรูปภาพไม่สำเร็จ"
                              : "ยังไม่มีรูปภาพ"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cover Image */}
                <div className="flex flex-col md:flex-row gap-5 pt-5 border-t border-white/5">
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">
                        ลิงก์รูปภาพหน้าปก (Cover Image)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.coverImageUrl}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              coverImageUrl: e.target.value,
                            })
                          }
                          placeholder="https://..."
                          className="w-full bg-site-surface border border-white/5 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-site-accent/50 outline-none transition-all"
                        />
                        <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        ใส่ลิงก์ HTTPS สำหรับรูปภาพหน้าปก
                        (แสดงในหน้ารายละเอียดสินค้า)
                      </p>
                      <button
                        type="button"
                        onClick={handleUploadCover}
                        disabled={
                          uploadingCover ||
                          !(
                            typeof formData.coverImageUrl === "string" &&
                            formData.coverImageUrl.trim()
                          )
                        }
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-site-accent text-white border border-white/5 rounded-xl font-medium shadow-lg hover:shadow-lg hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs">
                        {uploadingCover ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>กำลังอัปโหลด...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3 h-3" />
                            <span>อัปโหลดไปยัง Storage</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="w-full md:w-48 shrink-0">
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 text-center md:text-left">
                      ดูตัวอย่างหน้าปก
                    </label>
                    <div className="aspect-video border border-white/5 rounded-xl border-dashed border-gray-400 bg-site-surface flex items-center justify-center overflow-hidden relative group/preview">
                      {formData.coverImageUrl && !coverImageError ? (
                        <img
                          src={formData.coverImageUrl}
                          alt="Cover Preview"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover/preview:scale-110"
                          onError={() => setCoverImageError(true)}
                        />
                      ) : (
                        <div className="text-center p-3">
                          <ImageIcon className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                          <span className="text-[10px] text-gray-400 block">
                            {formData.coverImageUrl
                              ? "โหลดรูปภาพไม่สำเร็จ"
                              : "ยังไม่มีรูปภาพ"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Copy Images from Other Products */}
                <div className="pt-5 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-site-accent/10 border border-white/10 text-site-accent">
                      <Copy className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">
                      คัดลอกรูปภาพจากสินค้าอื่น
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">
                    เลือกสินค้าที่เป็นเกมเดียวกัน (คนละประเทศ)
                    เพื่อนำรูปภาพมาใช้
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={imageSearch}
                        onChange={(e) => setImageSearch(e.target.value)}
                        placeholder="ค้นหาชื่อสินค้า..."
                        className="w-full bg-site-surface border border-white/5 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-400 focus:ring-2 focus:ring-site-accent/50 outline-none transition-all"
                      />
                    </div>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="flex-1 bg-site-surface border border-white/5 rounded-xl px-2 py-1.5 text-xs text-white appearance-none focus:ring-2 focus:ring-site-accent/50 outline-none cursor-pointer hover:bg-site-raised/5 transition-colors">
                      <option value="">เลือกสินค้า...</option>
                      {allProducts
                        .filter((p) =>
                          imageSearch
                            ? p.name
                              .toLowerCase()
                              .includes(imageSearch.toLowerCase())
                            : true,
                        )
                        .map((p) => (
                          <option key={p.id} value={p.id} className="bg-site-raised">
                            {p.name}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleCopyImages}
                      disabled={!selectedProductId}
                      className="px-3 py-1.5 bg-site-accent text-white border border-white/5 rounded-xl font-medium shadow-lg hover:shadow-lg hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-xs">
                      <Copy className="w-3 h-3" />
                      <span>คัดลอก</span>
                    </button>
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
                className="bg-site-surface border border-white/5 rounded-2xl p-5 relative shadow-lg">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <div className="p-1.5 bg-site-accent/10 border border-white/10 text-site-accent">
                      <Zap className="w-4 h-4" />
                    </div>
                    การตั้งค่า SEAGM
                  </h2>
                  <button
                    onClick={handleRefreshFields}
                    disabled={refreshingFields}
                    className="text-xs font-medium text-site-accent hover:text-white bg-site-accent/10 hover:bg-site-accent/20 px-2.5 py-1 border-[1px] border-white/10 transition-all flex items-center gap-1.5 shadow-lg hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]">
                    <RefreshCw
                      className={`w-3 h-3 ${refreshingFields ? "animate-spin" : ""}`}
                    />
                    ซิงค์ฟิลด์
                  </button>
                </div>

                <div className="bg-site-surface p-4 border-[1px] border-white/10">
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
                  <div className="mt-3 flex items-start gap-2 p-2.5 bg-site-accent/10 border border-site-accent">
                    <AlertCircle className="w-4 h-4 text-site-accent shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-300">
                      ฟิลด์เหล่านี้ถูกกำหนดโดย API ของ Seagm
                      ค่าที่ผู้ใช้กรอกจะถูกตรวจสอบตามรูปแบบนี้เมื่อชำระเงิน
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* RIGHT COLUMN - Sidebar */}
          <div className="space-y-5">
            {/* Status Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-site-surface border border-white/5 rounded-2xl p-4 space-y-3 shadow-lg">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-site-accent" />
                การแสดงผล
              </h3>

              <div className="space-y-1">
                <label
                  className={`flex items-center gap-3 p-2.5 border border-white/5 rounded-xl transition-all cursor-pointer ${formData.isActive
                      ? "bg-green-500/20"
                      : "bg-site-raised hover:bg-site-border/30"
                    }`}>
                  <div
                    className={`w-8 h-5 relative transition-colors ${formData.isActive ? "bg-green-500" : "bg-gray-400"
                      }`}>
                    <div
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-site-raised border border-white/10 transition-transform ${formData.isActive ? "translate-x-3" : "translate-x-0"
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
                    className={`font-medium text-sm ${formData.isActive ? "text-white" : "text-gray-400"}`}>
                    {formData.isActive ? "เผยแพร่แล้ว" : "ซ่อน"}
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-white/5 space-y-1">
                <label className="flex items-center justify-between group cursor-pointer p-1.5 hover:bg-site-raised/5 transition-colors">
                  <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                    สินค้าแนะนำ
                  </span>
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 border border-white/5 rounded-lg text-site-accent focus:ring-site-accent/50"
                    checked={formData.isFeatured}
                    onChange={(e) =>
                      setFormData({ ...formData, isFeatured: e.target.checked })
                    }
                  />
                </label>
                <label className="flex items-center justify-between group cursor-pointer p-1.5 hover:bg-site-raised/5 transition-colors">
                  <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                    สินค้าขายดี
                  </span>
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 border border-white/5 rounded-lg text-site-accent focus:ring-site-accent/50"
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
              className="bg-site-surface border border-white/5 rounded-2xl p-4 space-y-3 shadow-lg">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-site-accent" />
                การจัดหมวดหมู่
              </h3>

              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  หมวดหมู่
                </label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                    className="w-full bg-site-surface border border-white/5 rounded-xl pl-8 pr-3 py-2 text-sm text-white appearance-none focus:ring-2 focus:ring-site-accent/50 outline-none cursor-pointer hover:bg-site-raised/5 transition-colors">
                    <option value="" className="bg-site-raised">
                      เลือกหมวดหมู่
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-site-raised">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ArrowLeft className="w-3.5 h-3.5 text-gray-400 -rotate-90" />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5">
                <label className="block text-[10px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  ประเภทสินค้า
                </label>
                <div
                  className={`p-2.5 border border-white/5 rounded-xl flex items-center gap-2.5 ${isDirectTopUp ? "bg-site-accent/10" : "bg-site-surface0/10"
                    }`}>
                  <div
                    className={`p-1 border border-white/10 ${isDirectTopUp
                        ? "bg-site-accent/10 text-site-accent"
                        : "bg-blue-200 text-site-accent"
                      }`}>
                    {isDirectTopUp ? (
                      <Zap className="w-4 h-4" />
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p
                      className={`font-medium text-sm ${isDirectTopUp ? "text-site-accent" : "text-site-accent"}`}>
                      {isDirectTopUp ? "เติมตรง" : "บัตรของขวัญ"}
                    </p>
                    <p className="text-[10px] text-gray-400">
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
              className="bg-site-surface border border-white/5 rounded-2xl p-4 space-y-3 shadow-lg">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-site-accent" />
                การตั้งค่า SEO
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1">
                    ชื่อ Meta
                  </label>
                  <input
                    type="text"
                    value={formData.metaTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, metaTitle: e.target.value })
                    }
                    className="w-full bg-site-surface border border-white/5 rounded-xl px-2.5 py-1.5 text-xs text-white focus:ring-1 focus:ring-site-accent/50 outline-none"
                    placeholder="เหมือนชื่อสินค้า"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1">
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
                    className="w-full bg-site-surface border border-white/5 rounded-xl px-2.5 py-1.5 text-xs text-white focus:ring-1 focus:ring-site-accent/50 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1">
                    คีย์เวิร์ด
                  </label>
                  <input
                    type="text"
                    value={formData.metaKeywords}
                    onChange={(e) =>
                      setFormData({ ...formData, metaKeywords: e.target.value })
                    }
                    className="w-full bg-site-surface border border-white/5 rounded-xl px-2.5 py-1.5 text-xs text-white focus:ring-1 focus:ring-site-accent/50 outline-none"
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
              className="bg-site-surface border border-white/5 rounded-2xl p-4 space-y-3 shadow-lg">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-site-accent" />
                ข้อมูลเกม
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1">
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
                    className="w-full bg-site-surface border border-white/5 rounded-xl px-2.5 py-1.5 text-xs text-white focus:ring-1 focus:ring-site-accent/50 outline-none"
                    placeholder="เช่น Riot Games, miHoYo"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1">
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
                    className="w-full bg-site-surface border border-white/5 rounded-xl px-2.5 py-1.5 text-xs text-white focus:ring-1 focus:ring-site-accent/50 outline-none"
                    placeholder="เช่น Tencent, Blizzard"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1.5">
                    แพลตฟอร์ม (Platforms)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["iOS", "Android", "PC", "Console"].map((platform) => (
                      <label
                        key={platform}
                        className={`flex items-center gap-2 p-2 border-[1px] border-white/10 cursor-pointer transition-all ${formData.gameDetails.platforms.includes(platform)
                            ? "bg-site-accent/10 border-white/10"
                            : "bg-site-surface hover:bg-site-raised/5"
                          }`}>
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
                          className="w-3.5 h-3.5 border border-white/10 text-site-accent focus:ring-site-accent/50"
                        />
                        <span className="text-xs text-white">
                          {platform}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Mode Selection */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1">
                    โหมด (Mode)
                  </label>
                  <select
                    value={formData.gameDetails.mode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gameDetails: {
                          ...formData.gameDetails,
                          mode: e.target.value as any,
                        },
                      })
                    }
                    className="w-full bg-site-surface border border-white/5 rounded-xl px-2.5 py-1.5 text-xs text-white appearance-none focus:ring-1 focus:ring-site-accent/50 outline-none cursor-pointer hover:bg-site-raised/5 transition-colors">
                    <option value="">-- เลือกโหมด --</option>
                    <option value="directtopup">เติมตรง (Direct Top-up)</option>
                    <option value="card">บัตรของขวัญ (Gift Card)</option>
                    <option value="mobile-recharge">
                      เติมเงินมือถือ (Mobile Recharge)
                    </option>
                    <option value="gift-card">
                      บัตรของขวัญทั่วไป (Generic Gift Card)
                    </option>
                  </select>
                </div>

                {/* Region with Country Autocomplete */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1">
                    ภูมิภาค/ประเทศ (Region)
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.gameDetails.region}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gameDetails: {
                            ...formData.gameDetails,
                            region: e.target.value,
                          },
                        })
                      }
                      list="country-list"
                      className="w-full bg-site-surface border border-white/5 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-site-accent/50 outline-none"
                      placeholder="เลือกหรือพิมพ์ชื่อประเทศ..."
                    />
                    <datalist id="country-list">
                      <option value="th">ไทย (Thailand)</option>
                      <option value="my">มาเลเซีย (Malaysia)</option>
                      <option value="sg">สิงคโปร์ (Singapore)</option>
                      <option value="id">อินโดนีเซีย (Indonesia)</option>
                      <option value="ph">ฟิลิปปินส์ (Philippines)</option>
                      <option value="vn">เวียดนาม (Vietnam)</option>
                      <option value="cn">จีน (China)</option>
                      <option value="us">สหรัฐอเมริกา (United States)</option>
                      <option value="global">สากล (Global)</option>
                    </datalist>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    ใช้รหัสประเทศ เช่น th, my, sg, id, ph, vn
                  </p>
                </div>

                {/* Auto Delivery Toggle */}
                <div>
                  <label className="flex items-center justify-between p-2.5 border border-white/5 rounded-xl cursor-pointer hover:bg-site-raised/5 transition-colors">
                    <div>
                      <span className="text-xs font-medium text-white">
                        ส่งอัตโนมัติ (Auto Delivery)
                      </span>
                      <p className="text-[10px] text-gray-400">
                        ระบบจะส่งสินค้าทันทีหลังชำระเงิน
                      </p>
                    </div>
                    <div
                      className={`w-8 h-5 relative transition-colors ${formData.gameDetails.autoDelivery
                          ? "bg-green-500"
                          : "bg-gray-400"
                        }`}>
                      <div
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-site-raised border border-white/10 transition-transform ${formData.gameDetails.autoDelivery
                            ? "translate-x-3"
                            : "translate-x-0"
                          }`}
                      />
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.gameDetails.autoDelivery}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gameDetails: {
                            ...formData.gameDetails,
                            autoDelivery: e.target.checked,
                          },
                        })
                      }
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </motion.div>

            {/* Metadata Info */}
            <div className="px-1">
              <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-0.5">
                <Calendar className="w-3 h-3" />
                สร้างเมื่อ:{" "}
                {product.createdAt
                  ? new Date(product.createdAt).toLocaleDateString("th-TH")
                  : "-"}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
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
