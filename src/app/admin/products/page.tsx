"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
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
            categoryId:
              selectedCategory !== "all" ? selectedCategory : undefined,
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
    return <Zap className="w-4 h-4 text-brutal-orange" />;
  };

  const getProductTypeLabel = (productType: string) => {
    if (productType === "CARD") {
      return "บัตร";
    }
    return "เติมเงิน";
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

  const getStatusStyles = (product: Product) => {
    if (product.stockQuantity === 0) {
      return "text-red-700 bg-red-100 border-red-300";
    } else if (product.stockQuantity <= 10) {
      return "text-yellow-700 bg-yellow-100 border-yellow-300";
    } else if (!product.isActive) {
      return "text-gray-700 bg-gray-100 border-gray-300";
    }
    return "text-green-700 bg-green-100 border-green-300";
  };

  const getStatusText = (product: Product) => {
    if (product.stockQuantity === 0) {
      return "สินค้าหมด";
    } else if (product.stockQuantity <= 10) {
      return "สินค้าใกล้หมด";
    } else if (!product.isActive) {
      return "ไม่ใช้งาน";
    }
    return "ใช้งาน";
  };

  return (
    <AdminLayout title={"สินค้า" as any}>
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex items-center">
            <span className="w-1.5 h-6 bg-brutal-blue mr-2"></span>
            <h1 className="text-2xl font-bold text-black">จัดการสินค้า</h1>
          </div>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="ค้นหาสินค้า..."
                className="bg-white border-[2px] border-gray-300 text-black rounded-lg pl-10 pr-4 py-2 w-full focus:ring-2 focus:ring-black focus:border-black focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative w-full sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-500" />
              </div>
              <select
                className="bg-white border-[2px] border-gray-300 text-black rounded-lg pl-10 pr-4 py-2 w-full appearance-none focus:ring-2 focus:ring-black focus:border-black focus:outline-none"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">ทุกหมวดหมู่</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-500"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSyncSeagm}
              className="bg-white border-[3px] border-black text-black flex items-center justify-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              style={{ boxShadow: '4px 4px 0 0 #000000' }}
            >
              <RefreshCw className="h-5 w-5" />
              <span>ซิงค์ SEAGM</span>
            </button>
            <button className="bg-black text-white border-[3px] border-black flex items-center justify-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium" style={{ boxShadow: '4px 4px 0 0 #000000' }}>
              <Plus className="h-5 w-5" />
              <span>เพิ่มสินค้า</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-[3px] border-red-500 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Products Table */}
        <motion.div
          className="bg-white border-[3px] border-black rounded-xl overflow-hidden"
          style={{ boxShadow: '4px 4px 0 0 #000000' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="p-5 border-b-[2px] border-black bg-gray-50">
            <h3 className="text-lg font-semibold text-black flex items-center">
              <Package className="mr-2 h-5 w-5 text-brutal-blue" />
              รายการสินค้า
            </h3>
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
                    <th className="px-5 py-3 text-left">ราคา</th>
                    <th className="px-5 py-3 text-left">สต็อก</th>
                    <th className="px-5 py-3 text-left">สถานะ</th>
                    <th className="px-5 py-3 text-left">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.length > 0 ? (
                    products.map((product) => (
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
                                className="w-10 h-10 object-cover rounded border-[2px] border-black"
                              />
                            )}
                            <div>
                              <div className="text-black font-medium">{product.name}</div>
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
                        <td className="px-5 py-4 text-black font-medium">{product.price} ฿</td>
                        <td className="px-5 py-4 text-black">{product.stockQuantity}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2 py-1 rounded text-xs border-[2px] font-medium ${getStatusStyles(product)}`}
                          >
                            {getStatusText(product)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex space-x-2">
                            <Link href={`/admin/products/${product.id}/edit`}>
                              <button className="p-2 rounded-lg bg-gray-100 border-[2px] border-gray-300 text-black hover:bg-brutal-blue hover:text-white hover:border-black transition-colors">
                                <Edit className="h-4 w-4" />
                              </button>
                            </Link>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-2 rounded-lg bg-gray-100 border-[2px] border-gray-300 text-black hover:bg-red-500 hover:text-white hover:border-black transition-colors"
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
                แสดง {products.length} จาก {pagination.total} สินค้า
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                  className="px-3 py-1 text-sm bg-white border-[2px] border-gray-300 text-black hover:bg-gray-100 rounded transition-colors disabled:opacity-50 font-medium"
                >
                  ก่อนหน้า
                </button>
                <span className="px-3 py-1 text-sm bg-brutal-blue text-white border-[2px] border-black rounded font-medium">
                  {pagination.page}
                </span>
                <button
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 text-sm bg-white border-[2px] border-gray-300 text-black hover:bg-gray-100 rounded transition-colors disabled:opacity-50 font-medium"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AdminLayout>
  );
}
