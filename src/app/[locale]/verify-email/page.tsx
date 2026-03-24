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
import { useTranslations } from "next-intl";

type VerificationStatus =
  | "loading"
  | "success"
  | "already_verified"
  | "expired"
  | "invalid_token"
  | "invalid_link"
  | "error";

function VerifyEmailContent() {
  const t = useTranslations("Verification.verify_email");
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
      setMessage(t("invalid_link_desc"));
      return;
    }

    verifyEmail();
  }, [token, email, t]);

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
          setMessage(t("already_verified_title"));
        } else {
          setStatus("success");
          setMessage(response.data?.message || t("success_title"));
          toast.success(t("success_title"));
        }
      } else {
        setStatus("error");
        setMessage(response.message || t("error_title"));
      }
    } catch (error: any) {
      const errorMessage = authApi.getErrorMessage(error);

      // Classify error types based on message
      if (
        errorMessage.includes("expired") ||
        errorMessage.includes("หมดอายุ")
      ) {
        setStatus("expired");
        setMessage(t("expired_title"));
      } else if (
        errorMessage.includes("Invalid verification token") ||
        errorMessage.includes("token") ||
        errorMessage.includes("ไม่ถูกต้อง")
      ) {
        setStatus("invalid_token");
        setMessage(t("invalid_token_title"));
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
        toast.success(t("resend_success"));
      } else {
        toast.error(response.message || t("error_title"));
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
      icon: <Loader2 size={40} className="animate-spin text-site-accent" />,
      title: t("loading"),
      message: t("loading_desc"),
      bgColor: "bg-site-accent/10 border-site-accent/20",
      textColor: "text-white",
    },
    success: {
      icon: <CheckCircle size={40} className="text-green-500" />,
      title: t("success_title"),
      message: message,
      bgColor: "bg-green-500/10 border-green-500/30/20",
      textColor: "text-white",
      showCountdown: true,
    },
    already_verified: {
      icon: <CheckCircle size={40} className="text-blue-500" />,
      title: t("already_verified_title"),
      message: message || t("already_verified_title"),
      bgColor: "bg-blue-500/10 border-blue-500/20",
      textColor: "text-white",
      showCountdown: true,
    },
    expired: {
      icon: <Clock size={40} className="text-red-500" />,
      title: t("expired_title"),
      message: message || t("expired_title"),
      bgColor: "bg-red-500/10 border-red-500/30/20",
      textColor: "text-white",
      showResend: true,
    },
    invalid_token: {
      icon: <AlertTriangle size={40} className="text-red-500" />,
      title: t("invalid_token_title"),
      message: message || t("invalid_token_title"),
      bgColor: "bg-red-500/10 border-red-500/30/20",
      textColor: "text-white",
      showResend: true,
    },
    invalid_link: {
      icon: <XCircle size={40} className="text-red-500" />,
      title: t("invalid_link_title"),
      message: message || t("invalid_link_title"),
      bgColor: "bg-red-500/10 border-red-500/30/20",
      textColor: "text-white",
    },
    error: {
      icon: <XCircle size={40} className="text-red-500" />,
      title: t("error_title"),
      message: message || t("error_title"),
      bgColor: "bg-red-500/10 border-red-500/30/20",
      textColor: "text-white",
    },
  };

  const currentStatus = statusConfig[status];
  const showResendButton = ["expired", "invalid_token", "error"].includes(
    status,
  );
  const showCountdown = ["success", "already_verified"].includes(status);

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-[#222427] border border-site-border shadow-ocean rounded-2xl overflow-hidden relative">
          {/* Header */}
          <div className="bg-[#1A1C1E] border-b border-site-border p-6 relative">
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-site-accent/10 border border-site-accent/20 flex items-center justify-center shrink-0 shadow-sm">
                <Mail size={24} className="text-site-accent" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight mb-1">
                  {t("title")}
                </h1>
                <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Email Verification</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 relative z-10">
            <div className="text-center">
              {/* Icon */}
              <div
                className={`w-20 h-20 ${currentStatus.bgColor} border rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm`}
              >
                {currentStatus.icon}
              </div>

              {/* Title */}
              <h2
                className={`text-xl font-bold ${currentStatus.textColor} mb-3 tracking-tight`}
              >
                {currentStatus.title}
              </h2>

              {/* Message */}
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                {currentStatus.message}
              </p>

              {/* Email display */}
              {email && status !== "loading" && (
                <div className="mb-6">
                  <span className="font-mono text-sm bg-[#1A1C1E] text-site-accent px-4 py-2 border border-site-border rounded-lg inline-block break-all">
                    {decodeURIComponent(email)}
                  </span>
                </div>
              )}

              {/* Countdown for success states */}
              {showCountdown && (
                <p className="text-xs text-gray-500 mb-6 font-medium">
                  {t("redirect_hint", { seconds: countdown })}
                </p>
              )}

              {/* Resend success message */}
              {resendSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30/20"
                >
                  <p className="text-sm font-medium text-green-500">
                    {t("resend_success")}
                  </p>
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3 mt-4">
                {status === "success" && (
                  <Link
                    href="/dashboard/account"
                    className="inline-flex items-center justify-center gap-2 w-full bg-site-accent text-[#1A1C1E] px-6 py-3 border border-transparent rounded-lg font-bold hover:bg-site-accent hover:scale-[1.02] shadow-accent-glow transition-all"
                  >
                    {t("go_to_account")}
                    <ArrowRight size={18} />
                  </Link>
                )}

                {status === "already_verified" && (
                  <Link
                    href="/dashboard/account"
                    className="inline-flex items-center justify-center gap-2 w-full bg-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-600 hover:scale-[1.02] transition-all shadow-sm"
                  >
                    {t("go_to_account")}
                    <ArrowRight size={18} />
                  </Link>
                )}

                {showResendButton && (
                  <>
                    <button
                      onClick={handleResend}
                      disabled={isResending || resendSuccess}
                      className="inline-flex items-center justify-center gap-2 w-full bg-[#1A1C1E] text-white px-6 py-3 border border-site-border rounded-lg font-bold hover:bg-[#212328]/5 hover:border-site-accent/50 transition-all shadow-sm disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-[#1A1C1E] disabled:hover:border-site-border"
                    >
                      {isResending ? (
                        <>
                          <Loader2 size={18} className="animate-spin text-site-accent" />
                          <span className="text-gray-300">{t("sending")}</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw size={18} className="text-site-accent" />
                          {t("resend_button")}
                        </>
                      )}
                    </button>

                    <p className="text-xs text-gray-500 mt-2">
                      {t("spam_hint")}
                    </p>
                  </>
                )}

                {status === "invalid_link" && (
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 w-full bg-[#1A1C1E] text-white px-6 py-3 border border-site-border rounded-lg font-bold hover:bg-[#212328]/5 hover:border-site-accent/50 transition-all shadow-sm"
                  >
                    {t("go_to_login")}
                    <ArrowRight size={18} className="text-site-accent" />
                  </Link>
                )}

                {status === "error" && !showResendButton && (
                  <Link
                    href="/support"
                    className="inline-flex items-center justify-center gap-2 w-full bg-[#1A1C1E] text-white px-6 py-3 border border-site-border rounded-lg font-bold hover:bg-[#212328]/5 hover:border-site-accent/50 transition-all shadow-sm"
                  >
                    {t("contact_support")}
                  </Link>
                )}

                {/* Always show login link for error states */}
                {["expired", "invalid_token", "error"].includes(status) && (
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 w-full mt-2 text-sm text-gray-400 hover:text-white font-medium transition-colors hover:bg-[#212328]/5 py-2 px-4 rounded-lg"
                  >
                    {t("back_to_login")}
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
  const t = useTranslations("Common");
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] bg-transparent flex items-center justify-center">
          <div className="text-center">
            <Loader2
              size={40}
              className="animate-spin mx-auto mb-4 text-site-accent"
            />
            <p className="text-gray-400 font-medium text-sm">{t("loading")}</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
