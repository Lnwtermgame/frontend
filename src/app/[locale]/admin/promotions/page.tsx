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
        return "text-purple-700 border-purple-500 bg-purple-100";
      case "cashback":
        return "text-emerald-700 border-emerald-500 bg-emerald-100";
      case "discount":
        return "text-blue-400 border-blue-500/30 bg-[#181A1D]0/10";
      default:
        return "text-gray-300 border-gray-500 bg-[#1A1C1E]";
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-400 bg-green-500/10 border-green-300";
      case "scheduled":
        return "text-amber-700 bg-amber-100 border-amber-300";
      case "expired":
        return "text-gray-300 bg-[#1A1C1E] border-gray-300";
      default:
        return "text-gray-300 bg-[#1A1C1E] border-gray-300";
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
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-3 justify-between">
          <div className="flex items-center">
            <span className="w-1.5 h-5 bg-purple-500 mr-2"></span>
            <h1 className="text-xl font-bold text-white">จัดการโปรโมชั่น</h1>
          </div>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="ค้นหาโปรโมชั่นหรือรหัส..."
                className="bg-[#212328] border-2 border-gray-300 text-white pl-9 pr-3 py-1.5 w-full text-sm focus:ring-2 focus:ring-site-accent/50 focus:border-site-accent focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative w-full sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Info className="h-4 w-4 text-gray-500" />
              </div>
              <select
                className="bg-[#212328] border-2 border-gray-300 text-white pl-9 pr-3 py-1.5 w-full appearance-none text-sm focus:ring-2 focus:ring-site-accent/50 focus:border-site-accent focus:outline-none"
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
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-500">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Link href="/admin/promotions/settings">
              <button
                className="bg-[#212328] border border-site-border/30 rounded-[16px] text-white w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-1.5 text-sm hover:bg-[#212328]/5 transition-colors font-medium">
                <Settings className="h-4 w-4" />
                <span>ตั้งค่า</span>
              </button>
            </Link>
            <Link href="/admin/promotions/create">
              <button
                className="bg-black text-white border border-site-border/30 rounded-[8px] w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-800 transition-colors font-medium">
                <Plus className="h-4 w-4" />
                <span>สร้างโปรโมชั่น</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Promotions Table */}
        <motion.div
          className="bg-[#212328] border border-site-border/30 rounded-[16px] overflow-hidden"
          
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="p-3 border-b-2 border-site-border/50 bg-[#181A1D]">
            <h3 className="text-base font-semibold text-white flex items-center">
              <span className="w-1.5 h-5 bg-purple-500 mr-2"></span>
              <Tag className="mr-2 h-4 w-4 text-purple-400" />
              รายการโปรโมชั่น
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-400 text-xs border-b border-site-border/30">
                  <th className="px-3 py-2 text-left">โปรโมชั่น</th>
                  <th className="px-3 py-2 text-left">รหัส</th>
                  <th className="px-3 py-2 text-left">ประเภท</th>
                  <th className="px-3 py-2 text-left">ส่วนลด</th>
                  <th className="px-3 py-2 text-left">ใช้แล้ว</th>
                  <th className="px-3 py-2 text-left">วันที่</th>
                  <th className="px-3 py-2 text-left">สถานะ</th>
                  <th className="px-3 py-2 text-left">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-site-border/30">
                {filteredPromotions.length > 0 ? (
                  filteredPromotions.map((promotion) => (
                    <tr
                      key={promotion.id}
                      className="text-sm hover:bg-[#212328]/5 transition-colors">
                      <td className="px-3 py-2 font-medium text-white">
                        {promotion.title}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono bg-[#1A1C1E] border-2 border-gray-300 px-1.5 py-0.5 text-white text-xs">
                          {promotion.code}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`border-2 px-1.5 py-0.5 text-[10px] font-medium ${getPromotionTypeStyles(promotion.type)}`}>
                          {getPromotionTypeText(promotion.type)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-white font-medium">
                        {promotion.discount}
                      </td>
                      <td className="px-3 py-2 text-white">
                        {promotion.usageCount}
                      </td>
                      <td className="px-3 py-2 text-gray-400 text-xs">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1 text-gray-500" />
                          <span className="text-[10px]">
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
                      <td className="px-3 py-2">
                        <span
                          className={`px-1.5 py-0.5 text-[10px] border-2 font-medium ${getStatusStyles(promotion.status)}`}>
                          {getStatusText(promotion.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex space-x-1">
                          <button className="p-1.5 bg-[#1A1C1E] border-2 border-gray-300 text-white hover:bg-site-accent hover:text-white hover:border-site-border/50 transition-colors">
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button className="p-1.5 bg-[#1A1C1E] border-2 border-gray-300 text-white hover:bg-purple-500 hover:text-white hover:border-site-border/50 transition-colors">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                          <button className="p-1.5 bg-[#1A1C1E] border-2 border-gray-300 text-white hover:bg-red-500/100 hover:text-white hover:border-site-border/50 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      className="px-3 py-6 text-center text-gray-500 text-sm"
                      colSpan={8}
                    >
                      ไม่พบโปรโมชั่นที่ตรงกับเงื่อนไขการค้นหา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-site-border/30 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              แสดง {filteredPromotions.length} จาก {promotions.length} โปรโมชั่น
            </div>
            <div className="flex space-x-1">
              <button className="px-3 py-1 text-sm bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 text-white hover:bg-[#212328]/5 transition-colors font-medium">
                ก่อนหน้า
              </button>
              <button className="px-3 py-1 text-sm bg-purple-500 text-white border border-site-border/30 rounded-[12px] shadow-sm font-medium">
                1
              </button>
              <button className="px-3 py-1 text-sm bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 text-white hover:bg-[#212328]/5 transition-colors font-medium">
                ถัดไป
              </button>
            </div>
          </div>
        </motion.div>

        {/* Active Promotions Summary */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div
            className="bg-[#212328] border border-site-border/30 rounded-[16px] p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-base font-medium">ใช้งานอยู่</h3>
              <div className="p-1.5 bg-green-500/10 border-2 border-green-500/30/30 text-green-400">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-white">
              {
                promotions.filter((p: Promotion) => p.status === "active")
                  .length
              }
            </div>
            <div className="mt-1 text-gray-500 text-xs">
              โปรโมชั่นที่กำลังทำงาน
            </div>
          </div>

          <div
            className="bg-[#212328] border border-site-border/30 rounded-[16px] p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-base font-medium">กำหนดเวลา</h3>
              <div className="p-1.5 bg-amber-100 border-2 border-amber-500 text-amber-700">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-white">
              {
                promotions.filter((p: Promotion) => p.status === "scheduled")
                  .length
              }
            </div>
            <div className="mt-1 text-gray-500 text-xs">
              โปรโมชั่นที่จะเริ่ม
            </div>
          </div>

          <div
            className="bg-[#212328] border border-site-border/30 rounded-[16px] p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-base font-medium">ใช้ทั้งหมด</h3>
              <div className="p-1.5 bg-[#181A1D]0/10 border-2 border-blue-500/30 text-blue-400">
                <Tag className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-white">
              {promotions.reduce(
                (total: number, p: Promotion) => total + p.usageCount,
                0,
              )}
            </div>
            <div className="mt-1 text-gray-500 text-xs">
              จำนวนครั้งที่ใช้โปรโมชั่น
            </div>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
