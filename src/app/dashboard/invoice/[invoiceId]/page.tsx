"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { motion } from "@/lib/framer-exports";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Printer,
  Copy,
  Check,
  Clock,
  CreditCard,
  CheckCircle,
  AlertCircle,
  FileText,
  ExternalLink
} from "lucide-react";

// Mock invoice data - would normally be fetched from an API
const invoicesData = {
  "INV12345": {
    id: "INV12345",
    date: "2023-10-15",
    dueDate: "2023-10-15", // Same day for digital goods
    amount: 29.99,
    status: "Paid",
    paymentMethod: "Credit Card",
    paymentId: "PAY78912345",
    customerName: "John Doe",
    customerEmail: "john.doe@example.com",
    billingAddress: {
      name: "John Doe",
      address: "Digital delivery only",
      phone: "+1 555-123-4567"
    },
    items: [
      {
        id: "ITEM001",
        name: "Steam Gift Card",
        value: "$20",
        quantity: 1,
        price: 20.99,
        image: "https://placehold.co/100x60/2a429b/white?text=Steam"
      },
      {
        id: "ITEM002",
        name: "Processing Fee",
        value: "Service",
        quantity: 1,
        price: 9.00,
        image: null
      }
    ],
    orderReference: "ORD12345",
    notes: "Thank you for your purchase!",
    deliveryMethod: "Digital - Email",
    orderDate: "2023-10-15",
    orderTime: "14:35:29"
  },
  "INV12346": {
    id: "INV12346",
    date: "2023-09-28",
    dueDate: "2023-09-28",
    amount: 49.99,
    status: "Paid",
    paymentMethod: "PayPal",
    paymentId: "PAY78912346",
    customerName: "Jane Smith",
    customerEmail: "jane.smith@example.com",
    billingAddress: {
      name: "Jane Smith",
      address: "Digital delivery only",
      phone: "+1 555-987-6543"
    },
    items: [
      {
        id: "ITEM003",
        name: "Google Play Gift Card",
        value: "$50",
        quantity: 1,
        price: 49.99,
        image: "https://placehold.co/100x60/4caf50/white?text=Google"
      }
    ],
    orderReference: "ORD12346",
    notes: "Thank you for your purchase!",
    deliveryMethod: "Digital - Email",
    orderDate: "2023-09-28",
    orderTime: "09:12:05"
  }
};

export default function InvoiceDetailPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Copy invoice ID to clipboard
  const copyInvoiceId = () => {
    if (typeof window !== "undefined" && invoice) {
      navigator.clipboard.writeText(invoice.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Fetch invoice data - in a real app, this would be an API call
  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
      return;
    }

    // Simulate API fetch with timeout
    const timer = setTimeout(() => {
      setLoading(false);

      if (typeof invoiceId !== 'string') {
        setError("รหัสใบแจ้งหนี้ไม่ถูกต้อง");
        return;
      }

      const foundInvoice = invoicesData[invoiceId as keyof typeof invoicesData];

      if (!foundInvoice) {
        setError("ไม่พบใบแจ้งหนี้");
        return;
      }

      setInvoice(foundInvoice);
    }, 500);

    return () => clearTimeout(timer);
  }, [invoiceId, router, user]);

  // Show loading state
  if (loading) {
    return (
      <div className="page-container text-center">
        <div className="bg-white border-[3px] border-black p-8" style={{ boxShadow: '4px 4px 0 0 #000000' }}>
          <div className="animate-pulse flex space-x-4 justify-center">
            <div className="rounded-full bg-gray-200 h-12 w-12"></div>
            <div className="flex-1 space-y-4 max-w-md">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="page-container">
        <motion.div
          className="bg-white border-[3px] border-black p-8 text-center"
          style={{ boxShadow: '4px 4px 0 0 #000000' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-16 h-16 bg-red-100 border-[2px] border-black flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-black mb-2 thai-font">ข้อผิดพลาด</h2>
          <p className="text-gray-600 mb-6 thai-font">{error}</p>
          <button
            onClick={() => router.push('/dashboard/invoice')}
            className="inline-flex items-center bg-black text-white px-5 py-2.5 border-[2px] border-black font-bold hover:bg-gray-800 transition-all thai-font"
            style={{ boxShadow: '3px 3px 0 0 #000000' }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับไปหน้าใบแจ้งหนี้
          </button>
        </motion.div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  return (
    <div className="page-container">
      {/* Page Header with blur effect - redesigned to match the screenshot */}
      <div className="relative mb-8">


        <div className="flex justify-between items-start mb-6">
          <div>
            <Link
              href="/dashboard/invoice"
              className="text-black hover:text-gray-700 inline-flex items-center text-sm mb-3 thai-font font-medium"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              กลับไปหน้าใบแจ้งหนี้
            </Link>
          </div>

          <div className="flex gap-2">
            <motion.button
              className="p-2 border-[2px] border-black bg-gray-100 hover:bg-gray-200 transition-colors inline-flex items-center text-black"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={copyInvoiceId}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </motion.button>

            <motion.button
              className="p-2 border-[2px] border-black bg-gray-100 hover:bg-gray-200 transition-colors inline-flex items-center text-black"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Printer className="h-4 w-4" />
            </motion.button>

            <motion.button
              className="p-2 border-[2px] border-black bg-gray-100 hover:bg-gray-200 transition-colors inline-flex items-center text-black"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download className="h-4 w-4" />
            </motion.button>

            <motion.button
              className="px-5 py-2 border-[3px] border-black bg-black text-white font-bold inline-flex items-center hover:bg-gray-800 thai-font"
              style={{ boxShadow: '3px 3px 0 0 #000000' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ดาวน์โหลด PDF
            </motion.button>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-black relative flex items-center thai-font">
            <span className="w-1.5 h-8 bg-brutal-green mr-3"></span>
            ใบแจ้งหนี้ #{invoice.id}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-gray-600">
              {new Date(invoice.date).toLocaleDateString()}
            </p>
            <span className={`px-3 py-1 border-[2px] border-black text-xs font-bold ${invoice.status === "Paid"
              ? "bg-brutal-green text-black"
              : invoice.status === "Refunded"
                ? "bg-brutal-yellow text-black"
                : "bg-brutal-blue text-black"
              }`}>
              {invoice.status}
            </span>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="space-y-6">
        {/* Invoice Summary Card */}
        <motion.div
          className="bg-white border-[3px] border-black overflow-hidden"
          style={{ boxShadow: '4px 4px 0 0 #000000' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          whileHover={{ y: -2 }}
        >
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Customer Info */}
            <div>
              <h3 className="text-sm font-bold text-gray-600 uppercase mb-3 thai-font">ลูกค้า</h3>
              <p className="text-black font-bold">{invoice.customerName}</p>
              <p className="text-gray-600 text-sm">{invoice.customerEmail}</p>
              <p className="text-gray-600 text-sm mt-1">{invoice.billingAddress.phone}</p>
            </div>

            {/* Payment Info */}
            <div>
              <h3 className="text-sm font-bold text-gray-600 uppercase mb-3 thai-font">รายละเอียดการชำระเงิน</h3>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-brutal-blue border-[2px] border-black mt-0.5">
                  <CreditCard className="h-4 w-4 text-black" />
                </div>
                <div>
                  <p className="text-black font-bold">{invoice.paymentMethod}</p>
                  <p className="text-gray-600 text-sm">ID: {invoice.paymentId}</p>
                  <p className="text-gray-600 text-sm mt-1">
                    {invoice.orderDate} at {invoice.orderTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Info */}
            <div>
              <h3 className="text-sm font-bold text-gray-600 uppercase mb-3 thai-font">ข้อมูลคำสั่งซื้อ</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm thai-font">อ้างอิงคำสั่งซื้อ:</span>
                  <Link
                    href={`/dashboard/orders/${invoice.orderReference}`}
                    className="text-black hover:underline font-medium flex items-center text-sm"
                  >
                    {invoice.orderReference}
                    <ExternalLink className="ml-1.5 h-3 w-3" />
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm thai-font">การจัดส่ง:</span>
                  <span className="text-black text-sm">{invoice.deliveryMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm thai-font">สถานะ:</span>
                  <span className="text-brutal-green font-bold text-sm flex items-center thai-font">
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> เสร็จสมบูรณ์
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Invoice Items */}
        <motion.div
          className="bg-white border-[3px] border-black overflow-hidden"
          style={{ boxShadow: '4px 4px 0 0 #000000' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          whileHover={{ y: -2 }}
        >
          <div className="p-6">
            <h3 className="text-lg font-bold text-black mb-4 flex items-center thai-font">
              <span className="w-1.5 h-5 bg-brutal-blue mr-2"></span>
              รายการในใบแจ้งหนี้
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-[2px] border-black">
                    <th className="text-left text-xs uppercase text-gray-600 font-bold pb-4 thai-font">รายการ</th>
                    <th className="text-center text-xs uppercase text-gray-600 font-bold pb-4 thai-font">มูลค่า</th>
                    <th className="text-center text-xs uppercase text-gray-600 font-bold pb-4 thai-font">จำนวน</th>
                    <th className="text-right text-xs uppercase text-gray-600 font-bold pb-4 thai-font">จำนวนเงิน</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item: any) => (
                    <tr key={item.id} className="border-b border-gray-200">
                      <td className="py-4">
                        <div className="flex items-center">
                          {item.image ? (
                            <div className="h-12 w-16 bg-gray-100 border-[2px] border-black flex items-center justify-center mr-4 overflow-hidden">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="h-12 w-12 bg-gray-100 border-[2px] border-black flex items-center justify-center mr-4">
                              <FileText className="h-5 w-5 text-gray-600" />
                            </div>
                          )}
                          <div>
                            <div className="text-black font-bold">{item.name}</div>
                            <div className="text-gray-600 text-sm">{item.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-center text-gray-600">{item.value}</td>
                      <td className="py-4 text-center text-gray-600">{item.quantity}</td>
                      <td className="py-4 text-right text-black font-bold">${item.price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Invoice Summary */}
            <div className="mt-6 border-t-[2px] border-black pt-4">
              <div className="flex flex-col items-end">
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span className="thai-font">ยอดรวมย่อย:</span>
                    <span>${(invoice.amount - 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span className="thai-font">ภาษี:</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between text-black font-bold border-t-[2px] border-black pt-2 mt-2">
                    <span className="thai-font">ยอดรวมทั้งหมด:</span>
                    <span>${invoice.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Notes & Info */}
        <motion.div
          className="bg-white border-[3px] border-black overflow-hidden"
          style={{ boxShadow: '4px 4px 0 0 #000000' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          whileHover={{ y: -2 }}
        >
          <div className="p-6">
            <h3 className="text-lg font-bold text-black mb-4 flex items-center thai-font">
              <span className="w-1.5 h-5 bg-brutal-yellow mr-2"></span>
              หมายเหตุ
            </h3>
            <p className="text-gray-600">{invoice.notes}</p>

            <div className="mt-6 border-t-[2px] border-black pt-6">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span className="text-sm thai-font">
                  ใบแจ้งหนี้สร้างเมื่อ {new Date(invoice.date).toLocaleDateString()} เวลา {invoice.orderTime}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer Actions */}
      <motion.div
        className="mt-8 flex flex-col sm:flex-row justify-between items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <div className="text-center sm:text-left mb-4 sm:mb-0">
          <Link
            href="/dashboard/invoice"
            className="inline-flex items-center px-4 py-2 border-[2px] border-black bg-gray-100 hover:bg-gray-200 transition-colors text-black thai-font"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับไปหน้าใบแจ้งหนี้
          </Link>
        </div>
        <p className="text-gray-600 text-sm thai-font">
          หากคุณมีคำถามใดๆ โปรดติดต่อทีมสนับสนุนของเรา
        </p>
      </motion.div>
    </div>
  );
}
