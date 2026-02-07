"use client";

import { useState } from "react";
import { motion } from "@/lib/framer-exports";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Package,
  Save,
  ChevronLeft,
  X,
  Upload,
  Tag,
  DollarSign,
  Box,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminProductEditPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "PUBG Mobile UC",
    code: "pubg-mobile-uc",
    description: "เติม UC สำหรับ PUBG Mobile",
    price: "100",
    stock: "999",
    category: "topup",
    region: "TH",
    isActive: true,
    isFeatured: false,
  });

  // Handle form field changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setIsSubmitting(false);
  };

  return (
    <AdminLayout title={"แก้ไขสินค้า" as any}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.push("/admin/products")}
            className="mr-4 p-2 rounded-lg bg-gray-100 border-[2px] border-gray-300 text-black hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center">
            <span className="w-1.5 h-6 bg-brutal-blue mr-2"></span>
            <h1 className="text-2xl font-bold text-black">แก้ไขสินค้า</h1>
          </div>
        </div>

        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-100 border-[3px] border-green-500 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว
          </motion.div>
        )}

        {/* Form Container */}
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
              ข้อมูลสินค้า
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Product Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-black mb-2"
                  >
                    ชื่อสินค้า <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="bg-white border-[2px] border-gray-300 text-black rounded-lg px-4 py-2.5 w-full focus:border-black focus:outline-none"
                    placeholder="เช่น PUBG Mobile UC"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                {/* Product Code */}
                <div>
                  <label
                    htmlFor="code"
                    className="block text-sm font-medium text-black mb-2"
                  >
                    รหัสสินค้า <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    required
                    className="bg-white border-[2px] border-gray-300 text-black rounded-lg px-4 py-2.5 w-full focus:border-black focus:outline-none font-mono"
                    placeholder="เช่น pubg-mobile-uc"
                    value={formData.code}
                    onChange={handleChange}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    รหัสใช้สำหรับ URL และอ้างอิงภายในระบบ
                  </p>
                </div>

                {/* Category */}
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-black mb-2"
                  >
                    หมวดหมู่ <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Tag className="h-5 w-5 text-gray-500" />
                    </div>
                    <select
                      id="category"
                      name="category"
                      required
                      className="bg-white border-[2px] border-gray-300 text-black rounded-lg pl-10 pr-4 py-2.5 w-full appearance-none focus:border-black focus:outline-none"
                      value={formData.category}
                      onChange={handleChange}
                    >
                      <option value="topup">เติมเงิน</option>
                      <option value="card">บัตร</option>
                      <option value="game">เกม</option>
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

                {/* Region */}
                <div>
                  <label
                    htmlFor="region"
                    className="block text-sm font-medium text-black mb-2"
                  >
                    ภูมิภาค <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="region"
                    name="region"
                    required
                    className="bg-white border-[2px] border-gray-300 text-black rounded-lg px-4 py-2.5 w-full focus:border-black focus:outline-none"
                    value={formData.region}
                    onChange={handleChange}
                  >
                    <option value="TH">ไทย (TH)</option>
                    <option value="MY">มาเลเซีย (MY)</option>
                    <option value="SG">สิงคโปร์ (SG)</option>
                    <option value="ID">อินโดนีเซีย (ID)</option>
                    <option value="GLOBAL">ทั่วโลก (GLOBAL)</option>
                  </select>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Price */}
                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-medium text-black mb-2"
                  >
                    ราคา (บาท) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      required
                      min="0"
                      className="bg-white border-[2px] border-gray-300 text-black rounded-lg pl-10 pr-4 py-2.5 w-full focus:border-black focus:outline-none"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Stock */}
                <div>
                  <label
                    htmlFor="stock"
                    className="block text-sm font-medium text-black mb-2"
                  >
                    สต็อก <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Box className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      type="number"
                      id="stock"
                      name="stock"
                      required
                      min="0"
                      className="bg-white border-[2px] border-gray-300 text-black rounded-lg pl-10 pr-4 py-2.5 w-full focus:border-black focus:outline-none"
                      placeholder="0"
                      value={formData.stock}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Active Status */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={(e) => handleChange(e as any)}
                    className="w-5 h-5 border-[2px] border-black rounded text-brutal-blue focus:ring-black"
                  />
                  <label
                    htmlFor="isActive"
                    className="text-sm font-medium text-black"
                  >
                    เปิดใช้งานสินค้า
                  </label>
                </div>

                {/* Featured */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={(e) => handleChange(e as any)}
                    className="w-5 h-5 border-[2px] border-black rounded text-brutal-blue focus:ring-black"
                  />
                  <label
                    htmlFor="isFeatured"
                    className="text-sm font-medium text-black"
                  >
                    แสดงเป็นสินค้าแนะนำ
                  </label>
                </div>

                {/* Product Image */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    รูปภาพสินค้า
                  </label>
                  <div className="border-[2px] border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-black transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      คลิกเพื่ออัปโหลดรูปภาพ
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      รองรับ PNG, JPG ขนาดสูงสุด 2MB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Textarea - Full Width */}
            <div className="mt-6">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-black mb-2"
              >
                รายละเอียดสินค้า
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="bg-white border-[2px] border-gray-300 text-black rounded-lg px-4 py-2.5 w-full focus:border-black focus:outline-none"
                placeholder="อธิบายรายละเอียดสินค้า..."
                value={formData.description}
                onChange={handleChange}
              ></textarea>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end">
              <Link href="/admin/products">
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-lg border-[3px] border-black bg-white text-black hover:bg-gray-100 transition-colors w-full sm:w-auto flex items-center justify-center font-medium"
                  style={{ boxShadow: '4px 4px 0 0 #000000' }}
                >
                  <X className="h-5 w-5 mr-2" />
                  ยกเลิก
                </button>
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-5 py-2.5 rounded-lg bg-black text-white border-[3px] border-black hover:bg-gray-800 transition-colors w-full sm:w-auto flex items-center justify-center font-medium ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
                style={{ boxShadow: '4px 4px 0 0 #000000' }}
              >
                <Save className="h-5 w-5 mr-2" />
                {isSubmitting ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
