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
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton, SkeletonListRow } from "@/components/ui/Skeleton";

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
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-8" />
          <p className="text-site-muted font-medium">{tCommon("loading")}</p>
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
          <Badge variant="success">
            <CheckCircle className="w-3 h-3" /> {t("status.paid")}
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="warning">
            <Clock className="w-3 h-3" /> {t("status.pending")}
          </Badge>
        );
      case "cancelled":
      case "refunded":
        return (
          <Badge variant="danger">
            <AlertCircle className="w-3 h-3" /> {t("status.cancelled")}
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div>
      <SectionHeader level={1} title={t("title")} />

      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder={t("search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="site-input w-full pl-10"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-site-dim" />
        </div>

        <div className="relative w-full sm:w-auto ml-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="site-input appearance-none w-full sm:w-48 pr-10 cursor-pointer"
          >
            <option value="all">{t("filter.all")}</option>
            <option value="paid">{t("filter.paid")}</option>
            <option value="pending">{t("filter.pending")}</option>
            <option value="cancelled">{t("filter.cancelled")}</option>
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-site-muted pointer-events-none" />
        </div>
      </div>

      <div className="site-card overflow-hidden">
        {isLoading ? (
          <div className="space-y-0 p-4">
            {[1, 2, 3, 4].map((i) => <SkeletonListRow key={i} />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-site-raised border-b border-site-border-soft">
                <tr>
                  <th className="px-5 py-3 text-[11px] uppercase text-site-dim font-bold tracking-wider whitespace-nowrap">
                    {t("table.invoice_number")}
                  </th>
                  <th className="px-5 py-3 text-[11px] uppercase text-site-dim font-bold tracking-wider whitespace-nowrap">
                    {t("table.date")}
                  </th>
                  <th className="px-5 py-3 text-[11px] uppercase text-site-dim font-bold tracking-wider whitespace-nowrap">
                    {t("table.order_number")}
                  </th>
                  <th className="px-5 py-3 text-[11px] uppercase text-site-dim font-bold tracking-wider whitespace-nowrap">
                    {t("table.amount")}
                  </th>
                  <th className="px-5 py-3 text-[11px] uppercase text-site-dim font-bold tracking-wider whitespace-nowrap">
                    {t("table.status")}
                  </th>
                  <th className="px-5 py-3 text-[11px] uppercase text-site-dim font-bold tracking-wider whitespace-nowrap text-right">
                    {t("table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-site-border-soft last:border-b-0 hover:bg-site-raised transition-colors group"
                    >
                      <td className="px-5 py-3 text-sm font-medium text-site-text group-hover:text-site-accent transition-colors">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-site-dim group-hover:text-site-accent transition-colors" />
                          {invoice.invoiceNumber}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-site-muted">
                        {formatDate(invoice.issuedAt)}
                      </td>
                      <td className="px-5 py-3 text-sm">
                        <span className="bg-site-raised text-site-muted py-0.5 px-2 rounded-4 border border-site-border-soft font-mono text-xs">
                          {invoice.orderNumber}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm font-semibold text-site-accent">
                        {formatCurrency(invoice.totalAmount)}
                      </td>
                      <td className="px-5 py-3">
                        {renderStatusBadge(invoice.status)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/invoice/${invoice.id}`}>
                            <button
                              className="p-1.5 rounded-6 border border-site-border-soft bg-site-surface hover:bg-site-raised hover:border-site-accent/50 text-site-muted hover:text-site-accent transition-colors"
                              title={t("actions.view")}
                            >
                              <Eye size={14} />
                            </button>
                          </Link>
                          <Link href={`/dashboard/invoice/${invoice.id}`}>
                            <button
                              className="p-1.5 rounded-6 border border-site-border-soft bg-site-surface hover:bg-site-raised hover:border-site-accent/50 text-site-muted hover:text-site-accent transition-colors"
                              title={t("actions.download")}
                            >
                              <Download size={14} />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <EmptyState icon={FileText} message={
                        searchTerm
                          ? t("no_search_results", { query: searchTerm })
                          : t("no_invoices_desc")
                      } />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
