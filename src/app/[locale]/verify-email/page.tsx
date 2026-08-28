"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
      icon: <Loader2 size={32} className="animate-spin text-site-accent" />,
      title: t("loading"),
      message: t("loading_desc"),
      iconBg: "bg-site-accent/10 border-site-accent/20",
    },
    success: {
      icon: <CheckCircle size={32} className="text-status-success" />,
      title: t("success_title"),
      message: message,
      iconBg: "bg-status-success/10 border-status-success/20",
      showCountdown: true,
    },
    already_verified: {
      icon: <CheckCircle size={32} className="text-semantic-blue" />,
      title: t("already_verified_title"),
      message: message || t("already_verified_title"),
      iconBg: "bg-semantic-blue/10 border-semantic-blue/20",
      showCountdown: true,
    },
    expired: {
      icon: <Clock size={32} className="text-status-danger" />,
      title: t("expired_title"),
      message: message || t("expired_title"),
      iconBg: "bg-status-danger/10 border-status-danger/20",
      showResend: true,
    },
    invalid_token: {
      icon: <AlertTriangle size={32} className="text-status-danger" />,
      title: t("invalid_token_title"),
      message: message || t("invalid_token_title"),
      iconBg: "bg-status-danger/10 border-status-danger/20",
      showResend: true,
    },
    invalid_link: {
      icon: <XCircle size={32} className="text-status-danger" />,
      title: t("invalid_link_title"),
      message: message || t("invalid_link_title"),
      iconBg: "bg-status-danger/10 border-status-danger/20",
    },
    error: {
      icon: <XCircle size={32} className="text-status-danger" />,
      title: t("error_title"),
      message: message || t("error_title"),
      iconBg: "bg-status-danger/10 border-status-danger/20",
    },
  };

  const currentStatus = statusConfig[status];
  const showResendButton = ["expired", "invalid_token", "error"].includes(
    status,
  );
  const showCountdown = ["success", "already_verified"].includes(status);

  return (
    <div className="flex min-h-screen items-center justify-center bg-site-bg p-4">
      <div className="w-full max-w-[400px] mx-auto">
        <div className="site-card p-6">
          {/* Header */}
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-6 bg-site-accent/10 border border-site-accent/20">
              <Mail size={20} className="text-site-accent" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-site-text">
                {t("title")}
              </h1>
              <p className="text-[12px] text-site-muted uppercase tracking-wider">Email Verification</p>
            </div>
          </div>

          <div className="text-center">
            {/* Icon */}
            <div
              className={`w-16 h-16 ${currentStatus.iconBg} border rounded-8 flex items-center justify-center mx-auto mb-5`}
            >
              {currentStatus.icon}
            </div>

            {/* Title */}
            <h2 className="text-lg font-bold text-site-text mb-2">
              {currentStatus.title}
            </h2>

            {/* Message */}
            <p className="text-sm text-site-muted mb-5 leading-relaxed">
              {currentStatus.message}
            </p>

            {/* Email display */}
            {email && status !== "loading" && (
              <div className="mb-5">
                <span className="font-mono text-xs bg-site-bg text-site-accent px-3 py-1.5 border border-site-border-soft rounded-6 inline-block break-all">
                  {decodeURIComponent(email)}
                </span>
              </div>
            )}

            {/* Countdown for success states */}
            {showCountdown && (
              <p className="text-[12px] text-site-dim mb-5 font-medium">
                {t("redirect_hint", { seconds: countdown })}
              </p>
            )}

            {/* Resend success message */}
            {resendSuccess && (
              <div className="mb-5 p-3 rounded-6 bg-status-success/10 border border-status-success/20">
                <p className="text-xs font-semibold text-status-success">
                  {t("resend_success")}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 mt-4">
              {status === "success" && (
                <Link
                  href="/dashboard/account"
                  className="site-btn w-full inline-flex"
                >
                  {t("go_to_account")}
                  <ArrowRight size={16} />
                </Link>
              )}

              {status === "already_verified" && (
                <Link
                  href="/dashboard/account"
                  className="site-btn w-full inline-flex"
                >
                  {t("go_to_account")}
                  <ArrowRight size={16} />
                </Link>
              )}

              {showResendButton && (
                <>
                  <button
                    onClick={handleResend}
                    disabled={isResending || resendSuccess}
                    className="w-full border border-site-border-soft bg-site-surface hover:border-site-border rounded-6 py-2.5 text-[13px] text-site-text transition-colors flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
                  >
                    {isResending ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-site-accent" />
                        <span className="text-site-muted">{t("sending")}</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw size={16} className="text-site-accent" />
                        {t("resend_button")}
                      </>
                    )}
                  </button>

                  <p className="text-[12px] text-site-dim mt-1">
                    {t("spam_hint")}
                  </p>
                </>
              )}

              {status === "invalid_link" && (
                <Link
                  href="/login"
                  className="site-btn w-full inline-flex"
                >
                  {t("go_to_login")}
                  <ArrowRight size={16} className="text-site-accent" />
                </Link>
              )}

              {status === "error" && !showResendButton && (
                <Link
                  href="/support"
                  className="w-full border border-site-border-soft bg-site-surface hover:border-site-border rounded-6 py-2.5 text-[13px] text-site-text transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  {t("contact_support")}
                </Link>
              )}

              {/* Always show login link for error states */}
              {["expired", "invalid_token", "error"].includes(status) && (
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 w-full mt-1 text-[12px] text-site-muted hover:text-site-accent font-medium transition-colors"
                >
                  {t("back_to_login")}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main page with suspense boundary
export default function VerifyEmailPage() {
  const t = useTranslations("Common");
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center bg-site-bg">
          <div className="text-center">
            <Loader2
              size={40}
              className="animate-spin mx-auto mb-4 text-site-accent"
            />
            <p className="text-site-muted font-medium text-sm">{t("loading")}</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
