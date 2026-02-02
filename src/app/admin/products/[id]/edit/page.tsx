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
} from "lucide-react";
import Link from "next/link";
import { productApi, Product, SeagmField, Category } from "@/lib/services/product-api";
import DynamicProductFields from "@/components/products/DynamicProductFields";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshingFields, setRefreshingFields] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "seo" | "inventory">("basic");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof id !== "string") return;

    setSaving(true);
    try {
      const response = await productApi.updateProduct(id, formData);
      if (response.success) {
        alert("Product updated successfully!");
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
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-mali-blue animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!product) {
    return (
      <AdminLayout title="Edit Product">
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Product not found</h2>
          <Link
            href="/admin/products"
            className="text-mali-blue hover:underline"
          >
            Back to products
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const isDirectTopUp = product.productType === "DIRECT_TOPUP";

  return (
    <AdminLayout title={`Edit: ${product.name}`} >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/products"
              className="p-2 bg-mali-card border border-mali-blue/20 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Edit Product</h1>
              <p className="text-gray-400">{product.name}</p>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-mali-blue text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-mali-blue/90 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* Product Info Bar */}
        <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Created: {new Date(product.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Updated: {new Date(product.updatedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              {isDirectTopUp ? (
                <>
                  <Zap className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-orange-400">Direct Top-Up</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-blue-400">Gift Card</span>
                </>
              )}
            </div>
            {product.seagmProductId && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">SEAGM ID: {product.seagmProductId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-mali-blue/20">
          {(["basic", "seo", "inventory"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "text-mali-blue border-b-2 border-mali-blue"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === "basic" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-mali-card border border-mali-blue/20 rounded-xl p-6 space-y-6"
              >
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-mali-blue" />
                  Basic Information
                </h2>

                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full bg-mali-bg border border-mali-blue/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-mali-blue/50 outline-none"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Slug (URL) *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    className="w-full bg-mali-bg border border-mali-blue/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-mali-blue/50 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">URL-friendly identifier for this product</p>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                    className="w-full bg-mali-bg border border-mali-blue/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-mali-blue/50 outline-none appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                      backgroundSize: "16px",
                    }}
                  >
                    <option value="">Select a category...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Short Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Short Description
                  </label>
                  <textarea
                    value={formData.shortDescription}
                    onChange={(e) =>
                      setFormData({ ...formData, shortDescription: e.target.value })
                    }
                    rows={2}
                    maxLength={255}
                    className="w-full bg-mali-bg border border-mali-blue/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-mali-blue/50 outline-none resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Brief summary for product listings ({formData.shortDescription.length}/255)</p>
                </div>

                {/* Full Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={6}
                    className="w-full bg-mali-bg border border-mali-blue/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-mali-blue/50 outline-none resize-none"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, imageUrl: e.target.value })
                    }
                    placeholder="https://..."
                    className="w-full bg-mali-bg border border-mali-blue/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-mali-blue/50 outline-none"
                  />
                  {formData.imageUrl && (
                    <div className="mt-2 w-32 h-32 rounded-lg overflow-hidden border border-mali-blue/20">
                      <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "seo" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-mali-card border border-mali-blue/20 rounded-xl p-6 space-y-6"
              >
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-mali-blue" />
                  SEO Settings
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={formData.metaTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, metaTitle: e.target.value })
                    }
                    className="w-full bg-mali-bg border border-mali-blue/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-mali-blue/50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    value={formData.metaDescription}
                    onChange={(e) =>
                      setFormData({ ...formData, metaDescription: e.target.value })
                    }
                    rows={3}
                    className="w-full bg-mali-bg border border-mali-blue/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-mali-blue/50 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Meta Keywords (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.metaKeywords}
                    onChange={(e) =>
                      setFormData({ ...formData, metaKeywords: e.target.value })
                    }
                    placeholder="gaming, top-up, gift card..."
                    className="w-full bg-mali-bg border border-mali-blue/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-mali-blue/50 outline-none"
                  />
                </div>
              </motion.div>
            )}

            {activeTab === "inventory" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-mali-card border border-mali-blue/20 rounded-xl p-6 space-y-6"
              >
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-mali-blue" />
                  Pricing & Inventory
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Price (฿) *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            price: parseFloat(e.target.value),
                          })
                        }
                        className="w-full bg-mali-bg border border-mali-blue/20 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-mali-blue/50 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Compare at Price (฿)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        value={formData.comparePrice}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            comparePrice: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-mali-bg border border-mali-blue/20 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-mali-blue/50 outline-none"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Original price for showing discounts</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stockQuantity: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-mali-bg border border-mali-blue/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-mali-blue/50 outline-none"
                  />
                </div>

                <div className="flex gap-6 pt-4 border-t border-mali-blue/10">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="w-5 h-5 rounded border-mali-blue/20"
                    />
                    <div>
                      <span className="text-white">Active</span>
                      <p className="text-xs text-gray-500">Product is visible to customers</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) =>
                        setFormData({ ...formData, isFeatured: e.target.checked })
                      }
                      className="w-5 h-5 rounded border-mali-blue/20"
                    />
                    <div>
                      <span className="text-white">Featured</span>
                      <p className="text-xs text-gray-500">Show on homepage</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isBestseller}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isBestseller: e.target.checked,
                        })
                      }
                      className="w-5 h-5 rounded border-mali-blue/20"
                    />
                    <div>
                      <span className="text-white">Bestseller</span>
                      <p className="text-xs text-gray-500">Mark as popular item</p>
                    </div>
                  </label>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Sidebar - Product Type & Fields */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-mali-card border border-mali-blue/20 rounded-xl p-6 h-fit"
          >
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Tag className="w-5 h-5 text-mali-blue" />
              Product Type
            </h2>

            <div className="flex items-center gap-3 mb-6">
              <div
                className={`p-3 rounded-lg ${
                  isDirectTopUp
                    ? "bg-orange-500/20 text-orange-400"
                    : "bg-blue-500/20 text-blue-400"
                }`}
              >
                {isDirectTopUp ? (
                  <Zap className="w-6 h-6" />
                ) : (
                  <CreditCard className="w-6 h-6" />
                )}
              </div>
              <div>
                <p className="text-white font-medium">
                  {isDirectTopUp ? "Direct Top-Up" : "Gift Card"}
                </p>
                <p className="text-gray-400 text-sm">
                  {isDirectTopUp
                    ? "Requires player information"
                    : "PIN code delivery"}
                </p>
              </div>
            </div>

            {isDirectTopUp && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-medium text-white">SEAGM Fields</h3>
                  <button
                    onClick={handleRefreshFields}
                    disabled={refreshingFields}
                    className="text-sm text-mali-blue hover:text-mali-blue/80 flex items-center gap-1"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${
                        refreshingFields ? "animate-spin" : ""
                      }`}
                    />
                    Refresh
                  </button>
                </div>

                <div className="bg-mali-bg rounded-lg p-4">
                  <DynamicProductFields
                    productId={product.id}
                    onFieldsChange={(values, isValid) => {
                      console.log("Fields changed:", values, isValid);
                    }}
                    disabled={true}
                  />
                </div>

                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-xs text-blue-300">
                    Fields are managed by SEAGM. Click Refresh to update.
                  </p>
                </div>
              </>
            )}

            {!isDirectTopUp && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-300">
                  Gift cards do not require additional fields. The PIN code will be delivered after purchase.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}
