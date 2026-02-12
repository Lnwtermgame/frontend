"use client";

import { useState, useEffect, useRef } from "react";
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
import { getMinPrice, formatPrice } from "@/lib/utils";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<
    "all" | "CARD" | "DIRECT_TOPUP"
  >("all");
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        setLoading(true);

        const [productsRes, categoriesRes] = await Promise.all([
          productApi.getProducts({
            isActive: true,
            inStock: true,
            limit: 100,
            signal: controller.signal,
          }),
          productApi.getCategories(controller.signal),
        ]);

        if (productsRes.success) {
          setProducts(productsRes.data);
        }
        if (categoriesRes.success) {
          setCategories(categoriesRes.data);
        }
      } catch (error: any) {
        if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") {
          console.error("Failed to fetch products:", error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
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
      <div className="min-h-screen flex items-center justify-center bg-brutal-gray">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-black animate-spin" />
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brutal-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-4 flex items-center justify-center">
            <span className="w-1.5 h-8 bg-brutal-pink mr-3"></span>
            All Products
            <span className="w-1.5 h-8 bg-brutal-pink ml-3"></span>
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Browse our collection of gift cards and direct top-up products
          </p>
        </div>

        {/* Filters */}
        <div
          className="bg-white border-[3px] border-black p-4 mb-8"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border-[3px] border-black pl-10 pr-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:ring-0"
              />
            </div>

            {/* Category Filter */}
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <select
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="w-full bg-white border-[3px] border-black pl-10 pr-10 py-3 text-black appearance-none cursor-pointer focus:outline-none focus:ring-0"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23000000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
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
                  className={`px-4 py-3 font-bold transition-colors flex items-center gap-2 border-[3px] ${
                    selectedType === type
                      ? "bg-black text-white border-black"
                      : "bg-white border-black text-gray-700 hover:bg-gray-100"
                  }`}
                  style={
                    selectedType === type
                      ? { boxShadow: "2px 2px 0 0 #000000" }
                      : {}
                  }
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
        <p className="text-gray-600 mb-6 font-medium">
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
                className="bg-white border-[3px] border-black overflow-hidden group cursor-pointer"
                style={{ boxShadow: "4px 4px 0 0 #000000" }}
                whileHover={{ y: -4 }}
              >
                {/* Image */}
                <div className="relative aspect-square bg-brutal-gray">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-gray-400" />
                    </div>
                  )}

                  {/* Product Type Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`px-2 py-1 text-xs font-bold border-[2px] border-black ${
                        product.productType === "DIRECT_TOPUP"
                          ? "bg-brutal-yellow text-black"
                          : "bg-brutal-blue text-black"
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
                      <span className="bg-brutal-pink text-black border-[2px] border-black px-2 py-1 text-xs font-bold">
                        Featured
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="text-black font-bold mb-1 truncate">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {product.category?.name || "Uncategorized"}
                  </p>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xl font-bold text-black">
                        {formatPrice(getMinPrice(product.types))}
                      </span>
                    </div>

                    <button className="p-2 bg-black text-white border-[2px] border-black hover:bg-gray-800 transition-colors">
                      <ShoppingCart className="w-5 h-5" />
                    </button>
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
            <h3 className="text-xl font-bold text-black mb-2">
              No products found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
