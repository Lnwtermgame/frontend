"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { motion } from "@/lib/framer-exports";
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle,
  Zap,
  Gift,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { publicSettingsApi } from "@/lib/services/public-settings-api";
import { useTranslations } from "next-intl";

export default function RegisterPage() {
  const t = useTranslations("Auth.register");
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [siteName, setSiteName] = useState("Lnwtermgame");

  // Validate password match
  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setPasswordError(t("passwords_not_match"));
    } else {
      setPasswordError("");
    }
  }, [password, confirmPassword, t]);

  useEffect(() => {
    const loadPublicSettings = async () => {
      try {
        const response = await publicSettingsApi.getPublicSettings();
        setRegistrationEnabled(response.data.features.enableUserRegistration);
        setSiteName(response.data.general.siteName || "Lnwtermgame");
      } catch {
        setRegistrationEnabled(true);
        setSiteName("Lnwtermgame");
      } finally {
        setLoadingSettings(false);
      }
    };
    loadPublicSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationEnabled) return;

    // Client-side validation
    if (password.length < 8) {
      return;
    }

    if (password !== confirmPassword) {
      return;
    }

    if (username.length < 3) {
      return;
    }

    const success = await register(username, email, password);

    if (success) {
      router.push("/dashboard/account");
    }
  };

  if (!loadingSettings && !registrationEnabled) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl bg-white border-[3px] border-black p-8 text-center shadow-[6px_6px_0_0_#000]">
          <h1 className="text-2xl font-black text-black mb-3">
            {t("registration_disabled")}
          </h1>
          <p className="text-gray-600 mb-6">
            {t("registration_disabled_desc")}
          </p>
          <Link
            href="/login"
            className="inline-block border-[3px] border-black bg-brutal-yellow px-4 py-2 font-bold text-black"
          >
            {t("go_to_login")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
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
            {t("hero_title_1")}
            <br />
            {t("hero_title_2")} <span className="text-brutal-pink">{t("hero_title_3")}</span>
          </h1>

          <p className="text-gray-600 text-lg">
            {t("hero_desc")}
          </p>

          {/* Benefits */}
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
              <div className="w-10 h-10 bg-brutal-pink border-[2px] border-black flex items-center justify-center">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-black font-bold">{t("welcome_bonus")}</h3>
                <p className="text-gray-500 text-sm">
                  {t("welcome_bonus_desc")}
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
              <div className="w-10 h-10 bg-brutal-blue border-[2px] border-black flex items-center justify-center">
                <Clock className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="text-black font-bold">{t("fast_247")}</h3>
                <p className="text-gray-500 text-sm">
                  {t("fast_247_desc")}
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Side - Register Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="bg-white border-[3px] border-black p-6 md:p-8 shadow-[6px_6px_0_0_#000]">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-brutal-yellow border-[3px] border-black flex items-center justify-center shadow-[3px_3px_0_0_#000]">
                <Zap className="w-5 h-5 text-black" fill="currentColor" />
              </div>
              <span className="text-xl font-black text-black">
                {siteName}
              </span>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-black mb-2">
                {t("title")}
              </h2>
              <p className="text-gray-500">
                {t("subtitle")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                id="username"
                label={t("username")}
                type="text"
                placeholder="yourname"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={3}
                maxLength={50}
                required
                disabled={isLoading}
                icon={<User className="h-5 w-5" />}
                autoComplete="username"
              />

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
                  placeholder={t("password_hint")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                  disabled={isLoading}
                  icon={<Lock className="h-5 w-5" />}
                  autoComplete="new-password"
                />
                <p className="text-xs text-gray-500">
                  {t("password_hint")}
                </p>
              </div>

              <div className="space-y-1.5">
                <Input
                  id="confirmPassword"
                  label={t("confirm_password")}
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  icon={
                    <CheckCircle
                      className={`h-5 w-5 transition-colors ${password &&
                          confirmPassword &&
                          password === confirmPassword
                          ? "text-brutal-green"
                          : "text-gray-400"
                        }`}
                    />
                  }
                  errorText={passwordError}
                  className={
                    passwordError ? "border-brutal-pink bg-brutal-pink/10" : ""
                  }
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-black text-white hover:bg-gray-800"
                disabled={isLoading || !!passwordError}
                isLoading={isLoading}
                size="lg"
              >
                {!isLoading && (
                  <>
                    {t("register_button")} <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-500">
                {t("already_have_account")}{" "}
                <Link
                  href="/login"
                  className="text-brutal-pink hover:text-brutal-pink/80 font-bold transition-colors"
                >
                  {t("login_now")}
                </Link>
              </p>
            </div>

            <div className="mt-6 text-center text-xs text-gray-500">
              {t("terms_agreement")}{" "}
              <Link
                href="/terms"
                className="text-gray-700 hover:text-black font-bold transition-colors"
              >
                {t("terms")}
              </Link>{" "}
              {t("and")}{" "}
              <Link
                href="/privacy"
                className="text-gray-700 hover:text-black font-bold transition-colors"
              >
                {t("privacy_policy")}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
