"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { invoiceApi } from "@/lib/services/invoice-api";
import {
  FileText,
  Download,
  Eye,
  Search,
  ChevronDown,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";
import toast from "react-hot-toast";

interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  issuedAt: string;
  totalAmount: number;
  status: string;
  items: {
    productName: string;
  }[];
}

export default function InvoicePage() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch invoices from API
  useEffect(() => {
    if (isInitialized && user) {
      fetchInvoices();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isInitialized, user]);

  const fetchInvoices = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    try {
      const response = await invoiceApi.getInvoices(1, 20, controller.signal);
      if (response.success) {
        setInvoices(response.data);
        setFilteredInvoices(response.data);
      }
    } catch (error: any) {
      if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") {
        toast.error("ไม่สามารถโหลดใบแจ้งหนี้ได้");
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  // If not logged in, redirect to login page
  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [user, router, isInitialized]);

  // Filter invoices
  useEffect(() => {
    let result = invoices;

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(
        (invoice) => invoice.status.toLowerCase() === statusFilter,
      );
    }

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        (invoice) =>
          invoice.invoiceNumber
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          invoice.orderNumber
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          invoice.items.some((item) =>
            item.productName.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
      );
    }

    setFilteredInvoices(result);
  }, [searchTerm, statusFilter, invoices]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
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
    switch (status.toLowerCase()) {
      case "completed":
      case "paid":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 border-[2px] border-black text-xs font-bold bg-brutal-green text-black thai-font">
            <CheckCircle className="w-3 h-3 mr-1" /> ชำระแล้ว
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 border-[2px] border-black text-xs font-bold bg-brutal-yellow text-black thai-font">
            <Clock className="w-3 h-3 mr-1" /> รอดำเนินการ
          </span>
        );
      case "cancelled":
      case "refunded":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 border-[2px] border-black text-xs font-bold bg-gray-300 text-black thai-font">
            <AlertCircle className="w-3 h-3 mr-1" /> ยกเลิกแล้ว
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 border-[2px] border-black text-xs font-bold bg-gray-200 text-black thai-font">
            {status}
          </span>
        );
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="relative mb-6">
        <motion.h2
          className="text-xl font-bold text-black mb-1 relative flex items-center thai-font"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <span className="w-1.5 h-5 bg-brutal-green mr-2"></span>
          ใบแจ้งหนี้ของฉัน
        </motion.h2>
        <p className="text-gray-600 text-sm relative thai-font">
          ดูและดาวน์โหลดใบแจ้งหนี้การทำธุรกรรมของคุณ
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="ค้นหาใบแจ้งหนี้หรือรหัสคำสั่งซื้อ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-[2px] border-gray-300 px-4 py-2 text-sm text-black focus:outline-none focus:border-black pl-10 transition-all thai-font"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        </div>

        <div className="relative w-full sm:w-auto ml-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none w-full bg-white border-[2px] border-gray-300 px-4 py-2 pr-10 text-sm text-black focus:outline-none focus:border-black transition-all cursor-pointer thai-font"
          >
            <option value="all">ใบแจ้งหนี้ทั้งหมด</option>
            <option value="completed">ชำระแล้ว</option>
            <option value="pending">รอดำเนินการ</option>
            <option value="cancelled">ยกเลิกแล้ว</option>
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
        </div>
      </div>

      <motion.div
        className="bg-white border-[3px] border-black overflow-hidden"
        style={{ boxShadow: "4px 4px 0 0 #000000" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100 border-b-[3px] border-black">
                <tr>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 whitespace-nowrap thai-font">
                    รหัสใบแจ้งหนี้
                  </th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 whitespace-nowrap thai-font">
                    วันที่
                  </th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 whitespace-nowrap thai-font">
                    รหัสคำสั่งซื้อ
                  </th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 whitespace-nowrap thai-font">
                    จำนวนเงิน
                  </th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 whitespace-nowrap thai-font">
                    สถานะ
                  </th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 whitespace-nowrap text-right thai-font">
                    การกระทำ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice, index) => (
                    <motion.tr
                      key={invoice.id}
                      className="hover:bg-gray-50 transition-colors group"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="px-6 py-4 text-sm font-bold text-black group-hover:text-brutal-blue transition-colors">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-gray-600" />
                          {invoice.invoiceNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(invoice.issuedAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-black font-mono text-xs bg-gray-100 py-1 px-2 border-[2px] border-black w-fit">
                        {invoice.orderNumber}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-black">
                        {formatCurrency(invoice.totalAmount)}
                      </td>
                      <td className="px-6 py-4">
                        {renderStatusBadge(invoice.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/invoice/${invoice.id}`}>
                            <button
                              className="p-2 border-[2px] border-black bg-brutal-blue hover:bg-brutal-blue/80 text-black transition-all"
                              title="ดูใบแจ้งหนี้"
                            >
                              <Eye size={16} />
                            </button>
                          </Link>
                          <button
                            className="p-2 border-[2px] border-black bg-gray-100 hover:bg-gray-200 text-black transition-all"
                            title="ดาวน์โหลด PDF"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="w-16 h-16 bg-gray-100 border-[2px] border-black flex items-center justify-center mx-auto mb-4">
                        <FileText size={32} className="text-gray-400" />
                      </div>
                      <p className="text-black text-lg font-bold mb-1 thai-font">
                        ไม่พบใบแจ้งหนี้
                      </p>
                      <p className="text-sm text-gray-600 max-w-md mx-auto thai-font">
                        {searchTerm
                          ? `ไม่พบผลลัพธ์สำหรับ "${searchTerm}"`
                          : "คุณยังไม่มีใบแจ้งหนี้ใดๆ"}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
