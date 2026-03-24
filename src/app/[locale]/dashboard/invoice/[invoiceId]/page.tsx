"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { usePublicSettings } from "@/lib/context/public-settings-context";
import { motion } from "@/lib/framer-exports";
import Link from "next/link";
import { invoiceApi, type Invoice } from "@/lib/services/invoice-api";
import toast from "react-hot-toast";
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
  ExternalLink,
  Package,
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function InvoiceDetailPage() {
  const t = useTranslations("InvoiceDetail");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const pathname = usePathname();
  const { user, isInitialized } = useAuth();
  const { settings: publicSettings } = usePublicSettings();
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const siteName = publicSettings?.general.siteName || "Lnwtermgame";

  // Copy invoice ID to clipboard
  const copyInvoiceId = () => {
    if (typeof window !== "undefined" && invoice) {
      navigator.clipboard.writeText(invoice.invoiceNumber);
      setCopied(true);
      toast.success(t("copy_success") || "Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Generate printable HTML for the invoice
  const generatePrintHtml = useCallback(() => {
    if (!invoice || !user) return "";

    const issuedDate = new Date(invoice.issuedAt).toLocaleDateString();
    const issuedTime = new Date(invoice.issuedAt).toLocaleTimeString();

    const statusLabel = (() => {
      switch (invoice.status) {
        case "COMPLETED":
          return t("paid");
        case "PENDING":
          return t("unpaid");
        case "REFUNDED":
          return "Refunded";
        default:
          return invoice.status;
      }
    })();

    const itemsRows = invoice.items
      .map(
        (item) => `
      <tr>
        <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;">${item.productName}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">฿${item.unitPrice.toFixed(2)}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:bold;">฿${item.total.toFixed(2)}</td>
      </tr>
    `,
      )
      .join("");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family:'Inter', sans-serif; padding:40px; color:#111; font-size:14px; }
          .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:40px; border-bottom:1px solid #e5e7eb; padding-bottom:20px; }
          .logo { font-size:24px; font-weight:700; color: #111; }
          .logo span { color:#67B0BA; }
          .invoice-title { text-align:right; }
          .invoice-title h1 { font-size:24px; margin-bottom:4px; font-weight: 600; }
          .invoice-title .inv-number { font-size:14px; color:#6b7280; }
          .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:30px; margin-bottom:40px; }
          .info-box h3 { font-size:11px; text-transform:uppercase; color:#6b7280; margin-bottom:12px; letter-spacing:0.05em; font-weight: 600; }
          .info-box p { margin:6px 0; color: #374151; }
          table { width:100%; border-collapse:collapse; margin-bottom:30px; }
          thead th { text-align:left; padding:12px 16px; border-bottom:1px solid #e5e7eb; font-size:11px; text-transform:uppercase; color:#6b7280; background-color: #f9fafb; font-weight: 600; letter-spacing: 0.05em; }
          thead th:nth-child(2) { text-align:center; }
          thead th:nth-child(3), thead th:nth-child(4) { text-align:right; }
          tbody td { padding: 16px; border-bottom: 1px solid #f3f4f6; color: #374151; }
          tbody td:nth-child(2) { text-align:center; }
          tbody td:nth-child(3), tbody td:nth-child(4) { text-align:right; }
          .summary { display:flex; justify-content:flex-end; }
          .summary-box { width:320px; background-color: #f9fafb; padding: 20px; border-radius: 8px; }
          .summary-row { display:flex; justify-content:space-between; padding:8px 0; color: #4b5563; }
          .summary-total { border-top:1px solid #e5e7eb; margin-top:12px; padding-top:16px; font-weight:700; font-size:18px; color: #111; }
          .status { display:inline-block; padding:4px 12px; font-size:12px; font-medium; border-radius: 9999px; }
          .status-completed { background:#dcfce7; color: #166534; }
          .status-pending { background:#fef9c3; color: #854d0e; }
          .footer { margin-top:60px; padding-top:24px; border-top:1px solid #e5e7eb; text-align:center; color:#9ca3af; font-size:12px; }
          @media print { body { padding:20px; } .summary-box { border: 1px solid #e5e7eb; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">${siteName}</div>
          <div class="invoice-title">
            <h1>${t("title")}</h1>
            <div class="inv-number">${invoice.invoiceNumber}</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <h3>${t("customer_info")}</h3>
            <p><strong>${user.username || "User"}</strong></p>
            <p>${user.email || ""}</p>
          </div>
          <div class="info-box" style="text-align:right;">
            <h3>${t("title")}</h3>
            <p>${t("invoice_no")}: <strong>${invoice.invoiceNumber}</strong></p>
            <p>${t("date")}: ${issuedDate}</p>
            <p>Time: ${issuedTime}</p>
            <p>${t("order_no")}: ${invoice.orderNumber}</p>
            <p>${t("payment_status")}: <span class="status ${invoice.status === "COMPLETED" ? "status-completed" : "status-pending"}">${statusLabel}</span></p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>${t("product")}</th>
              <th>${t("quantity")}</th>
              <th>${t("price")}</th>
              <th>${t("total")}</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-box">
            <div class="summary-row">
              <span>${t("subtotal")}:</span>
              <span>฿${invoice.amount.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span>${t("vat")}:</span>
              <span>฿${invoice.taxAmount.toFixed(2)}</span>
            </div>
            <div class="summary-row summary-total">
              <span>${t("grand_total")}:</span>
              <span>฿${invoice.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your purchase!</p>
          <p style="margin-top:4px;">${siteName} — ${issuedDate}</p>
        </div>
      </body>
      </html>
    `;
  }, [invoice, user, siteName, t]);

  // Print invoice
  const handlePrint = () => {
    const html = generatePrintHtml();
    if (!html) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Could not open print window");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  // Download as PDF (via print dialog's "Save as PDF")
  const handleDownloadPdf = () => {
    const html = generatePrintHtml();
    if (!html) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Could not open print window");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
    toast.success('Please select "Save as PDF" in the print dialog');
  };

  // Download invoice data as CSV
  const handleDownloadCsv = () => {
    if (!invoice) return;

    const headers = [t("product"), t("quantity"), t("price"), t("total")];
    const rows = invoice.items.map((item) => [
      item.productName,
      String(item.quantity),
      item.unitPrice.toFixed(2),
      item.total.toFixed(2),
    ]);
    rows.push([]);
    rows.push(["", "", t("subtotal") + ":", invoice.amount.toFixed(2)]);
    rows.push(["", "", t("vat") + ":", invoice.taxAmount.toFixed(2)]);
    rows.push(["", "", t("grand_total") + ":", invoice.totalAmount.toFixed(2)]);

    const bom = "\uFEFF";
    const csvContent =
      bom + [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${invoice.invoiceNumber}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV Download Successful");
  };

  // Fetch invoice data from API
  useEffect(() => {
    if (!isInitialized) return;

    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    const fetchInvoice = async () => {
      try {
        setLoading(true);
        setError(null);

        if (typeof invoiceId !== "string") {
          setError(tCommon("error_occurred"));
          return;
        }

        const response = await invoiceApi.getInvoiceById(invoiceId);

        if (response.success && response.data) {
          setInvoice(response.data);
        } else {
          setError(response.message || t("error_not_found"));
        }
      } catch (err: any) {
        console.error("Error fetching invoice:", err);
        setError(invoiceApi.getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId, router, user, isInitialized, t, tCommon]);

  // Show loading state
  if (loading) {
    return (
      <div className="page-container text-center">
        <div className="bg-[#222427] border border-site-border rounded-xl shadow-ocean p-12">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-[#1A1C1E] border-t-[var(--site-accent)] rounded-full animate-spin mb-6"></div>
            <div className="space-y-4 w-full max-w-sm">
              <div className="h-4 bg-[#1A1C1E] rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-[#1A1C1E] rounded w-full"></div>
              <div className="h-4 bg-[#1A1C1E] rounded w-5/6 mx-auto"></div>
            </div>
          </div>
          <p className="mt-8 text-gray-400 font-medium">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="page-container">
        <motion.div
          className="bg-[#222427] border border-site-border rounded-xl shadow-ocean p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {tCommon("error_occurred") || "Error"}
          </h2>
          <p className="text-gray-400 mb-8">{error}</p>
          <button
            onClick={() => router.push("/dashboard/invoice")}
            className="inline-flex items-center px-6 py-2.5 rounded-lg border border-site-border bg-[#1A1C1E] text-white hover:text-[var(--site-accent)] hover:border-[var(--site-accent)]/50 transition-all shadow-sm font-medium"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("back_to_list")}
          </button>
        </motion.div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  // Helper to get safe image URL
  const getSafeImageUrl = (url?: string | null) => {
    if (!url) return null;
    return url.replace(/`/g, "").trim();
  };

  // Format dates
  const issuedDate = new Date(invoice.issuedAt).toLocaleDateString();
  const issuedTime = new Date(invoice.issuedAt).toLocaleTimeString();

  // Status styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "Paid":
        return "bg-green-500/10 text-green-500 border border-green-500/30/20";
      case "REFUNDED":
        return "bg-red-500/10 text-red-500 border border-red-500/30/20";
      case "PENDING":
        return "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30/20";
      default:
        return "bg-[#181A1D]0/10 text-gray-400 border border-gray-500/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return t("paid");
      case "PENDING":
        return t("unpaid");
      case "REFUNDED":
        return "Refunded";
      default:
        return status;
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="relative mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-start mb-4 gap-4">
          <div>
            <Link
              href="/dashboard/invoice"
              className="text-gray-400 hover:text-[var(--site-accent)] inline-flex items-center text-sm mb-4 font-medium transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("back_to_list")}
            </Link>
          </div>

          <div className="flex gap-2">
            <motion.button
              className="p-2 rounded-lg border border-site-border bg-[#1A1C1E] hover:bg-[#2A2D31] hover:border-[var(--site-accent)]/50 transition-all inline-flex items-center text-gray-400 hover:text-[var(--site-accent)] shadow-sm"
              whileTap={{ scale: 0.95 }}
              onClick={copyInvoiceId}
              title={copied ? "Copied" : "Copy Invoice ID"}
            >
              {copied ? (
                <Check className="h-4 w-4 text-[var(--site-accent)]" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </motion.button>

            <motion.button
              className="p-2 rounded-lg border border-site-border bg-[#1A1C1E] hover:bg-[#2A2D31] hover:border-[var(--site-accent)]/50 transition-all inline-flex items-center text-gray-400 hover:text-[var(--site-accent)] shadow-sm"
              whileTap={{ scale: 0.95 }}
              onClick={handlePrint}
              title={t("print")}
            >
              <Printer className="h-4 w-4" />
            </motion.button>

            <motion.button
              className="p-2 rounded-lg border border-site-border bg-[#1A1C1E] hover:bg-[#2A2D31] hover:border-[var(--site-accent)]/50 transition-all inline-flex items-center text-gray-400 hover:text-[var(--site-accent)] shadow-sm"
              whileTap={{ scale: 0.95 }}
              onClick={handleDownloadCsv}
              title="Download CSV"
            >
              <Download className="h-4 w-4" />
            </motion.button>

            <motion.button
              className="px-4 py-2 rounded-lg bg-[var(--site-accent)] hover:bg-[var(--site-accent)]/90 text-white font-semibold inline-flex items-center transition-all shadow-[0_0_15px_rgba(103,176,186,0.3)] text-sm"
              whileTap={{ scale: 0.95 }}
              onClick={handleDownloadPdf}
            >
              {t("download_pdf")}
            </motion.button>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white relative flex items-center">
            <span className="w-1.5 h-6 bg-[var(--site-accent)] mr-3 rounded-full"></span>
            {t("invoice_no")} {invoice.invoiceNumber}
          </h1>
          <div className="flex items-center gap-3 mt-3 ml-4 pl-3.5 border-l-2 border-site-border">
            <p className="text-gray-400 text-sm font-medium">{issuedDate}</p>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${getStatusStyle(invoice.status)}`}
            >
              {getStatusLabel(invoice.status)}
            </span>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="space-y-6">
        {/* Invoice Summary Card */}
        <motion.div
          className="bg-[#222427] border border-site-border rounded-xl shadow-ocean overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Customer Info */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                {t("customer_info")}
              </h3>
              <p className="text-white font-medium text-base mb-1">
                {user?.username || "User"}
              </p>
              <p className="text-gray-400 text-sm">{user?.email || ""}</p>
            </div>

            {/* Payment Info */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                {t("payment_info")}
              </h3>
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-[#1A1C1E] border border-site-border rounded-lg text-[var(--site-accent)]">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium text-base">
                      {getStatusLabel(invoice.status)}
                    </p>
                    {invoice.status === "COMPLETED" && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mt-1 font-mono">
                    {issuedDate} • {issuedTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Info */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                Order Information
              </h3>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center bg-[#1A1C1E] p-2 rounded-lg border border-site-border">
                  <span className="text-gray-400 text-xs font-medium uppercase tracking-wide">
                    {t("order_no")}
                  </span>
                  <Link
                    href={`/dashboard/orders/${invoice.orderId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--site-accent)] hover:text-white transition-colors font-mono text-xs flex items-center gap-1.5"
                  >
                    {invoice.orderNumber}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <div className="flex justify-between items-center bg-[#1A1C1E] p-2 rounded-lg border border-site-border">
                  <span className="text-gray-400 text-xs font-medium uppercase tracking-wide">
                    {t("invoice_no")}
                  </span>
                  <span className="text-white text-xs font-mono font-medium">
                    {invoice.invoiceNumber}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Invoice Items */}
        <motion.div
          className="bg-[#222427] border border-site-border rounded-xl shadow-ocean overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <div className="p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center">
              <span className="w-1.5 h-5 bg-[var(--site-accent)] mr-3 rounded-full"></span>
              {t("item_details")}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-site-border bg-[#1A1C1E]">
                    <th className="text-left text-xs uppercase tracking-wider text-gray-400 font-semibold py-4 px-4 rounded-tl-lg">
                      {t("product")}
                    </th>
                    <th className="text-center text-xs uppercase tracking-wider text-gray-400 font-semibold py-4 px-4">
                      {t("quantity")}
                    </th>
                    <th className="text-right text-xs uppercase tracking-wider text-gray-400 font-semibold py-4 px-4">
                      {t("price")}
                    </th>
                    <th className="text-right text-xs uppercase tracking-wider text-gray-400 font-semibold py-4 px-4 rounded-tr-lg">
                      {t("total")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-site-border/50">
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="hover:bg-[#1A1C1E]/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-[#1A1C1E] border border-site-border flex items-center justify-center shrink-0 overflow-hidden relative">
                            {getSafeImageUrl(item.imageUrl) ? (
                              <img
                                src={getSafeImageUrl(item.imageUrl)!}
                                alt={item.productName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-5 w-5 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <div className="text-white font-medium text-sm mb-1">
                              {item.productName}
                            </div>
                            <div className="inline-flex items-center px-2 py-0.5 rounded bg-[#1A1C1E] border border-site-border text-gray-400 text-[10px] font-mono">
                              ID: {item.id.slice(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center text-gray-300 text-sm font-medium">
                        {item.quantity}
                      </td>
                      <td className="py-4 px-4 text-right text-gray-400 text-sm">
                        ฿{item.unitPrice.toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-right text-white font-semibold text-base">
                        ฿{item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Invoice Summary */}
            <div className="mt-8 pt-6 border-t border-site-border">
              <div className="flex flex-col items-end">
                <div className="w-full max-w-sm space-y-3 bg-[#1A1C1E] p-5 rounded-xl border border-site-border">
                  <div className="flex justify-between items-center text-gray-400 text-sm">
                    <span>{t("subtotal")}:</span>
                    <span className="font-mono">฿{invoice.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-400 text-sm border-b border-site-border/50 pb-3">
                    <span>{t("vat")}:</span>
                    <span className="font-mono">฿{invoice.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-white font-semibold">{t("grand_total")}:</span>
                    <span className="text-xl font-bold text-[var(--site-accent)]">฿{invoice.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Notes & Info */}
        <motion.div
          className="bg-[#222427] border border-site-border rounded-xl shadow-ocean overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <div className="p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center">
              <span className="w-1.5 h-4 bg-yellow-500 mr-3 rounded-full"></span>
              Note
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Thank you for your purchase! This invoice is an automated document.
              If you have any questions or need assistance, please contact our customer support team.
            </p>

            <div className="mt-6 pt-4 border-t border-site-border">
              <div className="flex items-center gap-2 text-gray-500 bg-[#1A1C1E] w-fit px-3 py-1.5 rounded-md border border-site-border font-mono text-xs">
                <Clock className="h-4 w-4 text-[var(--site-accent)]" />
                <span>
                  Issued on {issuedDate} at {issuedTime}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer Actions */}
      <motion.div
        className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <Link
          href="/dashboard/invoice"
          className="inline-flex items-center px-4 py-2 rounded-lg border border-site-border bg-[#1A1C1E] hover:bg-[#2A2D31] hover:text-[var(--site-accent)] transition-all text-white text-sm font-medium w-full sm:w-auto justify-center shadow-sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("back_to_list")}
        </Link>
        <p className="text-gray-500 text-xs text-center sm:text-right">
          If you have any questions, please contact our support team.
        </p>
      </motion.div>
    </div>
  );
}
