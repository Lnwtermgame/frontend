"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  RefreshCcw,
  Clock,
  Download,
  ShieldCheck,
} from "lucide-react";
import { paymentApi } from "@/lib/services/payment-api";
import { orderApi } from "@/lib/services/order-api";
import { toast } from "react-hot-toast";

function PendingPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("PaymentPending");

  const orderId = searchParams.get("orderId");
  const referenceNo = searchParams.get("referenceNo");

  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "loading" | "pending" | "processing" | "completed" | "failed"
  >("loading");
  const [countdown, setCountdown] = useState(600); // 10 minutes
  const [copied, setCopied] = useState(false);

  // Read QR or Form data from sessionStorage (stored by checkout page to avoid HTTP 431)
  useEffect(() => {
    const storedQr = sessionStorage.getItem(`qr_${orderId}`);
    if (storedQr) {
      setQrUrl(storedQr);
      sessionStorage.removeItem(`qr_${orderId}`); // Clean up
    }
  }, [orderId]);

  // Prevent accidental page close while paying
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (status === "pending" || status === "processing") {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [status]);

  const checkPaymentStatus = useCallback(async () => {
    if (!orderId) return;
    try {
      const response = await paymentApi.getStatus(orderId);
      if (response.success) {
        const paymentStatus = response.data.status;
        switch (paymentStatus) {
          case "COMPLETED":
            setStatus("completed");
            toast.success(t("payment_success"));
            setTimeout(() => {
              router.push(
                `/payments/success?orderId=${orderId}&referenceNo=${referenceNo}`,
              );
            }, 1000);
            break;
          case "FAILED":
            setStatus("failed");
            toast.error(t("payment_failed"));
            break;
          case "PROCESSING":
            setStatus("processing");
            break;
          case "PENDING":
          default:
            setStatus("pending");
            break;
        }
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
    }
  }, [orderId, referenceNo, router, t]);

  // Initial load
  useEffect(() => {
    if (!orderId) {
      router.push("/games");
      return;
    }
    checkPaymentStatus();
  }, [orderId, router, checkPaymentStatus]);

  // Polling interval (every 5s)
  useEffect(() => {
    if (status === "completed" || status === "failed") return;
    const interval = setInterval(() => checkPaymentStatus(), 5000);
    return () => clearInterval(interval);
  }, [status, checkPaymentStatus]);

  // Countdown timer
  useEffect(() => {
    if (status === "completed" || status === "failed") return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Auto-cancel on timeout
          if (orderId) {
            orderApi.cancelOrder(orderId).catch((err: unknown) => {
              console.error("Failed to auto-cancel expired order:", err);
            });
          }
          setStatus("failed");
          toast.error(t("qr_expired"));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status, t, orderId]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const copyReferenceNo = () => {
    if (referenceNo) {
      navigator.clipboard.writeText(referenceNo);
      setCopied(true);
      toast.success("คัดลอกหมายเลขอ้างอิงแล้ว");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadQR = () => {
    if (!qrUrl) return;
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = `QR_Payment_${referenceNo}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!orderId) return null;

  // --- RENDERING STATES ---

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-brutal-beige flex flex-col items-center justify-center p-4">
        <Loader2 className="w-16 h-16 text-black animate-spin mb-4" />
        <h2 className="text-2xl font-bold font-display">{t("loading")}</h2>
      </div>
    );
  }

  if (status === "completed") {
    return (
      <div className="min-h-screen bg-brutal-beige flex items-center justify-center p-4">
        <div className="bg-white border-4 border-black p-10 rounded-xl shadow-[8px_8px_0_0_#000] text-center max-w-md w-full animate-in fade-in zoom-in duration-300">
          <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-6" />
          <h1 className="text-3xl font-bold mb-3 text-black font-display">
            {t("payment_success")}
          </h1>
          <p className="text-gray-600 mb-6 font-medium">{t("redirecting")}</p>
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-brutal-blue" />
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="min-h-screen bg-brutal-beige flex items-center justify-center p-4">
        <div className="bg-white border-4 border-black p-10 rounded-xl shadow-[8px_8px_0_0_#000] text-center max-w-md w-full animate-in fade-in zoom-in duration-300">
          <XCircle className="w-20 h-20 mx-auto text-red-500 mb-6" />
          <h1 className="text-3xl font-bold mb-3 font-display">
            {t("payment_failed")}
          </h1>
          <p className="text-gray-600 mb-8 font-medium">
            {countdown <= 0 ? t("qr_expired_desc") : t("payment_failed_desc")}
          </p>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => router.push("/games")}
              className="bg-black text-white px-6 py-4 rounded-lg font-bold border-2 border-black hover:bg-gray-800 transition-colors uppercase tracking-wider"
            >
              {t("try_again")}
            </button>
            <button
              onClick={() => router.push("/orders")}
              className="bg-white text-black px-6 py-4 rounded-lg font-bold border-2 border-black hover:bg-gray-50 transition-colors uppercase tracking-wider"
            >
              {t("view_orders")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- PENDING / PROCESSING (MAIN UI) ---

  const isTimeCritical = countdown < 120; // less than 2 mins

  return (
    <div className="min-h-screen bg-brutal-beige flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="max-w-4xl w-full">
        {/* Header Section */}
        <div className="text-center mb-4">
          <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-black mb-2">
            การชำระเงิน
          </h1>
          <p className="text-base text-gray-600 font-medium">
            ทำรายการให้เสร็จสิ้นภายในเวลาที่กำหนด
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white border-4 border-black rounded-xl shadow-[6px_6px_0_0_#000] overflow-hidden flex flex-col md:flex-row max-w-3xl mx-auto">

          {/* Left Column: Details & Timer */}
          <div className="p-5 md:p-6 md:w-1/2 flex flex-col justify-between border-b-4 md:border-b-0 md:border-r-4 border-black bg-gray-50/50">
            <div>
              <div className="flex items-center gap-2 mb-4 text-brutal-blue">
                <ShieldCheck className="w-5 h-5" />
                <span className="font-bold text-base">รายการที่ปลอดภัย</span>
              </div>

              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border-2 border-gray-200">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    {t("order_id")}
                  </p>
                  <p className="font-mono text-base font-semibold text-black break-all">
                    {orderId}
                  </p>
                </div>

                {referenceNo && (
                  <div className="bg-white p-4 rounded-xl border-2 border-gray-200 flex justify-between items-center group">
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        {t("reference_no")}
                      </p>
                      <p className="font-mono text-base font-semibold text-black">
                        {referenceNo}
                      </p>
                    </div>
                    <button
                      onClick={copyReferenceNo}
                      className="p-3 rounded-lg bg-gray-100 border-2 border-transparent hover:border-black transition-all text-black"
                      title="คัดลอก"
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t-2 border-dashed border-gray-300">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 text-center">
                {t("time_remaining")}
              </p>
              <div
                className={`text-4xl md:text-5xl font-black font-mono text-center transition-colors duration-300 ${isTimeCritical ? "text-red-500 animate-pulse" : "text-black"}`}
              >
                {formatCountdown(countdown)}
              </div>
            </div>
          </div>

          {/* Right Column: QR Code or Status */}
          <div className="p-5 md:p-6 md:w-1/2 flex flex-col items-center justify-center bg-white relative">

            {/* Status Indicator Bar */}
            <div className="absolute top-0 left-0 right-0 bg-blue-50 border-b-2 border-black px-3 py-2 flex items-center justify-center gap-2">
              <RefreshCcw className="w-4 h-4 text-brutal-blue animate-spin" />
              <span className="font-bold text-brutal-blue text-xs tracking-wide">
                รอการชำระเงิน... กำลังตรวจสอบ
              </span>
            </div>

            <div className="mt-8 w-full max-w-[240px] flex flex-col items-center">
              {qrUrl ? (
                <>
                  <p className="font-bold text-sm mb-4 text-center">
                    สแกน QR Code ด้วยแอปธนาคาร
                  </p>

                  <img
                    src={qrUrl}
                    alt="PromptPay QR Code"
                    className="w-full h-auto object-contain mb-4"
                  />

                  <div className="mt-4 flex items-center justify-center gap-2 w-full opacity-60">
                    <div className="h-px bg-gray-300 flex-1"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">PromptPay</span>
                    <div className="h-px bg-gray-300 flex-1"></div>
                  </div>
                </>
              ) : (
                // External redirect fallback (Rare case or direct URL redirect)
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-black">
                    <Clock className="w-10 h-10 text-black" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">
                    กำลังรอดำเนินการ...
                  </h3>
                  <p className="text-gray-500 font-medium mb-8">
                    หากไม่พบหน้าต่างชำระเงิน กรุณาตรวจสอบสถานะคำสั่งซื้อในเมนูประวัติการซื้อ
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="text-center mt-8 text-sm font-medium text-gray-500">
          มีปัญหาการชำระเงิน? <a href="#" className="underline font-bold text-black border-b border-transparent hover:border-black">ติดต่อแอดมิน</a>
        </div>
      </div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams hook
export default function PendingPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brutal-beige flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-black" />
        </div>
      }
    >
      <PendingPaymentContent />
    </Suspense>
  );
}
