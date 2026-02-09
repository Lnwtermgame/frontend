"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { Search, Filter, Calendar, Download, MoreHorizontal, ChevronLeft, ChevronRight, Package, Truck, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { motion } from "@/lib/framer-exports";

// Mock management orders (perhaps for a seller or power user view?)
const managementOrders = [
  {
    id: "MNG-5001",
    customer: "Alice Walker",
    date: "2023-11-21",
    total: "$120.00",
    status: "processing",
    items: 3
  },
  {
    id: "MNG-5002",
    customer: "Bob Martin",
    date: "2023-11-20",
    total: "$45.50",
    status: "shipped",
    items: 1
  },
  {
    id: "MNG-5003",
    customer: "Charlie Brown",
    date: "2023-11-19",
    total: "$210.00",
    status: "delivered",
    items: 5
  },
  {
    id: "MNG-5004",
    customer: "Diana Prince",
    date: "2023-11-18",
    total: "$15.00",
    status: "cancelled",
    items: 1
  }
];

export default function OrderManagementPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOrders, setFilteredOrders] = useState(managementOrders);
  const [statusFilter, setStatusFilter] = useState("all");

  // If not logged in, redirect to login page
  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [user, router, isInitialized]);

  // Filter orders
  useEffect(() => {
    let result = managementOrders;

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(order => order.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      result = result.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(result);
  }, [searchTerm, statusFilter]);

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent animate-spin"></div>
          <p className="mt-4 text-gray-600 thai-font">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 border border-black thai-font">
            <CheckCircle className="w-3 h-3 mr-1" /> จัดส่งแล้ว
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 border border-black thai-font">
            <Clock className="w-3 h-3 mr-1" /> กำลังดำเนินการ
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 border border-black thai-font">
            <Truck className="w-3 h-3 mr-1" /> จัดส่งสินค้าแล้ว
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 border border-black thai-font">
            <AlertCircle className="w-3 h-3 mr-1" /> ยกเลิกแล้ว
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 border border-black">
            {status}
          </span>
        );
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="relative mb-6">
        <div className="flex justify-between items-start">
          <div>
            <motion.h2
              className="text-xl font-bold text-black mb-1 relative thai-font"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              การจัดการคำสั่งซื้อ
            </motion.h2>
            <p className="text-gray-600 text-sm relative thai-font">
              จัดการและติดตามคำสั่งซื้อทั้งหมด
            </p>
          </div>
          <button className="bg-brutal-blue hover:bg-blue-600 text-white border-[3px] border-black px-4 py-2 text-sm font-medium transition-colors flex items-center thai-font" style={{ boxShadow: '4px 4px 0 0 #000000' }}>
            <Download className="h-4 w-4 mr-2" />
            ส่งออกรายงาน
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="ค้นหารหัสคำสั่งซื้อหรือลูกค้า..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border-[3px] border-black text-black placeholder-gray-500 focus:outline-none focus:ring-0 transition-colors thai-font"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border-[3px] border-black text-black px-4 py-2 text-sm focus:outline-none focus:ring-0 cursor-pointer thai-font"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="processing">กำลังดำเนินการ</option>
            <option value="shipped">จัดส่งสินค้าแล้ว</option>
            <option value="delivered">จัดส่งแล้ว</option>
            <option value="cancelled">ยกเลิกแล้ว</option>
          </select>

          <button className="bg-white border-[3px] border-black p-2 text-gray-600 hover:bg-gray-50 transition-colors" style={{ boxShadow: '4px 4px 0 0 #000000' }}>
            <Filter className="h-4 w-4" />
          </button>

          <button className="bg-white border-[3px] border-black p-2 text-gray-600 hover:bg-gray-50 transition-colors" style={{ boxShadow: '4px 4px 0 0 #000000' }}>
            <Calendar className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <motion.div
        className="bg-white border-[3px] border-black overflow-hidden"
        style={{ boxShadow: '4px 4px 0 0 #000000' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b-[3px] border-black text-xs uppercase text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-4 thai-font">รหัสคำสั่งซื้อ</th>
                <th className="px-6 py-4 thai-font">ลูกค้า</th>
                <th className="px-6 py-4 thai-font">วันที่</th>
                <th className="px-6 py-4 thai-font">รายการ</th>
                <th className="px-6 py-4 thai-font">ยอดรวม</th>
                <th className="px-6 py-4 thai-font">สถานะ</th>
                <th className="px-6 py-4 text-right thai-font">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order, index) => (
                  <motion.tr
                    key={order.id}
                    className="hover:bg-gray-50 transition-colors"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="px-6 py-4 font-medium text-black">{order.id}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{order.customer}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{order.date}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{order.items}</td>
                    <td className="px-6 py-4 text-black font-medium">{order.total}</td>
                    <td className="px-6 py-4">{renderStatusBadge(order.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 hover:bg-gray-100 text-gray-600 hover:text-black transition-colors border-[3px] border-transparent hover:border-black">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-600">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="thai-font">ไม่พบคำสั่งซื้อที่ตรงตามเงื่อนไข</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t-[3px] border-black flex items-center justify-between">
          <p className="text-xs text-gray-600 thai-font">
            แสดง <span className="font-medium text-black">1</span> ถึง <span className="font-medium text-black">{filteredOrders.length}</span> จาก <span className="font-medium text-black">{filteredOrders.length}</span> รายการ
          </p>
          <div className="flex gap-2">
            <button className="p-1.5 border-[3px] border-black text-gray-600 opacity-50 cursor-not-allowed">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="p-1.5 border-[3px] border-black text-gray-600 hover:text-black hover:bg-gray-50 transition-colors" style={{ boxShadow: '4px 4px 0 0 #000000' }}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
