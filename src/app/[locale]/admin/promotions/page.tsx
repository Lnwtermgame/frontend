"use client";

import { useState } from "react";
import { motion } from "@/lib/framer-exports";
import {
  AdminLayout,
  AdminPageHeader,
  PageContainer,
  FilterBar,
  DataTable,
  StatusBadge,
  type Column,
} from "@/components/admin";
import {
  Plus,
  Tag,
  Edit,
  Calendar,
  Trash2,
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
        return "text-site-accent border-site-accent bg-site-accent/10";
      case "cashback":
        return "text-site-accent bg-site-accent bg-site-accent/10";
      case "discount":
        return "text-site-accent border-blue-500/30 bg-site-surface0/10";
      default:
        return "text-gray-300 border-gray-500 bg-site-raised";
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

  const columns: Column<Promotion>[] = [
    {
      key: "title",
      header: "โปรโมชั่น",
      render: (p) => (
        <span className="font-medium text-site-text">{p.title}</span>
      ),
    },
    {
      key: "code",
      header: "รหัส",
      render: (p) => (
        <span className="font-mono bg-site-raised border border-site-border px-1.5 py-0.5 text-site-text text-[11px] rounded">
          {p.code}
        </span>
      ),
    },
    {
      key: "type",
      header: "ประเภท",
      render: (p) => (
        <span
          className={`inline-block border px-1.5 py-0.5 text-[10px] font-medium rounded ${getPromotionTypeStyles(p.type)}`}
        >
          {getPromotionTypeText(p.type)}
        </span>
      ),
    },
    {
      key: "discount",
      header: "ส่วนลด",
      render: (p) => (
        <span className="font-medium text-site-text">{p.discount}</span>
      ),
    },
    {
      key: "usageCount",
      header: "ใช้แล้ว",
      sortable: true,
      sortAccessor: (p) => p.usageCount,
      render: (p) => <span className="text-site-text">{p.usageCount}</span>,
    },
    {
      key: "dates",
      header: "วันที่",
      render: (p) => (
        <div className="flex items-center text-site-dim text-[11px]">
          <Calendar className="h-3 w-3 mr-1 text-site-dim" />
          <span>
            {new Date(p.startDate).toLocaleDateString("th-TH")} -{" "}
            {new Date(p.endDate).toLocaleDateString("th-TH")}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "สถานะ",
      render: (p) => (
        <StatusBadge status={p.status.toUpperCase()} />
      ),
    },
    {
      key: "actions",
      header: "การดำเนินการ",
      align: "right",
      render: (p) => (
        <div className="flex justify-end gap-1">
          <button
            title="แก้ไข"
            className="p-1.5 bg-site-raised border border-site-border text-site-text hover:bg-site-accent hover:text-white hover:border-site-accent transition-colors rounded"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
          <button
            title="ดู"
            className="p-1.5 bg-site-raised border border-site-border text-site-text hover:bg-site-accent hover:text-white hover:border-site-accent transition-colors rounded"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
          <button
            title="ลบ"
            className="p-1.5 bg-site-raised border border-site-border text-site-text hover:bg-semantic-rose hover:text-white hover:border-semantic-rose transition-colors rounded"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageContainer>
        <AdminPageHeader
          title="จัดการโปรโมชั่น"
          description="จัดการรหัสส่วนลดและแคมเปญโปรโมชั่น"
          actions={
            <div className="flex flex-col sm:flex-row gap-2">
              <Link href="/admin/promotions/settings">
                <button
                  className="bg-site-surface border border-site-border rounded-lg text-site-text w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-1.5 text-sm hover:bg-site-raised transition-colors font-medium">
                  <Settings className="h-4 w-4" />
                  <span>ตั้งค่า</span>
                </button>
              </Link>
              <Link href="/admin/promotions/create">
                <button
                  className="bg-black text-white border border-site-border rounded-lg w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-800 transition-colors font-medium">
                  <Plus className="h-4 w-4" />
                  <span>สร้างโปรโมชั่น</span>
                </button>
              </Link>
            </div>
          }
        />

        <FilterBar
          search={{
            value: searchTerm,
            onChange: setSearchTerm,
            placeholder: "ค้นหาโปรโมชั่นหรือรหัส...",
          }}
          filters={[
            {
              key: "status",
              value: selectedStatus,
              onChange: setSelectedStatus,
              options: [
                { value: "all", label: "ทุกสถานะ" },
                { value: "active", label: "ใช้งาน" },
                { value: "scheduled", label: "กำหนดเวลา" },
                { value: "expired", label: "หมดอายุ" },
              ],
            },
          ]}
        />

        <DataTable
          columns={columns}
          data={filteredPromotions}
          rowKey={(p) => p.id}
          empty={{ icon: Tag, title: "ไม่พบโปรโมชั่นที่ตรงกับเงื่อนไขการค้นหา" }}
        />

        {/* Active Promotions Summary */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div
            className="bg-site-surface border border-white/5 rounded-2xl p-4">
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
            <div className="mt-1 text-gray-400 text-xs">
              โปรโมชั่นที่กำลังทำงาน
            </div>
          </div>

          <div
            className="bg-site-surface border border-white/5 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-base font-medium">กำหนดเวลา</h3>
              <div className="p-1.5 bg-site-accent/10 border-2 border-site-accent text-site-accent">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-white">
              {
                promotions.filter((p: Promotion) => p.status === "scheduled")
                  .length
              }
            </div>
            <div className="mt-1 text-gray-400 text-xs">
              โปรโมชั่นที่จะเริ่ม
            </div>
          </div>

          <div
            className="bg-site-surface border border-white/5 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-base font-medium">ใช้ทั้งหมด</h3>
              <div className="p-1.5 bg-site-surface0/10 border-2 border-blue-500/30 text-site-accent">
                <Tag className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-white">
              {promotions.reduce(
                (total: number, p: Promotion) => total + p.usageCount,
                0,
              )}
            </div>
            <div className="mt-1 text-gray-400 text-xs">
              จำนวนครั้งที่ใช้โปรโมชั่น
            </div>
          </div>
        </motion.div>
      </PageContainer>
    </AdminLayout>
  );
}
