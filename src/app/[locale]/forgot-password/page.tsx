"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";
import {
  Mail,
  ArrowLeft,
  ArrowRight,
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
    <div className="min-h-screen bg-transparent flex items-center justify-center px-4 py-12">
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
                <h1 className="text-xl font-bold text-white mb-1 tracking-tight">
                  {t("title")}
                </h1>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Reset Password</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 relative z-10">
            {!isSuccess ? (
              <>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                  {t("subtitle")}
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <Input
                    id="email"
                    type="email"
                    label={t("email_placeholder")}
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                    icon={<Mail className="h-5 w-5" />}
                    autoComplete="email"
                  />

                  <Button
                    type="submit"
                    className="w-full bg-site-accent text-[#1A1C1E] hover:bg-site-accent hover:text-[#16181A] hover:scale-[1.02] active:scale-[0.98] border border-transparent hover:shadow-accent-glow font-bold"
                    disabled={isSubmitting}
                    isLoading={isSubmitting}
                    size="lg"
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
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/30/20 flex items-center justify-center mx-auto mb-5 shadow-sm">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
                  {t("success_title")}
                </h2>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                  {t("success_desc")}
                  <br className="mb-2" />
                  <span className="font-mono text-xs bg-[#1A1C1E] text-site-accent px-3 py-1.5 border border-site-border rounded-lg inline-block mt-2">
                    {email}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mb-8 max-w-[280px] mx-auto">
                  {t("spam_hint")}
                </p>

                <button
                  onClick={() => {
                    setIsSuccess(false);
                    setEmail("");
                  }}
                  className="text-site-accent hover:text-white font-bold transition-colors text-sm hover:underline underline-offset-4"
                >
                  {t("resend_email")}
                </button>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-site-border flex justify-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white font-medium transition-colors hover:bg-[#212328]/5 py-2 px-4 rounded-lg"
              >
                <ArrowLeft size={16} />
                {t("back_to_login")}
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ForgotPasswordPage() {
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
      <ForgotPasswordContent />
    </Suspense>
  );
}
