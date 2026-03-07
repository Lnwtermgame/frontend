"use client";

import { useState, Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { motion } from "@/lib/framer-exports";
import {
  Lock,
  ArrowRight,
  Info,
  Zap,
  Shield,
  Sparkles,
  Loader2,
  Mail,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
  const [oauthProviders, setOAuthProviders] = useState<OAuthProvider[]>([]);
  const [oauthLoading, setOAuthLoading] = useState(true);
  const isSubmittingRef = useRef(false);
  const siteName = publicSettings?.general.siteName || "Lnwtermgame";

  // Handle OAuth errors from URL
  useEffect(() => {
    if (error === "OAuthCallback") {
      toast.error(t("oauth_failed"));
    } else if (error === "OAuthSignin") {
      toast.error(t("oauth_init_failed"));
    } else if (error === "Callback") {
      toast.error(t("oauth_callback_failed"));
    }

    // Clear session_expired flag if user visits login page directly (not from session expiry)
    if (!sessionExpired && typeof window !== "undefined") {
      sessionStorage.removeItem("session_expired");
    }
  }, [error, sessionExpired, t]);

  // Fetch OAuth providers
  useEffect(() => {
    const fetchOAuthProviders = async () => {
      try {
        const response = await oauthProviderApi.getEnabledProviders();
        setOAuthProviders(response.data || []);
      } catch (error) {
        console.error("Failed to fetch OAuth providers:", error);
        // Silently fail - user can still login with email/password
      } finally {
        setOAuthLoading(false);
      }
    };

    fetchOAuthProviders();
  }, []);

  // Redirect if already authenticated (but NOT if coming from session_expired)
  useEffect(() => {
    // Don't redirect if session expired - user needs to log in again
    // Check both URL param and sessionStorage flag
    const hasSessionExpiredFlag = sessionExpired ||
      (typeof window !== "undefined" && sessionStorage.getItem("session_expired") === "true");

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

  // Handle OAuth login with NextAuth
  const handleOAuthLogin = async (provider: OAuthProvider) => {
    // Check if provider is enabled
    if (!provider.isEnabled) {
      toast.error(t("provider_not_enabled", { provider: provider.displayName }));
      return;
    }

    try {
      console.log(`[Login] Starting OAuth sign in with ${provider.name}`);

      // Clear session expired flag before OAuth login
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("session_expired");
      }

      // Use NextAuth's signIn function
      await signIn(provider.name as "discord" | "google", {
        callbackUrl: redirect || "/dashboard/account",
        redirect: true,
      });
    } catch (error) {
      console.error("[Login] OAuth sign in exception:", error);
      toast.error(t("error_occurred"));
    }
  };

  // Track submission count for debugging
  const submitCountRef = useRef(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    submitCountRef.current++;
    console.log(`[Login] Form submit #${submitCountRef.current}`, {
      isLoading,
      isSubmitting: isSubmittingRef.current,
    });

    if (isSubmittingRef.current || isLoading) {
      return;
    }

    isSubmittingRef.current = true;

    try {
      const success = await login(email, password);
      if (success) {
        // Clear session expired flag on successful login
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

  return (
    <div className="min-h-[100dvh] bg-transparent flex items-center justify-center px-4 py-4 lg:py-12">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 items-center">
        {/* Left Side - Branding */}
        <motion.div
          className="hidden lg:flex flex-col space-y-6"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-brutal-yellow border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0_0_#000]">
              <Zap className="w-6 h-6 text-black" fill="currentColor" />
            </div>
            <span className="text-2xl font-black text-black">
              {siteName}
            </span>
          </div>

          <h1 className="text-4xl font-black text-black leading-tight">
            {t("hero_title_1")} <span className="text-brutal-pink">{t("hero_title_2")}</span>
            <br />
            {t("hero_title_3")} <span className="text-brutal-blue">{t("hero_title_4")}</span>
          </h1>

          <p className="text-gray-600 text-lg">
            {t("subtitle")}
          </p>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 gap-4 pt-4">
            <motion.div
              className="flex items-center space-x-4 p-4 bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000]"
              whileHover={{
                scale: 1.02,
                x: -2,
                y: -2,
                boxShadow: "6px 6px 0 0 #000000",
              }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-10 h-10 bg-brutal-yellow border-[2px] border-black flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="text-black font-bold">{t("vip_points")}</h3>
                <p className="text-gray-500 text-sm">
                  {t("vip_points_desc")}
                </p>
              </div>
            </motion.div>

            <motion.div
              className="flex items-center space-x-4 p-4 bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000]"
              whileHover={{
                scale: 1.02,
                x: -2,
                y: -2,
                boxShadow: "6px 6px 0 0 #000000",
              }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-10 h-10 bg-brutal-green border-[2px] border-black flex items-center justify-center">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="text-black font-bold">{t("secure_100")}</h3>
                <p className="text-gray-500 text-sm">
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
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white border-[3px] border-black shadow-[8px_8px_0_0_#000] p-5 lg:p-8">
            {/* Session Expired Warning */}
            {sessionExpired && (
              <div className="mb-4 lg:mb-6 p-3 lg:p-4 bg-yellow-100 border-[2px] border-yellow-500">
                <div className="flex items-center space-x-2">
                  <Info className="w-5 h-5 text-yellow-700" />
                  <span className="text-yellow-800 font-bold">
                    {t("session_expired")}
                  </span>
                </div>
                <p className="text-yellow-700 text-sm mt-1">
                  {t("session_expired_desc")}
                </p>
              </div>
            )}

            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-brutal-yellow border-[3px] border-black flex items-center justify-center shadow-[3px_3px_0_0_#000]">
                <Zap className="w-4 h-4 lg:w-5 lg:h-5 text-black" fill="currentColor" />
              </div>
              <span className="text-lg lg:text-xl font-black text-black">
                {siteName}
              </span>
            </div>

            <div className="text-center mb-4 lg:mb-8">
              <h2 className="text-xl lg:text-2xl font-black text-black mb-1 lg:mb-2">
                {t("title")}
              </h2>
              <p className="text-sm lg:text-base text-gray-500">
                {t("no_account")}{" "}
                <Link
                  href="/register"
                  className="text-brutal-pink hover:text-brutal-pink/80 font-bold transition-colors"
                >
                  {t("register_now")}
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-5">
              <Input
                id="email"
                label={t("email")}
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                icon={<Mail className="h-5 w-5" />}
                autoComplete="email"
              />

              <div className="space-y-1.5">
                <Input
                  id="password"
                  label={t("password")}
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  icon={<Lock className="h-5 w-5" />}
                  autoComplete="current-password"
                />
                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-brutal-pink hover:text-brutal-pink/80 font-bold transition-colors"
                  >
                    {t("forgot_password")}
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                variant="default"
                disabled={isLoading}
                isLoading={isLoading}
                size="full"
              >
                {!isLoading && (
                  <>
                    {t("login_button")} <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            {/* OAuth Section */}
            {oauthProviders.length > 0 && (
              <>
                <div className="relative my-4 lg:my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs lg:text-sm">
                    <span className="px-3 bg-white text-gray-500">
                      {t("or_login_with")}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 lg:gap-3">
                  {oauthLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    oauthProviders.map((provider) => (
                      <Button
                        key={provider.id}
                        type="button"
                        variant="outline"
                        size="md"
                        className="max-w-[40%] mx-auto"
                        onClick={() => handleOAuthLogin(provider)}
                      >
                        {provider.iconUrl && (
                          <img
                            src={provider.iconUrl}
                            alt={provider.name}
                            className="w-5 h-5 mr-2"
                          />
                        )}
                        {provider.displayName}
                      </Button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
