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
          <div className="w-12 h-12 border-4 border-[#222427] border-t-[var(--site-accent)] rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400 font-medium">{tCommon("loading")}</p>
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
          <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-green-500/30/20 bg-green-500/10 text-[10px] font-medium text-green-500">
            <CheckCircle className="w-3 h-3 mr-1" /> {t("status.paid")}
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-yellow-500/30/20 bg-yellow-500/10 text-[10px] font-medium text-yellow-500">
            <Clock className="w-3 h-3 mr-1" /> {t("status.pending")}
          </span>
        );
      case "cancelled":
      case "refunded":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-red-500/30/20 bg-red-500/10 text-[10px] font-medium text-red-500">
            <AlertCircle className="w-3 h-3 mr-1" /> {t("status.cancelled")}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-gray-500/20 bg-[#181A1D]0/10 text-[10px] font-medium text-gray-400">
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
          className="text-2xl font-bold text-white mb-2 relative flex items-center"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <span className="w-1.5 h-6 bg-[var(--site-accent)] mr-3 rounded-full"></span>
          {t("title")}
        </motion.h2>
        <p className="text-gray-400 text-sm ml-4 border-l-2 border-site-border pl-3">
          {t("subtitle")}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder={t("search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1A1C1E] border border-site-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--site-accent)] pl-10 transition-all placeholder-gray-500"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        </div>

        <div className="relative w-full sm:w-auto ml-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none w-full sm:w-48 bg-[#1A1C1E] border border-site-border rounded-lg px-4 py-2.5 pr-10 text-sm text-white focus:outline-none focus:border-[var(--site-accent)] transition-all cursor-pointer"
          >
            <option value="all">{t("filter.all")}</option>
            <option value="paid">{t("filter.paid")}</option>
            <option value="pending">{t("filter.pending")}</option>
            <option value="cancelled">{t("filter.cancelled")}</option>
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <motion.div
        className="bg-[#222427] border border-site-border rounded-xl shadow-ocean overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-8 h-8 border-3 border-[#1A1C1E] border-t-[var(--site-accent)] rounded-full animate-spin"></div>
              <p className="mt-4 text-sm text-gray-400">{tCommon("loading")}</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#1A1C1E] border-b border-site-border">
                <tr>
                  <th className="px-5 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {t("table.invoice_number")}
                  </th>
                  <th className="px-5 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {t("table.date")}
                  </th>
                  <th className="px-5 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {t("table.order_number")}
                  </th>
                  <th className="px-5 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {t("table.amount")}
                  </th>
                  <th className="px-5 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {t("table.status")}
                  </th>
                  <th className="px-5 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap text-right">
                    {t("table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-site-border/50">
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice, index) => (
                    <motion.tr
                      key={invoice.id}
                      className="hover:bg-[#1A1C1E]/50 transition-colors group"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="px-5 py-4 text-sm font-medium text-white group-hover:text-[var(--site-accent)] transition-colors">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-gray-500 group-hover:text-[var(--site-accent)] transition-colors" />
                          {invoice.invoiceNumber}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-400">
                        {formatDate(invoice.issuedAt)}
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <span className="bg-[#1A1C1E] text-gray-300 py-1 px-2.5 rounded-md border border-site-border font-mono text-xs">
                          {invoice.orderNumber}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-[var(--site-accent)]">
                        {formatCurrency(invoice.totalAmount)}
                      </td>
                      <td className="px-5 py-4">
                        {renderStatusBadge(invoice.status)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/invoice/${invoice.id}`}>
                            <button
                              className="p-2 rounded-lg border border-site-border bg-[#1A1C1E] hover:bg-[#2A2D31] hover:border-[var(--site-accent)]/50 text-gray-400 hover:text-[var(--site-accent)] transition-all shadow-sm"
                              title={t("actions.view")}
                            >
                              <Eye size={16} />
                            </button>
                          </Link>
                          {/* Removing download icon link for now or keeping it with same style as eye */}
                          <Link href={`/dashboard/invoice/${invoice.id}`}>
                            <button
                              className="p-2 rounded-lg border border-site-border bg-[#1A1C1E] hover:bg-[#2A2D31] hover:border-[var(--site-accent)]/50 text-gray-400 hover:text-[var(--site-accent)] transition-all shadow-sm"
                              title={t("actions.download")}
                            >
                              <Download size={16} />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="w-16 h-16 bg-[#1A1C1E] rounded-full border border-site-border flex items-center justify-center mx-auto mb-4 shadow-inner">
                        <FileText size={28} className="text-gray-500" />
                      </div>
                      <p className="text-white text-lg font-medium mb-2">
                        {t("no_invoices")}
                      </p>
                      <p className="text-sm text-gray-400 max-w-md mx-auto">
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
