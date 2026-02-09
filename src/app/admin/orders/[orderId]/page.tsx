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
  Printer,
  FileText,
  AlertCircle,
} from "lucide-react";
import { orderApi, Order } from "@/lib/services/order-api";

const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: "รอดำเนินการ",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
    icon: <Clock className="h-5 w-5" />,
  },
  PROCESSING: {
    label: "กำลังดำเนินการ",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    icon: <Truck className="h-5 w-5" />,
  },
  COMPLETED: {
    label: "สำเร็จ",
    color: "text-green-700",
    bgColor: "bg-green-100",
    icon: <CheckCircle className="h-5 w-5" />,
  },
  FAILED: {
    label: "ล้มเหลว",
    color: "text-red-700",
    bgColor: "bg-red-100",
    icon: <XCircle className="h-5 w-5" />,
  },
  CANCELLED: {
    label: "ยกเลิก",
    color: "text-red-700",
    bgColor: "bg-red-100",
    icon: <XCircle className="h-5 w-5" />,
  },
  REFUNDED: {
    label: "คืนเงิน",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    icon: <XCircle className="h-5 w-5" />,
  },
};

const fulfillStatusConfig: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  PENDING: {
    label: "รอดำเนินการ",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
  },
  PROCESSING: {
    label: "กำลังดำเนินการ",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  COMPLETED: {
    label: "สำเร็จ",
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  FAILED: { label: "ล้มเหลว", color: "text-red-700", bgColor: "bg-red-100" },
};

export default function OrderViewPage() {
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
          <Loader2 className="h-12 w-12 text-brutal-pink animate-spin" />
          <p className="mt-4 text-gray-600 font-medium">
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
          className="bg-red-100 border-[3px] border-red-500 p-6 text-center"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
        >
          <AlertCircle className="mx-auto text-red-600 mb-3" size={48} />
          <h2 className="text-xl font-bold text-black mb-2">ไม่พบคำสั่งซื้อ</h2>
          <p className="text-red-600 mb-4">
            {error || "ไม่พบข้อมูลคำสั่งซื้อที่ระบุ"}
          </p>
          <Link
            href="/admin/orders"
            className="inline-flex items-center bg-brutal-blue hover:bg-brutal-blue/90 text-white px-6 py-2 font-bold border-[3px] border-black transition-all hover:-translate-y-0.5"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <ArrowLeft size={18} className="mr-2" />
            กลับไปหน้ารายการคำสั่งซื้อ
          </Link>
        </motion.div>
      </div>
    );
  }

  const status = statusConfig[order.status] || statusConfig.PENDING;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="p-2 bg-white border-[3px] border-black hover:bg-gray-100 transition-colors"
            style={{ boxShadow: "3px 3px 0 0 #000000" }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-black flex items-center gap-2">
              <Package className="h-6 w-6 text-brutal-pink" />
              คำสั่งซื้อ #
              {order.orderNumber || order.id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-gray-600 text-sm">
              รายละเอียดและจัดการคำสั่งซื้อ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-white border-[3px] border-black font-bold hover:bg-gray-100 transition-all hover:-translate-y-0.5"
            style={{ boxShadow: "3px 3px 0 0 #000000" }}
          >
            <Printer className="h-4 w-4" />
            พิมพ์
          </button>
          <button
            onClick={fetchOrder}
            className="flex items-center gap-2 px-4 py-2 bg-brutal-yellow border-[3px] border-black font-bold hover:bg-brutal-yellow/90 transition-all hover:-translate-y-0.5"
            style={{ boxShadow: "3px 3px 0 0 #000000" }}
          >
            <RefreshCw className="h-4 w-4" />
            รีเฟรช
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${status.bgColor} border-[3px] border-black p-4 flex items-center justify-between`}
        style={{ boxShadow: "4px 4px 0 0 #000000" }}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 bg-white border-[2px] border-black ${status.color}`}
          >
            {status.icon}
          </div>
          <div>
            <p className="text-sm text-gray-600">สถานะคำสั่งซื้อ</p>
            <p className={`text-lg font-bold ${status.color}`}>
              {status.label}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">วันที่สั่งซื้อ</p>
          <p className="font-bold text-black">{formatDate(order.createdAt)}</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border-[3px] border-black overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="p-4 border-b-[3px] border-black bg-brutal-gray">
              <h2 className="font-bold text-black flex items-center gap-2">
                <Package className="h-5 w-5 text-brutal-blue" />
                รายการสินค้า
              </h2>
            </div>
            <div className="divide-y-[2px] divide-gray-200">
              {order.items.map((item, index) => {
                const itemStatus =
                  statusConfig[order.status] || statusConfig.PENDING;
                return (
                  <div
                    key={item.id}
                    className="p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-brutal-gray border-[2px] border-black flex items-center justify-center font-bold text-gray-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-black">
                          {item.productName || "สินค้า"}
                        </p>
                        <p className="text-sm text-gray-600">
                          จำนวน: {item.quantity} | ราคา:{" "}
                          {formatPrice(item.priceAtPurchase || item.price || 0)}
                        </p>
                        {item.playerInfo &&
                          Object.keys(item.playerInfo).length > 0 && (
                            <div className="mt-2 text-xs text-gray-500 bg-gray-100 p-2 border border-gray-300">
                              {Object.entries(item.playerInfo).map(
                                ([key, value]) => (
                                  <div key={key}>
                                    {key}: {value}
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center px-3 py-1 border-[2px] border-black text-xs font-bold ${itemStatus.bgColor} ${itemStatus.color}`}
                      >
                        {itemStatus.label}
                      </span>
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
            className="bg-white border-[3px] border-black overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="p-4 border-b-[3px] border-black bg-brutal-gray">
              <h2 className="font-bold text-black flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-brutal-green" />
                สรุปการชำระเงิน
              </h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>ยอดรวมสินค้า</span>
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>ส่วนลด</span>
                <span className="text-green-600">
                  -{formatPrice(order.discountAmount)}
                </span>
              </div>
              <div className="border-t-[2px] border-gray-200 pt-3">
                <div className="flex justify-between text-xl font-bold text-black">
                  <span>ยอดสุทธิ</span>
                  <span className="text-brutal-pink">
                    {formatPrice(order.finalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Customer & Actions */}
        <div className="space-y-6">
          {/* Customer Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border-[3px] border-black overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="p-4 border-b-[3px] border-black bg-brutal-gray">
              <h2 className="font-bold text-black flex items-center gap-2">
                <User className="h-5 w-5 text-brutal-purple" />
                ข้อมูลลูกค้า
              </h2>
            </div>
            <div className="p-4 space-y-4">
              {order.user ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-brutal-yellow border-[2px] border-black flex items-center justify-center">
                      <User className="h-6 w-6 text-black" />
                    </div>
                    <div>
                      <p className="font-bold text-black">
                        {order.user.username || "ไม่ระบุชื่อ"}
                      </p>
                      <p className="text-sm text-gray-600">
                        ID: {order.user.id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-3 border border-gray-200">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{order.user.email}</span>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-4">
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
            className="bg-white border-[3px] border-black overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="p-4 border-b-[3px] border-black bg-brutal-gray">
              <h2 className="font-bold text-black flex items-center gap-2">
                <FileText className="h-5 w-5 text-brutal-yellow" />
                ข้อมูลคำสั่งซื้อ
              </h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Tag className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">รหัสคำสั่งซื้อ:</span>
                <span className="font-mono font-bold text-black">
                  {order.id}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">สร้างเมื่อ:</span>
                <span className="font-bold text-black">
                  {formatDate(order.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <RefreshCw className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">อัปเดตล่าสุด:</span>
                <span className="font-bold text-black">
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
            className="bg-white border-[3px] border-black overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="p-4 border-b-[3px] border-black bg-brutal-gray">
              <h2 className="font-bold text-black">จัดการคำสั่งซื้อ</h2>
            </div>
            <div className="p-4 space-y-4">
              {/* Status Update */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อัปเดตสถานะ
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full bg-white border-[3px] border-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brutal-blue"
                >
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
                className="w-full py-2 bg-brutal-blue hover:bg-brutal-blue/90 text-white font-bold border-[3px] border-black transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  boxShadow:
                    updating || selectedStatus === order.status
                      ? "none"
                      : "3px 3px 0 0 #000000",
                }}
              >
                {updating ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
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
                  className="w-full py-2 bg-brutal-green hover:bg-brutal-green/90 text-black font-bold border-[3px] border-black transition-all hover:-translate-y-0.5 disabled:opacity-50"
                  style={{
                    boxShadow: updating ? "none" : "3px 3px 0 0 #000000",
                  }}
                >
                  {updating ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
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
                  className="w-full py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold border-[3px] border-red-500 transition-all hover:-translate-y-0.5"
                  style={{ boxShadow: "3px 3px 0 0 #ef4444" }}
                >
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
