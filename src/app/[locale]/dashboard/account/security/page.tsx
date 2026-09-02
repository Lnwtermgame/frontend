"use client";

import { useState, useEffect } from "react";
import { useSecurity } from "@/lib/context/security-context";
import { useAuth } from "@/lib/hooks/use-auth";
import { authApi } from "@/lib/services/auth-api";
import toast from "react-hot-toast";
import {
  Shield,
  KeyRound,
  Mail,
  Phone,
  Smartphone,
  Check,
  X,
  AlertCircle,
  Clock,
  Globe,
  Laptop,
  LogOut,
  AlertTriangle,
  CheckCircle,
  Download,
  Lock,
  Settings,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

export default function SecurityPage() {
  const t = useTranslations("Security");
  const tCommon = useTranslations("Common");
  const { user, changePassword } = useAuth();
  const {
    securitySettings,
    updateSecuritySettings,
    sendVerificationEmail,
    setupTwoFactor,
    verifyTwoFactorCode,
    disableTwoFactor,
    logoutAllDevices,
    resolveActivity,
    isLoadingSettings,
    is2FAVerified,
    generateBackupCodes,
    refreshSecurityData,
  } = useSecurity();

  // Load security data when the security page mounts (lazy loading)
  useEffect(() => {
    refreshSecurityData();
  }, [refreshSecurityData]);

  // Component state
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<
    "2fa-app" | "sms" | "email"
  >("2fa-app");
  const [twoFactorSetupData, setTwoFactorSetupData] = useState<{
    secret?: string;
    qrCodeUrl?: string;
  }>({});
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [disablePassword, setDisablePassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Password setup with OTP for OAuth users
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [otp, setOtp] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirmPassword, setSetupConfirmPassword] = useState("");
  const [isRequestingOTP, setIsRequestingOTP] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // OTP cooldown countdown (cleaned up on unmount)
  const isOtpCooldownActive = otpCooldown > 0;
  useEffect(() => {
    if (!isOtpCooldownActive) return;

    const timer = setInterval(() => {
      setOtpCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOtpCooldownActive]);

  // Handle requesting OTP for password setup
  const handleRequestOTP = async () => {
    if (!user?.email) {
      toast.error(t("error_email_not_found"));
      return;
    }

    setIsRequestingOTP(true);
    try {
      const response = await authApi.requestPasswordSetupOTP(user.email);
      if (response.success) {
        toast.success(t("change_password.otp_sent_success"));
        setOtpSent(true);
        setOtpCooldown(60); // 60 seconds cooldown (interval runs in useEffect below)
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || t("change_password.error_otp_failed"),
      );
    } finally {
      setIsRequestingOTP(false);
    }
  };

  // Handle verifying OTP and setting password
  const handleVerifyOTPAndSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.email) {
      toast.error(t("error_email_not_found"));
      return;
    }

    if (setupPassword !== setupConfirmPassword) {
      toast.error(t("change_password.match_error"));
      return;
    }

    if (setupPassword.length < 8) {
      toast.error(t("change_password.length_hint"));
      return;
    }

    if (otp.length !== 6) {
      toast.error(t("change_password.otp_label"));
      return;
    }

    setIsSettingPassword(true);
    try {
      const response = await authApi.verifyPasswordSetupOTP(
        user.email,
        otp,
        setupPassword,
      );

      if (response.success) {
        toast.success(t("change_password.success_setup"));
        setShowPasswordSetup(false);
        setOtp("");
        setSetupPassword("");
        setSetupConfirmPassword("");
        setOtpSent(false);

        // Refresh user data to get updated authProvider
        window.location.reload();
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || t("change_password.error_setup_failed"),
      );
    } finally {
      setIsSettingPassword(false);
    }
  };

  // Check if user is OAuth-only (no password)
  const isOAuthOnly =
    user?.authProvider === "google" || user?.authProvider === "discord";
  const isHybrid = user?.authProvider === "hybrid";

  // Handle setting up 2FA
  const handleSetup2FA = async () => {
    const result = await setupTwoFactor(twoFactorMethod);

    if (result.success) {
      setTwoFactorSetupData({
        secret: result.secret,
        qrCodeUrl: result.qrCodeUrl,
      });
    }
  };

  // Handle verifying 2FA code
  const handleVerify2FA = async () => {
    setVerificationError("");

    const isValid = await verifyTwoFactorCode(twoFactorCode);

    if (isValid) {
      setShowTwoFactorSetup(false);
      setTwoFactorCode("");

      // Show backup codes
      const codes = await generateBackupCodes();
      setBackupCodes(codes);
      setShowBackupCodes(true);
    } else {
      setVerificationError("Invalid verification code. Please try again.");
    }
  };

  // Handle disabling 2FA
  const handleDisable2FA = async () => {
    const isValid = await disableTwoFactor(disablePassword);

    if (isValid) {
      setShowPasswordInput(false);
      setDisablePassword("");
    } else {
      setVerificationError("Incorrect password. Please try again.");
    }
  };

  // Handle change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error(t("change_password.match_error"));
      return;
    }

    if (newPassword.length < 8) {
      toast.error(t("change_password.length_hint"));
      return;
    }

    setIsChangingPassword(true);
    try {
      const success = await changePassword(currentPassword, newPassword);

      if (success) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowChangePassword(false);
      }
    } catch (err) {
      console.error("[ChangePassword] Error:", err);
      toast.error(t("change_password.error_change_failed"));
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div>
      <SectionHeader level={1} title={t("title")} sublabel={t("subtitle")} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        {/* Left Column (2/3 width on large screens) */}
        <div className="xl:col-span-2 space-y-6">
          {/* Change Password */}
          <div className="site-card overflow-hidden">
            <div className="p-4 border-b border-site-border-soft">
              <h2 className="text-base font-bold text-site-text flex items-center">
                <KeyRound size={18} className="text-site-accent mr-2" />
                {isOAuthOnly ? t("change_password.setup_title") : t("change_password.title")}
              </h2>
            </div>

            <div className="p-6">
              {/* OAuth-only user: Show password setup with OTP */}
              {isOAuthOnly ? (
                showPasswordSetup ? (
                  <form
                    onSubmit={handleVerifyOTPAndSetPassword}
                    className="space-y-4"
                  >
                    {!otpSent ? (
                      <div className="text-center py-6">
                        <p className="text-sm text-site-muted mb-6">
                          {t("change_password.oauth_notice", {
                            provider: user?.authProvider === "google" ? "Google" : "Discord"
                          })}
                          <br />
                          {t("change_password.request_otp")} <span className="text-site-text font-medium">{user?.email}</span>
                        </p>
                        <button
                          type="button"
                          onClick={handleRequestOTP}
                          disabled={isRequestingOTP || otpCooldown > 0}
                          className="w-full py-2.5 px-4 bg-site-accent text-site-bg rounded-6 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm transition-colors"
                        >
                          {isRequestingOTP ? (
                            <>
                              <div className="w-4 h-4 border-2 border-site-bg/30 border-t-site-bg rounded-full animate-spin"></div>
                              {tCommon("loading")}
                            </>
                          ) : otpCooldown > 0 ? (
                            t("change_password.otp_wait", { seconds: otpCooldown })
                          ) : (
                            t("change_password.request_otp")
                          )}
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="bg-status-success/10 border border-status-success/20 p-4 rounded-6 mb-6">
                          <p className="text-sm text-status-success flex items-center gap-2">
                            <CheckCircle size={16} />
                            {t("change_password.otp_sent_success")} <span className="font-bold">{user?.email}</span>
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm text-site-muted mb-2">
                            {t("change_password.otp_label")}
                          </label>
                          <input
                            type="text"
                            value={otp}
                            onChange={(e) =>
                              setOtp(
                                e.target.value.replace(/\D/g, "").slice(0, 6),
                              )
                            }
                            placeholder="123456"
                            className="w-full p-3 site-input text-base text-center tracking-[0.5em]"
                            required
                            maxLength={6}
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-site-muted mb-2">
                            {t("change_password.new_label")}
                          </label>
                          <input
                            type="password"
                            value={setupPassword}
                            onChange={(e) => setSetupPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full p-3 site-input text-sm"
                            required
                            minLength={8}
                          />
                          <p className="text-[11px] text-site-dim mt-2">
                            {t("change_password.length_hint")}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm text-site-muted mb-2">
                            {t("change_password.setup_confirm_label")}
                          </label>
                          <input
                            type="password"
                            value={setupConfirmPassword}
                            onChange={(e) =>
                              setSetupConfirmPassword(e.target.value)
                            }
                            placeholder="••••••••"
                            className="w-full p-3 site-input text-sm"
                            required
                          />
                        </div>

                        <div className="flex flex-col md:flex-row gap-3 pt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setShowPasswordSetup(false);
                              setOtp("");
                              setSetupPassword("");
                              setSetupConfirmPassword("");
                              setOtpSent(false);
                            }}
                            className="flex-1 py-3 px-4 bg-site-surface text-site-text border border-site-border-soft rounded-6 hover:bg-site-raised transition-colors order-2 md:order-1 text-sm font-bold"
                          >
                            {t("change_password.button_cancel")}
                          </button>
                          <button
                            type="submit"
                            disabled={
                              isSettingPassword ||
                              otp.length !== 6 ||
                              !setupPassword ||
                              !setupConfirmPassword
                            }
                            className="flex-1 py-3 px-4 bg-site-accent text-site-bg rounded-6 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors order-1 md:order-2 text-sm"
                          >
                            {isSettingPassword ? (
                              <>
                                <div className="w-4 h-4 border-2 border-site-bg/30 border-t-site-bg rounded-full animate-spin"></div>
                                {t("change_password.button_saving")}
                              </>
                            ) : (
                              t("change_password.button_setup")
                            )}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleRequestOTP}
                          disabled={isRequestingOTP || otpCooldown > 0}
                          className="w-full py-3 text-sm text-site-accent hover:text-site-accent-hover disabled:opacity-50 disabled:text-site-dim transition-colors"
                        >
                          {otpCooldown > 0
                            ? t("change_password.otp_wait", { seconds: otpCooldown })
                            : t("change_password.resend_otp")}
                        </button>
                      </>
                    )}
                  </form>
                ) : (
                  <div>
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-10 h-10 rounded-6 bg-site-accent/10 flex items-center justify-center flex-shrink-0">
                        <KeyRound className="text-site-accent" size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-site-text mb-1 md:text-base text-sm">
                          {t("change_password.setup_title")}
                        </h3>
                        <p className="text-sm text-site-muted">
                          {t("change_password.oauth_notice", {
                            provider: user?.authProvider === "google" ? "Google" : "Discord"
                          })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPasswordSetup(true)}
                      className="w-full py-3 px-4 bg-site-accent text-site-bg rounded-6 font-bold transition-colors text-sm"
                    >
                      {t("change_password.button_setup")}
                    </button>
                  </div>
                )
              ) : showChangePassword ? (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm text-site-muted mb-2">
                      {t("change_password.current_label")}
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-3 site-input text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-site-muted mb-2">
                      {t("change_password.new_label")}
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-3 site-input text-sm"
                      required
                      minLength={8}
                    />
                    <p className="text-[11px] text-site-dim mt-2">
                      {t("change_password.length_hint")}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm text-site-muted mb-2">
                      {t("change_password.confirm_label")}
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-3 site-input text-sm"
                      required
                    />
                  </div>

                  <div className="flex flex-col md:flex-row gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowChangePassword(false);
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                      className="flex-1 py-3 px-4 bg-site-surface text-site-text border border-site-border-soft rounded-6 hover:bg-site-raised transition-colors order-2 md:order-1 text-sm font-bold"
                    >
                      {t("change_password.button_cancel")}
                    </button>
                    <button
                      type="submit"
                      disabled={
                        isChangingPassword ||
                        !currentPassword ||
                        !newPassword ||
                        !confirmPassword
                      }
                      className="flex-1 py-3 px-4 bg-site-accent text-site-bg rounded-6 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors order-1 md:order-2 text-sm"
                    >
                      {isChangingPassword ? (
                        <>
                          <div className="w-4 h-4 border-2 border-site-bg/30 border-t-site-bg rounded-full animate-spin"></div>
                          {t("change_password.button_saving")}
                        </>
                      ) : (
                        t("change_password.button_change")
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-10 h-10 rounded-6 bg-site-accent/10 flex items-center justify-center flex-shrink-0">
                      <KeyRound className="text-site-accent" size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-site-text mb-1 md:text-base text-sm">
                        {t("change_password.title")}
                      </h3>
                      <p className="text-sm text-site-muted">
                        {t("change_password.length_hint")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowChangePassword(true)}
                    className="w-full py-3 px-4 bg-site-surface text-site-text border border-site-border-soft rounded-6 hover:bg-site-raised hover:text-site-accent transition-colors text-sm font-bold"
                  >
                    {t("change_password.button_change")}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Two-Factor Authentication (Coming Soon) */}
          <div className="site-card overflow-hidden opacity-60">
            <div className="p-4 border-b border-site-border-soft flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-0">
              <h2 className="text-base font-bold text-site-text flex items-center">
                <Smartphone size={18} className="text-site-accent mr-2" />
                {t("two_factor.title")}
              </h2>
              <Badge variant="neutral">{t("two_factor.coming_soon")}</Badge>
            </div>

            <div className="p-6 pointer-events-none">
              <p className="text-site-muted mb-4 text-sm">
                {t("two_factor.subtitle")}
              </p>
              <button
                disabled
                className="w-full py-3 px-4 bg-site-surface text-site-dim border border-site-border-soft rounded-6 font-bold cursor-not-allowed text-sm"
              >
                {t("two_factor.setup_button")}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width on large screens) */}
        <div className="xl:col-span-1 space-y-6">
          {/* Additional Settings */}
          <div className="site-card overflow-hidden">
            <div className="p-4 border-b border-site-border-soft">
              <h2 className="text-base font-bold text-site-text flex items-center">
                <Settings size={18} className="text-site-accent mr-2" />
                {t("additional_settings.title")}
              </h2>
            </div>

            <div className="divide-y divide-site-border-soft">
              {/* Login Notifications */}
              <div className="p-4 flex flex-col justify-between items-start gap-4">
                <div>
                  <h3 className="font-bold text-site-text text-sm">
                    {t("additional_settings.login_notifications")}
                  </h3>
                  <p className="text-sm text-site-muted mt-1">
                    {t("additional_settings.login_notifications_desc")}
                  </p>
                </div>
                <div className="self-end mt-2 md:mt-0">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.loginNotifications}
                      onChange={() =>
                        updateSecuritySettings({
                          loginNotifications:
                            !securitySettings.loginNotifications,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-site-surface border border-site-border-soft rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-site-bg after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-site-muted peer-checked:after:bg-site-bg after:border-site-muted after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-site-accent peer-checked:border-site-accent"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Devices */}
          <div className="site-card overflow-hidden">
            <div className="p-4 border-b border-site-border-soft flex flex-col justify-between items-start gap-3">
              <h2 className="text-base font-bold text-site-text flex items-center">
                <Laptop size={18} className="text-site-accent mr-2" />
                {t("recent_devices.title")}
              </h2>
              <button
                onClick={logoutAllDevices}
                disabled={isLoadingSettings}
                className="w-full justify-center text-xs text-site-bg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 font-bold border border-site-accent/50 p-2.5 bg-site-accent rounded-6 transition-colors"
              >
                {isLoadingSettings ? (
                  <>
                    <div className="w-3 h-3 border-2 border-site-bg/30 border-t-site-bg rounded-full animate-spin"></div>
                    {t("recent_devices.processing")}
                  </>
                ) : (
                  <>
                    <LogOut size={14} />
                    {t("recent_devices.logout_all")}
                  </>
                )}
              </button>
            </div>

            <div className="divide-y divide-site-border-soft max-h-[300px] overflow-y-auto custom-scrollbar">
              {securitySettings.recentDevices.map((device) => (
                <div key={device.id} className="p-4 flex flex-col gap-3 hover:bg-site-raised transition-colors">
                  <div className="flex gap-3 w-full items-start">
                    <div className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-6 bg-site-surface border border-site-border-soft flex items-center justify-center">
                      {device.os.toLowerCase().includes("windows") && (
                        <Laptop className="text-site-accent" size={16} />
                      )}
                      {device.os.toLowerCase().includes("ios") && (
                        <Smartphone className="text-site-accent" size={16} />
                      )}
                      {!device.os.toLowerCase().includes("windows") && !device.os.toLowerCase().includes("ios") && (
                        <Globe className="text-site-accent" size={16} />
                      )}
                    </div>
                    <div className="w-full">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-site-text text-sm">
                          {device.name}
                        </h3>
                        <div className="flex text-[10px] text-site-dim gap-1.5 font-mono">
                          <span>{device.browser}</span>
                          <span>•</span>
                          <span>{device.os}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 mt-1.5 text-xs text-site-muted">
                        <div className="flex items-center gap-1.5">
                          <Globe size={12} className="opacity-70" />
                          {device.location}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="opacity-70" />
                          {new Date(device.lastActive).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Full width row for Suspicious Activity */}
        {securitySettings.suspiciousActivities.length > 0 && (
          <div className="xl:col-span-3 site-card overflow-hidden">
            <div className="p-4 border-b border-site-border-soft flex items-center">
              <AlertTriangle size={18} className="text-status-danger mr-2" />
              <h2 className="text-base font-bold text-site-text">
                {t("suspicious_activity.title")}
              </h2>
            </div>

            <div className="divide-y divide-site-border-soft">
              {securitySettings.suspiciousActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="p-4 md:p-5 hover:bg-site-raised transition-colors"
                >
                  <div className="flex gap-3 md:gap-4 items-start">
                    {/* Icon Column */}
                    <div className="flex-shrink-0 mt-0.5">
                      <div
                        className={`w-10 h-10 rounded-6 flex items-center justify-center ${activity.suspicious && !activity.resolved
                          ? "bg-status-danger/10 text-status-danger border border-status-danger/20"
                          : "bg-status-success/10 text-status-success border border-status-success/20"
                          }`}
                      >
                        {activity.suspicious && !activity.resolved ? (
                          <AlertTriangle size={20} />
                        ) : (
                          <CheckCircle size={20} />
                        )}
                      </div>
                    </div>

                    {/* Content Column */}
                    <div className="flex-grow min-w-0">
                      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-3 md:gap-4">
                        <div className="flex-grow">
                          <h3 className="font-bold text-site-text text-sm md:text-base leading-snug">
                            {activity.description}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs text-site-muted">
                            <span className="flex items-center gap-1.5">
                              <Clock size={14} className="opacity-70" />
                              {new Date(activity.timestamp).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Globe size={14} className="opacity-70" />
                              {activity.location === "Admin Panel"
                                ? t("suspicious_activity.admin_location")
                                : activity.location}
                            </span>
                            <span className="flex items-center gap-1.5 font-mono bg-site-surface px-2 py-0.5 rounded-4 border border-site-border-soft text-xs text-site-text">
                              <div className="w-1.5 h-1.5 rounded-full bg-site-accent"></div>
                              {activity.ip}
                            </span>
                          </div>
                        </div>

                        {/* Status/Action Column */}
                        <div className="flex-shrink-0 mt-2 xl:mt-0">
                          {activity.suspicious && !activity.resolved ? (
                            <button
                              onClick={() => resolveActivity(activity.id)}
                              className="w-full xl:w-auto text-sm font-bold bg-site-surface text-site-text border border-site-border-soft rounded-6 px-4 py-2 hover:bg-site-accent hover:text-site-bg hover:border-site-accent transition-colors flex items-center justify-center gap-2"
                            >
                              <Check size={16} />
                              {t("suspicious_activity.confirm_button")}
                            </button>
                          ) : (
                            <Badge variant="success">
                              <CheckCircle size={12} className="mr-1" />
                              {t("suspicious_activity.resolved_badge")}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
