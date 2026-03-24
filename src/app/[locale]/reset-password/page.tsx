"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";
import {
  Lock,
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { authApi } from "@/lib/services/auth-api";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";

function ResetPasswordContent() {
  const t = useTranslations("Verification.reset_password");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsInvalid(true);
    }
  }, [token]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return t("password_requirements.length");
    }
    if (!/[A-Z]/.test(password)) {
      return t("password_requirements.uppercase");
    }
    if (!/[a-z]/.test(password)) {
      return t("password_requirements.lowercase");
    }
    if (!/[0-9]/.test(password)) {
      return t("password_requirements.number");
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error(t("error_invalid"));
      return;
    }

    // Validate password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    // Check confirm password
    if (newPassword !== confirmPassword) {
      toast.error(t("match_error"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authApi.resetPassword(token, newPassword);

      if (response.success) {
        setIsSuccess(true);
        toast.success(t("success_title"));

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        toast.error(response.message || t("error_invalid"));
      }
    } catch (error: any) {
      const errorMessage = authApi.getErrorMessage(error);

      if (
        errorMessage.includes("expired") ||
        errorMessage.includes("หมดอายุ")
      ) {
        toast.error(t("error_expired"));
      } else if (
        errorMessage.includes("Invalid") ||
        errorMessage.includes("invalid")
      ) {
        toast.error(t("error_invalid"));
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const strengthLabels = t.raw("strength_labels");
  const strengthColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
    "bg-site-accent shadow-accent-glow",
  ];

  if (isInvalid) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-[#222427] border border-site-border shadow-ocean rounded-2xl overflow-hidden relative">
            <div className="bg-[#1A1C1E] border-b border-site-border p-6 relative">
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30/20 flex items-center justify-center shrink-0 shadow-sm">
                  <XCircle size={24} className="text-red-500" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    {t("error_invalid_link")}
                  </h1>
                </div>
              </div>
            </div>

            <div className="p-8 text-center relative z-10">
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                {t("error_invalid_link_desc")}
              </p>

              <Link
                href="/forgot-password"
                className="inline-flex items-center justify-center gap-2 w-full bg-[#1A1C1E] text-white px-6 py-3 border border-site-border rounded-lg font-bold hover:bg-[#212328]/5 hover:border-site-accent/50 transition-all shadow-sm"
              >
                <ArrowLeft size={18} />
                {t("error_get_new_link")}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

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
                <Lock size={24} className="text-site-accent" />
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
                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label
                      className="text-sm font-bold text-gray-300"
                      htmlFor="newPassword"
                    >
                      {t("new_password")}
                    </label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        disabled={isSubmitting}
                        icon={<Lock className="h-5 w-5" />}
                        autoComplete="new-password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>

                    {/* Password Strength */}
                    {newPassword && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full ${i < passwordStrength
                                ? strengthColors[passwordStrength - 1]
                                : "bg-[#1A1C1E] border border-site-border"
                                }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">
                          {t("strength")}{" "}
                          {passwordStrength > 0
                            ? strengthLabels[passwordStrength - 1]
                            : "-"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label
                      className="text-sm font-bold text-gray-300"
                      htmlFor="confirmPassword"
                    >
                      {t("confirm_password")}
                    </label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isSubmitting}
                        icon={<ShieldCheck className="h-5 w-5" />}
                        autoComplete="new-password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>

                    {/* Password Match Indicator */}
                    {confirmPassword && (
                      <p
                        className={`text-xs mt-1 ${newPassword === confirmPassword
                          ? "text-site-accent"
                          : "text-red-500"
                          }`}
                      >
                        {newPassword === confirmPassword
                          ? `✓ ${t("match_success")}`
                          : `✗ ${t("match_error")}`}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-site-accent text-[#1A1C1E] hover:bg-site-accent hover:text-[#16181A] hover:scale-[1.02] active:scale-[0.98] border border-transparent hover:shadow-accent-glow font-bold mt-2"
                    disabled={
                      isSubmitting ||
                      newPassword !== confirmPassword ||
                      passwordStrength < 3
                    }
                    isLoading={isSubmitting}
                    size="lg"
                  >
                    {!isSubmitting && (
                      <div className="flex items-center justify-center">
                        {t("reset_button")}
                        <ArrowRight className="ml-2 h-4 w-4" />
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
                </p>
                <p className="text-xs text-gray-500 mb-8 max-w-[280px] mx-auto">
                  {t("redirect_hint")}
                </p>

                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 w-full bg-site-accent text-[#1A1C1E] px-6 py-3 border border-transparent rounded-lg font-bold hover:bg-site-accent hover:scale-[1.02] shadow-accent-glow transition-all"
                >
                  {t("login_now")}
                  <ArrowRight size={18} />
                </Link>
              </div>
            )}

            {!isSuccess && (
              <div className="mt-8 pt-6 border-t border-site-border flex justify-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white font-medium transition-colors hover:bg-[#212328]/5 py-2 px-4 rounded-lg"
                >
                  <ArrowLeft size={16} />
                  {t("back_to_login")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
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
      <ResetPasswordContent />
    </Suspense>
  );
}
