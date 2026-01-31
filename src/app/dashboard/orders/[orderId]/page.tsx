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
          <div className="w-16 h-16 border-4 border-mali-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-mali-text-secondary thai-font">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-mali-green/20 text-mali-green border border-mali-green/20 thai-font">
            <CheckCircle className="w-4 h-4 mr-1.5" /> สำเร็จ
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-900/20 text-yellow-400 border border-yellow-400/20 thai-font">
            <Clock className="w-4 h-4 mr-1.5" /> กำลังดำเนินการ
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-mali-red/20 text-mali-red border border-mali-red/20 thai-font">
            <AlertCircle className="w-4 h-4 mr-1.5" /> ยกเลิกแล้ว
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-mali-blue/20 text-mali-blue-accent border border-mali-blue/20 thai-font">
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
            className="p-2 -ml-2 rounded-full hover:bg-mali-blue/10 text-mali-text-secondary hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <motion.h2
            className="text-xl font-bold text-white relative thai-font"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            รายละเอียดคำสั่งซื้อ
          </motion.h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-mali-text-secondary ml-9">
          <span className="thai-font">รหัสคำสั่งซื้อ: <span className="text-white font-mono">{order.id}</span></span>
          <span className="w-1 h-1 bg-mali-text-secondary rounded-full"></span>
          <span>{new Date(order.date).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status & Items */}
          <motion.div
            className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="p-5 border-b border-mali-blue/20 flex justify-between items-center bg-mali-blue/5">
              <h3 className="font-semibold text-white flex items-center gap-2 thai-font">
                <Package className="h-5 w-5 text-mali-blue-accent" />
                รายการที่สั่งซื้อ
              </h3>
              {renderStatusBadge(order.status)}
            </div>

            <div className="divide-y divide-mali-blue/10">
              {order.items.map((item) => (
                <div key={item.id} className="p-5">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="h-20 w-20 rounded-lg overflow-hidden bg-mali-blue/20 border border-mali-blue/10 flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-white text-lg">{item.name}</h4>
                          <p className="text-mali-text-secondary text-sm thai-font">จำนวน: {item.quantity}</p>
                        </div>
                        <p className="font-bold text-white">{item.price}</p>
                      </div>

                      {/* Digital Codes */}
                      {order.status === 'completed' && item.codes && item.codes.length > 0 && (
                        <div className="mt-4 bg-mali-blue/10 rounded-lg p-4 border border-mali-blue/20">
                          <p className="text-xs text-mali-blue-light uppercase font-semibold mb-2 thai-font">รหัสดิจิทัล / PIN</p>
                          <div className="space-y-2">
                            {item.codes.map((code, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-mali-dark/50 p-3 rounded border border-mali-blue/10 group">
                                <code className="flex-1 font-mono text-white text-sm tracking-wider">{code}</code>
                                <button
                                  onClick={() => copyToClipboard(code)}
                                  className="p-1.5 rounded hover:bg-mali-blue/20 text-mali-text-secondary hover:text-white transition-colors"
                                  title="คัดลอกรหัส"
                                >
                                  {copiedCode === code ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                                </button>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-mali-text-secondary mt-2 flex items-center gap-1 thai-font">
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
            className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="p-5 border-b border-mali-blue/20 bg-mali-blue/5">
              <h3 className="font-semibold text-white flex items-center gap-2 thai-font">
                <CreditCard className="h-5 w-5 text-mali-blue-accent" />
                สรุปการชำระเงิน
              </h3>
            </div>

            <div className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-mali-text-secondary thai-font">ยอดรวมย่อย</span>
                <span className="text-white">{order.subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-mali-text-secondary thai-font">ภาษี</span>
                <span className="text-white">{order.tax}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-mali-text-secondary thai-font">ส่วนลด</span>
                <span className="text-white">{order.discount}</span>
              </div>
              <div className="border-t border-mali-blue/10 my-2 pt-2 flex justify-between items-center">
                <span className="font-medium text-white thai-font">ยอดรวมทั้งสิ้น</span>
                <span className="font-bold text-xl text-mali-blue-accent">{order.total}</span>
              </div>

              <div className="bg-mali-blue/5 rounded-lg p-3 mt-4 text-sm flex items-center gap-3 border border-mali-blue/10">
                <div className="p-2 bg-mali-blue/10 rounded-full text-mali-blue-light">
                  <CreditCard size={16} />
                </div>
                <div>
                  <p className="text-mali-text-secondary text-xs thai-font">วิธีการชำระเงิน</p>
                  <p className="text-white font-medium">{order.paymentMethod}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <motion.div
            className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="p-5 border-b border-mali-blue/20 bg-mali-blue/5">
              <h3 className="font-semibold text-white flex items-center gap-2 thai-font">
                <User className="h-5 w-5 text-mali-blue-accent" />
                ข้อมูลลูกค้า
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <User size={16} className="text-mali-text-secondary" />
                </div>
                <div>
                  <p className="text-xs text-mali-text-secondary thai-font">ชื่อ</p>
                  <p className="text-sm text-white font-medium">{order.customer.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Mail size={16} className="text-mali-text-secondary" />
                </div>
                <div>
                  <p className="text-xs text-mali-text-secondary thai-font">อีเมล</p>
                  <p className="text-sm text-white font-medium">{order.customer.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Calendar size={16} className="text-mali-text-secondary" />
                </div>
                <div>
                  <p className="text-xs text-mali-text-secondary thai-font">วันที่สั่งซื้อ</p>
                  <p className="text-sm text-white font-medium">{new Date(order.date).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="p-5 border-b border-mali-blue/20 bg-mali-blue/5">
              <h3 className="font-semibold text-white thai-font">การดำเนินการ</h3>
            </div>
            <div className="p-3 space-y-2">
              <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-mali-blue/10 text-mali-text-secondary hover:text-white transition-colors text-sm font-medium thai-font">
                <Printer size={18} />
                พิมพ์ใบเสร็จ
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-mali-blue/10 text-mali-text-secondary hover:text-white transition-colors text-sm font-medium thai-font">
                <Download size={18} />
                ดาวน์โหลด PDF
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-mali-blue/10 text-mali-text-secondary hover:text-white transition-colors text-sm font-medium thai-font">
                <AlertCircle size={18} />
                แจ้งปัญหา
              </button>
            </div>
          </motion.div>

          <div className="text-center">
            <Link
              href="/dashboard/support"
              className="text-xs text-mali-blue-accent hover:underline thai-font"
            >
              ต้องการความช่วยเหลือเกี่ยวกับคำสั่งซื้อนี้?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 