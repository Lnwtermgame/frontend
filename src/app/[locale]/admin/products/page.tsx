"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "@/lib/framer-exports";
import {
  Download,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  AdminLayout,
  AdminPageHeader,
  PageContainer,
} from "@/components/admin";
import {
  productApi,
  Category,
  AdminProduct,
  AdminProductType,
} from "@/lib/services/product-api";
import { isAppwriteUrl, processImageUrl } from "@/lib/services/storage-api";
import AIGenerateAllButton from "@/components/admin/AIGenerateAllButton";
import ExportProductsModal from "@/components/admin/ExportProductsModal";
import { useAuth } from "@/lib/hooks/use-auth";
import { ProductsFilterBar } from "./_components/ProductsFilterBar";
import { ProductsTable } from "./_components/ProductsTable";
import { PriceEditModal } from "./_components/PriceEditModal";
import { BulkPriceModal } from "./_components/BulkPriceModal";
import { ImageEditModal } from "./_components/ImageEditModal";
import { CopyPickerModal } from "./_components/CopyPickerModal";

export default function AdminProducts() {
  const router = useRouter();
  const { isAdmin, isInitialized, isSessionChecked } = useAuth();

  // --- Data state ---
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Filter state ---
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

  // --- Price modal coordination ---
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(
    null,
  );
  const [editingTypes, setEditingTypes] = useState<AdminProductType[]>([]);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isSavingPrices, setIsSavingPrices] = useState(false);

  // --- Bulk pricing modal coordination ---
  const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // --- Image modal coordination ---
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageUpdatingProduct, setImageUpdatingProduct] =
    useState<AdminProduct | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imageTarget, setImageTarget] = useState<"logo" | "cover">("logo");
  const [copySourceProductId, setCopySourceProductId] = useState<string>("");

  // --- Copy picker modal coordination ---
  const [isCopyPickerOpen, setIsCopyPickerOpen] = useState(false);

  // --- Export modal ---
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // --- Bulk selection state ---
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkToggling, setIsBulkToggling] = useState(false);

  // Client-side type/status filtering (search + category are server-side).
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

  // Sample products for the bulk pricing live preview (up to 5 with seagmTypes).
  const sampleProducts = useMemo(() => {
    return products
      .filter((p) => p.seagmTypes && p.seagmTypes.length > 0)
      .slice(0, 5)
      .map((p) => {
        const firstType = p.seagmTypes![0];
        const cost = Number(firstType.unitPrice) || 0;
        const seagm = Number(firstType.originPrice) || cost;
        return { name: p.name, typeName: firstType.name, cost, seagm };
      });
  }, [products]);

  // Fetch products + categories.
  useEffect(() => {
    const fetchData = async () => {
      if (!isInitialized || !isSessionChecked || !isAdmin) return;
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

  // --- Handlers ---

  const handleSyncSeagm = () => {
    router.push("/admin/seagm-sync");
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบสินค้านี้?")) return;
    try {
      await productApi.deleteProduct(productId);
      setProducts(products.filter((p) => p.id !== productId));
      setSelectedIds((prev) => prev.filter((id) => id !== productId));
      toast.success("ลบสินค้าสำเร็จ");
    } catch (err) {
      console.error("ไม่สามารถลบสินค้า:", err);
      toast.error("ไม่สามารถลบสินค้าได้");
    }
  };

  const handleBulkDelete = async () => {
    const ids = selectedIds;
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
        const idSet = new Set(ids);
        setProducts((prev) => prev.filter((p) => !idSet.has(p.id)));
        toast.success(`ลบสินค้าสำเร็จ ${res.data.deletedCount} รายการ`);
        setSelectedIds([]);
      }
    } catch (err) {
      console.error("Bulk delete failed:", err);
      toast.error("ไม่สามารถลบสินค้าได้");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkToggleActive = async (isActive: boolean) => {
    const ids = selectedIds;
    const label = isActive ? "เปิดขาย" : "ปิดขาย";
    if (!confirm(`ตั้งสถานะ "${label}" ให้กับสินค้า ${ids.length} รายการ?`))
      return;
    setIsBulkToggling(true);
    try {
      const res = await productApi.bulkToggleActive(ids, isActive);
      if (res.success) {
        const idSet = new Set(ids);
        setProducts((prev) =>
          prev.map((p) => (idSet.has(p.id) ? { ...p, isActive } : p)),
        );
        toast.success(`อัปเดตสถานะสำเร็จ ${res.data.updatedCount} รายการ`);
        setSelectedIds([]);
      }
    } catch (err) {
      console.error("Bulk toggle failed:", err);
      toast.error("ไม่สามารถอัปเดตสถานะได้");
    } finally {
      setIsBulkToggling(false);
    }
  };

  // --- Price modal handlers ---

  const openPriceModal = (product: AdminProduct) => {
    setSelectedProduct(product);
    if (product.seagmTypes && product.seagmTypes.length > 0) {
      setEditingTypes(product.seagmTypes);
      setIsPriceModalOpen(true);
    } else if (product.seagmProductId) {
      productApi
        .getGameTypesById(product.seagmProductId)
        .then((res) => {
          if (res.success) {
            setEditingTypes(res.data as unknown as AdminProductType[]);
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

  const closePriceModal = () => {
    setIsPriceModalOpen(false);
    setSelectedProduct(null);
    setEditingTypes([]);
  };

  const handleSavePrices = async (prices: Record<string, string>) => {
    if (!selectedProduct) return false;
    setIsSavingPrices(true);
    try {
      const response = await productApi.updateSellingPrices(prices);
      if (response.success) {
        toast.success("บันทึกราคาสำเร็จ");
        closePriceModal();
        return true;
      }
      toast.error("ไม่สามารถบันทึกราคาได้");
      return false;
    } catch (err) {
      console.error("Failed to save prices:", err);
      toast.error("ไม่สามารถบันทึกราคาได้");
      return false;
    } finally {
      setIsSavingPrices(false);
    }
  };

  // --- Bulk pricing handler ---

  const handleApplyBulkPricing = async (
    strategy: "mid" | "nearSeagm" | "smallProfit" | "seagm" | "custom",
    customPercent?: number,
  ) => {
    if (strategy === "custom" && (customPercent === undefined || isNaN(customPercent))) {
      toast.error("กรุณากรอกเปอร์เซ็นต์ที่ถูกต้อง");
      return false;
    }
    const label = `กำหนดเอง ${customPercent ?? 0}%`;
    const confirmed = confirm(
      `คุณแน่ใจหรือไม่ที่จะตั้งราคาทุกสินค้าตามกลยุทธ์ "${label}"?\n\nการกระทำนี้จะเปลี่ยนแปลงราคาขายของทุกประเภทสินค้าในระบบ`,
    );
    if (!confirmed) return false;
    setIsBulkUpdating(true);
    try {
      const response = await productApi.bulkUpdateSellingPrices(
        strategy,
        strategy === "custom" ? customPercent : undefined,
      );
      if (response.success) {
        toast.success(
          `อัพเดทราคาสำเร็จ! แก้ไข ${response.data.affectedCount} รายการ`,
        );
        setIsBulkPriceModalOpen(false);
        return true;
      }
      toast.error("ไม่สามารถอัพเดทราคาได้");
      return false;
    } catch (err) {
      console.error("Failed to bulk update prices:", err);
      toast.error("ไม่สามารถอัพเดทราคาได้");
      return false;
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // --- Image modal handlers ---

  const openImageModal = (product: AdminProduct) => {
    setImageUpdatingProduct(product);
    setImageUrlInput(product.imageUrl || "");
    setImageTarget("logo");
    setCopySourceProductId("");
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setImageUpdatingProduct(null);
    setImageUrlInput("");
    setImageTarget("logo");
    setCopySourceProductId("");
  };

  const handleImageTargetChange = (target: "logo" | "cover") => {
    setImageTarget(target);
  };

  // Upload current URL to storage and persist. Returns final stored URL or null.
  const handleUploadImage = async (url: string): Promise<string | null> => {
    if (!url.trim() || !imageUpdatingProduct) return null;
    try {
      const isLogo = imageTarget === "logo";
      const newUrl = await processImageUrl(
        url,
        isLogo ? "products/logos" : "products/covers",
        isLogo
          ? imageUpdatingProduct.imageUrl
          : imageUpdatingProduct.coverImageUrl,
      );
      if (!newUrl) return null;
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
        return newUrl;
      }
      toast.error("อัปโหลดสำเร็จแต่บันทึกสินค้าไม่สำเร็จ");
      return null;
    } catch (err) {
      console.error("Failed to save uploaded image:", err);
      toast.error("บันทึกรูปภาพไม่สำเร็จ");
      return null;
    }
  };

  // Persist the URL (uploading first if not already on Appwrite). Returns success.
  const handleSaveImageUrl = async (url: string): Promise<boolean> => {
    if (!imageUpdatingProduct) return false;
    if (!url.trim()) {
      toast.error("กรุณาใส่ลิงก์รูปภาพ");
      return false;
    }
    try {
      let finalUrl = url;
      if (!isAppwriteUrl(finalUrl)) {
        const uploaded = await processImageUrl(
          url,
          imageTarget === "logo" ? "products/logos" : "products/covers",
          imageTarget === "logo"
            ? imageUpdatingProduct.imageUrl
            : imageUpdatingProduct.coverImageUrl,
        );
        if (!uploaded) return false;
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
                ? { imageUrl: finalUrl }
                : { coverImageUrl: finalUrl }),
            };
          }),
        );
        closeImageModal();
        return true;
      }
      toast.error("ไม่สามารถบันทึกรูปภาพได้");
      return false;
    } catch (err) {
      console.error("Failed to update image:", err);
      toast.error("ไม่สามารถบันทึกรูปภาพได้");
      return false;
    }
  };

  // --- Copy picker handler ---

  const handleCopyPick = (productId: string) => {
    const source = products.find((p) => p.id === productId);
    if (!source || !imageUpdatingProduct) return;
    const urlToCopy =
      imageTarget === "logo"
        ? source.imageUrl || ""
        : source.coverImageUrl || "";
    if (!urlToCopy) {
      toast.error("สินค้าที่เลือกไม่มีรูปภาพสำหรับคัดลอก");
      return;
    }
    setImageUrlInput(urlToCopy);
    setCopySourceProductId(productId);
    setIsCopyPickerOpen(false);
  };

  return (
    <AdminLayout title={"สินค้า" as any}>
      <PageContainer>
        <AdminPageHeader
          title="จัดการสินค้า"
          actions={
            <div className="flex gap-2.5 flex-wrap">
              <AIGenerateAllButton products={products} categories={categories} />
              <button
                onClick={() => setIsBulkPriceModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 bg-site-accent/10 border border-site-accent/20 text-site-accent rounded-lg px-4 py-2 hover:bg-site-accent/20 hover:border-site-accent/30 transition-all font-bold text-[13px]"
              >
                <Settings className="h-4 w-4" />
                <span>ตั้งราคาทั้งหมด</span>
              </button>
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 bg-site-accent/10 border border-site-accent/20 text-site-accent rounded-lg px-4 py-2 hover:bg-site-accent/20 hover:border-site-accent/30 transition-all font-bold text-[13px]"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
              <button
                onClick={handleSyncSeagm}
                className="inline-flex items-center justify-center gap-2 bg-site-raised border border-site-border text-site-muted rounded-lg px-4 py-2 hover:bg-site-surface hover:text-site-text transition-all font-bold text-[13px]"
              >
                <RefreshCw className="h-4 w-4" />
                <span>ซิงค์ SEAGM</span>
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 bg-site-accent text-site-bg border border-site-accent/50 rounded-lg px-4 py-2 hover:bg-site-accent-hover transition-all font-bold text-[13px]"
              >
                <Plus className="h-4 w-4" />
                <span>เพิ่มสินค้า</span>
              </button>
            </div>
          }
        />

        {error && (
          <div className="bg-semantic-rose/10 border border-semantic-rose/30 rounded-lg text-semantic-rose px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <ProductsFilterBar
          search={searchTerm}
          setSearch={setSearchTerm}
          category={selectedCategory}
          setCategory={(v) => {
            setSelectedCategory(v);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          categories={categories}
          productType={productTypeFilter}
          setProductType={setProductTypeFilter}
          status={statusFilter}
          setStatus={setStatusFilter}
        />

        <ProductsTable
          products={filteredProducts}
          loading={loading}
          pagination={{
            page: pagination.page,
            totalPages: pagination.totalPages,
            total: pagination.total,
            pageSize: pagination.limit,
          }}
          onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
          onEditPrice={openPriceModal}
          onEditImage={openImageModal}
          onDelete={handleDeleteProduct}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />

        {/* Price Edit Modal */}
        <PriceEditModal
          open={isPriceModalOpen}
          onClose={closePriceModal}
          product={selectedProduct}
          types={editingTypes}
          onSave={handleSavePrices}
          loading={isSavingPrices}
        />

        {/* Bulk Price Modal */}
        <BulkPriceModal
          open={isBulkPriceModalOpen}
          onClose={() => setIsBulkPriceModalOpen(false)}
          onApply={handleApplyBulkPricing}
          loading={isBulkUpdating}
          sampleProducts={sampleProducts}
        />

        {/* Image Edit Modal */}
        <ImageEditModal
          open={isImageModalOpen}
          onClose={closeImageModal}
          product={imageUpdatingProduct}
          target={imageTarget}
          onTargetChange={handleImageTargetChange}
          imageUrlInput={imageUrlInput}
          setImageUrlInput={setImageUrlInput}
          onUpload={handleUploadImage}
          onSave={handleSaveImageUrl}
          onOpenCopyPicker={() => setIsCopyPickerOpen(true)}
        />

        {/* Copy Picker Modal */}
        <CopyPickerModal
          open={isCopyPickerOpen}
          onClose={() => setIsCopyPickerOpen(false)}
          onSelect={handleCopyPick}
          products={products}
          excludeProductId={imageUpdatingProduct?.id}
          target={imageTarget}
        />

        {/* Export Modal (existing component, untouched) */}
        <ExportProductsModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          products={products}
          filteredProducts={filteredProducts}
        />

        {/* Bulk Action Bar */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] bg-site-surface/90 backdrop-blur-md border border-site-border rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center overflow-hidden"
            >
              <div className="px-5 py-3.5 bg-gradient-to-r from-site-accent/20 to-transparent border-r border-site-border-soft flex items-center gap-3">
                <div className="bg-site-accent text-site-bg font-bold text-[13px] px-3 py-1 rounded-lg">
                  {selectedIds.length}
                </div>
                <span className="text-[13px] font-bold text-site-text tracking-wide">
                  รายการที่ถูกเลือก
                </span>
              </div>

              <div className="px-3 py-2 flex items-center gap-2">
                <button
                  onClick={() => handleBulkToggleActive(true)}
                  disabled={isBulkToggling}
                  className="px-4 py-2 bg-site-accent/10 hover:bg-site-accent/20 text-site-accent border border-site-accent/20 rounded-lg transition-all font-bold text-[13px] flex items-center gap-2 disabled:opacity-50"
                >
                  <Eye className="w-4 h-4" /> เปิดขาย
                </button>
                <button
                  onClick={() => handleBulkToggleActive(false)}
                  disabled={isBulkToggling}
                  className="px-4 py-2 bg-site-raised hover:bg-site-surface text-site-muted hover:text-site-text border border-site-border rounded-lg transition-all font-bold text-[13px] flex items-center gap-2 disabled:opacity-50"
                >
                  <EyeOff className="w-4 h-4" /> ปิดขาย
                </button>
                <div className="w-px h-6 bg-site-border mx-1" />
                <button
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="px-4 py-2 bg-semantic-rose/10 hover:bg-semantic-rose/20 text-semantic-rose border border-semantic-rose/20 rounded-lg transition-all font-bold text-[13px] flex items-center gap-2 disabled:opacity-50"
                >
                  {isBulkDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}{" "}
                  ลบข้อมูล
                </button>
              </div>

              <button
                onClick={() => setSelectedIds([])}
                className="px-4 py-2 mr-2 text-site-muted hover:text-site-text transition-colors"
                title="ยกเลิกการเลือก"
              >
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </PageContainer>
    </AdminLayout>
  );
}
