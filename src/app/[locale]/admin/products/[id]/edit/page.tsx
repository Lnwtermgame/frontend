"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "@/lib/framer-exports";
import {
  AdminLayout,
  AdminPageHeader,
  PageContainer,
} from "@/components/admin";
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
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/* Shared primitives for this form — label/control pairs and section cards */

function FieldLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Label
      className={cn(
        "block text-xs font-medium text-site-dim mb-1.5",
        className
      )}
    >
      {children}
    </Label>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-site-surface border border-site-border-soft rounded-12 p-4 space-y-3",
        className
      )}
    >
      <h3 className="font-semibold text-site-text text-sm flex items-center gap-2">
        <div className="p-1.5 bg-site-accent/10 rounded-lg text-site-accent">
          <Icon className="w-4 h-4" />
        </div>
        {title}
      </h3>
      {children}
    </div>
  );
}

function ToggleRow({
  checked,
  onCheckedChange,
  label,
  description,
  highlight,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
  highlight?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex items-center justify-between gap-3 p-2.5 rounded-lg border border-site-border-soft transition-colors cursor-pointer",
        highlight && checked
          ? "bg-status-success/15"
          : "bg-site-raised/50 hover:bg-site-border/30"
      )}
    >
      <span className="min-w-0">
        <span
          className={cn(
            "text-sm font-medium",
            checked ? "text-site-text" : "text-site-muted"
          )}
        >
          {label}
        </span>
        {description && (
          <span className="block text-[10px] text-site-dim">
            {description}
          </span>
        )}
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}

export default function EditProductPage() {
  const { id } = useParams();
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

  const handleSubmit = async () => {
    if (typeof id !== "string") return;

    setSaving(true);
    try {
      console.log("[EditProduct] Submitting update for product:", id);

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
      <AdminLayout>
        <PageContainer>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-site-accent animate-spin" />
              <p className="text-site-dim font-medium tracking-wide animate-pulse">
                กำลังโหลดข้อมูลสินค้า...
              </p>
            </div>
          </div>
        </PageContainer>
      </AdminLayout>
    );
  }

  if (!product) {
    return (
      <AdminLayout>
        <PageContainer>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="bg-site-surface border border-site-border-soft rounded-12 p-6 inline-block shadow-lg">
                <Package className="w-12 h-12 text-site-dim" />
              </div>
              <h2 className="text-xl font-semibold text-site-text">ไม่พบสินค้า</h2>
              <Link
                href="/admin/products"
                className="inline-flex items-center text-site-accent hover:text-site-accent-hover transition-colors gap-2">
                <ArrowLeft className="w-4 h-4" />
                กลับไปหน้ารายการสินค้า
              </Link>
            </div>
          </div>
        </PageContainer>
      </AdminLayout>
    );
  }

  const isDirectTopUp = product.productType === "DIRECT_TOPUP";

  const filteredCopyProducts = allProducts.filter((p) =>
    imageSearch ? p.name.toLowerCase().includes(imageSearch.toLowerCase()) : true
  );

  return (
    <AdminLayout>
      <PageContainer className="pb-8 max-w-7xl mx-auto">
        {/* Success Banner */}
        {showSuccessBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-status-success border border-transparent rounded-lg p-3 flex items-center gap-3 shadow-lg mb-4">
            <div className="p-1.5 bg-white/10 rounded-md">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">
                บันทึกการเปลี่ยนแปลงสำเร็จ!
              </p>
            </div>
            <button
              onClick={() => setShowSuccessBanner(false)}
              className="p-1 hover:bg-black/10 rounded-md transition-colors">
              <span className="sr-only">ปิด</span>
              <CheckCircle2 className="hidden" />
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <Button asChild variant="secondary" size="icon" className="shrink-0">
              <Link href="/admin/products" aria-label="กลับไปหน้ารายการสินค้า">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-2 flex-wrap">
              <AdminPageHeader
                title="แก้ไขสินค้า"
                description={`${product.name} • รหัส: ${product.id.slice(0, 8)}...`}
              />
              <span
                className={cn(
                  "px-2 py-0.5 text-[10px] font-medium rounded-full border",
                  formData.isActive
                    ? "bg-status-success/15 text-status-success border-status-success/30"
                    : "bg-site-raised text-site-dim border-site-border"
                )}>
                {formData.isActive ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
              </span>
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={saving} size="sm">
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
          </Button>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
          {/* LEFT COLUMN - Main Content */}
          <div className="xl:col-span-2 space-y-5">
            {/* Basic Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-site-surface border border-site-border-soft rounded-12 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-site-text flex items-center gap-2">
                  <div className="p-1.5 bg-site-accent/10 rounded-lg text-site-accent">
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

              <div className="space-y-4">
                <div>
                  <FieldLabel>ชื่อสินค้า</FieldLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="เช่น Mobile Legends Diamonds"
                  />
                </div>

                <div>
                  <FieldLabel>URL สินค้า (Slug)</FieldLabel>
                  <div className="flex rounded-6 border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:border-ring transition-colors overflow-hidden">
                    <span className="px-3 py-2 text-site-dim bg-site-raised border-r border-site-border text-xs flex items-center">
                      /products/
                    </span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({ ...formData, slug: e.target.value })
                      }
                      className="flex-1 bg-transparent px-3 py-2 text-sm text-site-text placeholder:text-muted-foreground outline-none"
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel>คำอธิบายสั้น</FieldLabel>
                  <Textarea
                    value={formData.shortDescription}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        shortDescription: e.target.value,
                      }))
                    }
                    rows={2}
                    maxLength={255}
                    className="min-h-0 resize-none text-sm"
                  />
                  <div className="flex justify-end mt-1">
                    <span className="text-[10px] text-site-dim">
                      {formData.shortDescription.length}/255
                    </span>
                  </div>
                </div>

                <div>
                  <FieldLabel>คำอธิบายแบบเต็ม</FieldLabel>
                  <Textarea
                    key={`desc-${formData.description?.length || 0}`}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={6}
                    className="text-sm"
                  />
                  {process.env.NODE_ENV === "development" && (
                    <div className="text-[10px] text-site-dim mt-1">
                      Debug: length={formData.description?.length || 0}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Media Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-site-surface border border-site-border-soft rounded-12 p-5 space-y-6">
              <h2 className="text-base font-semibold text-site-text flex items-center gap-2">
                <div className="p-1.5 bg-site-accent/10 rounded-lg text-site-accent">
                  <ImageIcon className="w-4 h-4" />
                </div>
                รูปภาพและสื่อ
              </h2>

              <div className="space-y-6">
                {/* Logo Image */}
                <div className="flex flex-col md:flex-row gap-5">
                  <div className="flex-1 space-y-3">
                    <div>
                      <FieldLabel>ลิงก์โลโก้สินค้า</FieldLabel>
                      <Input
                        value={formData.imageUrl}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            imageUrl: e.target.value,
                          })
                        }
                        placeholder="https://..."
                        icon={<Globe className="w-4 h-4" />}
                      />
                      <p className="text-[10px] text-site-dim mt-1">
                        ใส่ลิงก์ HTTPS สำหรับโลโก้สินค้า (แสดงในรายการสินค้า)
                      </p>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleUploadLogo}
                        disabled={
                          uploadingLogo ||
                          !(
                            typeof formData.imageUrl === "string" &&
                            formData.imageUrl.trim()
                          )
                        }
                        className="mt-2">
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
                      </Button>
                    </div>
                  </div>

                  <div className="w-full md:w-36 shrink-0">
                    <FieldLabel className="text-center md:text-left">
                      ดูตัวอย่างโลโก้
                    </FieldLabel>
                    <div className="aspect-square rounded-6 border border-dashed border-site-border bg-site-raised/40 flex items-center justify-center overflow-hidden">
                      {formData.imageUrl && !imageError ? (
                        <img
                          src={formData.imageUrl}
                          alt="Logo Preview"
                          className="w-full h-full object-cover"
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        <div className="text-center p-3">
                          <ImageIcon className="w-6 h-6 text-site-dim mx-auto mb-1" />
                          <span className="text-[10px] text-site-dim block">
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
                <div className="flex flex-col md:flex-row gap-5 pt-5 border-t border-site-border-soft">
                  <div className="flex-1 space-y-3">
                    <div>
                      <FieldLabel>ลิงก์รูปภาพหน้าปก (Cover Image)</FieldLabel>
                      <Input
                        value={formData.coverImageUrl}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            coverImageUrl: e.target.value,
                          })
                        }
                        placeholder="https://..."
                        icon={<Globe className="w-4 h-4" />}
                      />
                      <p className="text-[10px] text-site-dim mt-1">
                        ใส่ลิงก์ HTTPS สำหรับรูปภาพหน้าปก
                        (แสดงในหน้ารายละเอียดสินค้า)
                      </p>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleUploadCover}
                        disabled={
                          uploadingCover ||
                          !(
                            typeof formData.coverImageUrl === "string" &&
                            formData.coverImageUrl.trim()
                          )
                        }
                        className="mt-2">
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
                      </Button>
                    </div>
                  </div>

                  <div className="w-full md:w-48 shrink-0">
                    <FieldLabel className="text-center md:text-left">
                      ดูตัวอย่างหน้าปก
                    </FieldLabel>
                    <div className="aspect-video rounded-6 border border-dashed border-site-border bg-site-raised/40 flex items-center justify-center overflow-hidden">
                      {formData.coverImageUrl && !coverImageError ? (
                        <img
                          src={formData.coverImageUrl}
                          alt="Cover Preview"
                          className="w-full h-full object-cover"
                          onError={() => setCoverImageError(true)}
                        />
                      ) : (
                        <div className="text-center p-3">
                          <ImageIcon className="w-6 h-6 text-site-dim mx-auto mb-1" />
                          <span className="text-[10px] text-site-dim block">
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
                <div className="pt-5 border-t border-site-border-soft">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-site-accent/10 rounded-lg text-site-accent">
                      <Copy className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-sm font-semibold text-site-text">
                      คัดลอกรูปภาพจากสินค้าอื่น
                    </h3>
                  </div>
                  <p className="text-xs text-site-dim mb-3">
                    เลือกสินค้าที่เป็นเกมเดียวกัน (คนละประเทศ)
                    เพื่อนำรูปภาพมาใช้
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                      <Input
                        size="sm"
                        value={imageSearch}
                        onChange={(e) => setImageSearch(e.target.value)}
                        placeholder="ค้นหาชื่อสินค้า..."
                        icon={<Search className="w-3.5 h-3.5" />}
                      />
                    </div>
                    <div className="flex-1">
                      <Select
                        value={selectedProductId}
                        onValueChange={setSelectedProductId}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="เลือกสินค้า..." />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredCopyProducts.map((p) => (
                            <SelectItem key={p.id} value={p.id} className="text-xs">
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCopyImages}
                      disabled={!selectedProductId}>
                      <Copy className="w-3 h-3" />
                      <span>คัดลอก</span>
                    </Button>
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
                className="bg-site-surface border border-site-border-soft rounded-12 p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-semibold text-site-text flex items-center gap-2">
                    <div className="p-1.5 bg-site-accent/10 rounded-lg text-site-accent">
                      <Zap className="w-4 h-4" />
                    </div>
                    การตั้งค่า SEAGM
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshFields}
                    disabled={refreshingFields}>
                    <RefreshCw
                      className={cn(
                        "w-3 h-3",
                        refreshingFields && "animate-spin"
                      )}
                    />
                    ซิงค์ฟิลด์
                  </Button>
                </div>

                <div className="p-4 rounded-6 border border-site-border-soft">
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
                  <div className="mt-3 flex items-start gap-2 p-2.5 rounded-6 bg-site-accent/10 border border-site-accent/30">
                    <AlertCircle className="w-4 h-4 text-site-accent shrink-0 mt-0.5" />
                    <p className="text-xs text-site-muted">
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
              animate={{ opacity: 1, x: 0 }}>
            <SectionCard icon={Globe} title="การแสดงผล">
              <ToggleRow
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
                label={formData.isActive ? "เผยแพร่แล้ว" : "ซ่อน"}
                highlight
              />

              <div className="pt-3 border-t border-site-border-soft space-y-1.5">
                <ToggleRow
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isFeatured: checked })
                  }
                  label="สินค้าแนะนำ"
                />
                <ToggleRow
                  checked={formData.isBestseller}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isBestseller: checked })
                  }
                  label="สินค้าขายดี"
                />
              </div>
            </SectionCard>
            </motion.div>

            {/* Organization Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}>
            <SectionCard icon={Layers} title="การจัดหมวดหมู่">
              <div>
                <FieldLabel className="uppercase tracking-wider text-[10px]">
                  หมวดหมู่
                </FieldLabel>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoryId: value })
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-3 border-t border-site-border-soft">
                <FieldLabel className="uppercase tracking-wider text-[10px]">
                  ประเภทสินค้า
                </FieldLabel>
                <div
                  className={cn(
                    "p-2.5 rounded-6 border border-site-border-soft flex items-center gap-2.5",
                    isDirectTopUp ? "bg-site-accent/10" : "bg-site-raised/40"
                  )}>
                  <div
                    className={cn(
                      "p-1 rounded-md",
                      isDirectTopUp
                        ? "bg-site-accent/15 text-site-accent"
                        : "bg-site-raised text-site-muted"
                    )}>
                    {isDirectTopUp ? (
                      <Zap className="w-4 h-4" />
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-site-accent">
                      {isDirectTopUp ? "เติมตรง" : "บัตรของขวัญ"}
                    </p>
                    <p className="text-[10px] text-site-dim">
                      {isDirectTopUp ? "ต้องใช้ User ID" : "ส่ง PIN ทันที"}
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>
            </motion.div>

            {/* SEO Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}>
            <SectionCard icon={Search} title="การตั้งค่า SEO">
              <div className="space-y-3">
                <div>
                  <FieldLabel>ชื่อ Meta</FieldLabel>
                  <Input
                    size="sm"
                    value={formData.metaTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, metaTitle: e.target.value })
                    }
                    placeholder="เหมือนชื่อสินค้า"
                  />
                </div>

                <div>
                  <FieldLabel>คำอธิบาย Meta</FieldLabel>
                  <Textarea
                    value={formData.metaDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        metaDescription: e.target.value,
                      })
                    }
                    rows={3}
                    className="min-h-0 text-xs resize-none"
                  />
                </div>

                <div>
                  <FieldLabel>คีย์เวิร์ด</FieldLabel>
                  <Input
                    size="sm"
                    value={formData.metaKeywords}
                    onChange={(e) =>
                      setFormData({ ...formData, metaKeywords: e.target.value })
                    }
                    placeholder="เติมเกม, ราคาถูก, โปรโมชั่น"
                  />
                </div>
              </div>
            </SectionCard>
            </motion.div>

            {/* Game Details Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}>
            <SectionCard icon={Package} title="ข้อมูลเกม">
              <div className="space-y-3">
                <div>
                  <FieldLabel>ผู้พัฒนา (Developer)</FieldLabel>
                  <Input
                    size="sm"
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
                    placeholder="เช่น Riot Games, miHoYo"
                  />
                </div>

                <div>
                  <FieldLabel>ผู้จัดจำหน่าย (Publisher)</FieldLabel>
                  <Input
                    size="sm"
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
                    placeholder="เช่น Tencent, Blizzard"
                  />
                </div>

                <div>
                  <FieldLabel>แพลตฟอร์ม (Platforms)</FieldLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {["iOS", "Android", "PC", "Console"].map((platform) => {
                      const isChecked =
                        formData.gameDetails.platforms.includes(platform);
                      return (
                        <label
                          key={platform}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-6 border cursor-pointer transition-colors text-xs font-medium",
                            isChecked
                              ? "bg-site-accent/10 border-site-accent/40 text-site-text"
                              : "bg-site-raised/40 border-site-border-soft text-site-muted hover:bg-site-border/30"
                          )}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormData({
                                ...formData,
                                gameDetails: {
                                  ...formData.gameDetails,
                                  platforms: checked
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
                            className="sr-only"
                          />
                          <span
                            aria-hidden="true"
                            className={cn(
                              "w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors",
                              isChecked
                                ? "bg-site-accent border-site-accent text-site-bg"
                                : "border-site-border bg-transparent"
                            )}>
                            {isChecked && (
                              <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="none">
                                <path
                                  d="M2.5 6l2.5 2.5L9.5 3.5"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </span>
                          {platform}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Mode Selection */}
                <div>
                  <FieldLabel>โหมด (Mode)</FieldLabel>
                  <Select
                    value={formData.gameDetails.mode}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        gameDetails: {
                          ...formData.gameDetails,
                          mode: value as any,
                        },
                      })
                    }>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="-- เลือกโหมด --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="directtopup" className="text-xs">
                        เติมตรง (Direct Top-up)
                      </SelectItem>
                      <SelectItem value="card" className="text-xs">
                        บัตรของขวัญ (Gift Card)
                      </SelectItem>
                      <SelectItem value="mobile-recharge" className="text-xs">
                        เติมเงินมือถือ (Mobile Recharge)
                      </SelectItem>
                      <SelectItem value="gift-card" className="text-xs">
                        บัตรของขวัญทั่วไป (Generic Gift Card)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Region with Country Autocomplete */}
                <div>
                  <FieldLabel>ภูมิภาค/ประเทศ (Region)</FieldLabel>
                  <Input
                    size="sm"
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
                  <p className="text-[10px] text-site-dim mt-0.5">
                    ใช้รหัสประเทศ เช่น th, my, sg, id, ph, vn
                  </p>
                </div>

                {/* Auto Delivery Toggle */}
                <ToggleRow
                  checked={formData.gameDetails.autoDelivery}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      gameDetails: {
                        ...formData.gameDetails,
                        autoDelivery: checked,
                      },
                    })
                  }
                  label="ส่งอัตโนมัติ (Auto Delivery)"
                  description="ระบบจะส่งสินค้าทันทีหลังชำระเงิน"
                />
              </div>
            </SectionCard>
            </motion.div>

            {/* Metadata Info */}
            <div className="px-1 space-y-0.5">
              <div className="flex items-center gap-2 text-[10px] text-site-dim">
                <Calendar className="w-3 h-3" />
                สร้างเมื่อ:{" "}
                {product.createdAt
                  ? new Date(product.createdAt).toLocaleDateString("th-TH")
                  : "-"}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-site-dim">
                <RefreshCw className="w-3 h-3" />
                แก้ไขล่าสุด:{" "}
                {product.updatedAt
                  ? new Date(product.updatedAt).toLocaleDateString("th-TH")
                  : "-"}
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </AdminLayout>
  );
}
