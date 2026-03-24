"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "@/lib/framer-exports";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  User,
  Mail,
  Calendar,
  CreditCard,
  Tag,
  RefreshCw,
  FileText,
  AlertCircle,
} from "lucide-react";
import { orderApi, Order } from "@/lib/services/order-api";
import { useTranslations } from "next-intl";

const statusConfig: Record<
  string,
  { color: string; bgColor: string; icon: React.ReactNode }
> = {
  PENDING: {
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    icon: <Clock className="h-5 w-5" />,
  },
  PROCESSING: {
    color: "text-blue-400",
    bgColor: "bg-[#181A1D]0/10",
    icon: <Truck className="h-5 w-5" />,
  },
  COMPLETED: {
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    icon: <CheckCircle className="h-5 w-5" />,
  },
  FAILED: {
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    icon: <XCircle className="h-5 w-5" />,
  },
  CANCELLED: {
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    icon: <XCircle className="h-5 w-5" />,
  },
  REFUNDED: {
    color: "text-gray-300",
    bgColor: "bg-[#1A1C1E]",
    icon: <XCircle className="h-5 w-5" />,
  },
};

const fulfillStatusConfig: Record<
  string,
  { color: string; bgColor: string }
> = {
  PENDING: {
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
  },
  PROCESSING: {
    color: "text-blue-400",
    bgColor: "bg-[#181A1D]0/10",
  },
  COMPLETED: {
    color: "text-green-400",
    bgColor: "bg-green-500/10",
  },
  FAILED: { color: "text-red-400", bgColor: "bg-red-500/10" },
};

const statusKeyMap: Record<string, string> = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
};

export default function OrderViewPage() {
  const t = useTranslations("AdminPage");
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderApi.getAdminOrderById(orderId);
      if (response.success) {
        setOrder(response.data);
        setSelectedStatus(response.data.status);
      }
    } catch (err) {
      setError("ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!order || selectedStatus === order.status) return;

    try {
      setUpdating(true);
      await orderApi.updateOrderStatus(order.id, selectedStatus);
      await fetchOrder();
    } catch (err) {
      setError("ไม่สามารถอัปเดตสถานะได้");
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleFulfill = async () => {
    if (!order) return;

    try {
      setUpdating(true);
      await orderApi.fulfillOrder(order.id);
      await fetchOrder();
    } catch (err) {
      setError("ไม่สามารถดำเนินการ Fulfill ได้");
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 text-pink-400 animate-spin" />
          <p className="mt-4 text-gray-400 font-medium">
            กำลังโหลดข้อมูลคำสั่งซื้อ...
          </p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="page-container">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30/30 rounded-[12px] p-6 text-center">
          <AlertCircle className="mx-auto text-red-600 mb-3" size={48} />
          <h2 className="text-xl font-bold text-white mb-2">ไม่พบคำสั่งซื้อ</h2>
          <p className="text-red-600 mb-4">
            {error || "ไม่พบข้อมูลคำสั่งซื้อที่ระบุ"}
          </p>
          <Link
            href="/admin/orders"
            className="inline-flex items-center bg-site-accent hover:bg-site-accent/90 text-white px-6 py-2 font-bold border border-site-border/30 rounded-[12px] transition-all hover:-translate-y-0.5">
            <ArrowLeft size={18} className="mr-2" />
            {t("order_detail.back_to_orders")}
          </Link>
        </motion.div>
      </div>
    );
  }

  const status = statusConfig[order.status] || statusConfig.PENDING;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-1.5 bg-[#212328] border border-site-border/30 rounded-[16px] hover:bg-[#212328]/5 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-pink-400" />
              {t("order_detail.title")} #
              {order.orderNumber || order.id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-gray-400 text-xs">
              {t("order_detail.subtitle")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrder}
            className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-site-border/30 rounded-[12px] font-bold hover:bg-orange-500/10/90 transition-all hover:-translate-y-0.5 text-sm">
            <RefreshCw className="h-3 w-3" />
            {t("common.refresh")}
          </button>
        </div>
      </div>

      {/* Status Banner - Hidden when printing */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${status.bgColor} border border-site-border/30 rounded-[12px] p-3 flex items-center justify-between print:hidden`}>
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm ${status.color}`}>
            {status.icon}
          </div>
          <div>
            <p className="text-xs text-gray-400">{t("order_detail.order_status")}</p>
            <p className={`text-base font-bold ${status.color}`}>
              {t(`orders.status.${statusKeyMap[order.status] || order.status.toLowerCase()}`)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">{t("order_detail.order_date")}</p>
          <p className="font-bold text-white text-sm">{formatDate(order.createdAt)}</p>
        </div>
      </motion.div>

      {/* Order Management Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 print:hidden">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#212328] border border-site-border/30 rounded-[16px] overflow-hidden">
            <div className="p-3 border-b-[3px] border-site-border/50 bg-[#1A1C1E]">
              <h2 className="font-bold text-white flex items-center gap-2 text-base">
                <Package className="h-4 w-4 text-site-accent" />
                {t("order_detail.items")}
              </h2>
            </div>
            <div className="divide-y-[2px] divide-site-border/30">
              {order.items.map((item, index) => {
                const itemFulfillStatus =
                  fulfillStatusConfig[item.fulfillStatus] || fulfillStatusConfig.PENDING;
                const productName = item.product?.name || item.productName || "สินค้า";
                const productTypeName = item.productType?.name;
                return (
                  <div
                    key={item.id}
                    className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {item.product?.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={productName}
                          className="w-10 h-10 object-cover border border-site-border/30 rounded-[12px] shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-[#1A1C1E] border border-site-border/30 rounded-[12px] shadow-sm flex items-center justify-center font-bold text-gray-400 text-xs">
                          {index + 1}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-white text-sm">
                          {productName}
                        </p>
                        {productTypeName && (
                          <p className="text-xs text-site-accent font-semibold">
                            {productTypeName}
                            {item.productType?.parValue ? ` (${item.productType.parValue} ${item.productType.currency || ''})`.trim() : ''}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          จำนวน: {item.quantity} | ราคา:{" "}
                          {formatPrice(item.priceAtPurchase || item.price || 0)}
                        </p>
                        {item.playerInfo &&
                          Object.keys(item.playerInfo).length > 0 && (
                            <div className="mt-1 text-[10px] text-gray-500 bg-[#1A1C1E] p-1.5 border border-gray-300">
                              {Object.entries(item.playerInfo).map(
                                ([key, value]) => (
                                  <div key={key}>
                                    <span className="font-semibold">{key}:</span> {value}
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 border border-site-border/30 rounded-[12px] shadow-sm text-[10px] font-bold ${itemFulfillStatus.bgColor} ${itemFulfillStatus.color}`}>
                        {t(`orders.status.${statusKeyMap[item.fulfillStatus] || item.fulfillStatus.toLowerCase()}`)}
                      </span>
                      <p className="text-xs text-gray-500 font-mono">
                        {formatPrice((item.priceAtPurchase || item.price || 0) * item.quantity)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Payment Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#212328] border border-site-border/30 rounded-[16px] overflow-hidden">
            <div className="p-3 border-b-[3px] border-site-border/50 bg-[#1A1C1E]">
              <h2 className="font-bold text-white flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4 text-green-400" />
                สรุปการชำระเงิน
              </h2>
            </div>
            <div className="p-3 space-y-2">
              <div className="flex justify-between text-gray-400 text-sm">
                <span>ยอดรวมสินค้า</span>
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-400 text-sm">
                <span>ส่วนลด</span>
                <span className="text-green-600">
                  -{formatPrice(order.discountAmount)}
                </span>
              </div>
              <div className="border-t-[2px] border-site-border/30 pt-2">
                <div className="flex justify-between text-lg font-bold text-white">
                  <span>ยอดสุทธิ</span>
                  <span className="text-pink-400">
                    {formatPrice(order.finalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Customer & Actions */}
        <div className="space-y-4">
          {/* Customer Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#212328] border border-site-border/30 rounded-[16px] overflow-hidden">
            <div className="p-3 border-b-[3px] border-site-border/50 bg-[#1A1C1E]">
              <h2 className="font-bold text-white flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-purple-400" />
                ข้อมูลลูกค้า
              </h2>
            </div>
            <div className="p-3 space-y-3">
              {order.user ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/10 border border-site-border/30 rounded-[12px] shadow-sm flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">
                        {order.user.username || "ไม่ระบุชื่อ"}
                      </p>
                      <p className="text-xs text-gray-400">
                        ID: {order.user.id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 bg-[#181A1D] p-2 border border-site-border/30">
                    <Mail className="h-3 w-3" />
                    <span className="text-xs">{order.user.email}</span>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-3 text-sm">
                  ไม่พบข้อมูลลูกค้า
                </p>
              )}
            </div>
          </motion.div>

          {/* Order Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#212328] border border-site-border/30 rounded-[16px] overflow-hidden">
            <div className="p-3 border-b-[3px] border-site-border/50 bg-[#1A1C1E]">
              <h2 className="font-bold text-white flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-orange-400" />
                ข้อมูลคำสั่งซื้อ
              </h2>
            </div>
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <Tag className="h-3 w-3 text-gray-400" />
                <span className="text-gray-400">รหัสคำสั่งซื้อ:</span>
                <span className="font-mono font-bold text-white">
                  {order.id}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span className="text-gray-400">สร้างเมื่อ:</span>
                <span className="font-bold text-white">
                  {formatDate(order.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <RefreshCw className="h-3 w-3 text-gray-400" />
                <span className="text-gray-400">อัปเดตล่าสุด:</span>
                <span className="font-bold text-white">
                  {formatDate(order.updatedAt)}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#212328] border border-site-border/30 rounded-[16px] overflow-hidden">
            <div className="p-3 border-b-[3px] border-site-border/50 bg-[#1A1C1E]">
              <h2 className="font-bold text-white text-base">จัดการคำสั่งซื้อ</h2>
            </div>
            <div className="p-3 space-y-3">
              {/* Status Update */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  อัปเดตสถานะ
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-site-accent text-sm">
                  <option value="PENDING">รอดำเนินการ</option>
                  <option value="PROCESSING">กำลังดำเนินการ</option>
                  <option value="COMPLETED">สำเร็จ</option>
                  <option value="CANCELLED">ยกเลิก</option>
                  <option value="REFUNDED">คืนเงิน</option>
                </select>
              </div>

              <button
                onClick={handleUpdateStatus}
                disabled={updating || selectedStatus === order.status}
                className="w-full py-1.5 bg-site-accent hover:bg-site-accent/90 text-white font-bold border border-site-border/30 rounded-[12px] shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                style={{
                  boxShadow:
                    updating || selectedStatus === order.status
                      ? "none"
                      : "2px 2px 0 0 #000000",
                }}
              >
                {updating ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    กำลังอัปเดต...
                  </span>
                ) : (
                  "อัปเดตสถานะ"
                )}
              </button>

              {/* Fulfill Button */}
              {order.status === "PENDING" && (
                <button
                  onClick={handleFulfill}
                  disabled={updating}
                  className="w-full py-1.5 bg-green-500 hover:bg-green-500/90 text-white font-bold border border-site-border/30 rounded-[12px] shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-50 text-sm"
                  style={{
                    boxShadow: updating ? "none" : "2px 2px 0 0 #000000",
                  }}
                >
                  {updating ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      กำลังดำเนินการ...
                    </span>
                  ) : (
                    "Fulfill Order"
                  )}
                </button>
              )}

              {/* Cancel Button */}
              {(order.status === "PENDING" ||
                order.status === "PROCESSING") && (
                  <button
                    onClick={() => setSelectedStatus("CANCELLED")}
                    className="w-full py-1.5 bg-red-500/10 hover:bg-red-200 text-red-400 font-bold border border-site-border/30 rounded-[12px] shadow-sm border-red-500/30/30 transition-all hover:-translate-y-0.5 text-sm">
                    ยกเลิกคำสั่งซื้อ
                  </button>
                )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
