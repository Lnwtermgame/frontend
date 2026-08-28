"use client";

import { useState, Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { motion, AnimatePresence } from "@/lib/framer-exports";
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
  Sparkles,
  Zap,
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
    <div className="relative isolate flex min-h-[100dvh] items-center justify-center overflow-hidden bg-site-bg px-4 py-8 sm:px-6 lg:py-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-40 h-96 w-96 rounded-full bg-site-accent/10 blur-3xl" />
        <div className="absolute -bottom-48 -right-32 h-[30rem] w-[30rem] rounded-full bg-semantic-blue/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--site-border-soft) 1px, transparent 1px), linear-gradient(to bottom, var(--site-border-soft) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <motion.section
          className="hidden lg:block"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <div className="mb-10 flex items-center gap-3">
            <motion.div
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-site-border bg-site-surface shadow-[0_12px_32px_rgba(0,0,0,0.16)]"
              whileHover={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 0.5 }}
            >
              <Zap className="h-7 w-7 text-site-accent" fill="currentColor" />
            </motion.div>
            <div>
              <p className="text-xl font-extrabold tracking-tight text-site-text">
                {siteName}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-site-dim">
                {t("title")}
              </p>
            </div>
          </div>

          <div className="max-w-xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-site-accent">
              {t("secure_100")}
            </p>
            <h1 className="text-5xl font-extrabold leading-[1.08] tracking-[-0.04em] text-site-text xl:text-6xl">
              {t("hero_title_1")} {" "}
              <span className="text-site-accent">{t("hero_title_2")}</span>
              <br />
              {t("hero_title_3")} {" "}
              <span className="text-site-accent">{t("hero_title_4")}</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-site-muted">
              {t("subtitle")}
            </p>
          </div>

          <div className="mt-10 max-w-lg space-y-3">
            <motion.div
              className="group flex items-center gap-4 rounded-2xl border border-site-border-soft bg-site-surface/80 p-4 transition-colors hover:border-site-accent/40"
              whileHover={{ x: 4 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-site-border bg-site-raised text-site-accent transition-colors group-hover:bg-site-accent/10">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-site-text">
                  {t("vip_points")}
                </h2>
                <p className="mt-1 text-xs leading-5 text-site-muted">
                  {t("vip_points_desc")}
                </p>
              </div>
            </motion.div>

            <motion.div
              className="group flex items-center gap-4 rounded-2xl border border-site-border-soft bg-site-surface/80 p-4 transition-colors hover:border-site-accent/40"
              whileHover={{ x: 4 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-site-border bg-site-raised text-site-accent transition-colors group-hover:bg-site-accent/10">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-site-text">
                  {t("secure_100")}
                </h2>
                <p className="mt-1 text-xs leading-5 text-site-muted">
                  {t("secure_100_desc")}
                </p>
              </div>
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          className="w-full"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: "easeOut" }}
        >
          <div className="mx-auto w-full max-w-[460px]">
            <div className="relative overflow-hidden rounded-[28px] border border-site-border bg-site-surface/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-8 lg:p-9">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-site-accent to-transparent" />

              <div className="mb-8 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-6 flex items-center gap-2.5 lg:hidden">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-site-border bg-site-raised text-site-accent">
                      <Zap className="h-5 w-5" fill="currentColor" />
                    </div>
                    <span className="truncate text-lg font-extrabold tracking-tight text-site-text">
                      {siteName}
                    </span>
                  </div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-site-accent">
                    {siteName}
                  </p>
                  <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-site-text">
                    {t("title")}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-site-muted">
                    {t("subtitle")}
                  </p>
                </div>
                <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-site-border-soft bg-site-raised text-site-accent sm:flex">
                  <Lock className="h-4 w-4" />
                </div>
              </div>

              <AnimatePresence>
                {sessionExpired && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="overflow-hidden"
                  >
                    <div
                      role="alert"
                      className="rounded-xl border border-semantic-rose/30 bg-semantic-rose/10 p-3.5"
                    >
                      <div className="flex items-center gap-2">
                        <Info className="h-5 w-5 shrink-0 text-semantic-rose" />
                        <span className="text-sm font-bold text-semantic-rose">
                          {t("session_expired")}
                        </span>
                      </div>
                      <p className="ml-7 mt-1 text-xs text-semantic-rose/80">
                        {t("session_expired_desc")}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="block text-[13px] font-bold text-site-text"
                  >
                    {t("email._base")}
                  </label>
                  <div
                    className={`relative rounded-xl border bg-site-raised/80 transition-all ${
                      emailFocused
                        ? "border-site-accent ring-4 ring-site-accent/10"
                        : emailValid
                          ? "border-semantic-green/50"
                          : "border-site-border"
                    }`}
                  >
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-site-dim" />
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
                      aria-invalid={email.length > 0 && !emailValid}
                      className="h-[52px] w-full rounded-xl bg-transparent px-12 pr-12 text-[15px] text-site-text outline-none placeholder:text-site-dim disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    {emailValid && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="pointer-events-none absolute inset-y-0 right-4 flex items-center"
                      >
                        <CheckCircle2 className="h-[18px] w-[18px] text-semantic-green" />
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <label
                      htmlFor="password"
                      className="block text-[13px] font-bold text-site-text"
                    >
                      {t("password")}
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-bold text-site-accent transition-colors hover:text-site-accent-hover"
                    >
                      {t("forgot_password")}
                    </Link>
                  </div>
                  <div
                    className={`relative rounded-xl border bg-site-raised/80 transition-all ${
                      passwordFocused
                        ? "border-site-accent ring-4 ring-site-accent/10"
                        : "border-site-border"
                    }`}
                  >
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-site-dim" />
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
                      className="h-[52px] w-full rounded-xl bg-transparent px-12 pr-12 text-[15px] text-site-text outline-none placeholder:text-site-dim disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-site-dim transition-colors hover:bg-site-surface hover:text-site-text focus:outline-none focus:ring-2 focus:ring-site-accent/40"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? (
                        <EyeOff className="h-[18px] w-[18px]" />
                      ) : (
                        <Eye className="h-[18px] w-[18px]" />
                      )}
                    </button>
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  whileTap={{ scale: 0.985 }}
                  className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-site-accent px-5 font-extrabold text-site-bg shadow-[0_10px_24px_rgba(103,176,186,0.2)] transition-all hover:-translate-y-0.5 hover:bg-site-accent-hover hover:shadow-[0_14px_28px_rgba(103,176,186,0.25)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-[18px] w-[18px] animate-spin" />
                      <span>{t("redirect")}</span>
                    </>
                  ) : (
                    <>
                      <span>{t("login_button")}</span>
                      <ArrowRight className="h-[18px] w-[18px]" />
                    </>
                  )}
                </motion.button>
              </form>

              {showOAuth && (
                <>
                  <div className="relative my-7">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-site-border-soft" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-site-surface px-3 font-medium tracking-wide text-site-muted">
                        {t("or_login_with")}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {oauthLoading ? (
                      <div className="col-span-full flex justify-center py-3">
                        <Loader2 className="h-5 w-5 animate-spin text-site-dim" />
                      </div>
                    ) : (
                      oauthProviders.map((provider) => (
                        <motion.button
                          key={provider.id}
                          type="button"
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.985 }}
                          onClick={() => handleOAuthLogin(provider)}
                          disabled={!provider.isEnabled}
                          className="inline-flex h-12 items-center justify-center gap-2.5 rounded-xl border border-site-border bg-site-raised px-3 text-sm font-bold text-site-text transition-all hover:border-site-accent/50 hover:bg-site-surface disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {provider.iconUrl && (
                            <img
                              src={provider.iconUrl}
                              alt=""
                              loading="lazy"
                              className="h-[18px] w-[18px]"
                            />
                          )}
                          {provider.displayName}
                        </motion.button>
                      ))
                    )}
                  </div>
                </>
              )}

              <div className="mt-8 border-t border-site-border-soft pt-6 text-center">
                <p className="text-sm text-site-muted">
                  {t("no_account")} {" "}
                  <Link
                    href="/register"
                    className="font-extrabold text-site-accent transition-colors hover:text-site-accent-hover"
                  >
                    {t("register_now")}
                  </Link>
                </p>
              </div>
            </div>

            <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-site-dim">
              <Shield className="h-3.5 w-3.5" />
              {t("footer_secure_note")}
            </p>
          </div>
        </motion.section>
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
