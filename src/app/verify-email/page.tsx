"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Mail,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Clock,
} from "lucide-react";
import { authApi } from "@/lib/services/auth-api";
import toast from "react-hot-toast";

type VerificationStatus =
  | "loading"
  | "success"
  | "already_verified"
  | "expired"
  | "invalid_token"
  | "invalid_link"
  | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [message, setMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!token || !email) {
      setStatus("invalid_link");
      setMessage("ลิงก์ยืนยันไม่ถูกต้อง กรุณาตรวจสอบลิงก์ในอีเมลอีกครั้ง");
      return;
    }

    verifyEmail();
  }, [token, email]);

  // Auto redirect after success
  useEffect(() => {
    if (
      (status === "success" || status === "already_verified") &&
      countdown > 0
    ) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (
      (status === "success" || status === "already_verified") &&
      countdown === 0
    ) {
      window.location.href = "/dashboard/account";
    }
  }, [status, countdown]);

  const verifyEmail = async () => {
    try {
      const response = await authApi.verifyEmail(email!, token!);

      if (response.success) {
        // Check if already verified
        if (response.data?.message?.includes("already verified")) {
          setStatus("already_verified");
          setMessage("อีเมลนี้ได้รับการยืนยันแล้ว");
        } else {
          setStatus("success");
          setMessage(response.data?.message || "ยืนยันอีเมลสำเร็จ!");
          toast.success("ยืนยันอีเมลสำเร็จ!");
        }
      } else {
        setStatus("error");
        setMessage(response.message || "ไม่สามารถยืนยันอีเมลได้");
      }
    } catch (error: any) {
      const errorMessage = authApi.getErrorMessage(error);

      // Classify error types based on message
      if (
        errorMessage.includes("expired") ||
        errorMessage.includes("หมดอายุ")
      ) {
        setStatus("expired");
        setMessage("ลิงก์ยืนยันอีเมลหมดอายุแล้ว");
      } else if (
        errorMessage.includes("Invalid verification token") ||
        errorMessage.includes("token") ||
        errorMessage.includes("ไม่ถูกต้อง")
      ) {
        setStatus("invalid_token");
        setMessage("รหัสยืนยันไม่ถูกต้อง");
      } else {
        setStatus("error");
        setMessage(errorMessage);
      }
    }
  };

  const handleResend = async () => {
    if (!email) return;

    setIsResending(true);
    try {
      const response = await authApi.resendVerificationEmail(email);
      if (response.success) {
        setResendSuccess(true);
        toast.success("ส่งอีเมลยืนยันใหม่แล้ว กรุณาตรวจสอบกล่องจดหมาย");
      } else {
        toast.error(response.message || "ไม่สามารถส่งอีเมลได้");
      }
    } catch (error: any) {
      toast.error(authApi.getErrorMessage(error));
    } finally {
      setIsResending(false);
    }
  };

  // Status configurations for different states
  const statusConfig = {
    loading: {
      icon: <Loader2 size={48} className="animate-spin text-brutal-blue" />,
      title: "กำลังยืนยัน...",
      message: "กำลังยืนยันอีเมลของคุณ...",
      bgColor: "bg-gray-100",
      textColor: "text-gray-600",
    },
    success: {
      icon: <CheckCircle size={48} className="text-black" />,
      title: "ยืนยันอีเมลสำเร็จ!",
      message: message,
      bgColor: "bg-brutal-green",
      textColor: "text-black",
      showCountdown: true,
    },
    already_verified: {
      icon: <CheckCircle size={48} className="text-black" />,
      title: "อีเมลได้รับการยืนยันแล้ว",
      message: message || "อีเมลนี้ได้รับการยืนยันแล้ว",
      bgColor: "bg-brutal-yellow",
      textColor: "text-black",
      showCountdown: true,
    },
    expired: {
      icon: <Clock size={48} className="text-black" />,
      title: "ลิงก์หมดอายุ",
      message: message || "ลิงก์ยืนยันอีเมลหมดอายุแล้ว",
      bgColor: "bg-brutal-pink",
      textColor: "text-black",
      showResend: true,
    },
    invalid_token: {
      icon: <AlertTriangle size={48} className="text-black" />,
      title: "รหัสยืนยันไม่ถูกต้อง",
      message: message || "รหัสยืนยันไม่ถูกต้อง กรุณาขอลิงก์ใหม่",
      bgColor: "bg-brutal-pink",
      textColor: "text-black",
      showResend: true,
    },
    invalid_link: {
      icon: <XCircle size={48} className="text-black" />,
      title: "ลิงก์ไม่ถูกต้อง",
      message: message || "ลิงก์ยืนยันไม่ถูกต้อง",
      bgColor: "bg-brutal-pink",
      textColor: "text-black",
    },
    error: {
      icon: <XCircle size={48} className="text-black" />,
      title: "เกิดข้อผิดพลาด",
      message: message || "ไม่สามารถยืนยันอีเมลได้",
      bgColor: "bg-brutal-pink",
      textColor: "text-black",
    },
  };

  const currentStatus = statusConfig[status];
  const showResendButton = ["expired", "invalid_token", "error"].includes(
    status,
  );
  const showCountdown = ["success", "already_verified"].includes(status);

  return (
    <div className="min-h-screen bg-brutal-gray flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white border-[3px] border-black shadow-[8px_8px_0_0_#000]">
          {/* Header */}
          <div className="bg-brutal-yellow border-b-[3px] border-black p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-black border-[3px] border-black flex items-center justify-center">
                <Mail size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-black thai-font">
                  ยืนยันอีเมล
                </h1>
                <p className="text-sm text-gray-700">Email Verification</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-center py-4">
              {/* Icon */}
              <div
                className={`w-20 h-20 ${currentStatus.bgColor} border-[3px] border-black flex items-center justify-center mx-auto mb-4`}
              >
                {currentStatus.icon}
              </div>

              {/* Title */}
              <h2
                className={`text-lg font-bold ${currentStatus.textColor} mb-2 thai-font`}
              >
                {currentStatus.title}
              </h2>

              {/* Message */}
              <p className="text-gray-600 mb-4 thai-font">
                {currentStatus.message}
              </p>

              {/* Email display */}
              {email && status !== "loading" && (
                <p className="text-sm text-gray-500 mb-4 font-mono bg-gray-100 p-2 border border-gray-300">
                  {decodeURIComponent(email)}
                </p>
              )}

              {/* Countdown for success states */}
              {showCountdown && (
                <p className="text-sm text-gray-500 mb-4">
                  กำลังนำคุณไปยังหน้าบัญชีใน {countdown} วินาที...
                </p>
              )}

              {/* Resend success message */}
              {resendSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-brutal-green border-[2px] border-black"
                >
                  <p className="text-sm text-black thai-font">
                    ส่งอีเมลยืนยันใหม่แล้ว! กรุณาตรวจสอบกล่องจดหมาย
                  </p>
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3">
                {status === "success" && (
                  <Link
                    href="/dashboard/account"
                    className="inline-flex items-center justify-center gap-2 bg-brutal-blue text-white px-6 py-3 border-[3px] border-black font-bold hover:bg-black transition-colors thai-font"
                  >
                    ไปยังบัญชีของฉัน
                    <ArrowRight size={18} />
                  </Link>
                )}

                {status === "already_verified" && (
                  <Link
                    href="/dashboard/account"
                    className="inline-flex items-center justify-center gap-2 bg-brutal-yellow text-black px-6 py-3 border-[3px] border-black font-bold hover:bg-black hover:text-white transition-colors thai-font"
                  >
                    ไปยังบัญชีของฉัน
                    <ArrowRight size={18} />
                  </Link>
                )}

                {showResendButton && (
                  <>
                    <button
                      onClick={handleResend}
                      disabled={isResending || resendSuccess}
                      className="inline-flex items-center justify-center gap-2 bg-brutal-yellow text-black px-6 py-3 border-[3px] border-black font-bold hover:bg-brutal-blue hover:text-white transition-colors thai-font disabled:opacity-50"
                    >
                      {isResending ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          กำลังส่ง...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={18} />
                          ส่งอีเมลยืนยันใหม่
                        </>
                      )}
                    </button>

                    <p className="text-xs text-gray-500 thai-font">
                      หากไม่ได้รับอีเมล กรุณาตรวจสอบในโฟลเดอร์ Spam
                    </p>
                  </>
                )}

                {status === "invalid_link" && (
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 bg-brutal-blue text-white px-6 py-3 border-[3px] border-black font-bold hover:bg-black transition-colors thai-font"
                  >
                    ไปยังหน้าเข้าสู่ระบบ
                    <ArrowRight size={18} />
                  </Link>
                )}

                {status === "error" && !showResendButton && (
                  <Link
                    href="/support"
                    className="inline-flex items-center justify-center gap-2 bg-gray-200 text-black px-6 py-3 border-[3px] border-black font-bold hover:bg-gray-300 transition-colors thai-font"
                  >
                    ติดต่อฝ่ายสนับสนุน
                  </Link>
                )}

                {/* Always show login link for error states */}
                {["expired", "invalid_token", "error"].includes(status) && (
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 border-[2px] border-gray-300 font-bold hover:bg-gray-200 transition-colors thai-font"
                  >
                    กลับไปหน้าเข้าสู่ระบบ
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Main page with suspense boundary
export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brutal-gray flex items-center justify-center">
          <div className="text-center">
            <Loader2
              size={48}
              className="animate-spin mx-auto mb-4 text-brutal-blue"
            />
            <p className="text-gray-600 thai-font">กำลังโหลด...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
