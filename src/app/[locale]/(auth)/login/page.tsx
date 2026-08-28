"use client";

import { useState, Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Lock,
  Mail,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";
import { usePublicSettings } from "@/lib/context/public-settings-context";
import {
  oauthProviderApi,
  OAuthProvider,
} from "@/lib/services/oauth-provider-api";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";

function LoginContent() {
  const t = useTranslations("Auth.login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("session_expired") === "true";
  const redirect = searchParams.get("redirect");
  const error = searchParams.get("error");
  const { login, isLoading, isAuthenticated } = useAuth();
  const { settings: publicSettings } = usePublicSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [oauthProviders, setOauthProviders] = useState<OAuthProvider[]>([]);
  const [oauthLoading, setOauthLoading] = useState(true);
  const isSubmittingRef = useRef(false);
  const siteName = publicSettings?.general.siteName || "Lnwtermgame";

  useEffect(() => {
    if (error === "OAuthCallback") {
      toast.error(t("oauth_failed"));
    } else if (error === "OAuthSignin") {
      toast.error(t("oauth_init_failed"));
    } else if (error === "Callback") {
      toast.error(t("oauth_callback_failed"));
    }

    if (!sessionExpired && typeof window !== "undefined") {
      sessionStorage.removeItem("session_expired");
    }
  }, [error, sessionExpired, t]);

  useEffect(() => {
    const fetchOAuthProviders = async () => {
      try {
        const response = await oauthProviderApi.getEnabledProviders();
        setOauthProviders(response.data || []);
      } catch (error) {
        console.error("Failed to fetch OAuth providers:", error);
      } finally {
        setOauthLoading(false);
      }
    };

    fetchOAuthProviders();
  }, []);

  useEffect(() => {
    const hasSessionExpiredFlag =
      sessionExpired ||
      (typeof window !== "undefined" &&
        sessionStorage.getItem("session_expired") === "true");

    if (hasSessionExpiredFlag) {
      return;
    }

    if (isAuthenticated) {
      router.push(redirect || "/dashboard/account");
    }
  }, [isAuthenticated, redirect, router, sessionExpired]);

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    if (!provider.isEnabled) {
      toast.error(t("provider_not_enabled", { provider: provider.displayName }));
      return;
    }

    try {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("session_expired");
      }
      await signIn(provider.name as "discord" | "google", {
        callbackUrl: redirect || "/dashboard/account",
        redirect: true,
      });
    } catch (error) {
      console.error("[Login] OAuth sign in exception:", error);
      toast.error(t("error_occurred"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmittingRef.current || isLoading) {
      return;
    }

    isSubmittingRef.current = true;

    try {
      const success = await login(email, password);
      if (success) {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("session_expired");
        }
        router.push(redirect || "/dashboard/account");
      }
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const emailValid =
    email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const showOAuth = oauthLoading || oauthProviders.length > 0;

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-site-bg px-4 py-8">
      <div className="w-full max-w-[400px] mx-auto">
        <div className="site-card p-6">
          {/* Logo / branding */}
          <div className="mb-6 flex flex-col items-center text-center">
            <p className="text-lg font-bold text-site-text">{siteName}</p>
            <h1 className="mt-1 text-xl font-extrabold tracking-tight text-site-text">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-site-muted">{t("subtitle")}</p>
          </div>

          {/* Session expired banner */}
          {sessionExpired && (
            <div
              role="alert"
              className="mb-5 rounded-6 border border-status-danger/30 bg-status-danger/10 p-3"
            >
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 shrink-0 text-status-danger" />
                <span className="text-xs font-semibold text-status-danger">
                  {t("session_expired")}
                </span>
              </div>
              <p className="ml-6 mt-1 text-[11px] text-status-danger/80">
                {t("session_expired_desc")}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-[12px] font-semibold text-site-muted"
              >
                {t("email._base")}
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-site-dim" />
                <input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                  aria-invalid={email.length > 0 && !emailValid}
                  className="site-input pl-10 pr-10"
                />
                {emailValid && (
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-status-success" />
                  </div>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-[12px] font-semibold text-site-muted"
                >
                  {t("password")}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[12px] text-site-muted hover:text-site-accent transition-colors"
                >
                  {t("forgot_password")}
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-site-dim" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="site-input pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-site-dim transition-colors hover:text-site-text focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="site-btn w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t("redirect")}</span>
                </>
              ) : (
                <>
                  <span>{t("login_button")}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* OAuth */}
          {showOAuth && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-site-border-soft" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-site-surface px-3 text-site-muted">
                    {t("or_login_with")}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {oauthLoading ? (
                  <div className="col-span-full flex justify-center py-3">
                    <Loader2 className="h-5 w-5 animate-spin text-site-dim" />
                  </div>
                ) : (
                  oauthProviders.map((provider) => (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => handleOAuthLogin(provider)}
                      disabled={!provider.isEnabled}
                      className="w-full border border-site-border-soft bg-site-surface hover:border-site-border rounded-6 py-2.5 text-[13px] text-site-text transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {provider.iconUrl && (
                        <img
                          src={provider.iconUrl}
                          alt=""
                          loading="lazy"
                          className="h-4 w-4"
                        />
                      )}
                      {provider.displayName}
                    </button>
                  ))
                )}
              </div>
            </>
          )}

          {/* Register link */}
          <div className="mt-6 border-t border-site-border-soft pt-5 text-center">
            <p className="text-sm text-site-muted">
              {t("no_account")}{" "}
              <Link
                href="/register"
                className="font-semibold text-site-accent transition-colors hover:text-site-accent-hover"
              >
                {t("register_now")}
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-site-dim">
          <Shield className="h-3.5 w-3.5" />
          {t("footer_secure_note")}
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-site-bg">
          <Loader2 className="h-8 w-8 animate-spin text-site-accent" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
