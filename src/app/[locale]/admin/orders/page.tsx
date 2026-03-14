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
import { useAuth } from "@/lib/hooks/use-auth";
import { useTranslations } from "next-intl";

const statusStyles: Record<string, string> = {
  PENDING: "text-yellow-700 bg-yellow-100 border-yellow-300",
  PROCESSING: "text-blue-700 bg-blue-100 border-blue-300",
  COMPLETED: "text-green-700 bg-green-100 border-green-300",
  FAILED: "text-red-700 bg-red-100 border-red-300",
  CANCELLED: "text-red-700 bg-red-100 border-red-300",
  REFUNDED: "text-gray-700 bg-gray-100 border-gray-300",
};

const statusIcons: Record<string, React.ReactNode> = {
  PENDING: <Clock className="h-3 w-3 mr-1" />,
  PROCESSING: <Truck className="h-3 w-3 mr-1" />,
  COMPLETED: <CheckCircle className="h-3 w-3 mr-1" />,
  FAILED: <XCircle className="h-3 w-3 mr-1" />,
  CANCELLED: <XCircle className="h-3 w-3 mr-1" />,
  REFUNDED: <XCircle className="h-3 w-3 mr-1" />,
};

const statusKeyMap: Record<string, string> = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
};

export default function AdminOrders() {
  const t = useTranslations("AdminPage");
  const { isAdmin, isInitialized, isSessionChecked } = useAuth();
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
    if (!isInitialized || !isSessionChecked || !isAdmin) {
      return;
    }
    fetchOrders();
  }, [
    pagination.page,
    pagination.limit,
    selectedStatus,
    isInitialized,
    isSessionChecked,
    isAdmin,
  ]);

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
        (item.product?.name || item.productName)?.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
  );

  return (
    <AdminLayout title={t("orders.title")}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-3 justify-between">
          <div className="flex items-center">
            <span className="w-1.5 h-5 bg-brutal-pink mr-2"></span>
            <h1 className="text-xl font-bold text-black">{t("orders.subtitle")}</h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="text"
                placeholder={t("orders.search_placeholder")}
                className="bg-white border-[2px] border-gray-300 text-black pl-9 pr-3 py-1.5 w-full focus:ring-2 focus:ring-black focus:border-black focus:outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="bg-white border-[2px] border-gray-300 text-black px-3 py-1.5 w-full sm:w-auto focus:border-black focus:outline-none text-sm"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">{t("orders.status.all")}</option>
              <option value="PENDING">{t("orders.status.pending")}</option>
              <option value="PROCESSING">{t("orders.status.processing")}</option>
              <option value="COMPLETED">{t("orders.status.completed")}</option>
              <option value="FAILED">{t("orders.status.failed")}</option>
              <option value="CANCELLED">{t("orders.status.cancelled")}</option>
              <option value="REFUNDED">{t("orders.status.refunded")}</option>
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 border-[3px] border-red-500 text-red-700 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        {/* Orders Table */}
        <motion.div
          className="bg-white border-[3px] border-black overflow-hidden"
          style={{ boxShadow: "3px 3px 0 0 #000000" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="p-3 border-b-[2px] border-black bg-gray-50">
            <h3 className="text-base font-semibold text-black flex items-center">
              <Package className="mr-2 h-4 w-4 text-brutal-pink" />
              {t("orders.title")}
            </h3>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 text-brutal-pink animate-spin" />
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-gray-600 text-xs border-b border-gray-200">
                    <th className="px-3 py-2 text-left">{t("orders.order_id")}</th>
                    <th className="px-3 py-2 text-left">{t("orders.customer")}</th>
                    <th className="px-3 py-2 text-left">{t("orders.product")}</th>
                    <th className="px-3 py-2 text-left">{t("orders.amount")}</th>
                    <th className="px-3 py-2 text-left">{t("orders.status_text")}</th>
                    <th className="px-3 py-2 text-left">{t("orders.date")}</th>
                    <th className="px-3 py-2 text-left">{t("orders.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="text-xs hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-3 py-3 font-medium text-black">
                          #{order.id.slice(0, 8)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-black font-medium">
                            {order.user?.username || "-"}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {order.user?.email}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-gray-700">
                            {order.items[0]?.product?.name || order.items[0]?.productName || `${order.items.length} ${t("order_detail.items")}`}
                          </div>
                          {order.items[0]?.productType?.name && (
                            <div className="text-[10px] text-blue-600 font-semibold">
                              {order.items[0].productType.name}
                            </div>
                          )}
                          {order.items.length > 1 && (
                            <div className="text-[10px] text-gray-500">
                              +{order.items.length - 1} {t("order_detail.items")}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 font-medium text-black">
                          {order.totalAmount.toFixed(2)} ฿
                        </td>
                        <td className="px-3 py-3">
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleUpdateStatus(order.id, e.target.value)
                            }
                            className={`px-1.5 py-0.5 text-[10px] border-[1px] cursor-pointer font-medium focus:outline-none ${statusStyles[order.status] || statusStyles.PENDING
                              }`}
                          >
                            <option value="PENDING">{t("orders.status.pending")}</option>
                            <option value="PROCESSING">{t("orders.status.processing")}</option>
                            <option value="COMPLETED">{t("orders.status.completed")}</option>
                            <option value="FAILED">{t("orders.status.failed")}</option>
                            <option value="CANCELLED">{t("orders.status.cancelled")}</option>
                            <option value="REFUNDED">{t("orders.status.refunded")}</option>
                          </select>
                        </td>
                        <td className="px-3 py-3 text-gray-500 text-[10px]">
                          {new Date(order.createdAt).toLocaleDateString(
                            "th-TH",
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <Link href={`/admin/orders/${order.id}`}>
                            <button className="p-1.5 bg-gray-100 border-[1px] border-gray-300 text-black hover:bg-brutal-pink hover:text-white hover:border-black transition-colors">
                              <Eye className="h-3 w-3" />
                            </button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        className="px-3 py-6 text-center text-gray-500 text-xs"
                        colSpan={7}
                      >
                        {t("orders.no_orders")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div className="p-3 border-t border-gray-200 flex justify-between items-center">
              <div className="text-xs text-gray-500">
                {t("common.showing")} {filteredOrders.length} {t("common.from")} {pagination.total} {t("orders.title")}
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                  className="px-2 py-0.5 text-xs bg-white border-[2px] border-gray-300 text-black hover:bg-gray-100 transition-colors disabled:opacity-50 font-medium"
                >
                  ก่อนหน้า
                </button>
                <span className="px-2 py-0.5 text-xs bg-brutal-pink text-white border-[2px] border-black font-medium">
                  {pagination.page}
                </span>
                <button
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-2 py-0.5 text-xs bg-white border-[2px] border-gray-300 text-black hover:bg-gray-100 transition-colors disabled:opacity-50 font-medium"
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
