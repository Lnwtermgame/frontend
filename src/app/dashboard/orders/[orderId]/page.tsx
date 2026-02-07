"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { ArrowLeft, CheckCircle, Clock, AlertCircle, Package, Copy, Check, Printer, Download, CreditCard, Calendar, Mail, User } from "lucide-react";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";

// Mock order details
const mockOrder = {
  id: "ORD-1001",
  date: "2023-11-20T14:30:00Z",
  status: "completed",
  paymentMethod: "Credit Card (Visa)",
  total: "$50.00",
  subtotal: "$50.00",
  tax: "$0.00",
  discount: "$0.00",
  items: [
    {
      id: "ItEM-1",
      name: "Steam Gift Card $50",
      price: "$50.00",
      quantity: 1,
      image: "https://placehold.co/100x100?text=Steam",
      codes: ["AAAA-BBBB-CCCC-DDDD"]
    }
  ],
  customer: {
    name: "John Doe",
    email: "john.doe@example.com"
  }
};

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isInitialized } = useAuth();
  const [order, setOrder] = useState<typeof mockOrder | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // If not logged in, redirect to login page
  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [user, router, isInitialized]);

  // Simulate fetching order
  useEffect(() => {
    if (params.orderId) {
      // In a real app, fetch order by ID
      setOrder(mockOrder);
    }
  }, [params.orderId]);

  // Copy code to clipboard
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user || !order) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 thai-font">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center px-3 py-1 border-[2px] border-black text-sm font-bold bg-brutal-green text-black thai-font">
            <CheckCircle className="w-4 h-4 mr-1.5" /> สำเร็จ
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-3 py-1 border-[2px] border-black text-sm font-bold bg-brutal-yellow text-black thai-font">
            <Clock className="w-4 h-4 mr-1.5" /> กำลังดำเนินการ
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-3 py-1 border-[2px] border-black text-sm font-bold bg-gray-300 text-black thai-font">
            <AlertCircle className="w-4 h-4 mr-1.5" /> ยกเลิกแล้ว
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 border-[2px] border-black text-sm font-bold bg-brutal-blue text-black thai-font">
            {status}
          </span>
        );
    }
  };

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
            className="text-xl font-bold text-black relative flex items-center thai-font"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="w-1.5 h-5 bg-brutal-blue mr-2"></span>
            รายละเอียดคำสั่งซื้อ
          </motion.h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 ml-9">
          <span className="thai-font">รหัสคำสั่งซื้อ: <span className="text-black font-mono font-bold">{order.id}</span></span>
          <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
          <span>{new Date(order.date).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status & Items */}
          <motion.div
            className="bg-white border-[3px] border-black overflow-hidden"
            style={{ boxShadow: '4px 4px 0 0 #000000' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
          >
            <div className="p-5 border-b-[3px] border-black flex justify-between items-center bg-brutal-yellow">
              <h3 className="font-bold text-black flex items-center gap-2 thai-font">
                <Package className="h-5 w-5" />
                รายการที่สั่งซื้อ
              </h3>
              {renderStatusBadge(order.status)}
            </div>

            <div className="divide-y divide-gray-200">
              {order.items.map((item) => (
                <div key={item.id} className="p-5">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="h-20 w-20 border-[2px] border-black bg-gray-100 flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-black text-lg">{item.name}</h4>
                          <p className="text-gray-600 text-sm thai-font">จำนวน: {item.quantity}</p>
                        </div>
                        <p className="font-bold text-black">{item.price}</p>
                      </div>

                      {/* Digital Codes */}
                      {order.status === 'completed' && item.codes && item.codes.length > 0 && (
                        <div className="mt-4 bg-brutal-green/20 border-[2px] border-black rounded-lg p-4">
                          <p className="text-xs text-black uppercase font-bold mb-2 thai-font">รหัสดิจิทัล / PIN</p>
                          <div className="space-y-2">
                            {item.codes.map((code, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-white p-3 border-[2px] border-black group">
                                <code className="flex-1 font-mono text-black text-sm tracking-wider">{code}</code>
                                <button
                                  onClick={() => copyToClipboard(code)}
                                  className="p-1.5 hover:bg-gray-100 text-gray-600 hover:text-black transition-colors"
                                  title="คัดลอกรหัส"
                                >
                                  {copiedCode === code ? <Check size={16} className="text-brutal-green" /> : <Copy size={16} />}
                                </button>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-600 mt-2 flex items-center gap-1 thai-font">
                            <AlertCircle size={12} />
                            กรุณาใช้รหัสนี้ทันที
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
            style={{ boxShadow: '4px 4px 0 0 #000000' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -2 }}
          >
            <div className="p-5 border-b-[3px] border-black bg-brutal-blue">
              <h3 className="font-bold text-black flex items-center gap-2 thai-font">
                <CreditCard className="h-5 w-5" />
                สรุปการชำระเงิน
              </h3>
            </div>

            <div className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 thai-font">ยอดรวมย่อย</span>
                <span className="text-black">{order.subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 thai-font">ภาษี</span>
                <span className="text-black">{order.tax}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 thai-font">ส่วนลด</span>
                <span className="text-black">{order.discount}</span>
              </div>
              <div className="border-t-[2px] border-black my-2 pt-2 flex justify-between items-center">
                <span className="font-bold text-black thai-font">ยอดรวมทั้งสิ้น</span>
                <span className="font-bold text-xl text-black">{order.total}</span>
              </div>

              <div className="bg-gray-100 rounded-lg p-3 mt-4 text-sm flex items-center gap-3 border-[2px] border-black">
                <div className="p-2 bg-brutal-blue border-[2px] border-black">
                  <CreditCard size={16} className="text-black" />
                </div>
                <div>
                  <p className="text-gray-600 text-xs thai-font">วิธีการชำระเงิน</p>
                  <p className="text-black font-medium">{order.paymentMethod}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <motion.div
            className="bg-white border-[3px] border-black overflow-hidden"
            style={{ boxShadow: '4px 4px 0 0 #000000' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -2 }}
          >
            <div className="p-5 border-b-[3px] border-black bg-brutal-pink">
              <h3 className="font-bold text-black flex items-center gap-2 thai-font">
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
                  <p className="text-xs text-gray-600 thai-font">ชื่อ</p>
                  <p className="text-sm text-black font-medium">{order.customer.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Mail size={16} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 thai-font">อีเมล</p>
                  <p className="text-sm text-black font-medium">{order.customer.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Calendar size={16} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 thai-font">วันที่สั่งซื้อ</p>
                  <p className="text-sm text-black font-medium">{new Date(order.date).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            className="bg-white border-[3px] border-black overflow-hidden"
            style={{ boxShadow: '4px 4px 0 0 #000000' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -2 }}
          >
            <div className="p-5 border-b-[3px] border-black bg-gray-100">
              <h3 className="font-bold text-black thai-font">การดำเนินการ</h3>
            </div>
            <div className="p-3 space-y-2">
              <button className="w-full flex items-center gap-3 p-3 border-[2px] border-black hover:bg-gray-100 text-black transition-colors text-sm font-medium thai-font">
                <Printer size={18} />
                พิมพ์ใบเสร็จ
              </button>
              <button className="w-full flex items-center gap-3 p-3 border-[2px] border-black hover:bg-gray-100 text-black transition-colors text-sm font-medium thai-font">
                <Download size={18} />
                ดาวน์โหลด PDF
              </button>
              <button className="w-full flex items-center gap-3 p-3 border-[2px] border-black hover:bg-gray-100 text-black transition-colors text-sm font-medium thai-font">
                <AlertCircle size={18} />
                แจ้งปัญหา
              </button>
            </div>
          </motion.div>

          <div className="text-center">
            <Link
              href="/dashboard/support"
              className="text-sm text-black underline hover:no-underline thai-font"
            >
              ต้องการความช่วยเหลือเกี่ยวกับคำสั่งซื้อนี้?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
