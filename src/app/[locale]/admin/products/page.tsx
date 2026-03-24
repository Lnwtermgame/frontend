"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion } from "@/lib/framer-exports";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Package,
  Loader2,
  RefreshCw,
  CreditCard,
  Zap,
  ExternalLink,
  DollarSign,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  X,
  Settings,
  Gamepad2,
  Smartphone,
  ImageIcon,
  Upload,
  Download,
  CheckSquare,
  Square,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  productApi,
  Product,
  Category,
  ProductType,
  AdminProduct,
  AdminProductType,
} from "@/lib/services/product-api";
import Link from "next/link";
import toast from "react-hot-toast";
import AIGenerateAllButton from "@/components/admin/AIGenerateAllButton";
import { isAppwriteUrl, processImageUrl } from "@/lib/services/storage-api";
import ExportProductsModal from "@/components/admin/ExportProductsModal";
import { useAuth } from "@/lib/hooks/use-auth";
import { useTranslations } from "next-intl";

export default function AdminProducts() {
  const t = useTranslations("AdminPage");
  const router = useRouter();
  const { isAdmin, isInitialized, isSessionChecked } = useAuth();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [productTypeFilter, setProductTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  // Modal states for price editing
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(
    null,
  );
  const [editingTypes, setEditingTypes] = useState<AdminProductType[]>([]);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [sellingPrices, setSellingPrices] = useState<Record<string, string>>(
    {},
  );
  const [selectedPricingOption, setSelectedPricingOption] = useState<
    string | null
  >(null);

  // Bulk pricing states
  const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);
  const [bulkPricingStrategy, setBulkPricingStrategy] = useState<string | null>(
    null,
  );
  const [customPercent, setCustomPercent] = useState<string>("10");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Fast image modal states
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageUpdatingProduct, setImageUpdatingProduct] =
    useState<AdminProduct | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageTarget, setImageTarget] = useState<"logo" | "cover">("logo");
  const [copySourceProductId, setCopySourceProductId] = useState<string>("");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkToggling, setIsBulkToggling] = useState(false);

  const filteredProducts = useMemo<AdminProduct[]>(() => {
    return products.filter((product) => {
      const matchesType =
        productTypeFilter === "all" ||
        product.productType === productTypeFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? product.isActive : !product.isActive);

      return matchesType && matchesStatus;
    });
  }, [products, productTypeFilter, statusFilter]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isPriceModalOpen || isBulkPriceModalOpen || isImageModalOpen || isExportModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isPriceModalOpen, isBulkPriceModalOpen, isImageModalOpen, isExportModalOpen]);

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      // Wait for auth/session restore to complete before calling protected admin APIs.
      if (!isInitialized || !isSessionChecked || !isAdmin) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [productsRes, categoriesRes] = await Promise.all([
          productApi.getProductsAdmin({
            page: pagination.page,
            limit: pagination.limit,
            search: searchTerm || undefined,
            categoryId:
              selectedCategory === "all" ? undefined : selectedCategory,
          }),
          productApi.getCategories(),
        ]);

        setProducts(productsRes.data);
        setCategories(categoriesRes.data);
        setPagination((prev) => ({
          ...prev,
          total: productsRes.meta.total,
          totalPages: productsRes.meta.totalPages,
        }));
      } catch (err) {
        setError("ไม่สามารถโหลดสินค้าได้");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    pagination.page,
    pagination.limit,
    searchTerm,
    selectedCategory,
    isInitialized,
    isSessionChecked,
    isAdmin,
  ]);

  const handleSyncSeagm = () => {
    router.push("/admin/seagm-sync");
  };

  const getProductTypeIcon = (productType: string) => {
    if (productType === "CARD") {
      return <CreditCard className="w-4 h-4 text-site-accent" />;
    }
    if ((productType as any) === "MOBILE_RECHARGE") {
      return <Smartphone className="w-4 h-4 text-green-400" />;
    }
    return <Gamepad2 className="w-4 h-4 text-orange-500" />; // DIRECT_TOPUP
  };

  const getProductTypeLabel = (productType: string) => {
    if (productType === "CARD") {
      return "บัตร";
    }
    if ((productType as any) === "MOBILE_RECHARGE") {
      return "เติมเงินมือถือ";
    }
    return "เติมเกม";
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบสินค้านี้?")) return;

    try {
      await productApi.deleteProduct(productId);
      setProducts(products.filter((p) => p.id !== productId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      toast.success("ลบสินค้าสำเร็จ");
    } catch (err) {
      console.error("ไม่สามารถลบสินค้า:", err);
      toast.error("ไม่สามารถลบสินค้าได้");
    }
  };

  // Bulk selection helpers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (
      !confirm(
        `คุณแน่ใจหรือไม่ที่จะลบสินค้า ${ids.length} รายการ?\n\n⚠️ การกระทำนี้จะลบสินค้าและประเภทสินค้าทั้งหมดที่เกี่ยวข้องอย่างถาวร!`,
      )
    )
      return;

    setIsBulkDeleting(true);
    try {
      const res = await productApi.bulkDeleteProducts(ids);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
        toast.success(`ลบสินค้าสำเร็จ ${res.data.deletedCount} รายการ`);
        clearSelection();
      }
    } catch (err) {
      console.error("Bulk delete failed:", err);
      toast.error("ไม่สามารถลบสินค้าได้");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkToggleActive = async (isActive: boolean) => {
    const ids = Array.from(selectedIds);
    const label = isActive ? "เปิดขาย" : "ปิดขาย";
    if (!confirm(`ตั้งสถานะ "${label}" ให้กับสินค้า ${ids.length} รายการ?`))
      return;

    setIsBulkToggling(true);
    try {
      const res = await productApi.bulkToggleActive(ids, isActive);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) =>
            selectedIds.has(p.id) ? { ...p, isActive } : p,
          ),
        );
        toast.success(`อัปเดตสถานะสำเร็จ ${res.data.updatedCount} รายการ`);
        clearSelection();
      }
    } catch (err) {
      console.error("Bulk toggle failed:", err);
      toast.error("ไม่สามารถอัปเดตสถานะได้");
    } finally {
      setIsBulkToggling(false);
    }
  };

  const getStatusStyles = (product: Product | AdminProduct) => {
    if (!product.isActive) {
      return "text-gray-300 bg-[#1A1C1E] border-gray-300";
    }
    return "text-green-400 bg-green-500/10 border-green-300";
  };

  const getStatusText = (product: Product | AdminProduct) => {
    if (!product.isActive) {
      return "ไม่ใช้งาน";
    }
    return "ใช้งาน";
  };

  const openImageModal = (product: AdminProduct) => {
    setImageUpdatingProduct(product);
    setImageUrlInput(product.imageUrl || "");
    setImageError(false);
    setImageTarget("logo");
    setCopySourceProductId("");
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setImageUpdatingProduct(null);
    setImageUrlInput("");
    setIsUploadingImage(false);
    setIsSavingImage(false);
    setImageError(false);
    setImageTarget("logo");
    setCopySourceProductId("");
  };

  const handleTargetChange = (target: "logo" | "cover") => {
    if (!imageUpdatingProduct) return;
    setImageTarget(target);
    setImageError(false);
    setImageUrlInput(
      target === "logo"
        ? imageUpdatingProduct.imageUrl || ""
        : imageUpdatingProduct.coverImageUrl || "",
    );
  };

  const copyImageFromOtherProduct = () => {
    if (!copySourceProductId || !imageUpdatingProduct) return;
    const source = products.find((p) => p.id === copySourceProductId);
    if (!source) return;

    const urlToCopy =
      imageTarget === "logo"
        ? source.imageUrl || ""
        : source.coverImageUrl || "";

    if (!urlToCopy) {
      toast.error("สินค้าที่เลือกไม่มีรูปภาพสำหรับคัดลอก");
      return;
    }

    setImageUrlInput(urlToCopy);
    setImageError(false);
    toast.success(`คัดลอกรูปภาพจาก ${source.name}`);
  };

  const handleUploadImage = async () => {
    if (!imageUrlInput.trim() || !imageUpdatingProduct) return;

    setIsUploadingImage(true);
    try {
      const isLogo = imageTarget === "logo";
      const newUrl = await processImageUrl(
        imageUrlInput,
        isLogo ? "products/logos" : "products/covers",
        isLogo
          ? imageUpdatingProduct.imageUrl
          : imageUpdatingProduct.coverImageUrl,
      );
      if (!newUrl) return;

      setImageUrlInput(newUrl);
      setImageError(false);

      // Auto-save to product record with new Appwrite URL
      const payload = isLogo ? { imageUrl: newUrl } : { coverImageUrl: newUrl };
      const response = await productApi.updateProduct(
        imageUpdatingProduct.id,
        payload,
      );

      if (response.success) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === imageUpdatingProduct.id ? { ...p, ...payload } : p,
          ),
        );
        setImageUpdatingProduct((prev) =>
          prev ? { ...prev, ...payload } : prev,
        );
        toast.success("อัปโหลดและบันทึกรูปภาพสำเร็จ");
      } else {
        toast.error("อัปโหลดสำเร็จแต่บันทึกสินค้าไม่สำเร็จ");
      }
    } catch (error) {
      console.error("Failed to save uploaded image:", error);
      toast.error("บันทึกรูปภาพไม่สำเร็จ");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const saveImageUrl = async () => {
    if (!imageUpdatingProduct) return;
    if (!imageUrlInput.trim()) {
      toast.error("กรุณาใส่ลิงก์รูปภาพ");
      return;
    }

    setIsSavingImage(true);
    try {
      // Ensure URL is stored from Appwrite; if not, upload first
      let finalUrl = imageUrlInput;
      if (!isAppwriteUrl(finalUrl)) {
        const uploaded = await processImageUrl(
          imageUrlInput,
          imageTarget === "logo" ? "products/logos" : "products/covers",
          imageTarget === "logo"
            ? imageUpdatingProduct.imageUrl
            : imageUpdatingProduct.coverImageUrl,
        );
        if (!uploaded) {
          setIsSavingImage(false);
          return;
        }
        finalUrl = uploaded;
        setImageUrlInput(finalUrl);
      }

      const payload =
        imageTarget === "logo"
          ? { imageUrl: finalUrl }
          : { coverImageUrl: finalUrl };

      const response = await productApi.updateProduct(
        imageUpdatingProduct.id,
        payload,
      );

      if (response.success) {
        toast.success("บันทึกรูปภาพสำเร็จ");
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id !== imageUpdatingProduct.id) return p;
            return {
              ...p,
              ...(imageTarget === "logo"
                ? { imageUrl: imageUrlInput }
                : { coverImageUrl: imageUrlInput }),
            };
          }),
        );
        closeImageModal();
      } else {
        toast.error("ไม่สามารถบันทึกรูปภาพได้");
      }
    } catch (error) {
      console.error("Failed to update image:", error);
      toast.error("ไม่สามารถบันทึกรูปภาพได้");
    } finally {
      setIsSavingImage(false);
    }
  };

  // Calculate profit percentage
  const calculateProfitPercent = (
    originPrice?: number,
    sellingPrice?: number,
  ) => {
    if (!originPrice || !sellingPrice || originPrice === 0) return 0;
    return ((sellingPrice - originPrice) / originPrice) * 100;
  };

  // Fast pricing options
  const pricingOptions = [
    { key: "mid", label: "ราคากลาง", description: "ระหว่างต้นทุน-SEAGM" },
    {
      key: "nearSeagm",
      label: "ใกล้เคียง SEAGM",
      description: "ลด 3% จาก SEAGM",
    },
    { key: "smallProfit", label: "กำไรบาง", description: "บวก 5% จากต้นทุน" },
    { key: "seagm", label: "ราคา SEAGM", description: "เท่ากับ SEAGM" },
  ];

  const applyPricingOption = (optionKey: string) => {
    setSelectedPricingOption(optionKey);
    const newPrices: Record<string, string> = {};

    editingTypes.forEach((type) => {
      const originPrice = type.originPrice
        ? parseFloat(type.originPrice as any)
        : 0;
      const unitPrice = type.unitPrice ? parseFloat(type.unitPrice as any) : 0;
      const costPrice = unitPrice;
      const seagmPrice = originPrice || unitPrice;

      let calculatedPrice = seagmPrice;

      switch (optionKey) {
        case "mid":
          // ราคากลางระหว่างต้นทุนและ SEAGM
          calculatedPrice = (costPrice + seagmPrice) / 2;
          break;
        case "nearSeagm":
          // ลด 3% จากราคา SEAGM (ขายถูกกว่า SEAGM เล็กน้อย)
          calculatedPrice = seagmPrice * 0.97;
          break;
        case "smallProfit":
          // บวก 5% จากต้นทุน (กำไรบาง)
          calculatedPrice = costPrice * 1.05;
          break;
        case "seagm":
          // ใช้ราคา SEAGM เต็ม
          calculatedPrice = seagmPrice;
          break;
        default:
          calculatedPrice = seagmPrice;
      }

      // ตรวจสอบว่าราคาที่คำนวณไม่ต่ำกว่าต้นทุน (ยกเว้นกรณีใกล้เคียง SEAGM ที่อาจต่ำกว่าต้นทุนได้ถ้า SEAGM กำหนดมาต่ำ)
      if (optionKey !== "nearSeagm" && calculatedPrice < costPrice) {
        calculatedPrice = costPrice * 1.02; // ถ้าคำนวณได้ต่ำกว่าต้นทุน ให้ใช้ต้นทุน + 2%
      }

      newPrices[type.id] = calculatedPrice.toFixed(2);
    });

    setSellingPrices(newPrices);
  };

  // Open price editing modal
  const openPriceModal = (product: AdminProduct) => {
    setSelectedProduct(product);
    // Use pre-fetched types from admin API if available
    if (product.seagmTypes && product.seagmTypes.length > 0) {
      setEditingTypes(product.seagmTypes);
      const prices: Record<string, string> = {};
      product.seagmTypes.forEach((type) => {
        const defaultPrice =
          type.sellingPrice || type.originPrice || type.unitPrice;
        prices[type.id] = defaultPrice.toString();
      });
      setSellingPrices(prices);
      setIsPriceModalOpen(true);
    } else if (product.seagmProductId) {
      // Fallback to fetch if needed
      productApi
        .getGameTypesById(product.seagmProductId)
        .then((res) => {
          if (res.success) {
            // Need to cast to AdminProductType because the public API returns sanitized types
            // but the admin needs full data. However, getGameTypesById is hitting /games/...
            // which we secured for admin only, but it returns whatever the controller returns.
            // Actually, we should rely on seagmTypes from getProductsAdmin mostly.
            // If we must fetch, we assume the response is compatible enough or we need an admin endpoint for types.
            // For now, let's assume it works or we rely on getProductsAdmin data.
            setEditingTypes(res.data as unknown as AdminProductType[]);
            const prices: Record<string, string> = {};
            res.data.forEach((type) => {
              const adminType = type as unknown as AdminProductType;
              const defaultPrice =
                adminType.sellingPrice ||
                adminType.originPrice ||
                adminType.unitPrice;
              prices[type.id] = defaultPrice.toString();
            });
            setSellingPrices(prices);
            setIsPriceModalOpen(true);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch product types:", err);
          toast.error("ไม่สามารถโหลดข้อมูลราคาได้");
        });
    } else {
      toast.error("สินค้านี้ไม่มีข้อมูลราคาจาก SEAGM");
    }
  };

  // Close price modal
  const closePriceModal = () => {
    setIsPriceModalOpen(false);
    setSelectedProduct(null);
    setEditingTypes([]);
    setSellingPrices({});
  };

  // Handle price change
  const handlePriceChange = (typeId: string, value: string) => {
    setSellingPrices((prev) => ({
      ...prev,
      [typeId]: value,
    }));
  };

  // Save selling prices
  const saveSellingPrices = async () => {
    if (!selectedProduct) return;

    try {
      const response = await productApi.updateSellingPrices(sellingPrices);
      if (response.success) {
        toast.success("บันทึกราคาสำเร็จ");
        closePriceModal();
      } else {
        toast.error("ไม่สามารถบันทึกราคาได้");
      }
    } catch (err) {
      console.error("Failed to save prices:", err);
      toast.error("ไม่สามารถบันทึกราคาได้");
    }
  };

  // Bulk pricing options (for all products)
  const bulkPricingOptions = [
    { key: "mid", label: "ราคากลาง", description: "ระหว่างต้นทุน-SEAGM" },
    {
      key: "nearSeagm",
      label: "ใกล้เคียง SEAGM",
      description: "ลด 3% จาก SEAGM",
    },
    { key: "smallProfit", label: "กำไรบาง", description: "บวก 5% จากต้นทุน" },
    { key: "seagm", label: "ราคา SEAGM", description: "เท่ากับ SEAGM" },
    {
      key: "custom",
      label: "กำหนดเอง",
      description: "บวก X% จากต้นทุน",
    },
  ];

  // Execute bulk pricing update
  const executeBulkPricing = async () => {
    if (!bulkPricingStrategy) {
      toast.error("กรุณาเลือกกลยุทธ์การตั้งราคา");
      return;
    }

    if (
      bulkPricingStrategy === "custom" &&
      (!customPercent || parseFloat(customPercent) < -50)
    ) {
      toast.error("กรุณากรอกเปอร์เซ็นต์ที่ถูกต้อง (มากกว่า -50)");
      return;
    }

    const confirmed = confirm(
      `คุณแน่ใจหรือไม่ที่จะตั้งราคาทุกสินค้าตามกลยุทธ์ "${bulkPricingOptions.find((o) => o.key === bulkPricingStrategy)?.label}"?\n\nการกระทำนี้จะเปลี่ยนแปลงราคาขายของทุกประเภทสินค้าในระบบ`,
    );

    if (!confirmed) return;

    setIsBulkUpdating(true);
    try {
      const response = await productApi.bulkUpdateSellingPrices(
        bulkPricingStrategy as any,
        bulkPricingStrategy === "custom"
          ? parseFloat(customPercent)
          : undefined,
      );
      if (response.success) {
        toast.success(
          `อัพเดทราคาสำเร็จ! แก้ไข ${response.data.affectedCount} รายการ`,
        );
        setIsBulkPriceModalOpen(false);
        setBulkPricingStrategy(null);
      } else {
        toast.error("ไม่สามารถอัพเดทราคาได้");
      }
    } catch (err) {
      console.error("Failed to bulk update prices:", err);
      toast.error("ไม่สามารถอัพเดทราคาได้");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  return (
    <AdminLayout title={"สินค้า" as any}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center">
          <span className="w-1.5 h-6 bg-site-accent mr-2"></span>
          <h1 className="text-xl font-bold text-white">จัดการสินค้า</h1>
        </div>

        {/* Actions Bar */}
        <div className="bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm p-3">
          <div className="flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
            {/* Search */}
            <div className="relative w-full lg:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="ค้นหาสินค้า..."
                className="bg-[#181A1D] border border-site-border/30 rounded-[12px] shadow-sm text-white pl-9 pr-3 py-1.5 w-full focus:ring-2 focus:ring-site-accent/50 focus:border-site-accent focus:outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              <AIGenerateAllButton products={products} categories={categories} />
              <button
                onClick={() => setIsBulkPriceModalOpen(true)}
                className="bg-orange-500/10 border border-site-border/30 rounded-[12px] shadow-sm text-white flex items-center justify-center gap-2 px-3 py-1.5 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-lg transition-all font-medium text-sm">
                <Settings className="h-4 w-4" />
                <span>ตั้งราคาทั้งหมด</span>
              </button>
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="bg-green-500 border border-site-border/30 rounded-[12px] shadow-sm text-white flex items-center justify-center gap-2 px-3 py-1.5 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-lg transition-all font-medium text-sm">
                <Download className="h-4 w-4" />
                <span>Export ข้อมูล</span>
              </button>
              <button
                onClick={handleSyncSeagm}
                className="bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm text-white flex items-center justify-center gap-2 px-3 py-1.5 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-lg transition-all font-medium text-sm">
                <RefreshCw className="h-4 w-4" />
                <span>ซิงค์ SEAGM</span>
              </button>
              <button
                className="bg-black text-white border border-site-border/30 rounded-[12px] shadow-sm flex items-center justify-center gap-2 px-3 py-1.5 hover:bg-gray-800 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-lg transition-all font-bold text-sm">
                <Plus className="h-4 w-4" />
                <span>เพิ่มสินค้า</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-site-border/30 rounded-[12px] shadow-sm text-red-400 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        {/* Products Table */}
        <motion.div
          className="bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm overflow-hidden"
          
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="p-3 border-b-[2px] border-site-border/50 bg-[#181A1D]">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <div className="p-1 bg-site-accent/10 border-[1px] border-site-border/50">
                  <Package className="h-3.5 w-3.5 text-site-accent" />
                </div>
                รายการสินค้า
                <span className="text-xs font-normal text-gray-500 ml-1">({filteredProducts.length})</span>
              </h3>

              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2 bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm px-2 py-1 text-xs">
                  <span className="font-bold text-gray-300">หมวดหมู่:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-transparent outline-none text-gray-200 cursor-pointer">
                    <option value="all">ทุกหมวดหมู่</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm px-2 py-1 text-xs">
                  <span className="font-bold text-gray-300">ประเภท:</span>
                  <select
                    value={productTypeFilter}
                    onChange={(e) => setProductTypeFilter(e.target.value)}
                    className="bg-transparent outline-none text-gray-200 cursor-pointer">
                    <option value="all">ทั้งหมด</option>
                    <option value="DIRECT_TOPUP">เติมเกม</option>
                    <option value="MOBILE_RECHARGE">เติมเงินมือถือ</option>
                    <option value="CARD">บัตร</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm px-2 py-1 text-xs">
                  <span className="font-bold text-gray-300">สถานะ:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent outline-none text-gray-200 cursor-pointer">
                    <option value="all">ทั้งหมด</option>
                    <option value="active">เปิดขาย</option>
                    <option value="inactive">ปิดขาย</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-8 w-8 text-site-accent animate-spin" />
                <span className="text-sm text-gray-500 font-medium">กำลังโหลดสินค้า...</span>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-gray-500 text-[11px] uppercase tracking-wider border-b-[2px] border-site-border/30 bg-[#181A1D]">
                    <th className="px-3 py-2.5 text-center font-bold w-10">
                      <button
                        onClick={toggleSelectAll}
                        className="p-0.5 hover:bg-site-border/30 transition-colors"
                        title={selectedIds.size === filteredProducts.length ? "ยกเลิกเลือกทั้งหมด" : "เลือกทั้งหมด"}
                      >
                        {selectedIds.size > 0 && selectedIds.size === filteredProducts.length ? (
                          <CheckSquare className="w-4 h-4 text-site-accent" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-2.5 text-left font-bold">สินค้า</th>
                    <th className="px-4 py-2.5 text-left font-bold">ประเภท</th>
                    <th className="px-4 py-2.5 text-left font-bold">หมวดหมู่</th>
                    <th className="px-4 py-2.5 text-left font-bold">ราคา/กำไร</th>
                    <th className="px-4 py-2.5 text-left font-bold">สถานะ</th>
                    <th className="px-4 py-2.5 text-left font-bold">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        className={`text-sm transition-colors group ${selectedIds.has(product.id) ? "bg-site-accent/10" : "hover:bg-site-accent/5"}`}>
                        <td className="px-3 py-2.5 text-center">
                          <button
                            onClick={() => toggleSelect(product.id)}
                            className="p-0.5 hover:bg-site-border/30 transition-colors">
                            {selectedIds.has(product.id) ? (
                              <CheckSquare className="w-4 h-4 text-site-accent" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-2.5 font-medium text-white">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 border border-site-border/30 rounded-[12px] shadow-sm bg-[#1A1C1E] flex items-center justify-center overflow-hidden flex-shrink-0">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-white font-semibold text-sm truncate max-w-[200px]">
                                {product.name}
                              </div>
                              <div className="text-[10px] text-gray-400 font-mono truncate max-w-[200px]">
                                {product.slug}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 border-[1px] border-site-border/30 bg-[#181A1D] text-xs">
                            {getProductTypeIcon(product.productType)}
                            <span className="text-gray-300 font-medium">
                              {getProductTypeLabel(product.productType)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-gray-400 text-xs font-medium">
                          {product.category?.name || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          <button
                            onClick={() => openPriceModal(product)}
                            className="inline-flex items-center gap-1.5 text-xs text-site-accent hover:text-white transition-colors font-semibold px-2 py-1 border-[1px] border-transparent hover:border-site-border/50 hover:bg-site-accent/10">
                            <DollarSign className="h-3.5 w-3.5" />
                            <span>จัดการราคา</span>
                          </button>
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`px-2 py-0.5 text-[10px] border border-site-border/30 rounded-[12px] shadow-sm font-bold ${getStatusStyles(product)}`}>
                            {getStatusText(product)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => openImageModal(product)}
                              className="p-1.5 bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm text-gray-400 hover:bg-site-accent hover:text-white transition-all" 
                              title="แก้ไขรูปภาพ"
                            >
                              <ImageIcon className="h-3 w-3" />
                            </button>
                            <Link href={`/admin/products/${product.id}/edit`}>
                              <button className="p-1.5 bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm text-gray-400 hover:bg-orange-500/10 hover:text-white transition-all"  title="แก้ไขสินค้า">
                                <Edit className="h-3 w-3" />
                              </button>
                            </Link>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-1.5 bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm text-gray-400 hover:bg-pink-500 hover:text-white transition-all" 
                              title="ลบสินค้า"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        className="px-4 py-10 text-center text-gray-400 text-sm"
                        colSpan={7}
                      >
                        <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        ไม่พบสินค้าที่ตรงกับเงื่อนไขการค้นหา
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div className="p-3 border-t-[2px] border-site-border/50 flex justify-between items-center bg-[#181A1D]">
              <div className="text-xs text-gray-500 font-medium">
                หน้า {pagination.page} จาก {pagination.totalPages} • แสดง {filteredProducts.length} รายการ
              </div>
              <div className="flex space-x-1.5">
                <button
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                  className="px-3 py-1 text-xs bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm text-white hover:bg-[#212328]/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed font-medium">
                  ก่อนหน้า
                </button>
                <span className="px-3 py-1 text-xs bg-site-accent text-white border border-site-border/30 rounded-[12px] shadow-sm font-bold">
                  {pagination.page}
                </span>
                <button
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 text-xs bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm text-white hover:bg-[#212328]/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed font-medium">
                  ถัดไป
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Price Editing Modal */}
        {isPriceModalOpen &&
          selectedProduct &&
          typeof window !== "undefined" &&
          createPortal(
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#212328] border border-site-border/30 rounded-[16px] w-full max-w-4xl max-h-[80vh] overflow-hidden shadow-lg">
                {/* Modal Header */}
                <div className="p-5 border-b-[3px] border-site-border/50 bg-site-accent flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    จัดการราคา: {selectedProduct.name}
                  </h3>
                  <button
                    onClick={closePriceModal}
                    className="p-2 bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm hover:bg-[#212328]/5 transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-5 overflow-y-auto max-h-[60vh]">
                  {editingTypes.length > 0 ? (
                    <div className="space-y-4">
                      {/* Fast Pricing Options */}
                      <div className="bg-[#181A1D] border border-site-border/30 rounded-[12px] shadow-sm p-4 mb-4">
                        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                          <Zap className="h-4 w-4 text-orange-500" />
                          ตั้งราคาแบบด่วน
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {pricingOptions.map((option) => (
                            <button
                              key={option.key}
                              onClick={() => applyPricingOption(option.key)}
                              className={`p-3 border border-site-border/30 rounded-[12px] shadow-sm text-left transition-all ${selectedPricingOption === option.key
                                ? "bg-site-accent text-white border-site-border/50"
                                : "bg-[#212328] text-white border-gray-300 hover:border-site-border/50"
                                }`}>
                              <div className="font-medium text-sm">
                                {option.label}
                              </div>
                              <div
                                className={`text-xs mt-1 ${selectedPricingOption === option.key
                                  ? "text-blue-100"
                                  : "text-gray-500"
                                  }`}>
                                {option.description}
                              </div>
                            </button>
                          ))}
                        </div>
                        {selectedPricingOption && (
                          <div className="mt-3 text-xs text-gray-400 bg-[#212328] p-2 border border-site-border/30">
                            <span className="font-medium">หมายเหตุ:</span>{" "}
                            ราคาจะถูกคำนวณใหม่ทั้งหมดตามตัวเลือกที่เลือก
                            คุณสามารถแก้ไขราคาแต่ละรายการได้ภายหลัง
                          </div>
                        )}
                      </div>

                      {/* Header Row */}
                      <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-400 border-b-2 border-site-border/30 pb-2">
                        <div className="col-span-3">ประเภท</div>
                        <div className="col-span-2 text-right">ต้นทุน</div>
                        <div className="col-span-2 text-right">ราคา SEAGM</div>
                        <div className="col-span-2 text-right">ราคาขาย</div>
                        <div className="col-span-2 text-right">% กำไร</div>
                        <div className="col-span-1"></div>
                      </div>

                      {/* Type Rows */}
                      {editingTypes.map((type) => {
                        // สลับค่า: originPrice คือราคา SEAGM (ตลาด), unitPrice คือต้นทุน
                        const originPrice = type.originPrice
                          ? parseFloat(type.originPrice as any)
                          : 0;
                        const unitPrice = type.unitPrice
                          ? parseFloat(type.unitPrice as any)
                          : 0;
                        const costPrice = unitPrice; // ต้นทุนจริง
                        const seagmPrice = originPrice || unitPrice; // ราคา SEAGM
                        const sellingPrice =
                          parseFloat(sellingPrices[type.id] || "0") ||
                          costPrice;
                        const profitPercent = calculateProfitPercent(
                          costPrice,
                          sellingPrice,
                        );

                        return (
                          <div
                            key={type.id}
                            className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100">
                            <div className="col-span-3">
                              <div className="font-medium text-white">
                                {type.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {type.parValue} {type.parValueCurrency}
                              </div>
                            </div>
                            <div className="col-span-2 text-right text-sm">
                              <span className="text-gray-400">
                                {costPrice > 0
                                  ? `฿${costPrice.toFixed(2)}`
                                  : "-"}
                              </span>
                            </div>
                            <div className="col-span-2 text-right text-sm">
                              <span className="text-gray-400">
                                ฿{seagmPrice.toFixed(2)}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                                  ฿
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={sellingPrices[type.id] || ""}
                                  onChange={(e) =>
                                    handlePriceChange(type.id, e.target.value)
                                  }
                                  className="w-full text-right bg-[#181A1D] border border-site-border/30 rounded-[12px] shadow-sm pl-6 pr-3 py-2 text-sm focus:ring-2 focus:ring-site-accent/50 outline-none"
                                  placeholder={seagmPrice.toString()}
                                />
                              </div>
                            </div>
                            <div className="col-span-2 text-right">
                              <span
                                className={`text-sm font-medium ${profitPercent> 0
                                  ? "text-green-600"
                                  : profitPercent < 0
                                    ? "text-red-600"
                                    : "text-gray-400"
                                  }`}
                              >
                                {profitPercent > 0 ? "+" : ""}
                                {profitPercent.toFixed(1)}%
                              </span>
                            </div>
                            <div className="col-span-1 text-center">
                              <TrendingUp
                                className={`h-4 w-4 mx-auto ${profitPercent > 0
                                  ? "text-green-500"
                                  : profitPercent < 0
                                    ? "text-red-500"
                                    : "text-gray-400"
                                  }`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      ไม่พบข้อมูลประเภทสินค้า
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-5 border-t-[3px] border-site-border/50 bg-[#181A1D] flex justify-end gap-3">
                  <button
                    onClick={closePriceModal}
                    className="px-4 py-2 bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm text-white hover:bg-[#212328]/5 transition-colors font-medium">
                    ยกเลิก
                  </button>
                  <button
                    onClick={saveSellingPrices}
                    className="px-4 py-2 bg-site-accent border border-site-border/30 rounded-[12px] shadow-sm text-white hover:bg-blue-600 transition-colors font-medium shadow-sm">
                    บันทึกราคา
                  </button>
                </div>
              </motion.div>
            </div>,
            document.body,
          )}

        {/* Bulk Pricing Modal */}
        {isBulkPriceModalOpen &&
          typeof window !== "undefined" &&
          createPortal(
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#212328] border border-site-border/30 rounded-[16px] w-full max-w-2xl overflow-hidden shadow-lg">
                {/* Modal Header */}
                <div className="p-5 border-b-[3px] border-site-border/50 bg-orange-500/10 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    ตั้งราคาสินค้าทั้งหมด
                  </h3>
                  <button
                    onClick={() => setIsBulkPriceModalOpen(false)}
                    className="p-2 bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm hover:bg-[#212328]/5 transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-5">
                  <div className="mb-4 p-4 bg-red-500/5 border border-site-border/30 rounded-[12px] shadow-sm border-red-300">
                    <p className="text-sm text-red-400 font-medium">
                      ⚠️ คำเตือน: การกระทำนี้จะเปลี่ยนแปลงราคาขายของ{" "}
                      <strong>ทุกประเภทสินค้า</strong> ในระบบตามกลยุทธ์ที่เลือก
                    </p>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-3">
                    เลือกกลยุทธ์การตั้งราคา:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {bulkPricingOptions.map((option) => (
                      <button
                        key={option.key}
                        onClick={() => setBulkPricingStrategy(option.key)}
                        className={`p-4 border border-site-border/30 rounded-[12px] shadow-sm text-left transition-all ${bulkPricingStrategy === option.key
                          ? "bg-orange-500/10 text-white border-site-border/50"
                          : "bg-[#212328] text-white border-gray-300 hover:border-site-border/50"
                          }`}>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs mt-1 text-gray-400">
                          {option.description}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Custom percent input */}
                  {bulkPricingStrategy === "custom" && (
                    <div className="mb-4 p-4 bg-[#181A1D] border border-site-border/30 rounded-[12px] shadow-sm">
                      <label className="block text-sm font-medium text-white mb-2">
                        บวกกี่ % จากต้นทุน?
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          value={customPercent}
                          onChange={(e) => setCustomPercent(e.target.value)}
                          className="w-32 text-right bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm px-3 py-2 text-sm focus:ring-2 focus:ring-site-accent/50 outline-none"
                          placeholder="10"
                        />
                        <span className="text-gray-400">%</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        ตัวอย่าง: 10 = บวก 10% จากต้นทุน, -5 = ลบ 5% จากต้นทุน
                      </p>
                    </div>
                  )}

                  {/* Preview info */}
                  {bulkPricingStrategy && (
                    <div className="p-4 bg-[#181A1D] border border-site-border/30 rounded-[12px] shadow-sm border-blue-300">
                      <h5 className="text-sm font-medium text-blue-800 mb-2">
                        📊 สูตรการคำนวณ:
                      </h5>
                      <ul className="text-xs text-blue-400 space-y-1">
                        {bulkPricingStrategy === "mid" && (
                          <li>• ราคาขาย = (ต้นทุน + ราคา SEAGM) ÷ 2</li>
                        )}
                        {bulkPricingStrategy === "nearSeagm" && (
                          <>
                            <li>• ราคาขาย = ราคา SEAGM × 0.97</li>
                            <li>• (ขายถูกกว่า SEAGM 3%)</li>
                          </>
                        )}
                        {bulkPricingStrategy === "smallProfit" && (
                          <li>• ราคาขาย = ต้นทุน × 1.05 (กำไร 5%)</li>
                        )}
                        {bulkPricingStrategy === "seagm" && (
                          <li>• ราคาขาย = ราคา SEAGM</li>
                        )}
                        {bulkPricingStrategy === "custom" && (
                          <li>
                            • ราคาขาย = ต้นทุน × (1 + {customPercent || 0}/100)
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-5 border-t-[3px] border-site-border/50 bg-[#181A1D] flex justify-end gap-3">
                  <button
                    onClick={() => setIsBulkPriceModalOpen(false)}
                    className="px-4 py-2 bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm text-white hover:bg-[#212328]/5 transition-colors font-medium">
                    ยกเลิก
                  </button>
                  <button
                    onClick={executeBulkPricing}
                    disabled={!bulkPricingStrategy || isBulkUpdating}
                    className="px-4 py-2 bg-yellow-400 border border-site-border/30 rounded-[12px] shadow-sm text-white hover:bg-yellow-500 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    {isBulkUpdating && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {isBulkUpdating ? "กำลังอัพเดท..." : "อัพเดทราคาทั้งหมด"}
                  </button>
                </div>
              </motion.div>
            </div>,
            document.body,
          )}

        {/* Fast Image Update Modal */}
        {isImageModalOpen &&
          imageUpdatingProduct &&
          typeof window !== "undefined" &&
          createPortal(
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#212328] border border-site-border/30 rounded-[16px] w-full max-w-xl overflow-hidden shadow-lg">
                <div className="p-5 border-b-[3px] border-site-border/50 bg-site-accent flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    เปลี่ยนโลโก้สินค้า: {imageUpdatingProduct.name}
                  </h3>
                  <button
                    onClick={closeImageModal}
                    className="p-2 bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm hover:bg-[#212328]/5 transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-5 space-y-5">
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleTargetChange("logo")}
                      className={`px-4 py-2 border border-site-border/30 rounded-[12px] shadow-sm text-sm font-medium transition-all ${imageTarget === "logo"
                        ? "bg-site-accent text-white border-site-border/50"
                        : "bg-[#212328] text-white border-gray-300 hover:border-site-border/50"
                        }`}>
                      โลโก้ (รายการสินค้า)
                    </button>
                    <button
                      onClick={() => handleTargetChange("cover")}
                      className={`px-4 py-2 border border-site-border/30 rounded-[12px] shadow-sm text-sm font-medium transition-all ${imageTarget === "cover"
                        ? "bg-site-accent text-white border-site-border/50"
                        : "bg-[#212328] text-white border-gray-300 hover:border-site-border/50"
                        }`}>
                      หน้าปก (หน้ารายละเอียด)
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      {imageTarget === "logo"
                        ? "ลิงก์โลโก้สินค้า"
                        : "ลิงก์รูปภาพหน้าปก"}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={imageUrlInput}
                        onChange={(e) => {
                          setImageUrlInput(e.target.value);
                          setImageError(false);
                        }}
                        placeholder="https://..."
                        className="w-full bg-[#181A1D] border border-site-border/30 rounded-[12px] shadow-sm pl-4 pr-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-site-accent/50 outline-none transition-all"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {imageTarget === "logo"
                        ? "ใส่ลิงก์ HTTPS สำหรับโลโก้สินค้า (แสดงในรายการสินค้า)"
                        : "ใส่ลิงก์ HTTPS สำหรับรูปหน้าปก (แสดงในหน้ารายละเอียดสินค้า)"}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleUploadImage}
                        disabled={
                          isUploadingImage ||
                          !(
                            typeof imageUrlInput === "string" &&
                            imageUrlInput.trim()
                          )
                        }
                        className="inline-flex items-center gap-2 px-4 py-2 bg-site-accent text-white border border-site-border/30 rounded-[12px] shadow-sm font-medium shadow-lg hover:shadow-lg hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        {isUploadingImage ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>กำลังอัปโหลด...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>อัปโหลดไปยัง Storage</span>
                          </>
                        )}
                      </button>
                      <div className="flex items-center gap-2">
                        <select
                          value={copySourceProductId}
                          onChange={(e) =>
                            setCopySourceProductId(e.target.value)
                          }
                          className="bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm px-3 py-2 text-sm text-gray-200">
                          <option value="">เลือกสินค้าที่จะคัดลอก</option>
                          {products
                            .filter((p) => p.id !== imageUpdatingProduct.id)
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          onClick={copyImageFromOtherProduct}
                          disabled={!copySourceProductId}
                          className="px-4 py-2 bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm text-sm font-medium hover:bg-[#212328]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          คัดลอกจากสินค้าอื่น
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {imageTarget === "logo"
                        ? "ดูตัวอย่างโลโก้"
                        : "ดูตัวอย่างหน้าปก"}
                    </label>
                    <div
                      className={`${imageTarget === "logo"
                        ? "aspect-square max-w-[180px]"
                        : "aspect-video max-w-[260px]"
                        } border-2 border-dashed border-site-border/50 rounded-[12px] bg-[#181A1D] flex items-center justify-center overflow-hidden relative group/preview`}>
                      {imageUrlInput && !imageError ? (
                        <img
                          src={imageUrlInput}
                          alt="Image Preview"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover/preview:scale-110"
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        <div className="text-center p-4">
                          <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <span className="text-xs text-gray-500 block">
                            {imageUrlInput
                              ? "โหลดรูปภาพไม่สำเร็จ"
                              : "ยังไม่มีรูปภาพ"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 border-t-[3px] border-site-border/50 bg-[#181A1D] flex justify-end gap-3">
                  <button
                    onClick={closeImageModal}
                    className="px-4 py-2 bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm text-white hover:bg-[#212328]/5 transition-colors font-medium">
                    ยกเลิก
                  </button>
                  <button
                    onClick={saveImageUrl}
                    disabled={isSavingImage}
                    className="px-4 py-2 bg-site-accent border border-site-border/30 rounded-[12px] shadow-sm text-white hover:bg-blue-600 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    {isSavingImage && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {isSavingImage ? "กำลังบันทึก..." : "บันทึกรูปภาพ"}
                  </button>
                </div>
              </motion.div>
            </div>,
            document.body,
          )}
        {/* Export Modal */}
        <ExportProductsModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          products={products}
          filteredProducts={filteredProducts}
        />

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black text-white border border-site-border/30 rounded-[12px] px-6 py-3 flex items-center gap-4 shadow-lg">
            <span className="text-sm font-bold">
              เลือกแล้ว {selectedIds.size} รายการ
            </span>

            <div className="w-px h-6 bg-gray-600" />

            <button
              onClick={() => handleBulkToggleActive(true)}
              disabled={isBulkToggling}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-sm font-medium border border-site-border/30 rounded-[12px] shadow-sm border-white hover:bg-green-600 transition-colors disabled:opacity-50">
              <ToggleRight className="w-4 h-4" />
              เปิดขาย
            </button>

            <button
              onClick={() => handleBulkToggleActive(false)}
              disabled={isBulkToggling}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white text-sm font-medium border border-site-border/30 rounded-[12px] shadow-sm border-white hover:bg-gray-700 transition-colors disabled:opacity-50">
              <ToggleLeft className="w-4 h-4" />
              ปิดขาย
            </button>

            <button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/50 text-white text-sm font-medium border border-site-border/30 rounded-[12px] shadow-sm border-white hover:bg-red-600 transition-colors disabled:opacity-50">
              {isBulkDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              ลบทั้งหมด
            </button>

            <div className="w-px h-6 bg-gray-600" />

            <button
              onClick={clearSelection}
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-300 text-sm font-medium hover:text-white transition-colors">
              <X className="w-4 h-4" />
              ยกเลิก
            </button>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
}
