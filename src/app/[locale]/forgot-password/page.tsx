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
    <div className="min-h-screen bg-brutal-gray flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white border-[3px] border-black shadow-[6px_6px_0_0_#000]">
          {/* Header */}
          <div className="bg-brutal-yellow border-b-[3px] border-black p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-black border-[3px] border-black flex items-center justify-center">
                <Mail size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-black">
                  {t("title")}
                </h1>
                <p className="text-sm text-gray-700 uppercase">Reset Password</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {!isSuccess ? (
              <>
                <p className="text-gray-600 mb-6">
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
                    className="w-full bg-brutal-blue text-white hover:bg-black"
                    disabled={isSubmitting}
                    isLoading={isSubmitting}
                    size="lg"
                  >
                    {!isSubmitting && (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        {t("send_link")}
                      </>
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-brutal-green border-[3px] border-black flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-black" />
                </div>
                <h2 className="text-lg font-bold text-black mb-2">
                  {t("success_title")}
                </h2>
                <p className="text-gray-600 mb-4">
                  {t("success_desc")}
                  <br />
                  <span className="font-mono bg-gray-100 px-2 py-1 border border-gray-300">
                    {email}
                  </span>
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  {t("spam_hint")}
                </p>

                <button
                  onClick={() => {
                    setIsSuccess(false);
                    setEmail("");
                  }}
                  className="text-brutal-pink hover:text-brutal-pink/80 font-bold transition-colors text-sm"
                >
                  {t("resend_email")}
                </button>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
              >
                <ArrowLeft size={18} />
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
        <div className="min-h-screen bg-brutal-gray flex items-center justify-center">
          <div className="text-center">
            <Loader2
              size={48}
              className="animate-spin mx-auto mb-4 text-brutal-blue"
            />
            <p className="text-gray-600">{t("loading")}</p>
          </div>
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
