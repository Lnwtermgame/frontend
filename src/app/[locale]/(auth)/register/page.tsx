"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
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
      <div className="flex min-h-screen items-center justify-center bg-site-bg px-4 py-12">
        <div className="w-full max-w-[400px] mx-auto site-card p-6 text-center">
          <h1 className="text-xl font-bold text-site-text mb-2">
            {t("registration_disabled")}
          </h1>
          <p className="text-sm text-site-muted mb-5">
            {t("registration_disabled_desc")}
          </p>
          <Link
            href="/login"
            className="site-btn inline-block"
          >
            {t("go_to_login")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-site-bg px-4 py-4 lg:py-12">
      <div className="w-full max-w-[440px] mx-auto">
        <div className="site-card p-6">
          {/* Header */}
          <div className="mb-6 text-center">
            <p className="text-lg font-bold text-site-text">{siteName}</p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-site-text">
              {t("title")}
            </h2>
            <p className="mt-1 text-sm text-site-muted">
              {t("subtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              icon={<User className="h-4 w-4" />}
              autoComplete="username"
            />

            <Input
              id="email"
              label={t("email._base")}
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              icon={<Mail className="h-4 w-4" />}
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
                icon={<Lock className="h-4 w-4" />}
                autoComplete="new-password"
              />
              <p className="text-[12px] text-site-muted">
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
                    className={`h-4 w-4 transition-colors ${password &&
                      confirmPassword &&
                      password === confirmPassword
                        ? "text-status-success"
                        : "text-site-dim"
                      }`}
                  />
                }
                errorText={passwordError}
                className={
                  passwordError ? "border-status-danger focus-visible:border-status-danger focus-visible:ring-status-danger/20" : ""
                }
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !!passwordError}
              isLoading={isLoading}
              fullWidth
              size="lg"
            >
              {!isLoading && (
                <>
                  {t("register_button")} <ArrowRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-site-border-soft text-center">
            <p className="text-sm text-site-muted">
              {t("already_have_account")}{" "}
              <Link
                href="/login"
                className="font-semibold text-site-accent transition-colors hover:text-site-accent-hover"
              >
                {t("login_now")}
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center text-[12px] text-site-muted">
            {t("terms_agreement")}{" "}
            <Link
              href="/terms"
              className="text-site-muted hover:text-site-accent font-semibold transition-colors"
            >
              {t("terms")}
            </Link>{" "}
            {t("and")}{" "}
            <Link
              href="/privacy"
              className="text-site-muted hover:text-site-accent font-semibold transition-colors"
            >
              {t("privacy_policy")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
