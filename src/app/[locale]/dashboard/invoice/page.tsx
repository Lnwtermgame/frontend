"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
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
import { useTranslations } from "next-intl";

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
  const t = useTranslations("Invoices");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const pathname = usePathname();
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
        toast.error(tCommon("error_occurred") || "Could not load invoices");
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
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, router, isInitialized, pathname]);

  // Filter invoices
  useEffect(() => {
    let result = invoices;

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(
        (invoice) => {
          const s = invoice.status.toLowerCase();
          if (statusFilter === "paid") return s === "completed" || s === "paid";
          return s === statusFilter;
        }
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
    return new Date(dateString).toLocaleDateString();
  };

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  // Render status badge
  const renderStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case "completed":
      case "paid":
        return (
          <span className="inline-flex items-center px-2 py-0.5 border-[2px] border-black text-[10px] font-bold bg-brutal-green text-black">
            <CheckCircle className="w-3 h-3 mr-1" /> {t("status.paid")}
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2 py-0.5 border-[2px] border-black text-[10px] font-bold bg-brutal-yellow text-black">
            <Clock className="w-3 h-3 mr-1" /> {t("status.pending")}
          </span>
        );
      case "cancelled":
      case "refunded":
        return (
          <span className="inline-flex items-center px-2 py-0.5 border-[2px] border-black text-[10px] font-bold bg-gray-300 text-black">
            <AlertCircle className="w-3 h-3 mr-1" /> {t("status.cancelled")}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 border-[2px] border-black text-[10px] font-bold bg-gray-200 text-black">
            {status}
          </span>
        );
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="relative mb-4">
        <motion.h2
          className="text-lg font-bold text-black mb-1 relative flex items-center"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <span className="w-1.5 h-4 bg-brutal-green mr-2"></span>
          {t("title")}
        </motion.h2>
        <p className="text-gray-600 text-xs relative font-bold">
          {t("subtitle")}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder={t("search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-[2px] border-gray-300 px-3 py-1.5 text-xs text-black focus:outline-none focus:border-black pl-8 transition-all"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
        </div>

        <div className="relative w-full sm:w-auto ml-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none w-full bg-white border-[2px] border-gray-300 px-3 py-1.5 pr-8 text-xs text-black focus:outline-none focus:border-black transition-all cursor-pointer"
          >
            <option value="all">{t("filter.all")}</option>
            <option value="paid">{t("filter.paid")}</option>
            <option value="pending">{t("filter.pending")}</option>
            <option value="cancelled">{t("filter.cancelled")}</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
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
                  <th className="px-4 py-3 text-xs font-bold text-gray-700 whitespace-nowrap">
                    {t("table.invoice_number")}
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-700 whitespace-nowrap">
                    {t("table.date")}
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-700 whitespace-nowrap">
                    {t("table.order_number")}
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-700 whitespace-nowrap">
                    {t("table.amount")}
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-700 whitespace-nowrap">
                    {t("table.status")}
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-700 whitespace-nowrap text-right">
                    {t("table.actions")}
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
                      <td className="px-4 py-3 text-xs font-bold text-black group-hover:text-brutal-blue transition-colors">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-gray-600" />
                          {invoice.invoiceNumber}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 font-bold">
                        {formatDate(invoice.issuedAt)}
                      </td>
                      <td className="px-4 py-3 text-xs text-black font-mono bg-gray-100 py-0.5 px-1.5 border-[1px] border-black w-fit font-bold">
                        {invoice.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-xs font-black text-black">
                        {formatCurrency(invoice.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        {renderStatusBadge(invoice.status)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/invoice/${invoice.id}`}>
                            <button
                              className="p-1.5 border-[2px] border-black bg-brutal-blue hover:bg-brutal-blue/80 text-black transition-all"
                              title={t("actions.view")}
                            >
                              <Eye size={14} />
                            </button>
                          </Link>
                          <Link href={`/dashboard/invoice/${invoice.id}`}>
                            <button
                              className="p-1.5 border-[2px] border-black bg-gray-100 hover:bg-gray-200 text-black transition-all"
                              title={t("actions.download")}
                            >
                              <Download size={14} />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <div className="w-12 h-12 bg-gray-100 border-[2px] border-black flex items-center justify-center mx-auto mb-3">
                        <FileText size={24} className="text-gray-400" />
                      </div>
                      <p className="text-black text-base font-bold mb-1">
                        {t("no_invoices")}
                      </p>
                      <p className="text-xs text-gray-600 max-w-md mx-auto font-bold">
                        {searchTerm
                          ? t("no_search_results", { query: searchTerm })
                          : t("no_invoices_desc")}
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
