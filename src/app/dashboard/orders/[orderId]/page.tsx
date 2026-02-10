"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertCircle,
  Package,
  Copy,
  Check,
  Printer,
  Download,
  CreditCard,
  Calendar,
  Mail,
  User,
  XCircle,
  RefreshCw,
  MapPin,
  Smartphone,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";
import { orderApi, Order } from "@/lib/services/order-api";
import { deliveryApi, OrderDeliveryStatus } from "@/lib/services/delivery-api";
import toast from "react-hot-toast";

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isInitialized } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<OrderDeliveryStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const orderId = params.orderId as string;

  // If not logged in, redirect to login page
  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [user, router, isInitialized]);

  // Fetch order data
  useEffect(() => {
    if (orderId && user) {
      fetchOrderData();
    }
  }, [orderId, user]);

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      const [orderRes, deliveryRes] = await Promise.all([
        orderApi.getOrderById(orderId),
        deliveryApi.getDeliveryStatus(orderId).catch(() => null),
      ]);

      if (orderRes.success) {
        setOrder(orderRes.data);
      } else {
        toast.error("ไม่พบคำสั่งซื้อ");
        router.push("/dashboard/orders");
      }

      if (deliveryRes) {
        setDeliveryStatus(deliveryRes);
      }
    } catch (error) {
      console.error("Failed to fetch order:", error);
      toast.error("ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้");
    } finally {
      setLoading(false);
    }
  };

  // Cancel order
  const handleCancelOrder = async () => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคำสั่งซื้อนี้?")) {
      return;
    }

    try {
      setIsCancelling(true);
      const response = await orderApi.cancelOrder(orderId);
      if (response.success) {
        toast.success("ยกเลิกคำสั่งซื้อสำเร็จ");
        fetchOrderData();
      } else {
        toast.error(response.message || "ไม่สามารถยกเลิกคำสั่งซื้อได้");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || "เกิดข้อผิดพลาด");
    } finally {
      setIsCancelling(false);
    }
  };

  // Copy code to clipboard
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("คัดลอกรหัสแล้ว");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 2,
    }).format(price);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center px-3 py-1 border-[2px] border-black text-sm font-bold bg-brutal-green text-black">
            <CheckCircle className="w-4 h-4 mr-1.5" /> สำเร็จ
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center px-3 py-1 border-[2px] border-black text-sm font-bold bg-brutal-yellow text-black">
            <Clock className="w-4 h-4 mr-1.5" /> รอดำเนินการ
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center px-3 py-1 border-[2px] border-black text-sm font-bold bg-brutal-blue text-black">
            <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> กำลังดำเนินการ
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center px-3 py-1 border-[2px] border-black text-sm font-bold bg-gray-300 text-black">
            <XCircle className="w-4 h-4 mr-1.5" /> ยกเลิกแล้ว
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center px-3 py-1 border-[2px] border-black text-sm font-bold bg-red-100 text-red-700">
            <AlertCircle className="w-4 h-4 mr-1.5" /> ล้มเหลว
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 border-[2px] border-black text-sm font-bold bg-gray-100 text-black">
            {status}
          </span>
        );
    }
  };

  // Get delivery status badge
  const getDeliveryStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center text-sm text-brutal-green font-medium">
            <CheckCircle className="w-4 h-4 mr-1" /> จัดส่งสำเร็จ
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center text-sm text-gray-600 font-medium">
            <Clock className="w-4 h-4 mr-1" /> รอจัดส่ง
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center text-sm text-brutal-blue font-medium">
            <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> กำลังจัดส่ง
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center text-sm text-red-600 font-medium">
            <XCircle className="w-4 h-4 mr-1" /> จัดส่งล้มเหลว
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center text-sm text-gray-600 font-medium">
            {status}
          </span>
        );
    }
  };

  // Get payment method display
  const getPaymentMethodDisplay = (method?: string) => {
    const methods: Record<string, string> = {
      CREDIT_CARD: "บัตรเครดิต/เดบิต",
      PROMPTPAY: "พร้อมเพย์",
      TRUEMONEY: "ทรูมันนี่วอลเล็ท",
      BANK_TRANSFER: "โอนเงินผ่านธนาคาร",
    };
    return methods[method || ""] || method || "ไม่ระบุ";
  };

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Show loading while fetching order
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 animate-spin text-black" />
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูลคำสั่งซื้อ...</p>
        </div>
      </div>
    );
  }

  // If order not found
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-bold text-black mb-2">ไม่พบคำสั่งซื้อ</h2>
        <p className="text-gray-600 mb-4">คำสั่งซื้อที่คุณค้นหาอาจถูกลบหรือไม่มีอยู่</p>
        <Link
          href="/dashboard/orders"
          className="px-4 py-2 bg-black text-white font-medium border-[3px] border-black hover:bg-gray-800 transition-colors"
        >
          กลับไปหน้าคำสั่งซื้อ
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="relative mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/dashboard/orders"
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-black transition-colors border-[2px] border-transparent hover:border-black"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <motion.h2
            className="text-xl font-bold text-black relative flex items-center"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="w-1.5 h-5 bg-brutal-blue mr-2"></span>
            รายละเอียดคำสั่งซื้อ
          </motion.h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 ml-9">
          <span>
            รหัสคำสั่งซื้อ:{" "}
            <span className="text-black font-mono font-bold">{order.orderNumber}</span>
          </span>
          <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
          <span>{formatDate(order.createdAt)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status & Items */}
          <motion.div
            className="bg-white border-[3px] border-black overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="p-5 border-b-[3px] border-black flex justify-between items-center bg-brutal-yellow">
              <h3 className="font-bold text-black flex items-center gap-2">
                <Package className="h-5 w-5" />
                รายการที่สั่งซื้อ
              </h3>
              {getStatusBadge(order.status)}
            </div>

            <div className="divide-y divide-gray-200">
              {order.items.map((item) => (
                <div key={item.id} className="p-5">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="h-20 w-20 border-[2px] border-black bg-gray-100 flex-shrink-0">
                      <img
                        src={item.product?.imageUrl || `https://placehold.co/100x100?text=${encodeURIComponent(item.product?.name || "Product")}`}
                        alt={item.product?.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-black text-lg">{item.product?.name || "สินค้า"}</h4>
                          <p className="text-gray-600 text-sm">จำนวน: {item.quantity}</p>
                          {item.playerInfo && Object.keys(item.playerInfo).length > 0 && (
                            <div className="mt-2 p-2 bg-brutal-gray border border-black/20 text-sm">
                              <p className="text-gray-600 text-xs mb-1">ข้อมูลบัญชี:</p>
                              {Object.entries(item.playerInfo).map(([key, value]) => (
                                <div key={key} className="flex gap-2">
                                  <span className="text-gray-600 capitalize">{key}:</span>
                                  <span className="font-mono font-bold">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="font-bold text-black">{formatPrice(item.priceAtPurchase)}</p>
                      </div>

                      {/* Delivery Status */}
                      {deliveryStatus && (
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-sm text-gray-600">สถานะจัดส่ง:</span>
                          {getDeliveryStatusBadge(item.fulfillStatus)}
                        </div>
                      )}

                      {/* Digital Codes / PIN */}
                      {item.fulfillStatus === "COMPLETED" && item.pinCodes && item.pinCodes.length > 0 && (
                        <div className="mt-4 bg-brutal-green/20 border-[2px] border-black rounded-lg p-4">
                          <p className="text-xs text-black uppercase font-bold mb-2">รหัสดิจิทัล / PIN</p>
                          <div className="space-y-2">
                            {item.pinCodes.map((card: any, idx: number) => (
                              <div key={idx} className="bg-white p-3 border-[2px] border-black">
                                {card.code && (
                                  <div className="flex items-center gap-2 group mb-2">
                                    <code className="flex-1 font-mono text-black text-sm tracking-wider">{card.code}</code>
                                    <button
                                      onClick={() => copyToClipboard(card.code)}
                                      className="p-1.5 hover:bg-gray-100 text-gray-600 hover:text-black transition-colors"
                                      title="คัดลอกรหัส"
                                    >
                                      {copiedCode === card.code ? (
                                        <Check size={16} className="text-brutal-green" />
                                      ) : (
                                        <Copy size={16} />
                                      )}
                                    </button>
                                  </div>
                                )}
                                {card.pin && (
                                  <div className="flex items-center gap-2 group">
                                    <span className="text-xs text-gray-600">PIN:</span>
                                    <code className="flex-1 font-mono text-black text-sm tracking-wider">{card.pin}</code>
                                    <button
                                      onClick={() => copyToClipboard(card.pin)}
                                      className="p-1.5 hover:bg-gray-100 text-gray-600 hover:text-black transition-colors"
                                      title="คัดลอก PIN"
                                    >
                                      {copiedCode === card.pin ? (
                                        <Check size={16} className="text-brutal-green" />
                                      ) : (
                                        <Copy size={16} />
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                            <AlertCircle size={12} />
                            กรุณาใช้รหัสนี้ทันที ห้ามเปิดเผยให้ผู้อื่น
                          </p>
                        </div>
                      )}

                      {/* Failed Status */}
                      {item.fulfillStatus === "FAILED" && (
                        <div className="mt-4 bg-red-50 border-[2px] border-red-500 rounded-lg p-4">
                          <p className="text-sm text-red-700 flex items-center gap-2">
                            <AlertCircle size={16} />
                            การจัดส่งล้มเหลว กรุณาติดต่อฝ่ายสนับสนุน
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Payment Info */}
          <motion.div
            className="bg-white border-[3px] border-black overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="p-5 border-b-[3px] border-black bg-brutal-blue">
              <h3 className="font-bold text-black flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                สรุปการชำระเงิน
              </h3>
            </div>

            <div className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ยอดรวมย่อย</span>
                <span className="text-black">{formatPrice(order.totalAmount)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ส่วนลด</span>
                  <span className="text-green-600">-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="border-t-[2px] border-black my-2 pt-2 flex justify-between items-center">
                <span className="font-bold text-black">ยอดรวมทั้งสิ้น</span>
                <span className="font-bold text-xl text-black">{formatPrice(order.finalAmount)}</span>
              </div>

              {order.payment && (
                <div className="bg-gray-100 rounded-lg p-3 mt-4 text-sm flex items-center gap-3 border-[2px] border-black">
                  <div className="p-2 bg-brutal-blue border-[2px] border-black">
                    <CreditCard size={16} className="text-black" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">วิธีการชำระเงิน</p>
                    <p className="text-black font-medium">{getPaymentMethodDisplay(order.payment.paymentMethod)}</p>
                  </div>
                  <div className="ml-auto">
                    <span
                      className={`px-2 py-1 text-xs font-bold border-[2px] border-black ${
                        order.payment.status === "COMPLETED"
                          ? "bg-brutal-green text-black"
                          : order.payment.status === "PENDING"
                          ? "bg-brutal-yellow text-black"
                          : "bg-gray-300 text-black"
                      }`}
                    >
                      {order.payment.status === "COMPLETED"
                        ? "ชำระแล้ว"
                        : order.payment.status === "PENDING"
                        ? "รอชำระ"
                        : order.payment.status}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Actions */}
          {order.status === "PENDING" && (
            <motion.div
              className="bg-white border-[3px] border-black overflow-hidden"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="p-5 border-b-[3px] border-black bg-red-50">
                <h3 className="font-bold text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  ยกเลิกคำสั่งซื้อ
                </h3>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-600 mb-4">
                  คุณสามารถยกเลิกคำสั่งซื้อนี้ได้หากยังไม่ได้ชำระเงิน
                </p>
                <button
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                  className="w-full flex items-center justify-center gap-2 p-3 border-[2px] border-red-500 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isCancelling ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      กำลังยกเลิก...
                    </>
                  ) : (
                    <>
                      <XCircle size={18} />
                      ยกเลิกคำสั่งซื้อ
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Customer Info */}
          <motion.div
            className="bg-white border-[3px] border-black overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="p-5 border-b-[3px] border-black bg-brutal-pink">
              <h3 className="font-bold text-black flex items-center gap-2">
                <User className="h-5 w-5" />
                ข้อมูลลูกค้า
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <User size={16} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">ชื่อผู้ใช้</p>
                  <p className="text-sm text-black font-medium">{order.user?.username || user?.username || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Mail size={16} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">อีเมล</p>
                  <p className="text-sm text-black font-medium">{order.user?.email || user?.email || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Calendar size={16} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">วันที่สั่งซื้อ</p>
                  <p className="text-sm text-black font-medium">{formatDate(order.createdAt)}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Delivery Info */}
          {deliveryStatus && (
            <motion.div
              className="bg-white border-[3px] border-black overflow-hidden"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="p-5 border-b-[3px] border-black bg-brutal-green">
                <h3 className="font-bold text-black flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  สถานะการจัดส่ง
                </h3>
              </div>
              <div className="p-5">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">สถานะรวม:</span>
                    {getDeliveryStatusBadge(deliveryStatus.status)}
                  </div>
                  {deliveryStatus.completedAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">จัดส่งเสร็จ:</span>
                      <span className="text-sm font-medium">{formatDate(deliveryStatus.completedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Quick Actions */}
          <motion.div
            className="bg-white border-[3px] border-black overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="p-5 border-b-[3px] border-black bg-gray-100">
              <h3 className="font-bold text-black">การดำเนินการ</h3>
            </div>
            <div className="p-3 space-y-2">
              <button
                onClick={() => window.print()}
                className="w-full flex items-center gap-3 p-3 border-[2px] border-black hover:bg-gray-100 text-black transition-colors text-sm font-medium"
              >
                <Printer size={18} />
                พิมพ์ใบเสร็จ
              </button>
              <Link
                href="/dashboard/support"
                className="w-full flex items-center gap-3 p-3 border-[2px] border-black hover:bg-gray-100 text-black transition-colors text-sm font-medium"
              >
                <AlertCircle size={18} />
                แจ้งปัญหา
              </Link>
            </div>
          </motion.div>

          <div className="text-center">
            <Link
              href="/dashboard/support"
              className="text-sm text-black underline hover:no-underline"
            >
              ต้องการความช่วยเหลือเกี่ยวกับคำสั่งซื้อนี้?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
