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
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family:'Inter', sans-serif; padding:40px; color:#111; font-size:14px; }
          .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:40px; border-bottom:3px solid #000; padding-bottom:20px; }
          .logo { font-size:24px; font-weight:bold; }
          .logo span { color:#ec4899; }
          .invoice-title { text-align:right; }
          .invoice-title h1 { font-size:28px; margin-bottom:4px; }
          .invoice-title .inv-number { font-size:14px; color:#666; }
          .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:30px; margin-bottom:30px; }
          .info-box h3 { font-size:12px; text-transform:uppercase; color:#666; margin-bottom:8px; letter-spacing:1px; }
          .info-box p { margin:4px 0; }
          table { width:100%; border-collapse:collapse; margin-bottom:20px; }
          thead th { text-align:left; padding:12px 8px; border-bottom:3px solid #000; font-size:12px; text-transform:uppercase; color:#666; }
          thead th:nth-child(2) { text-align:center; }
          thead th:nth-child(3), thead th:nth-child(4) { text-align:right; }
          .summary { display:flex; justify-content:flex-end; }
          .summary-box { width:280px; }
          .summary-row { display:flex; justify-content:space-between; padding:6px 0; }
          .summary-total { border-top:3px solid #000; margin-top:8px; padding-top:8px; font-weight:bold; font-size:16px; }
          .status { display:inline-block; padding:4px 12px; font-size:12px; font-weight:bold; border:2px solid #000; }
          .status-completed { background:#86efac; }
          .status-pending { background:#93c5fd; }
          .footer { margin-top:40px; padding-top:20px; border-top:1px solid #e5e7eb; text-align:center; color:#666; font-size:12px; }
          @media print { body { padding:20px; } }
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
        <div
          className="bg-white border-[3px] border-black p-8"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
        >
          <div className="animate-pulse flex space-x-4 justify-center">
            <div className="rounded-full bg-gray-200 h-12 w-12"></div>
            <div className="flex-1 space-y-4 max-w-md">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-bold uppercase">{tCommon("loading")}</p>
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
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-16 h-16 bg-red-100 border-[2px] border-black flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-black text-black mb-2 uppercase">
            {tCommon("error_occurred") || "Error"}
          </h2>
          <p className="text-gray-600 mb-6 font-bold">{error}</p>
          <button
            onClick={() => router.push("/dashboard/invoice")}
            className="inline-flex items-center bg-black text-white px-5 py-2.5 border-[2px] border-black font-black hover:bg-gray-800 transition-all uppercase"
            style={{ boxShadow: "3px 3px 0 0 #000000" }}
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
        return "bg-brutal-green text-black";
      case "REFUNDED":
        return "bg-brutal-yellow text-black";
      case "PENDING":
        return "bg-brutal-blue text-black";
      default:
        return "bg-gray-200 text-black";
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
              className="text-black hover:text-gray-700 inline-flex items-center text-xs mb-2 font-black uppercase"
            >
              <ArrowLeft className="mr-2 h-3 w-3" />
              {t("back_to_list")}
            </Link>
          </div>

          <div className="flex gap-2">
            <motion.button
              className="p-1.5 border-[2px] border-black bg-gray-100 hover:bg-gray-200 transition-colors inline-flex items-center text-black shadow-[2px_2px_0_0_#000]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={copyInvoiceId}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </motion.button>

            <motion.button
              className="p-1.5 border-[2px] border-black bg-gray-100 hover:bg-gray-200 transition-colors inline-flex items-center text-black shadow-[2px_2px_0_0_#000]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrint}
              title={t("print")}
            >
              <Printer className="h-3.5 w-3.5" />
            </motion.button>

            <motion.button
              className="p-1.5 border-[2px] border-black bg-gray-100 hover:bg-gray-200 transition-colors inline-flex items-center text-black shadow-[2px_2px_0_0_#000]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownloadCsv}
              title="Download CSV"
            >
              <Download className="h-3.5 w-3.5" />
            </motion.button>

            <motion.button
              className="px-4 py-1.5 border-[2px] border-black bg-black text-white font-black inline-flex items-center hover:bg-gray-800 text-xs uppercase"
              style={{ boxShadow: "3px 3px 0 0 #000000" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownloadPdf}
            >
              {t("download_pdf")}
            </motion.button>
          </div>
        </div>

        <div>
          <h1 className="text-xl font-black text-black relative flex items-center uppercase">
            <span className="w-1.5 h-5 bg-brutal-green mr-3"></span>
            {t("invoice_no")} {invoice.invoiceNumber}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-gray-600 text-xs font-black uppercase">{issuedDate}</p>
            <span
              className={`px-2 py-0.5 border-[2px] border-black text-[10px] font-black uppercase ${getStatusStyle(invoice.status)}`}
            >
              {getStatusLabel(invoice.status)}
            </span>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="space-y-4">
        {/* Invoice Summary Card */}
        <motion.div
          className="bg-white border-[3px] border-black overflow-hidden"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          whileHover={{ y: -2 }}
        >
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer Info */}
            <div>
              <h3 className="text-[10px] font-black text-gray-600 uppercase mb-2">
                {t("customer_info")}
              </h3>
              <p className="text-black font-black text-sm">
                {user?.username || "User"}
              </p>
              <p className="text-gray-600 text-xs font-bold">{user?.email || ""}</p>
            </div>

            {/* Payment Info */}
            <div>
              <h3 className="text-[10px] font-black text-gray-600 uppercase mb-2">
                {t("payment_info")}
              </h3>
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-brutal-blue border-[2px] border-black mt-0.5">
                  <CreditCard className="h-3.5 w-3.5 text-black" />
                </div>
                <div>
                  <p className="text-black font-black text-sm">
                    {getStatusLabel(invoice.status)}
                  </p>
                  <p className="text-gray-600 text-xs mt-1 font-black uppercase">
                    {issuedDate} {issuedTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Info */}
            <div>
              <h3 className="text-[10px] font-black text-gray-600 uppercase mb-2">
                Order Information
              </h3>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-600 text-[10px] font-black uppercase">
                    {t("order_no")}:
                  </span>
                  <Link
                    href={`/dashboard/orders/${invoice.orderId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-black hover:underline font-black flex items-center text-xs"
                  >
                    {invoice.orderNumber}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-[10px] font-black uppercase">
                    {t("invoice_no")}:
                  </span>
                  <span className="text-black text-xs font-mono font-black">
                    {invoice.invoiceNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-[10px] font-black uppercase">
                    {t("payment_status")}:
                  </span>
                  <span className="text-brutal-green font-black text-xs flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />{" "}
                    {getStatusLabel(invoice.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Invoice Items */}
        <motion.div
          className="bg-white border-[3px] border-black overflow-hidden"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          whileHover={{ y: -2 }}
        >
          <div className="p-4">
            <h3 className="text-base font-black text-black mb-3 flex items-center uppercase">
              <span className="w-1.5 h-4 bg-brutal-blue mr-2"></span>
              {t("item_details")}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-[2px] border-black">
                    <th className="text-left text-[10px] uppercase text-gray-600 font-black pb-3">
                      {t("product")}
                    </th>
                    <th className="text-center text-[10px] uppercase text-gray-600 font-black pb-3">
                      {t("quantity")}
                    </th>
                    <th className="text-right text-[10px] uppercase text-gray-600 font-black pb-3">
                      {t("price")}
                    </th>
                    <th className="text-right text-[10px] uppercase text-gray-600 font-black pb-3">
                      {t("total")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-200">
                      <td className="py-3">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-brutal-gray border-[2px] border-black flex items-center justify-center mr-3 overflow-hidden relative">
                            {getSafeImageUrl(item.imageUrl) ? (
                              <img
                                src={getSafeImageUrl(item.imageUrl)!}
                                alt={item.productName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-4 w-4 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <div className="text-black font-black text-sm">
                              {item.productName}
                            </div>
                            <div className="text-gray-600 text-[10px] font-mono font-bold uppercase">
                              ID: {item.id.slice(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-center text-gray-600 text-xs font-bold">
                        {item.quantity}
                      </td>
                      <td className="py-3 text-right text-gray-600 text-xs font-bold">
                        ฿{item.unitPrice.toFixed(2)}
                      </td>
                      <td className="py-3 text-right text-black font-black text-sm">
                        ฿{item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Invoice Summary */}
            <div className="mt-4 border-t-[2px] border-black pt-3">
              <div className="flex flex-col items-end">
                <div className="w-full max-w-xs space-y-1.5 font-black uppercase">
                  <div className="flex justify-between text-gray-600 text-xs">
                    <span>{t("subtotal")}:</span>
                    <span>฿{invoice.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-xs">
                    <span>{t("vat")}:</span>
                    <span>฿{invoice.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-black font-black border-t-[2px] border-black pt-2 mt-2 text-sm">
                    <span>{t("grand_total")}:</span>
                    <span>฿{invoice.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Notes & Info */}
        <motion.div
          className="bg-white border-[3px] border-black overflow-hidden"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          whileHover={{ y: -2 }}
        >
          <div className="p-4">
            <h3 className="text-base font-black text-black mb-3 flex items-center uppercase">
              <span className="w-1.5 h-4 bg-brutal-yellow mr-2"></span>
              Note
            </h3>
            <p className="text-gray-600 text-xs font-black leading-relaxed uppercase">
              Thank you for your purchase! This invoice is an automated document.
              If you have any questions or need assistance, please contact our customer support team.
            </p>

            <div className="mt-4 border-t-[2px] border-black pt-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-[10px] font-black uppercase">
                  Issued on {issuedDate} at {issuedTime}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer Actions */}
      <motion.div
        className="mt-6 flex flex-col sm:flex-row justify-between items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <div className="text-center sm:text-left mb-3 sm:mb-0">
          <Link
            href="/dashboard/invoice"
            className="inline-flex items-center px-3 py-1.5 border-[2px] border-black bg-gray-100 hover:bg-gray-200 transition-colors text-black text-xs font-black uppercase"
          >
            <ArrowLeft className="mr-2 h-3 w-3" />
            {t("back_to_list")}
          </Link>
        </div>
        <p className="text-gray-600 text-[10px] font-black uppercase">
          If you have any questions, please contact our support team.
        </p>
      </motion.div>
    </div>
  );
}
