"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
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
    "bg-status-danger",
    "bg-status-warning",
    "bg-status-warning",
    "bg-status-success",
    "bg-site-accent",
  ];

  if (isInvalid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-site-bg px-4 py-12">
        <div className="w-full max-w-[400px] mx-auto">
          <div className="site-card p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-6 bg-status-danger/10 border border-status-danger/20">
                <XCircle size={20} className="text-status-danger" />
              </div>
              <h1 className="text-lg font-bold text-site-text">
                {t("error_invalid_link")}
              </h1>
            </div>

            <p className="text-sm text-site-muted mb-6 leading-relaxed">
              {t("error_invalid_link_desc")}
            </p>

            <Link
              href="/forgot-password"
              className="site-btn w-full inline-flex"
            >
              <ArrowLeft size={16} />
              {t("error_get_new_link")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-site-bg px-4 py-12">
      <div className="w-full max-w-[400px] mx-auto">
        <div className="site-card p-6">
          {/* Header */}
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-6 bg-site-accent/10 border border-site-accent/20">
              <Lock size={20} className="text-site-accent" />
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
                {/* New Password */}
                <div className="space-y-1.5">
                  <label
                    className="text-[12px] font-semibold text-site-muted"
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
                      icon={<Lock className="h-4 w-4" />}
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-site-dim hover:text-site-text transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
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
                              : "bg-site-bg border border-site-border-soft"
                              }`}
                          />
                        ))}
                      </div>
                      <p className="text-[12px] text-site-muted">
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
                    className="text-[12px] font-semibold text-site-muted"
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
                      icon={<ShieldCheck className="h-4 w-4" />}
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-site-dim hover:text-site-text transition-colors"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      aria-pressed={showConfirmPassword}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>

                  {/* Password Match Indicator */}
                  {confirmPassword && (
                    <p
                      className={`text-[12px] mt-1 ${newPassword === confirmPassword
                        ? "text-status-success"
                        : "text-status-danger"
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
                  fullWidth
                  size="lg"
                  disabled={
                    isSubmitting ||
                    newPassword !== confirmPassword ||
                    passwordStrength < 3
                  }
                  isLoading={isSubmitting}
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
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-8 bg-status-success/10 border border-status-success/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-status-success" />
              </div>
              <h2 className="text-lg font-bold text-site-text mb-2">
                {t("success_title")}
              </h2>
              <p className="text-sm text-site-muted mb-4 leading-relaxed">
                {t("success_desc")}
              </p>
              <p className="text-[12px] text-site-dim mb-6 max-w-[280px] mx-auto">
                {t("redirect_hint")}
              </p>

              <Link
                href="/login"
                className="site-btn w-full inline-flex"
              >
                {t("login_now")}
                <ArrowRight size={16} />
              </Link>
            </div>
          )}

          {!isSuccess && (
            <div className="mt-6 pt-5 border-t border-site-border-soft flex justify-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-[12px] text-site-muted hover:text-site-accent font-medium transition-colors"
              >
                <ArrowLeft size={14} />
                {t("back_to_login")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
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
      <ResetPasswordContent />
    </Suspense>
  );
}
