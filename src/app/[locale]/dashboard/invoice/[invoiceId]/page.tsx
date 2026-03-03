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

export default function InvoiceDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isInitialized } = useAuth();
  const { settings: publicSettings } = usePublicSettings();
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const invoiceContentRef = useRef<HTMLDivElement>(null);
  const siteName = publicSettings?.general.siteName || "Lnwtermgame";

  // Copy invoice ID to clipboard
  const copyInvoiceId = () => {
    if (typeof window !== "undefined" && invoice) {
      navigator.clipboard.writeText(invoice.invoiceNumber);
      setCopied(true);
      toast.success("คัดลอกเลขที่ใบแจ้งหนี้แล้ว");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Generate printable HTML for the invoice
  const generatePrintHtml = useCallback(() => {
    if (!invoice || !user) return "";

    const issuedDate = new Date(invoice.issuedAt).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const issuedTime = new Date(invoice.issuedAt).toLocaleTimeString("th-TH");

    const statusLabel = (() => {
      switch (invoice.status) {
        case "COMPLETED":
          return "ชำระเงินแล้ว";
        case "PENDING":
          return "รอชำระเงิน";
        case "REFUNDED":
          return "คืนเงินแล้ว";
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
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;700&display=swap');
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family:'Noto Sans Thai',sans-serif; padding:40px; color:#111; font-size:14px; }
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
            <h1>ใบแจ้งหนี้</h1>
            <div class="inv-number">${invoice.invoiceNumber}</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <h3>ลูกค้า</h3>
            <p><strong>${user.username || "ผู้ใช้"}</strong></p>
            <p>${user.email || ""}</p>
          </div>
          <div class="info-box" style="text-align:right;">
            <h3>รายละเอียดใบแจ้งหนี้</h3>
            <p>เลขที่: <strong>${invoice.invoiceNumber}</strong></p>
            <p>วันที่: ${issuedDate}</p>
            <p>เวลา: ${issuedTime}</p>
            <p>คำสั่งซื้อ: ${invoice.orderNumber}</p>
            <p>สถานะ: <span class="status ${invoice.status === "COMPLETED" ? "status-completed" : "status-pending"}">${statusLabel}</span></p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>รายการ</th>
              <th>จำนวน</th>
              <th>ราคาต่อหน่วย</th>
              <th>จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-box">
            <div class="summary-row">
              <span>ยอดรวมย่อย:</span>
              <span>฿${invoice.amount.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span>ภาษีมูลค่าเพิ่ม (7%):</span>
              <span>฿${invoice.taxAmount.toFixed(2)}</span>
            </div>
            <div class="summary-row summary-total">
              <span>ยอดรวมทั้งหมด:</span>
              <span>฿${invoice.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>ขอบคุณสำหรับการสั่งซื้อ! ใบแจ้งหนี้ฉบับนี้เป็นเอกสารทางการค้าที่ออกโดยระบบอัตโนมัติ</p>
          <p style="margin-top:4px;">${siteName} — ${issuedDate}</p>
        </div>
      </body>
      </html>
    `;
  }, [invoice, user, siteName]);

  // Print invoice
  const handlePrint = () => {
    const html = generatePrintHtml();
    if (!html) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("ไม่สามารถเปิดหน้าต่างพิมพ์ได้ กรุณาอนุญาต popup");
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
      toast.error("ไม่สามารถเปิดหน้าต่างได้ กรุณาอนุญาต popup");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
    toast.success('กรุณาเลือก "Save as PDF" ในหน้าต่างพิมพ์');
  };

  // Download invoice data as CSV
  const handleDownloadCsv = () => {
    if (!invoice) return;

    const headers = ["รายการ", "จำนวน", "ราคาต่อหน่วย", "จำนวนเงิน"];
    const rows = invoice.items.map((item) => [
      item.productName,
      String(item.quantity),
      item.unitPrice.toFixed(2),
      item.total.toFixed(2),
    ]);
    rows.push([]);
    rows.push(["", "", "ยอดรวมย่อย:", invoice.amount.toFixed(2)]);
    rows.push(["", "", "ภาษีมูลค่าเพิ่ม (7%):", invoice.taxAmount.toFixed(2)]);
    rows.push(["", "", "ยอดรวมทั้งหมด:", invoice.totalAmount.toFixed(2)]);

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
    toast.success("ดาวน์โหลด CSV สำเร็จ");
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
          setError("รหัสใบแจ้งหนี้ไม่ถูกต้อง");
          return;
        }

        const response = await invoiceApi.getInvoiceById(invoiceId);

        if (response.success && response.data) {
          setInvoice(response.data);
        } else {
          setError(response.message || "ไม่พบใบแจ้งหนี้");
        }
      } catch (err: any) {
        console.error("Error fetching invoice:", err);
        setError(invoiceApi.getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId, router, user, isInitialized]);

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
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูลใบแจ้งหนี้...</p>
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
          <h2 className="text-xl font-bold text-black mb-2 thai-font">
            ข้อผิดพลาด
          </h2>
          <p className="text-gray-600 mb-6 thai-font">{error}</p>
          <button
            onClick={() => router.push("/dashboard/invoice")}
            className="inline-flex items-center bg-black text-white px-5 py-2.5 border-[2px] border-black font-bold hover:bg-gray-800 transition-all thai-font"
            style={{ boxShadow: "3px 3px 0 0 #000000" }}
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

  // Helper to get safe image URL
  const getSafeImageUrl = (url?: string | null) => {
    if (!url) return null;
    return url.replace(/`/g, "").trim();
  };

  // Format dates
  const issuedDate = new Date(invoice.issuedAt).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const issuedTime = new Date(invoice.issuedAt).toLocaleTimeString("th-TH");

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
        return "ชำระเงินแล้ว";
      case "PENDING":
        return "รอชำระเงิน";
      case "REFUNDED":
        return "คืนเงินแล้ว";
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
              className="text-black hover:text-gray-700 inline-flex items-center text-xs mb-2 thai-font font-medium"
            >
              <ArrowLeft className="mr-2 h-3 w-3" />
              กลับไปหน้าใบแจ้งหนี้
            </Link>
          </div>

          <div className="flex gap-2">
            <motion.button
              className="p-1.5 border-[2px] border-black bg-gray-100 hover:bg-gray-200 transition-colors inline-flex items-center text-black"
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
              className="p-1.5 border-[2px] border-black bg-gray-100 hover:bg-gray-200 transition-colors inline-flex items-center text-black"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrint}
              title="พิมพ์ใบแจ้งหนี้"
            >
              <Printer className="h-3.5 w-3.5" />
            </motion.button>

            <motion.button
              className="p-1.5 border-[2px] border-black bg-gray-100 hover:bg-gray-200 transition-colors inline-flex items-center text-black"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownloadCsv}
              title="ดาวน์โหลด CSV"
            >
              <Download className="h-3.5 w-3.5" />
            </motion.button>

            <motion.button
              className="px-4 py-1.5 border-[2px] border-black bg-black text-white font-bold inline-flex items-center hover:bg-gray-800 thai-font text-xs"
              style={{ boxShadow: "3px 3px 0 0 #000000" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownloadPdf}
            >
              ดาวน์โหลด PDF
            </motion.button>
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold text-black relative flex items-center thai-font">
            <span className="w-1.5 h-5 bg-brutal-green mr-3"></span>
            ใบแจ้งหนี้ #{invoice.invoiceNumber}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-gray-600 text-xs">{issuedDate}</p>
            <span
              className={`px-2 py-0.5 border-[2px] border-black text-[10px] font-bold ${getStatusStyle(invoice.status)}`}
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
              <h3 className="text-xs font-bold text-gray-600 uppercase mb-2 thai-font">
                ลูกค้า
              </h3>
              <p className="text-black font-bold text-sm">
                {user?.username || "ผู้ใช้"}
              </p>
              <p className="text-gray-600 text-xs">{user?.email || ""}</p>
            </div>

            {/* Payment Info */}
            <div>
              <h3 className="text-xs font-bold text-gray-600 uppercase mb-2 thai-font">
                รายละเอียดการชำระเงิน
              </h3>
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-brutal-blue border-[2px] border-black mt-0.5">
                  <CreditCard className="h-3.5 w-3.5 text-black" />
                </div>
                <div>
                  <p className="text-black font-bold text-sm">
                    {getStatusLabel(invoice.status)}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">
                    {issuedDate} เวลา {issuedTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Info */}
            <div>
              <h3 className="text-xs font-bold text-gray-600 uppercase mb-2 thai-font">
                ข้อมูลคำสั่งซื้อ
              </h3>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-600 text-xs thai-font">
                    อ้างอิงคำสั่งซื้อ:
                  </span>
                  <Link
                    href={`/dashboard/orders/${invoice.orderId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-black hover:underline font-medium flex items-center text-xs"
                  >
                    {invoice.orderNumber}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-xs thai-font">
                    เลขที่ใบแจ้งหนี้:
                  </span>
                  <span className="text-black text-xs font-mono">
                    {invoice.invoiceNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-xs thai-font">
                    สถานะ:
                  </span>
                  <span className="text-brutal-green font-bold text-xs flex items-center thai-font">
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
            <h3 className="text-base font-bold text-black mb-3 flex items-center thai-font">
              <span className="w-1.5 h-4 bg-brutal-blue mr-2"></span>
              รายการในใบแจ้งหนี้
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-[2px] border-black">
                    <th className="text-left text-[10px] uppercase text-gray-600 font-bold pb-3 thai-font">
                      รายการ
                    </th>
                    <th className="text-center text-[10px] uppercase text-gray-600 font-bold pb-3 thai-font">
                      จำนวน
                    </th>
                    <th className="text-right text-[10px] uppercase text-gray-600 font-bold pb-3 thai-font">
                      ราคาต่อหน่วย
                    </th>
                    <th className="text-right text-[10px] uppercase text-gray-600 font-bold pb-3 thai-font">
                      จำนวนเงิน
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
                            <div className="text-black font-bold text-sm">
                              {item.productName}
                            </div>
                            <div className="text-gray-600 text-xs font-mono">
                              {item.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-center text-gray-600 text-xs">
                        {item.quantity}
                      </td>
                      <td className="py-3 text-right text-gray-600 text-xs">
                        ฿{item.unitPrice.toFixed(2)}
                      </td>
                      <td className="py-3 text-right text-black font-bold text-sm">
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
                <div className="w-full max-w-xs space-y-1.5">
                  <div className="flex justify-between text-gray-600 text-xs">
                    <span className="thai-font">ยอดรวมย่อย:</span>
                    <span>฿{invoice.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-xs">
                    <span className="thai-font">ภาษีมูลค่าเพิ่ม (7%):</span>
                    <span>฿{invoice.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-black font-bold border-t-[2px] border-black pt-2 mt-2 text-sm">
                    <span className="thai-font">ยอดรวมทั้งหมด:</span>
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
            <h3 className="text-base font-bold text-black mb-3 flex items-center thai-font">
              <span className="w-1.5 h-4 bg-brutal-yellow mr-2"></span>
              หมายเหตุ
            </h3>
            <p className="text-gray-600 text-xs">
              ขอบคุณสำหรับการสั่งซื้อ!
              ใบแจ้งหนี้ฉบับนี้เป็นเอกสารทางการค้าที่ออกโดยระบบอัตโนมัติ
              หากมีคำถามหรือต้องการความช่วยเหลือ กรุณาติดต่อฝ่ายสนับสนุนลูกค้า
            </p>

            <div className="mt-4 border-t-[2px] border-black pt-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs thai-font">
                  ใบแจ้งหนี้สร้างเมื่อ {issuedDate} เวลา {issuedTime}
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
            className="inline-flex items-center px-3 py-1.5 border-[2px] border-black bg-gray-100 hover:bg-gray-200 transition-colors text-black thai-font text-xs"
          >
            <ArrowLeft className="mr-2 h-3 w-3" />
            กลับไปหน้าใบแจ้งหนี้
          </Link>
        </div>
        <p className="text-gray-600 text-xs thai-font">
          หากคุณมีคำถามใดๆ โปรดติดต่อทีมสนับสนุนของเรา
        </p>
      </motion.div>
    </div>
  );
}
