"use client";

import { useState, useEffect } from "react";
import { motion } from "@/lib/framer-exports";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Filter,
  ChevronDown,
  Zap,
  CreditCard,
  ShoppingCart,
  Package,
  Loader2,
} from "lucide-react";
import { productApi, Product, Category } from "@/lib/services/product-api";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"all" | "CARD" | "DIRECT_TOPUP">("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [productsRes, categoriesRes] = await Promise.all([
          productApi.getProducts({
            isActive: true,
            inStock: true,
            limit: 100,
          }),
          productApi.getCategories(),
        ]);

        if (productsRes.success) {
          setProducts(productsRes.data);
        }
        if (categoriesRes.success) {
          setCategories(categoriesRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory
      ? product.categoryId === selectedCategory
      : true;
    const matchesType =
      selectedType === "all" ? true : product.productType === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-mali-blue animate-spin" />
          <p className="mt-4 text-gray-400">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mali-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">All Products</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Browse our collection of gift cards and direct top-up products
            powered by SEAGM
          </p>
        </div>

        {/* Filters */}
        <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-mali-bg border border-mali-blue/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-mali-blue/50 focus:border-mali-blue outline-none"
              />
            </div>

            {/* Category Filter */}
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory || ""}
                onChange={(e) =>
                  setSelectedCategory(e.target.value || null)
                }
                className="w-full bg-mali-bg border border-mali-blue/20 rounded-lg pl-10 pr-10 py-3 text-white appearance-none cursor-pointer focus:ring-2 focus:ring-mali-blue/50 focus:border-mali-blue outline-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                  backgroundSize: "16px",
                }}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex gap-2">
              {(["all", "CARD", "DIRECT_TOPUP"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    selectedType === type
                      ? "bg-mali-blue text-white"
                      : "bg-mali-bg border border-mali-blue/20 text-gray-400 hover:text-white"
                  }`}
                >
                  {type === "all" && "All"}
                  {type === "CARD" && (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Cards
                    </>
                  )}
                  {type === "DIRECT_TOPUP" && (
                    <>
                      <Zap className="w-4 h-4" />
                      Top-Up
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-gray-400 mb-6">
          Showing {filteredProducts.length} of {products.length} products
        </p>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => (
            <Link key={product.id} href={`/products/${product.slug}`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden group hover:border-mali-blue/50 transition-colors"
              >
                {/* Image */}
                <div className="relative aspect-square bg-mali-blue/5">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-mali-blue/30" />
                    </div>
                  )}

                  {/* Product Type Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.productType === "DIRECT_TOPUP"
                          ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      {product.productType === "DIRECT_TOPUP" ? (
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          Top-Up
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          Card
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Featured Badge */}
                  {product.isFeatured && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-1 rounded-full text-xs font-medium">
                        Featured
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="text-white font-semibold mb-1 truncate">
                    {product.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">
                    {product.category?.name || "Uncategorized"}
                  </p>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xl font-bold text-white">
                        ฿{product.price.toFixed(2)}
                      </span>
                      {product.comparePrice && (
                        <span className="text-sm text-gray-500 line-through ml-2">
                          ฿{product.comparePrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <button className="p-2 bg-mali-blue/10 hover:bg-mali-blue/20 text-mali-blue rounded-lg transition-colors">
                      <ShoppingCart className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Stock Status */}
                  <div className="mt-3 flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        product.stockQuantity > 10
                          ? "bg-green-400"
                          : product.stockQuantity > 0
                          ? "bg-yellow-400"
                          : "bg-red-400"
                      }`}
                    />
                    <span
                      className={`text-xs ${
                        product.stockQuantity > 10
                          ? "text-green-400"
                          : product.stockQuantity > 0
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {product.stockQuantity > 10
                        ? "In Stock"
                        : product.stockQuantity > 0
                        ? `Only ${product.stockQuantity} left`
                        : "Out of Stock"}
                    </span>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No products found
            </h3>
            <p className="text-gray-400">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
