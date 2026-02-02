"use client";

import { useState } from "react";
import { motion } from "@/lib/framer-exports";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Plus,
  Search,
  Tag,
  Edit,
  Calendar,
  Trash2,
  Info,
  Clock,
  ExternalLink,
  Settings,
} from "lucide-react";
import Link from "next/link";

// Type for promotion data
interface Promotion {
  id: string;
  title: string;
  type: string;
  discount: string;
  code: string;
  startDate: string;
  endDate: string;
  usageCount: number;
  status: string;
}

// Empty promotions array - will be populated from backend
const emptyPromotions: Promotion[] = [];

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>(emptyPromotions);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const filteredPromotions = promotions.filter((promotion: Promotion) => {
    const matchesSearch =
      promotion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promotion.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" || promotion.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getPromotionTypeStyles = (type: string) => {
    switch (type) {
      case "flash":
        return "text-purple-400 border-purple-400 bg-purple-900/20";
      case "cashback":
        return "text-emerald-400 border-emerald-400 bg-emerald-900/20";
      case "discount":
        return "text-blue-400 border-blue-400 bg-blue-900/20";
      default:
        return "text-mali-blue border-mali-blue bg-mali-blue/10";
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-400 bg-green-900/30";
      case "scheduled":
        return "text-amber-400 bg-amber-900/30";
      case "expired":
        return "text-gray-400 bg-gray-900/30";
      default:
        return "text-mali-blue bg-mali-blue/20";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "ใช้งาน";
      case "scheduled":
        return "กำหนดเวลา";
      case "expired":
        return "หมดอายุ";
      default:
        return status;
    }
  };

  const getPromotionTypeText = (type: string) => {
    switch (type) {
      case "flash":
        return "แฟลชเซล";
      case "cashback":
        return "คืนเงิน";
      case "discount":
        return "ส่วนลด";
      default:
        return type;
    }
  };

  return (
    <AdminLayout title={"โปรโมชั่น" as any}>
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
                placeholder="ค้นหาโปรโมชั่นหรือรหัส..."
                className="bg-mali-card border border-mali-blue/20 text-white rounded-lg pl-10 pr-4 py-2 w-full focus:ring-2 focus:ring-mali-blue focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative w-full sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Info className="h-5 w-5 text-mali-blue/70" />
              </div>
              <select
                className="bg-mali-card border border-mali-blue/20 text-white rounded-lg pl-10 pr-4 py-2 w-full appearance-none focus:ring-2 focus:ring-mali-blue focus:outline-none"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">ทุกสถานะ</option>
                <option value="active">ใช้งาน</option>
                <option value="scheduled">กำหนดเวลา</option>
                <option value="expired">หมดอายุ</option>
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
                  className="text-mali-blue/70"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/admin/promotions/settings">
              <button className="bg-mali-navy text-white w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg hover:bg-mali-navy/90 transition-colors">
                <Settings className="h-5 w-5" />
                <span>ตั้งค่า</span>
              </button>
            </Link>
            <Link href="/admin/promotions/create">
              <button className="bg-mali-blue text-white w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg hover:bg-mali-blue/90 transition-colors">
                <Plus className="h-5 w-5" />
                <span>สร้างโปรโมชั่น</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Promotions Table */}
        <motion.div
          className="bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="p-5 border-b border-mali-blue/20">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Tag className="mr-2 h-5 w-5 text-mali-blue" />
              จัดการโปรโมชั่น
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-mali-blue/70 text-sm">
                  <th className="px-5 py-3 text-left">โปรโมชั่น</th>
                  <th className="px-5 py-3 text-left">รหัส</th>
                  <th className="px-5 py-3 text-left">ประเภท</th>
                  <th className="px-5 py-3 text-left">ส่วนลด</th>
                  <th className="px-5 py-3 text-left">ใช้แล้ว</th>
                  <th className="px-5 py-3 text-left">วันที่</th>
                  <th className="px-5 py-3 text-left">สถานะ</th>
                  <th className="px-5 py-3 text-left">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mali-blue/10">
                {filteredPromotions.length > 0 ? (
                  filteredPromotions.map((promotion) => (
                    <tr
                      key={promotion.id}
                      className="text-sm hover:bg-mali-blue/5 transition-colors"
                    >
                      <td className="px-5 py-4 font-medium text-white">
                        {promotion.title}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono bg-mali-blue/10 px-2 py-1 rounded-md">
                          {promotion.code}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`border px-2 py-1 rounded-md text-xs ${getPromotionTypeStyles(promotion.type)}`}
                        >
                          {getPromotionTypeText(promotion.type)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-white font-medium">
                        {promotion.discount}
                      </td>
                      <td className="px-5 py-4">{promotion.usageCount}</td>
                      <td className="px-5 py-4 text-gray-300 text-xs">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1 text-mali-blue/70" />
                          <span>
                            {new Date(promotion.startDate).toLocaleDateString(
                              "th-TH",
                            )}{" "}
                            -{" "}
                            {new Date(promotion.endDate).toLocaleDateString(
                              "th-TH",
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${getStatusStyles(promotion.status)}`}
                        >
                          {getStatusText(promotion.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex space-x-2">
                          <button className="p-1 rounded-md hover:bg-mali-blue/20 text-mali-blue hover:text-white transition-colors">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-1 rounded-md hover:bg-mali-blue/20 text-mali-blue hover:text-white transition-colors">
                            <ExternalLink className="h-4 w-4" />
                          </button>
                          <button className="p-1 rounded-md hover:bg-red-500/20 text-red-400 hover:text-red-500 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      className="px-5 py-8 text-center text-gray-400"
                      colSpan={8}
                    >
                      ไม่พบโปรโมชั่นที่ตรงกับเงื่อนไขการค้นหา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-mali-blue/20 flex justify-between items-center">
            <div className="text-sm text-gray-400">
              แสดง {filteredPromotions.length} จาก {promotions.length} โปรโมชั่น
            </div>
            <div className="flex space-x-1">
              <button className="px-3 py-1 text-sm text-mali-blue hover:text-white hover:bg-mali-blue/20 rounded transition-colors">
                ก่อนหน้า
              </button>
              <button className="px-3 py-1 text-sm bg-mali-blue/20 text-white rounded">
                1
              </button>
              <button className="px-3 py-1 text-sm text-mali-blue hover:text-white hover:bg-mali-blue/20 rounded transition-colors">
                ถัดไป
              </button>
            </div>
          </div>
        </motion.div>

        {/* Active Promotions Summary */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-600/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-lg font-medium">ใช้งานอยู่</h3>
              <div className="p-2 rounded-full bg-green-900/40 text-green-400">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 text-3xl font-bold text-white">
              {
                promotions.filter((p: Promotion) => p.status === "active")
                  .length
              }
            </div>
            <div className="mt-1 text-gray-400 text-sm">
              โปรโมชั่นที่กำลังทำงาน
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-600/20 to-amber-800/20 border border-amber-600/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-lg font-medium">กำหนดเวลา</h3>
              <div className="p-2 rounded-full bg-amber-900/40 text-amber-400">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 text-3xl font-bold text-white">
              {
                promotions.filter((p: Promotion) => p.status === "scheduled")
                  .length
              }
            </div>
            <div className="mt-1 text-gray-400 text-sm">
              โปรโมชั่นที่จะเริ่ม
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-600/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-lg font-medium">ใช้ทั้งหมด</h3>
              <div className="p-2 rounded-full bg-blue-900/40 text-blue-400">
                <Tag className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 text-3xl font-bold text-white">
              {promotions.reduce(
                (total: number, p: Promotion) => total + p.usageCount,
                0,
              )}
            </div>
            <div className="mt-1 text-gray-400 text-sm">
              จำนวนครั้งที่ใช้โปรโมชั่น
            </div>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
