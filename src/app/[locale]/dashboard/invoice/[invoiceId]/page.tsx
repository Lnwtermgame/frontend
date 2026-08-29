"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { usePublicSettings } from "@/lib/context/public-settings-context";
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
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

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
      <div className="page-container">
        <div className="site-card p-12 text-center">
          <div className="flex flex-col items-center">
            <Skeleton className="w-12 h-12 rounded-full mb-6" />
            <div className="space-y-4 w-full max-w-sm">
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6 mx-auto" />
            </div>
          </div>
          <p className="mt-8 text-site-muted font-medium">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="page-container">
        <div className="site-card p-8 text-center">
          <div className="w-16 h-16 bg-status-danger/10 border border-status-danger/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-status-danger" />
          </div>
          <h2 className="text-xl font-bold text-site-text mb-2">
            {tCommon("error_occurred") || "Error"}
          </h2>
          <p className="text-site-muted mb-8">{error}</p>
          <button
            onClick={() => router.push("/dashboard/invoice")}
            className="inline-flex items-center px-6 py-2.5 rounded-6 border border-site-border-soft bg-site-surface text-site-text hover:text-site-accent hover:border-site-accent transition-colors font-medium"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("back_to_list")}
          </button>
        </div>
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

  // Status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "Paid":
        return <Badge variant="success">{t("paid")}</Badge>;
      case "REFUNDED":
        return <Badge variant="danger">Refunded</Badge>;
      case "PENDING":
        return <Badge variant="warning">{t("unpaid")}</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
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
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-start mb-4 gap-4">
          <div>
            <Link
              href="/dashboard/invoice"
              className="text-site-muted hover:text-site-accent inline-flex items-center text-sm mb-4 font-medium transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("back_to_list")}
            </Link>
          </div>

          <div className="flex gap-2">
            <button
              className="p-2 rounded-6 border border-site-border-soft bg-site-surface hover:bg-site-raised hover:border-site-accent transition-colors inline-flex items-center text-site-muted hover:text-site-accent"
              onClick={copyInvoiceId}
              title={copied ? "Copied" : "Copy Invoice ID"}
            >
              {copied ? (
                <Check className="h-4 w-4 text-site-accent" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>

            <button
              className="p-2 rounded-6 border border-site-border-soft bg-site-surface hover:bg-site-raised hover:border-site-accent transition-colors inline-flex items-center text-site-muted hover:text-site-accent"
              onClick={handlePrint}
              title={t("print")}
            >
              <Printer className="h-4 w-4" />
            </button>

            <button
              className="p-2 rounded-6 border border-site-border-soft bg-site-surface hover:bg-site-raised hover:border-site-accent transition-colors inline-flex items-center text-site-muted hover:text-site-accent"
              onClick={handleDownloadCsv}
              title="Download CSV"
            >
              <Download className="h-4 w-4" />
            </button>

            <button
              className="px-4 py-2 rounded-6 bg-site-accent hover:bg-site-accent-hover text-site-bg font-semibold inline-flex items-center transition-colors text-sm"
              onClick={handleDownloadPdf}
            >
              {t("download_pdf")}
            </button>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-site-text flex items-center">
            <span className="w-1.5 h-6 bg-site-accent mr-3 rounded-full"></span>
            {t("invoice_no")} {invoice.invoiceNumber}
          </h1>
          <div className="flex items-center gap-3 mt-3 ml-4 pl-3.5 border-l-2 border-site-border-soft">
            <p className="text-site-muted text-sm font-medium">{issuedDate}</p>
            {getStatusBadge(invoice.status)}
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="space-y-6">
        {/* Invoice Summary Card */}
        <div className="site-card overflow-hidden">
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Customer Info */}
            <div>
              <h3 className="text-[11px] uppercase font-bold text-site-dim tracking-wider mb-3">
                {t("customer_info")}
              </h3>
              <p className="text-site-text font-medium text-base mb-1">
                {user?.username || "User"}
              </p>
              <p className="text-site-muted text-sm">{user?.email || ""}</p>
            </div>

            {/* Payment Info */}
            <div>
              <h3 className="text-[11px] uppercase font-bold text-site-dim tracking-wider mb-3">
                {t("payment_info")}
              </h3>
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-site-surface border border-site-border-soft rounded-6 text-site-accent">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-site-text font-medium text-base">
                      {getStatusLabel(invoice.status)}
                    </p>
                    {invoice.status === "COMPLETED" && (
                      <CheckCircle className="h-4 w-4 text-status-success" />
                    )}
                  </div>
                  <p className="text-site-muted text-sm mt-1 font-mono">
                    {issuedDate} • {issuedTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Info */}
            <div>
              <h3 className="text-[11px] uppercase font-bold text-site-dim tracking-wider mb-3">
                Order Information
              </h3>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center bg-site-surface p-2 rounded-6 border border-site-border-soft">
                  <span className="text-site-muted text-xs font-medium uppercase tracking-wide">
                    {t("order_no")}
                  </span>
                  <Link
                    href={`/dashboard/orders/${invoice.orderId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-site-accent hover:text-site-text transition-colors font-mono text-xs flex items-center gap-1.5"
                  >
                    {invoice.orderNumber}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <div className="flex justify-between items-center bg-site-surface p-2 rounded-6 border border-site-border-soft">
                  <span className="text-site-muted text-xs font-medium uppercase tracking-wide">
                    {t("invoice_no")}
                  </span>
                  <span className="text-site-text text-xs font-mono font-medium">
                    {invoice.invoiceNumber}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="site-card overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-bold text-site-text mb-6 flex items-center">
              <span className="w-1.5 h-5 bg-site-accent mr-3 rounded-full"></span>
              {t("item_details")}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-site-border-soft bg-site-raised">
                    <th className="text-left text-[11px] uppercase tracking-wider text-site-dim font-bold py-4 px-4">
                      {t("product")}
                    </th>
                    <th className="text-center text-[11px] uppercase tracking-wider text-site-dim font-bold py-4 px-4">
                      {t("quantity")}
                    </th>
                    <th className="text-right text-[11px] uppercase tracking-wider text-site-dim font-bold py-4 px-4">
                      {t("price")}
                    </th>
                    <th className="text-right text-[11px] uppercase tracking-wider text-site-dim font-bold py-4 px-4">
                      {t("total")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-b border-site-border-soft last:border-b-0 hover:bg-site-raised transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-6 bg-site-surface border border-site-border-soft flex items-center justify-center shrink-0 overflow-hidden relative">
                            {getSafeImageUrl(item.imageUrl) ? (
                              <img
                                src={getSafeImageUrl(item.imageUrl)!}
                                alt={item.productName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-5 w-5 text-site-dim" />
                            )}
                          </div>
                          <div>
                            <div className="text-site-text font-medium text-sm mb-1">
                              {item.productName}
                            </div>
                            <div className="inline-flex items-center px-2 py-0.5 rounded-4 bg-site-surface border border-site-border-soft text-site-muted text-[10px] font-mono">
                              ID: {item.id.slice(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center text-site-text text-sm font-medium">
                        {item.quantity}
                      </td>
                      <td className="py-4 px-4 text-right text-site-muted text-sm">
                        ฿{item.unitPrice.toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-site-text text-base">
                        ฿{item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Invoice Summary */}
            <div className="mt-8 pt-6 border-t border-site-border-soft">
              <div className="flex flex-col items-end">
                <div className="w-full max-w-sm space-y-3 bg-site-surface p-5 rounded-8 border border-site-border-soft">
                  <div className="flex justify-between items-center text-site-muted text-sm">
                    <span>{t("subtotal")}:</span>
                    <span className="font-mono">฿{invoice.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-site-muted text-sm border-b border-site-border-soft pb-3">
                    <span>{t("vat")}:</span>
                    <span className="font-mono">฿{invoice.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-site-text font-semibold">{t("grand_total")}:</span>
                    <span className="text-xl font-bold text-site-accent">฿{invoice.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes & Info */}
        <div className="site-card overflow-hidden">
          <div className="p-6">
            <h3 className="text-sm font-semibold text-site-text mb-4 flex items-center">
              <span className="w-1.5 h-4 bg-status-warning mr-3 rounded-full"></span>
              Note
            </h3>
            <p className="text-site-muted text-sm leading-relaxed">
              Thank you for your purchase! This invoice is an automated document.
              If you have any questions or need assistance, please contact our customer support team.
            </p>

            <div className="mt-6 pt-4 border-t border-site-border-soft">
              <div className="flex items-center gap-2 text-site-dim bg-site-surface w-fit px-3 py-1.5 rounded-6 border border-site-border-soft font-mono text-xs">
                <Clock className="h-4 w-4 text-site-accent" />
                <span>
                  Issued on {issuedDate} at {issuedTime}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <Link
          href="/dashboard/invoice"
          className="inline-flex items-center px-4 py-2 rounded-6 border border-site-border-soft bg-site-surface hover:bg-site-raised hover:text-site-accent transition-colors text-site-text text-sm font-medium w-full sm:w-auto justify-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("back_to_list")}
        </Link>
        <p className="text-site-dim text-xs text-center sm:text-right">
          If you have any questions, please contact our support team.
        </p>
      </div>
    </div>
  );
}
