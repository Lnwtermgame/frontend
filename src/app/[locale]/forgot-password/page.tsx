"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import {
  Mail,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Send,
} from "lucide-react";
import { authApi } from "@/lib/services/auth-api";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";

function ForgotPasswordContent() {
  const t = useTranslations("Verification.forgot_password");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      toast.error(t("error_invalid_email"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authApi.requestPasswordReset(email);

      if (response.success) {
        setIsSuccess(true);
        toast.success(t("success_title"));
      } else {
        toast.error(response.message || t("error_send_failed"));
      }
    } catch (error: any) {
      toast.error(authApi.getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-site-bg px-4 py-12">
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
              <p className="text-[12px] text-site-muted uppercase tracking-wider">Reset Password</p>
            </div>
          </div>

          {!isSuccess ? (
            <>
              <p className="text-sm text-site-muted mb-5 leading-relaxed">
                {t("subtitle")}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  id="email"
                  type="email"
                  label={t("email_placeholder")}
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  icon={<Mail className="h-4 w-4" />}
                  autoComplete="email"
                />

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                >
                  {!isSubmitting && (
                    <div className="flex items-center justify-center">
                      <Send className="mr-2 h-4 w-4" />
                      {t("send_link")}
                    </div>
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-8 bg-status-success/10 border border-status-success/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-status-success" />
              </div>
              <h2 className="text-lg font-bold text-site-text mb-2">
                {t("success_title")}
              </h2>
              <p className="text-sm text-site-muted mb-4 leading-relaxed">
                {t("success_desc")}
                <br className="mb-2" />
                <span className="font-mono text-xs bg-site-bg text-site-accent px-3 py-1.5 border border-site-border-soft rounded-6 inline-block mt-2">
                  {email}
                </span>
              </p>
              <p className="text-[12px] text-site-dim mb-6 max-w-[280px] mx-auto">
                {t("spam_hint")}
              </p>

              <button
                onClick={() => {
                  setIsSuccess(false);
                  setEmail("");
                }}
                className="text-site-accent hover:text-site-accent-hover font-semibold transition-colors text-sm hover:underline underline-offset-4"
              >
                {t("resend_email")}
              </button>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-site-border-soft flex justify-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-[12px] text-site-muted hover:text-site-accent font-medium transition-colors"
            >
              <ArrowLeft size={14} />
              {t("back_to_login")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
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
      <ForgotPasswordContent />
    </Suspense>
  );
}
