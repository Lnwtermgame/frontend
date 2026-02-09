"use client";

import { useState, useEffect } from "react";
import { motion } from "@/lib/framer-exports";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Search,
  Package,
  Loader2,
  Eye,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { orderApi, Order } from "@/lib/services/order-api";
import Link from "next/link";

const statusStyles: Record<string, string> = {
  pending: "text-yellow-700 bg-yellow-100 border-yellow-300",
  processing: "text-blue-700 bg-blue-100 border-blue-300",
  completed: "text-green-700 bg-green-100 border-green-300",
  cancelled: "text-red-700 bg-red-100 border-red-300",
  refunded: "text-gray-700 bg-gray-100 border-gray-300",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3 w-3 mr-1" />,
  processing: <Truck className="h-3 w-3 mr-1" />,
  completed: <CheckCircle className="h-3 w-3 mr-1" />,
  cancelled: <XCircle className="h-3 w-3 mr-1" />,
  refunded: <XCircle className="h-3 w-3 mr-1" />,
};

const statusText: Record<string, string> = {
  pending: "รอดำเนินการ",
  processing: "กำลังดำเนินการ",
  completed: "สำเร็จ",
  cancelled: "ยกเลิก",
  refunded: "คืนเงิน",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, pagination.limit, selectedStatus]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await orderApi.getAllOrders(
        pagination.page,
        pagination.limit,
        selectedStatus !== "all" ? selectedStatus : undefined,
      );

      setOrders(response.data);
      setPagination((prev) => ({
        ...prev,
        total: response.meta?.total || 0,
        totalPages: response.meta?.totalPages || 1,
      }));
    } catch (err) {
      setError("ไม่สามารถโหลดคำสั่งซื้อได้");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setLoading(true);
      const response = await orderApi.updateOrderStatus(orderId, newStatus);
      if (response.success) {
        // Update the local orders state immediately
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId
              ? { ...order, status: newStatus as Order["status"] }
              : order,
          ),
        );
      } else {
        setError("ไม่สามารถอัปเดตสถานะคำสั่งซื้อได้");
      }
    } catch (err: any) {
      console.error("ไม่สามารถอัปเดตสถานะคำสั่งซื้อ:", err);
      setError(
        err?.response?.data?.error?.message ||
          "ไม่สามารถอัปเดตสถานะคำสั่งซื้อได้",
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) =>
        item.productName?.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
  );

  return (
    <AdminLayout title="คำสั่งซื้อ">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex items-center">
            <span className="w-1.5 h-6 bg-brutal-pink mr-2"></span>
            <h1 className="text-2xl font-bold text-black">จัดการคำสั่งซื้อ</h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="ค้นหาคำสั่งซื้อ..."
                className="bg-white border-[2px] border-gray-300 text-black pl-10 pr-4 py-2 w-full focus:ring-2 focus:ring-black focus:border-black focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="bg-white border-[2px] border-gray-300 text-black px-4 py-2 w-full sm:w-auto focus:border-black focus:outline-none"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">ทุกสถานะ</option>
              <option value="pending">รอดำเนินการ</option>
              <option value="processing">กำลังดำเนินการ</option>
              <option value="completed">สำเร็จ</option>
              <option value="cancelled">ยกเลิก</option>
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 border-[3px] border-red-500 text-red-700 px-4 py-3">
            {error}
          </div>
        )}

        {/* Orders Table */}
        <motion.div
          className="bg-white border-[3px] border-black overflow-hidden"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="p-5 border-b-[2px] border-black bg-gray-50">
            <h3 className="text-lg font-semibold text-black flex items-center">
              <Package className="mr-2 h-5 w-5 text-brutal-pink" />
              รายการคำสั่งซื้อ
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
                    <th className="px-5 py-3 text-left">รหัสคำสั่งซื้อ</th>
                    <th className="px-5 py-3 text-left">ลูกค้า</th>
                    <th className="px-5 py-3 text-left">รายการ</th>
                    <th className="px-5 py-3 text-left">รวม</th>
                    <th className="px-5 py-3 text-left">สถานะ</th>
                    <th className="px-5 py-3 text-left">วันที่</th>
                    <th className="px-5 py-3 text-left">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="text-sm hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-5 py-4 font-medium text-black">
                          #{order.id.slice(0, 8)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-black font-medium">
                            {order.user?.username || "-"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {order.user?.email}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-gray-700">
                            {order.items.length} รายการ
                          </div>
                          <div className="text-xs text-gray-500">
                            {order.items[0]?.productName}
                            {order.items.length > 1 && "..."}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-medium text-black">
                          {order.totalAmount.toFixed(2)} ฿
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleUpdateStatus(order.id, e.target.value)
                            }
                            className={`px-2 py-1 text-xs border-[2px] cursor-pointer font-medium focus:outline-none ${
                              statusStyles[order.status] || statusStyles.pending
                            }`}
                          >
                            <option value="pending">รอดำเนินการ</option>
                            <option value="processing">กำลังดำเนินการ</option>
                            <option value="completed">สำเร็จ</option>
                            <option value="cancelled">ยกเลิก</option>
                          </select>
                        </td>
                        <td className="px-5 py-4 text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString(
                            "th-TH",
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <Link href={`/admin/orders/${order.id}`}>
                            <button className="p-2 bg-gray-100 border-[2px] border-gray-300 text-black hover:bg-brutal-pink hover:text-white hover:border-black transition-colors">
                              <Eye className="h-4 w-4" />
                            </button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        className="px-5 py-8 text-center text-gray-500"
                        colSpan={7}
                      >
                        ไม่พบคำสั่งซื้อ
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
                แสดง {filteredOrders.length} จาก {pagination.total} คำสั่งซื้อ
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                  className="px-3 py-1 text-sm bg-white border-[2px] border-gray-300 text-black hover:bg-gray-100 transition-colors disabled:opacity-50 font-medium"
                >
                  ก่อนหน้า
                </button>
                <span className="px-3 py-1 text-sm bg-brutal-pink text-white border-[2px] border-black font-medium">
                  {pagination.page}
                </span>
                <button
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 text-sm bg-white border-[2px] border-gray-300 text-black hover:bg-gray-100 transition-colors disabled:opacity-50 font-medium"
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
