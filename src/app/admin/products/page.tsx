"use client";

import { useState, useEffect } from "react";
import { motion } from "@/lib/framer-exports";
import AdminLayout from "@/components/layout/AdminLayout";
import { useTranslations } from "@/lib/context/language-context";
import { Plus, Search, Filter, Edit, Trash2, MoreHorizontal, Package } from "lucide-react";

// Mock product data
const mockProducts = [
  {
    id: "prod-1",
    name: "PUBG Mobile UC",
    category: "Mobile Games",
    price: 19.99,
    stock: 999,
    sold: 286,
    status: "active"
  },
  {
    id: "prod-2",
    name: "Steam Wallet Card",
    category: "Gift Cards",
    price: 50.00,
    stock: 423,
    sold: 189,
    status: "active"
  },
  {
    id: "prod-3",
    name: "Valorant Points",
    category: "PC Games",
    price: 9.99,
    stock: 845,
    sold: 312,
    status: "active"
  },
  {
    id: "prod-4",
    name: "Free Fire Diamonds",
    category: "Mobile Games",
    price: 4.99,
    stock: 1240,
    sold: 562,
    status: "active"
  },
  {
    id: "prod-5",
    name: "Razer Gold PIN",
    category: "Gift Cards",
    price: 25.00,
    stock: 327,
    sold: 118,
    status: "low"
  },
  {
    id: "prod-6",
    name: "Mobile Legends Diamonds",
    category: "Mobile Games",
    price: 14.99,
    stock: 768,
    sold: 259,
    status: "active"
  },
  {
    id: "prod-7",
    name: "Google Play Gift Card",
    category: "Gift Cards",
    price: 10.00,
    stock: 0,
    sold: 421,
    status: "out-of-stock"
  },
  {
    id: "prod-8",
    name: "PlayStation Network Card",
    category: "Gift Cards",
    price: 25.00,
    stock: 124,
    sold: 87,
    status: "active"
  }
];

export default function AdminProducts() {
  const { t } = useTranslations();
  const [products, setProducts] = useState(mockProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...new Set(products.map(p => p.category))];
  
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
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
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
          
          {/* Add Product Button */}
          <button className="bg-mali-blue text-white flex items-center justify-center gap-2 px-4 py-2 rounded-lg hover:bg-mali-blue/90 transition-colors">
            <Plus className="h-5 w-5" />
            <span>Add Product</span>
          </button>
        </div>
        
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
            <table className="w-full">
              <thead>
                <tr className="text-mali-blue/70 text-sm">
                  <th className="px-5 py-3 text-left">Product</th>
                  <th className="px-5 py-3 text-left">Category</th>
                  <th className="px-5 py-3 text-left">Price</th>
                  <th className="px-5 py-3 text-left">Stock</th>
                  <th className="px-5 py-3 text-left">Sold</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mali-blue/10">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="text-sm hover:bg-mali-blue/5 transition-colors">
                      <td className="px-5 py-4 font-medium text-white">{product.name}</td>
                      <td className="px-5 py-4 text-gray-300">{product.category}</td>
                      <td className="px-5 py-4">${product.price.toFixed(2)}</td>
                      <td className="px-5 py-4">{product.stock}</td>
                      <td className="px-5 py-4">{product.sold}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          product.status === 'active' ? 'text-green-400 bg-green-900/30' :
                          product.status === 'low' ? 'text-yellow-400 bg-yellow-900/30' :
                          'text-red-400 bg-red-900/30'
                        }`}>
                          {product.status === 'active' ? 'Active' :
                           product.status === 'low' ? 'Low Stock' :
                           'Out of Stock'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex space-x-2">
                          <button className="p-1 rounded-md hover:bg-mali-blue/20 text-mali-blue hover:text-white transition-colors">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-1 rounded-md hover:bg-red-500/20 text-red-400 hover:text-red-500 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button className="p-1 rounded-md hover:bg-mali-blue/20 text-mali-blue hover:text-white transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-5 py-8 text-center text-gray-400" colSpan={7}>
                      No products found matching your search criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-mali-blue/20 flex justify-between items-center">
            <div className="text-sm text-gray-400">
              Showing {filteredProducts.length} of {products.length} products
            </div>
            <div className="flex space-x-1">
              <button className="px-3 py-1 text-sm text-mali-blue hover:text-white hover:bg-mali-blue/20 rounded transition-colors">
                Previous
              </button>
              <button className="px-3 py-1 text-sm bg-mali-blue/20 text-white rounded">
                1
              </button>
              <button className="px-3 py-1 text-sm text-mali-blue hover:text-white hover:bg-mali-blue/20 rounded transition-colors">
                Next
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
} 