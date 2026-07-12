"use client";

import { useState, Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { motion, AnimatePresence } from "@/lib/framer-exports";
import {
  Lock,
  ArrowRight,
  Info,
  Zap,
  Shield,
  Sparkles,
  Loader2,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
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
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
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
      if (redirect) {
        router.push(redirect);
      } else {
        router.push("/dashboard/account");
      }
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

  const submitCountRef = useRef(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    submitCountRef.current++;

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
        if (redirect) {
          router.push(redirect);
        } else {
          router.push("/dashboard/account");
        }
      }
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const emailValid =
    email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className="min-h-[100dvh] bg-site-bg flex items-center justify-center px-4 py-6 lg:py-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-12 items-center">
          {/* Left Side - Branding */}
          <motion.div
            className="hidden lg:flex lg:col-span-2 flex-col space-y-7"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="flex items-center space-x-3">
              <motion.div
                className="w-14 h-14 bg-site-surface border border-site-border rounded-2xl flex items-center justify-center"
                whileHover={{ rotate: [0, -8, 8, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Zap className="w-7 h-7 text-site-accent" fill="currentColor" />
              </motion.div>
              <span className="text-2xl font-black text-site-text tracking-tight">
                {siteName}
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-black text-site-text leading-[1.15] tracking-tight">
                {t("hero_title_1")}{" "}
                <span className="text-site-accent">{t("hero_title_2")}</span>
                <br />
                {t("hero_title_3")}{" "}
                <span className="text-site-accent">{t("hero_title_4")}</span>
              </h1>

              <p className="text-site-muted text-base leading-relaxed max-w-md">
                {t("subtitle")}
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3 pt-2">
              <motion.div
                className="flex items-center space-x-4 p-4 bg-site-surface border border-site-border-soft rounded-xl hover:border-site-accent/40 transition-colors group"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-11 h-11 bg-site-raised rounded-lg border border-site-border flex items-center justify-center shrink-0 group-hover:bg-site-accent/10 transition-colors">
                  <Sparkles className="w-5 h-5 text-site-accent" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-site-text font-bold text-sm">
                    {t("vip_points")}
                  </h3>
                  <p className="text-site-muted text-xs mt-0.5">
                    {t("vip_points_desc")}
                  </p>
                </div>
              </motion.div>

              <motion.div
                className="flex items-center space-x-4 p-4 bg-site-surface border border-site-border-soft rounded-xl hover:border-site-accent/40 transition-colors group"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-11 h-11 bg-site-raised rounded-lg border border-site-border flex items-center justify-center shrink-0 group-hover:bg-site-accent/10 transition-colors">
                  <Shield className="w-5 h-5 text-site-accent" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-site-text font-bold text-sm">
                    {t("secure_100")}
                  </h3>
                  <p className="text-site-muted text-xs mt-0.5">
                    {t("secure_100_desc")}
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="lg:col-span-3"
          >
            <div className="bg-site-surface border border-site-border-soft rounded-2xl p-6 lg:p-9 max-w-md mx-auto">
              {/* Mobile Logo */}
              <div className="lg:hidden flex items-center justify-center space-x-2 mb-7">
                <div className="w-11 h-11 bg-site-raised border border-site-border rounded-xl flex items-center justify-center">
                  <Zap
                    className="w-6 h-6 text-site-accent"
                    fill="currentColor"
                  />
                </div>
                <span className="text-xl font-black text-site-text">
                  {siteName}
                </span>
              </div>

              <div className="mb-7">
                <h2 className="text-2xl font-black text-site-text tracking-tight">
                  {t("title")}
                </h2>
                <p className="text-sm text-site-muted mt-1.5">
                  {t("no_account")}{" "}
                  <Link
                    href="/register"
                    className="text-site-accent hover:text-site-accent-hover font-bold transition-colors"
                  >
                    {t("register_now")}
                  </Link>
                </p>
              </div>

              <AnimatePresence>
                {sessionExpired && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3.5 bg-semantic-rose/10 border border-semantic-rose/30 rounded-xl">
                      <div className="flex items-center space-x-2">
                        <Info className="w-5 h-5 text-semantic-rose shrink-0" />
                        <span className="text-semantic-rose font-bold text-sm">
                          {t("session_expired")}
                        </span>
                      </div>
                      <p className="text-semantic-rose/80 text-xs mt-1 ml-7">
                        {t("session_expired_desc")}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="text-sm font-semibold text-site-text block"
                  >
                    {t("email._base")}
                  </label>
                  <div
                    className={`relative bg-site-raised border rounded-lg transition-all ${
                      emailFocused
                        ? "border-site-accent shadow-accent-glow"
                        : emailValid
                          ? "border-semantic-green/50"
                          : "border-site-border"
                    }`}
                  >
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-site-dim pointer-events-none">
                      <Mail className="h-4.5 w-4.5" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      required
                      disabled={isLoading}
                      autoComplete="email"
                      className="w-full h-12 pl-11 pr-11 bg-transparent text-sm text-site-text placeholder:text-site-dim focus:outline-none disabled:opacity-50 rounded-lg"
                    />
                    {emailValid && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2"
                      >
                        <CheckCircle2 className="h-4.5 w-4.5 text-semantic-green" />
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-site-text block"
                  >
                    {t("password")}
                  </label>
                  <div
                    className={`relative bg-site-raised border rounded-lg transition-all ${
                      passwordFocused
                        ? "border-site-accent shadow-accent-glow"
                        : "border-site-border"
                    }`}
                  >
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-site-dim pointer-events-none">
                      <Lock className="h-4.5 w-4.5" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      required
                      disabled={isLoading}
                      autoComplete="current-password"
                      className="w-full h-12 pl-11 pr-11 bg-transparent text-sm text-site-text placeholder:text-site-dim focus:outline-none disabled:opacity-50 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-site-dim hover:text-site-text transition-colors p-1"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4.5 w-4.5" />
                      ) : (
                        <Eye className="h-4.5 w-4.5" />
                      )}
                    </button>
                  </div>
                  <div className="flex justify-end pt-1">
                    <Link
                      href="/forgot-password"
                      className="text-xs text-site-accent hover:text-site-accent-hover font-semibold transition-colors"
                    >
                      {t("forgot_password")}
                    </Link>
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-12 mt-2 bg-site-accent hover:bg-site-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-site-bg font-bold rounded-lg transition-all inline-flex items-center justify-center gap-2 shadow-accent-glow"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      <span>กำลังเข้าสู่ระบบ...</span>
                    </>
                  ) : (
                    <>
                      <span>{t("login_button")}</span>
                      <ArrowRight className="h-4.5 w-4.5" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* OAuth Section */}
              {oauthProviders.length > 0 && (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-site-border-soft"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-3 bg-site-surface text-site-muted font-medium tracking-wide">
                        {t("or_login_with")}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {oauthLoading ? (
                      <div className="col-span-full flex justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-site-dim" />
                      </div>
                    ) : (
                      oauthProviders.map((provider) => (
                        <motion.button
                          key={provider.id}
                          type="button"
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleOAuthLogin(provider)}
                          disabled={!provider.isEnabled}
                          className="h-11 bg-site-raised border border-site-border text-site-text hover:bg-site-raised hover:border-site-accent/40 disabled:opacity-50 rounded-lg font-semibold text-sm transition-all inline-flex items-center justify-center gap-2.5"
                        >
                          {provider.iconUrl && (
                            <img
                              src={provider.iconUrl}
                              alt={provider.name}
                              className="w-4.5 h-4.5"
                            />
                          )}
                          {provider.displayName}
                        </motion.button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-site-dim mt-6">
              <Shield className="inline w-3 h-3 mr-1 -mt-0.5" />
              {t("footer_secure_note")}
            </p>
          </motion.div>
        </div>
      </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-site-bg">
          <Loader2 className="w-8 h-8 text-site-accent animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
