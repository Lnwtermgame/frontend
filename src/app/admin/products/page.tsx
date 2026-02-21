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

export default function AdminProducts() {
  const router = useRouter();
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
    if (isPriceModalOpen || isBulkPriceModalOpen || isImageModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isPriceModalOpen, isBulkPriceModalOpen, isImageModalOpen]);

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
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
  }, [pagination.page, pagination.limit, searchTerm, selectedCategory]);

  const handleSyncSeagm = () => {
    router.push("/admin/seagm-sync");
  };

  const getProductTypeIcon = (productType: string) => {
    if (productType === "CARD") {
      return <CreditCard className="w-4 h-4 text-brutal-blue" />;
    }
    if ((productType as any) === "MOBILE_RECHARGE") {
      return <Smartphone className="w-4 h-4 text-brutal-green" />;
    }
    return <Gamepad2 className="w-4 h-4 text-brutal-orange" />; // DIRECT_TOPUP
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
      // Note: Need to add deleteProduct to productApi
      // await productApi.deleteProduct(productId);
      setProducts(products.filter((p) => p.id !== productId));
    } catch (err) {
      console.error("ไม่สามารถลบสินค้า:", err);
    }
  };

  const getStatusStyles = (product: Product | AdminProduct) => {
    if (!product.isActive) {
      return "text-gray-700 bg-gray-100 border-gray-300";
    }
    return "text-green-700 bg-green-100 border-green-300";
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center">
          <span className="w-1.5 h-6 bg-brutal-blue mr-2"></span>
          <h1 className="text-2xl font-bold text-black">จัดการสินค้า</h1>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="ค้นหาสินค้า..."
                className="bg-white border-[2px] border-gray-300 text-black pl-10 pr-4 py-2 w-full focus:ring-2 focus:ring-black focus:border-black focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <AIGenerateAllButton products={products} categories={categories} />
            <button
              onClick={() => setIsBulkPriceModalOpen(true)}
              className="bg-yellow-400 border-[3px] border-black text-black flex items-center justify-center gap-2 px-4 py-2 hover:bg-yellow-500 transition-colors font-medium"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
            >
              <Settings className="h-5 w-5" />
              <span>ตั้งราคาทั้งหมด</span>
            </button>
            <button
              onClick={handleSyncSeagm}
              className="bg-white border-[3px] border-black text-black flex items-center justify-center gap-2 px-4 py-2 hover:bg-gray-100 transition-colors font-medium"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
            >
              <RefreshCw className="h-5 w-5" />
              <span>ซิงค์ SEAGM</span>
            </button>
            <button
              className="bg-black text-white border-[3px] border-black flex items-center justify-center gap-2 px-4 py-2 hover:bg-gray-800 transition-colors font-medium"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
            >
              <Plus className="h-5 w-5" />
              <span>เพิ่มสินค้า</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-[3px] border-red-500 text-red-700 px-4 py-3">
            {error}
          </div>
        )}

        {/* Products Table */}
        <motion.div
          className="bg-white border-[3px] border-black overflow-hidden"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="p-5 border-b-[2px] border-black bg-gray-50">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <h3 className="text-lg font-semibold text-black flex items-center">
                <Package className="mr-2 h-5 w-5 text-brutal-blue" />
                รายการสินค้า
              </h3>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-white border-[2px] border-black px-3 py-2 text-sm">
                  <span className="font-semibold text-gray-800">หมวดหมู่:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-transparent outline-none text-gray-800"
                  >
                    <option value="all">ทุกหมวดหมู่</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-white border-[2px] border-black px-3 py-2 text-sm">
                  <span className="font-semibold text-gray-800">ประเภท:</span>
                  <select
                    value={productTypeFilter}
                    onChange={(e) => setProductTypeFilter(e.target.value)}
                    className="bg-transparent outline-none text-gray-800"
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="DIRECT_TOPUP">เติมเกม</option>
                    <option value="MOBILE_RECHARGE">เติมเงินมือถือ</option>
                    <option value="CARD">บัตร</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-white border-[2px] border-black px-3 py-2 text-sm">
                  <span className="font-semibold text-gray-800">สถานะ:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent outline-none text-gray-800"
                  >
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
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-brutal-pink animate-spin" />
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-gray-600 text-sm border-b border-gray-200">
                    <th className="px-5 py-3 text-left">สินค้า</th>
                    <th className="px-5 py-3 text-left">ประเภท</th>
                    <th className="px-5 py-3 text-left">หมวดหมู่</th>
                    <th className="px-5 py-3 text-left">ราคา/กำไร</th>
                    <th className="px-5 py-3 text-left">สถานะ</th>
                    <th className="px-5 py-3 text-left">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="text-sm hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-5 py-4 font-medium text-black">
                          <div className="flex items-center gap-3">
                            {product.imageUrl && (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-10 h-10 object-cover border-[2px] border-black"
                              />
                            )}
                            <div>
                              <div className="text-black font-medium">
                                {product.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {product.slug}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {getProductTypeIcon(product.productType)}
                            <span className="text-xs text-gray-600 font-medium">
                              {getProductTypeLabel(product.productType)}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {product.category?.name || "-"}
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => openPriceModal(product)}
                            className="flex items-center gap-2 text-sm text-brutal-blue hover:text-black transition-colors"
                          >
                            <DollarSign className="h-4 w-4" />
                            <span>จัดการราคา</span>
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2 py-1 text-xs border-[2px] font-medium ${getStatusStyles(product)}`}
                          >
                            {getStatusText(product)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openImageModal(product)}
                              className="p-2 bg-gray-100 border-[2px] border-gray-300 text-black hover:bg-brutal-blue hover:text-white hover:border-black transition-colors"
                            >
                              <ImageIcon className="h-4 w-4" />
                            </button>
                            <Link href={`/admin/products/${product.id}/edit`}>
                              <button className="p-2 bg-gray-100 border-[2px] border-gray-300 text-black hover:bg-brutal-blue hover:text-white hover:border-black transition-colors">
                                <Edit className="h-4 w-4" />
                              </button>
                            </Link>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-2 bg-gray-100 border-[2px] border-gray-300 text-black hover:bg-red-500 hover:text-white hover:border-black transition-colors"
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
                        className="px-5 py-8 text-center text-gray-500"
                        colSpan={6}
                      >
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
            <div className="p-4 border-t border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                แสดง {filteredProducts.length} จาก {products.length}{" "}
                สินค้าในหน้านี้
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                  className="px-3 py-1 text-sm bg-white border-[2px] border-gray-300 text-black hover:bg-gray-100 transition-colors disabled:opacity-50 font-medium"
                >
                  ก่อนหน้า
                </button>
                <span className="px-3 py-1 text-sm bg-brutal-blue text-white border-[2px] border-black font-medium">
                  {pagination.page}
                </span>
                <button
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 text-sm bg-white border-[2px] border-gray-300 text-black hover:bg-gray-100 transition-colors disabled:opacity-50 font-medium"
                >
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
                className="bg-white border-[3px] border-black w-full max-w-4xl max-h-[80vh] overflow-hidden shadow-[8px_8px_0_0_rgba(0,0,0,1)]"
              >
                {/* Modal Header */}
                <div className="p-5 border-b-[3px] border-black bg-brutal-blue flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    จัดการราคา: {selectedProduct.name}
                  </h3>
                  <button
                    onClick={closePriceModal}
                    className="p-2 bg-white border-[2px] border-black hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-5 overflow-y-auto max-h-[60vh]">
                  {editingTypes.length > 0 ? (
                    <div className="space-y-4">
                      {/* Fast Pricing Options */}
                      <div className="bg-gray-50 border-[2px] border-black p-4 mb-4">
                        <h4 className="text-sm font-bold text-black mb-3 flex items-center gap-2">
                          <Zap className="h-4 w-4 text-brutal-orange" />
                          ตั้งราคาแบบด่วน
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {pricingOptions.map((option) => (
                            <button
                              key={option.key}
                              onClick={() => applyPricingOption(option.key)}
                              className={`p-3 border-[2px] text-left transition-all ${
                                selectedPricingOption === option.key
                                  ? "bg-brutal-blue text-white border-black"
                                  : "bg-white text-black border-gray-300 hover:border-black"
                              }`}
                            >
                              <div className="font-medium text-sm">
                                {option.label}
                              </div>
                              <div
                                className={`text-xs mt-1 ${
                                  selectedPricingOption === option.key
                                    ? "text-blue-100"
                                    : "text-gray-500"
                                }`}
                              >
                                {option.description}
                              </div>
                            </button>
                          ))}
                        </div>
                        {selectedPricingOption && (
                          <div className="mt-3 text-xs text-gray-600 bg-white p-2 border border-gray-200">
                            <span className="font-medium">หมายเหตุ:</span>{" "}
                            ราคาจะถูกคำนวณใหม่ทั้งหมดตามตัวเลือกที่เลือก
                            คุณสามารถแก้ไขราคาแต่ละรายการได้ภายหลัง
                          </div>
                        )}
                      </div>

                      {/* Header Row */}
                      <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-600 border-b-2 border-gray-200 pb-2">
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
                            className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100"
                          >
                            <div className="col-span-3">
                              <div className="font-medium text-black">
                                {type.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {type.parValue} {type.parValueCurrency}
                              </div>
                            </div>
                            <div className="col-span-2 text-right text-sm">
                              <span className="text-gray-600">
                                {costPrice > 0
                                  ? `฿${costPrice.toFixed(2)}`
                                  : "-"}
                              </span>
                            </div>
                            <div className="col-span-2 text-right text-sm">
                              <span className="text-gray-600">
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
                                  className="w-full text-right bg-gray-50 border-[2px] border-black pl-6 pr-3 py-2 text-sm focus:ring-2 focus:ring-brutal-blue/50 outline-none"
                                  placeholder={seagmPrice.toString()}
                                />
                              </div>
                            </div>
                            <div className="col-span-2 text-right">
                              <span
                                className={`text-sm font-medium ${
                                  profitPercent > 0
                                    ? "text-green-600"
                                    : profitPercent < 0
                                      ? "text-red-600"
                                      : "text-gray-600"
                                }`}
                              >
                                {profitPercent > 0 ? "+" : ""}
                                {profitPercent.toFixed(1)}%
                              </span>
                            </div>
                            <div className="col-span-1 text-center">
                              <TrendingUp
                                className={`h-4 w-4 mx-auto ${
                                  profitPercent > 0
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
                <div className="p-5 border-t-[3px] border-black bg-gray-50 flex justify-end gap-3">
                  <button
                    onClick={closePriceModal}
                    className="px-4 py-2 bg-white border-[2px] border-black text-black hover:bg-gray-100 transition-colors font-medium"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={saveSellingPrices}
                    className="px-4 py-2 bg-brutal-blue border-[2px] border-black text-white hover:bg-blue-600 transition-colors font-medium shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                  >
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
                className="bg-white border-[3px] border-black w-full max-w-2xl overflow-hidden shadow-[8px_8px_0_0_rgba(0,0,0,1)]"
              >
                {/* Modal Header */}
                <div className="p-5 border-b-[3px] border-black bg-yellow-400 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-black flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    ตั้งราคาสินค้าทั้งหมด
                  </h3>
                  <button
                    onClick={() => setIsBulkPriceModalOpen(false)}
                    className="p-2 bg-white border-[2px] border-black hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-5">
                  <div className="mb-4 p-4 bg-red-50 border-[2px] border-red-300">
                    <p className="text-sm text-red-700 font-medium">
                      ⚠️ คำเตือน: การกระทำนี้จะเปลี่ยนแปลงราคาขายของ{" "}
                      <strong>ทุกประเภทสินค้า</strong> ในระบบตามกลยุทธ์ที่เลือก
                    </p>
                  </div>

                  <h4 className="text-sm font-bold text-black mb-3">
                    เลือกกลยุทธ์การตั้งราคา:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {bulkPricingOptions.map((option) => (
                      <button
                        key={option.key}
                        onClick={() => setBulkPricingStrategy(option.key)}
                        className={`p-4 border-[2px] text-left transition-all ${
                          bulkPricingStrategy === option.key
                            ? "bg-brutal-yellow text-black border-black"
                            : "bg-white text-black border-gray-300 hover:border-black"
                        }`}
                      >
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs mt-1 text-gray-600">
                          {option.description}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Custom percent input */}
                  {bulkPricingStrategy === "custom" && (
                    <div className="mb-4 p-4 bg-gray-50 border-[2px] border-black">
                      <label className="block text-sm font-medium text-black mb-2">
                        บวกกี่ % จากต้นทุน?
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          value={customPercent}
                          onChange={(e) => setCustomPercent(e.target.value)}
                          className="w-32 text-right bg-white border-[2px] border-black px-3 py-2 text-sm focus:ring-2 focus:ring-brutal-blue/50 outline-none"
                          placeholder="10"
                        />
                        <span className="text-gray-600">%</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        ตัวอย่าง: 10 = บวก 10% จากต้นทุน, -5 = ลบ 5% จากต้นทุน
                      </p>
                    </div>
                  )}

                  {/* Preview info */}
                  {bulkPricingStrategy && (
                    <div className="p-4 bg-blue-50 border-[2px] border-blue-300">
                      <h5 className="text-sm font-medium text-blue-800 mb-2">
                        📊 สูตรการคำนวณ:
                      </h5>
                      <ul className="text-xs text-blue-700 space-y-1">
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
                <div className="p-5 border-t-[3px] border-black bg-gray-50 flex justify-end gap-3">
                  <button
                    onClick={() => setIsBulkPriceModalOpen(false)}
                    className="px-4 py-2 bg-white border-[2px] border-black text-black hover:bg-gray-100 transition-colors font-medium"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={executeBulkPricing}
                    disabled={!bulkPricingStrategy || isBulkUpdating}
                    className="px-4 py-2 bg-yellow-400 border-[2px] border-black text-black hover:bg-yellow-500 transition-colors font-medium shadow-[2px_2px_0_0_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
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
                className="bg-white border-[3px] border-black w-full max-w-xl overflow-hidden shadow-[8px_8px_0_0_rgba(0,0,0,1)]"
              >
                <div className="p-5 border-b-[3px] border-black bg-brutal-blue flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    เปลี่ยนโลโก้สินค้า: {imageUpdatingProduct.name}
                  </h3>
                  <button
                    onClick={closeImageModal}
                    className="p-2 bg-white border-[2px] border-black hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-5 space-y-5">
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleTargetChange("logo")}
                      className={`px-4 py-2 border-[2px] text-sm font-medium transition-all ${
                        imageTarget === "logo"
                          ? "bg-brutal-blue text-white border-black"
                          : "bg-white text-black border-gray-300 hover:border-black"
                      }`}
                    >
                      โลโก้ (รายการสินค้า)
                    </button>
                    <button
                      onClick={() => handleTargetChange("cover")}
                      className={`px-4 py-2 border-[2px] text-sm font-medium transition-all ${
                        imageTarget === "cover"
                          ? "bg-brutal-blue text-white border-black"
                          : "bg-white text-black border-gray-300 hover:border-black"
                      }`}
                    >
                      หน้าปก (หน้ารายละเอียด)
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
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
                        className="w-full bg-gray-50 border-[2px] border-black pl-4 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-brutal-blue/50 outline-none transition-all"
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
                        className="inline-flex items-center gap-2 px-4 py-2 bg-brutal-blue text-white border-[2px] border-black font-medium shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
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
                          className="bg-white border-[2px] border-black px-3 py-2 text-sm text-gray-800"
                        >
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
                          className="px-4 py-2 bg-white border-[2px] border-black text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          คัดลอกจากสินค้าอื่น
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {imageTarget === "logo"
                        ? "ดูตัวอย่างโลโก้"
                        : "ดูตัวอย่างหน้าปก"}
                    </label>
                    <div
                      className={`${
                        imageTarget === "logo"
                          ? "aspect-square max-w-[180px]"
                          : "aspect-video max-w-[260px]"
                      } border-[3px] border-dashed border-gray-400 bg-gray-50 flex items-center justify-center overflow-hidden relative group/preview`}
                    >
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

                <div className="p-5 border-t-[3px] border-black bg-gray-50 flex justify-end gap-3">
                  <button
                    onClick={closeImageModal}
                    className="px-4 py-2 bg-white border-[2px] border-black text-black hover:bg-gray-100 transition-colors font-medium"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={saveImageUrl}
                    disabled={isSavingImage}
                    className="px-4 py-2 bg-brutal-blue border-[2px] border-black text-white hover:bg-blue-600 transition-colors font-medium shadow-[2px_2px_0_0_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
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
      </div>
    </AdminLayout>
  );
}
