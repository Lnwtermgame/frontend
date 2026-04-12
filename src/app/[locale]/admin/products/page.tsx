"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "@/lib/framer-exports";
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
  ChevronLeft,
  ChevronRight,
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
  Copy,
  Save,
  Bookmark,
  SlidersHorizontal,
  Eye,
  EyeOff,
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
  const [bulkSliderValue, setBulkSliderValue] = useState(10);
  const [bulkActivePreset, setBulkActivePreset] = useState<string | null>(null);
  const [savedPresets, setSavedPresets] = useState<{ name: string; percent: number; strategy: string }[]>([]);
  const [newPresetName, setNewPresetName] = useState("");
  const [showSavePreset, setShowSavePreset] = useState(false);

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

  // Copy picker modal states
  const [isCopyPickerOpen, setIsCopyPickerOpen] = useState(false);
  const [copyPickerSearch, setCopyPickerSearch] = useState("");

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
    return <Gamepad2 className="w-4 h-4 text-site-accent" />; // DIRECT_TOPUP
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
      return "text-gray-300 bg-site-raised border-gray-300";
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

  // Built-in bulk pricing presets
  const builtInPresets = [
    { key: "smallProfit", label: "กำไรบาง", percent: 5, strategy: "smallProfit", color: "text-green-400", bg: "bg-green-500/10 border-green-500/30" },
    { key: "mid", label: "ราคากลาง", percent: 0, strategy: "mid", color: "text-site-accent", bg: "bg-site-accent/10 border-blue-500/30" },
    { key: "nearSeagm", label: "ใกล้เคียง SEAGM", percent: -3, strategy: "nearSeagm", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30" },
    { key: "seagm", label: "ราคา SEAGM", percent: 0, strategy: "seagm", color: "text-site-accent", bg: "bg-site-accent/10 border-site-accent/30" },
  ];

  // Load saved presets from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("admin_pricing_presets");
      if (stored) setSavedPresets(JSON.parse(stored));
    } catch { }
  }, []);

  const savePreset = () => {
    if (!newPresetName.trim()) { toast.error("กรุณาใส่ชื่อ Preset"); return; }
    const updated = [...savedPresets, { name: newPresetName.trim(), percent: bulkSliderValue, strategy: "custom" }];
    setSavedPresets(updated);
    localStorage.setItem("admin_pricing_presets", JSON.stringify(updated));
    setNewPresetName("");
    setShowSavePreset(false);
    toast.success(`บันทึก Preset "${newPresetName.trim()}" สำเร็จ`);
  };

  const deletePreset = (index: number) => {
    const updated = savedPresets.filter((_, i) => i !== index);
    setSavedPresets(updated);
    localStorage.setItem("admin_pricing_presets", JSON.stringify(updated));
    toast.success("ลบ Preset สำเร็จ");
  };

  // Calculate bulk preview price for a product type
  const calcBulkPreviewPrice = (costPrice: number, seagmPrice: number, strategy: string, percent: number) => {
    let price: number;
    switch (strategy) {
      case "mid": price = (costPrice + seagmPrice) / 2; break;
      case "nearSeagm": price = seagmPrice * 0.97; break;
      case "smallProfit": price = costPrice * 1.05; break;
      case "seagm": price = seagmPrice; break;
      case "custom": price = costPrice * (1 + percent / 100); break;
      default: price = seagmPrice;
    }
    if (strategy !== "nearSeagm" && price < costPrice) price = costPrice * 1.02;
    return price;
  };

  // Get sample products for preview (up to 5 with seagmTypes)
  const sampleProducts = useMemo(() => {
    return products
      .filter(p => p.seagmTypes && p.seagmTypes.length > 0)
      .slice(0, 5)
      .map(p => {
        const firstType = p.seagmTypes![0];
        const cost = Number(firstType.unitPrice) || 0;
        const seagm = Number(firstType.originPrice) || cost;
        return { name: p.name, typeName: firstType.name, cost, seagm };
      });
  }, [products]);

  const applyBuiltInPreset = (preset: typeof builtInPresets[0]) => {
    setBulkActivePreset(preset.key);
    setBulkPricingStrategy(preset.strategy);
    if (preset.strategy === "custom") {
      setBulkSliderValue(preset.percent);
      setCustomPercent(preset.percent.toString());
    } else if (preset.strategy === "smallProfit") {
      setBulkSliderValue(5);
      setCustomPercent("5");
    } else if (preset.strategy === "nearSeagm") {
      setBulkSliderValue(-3);
      setCustomPercent("-3");
    } else {
      setBulkSliderValue(0);
      setCustomPercent("0");
    }
  };

  const applySavedPreset = (preset: { name: string; percent: number; strategy: string }) => {
    setBulkActivePreset(`saved_${preset.name}`);
    setBulkPricingStrategy("custom");
    setBulkSliderValue(preset.percent);
    setCustomPercent(preset.percent.toString());
  };

  const handleSliderChange = (val: number) => {
    setBulkSliderValue(val);
    setCustomPercent(val.toString());
    setBulkPricingStrategy("custom");
    setBulkActivePreset(null);
  };

  const handlePercentInputChange = (val: string) => {
    setCustomPercent(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setBulkSliderValue(Math.max(-30, Math.min(60, num)));
      setBulkPricingStrategy("custom");
      setBulkActivePreset(null);
    }
  };

  // Execute bulk pricing update
  const executeBulkPricing = async () => {
    const effectiveStrategy = bulkPricingStrategy || "custom";
    const effectivePercent = parseFloat(customPercent);

    if (effectiveStrategy === "custom" && isNaN(effectivePercent)) {
      toast.error("กรุณากรอกเปอร์เซ็นต์ที่ถูกต้อง");
      return;
    }

    const label = bulkActivePreset
      ? builtInPresets.find(p => p.key === bulkActivePreset)?.label ||
      savedPresets.find(p => `saved_${p.name}` === bulkActivePreset)?.name ||
      `กำหนดเอง ${effectivePercent}%`
      : `กำหนดเอง ${effectivePercent}%`;

    const confirmed = confirm(
      `คุณแน่ใจหรือไม่ที่จะตั้งราคาทุกสินค้าตามกลยุทธ์ "${label}"?\n\nการกระทำนี้จะเปลี่ยนแปลงราคาขายของทุกประเภทสินค้าในระบบ`,
    );
    if (!confirmed) return;

    setIsBulkUpdating(true);
    try {
      const response = await productApi.bulkUpdateSellingPrices(
        effectiveStrategy as any,
        effectiveStrategy === "custom" ? effectivePercent : undefined,
      );
      if (response.success) {
        toast.success(
          `อัพเดทราคาสำเร็จ! แก้ไข ${response.data.affectedCount} รายการ`,
        );
        setIsBulkPriceModalOpen(false);
        setBulkPricingStrategy(null);
        setBulkActivePreset(null);
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <div className="w-1.5 h-6 bg-gradient-to-b from-site-accent to-site-accent/50 rounded-full mr-3 shadow-accent-glow"></div>
            <h1 className="text-2xl font-black text-white tracking-tight">จัดการสินค้า</h1>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-site-surface border border-white/5 rounded-2xl shadow-lg p-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            {/* Search */}
            <div className="relative w-full lg:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="ค้นหาชื่อสินค้า รหัสสินค้า..."
                className="w-full pl-11 pr-4 py-2.5 bg-site-raised border border-white/5 rounded-xl shadow-inner text-[13px] text-white focus:border-site-accent/50 focus:ring-1 focus:ring-site-accent/50 focus:outline-none transition-all placeholder:text-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 flex-wrap w-full lg:w-auto">
              <AIGenerateAllButton products={products} categories={categories} />
              <button
                onClick={() => setIsBulkPriceModalOpen(true)}
                className="flex-1 lg:flex-none bg-site-accent/10 border border-site-accent/20 text-site-accent rounded-xl flex items-center justify-center gap-2 px-4 py-2 hover:bg-site-accent/20 hover:border-site-accent/30 transition-all font-bold text-[13px]">
                <Settings className="h-4 w-4" />
                <span>ตั้งราคาทั้งหมด</span>
              </button>
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex-1 lg:flex-none bg-site-accent/10 border border-site-accent/20 text-site-accent rounded-xl flex items-center justify-center gap-2 px-4 py-2 hover:bg-site-accent/20 hover:border-site-accent/30 transition-all font-bold text-[13px]">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
              <button
                onClick={handleSyncSeagm}
                className="flex-1 lg:flex-none bg-site-raised border border-white/5 text-gray-300 rounded-xl flex items-center justify-center gap-2 px-4 py-2 hover:bg-[#2a2d35] hover:text-white transition-all font-bold text-[13px]">
                <RefreshCw className="h-4 w-4" />
                <span>ซิงค์ SEAGM</span>
              </button>
              <button
                className="flex-1 lg:flex-none bg-gradient-to-r from-site-accent to-site-accent/80 text-white border border-site-accent/50 rounded-xl flex items-center justify-center gap-2 px-4 py-2 hover:from-site-accent hover:to-site-accent/60 transition-all font-black text-[13px] shadow-lg hover:shadow-accent-glow">
                <Plus className="h-4 w-4" />
                <span>เพิ่มสินค้า</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-white/5 rounded-xl text-red-400 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        {/* Products Table */}
        <motion.div
          className="bg-site-surface border border-white/5 rounded-2xl shadow-xl overflow-hidden"

          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="px-5 py-4 border-b border-white/5 bg-site-raised">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <h3 className="text-[14px] font-black text-white tracking-wide flex items-center gap-2.5">
                <div className="p-1.5 bg-site-accent/10 rounded-lg">
                  <Package className="h-4 w-4 text-site-accent" />
                </div>
                รายการสินค้าทั้งหมด
                <span className="text-[12px] font-bold text-gray-400 bg-site-raised px-2 py-0.5 rounded-md ml-1">{filteredProducts.length}</span>
              </h3>

              <div className="flex flex-wrap gap-3">
                <div className="flex flex-1 lg:flex-none items-center gap-2 bg-site-raised border border-white/5 rounded-xl shadow-inner px-3 py-1.5">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">หมวดหมู่</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-transparent outline-none text-white text-[13px] font-medium cursor-pointer flex-1">
                    <option value="all">ทุกหมวดหมู่</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-1 lg:flex-none items-center gap-2 bg-site-raised border border-white/5 rounded-xl shadow-inner px-3 py-1.5">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">ประเภท</span>
                  <select
                    value={productTypeFilter}
                    onChange={(e) => setProductTypeFilter(e.target.value)}
                    className="bg-transparent outline-none text-white text-[13px] font-medium cursor-pointer flex-1">
                    <option value="all">ทั้งหมด</option>
                    <option value="DIRECT_TOPUP">เติมเกม</option>
                    <option value="MOBILE_RECHARGE">เติมเงินมือถือ</option>
                    <option value="CARD">บัตร</option>
                  </select>
                </div>

                <div className="flex flex-1 lg:flex-none items-center gap-2 bg-site-raised border border-white/5 rounded-xl shadow-inner px-3 py-1.5">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">สถานะ</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent outline-none text-white text-[13px] font-medium cursor-pointer flex-1">
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
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <Loader2 className="h-8 w-8 text-site-accent animate-spin" />
                <span className="text-[13px] font-medium text-gray-400 tracking-wide">กำลังโหลดข้อมูลสินค้า...</span>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-site-raised/50 border-b border-white/5">
                  <tr className="text-[11px] text-gray-400 uppercase tracking-wider">
                    <th className="px-5 py-4 text-left font-bold w-12">
                      <input
                        type="checkbox"
                        checked={selectedIds.size > 0 && selectedIds.size === filteredProducts.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded-md border-white/10 bg-site-raised text-site-accent focus:ring-site-accent/50 focus:ring-offset-0 transition-all cursor-pointer"
                        title="เลือกทั้งหมด"
                      />
                    </th>
                    <th className="px-5 py-4 text-left font-bold">สินค้า</th>
                    <th className="px-5 py-4 text-left font-bold">ประเภท</th>
                    <th className="px-5 py-4 text-left font-bold">หมวดหมู่</th>
                    <th className="px-5 py-4 text-left font-bold">การตั้งราคา</th>
                    <th className="px-5 py-4 text-left font-bold">สถานะ</th>
                    <th className="px-5 py-4 text-center font-bold">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        className={`text-sm transition-colors group hover:bg-site-raised ${selectedIds.has(product.id) ? "bg-site-accent/5" : ""}`}>
                        <td className="px-5 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(product.id)}
                            onChange={() => toggleSelect(product.id)}
                            className="w-4 h-4 rounded-md border-white/10 bg-site-raised text-site-accent focus:ring-site-accent/50 focus:ring-offset-0 transition-all cursor-pointer"
                          />
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 border border-white/5 rounded-xl shadow-inner bg-site-raised flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:border-white/10 transition-all">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link href={`/admin/products/${product.id}/edit`} className="text-[13px] font-bold text-white hover:text-site-accent transition-colors truncate max-w-[200px] block">
                                {product.name}
                              </Link>
                              <div className="text-[11px] text-gray-400 font-mono truncate max-w-[200px] mt-0.5">
                                {product.slug}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-site-raised border border-white/5 rounded-md text-[11px] group-hover:bg-[#2a2d35] transition-colors">
                            {getProductTypeIcon(product.productType)}
                            <span className="text-gray-300 font-bold tracking-wide">
                              {getProductTypeLabel(product.productType)}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-400 text-[12px]">
                          {product.category?.name || <span className="text-gray-400 italic">ไม่ระบุ</span>}
                        </td>
                        <td className="px-5 py-3">
                          <button
                            onClick={() => openPriceModal(product)}
                            className="inline-flex items-center gap-1.5 text-[12px] text-site-accent hover:text-site-accent transition-all font-bold px-3 py-1.5 rounded-lg hover:bg-site-accent/10 border border-transparent hover:border-site-accent/20 whitespace-nowrap">
                            <DollarSign className="h-3.5 w-3.5" />
                            <span>จัดการราคา</span>
                          </button>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-md border tracking-wide uppercase whitespace-nowrap ${product.isActive ? "bg-site-accent/10 text-site-accent border-site-accent/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`}>
                            {getStatusText(product)}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openImageModal(product)}
                              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 transition-all border border-transparent rounded-lg hover:border-white/10"
                              title="อัปโหลดรูปภาพด่วน"
                            >
                              <ImageIcon className="h-4 w-4" />
                            </button>
                            <Link href={`/admin/products/${product.id}/edit`}>
                              <button className="p-2 text-gray-400 hover:text-site-accent hover:bg-site-accent/10 transition-all border border-transparent rounded-lg hover:border-site-accent/20" title="แก้ไขไฟล์โดยละเอียด">
                                <Edit className="h-4 w-4" />
                              </button>
                            </Link>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all border border-transparent rounded-lg hover:border-rose-500/20"
                              title="ลบสินค้า"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        className="py-16 text-center text-gray-400 text-[13px]"
                        colSpan={7}
                      >
                        <Package className="w-8 h-8 mx-auto mb-3 text-gray-400 opacity-50" />
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
            <div className="px-5 py-4 border-t border-white/5 flex items-center justify-between bg-site-surface">
              <p className="text-[12px] font-bold text-gray-400 tracking-wide">
                หน้า {pagination.page} จาก {Math.max(pagination.totalPages, 1)} • แสดง {filteredProducts.length} รายการ
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                  className="p-2 bg-site-raised border border-white/5 rounded-xl text-gray-400 hover:text-white hover:border-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-3 py-1 text-[12px] text-white font-bold bg-site-raised rounded-xl border border-white/5 shadow-inner">
                  {pagination.page}
                </span>
                <button
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 bg-site-raised border border-white/5 rounded-xl text-gray-400 hover:text-white hover:border-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  <ChevronRight className="h-4 w-4" />
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-site-raised border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
                {/* Modal Header */}
                <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0 bg-site-surface">
                  <h3 className="text-[15px] font-black text-white tracking-wide flex items-center gap-2.5">
                    <div className="p-1.5 bg-site-accent/10 rounded-lg">
                      <DollarSign className="h-4 w-4 text-site-accent" />
                    </div>
                    จัดการราคาขาย: <span className="text-gray-400 font-bold ml-1">{selectedProduct.name}</span>
                  </h3>
                  <button
                    onClick={closePriceModal}
                    className="p-2 bg-site-raised border border-white/5 rounded-xl hover:bg-[#2a2d35] hover:border-white/10 transition-all text-gray-400">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-5 overflow-y-auto flex-1 min-h-0 bg-site-raised">
                  {editingTypes.length > 0 ? (
                    <div className="space-y-5">
                      {/* Fast Pricing Options */}
                      <div className="bg-site-surface border border-white/5 rounded-2xl shadow-inner p-5 mb-2">
                        <h4 className="text-[12px] font-black text-white tracking-widest uppercase mb-4 flex items-center gap-2">
                          <Zap className="h-4 w-4 text-site-accent" />
                          เครื่องมือตั้งราคาด่วน
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {pricingOptions.map((option) => (
                            <button
                              key={option.key}
                              onClick={() => applyPricingOption(option.key)}
                              className={`p-3.5 border rounded-xl text-left transition-all ${selectedPricingOption === option.key
                                ? "bg-site-accent/10 text-site-accent border-site-accent/30"
                                : "bg-site-raised text-gray-300 border-white/5 hover:border-white/20 hover:bg-[#2a2d35]"
                                }`}>
                              <div className="font-bold text-[13px] tracking-wide">
                                {option.label}
                              </div>
                              <div
                                className={`text-[11px] mt-1 line-clamp-1 ${selectedPricingOption === option.key
                                  ? "text-site-accent/70"
                                  : "text-gray-400"
                                  }`}>
                                {option.description}
                              </div>
                            </button>
                          ))}
                        </div>
                        {selectedPricingOption && (
                          <div className="mt-4 text-[11px] text-gray-400 bg-site-raised p-3 rounded-lg border border-white/5 shadow-inner flex items-start gap-2">
                            <span className="text-site-accent shrink-0">💡</span>
                            <p>ราคาจะถูกคำนวณใหม่ทั้งหมดตามตัวเลือกที่เลือก คุณสามารถปรับแต่งราคาแต่ละรายการได้อย่างอิสระตารางถัดไป</p>
                          </div>
                        )}
                      </div>

                      {/* Header Row */}
                      <div className="grid grid-cols-12 gap-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/10 pb-3 px-2">
                        <div className="col-span-3">ประเภทบริการ</div>
                        <div className="col-span-2 text-right">ต้นทุนจริง</div>
                        <div className="col-span-2 text-right">ราคาหน้าร้านต้นทาง</div>
                        <div className="col-span-2 text-right text-site-accent">กำหนดราคาขาย</div>
                        <div className="col-span-2 text-right">เปอร์เซ็นต์กำไร</div>
                        <div className="col-span-1"></div>
                      </div>

                      {/* Type Rows */}
                      <div className="space-y-1">
                        {editingTypes.map((type) => {
                          const originPrice = type.originPrice ? parseFloat(type.originPrice as any) : 0;
                          const unitPrice = type.unitPrice ? parseFloat(type.unitPrice as any) : 0;
                          const costPrice = unitPrice;
                          const seagmPrice = originPrice || unitPrice;
                          const sellingPrice = parseFloat(sellingPrices[type.id] || "0") || costPrice;
                          const profitPercent = calculateProfitPercent(costPrice, sellingPrice);

                          return (
                            <div
                              key={type.id}
                              className="grid grid-cols-12 gap-4 items-center py-3 px-2 border-b border-white/5 hover:bg-site-raised transition-colors rounded-lg group">
                              <div className="col-span-3">
                                <div className="font-bold text-[13px] text-white truncate pr-2">
                                  {type.name}
                                </div>
                                <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                                  {type.parValue} {type.parValueCurrency}
                                </div>
                              </div>
                              <div className="col-span-2 text-right">
                                <span className="text-[13px] font-mono text-gray-400 group-hover:text-white transition-colors">
                                  {costPrice > 0 ? `฿ ${costPrice.toFixed(2)}` : "-"}
                                </span>
                              </div>
                              <div className="col-span-2 text-right">
                                <span className="text-[13px] font-mono text-gray-400 group-hover:text-white transition-colors">
                                  ฿ {seagmPrice.toFixed(2)}
                                </span>
                              </div>
                              <div className="col-span-2 relative">
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-site-accent/50 text-[13px] font-mono font-bold">
                                    ฿
                                  </span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={sellingPrices[type.id] || ""}
                                    onChange={(e) => handlePriceChange(type.id, e.target.value)}
                                    className="w-full text-right bg-site-raised border border-white/10 rounded-xl shadow-inner pl-8 pr-3 py-2 text-[13px] font-bold text-white focus:border-site-accent/50 focus:ring-1 focus:ring-site-accent/50 outline-none transition-all placeholder:text-gray-600"
                                    placeholder={seagmPrice.toString()}
                                  />
                                </div>
                              </div>
                              <div className="col-span-2 text-right">
                                <span
                                  className={`text-[13px] font-black tracking-wide ${profitPercent > 0
                                    ? "text-site-accent"
                                    : profitPercent < 0
                                      ? "text-rose-400"
                                      : "text-gray-400"
                                    }`}
                                >
                                  {profitPercent > 0 ? "+" : ""}{profitPercent.toFixed(1)}%
                                </span>
                              </div>
                              <div className="col-span-1 flex justify-center">
                                <TrendingUp
                                  className={`h-4 w-4 ${profitPercent > 0
                                    ? "text-site-accent"
                                    : profitPercent < 0
                                      ? "text-rose-500"
                                      : "text-gray-400"
                                    }`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-4 opacity-50" />
                      <p className="text-[14px] font-medium text-gray-400">ไม่พบข้อมูลประเภทสินค้า (SEAGM Types) สำหรับสินค้านี้</p>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-white/5 bg-site-surface flex items-center justify-between shrink-0">
                  <p className="text-[11px] text-gray-400 hidden sm:block">
                    เคล็ดลับ: ใช้เครื่องมือตั้งราคาด่วนเพื่อความรวดเร็ว
                  </p>
                  <div className="flex justify-end gap-3 w-full sm:w-auto">
                    <button
                      onClick={closePriceModal}
                      className="px-5 py-2.5 bg-site-raised border border-white/5 rounded-xl text-gray-300 hover:text-white hover:bg-[#2a2d35] transition-all font-bold text-[13px]">
                      ยกเลิก
                    </button>
                    <button
                      onClick={saveSellingPrices}
                      className="px-5 py-2.5 bg-gradient-to-r from-site-accent to-site-accent/80 text-white border border-site-accent/50 rounded-xl hover:from-site-accent hover:to-site-accent/60 transition-all font-black text-[13px] shadow-lg hover:shadow-accent-glow flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      บันทึกราคา
                    </button>
                  </div>
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
              style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
              onClick={(e) => { if (e.target === e.currentTarget) setIsBulkPriceModalOpen(false); }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-site-raised border border-white/10 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">

                {/* Header */}
                <div className="p-5 border-b border-white/5 bg-site-surface flex items-center justify-between shrink-0">
                  <h3 className="text-[15px] font-black text-white tracking-wide flex items-center gap-2.5">
                    <div className="p-1.5 bg-site-accent/10 rounded-lg">
                      <SlidersHorizontal className="h-4 w-4 text-site-accent" />
                    </div>
                    ตั้งราคาแบบกลุ่ม (Bulk Pricing)
                  </h3>
                  <button
                    onClick={() => setIsBulkPriceModalOpen(false)}
                    className="p-2 bg-site-raised border border-white/5 rounded-xl hover:bg-[#2a2d35] hover:border-white/10 transition-all text-gray-400">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 overflow-y-auto flex-1 min-h-0 space-y-5 bg-site-raised">
                  {/* Warning Banner */}
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 shadow-inner">
                    <span className="text-rose-400 shrink-0 text-lg">⚠️</span>
                    <div>
                      <h5 className="text-[13px] font-bold text-rose-400 mb-0.5">ระวังการใช้งานตั้งราคากลุ่ม</h5>
                      <p className="text-[12px] text-gray-400 leading-snug">
                        การกระทำนี้จะเปลี่ยนราคาขายของ <strong>สินค้าที่มีอยู่ในระบบทั้งหมด</strong> (หากคำนวณแล้วราคาขายต่ำกว่าต้นทุน ระบบจะปรับให้เป็น ต้นทุน + 2% อัตโนมัติเพื่อป้องกันการขาดทุน)
                      </p>
                    </div>
                  </div>

                  {/* Preset Chips */}
                  <div>
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Preset ด่วนที่แนะนำ</h4>
                    <div className="flex flex-wrap gap-2">
                      {builtInPresets.map((preset) => (
                        <button
                          key={preset.key}
                          onClick={() => applyBuiltInPreset(preset)}
                          className={`px-3.5 py-2 rounded-xl border text-[12px] font-bold transition-all ${bulkActivePreset === preset.key
                            ? `${preset.bg} ${preset.color} ring-1 ring-current bg-opacity-20`
                            : "bg-site-raised border-white/5 text-gray-400 hover:border-white/20 hover:text-white hover:bg-[#2a2d35]"
                            }`}>
                          {preset.label}
                        </button>
                      ))}
                      {savedPresets.map((preset, idx) => (
                        <div key={`saved_${idx}`} className="group relative">
                          <button
                            onClick={() => applySavedPreset(preset)}
                            className={`px-3.5 py-2 rounded-xl border text-[12px] font-bold transition-all flex items-center gap-1.5 ${bulkActivePreset === `saved_${preset.name}`
                              ? "bg-site-accent/10 border-site-accent/30 text-site-accent ring-1 ring-site-accent/30"
                              : "bg-site-raised border-white/5 text-gray-400 hover:border-white/20 hover:text-white hover:bg-[#2a2d35]"
                              }`}>
                            <Bookmark className="w-3.5 h-3.5" />
                            {preset.name} ({preset.percent > 0 ? "+" : ""}{preset.percent}%)
                          </button>
                          <button
                            onClick={() => deletePreset(idx)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 rounded-full text-white text-[10px] font-bold hidden group-hover:flex items-center justify-center hover:bg-rose-600 transition-colors shadow-lg"
                            title="ลบ Preset">
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Slider + Number Input */}
                  <div className="bg-site-surface border border-white/5 rounded-2xl p-5 space-y-5 shadow-inner">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h4 className="text-[13px] font-bold text-white flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-site-accent" />
                        เปอร์เซ็นต์กำไรจากต้นทุนหลัก
                      </h4>
                      <div className="flex items-center gap-2 bg-site-raised p-1.5 rounded-xl border border-white/5 shadow-inner">
                        <input
                          type="number"
                          step="0.5"
                          value={customPercent}
                          onChange={(e) => handlePercentInputChange(e.target.value)}
                          className="w-16 text-center bg-transparent px-1 py-1 text-[14px] text-site-accent font-black focus:outline-none"
                        />
                        <span className="text-gray-400 text-[13px] font-bold pr-2">%</span>
                      </div>
                    </div>

                    {/* Range Slider */}
                    <div className="relative px-2 pt-2">
                      {/* Custom Slider Track Design */}
                      <input
                        type="range"
                        min="-30"
                        max="60"
                        step="0.5"
                        value={bulkSliderValue}
                        onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #f43f5e 0%, #f97316 ${((bulkSliderValue + 30) / 90 * 100)}%, #2a2d35 ${((bulkSliderValue + 30) / 90 * 100)}%, #2a2d35 100%)`
                        }}
                      />
                      <style dangerouslySetInnerHTML={{
                        __html: `
                        input[type=range]::-webkit-slider-thumb {
                          -webkit-appearance: none;
                          height: 20px;
                          width: 20px;
                          border-radius: 50%;
                          background: #fff;
                          border: 2px solid #f97316;
                          box-shadow: 0 0 10px rgba(249,115,22,0.5);
                          cursor: pointer;
                        }
                      `}} />
                      <div className="flex justify-between text-[11px] font-mono text-gray-400 mt-2 px-1">
                        <span>-30%</span>
                        <span className="text-gray-400 font-bold">0%</span>
                        <span>+15%</span>
                        <span>+30%</span>
                        <span>+60%</span>
                      </div>
                    </div>

                    {/* Formula Display & Save */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                      <div className="text-[11px] text-gray-400 bg-site-raised rounded-lg px-3 py-2 font-mono border border-white/5 shadow-inner">
                        <span className="text-gray-400 font-bold">สูตรคำนวณ:</span> ราคาขาย = ต้นทุน × (1 + <span className={`font-black ${parseFloat(customPercent) >= 0 ? 'text-site-accent' : 'text-rose-400'}`}>{customPercent || 0}%</span>)
                      </div>

                      {/* Save Preset */}
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {showSavePreset ? (
                          <div className="flex items-center gap-2 flex-1 relative">
                            <input
                              type="text"
                              value={newPresetName}
                              onChange={(e) => setNewPresetName(e.target.value)}
                              placeholder="เช่น โปรซัมเมอร์"
                              className="flex-1 bg-site-raised border border-site-accent/30 rounded-lg pl-3 pr-10 py-2 text-[12px] text-white placeholder-gray-600 focus:ring-2 focus:ring-site-accent/50 outline-none w-full sm:w-48"
                              onKeyDown={(e) => e.key === "Enter" && savePreset()}
                              autoFocus
                            />
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                              <button onClick={savePreset} className="p-1.5 text-site-accent hover:text-site-accent transition-colors">
                                <Save className="w-4 h-4" />
                              </button>
                              <button onClick={() => setShowSavePreset(false)} className="p-1.5 text-gray-400 hover:text-rose-400 transition-colors">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowSavePreset(true)}
                            className="flex items-center justify-center gap-1.5 text-[12px] px-3 py-2 rounded-lg bg-site-accent/10 border border-site-accent/20 text-site-accent hover:bg-site-accent/20 transition-all font-bold w-full sm:w-auto">
                            <Bookmark className="w-3.5 h-3.5" />
                            บันทึกเป็นค่าเริ่มต้นใหม่
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Live Preview Table */}
                  {sampleProducts.length > 0 && (
                    <div className="bg-site-surface border border-white/5 rounded-2xl overflow-hidden shadow-lg">
                      <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2 bg-site-raised/50">
                        <Eye className="h-4 w-4 text-site-accent" />
                        <h4 className="text-[12px] font-black text-gray-300 uppercase tracking-widest">Live Preview (ตัวอย่างราคา)</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[12px]">
                          <thead>
                            <tr className="text-gray-400 bg-site-surface text-left uppercase tracking-wider">
                              <th className="px-5 py-3 font-bold border-b border-white/5">สินค้าอ้างอิง</th>
                              <th className="px-5 py-3 font-bold border-b border-white/5 text-right w-24">ต้นทุน</th>
                              <th className="px-5 py-3 font-bold border-b border-white/5 text-right w-24">SEAGM</th>
                              <th className="px-5 py-3 font-bold border-b border-white/5 text-right w-28 text-site-accent">ราคาขายใหม่</th>
                              <th className="px-5 py-3 font-bold border-b border-white/5 text-right w-20">กำไร</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {sampleProducts.map((sp, i) => {
                              const effectiveStrategy = bulkPricingStrategy || "custom";
                              const effectivePercent = parseFloat(customPercent) || 0;
                              const newPrice = calcBulkPreviewPrice(sp.cost, sp.seagm, effectiveStrategy, effectivePercent);
                              const profit = sp.cost > 0 ? ((newPrice - sp.cost) / sp.cost * 100) : 0;
                              return (
                                <tr key={i} className="hover:bg-site-raised transition-colors group">
                                  <td className="px-5 py-2.5">
                                    <div className="text-white font-bold truncate max-w-[180px] text-[13px]">{sp.name}</div>
                                    <div className="text-gray-400 text-[10px] truncate max-w-[180px] font-mono mt-0.5">{sp.typeName}</div>
                                  </td>
                                  <td className="px-5 py-2.5 text-right text-gray-400 font-mono">฿{sp.cost.toFixed(2)}</td>
                                  <td className="px-5 py-2.5 text-right text-gray-400 font-mono">฿{sp.seagm.toFixed(2)}</td>
                                  <td className="px-5 py-2.5 text-right text-site-accent font-black font-mono tracking-wide">฿{newPrice.toFixed(2)}</td>
                                  <td className={`px-5 py-2.5 text-right font-black tracking-wide ${profit > 0 ? 'text-site-accent' : profit < 0 ? 'text-rose-400' : 'text-gray-400'}`}>
                                    {profit > 0 ? "+" : ""}{profit.toFixed(1)}%
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-site-surface flex items-center justify-between shrink-0">
                  <div className="text-[12px] text-gray-400 hidden sm:block">
                    คาดการณ์กำไรเฉลี่ย: <span className={`font-black tracking-wide ${parseFloat(customPercent) >= 0 ? 'text-site-accent/90' : 'text-rose-400/90'}`}>{parseFloat(customPercent) >= 0 ? "+" : ""}{customPercent || 0}%</span> ต่อรายการ
                  </div>
                  <div className="flex gap-2.5 w-full sm:w-auto">
                    <button
                      onClick={() => setIsBulkPriceModalOpen(false)}
                      className="flex-1 sm:flex-none px-5 py-2.5 bg-site-raised border border-white/5 rounded-xl text-gray-300 hover:text-white hover:bg-[#2a2d35] transition-all font-bold text-[13px]">
                      ยกเลิก
                    </button>
                    <button
                      onClick={executeBulkPricing}
                      disabled={isBulkUpdating}
                      className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-site-accent to-site-accent/80 text-white rounded-xl text-[13px] font-black shadow-lg hover:shadow-accent-glow border border-site-accent/50 hover:from-site-accent hover:to-site-accent/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {isBulkUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {isBulkUpdating ? "กำลังอัปเดต..." : "ยืนยันการตั้งราคา"}
                    </button>
                  </div>
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-site-raised border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
                <div className="p-5 border-b border-white/5 bg-site-surface flex items-center justify-between shrink-0">
                  <h3 className="text-[15px] font-black text-white tracking-wide flex items-center gap-2.5">
                    <div className="p-1.5 bg-site-accent/10 rounded-lg">
                      <ImageIcon className="h-4 w-4 text-site-accent" />
                    </div>
                    เปลี่ยนรูปภาพ: <span className="text-gray-400 font-bold ml-1">{imageUpdatingProduct.name}</span>
                  </h3>
                  <button
                    onClick={closeImageModal}
                    className="p-2 bg-site-raised border border-white/5 rounded-xl hover:bg-[#2a2d35] hover:border-white/10 transition-all text-gray-400">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Target Selection */}
                  <div className="flex bg-site-raised p-1.5 rounded-xl border border-white/5 shadow-inner">
                    <button
                      onClick={() => handleTargetChange("logo")}
                      className={`flex-1 py-2.5 rounded-lg text-[13px] font-bold transition-all ${imageTarget === "logo"
                        ? "bg-site-raised text-white ring-1 ring-white/10"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}>
                      โลโก้สินค้า
                    </button>
                    <button
                      onClick={() => handleTargetChange("cover")}
                      className={`flex-1 py-2.5 rounded-lg text-[13px] font-bold transition-all ${imageTarget === "cover"
                        ? "bg-site-raised text-white ring-1 ring-white/10"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}>
                      หน้าปกสินค้า
                    </button>
                  </div>

                  {/* URL Input */}
                  <div className="space-y-3">
                    <label className="block text-[13px] font-bold text-gray-300">
                      {imageTarget === "logo" ? "URL โลโก้สินค้า" : "URL รูปภาพหน้าปก"}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={imageUrlInput}
                        onChange={(e) => {
                          setImageUrlInput(e.target.value);
                          setImageError(false);
                        }}
                        placeholder="https://example.com/image.jpg"
                        className="w-full bg-site-surface border border-white/10 rounded-xl shadow-inner pl-4 pr-10 py-3 text-[13px] text-white placeholder-gray-600 focus:ring-2 focus:ring-site-accent/50 outline-none transition-all"
                      />
                      {imageUrlInput && (
                        <button
                          onClick={() => setImageUrlInput("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-400 transition-colors p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium">
                      {imageTarget === "logo"
                        ? "ใส่ลิงก์รูปภาพโดยตรง (.jpg, .png, .webp) สำหรับแสดงในหน้ารายการสินค้า"
                        : "ใส่ลิงก์รูปแนวนอน (16:9) สำหรับแสดงเป็นแบนเนอร์ในหน้ารายละเอียดสินค้า"}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleUploadImage}
                        disabled={
                          isUploadingImage ||
                          !(typeof imageUrlInput === "string" && imageUrlInput.trim())
                        }
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-site-accent to-site-accent/80 text-white rounded-xl font-bold text-[13px] shadow-lg hover:shadow-accent-glow hover:from-site-accent hover:to-site-accent/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        {isUploadingImage ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>กำลังบันทึก...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>บันทึกลง Storage</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsCopyPickerOpen(true); setCopyPickerSearch(""); }}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-site-raised border border-white/5 rounded-xl text-gray-300 text-[13px] font-bold hover:bg-[#2a2d35] hover:text-white transition-all">
                        <Copy className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                        <span>คัดลอกจากสินค้าอื่น</span>
                      </button>
                    </div>
                  </div>

                  {/* Preview Area */}
                  <div>
                    <label className="block text-[13px] font-bold text-gray-300 mb-3 flex items-center justify-between">
                      {imageTarget === "logo" ? "ตัวอย่างโลโก้" : "ตัวอย่างหน้าปก"}
                      {imageUrlInput && !imageError && <span className="text-[10px] bg-site-accent/10 text-site-accent px-2 py-0.5 rounded-md border border-site-accent/20">Preview Ready</span>}
                    </label>
                    <div
                      className={`mx-auto ${imageTarget === "logo"
                        ? "aspect-square max-w-[200px]"
                        : "aspect-video max-w-[320px]"
                        } border-2 border-dashed ${imageUrlInput && !imageError ? 'border-site-accent/30' : 'border-white/10'} rounded-2xl bg-site-surface flex items-center justify-center overflow-hidden relative group/preview shadow-inner transition-colors`}>
                      {imageUrlInput && !imageError ? (
                        <img
                          src={imageUrlInput}
                          alt="Image Preview"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover/preview:scale-110"
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        <div className="text-center p-6 flex flex-col items-center justify-center gap-3">
                          <div className="p-3 bg-site-raised rounded-2xl border border-white/5">
                            <ImageIcon className="w-8 h-8 text-gray-600" />
                          </div>
                          <span className="text-[12px] font-bold text-gray-400 block">
                            {imageUrlInput
                              ? "โหลดรูปภาพไม่สำเร็จ (URL ไม่ถูกต้อง)"
                              : "กรุณาระบุ URL รูปภาพด้านบน"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-site-surface flex items-center justify-between shrink-0">
                  <span className="text-[11px] text-gray-400 hidden sm:block">ขนาดแนะนำ: โลโก้ 1:1, หน้าปก 16:9</span>
                  <div className="flex justify-end gap-3 w-full sm:w-auto">
                    <button
                      onClick={closeImageModal}
                      className="px-5 py-2.5 bg-site-raised border border-white/5 rounded-xl text-gray-300 hover:text-white hover:bg-[#2a2d35] transition-all font-bold text-[13px]">
                      ยกเลิก
                    </button>
                    <button
                      onClick={saveImageUrl}
                      disabled={isSavingImage || imageError || !imageUrlInput}
                      className="px-5 py-2.5 bg-gradient-to-r from-site-accent to-site-accent/80 text-white border border-site-accent/50 rounded-xl hover:from-site-accent hover:to-site-accent/60 transition-all font-black text-[13px] shadow-lg hover:shadow-accent-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                      {isSavingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {isSavingImage ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>,
            document.body,
          )}
        {/* Copy Image Picker Modal */}
        {isCopyPickerOpen &&
          imageUpdatingProduct &&
          typeof window !== "undefined" &&
          createPortal(
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
              onClick={(e) => { if (e.target === e.currentTarget) setIsCopyPickerOpen(false); }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-site-raised border border-white/10 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
                {/* Picker Header */}
                <div className="p-4 border-b border-white/5 bg-site-surface flex items-center justify-between shrink-0">
                  <h3 className="text-[15px] font-black text-white tracking-wide flex items-center gap-2.5">
                    <div className="p-1.5 bg-site-accent/10 rounded-lg">
                      <Copy className="h-4 w-4 text-site-accent" />
                    </div>
                    คัดลอกรูปภาพจากสินค้าอื่น
                    <span className="text-[12px] font-bold text-gray-400 bg-site-raised px-2 py-0.5 rounded-md ml-1 border border-white/5">
                      {imageTarget === "logo" ? "โลโก้สินค้า" : "หน้าปก"}
                    </span>
                  </h3>
                  <button
                    onClick={() => setIsCopyPickerOpen(false)}
                    className="p-2 bg-site-raised border border-white/5 rounded-xl hover:bg-[#2a2d35] hover:border-white/10 transition-all text-gray-400">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-white/5 bg-site-raised shrink-0">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={copyPickerSearch}
                      onChange={(e) => setCopyPickerSearch(e.target.value)}
                      placeholder="ค้นหาชื่อเกม หรือ คีย์เวิร์ด เพื่อคัดลอกรูป..."
                      className="w-full bg-site-raised border border-white/5 rounded-xl shadow-inner pl-11 pr-4 py-3 text-white text-[13px] font-medium placeholder-gray-500 focus:ring-1 focus:ring-site-accent/50 focus:border-site-accent/50 outline-none transition-all"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Product Grid */}
                <div className="p-4 overflow-y-auto flex-1 min-h-[300px] bg-site-surface">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {products
                      .filter((p) => p.id !== imageUpdatingProduct.id)
                      .filter((p) => {
                        if (!copyPickerSearch.trim()) return true;
                        const q = copyPickerSearch.toLowerCase();
                        return p.name.toLowerCase().includes(q) || p.slug?.toLowerCase().includes(q);
                      })
                      .map((p) => {
                        const imgSrc = imageTarget === "logo" ? p.imageUrl : p.coverImageUrl;
                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              if (!imgSrc) {
                                toast.error(`สินค้า "${p.name}" ไม่มี${imageTarget === "logo" ? "โลโก้" : "รูปปก"}`);
                                return;
                              }
                              setImageUrlInput(imgSrc);
                              setImageError(false);
                              setCopySourceProductId(p.id);
                              setIsCopyPickerOpen(false);
                              toast.success(`เลือกรูปภาพสำเร็จ!`);
                            }}
                            className="group flex flex-col items-center gap-2 p-2 rounded-2xl border border-white/5 bg-site-raised hover:border-blue-500/30 hover:bg-site-raised transition-all cursor-pointer text-left"
                          >
                            <div className="w-full aspect-square rounded-xl bg-site-raised border border-white/5 shadow-inner overflow-hidden flex items-center justify-center relative">
                              {imgSrc ? (
                                <img
                                  src={imgSrc}
                                  alt={p.name}
                                  className="w-full h-full object-cover group-hover:scale-110 group-hover:opacity-80 transition-all duration-300"
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center gap-1.5 text-gray-600 opacity-50">
                                  <ImageIcon className="w-6 h-6" />
                                  <span className="text-[10px] font-bold uppercase tracking-wider">No Image</span>
                                </div>
                              )}

                              {/* Hover Overlay */}
                              {imgSrc && (
                                <div className="absolute inset-0 bg-site-accent/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <div className="bg-site-accent text-white rounded-full p-1.5 shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300">
                                    <Copy className="w-3.5 h-3.5" />
                                  </div>
                                </div>
                              )}
                            </div>
                            <span className="text-[11px] font-bold text-gray-400 text-center leading-tight line-clamp-2 w-full group-hover:text-site-accent transition-colors">
                              {p.name}
                            </span>
                          </div>
                        );
                      })}
                  </div>

                  {/* Empty state */}
                  {products
                    .filter((p) => p.id !== imageUpdatingProduct.id)
                    .filter((p) => {
                      if (!copyPickerSearch.trim()) return true;
                      const q = copyPickerSearch.toLowerCase();
                      return p.name.toLowerCase().includes(q) || p.slug?.toLowerCase().includes(q);
                    }).length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Search className="w-10 h-10 mb-4 opacity-30" />
                        <h4 className="text-[14px] font-bold text-white mb-1">ไม่พบผลลัพธ์</h4>
                        <p className="text-[13px] text-gray-400">ลองค้นหาด้วยคำอื่นสำหรับ "{copyPickerSearch}"</p>
                      </div>
                    )}
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
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] bg-site-surface/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center overflow-hidden">

              <div className="px-5 py-3.5 bg-gradient-to-r from-site-accent/20 to-transparent border-r border-white/5 flex items-center gap-3">
                <div className="bg-site-accent text-white font-black text-[13px] px-3 py-1 rounded-lg">
                  {selectedIds.size}
                </div>
                <span className="text-[13px] font-bold text-white tracking-wide">
                  รายการที่ถูกเลือก
                </span>
              </div>

              <div className="px-3 py-2 flex items-center gap-2">
                <button
                  onClick={() => handleBulkToggleActive(true)}
                  disabled={isBulkToggling}
                  className="px-4 py-2 bg-site-accent/10 hover:bg-site-accent/20 text-site-accent border border-site-accent/20 rounded-xl transition-all font-bold text-[13px] flex items-center gap-2 disabled:opacity-50">
                  <Eye className="w-4 h-4" /> เปิดขาย
                </button>
                <button
                  onClick={() => handleBulkToggleActive(false)}
                  disabled={isBulkToggling}
                  className="px-4 py-2 bg-site-raised hover:bg-[#2a2d35] text-gray-400 hover:text-white border border-white/5 rounded-xl transition-all font-bold text-[13px] flex items-center gap-2 disabled:opacity-50">
                  <EyeOff className="w-4 h-4" /> ปิดขาย
                </button>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <button
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition-all font-bold text-[13px] flex items-center gap-2 disabled:opacity-50">
                  {isBulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} ลบข้อมูล
                </button>
              </div>

              <button
                onClick={clearSelection}
                className="px-4 py-2 mr-2 text-gray-400 hover:text-white transition-colors"
                title="ยกเลิกการเลือก"
              >
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div >
    </AdminLayout >
  );
}
