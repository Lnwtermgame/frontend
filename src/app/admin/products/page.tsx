"use client";

import { useState, useEffect } from "react";
import { motion } from "@/lib/framer-exports";
import AdminLayout from "@/components/layout/AdminLayout";
import { Plus, Search, Filter, Edit, Trash2, MoreHorizontal, Package, Loader2, RefreshCw, CreditCard, Zap, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { productApi, Product, Category } from "@/lib/services/product-api";
import Link from "next/link";

export default function AdminProducts() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [productsRes, categoriesRes] = await Promise.all([
          productApi.getProducts({
            page: pagination.page,
            limit: pagination.limit,
            search: searchTerm || undefined,
            categoryId: selectedCategory !== "all" ? selectedCategory : undefined,
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
        setError("Failed to load products");
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
      return <CreditCard className="w-4 h-4 text-blue-400" />;
    }
    return <Zap className="w-4 h-4 text-orange-400" />;
  };

  const getProductTypeLabel = (productType: string) => {
    if (productType === "CARD") {
      return "Card";
    }
    return "Top-Up";
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      // Note: Need to add deleteProduct to productApi
      // await productApi.deleteProduct(productId);
      setProducts(products.filter((p) => p.id !== productId));
    } catch (err) {
      console.error("Failed to delete product:", err);
    }
  };

  const getStatusStyles = (product: Product) => {
    if (product.stockQuantity === 0) {
      return "text-red-400 bg-red-900/30";
    } else if (product.stockQuantity <= 10) {
      return "text-yellow-400 bg-yellow-900/30";
    } else if (!product.isActive) {
      return "text-gray-400 bg-gray-900/30";
    }
    return "text-green-400 bg-green-900/30";
  };

  const getStatusText = (product: Product) => {
    if (product.stockQuantity === 0) {
      return "Out of Stock";
    } else if (product.stockQuantity <= 10) {
      return "Low Stock";
    } else if (!product.isActive) {
      return "Inactive";
    }
    return "Active";
  };

  return (
    <AdminLayout title={"Products" as any}>
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-mali-blue/70" />
              </div>
              <input
                type="text"
                placeholder="Search products..."
                className="bg-mali-card border border-mali-blue/20 text-white rounded-lg pl-10 pr-4 py-2 w-full focus:ring-2 focus:ring-mali-blue focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative w-full sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-mali-blue/70" />
              </div>
              <select
                className="bg-mali-card border border-mali-blue/20 text-white rounded-lg pl-10 pr-4 py-2 w-full appearance-none focus:ring-2 focus:ring-mali-blue focus:outline-none"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-mali-blue/70">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSyncSeagm}
              className="bg-mali-card border border-mali-blue/30 text-white flex items-center justify-center gap-2 px-4 py-2 rounded-lg hover:bg-mali-blue/10 transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Sync SEAGM</span>
            </button>
            <button className="bg-mali-blue text-white flex items-center justify-center gap-2 px-4 py-2 rounded-lg hover:bg-mali-blue/90 transition-colors">
              <Plus className="h-5 w-5" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Products Table */}
        <motion.div
          className="bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="p-5 border-b border-mali-blue/20">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Package className="mr-2 h-5 w-5 text-mali-blue" />
              Product Management
            </h3>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-mali-blue animate-spin" />
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-mali-blue/70 text-sm">
                    <th className="px-5 py-3 text-left">Product</th>
                    <th className="px-5 py-3 text-left">Type</th>
                    <th className="px-5 py-3 text-left">Category</th>
                    <th className="px-5 py-3 text-left">Price</th>
                    <th className="px-5 py-3 text-left">Stock</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mali-blue/10">
                  {products.length > 0 ? (
                    products.map((product) => (
                      <tr key={product.id} className="text-sm hover:bg-mali-blue/5 transition-colors">
                        <td className="px-5 py-4 font-medium text-white">
                          <div className="flex items-center gap-3">
                            {product.imageUrl && (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                            <div>
                              <div>{product.name}</div>
                              <div className="text-xs text-gray-500">{product.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {getProductTypeIcon(product.productType)}
                            <span className="text-xs text-gray-400">
                              {getProductTypeLabel(product.productType)}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-300">
                          {product.category?.name || "-"}
                        </td>
                        <td className="px-5 py-4">{product.price} ฿</td>
                        <td className="px-5 py-4">{product.stockQuantity}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusStyles(product)}`}>
                            {getStatusText(product)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex space-x-2">
                            <Link href={`/admin/products/${product.id}/edit`}>
                              <button className="p-1 rounded-md hover:bg-mali-blue/20 text-mali-blue hover:text-white transition-colors">
                                <Edit className="h-4 w-4" />
                              </button>
                            </Link>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-1 rounded-md hover:bg-red-500/20 text-red-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <Link href={`/admin/products/${product.id}`}>
                              <button className="p-1 rounded-md hover:bg-mali-blue/20 text-mali-blue hover:text-white transition-colors">
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-5 py-8 text-center text-gray-400" colSpan={6}>
                        No products found matching your search criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div className="p-4 border-t border-mali-blue/20 flex justify-between items-center">
              <div className="text-sm text-gray-400">
                Showing {products.length} of {pagination.total} products
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 text-sm text-mali-blue hover:text-white hover:bg-mali-blue/20 rounded transition-colors disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm bg-mali-blue/20 text-white rounded">
                  {pagination.page}
                </span>
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 text-sm text-mali-blue hover:text-white hover:bg-mali-blue/20 rounded transition-colors disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AdminLayout>
  );
}
