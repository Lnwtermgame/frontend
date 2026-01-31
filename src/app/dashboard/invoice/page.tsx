"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { invoiceApi } from "@/lib/services/invoice-api";
import { FileText, Download, Eye, Search, ChevronDown, CheckCircle, Clock, AlertCircle } from "lucide-react";
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

  // Fetch invoices from API
  useEffect(() => {
    if (isInitialized && user) {
      fetchInvoices();
    }
  }, [isInitialized, user]);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const response = await invoiceApi.getInvoices();
      if (response.success) {
        setInvoices(response.data);
        setFilteredInvoices(response.data);
      }
    } catch (error) {
      toast.error('ไม่สามารถโหลดใบแจ้งหนี้ได้');
    } finally {
      setIsLoading(false);
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
      result = result.filter(invoice => invoice.status.toLowerCase() === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      result = result.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredInvoices(result);
  }, [searchTerm, statusFilter, invoices]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
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
    switch (status.toLowerCase()) {
      case "completed":
      case "paid":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-mali-green/20 text-mali-green border border-mali-green/20 thai-font">
            <CheckCircle className="w-3 h-3 mr-1" /> ชำระแล้ว
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-yellow-900/30 text-yellow-400 border border-yellow-400/20 thai-font">
            <Clock className="w-3 h-3 mr-1" /> รอดำเนินการ
          </span>
        );
      case "cancelled":
      case "refunded":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-mali-red/20 text-mali-red border border-mali-red/20 thai-font">
            <AlertCircle className="w-3 h-3 mr-1" /> ยกเลิกแล้ว
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-mali-blue/20 text-mali-text-secondary border border-mali-blue/20 thai-font">
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
          className="text-xl font-bold text-white mb-1 relative thai-font"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          ใบแจ้งหนี้ของฉัน
        </motion.h2>
        <p className="text-mali-text-secondary text-sm relative thai-font">
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
            className="w-full rounded-full bg-mali-blue/10 px-4 py-2 text-sm text-white border border-mali-blue/20 focus:outline-none focus:ring-1 focus:ring-mali-blue-accent pl-10 transition-all thai-font"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mali-text-secondary" />
        </div>

        <div className="relative w-full sm:w-auto ml-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none w-full rounded-full bg-mali-blue/10 px-4 py-2 pr-10 text-sm text-white border border-mali-blue/20 focus:outline-none focus:ring-1 focus:ring-mali-blue-accent transition-all cursor-pointer thai-font"
          >
            <option value="all">ใบแจ้งหนี้ทั้งหมด</option>
            <option value="completed">ชำระแล้ว</option>
            <option value="pending">รอดำเนินการ</option>
            <option value="cancelled">ยกเลิกแล้ว</option>
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mali-text-secondary pointer-events-none" />
        </div>
      </div>

      <motion.div
        className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-mali-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-mali-blue/10 border-b border-mali-blue/20">
                <tr>
                  <th className="px-6 py-4 text-sm font-medium text-mali-text-secondary whitespace-nowrap thai-font">รหัสใบแจ้งหนี้</th>
                  <th className="px-6 py-4 text-sm font-medium text-mali-text-secondary whitespace-nowrap thai-font">วันที่</th>
                  <th className="px-6 py-4 text-sm font-medium text-mali-text-secondary whitespace-nowrap thai-font">รหัสคำสั่งซื้อ</th>
                  <th className="px-6 py-4 text-sm font-medium text-mali-text-secondary whitespace-nowrap thai-font">จำนวนเงิน</th>
                  <th className="px-6 py-4 text-sm font-medium text-mali-text-secondary whitespace-nowrap thai-font">สถานะ</th>
                  <th className="px-6 py-4 text-sm font-medium text-mali-text-secondary whitespace-nowrap text-right thai-font">การกระทำ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mali-blue/10">
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice, index) => (
                    <motion.tr
                      key={invoice.id}
                      className="hover:bg-mali-blue/5 transition-colors group"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-white group-hover:text-mali-blue-accent transition-colors">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-mali-blue-light" />
                          {invoice.invoiceNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-mali-text-secondary">
                        {formatDate(invoice.issuedAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-white font-mono text-xs bg-mali-blue/5 py-1 px-2 rounded w-fit">
                        {invoice.orderNumber}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-white">
                        {formatCurrency(invoice.totalAmount)}
                      </td>
                      <td className="px-6 py-4">
                        {renderStatusBadge(invoice.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/invoice/${invoice.id}`}>
                            <button
                              className="p-2 rounded-lg bg-mali-blue/10 hover:bg-mali-blue/20 text-mali-blue-accent transition-all hover:scale-105"
                              title="ดูใบแจ้งหนี้"
                            >
                              <Eye size={16} />
                            </button>
                          </Link>
                          <button
                            className="p-2 rounded-lg bg-mali-blue/10 hover:bg-mali-blue/20 text-mali-blue-light transition-all hover:scale-105"
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
                      <div className="w-16 h-16 bg-mali-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText size={32} className="text-mali-text-secondary opacity-50" />
                      </div>
                      <p className="text-white text-lg font-medium mb-1 thai-font">ไม่พบใบแจ้งหนี้</p>
                      <p className="text-sm text-mali-text-secondary max-w-md mx-auto thai-font">
                        {searchTerm ? `ไม่พบผลลัพธ์สำหรับ "${searchTerm}"` : "คุณยังไม่มีใบแจ้งหนี้ใดๆ"}
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
