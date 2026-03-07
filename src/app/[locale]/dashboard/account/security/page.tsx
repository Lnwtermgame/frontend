"use client";

import { useState, useEffect } from "react";
import { motion } from "@/lib/framer-exports";
import { useSecurity } from "@/lib/context/security-context";
import { useAuth } from "@/lib/hooks/use-auth";
import { authApi } from "@/lib/services/auth-api";
import toast from "react-hot-toast";
import Image from "next/image";
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
} from "lucide-react";
import { useTranslations } from "next-intl";

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
        setOtpCooldown(60); // 60 seconds cooldown

        // Start cooldown timer
        const timer = setInterval(() => {
          setOtpCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
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
    <div className="bg-transparent min-h-full">
      {/* Page Header */}
      <div className="relative mb-4">
        <motion.h2
          className="text-lg md:text-xl font-bold text-black mb-1 relative flex items-center gap-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <span className="w-1.5 h-5 md:h-6 bg-brutal-pink mr-2"></span>
          <Shield className="text-brutal-pink h-6 w-6 md:h-7 md:w-7" />
          {t("title")}
        </motion.h2>
        <p className="text-gray-600 text-xs md:text-sm relative pl-4 md:pl-0">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left Column (2/3 width on large screens) */}
        <div className="xl:col-span-2 space-y-4">
          {/* Change Password */}
          <motion.div
            className="bg-white border-[3px] border-black overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-3 bg-brutal-yellow border-b-[3px] border-black">
              <h2 className="text-base font-bold text-black">
                {isOAuthOnly ? t("change_password.setup_title") : t("change_password.title")}
              </h2>
            </div>

            <div className="p-4">
              {/* OAuth-only user: Show password setup with OTP */}
              {isOAuthOnly ? (
                showPasswordSetup ? (
                  <form
                    onSubmit={handleVerifyOTPAndSetPassword}
                    className="space-y-3"
                  >
                    {!otpSent ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-600 mb-4">
                          {t("change_password.oauth_notice", {
                            provider: user?.authProvider === "google" ? "Google" : "Discord"
                          })}
                          <br />
                          {t("change_password.request_otp")} {user?.email}
                        </p>
                        <button
                          type="button"
                          onClick={handleRequestOTP}
                          disabled={isRequestingOTP || otpCooldown > 0}
                          className="w-full py-2 px-3 bg-brutal-pink text-white border-[3px] border-black font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs"
                          style={{ boxShadow: "3px 3px 0 0 #000000" }}
                        >
                          {isRequestingOTP ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
                        <div className="bg-green-50 border-[2px] border-green-500 p-3 mb-4">
                          <p className="text-sm text-green-700">
                            ✅ {t("change_password.otp_sent_success")} {user?.email}
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1.5">
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
                            className="w-full p-2 bg-white border-[2px] border-gray-300 rounded-lg text-black focus:outline-none focus:border-black text-sm text-center tracking-widest"
                            required
                            maxLength={6}
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1.5">
                            {t("change_password.new_label")}
                          </label>
                          <input
                            type="password"
                            value={setupPassword}
                            onChange={(e) => setSetupPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full p-2 bg-white border-[2px] border-gray-300 rounded-lg text-black focus:outline-none focus:border-black text-sm"
                            required
                            minLength={8}
                          />
                          <p className="text-[10px] text-gray-500 mt-1">
                            {t("change_password.length_hint")}
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1.5">
                            {t("change_password.setup_confirm_label")}
                          </label>
                          <input
                            type="password"
                            value={setupConfirmPassword}
                            onChange={(e) =>
                              setSetupConfirmPassword(e.target.value)
                            }
                            placeholder="••••••••"
                            className="w-full p-2 bg-white border-[2px] border-gray-300 rounded-lg text-black focus:outline-none focus:border-black text-sm"
                            required
                          />
                        </div>

                        <div className="flex flex-col md:flex-row gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowPasswordSetup(false);
                              setOtp("");
                              setSetupPassword("");
                              setSetupConfirmPassword("");
                              setOtpSent(false);
                            }}
                            className="flex-1 py-2 px-3 bg-gray-200 text-gray-700 border-[2px] border-gray-300 rounded-lg hover:bg-gray-300 transition-colors order-2 md:order-1 text-xs font-bold"
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
                            className="flex-1 py-2 px-3 bg-black text-white border-[3px] border-black font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-transform order-1 md:order-2 text-xs"
                            style={{ boxShadow: "3px 3px 0 0 #000000" }}
                          >
                            {isSettingPassword ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
                          className="w-full py-2 text-xs text-gray-600 hover:text-gray-800 disabled:opacity-50"
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
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 bg-brutal-pink border-[2px] border-black flex items-center justify-center">
                        <KeyRound className="text-white" size={16} />
                      </div>
                      <div>
                        <h3 className="font-bold text-black mb-0.5 text-sm">
                          {t("change_password.setup_title")}
                        </h3>
                        <p className="text-xs text-gray-600">
                          {t("change_password.oauth_notice", {
                            provider: user?.authProvider === "google" ? "Google" : "Discord"
                          })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPasswordSetup(true)}
                      className="w-full py-2 px-3 bg-brutal-pink text-white border-[3px] border-black font-bold hover:-translate-y-0.5 transition-transform text-xs"
                      style={{ boxShadow: "3px 3px 0 0 #000000" }}
                    >
                      {t("change_password.button_setup")}
                    </button>
                  </div>
                )
              ) : showChangePassword ? (
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1.5">
                      {t("change_password.current_label")}
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-2 bg-white border-[2px] border-gray-300 rounded-lg text-black focus:outline-none focus:border-black text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1.5">
                      {t("change_password.new_label")}
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-2 bg-white border-[2px] border-gray-300 rounded-lg text-black focus:outline-none focus:border-black text-sm"
                      required
                      minLength={8}
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      {t("change_password.length_hint")}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1.5">
                      {t("change_password.confirm_label")}
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-2 bg-white border-[2px] border-gray-300 rounded-lg text-black focus:outline-none focus:border-black text-sm"
                      required
                    />
                  </div>

                  <div className="flex flex-col md:flex-row gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowChangePassword(false);
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                      className="flex-1 py-2 px-3 bg-gray-200 text-gray-700 border-[2px] border-gray-300 rounded-lg hover:bg-gray-300 transition-colors order-2 md:order-1 text-xs font-bold"
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
                      className="flex-1 py-2 px-3 bg-black text-white border-[3px] border-black font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-transform order-1 md:order-2 text-xs"
                      style={{ boxShadow: "3px 3px 0 0 #000000" }}
                    >
                      {isChangingPassword ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-brutal-blue border-[2px] border-black flex items-center justify-center">
                      <KeyRound className="text-black" size={16} />
                    </div>
                    <div>
                      <h3 className="font-bold text-black mb-0.5 text-sm">
                        {t("change_password.title")}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {t("change_password.length_hint")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowChangePassword(true)}
                    className="w-full py-2 px-3 bg-black text-white border-[3px] border-black font-bold hover:-translate-y-0.5 transition-transform text-xs"
                    style={{ boxShadow: "3px 3px 0 0 #000000" }}
                  >
                    {t("change_password.button_change")}
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Two-Factor Authentication (Coming Soon) */}
          <motion.div
            className="bg-white border-[3px] border-black overflow-hidden opacity-60"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.6, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="p-3 bg-brutal-green border-b-[3px] border-black flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-0">
              <h2 className="text-base font-bold text-black">
                {t("two_factor.title")}
              </h2>
              <span className="bg-gray-200 text-gray-600 border-[2px] border-black px-1.5 py-0.5 text-[10px] font-bold shadow-[2px_2px_0 0 #000]">
                {t("two_factor.coming_soon")}
              </span>
            </div>

            <div className="p-4 pointer-events-none">
              <div>
                <p className="text-gray-600 mb-3 text-xs">
                  {t("two_factor.subtitle")}
                </p>
                <button
                  disabled
                  className="w-full py-2 px-3 bg-gray-400 text-white border-[3px] border-gray-500 font-bold cursor-not-allowed text-xs"
                  style={{ boxShadow: "3px 3px 0 0 #999" }}
                >
                  {t("two_factor.setup_button")}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Email Verification */}
          <motion.div
            className="bg-white border-[3px] border-black overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="p-3 bg-brutal-blue border-b-[3px] border-black">
              <h2 className="text-base font-bold text-black">
                {t("email_verification.title")}
              </h2>
            </div>

            <div className="p-4">
              <div className="flex flex-col md:flex-row items-start gap-3 md:gap-4">
                <div className="mt-1 flex items-center gap-2 md:block">
                  {securitySettings.emailVerified ? (
                    <Check className="text-brutal-green" size={20} />
                  ) : (
                    <AlertCircle className="text-brutal-pink" size={20} />
                  )}
                  <h3 className="font-bold text-black md:hidden text-sm">
                    {securitySettings.emailVerified
                      ? t("email_verification.verified")
                      : t("email_verification.not_verified")}
                  </h3>
                </div>

                <div className="w-full">
                  <h3 className="font-bold text-black mb-1 hidden md:block text-sm">
                    {securitySettings.emailVerified
                      ? t("email_verification.verified")
                      : t("email_verification.not_verified")}
                  </h3>
                  <p className="text-xs text-gray-600 mb-3">
                    {securitySettings.emailVerified
                      ? t("email_verification.verified_desc")
                      : t("email_verification.not_verified_desc")}
                  </p>

                  {!securitySettings.emailVerified && (
                    <button
                      onClick={() => sendVerificationEmail()}
                      disabled={isLoadingSettings}
                      className="w-full md:w-auto py-1.5 px-3 bg-black text-white border-[2px] border-black rounded-lg text-xs hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[2px_2px_0_0_#000]"
                    >
                      {isLoadingSettings ? (
                        <>
                          <div className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          {t("email_verification.sending")}
                        </>
                      ) : (
                        t("email_verification.send_button")
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column (1/3 width on large screens) */}
        <div className="xl:col-span-1 space-y-4">
          {/* Additional Settings */}
          <motion.div
            className="bg-white border-[3px] border-black"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="p-3 bg-brutal-yellow border-b-[3px] border-black">
              <h2 className="text-base font-bold text-black">
                {t("additional_settings.title")}
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {/* Login Notifications */}
              <div className="p-3 flex flex-col justify-between items-start gap-3">
                <div>
                  <h3 className="font-bold text-black text-sm">
                    {t("additional_settings.login_notifications")}
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {t("additional_settings.login_notifications_desc")}
                  </p>
                </div>
                <div className="self-end">
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
                    <div className="relative w-12 h-6 bg-gray-200 border-[2px] border-black peer-checked:bg-brutal-green transition-colors after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-[2px] after:border-black after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-6 shadow-[2px_2px_0_0_#000]"></div>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Recent Devices */}
          <motion.div
            className="bg-white border-[3px] border-black"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <div className="p-3 bg-brutal-pink border-b-[3px] border-black flex flex-col justify-between items-start gap-2">
              <h2 className="text-base font-bold text-black">
                {t("recent_devices.title")}
              </h2>
              <button
                onClick={logoutAllDevices}
                disabled={isLoadingSettings}
                className="w-full justify-center text-xs text-black hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 font-medium border-[2px] border-black p-1.5 bg-white shadow-[2px_2px_0_0_#000]"
              >
                {isLoadingSettings ? (
                  <>
                    <div className="w-2.5 h-2.5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    {t("recent_devices.processing")}
                  </>
                ) : (
                  <>
                    <LogOut size={12} />
                    {t("recent_devices.logout_all")}
                  </>
                )}
              </button>
            </div>

            <div className="divide-y divide-gray-200 max-h-[300px] overflow-y-auto">
              {securitySettings.recentDevices.map((device) => (
                <div key={device.id} className="p-3 flex flex-col gap-2">
                  <div className="flex gap-2 w-full">
                    <div className="flex-shrink-0">
                      {device.os.toLowerCase().includes("windows") && (
                        <Laptop className="text-brutal-blue" size={20} />
                      )}
                      {device.os.toLowerCase().includes("ios") && (
                        <Smartphone className="text-brutal-blue" size={20} />
                      )}
                    </div>
                    <div className="w-full">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-black text-sm">
                          {device.name}
                        </h3>
                        {device.isCurrent ? (
                          <span className="text-[10px] bg-brutal-green border-[1px] border-black text-black px-1.5 py-0.5 font-bold">
                            {t("recent_devices.current_badge")}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-gray-600 flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                        <span>{device.browser}</span>
                        <span>•</span>
                        <span>{device.os}</span>
                      </div>
                      <div className="flex flex-col gap-0.5 mt-1.5 text-[10px] text-gray-600">
                        <div className="flex items-center gap-1">
                          <Globe size={10} />
                          {device.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(device.lastActive).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Full width row for Suspicious Activity */}
        {securitySettings.suspiciousActivities.length > 0 && (
          <motion.div
            className="xl:col-span-3 bg-white border-[3px] border-black"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <div className="p-3 bg-red-100 border-b-[3px] border-black">
              <h2 className="text-base font-bold text-black">
                {t("suspicious_activity.title")}
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {securitySettings.suspiciousActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="p-3 md:p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex gap-3 md:gap-4">
                    {/* Icon Column */}
                    <div className="flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full border-[2px] border-black flex items-center justify-center ${activity.suspicious && !activity.resolved
                            ? "bg-red-100 text-red-600"
                            : "bg-brutal-green/20 text-brutal-green"
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
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                        <div className="flex-grow">
                          <h3 className="font-bold text-black text-sm md:text-base break-words leading-tight">
                            {activity.description}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {new Date(activity.timestamp).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Globe size={14} />
                              {activity.location === "Admin Panel"
                                ? t("suspicious_activity.admin_location")
                                : activity.location}
                            </span>
                            <span className="flex items-center gap-1 font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 text-xs">
                              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                              {activity.ip}
                            </span>
                          </div>
                        </div>

                        {/* Status/Action Column */}
                        <div className="flex-shrink-0 mt-1 md:mt-0">
                          {activity.suspicious && !activity.resolved ? (
                            <button
                              onClick={() => resolveActivity(activity.id)}
                              className="w-full md:w-auto text-xs font-bold bg-white text-black border-[2px] border-black px-3 py-1.5 hover:bg-brutal-blue hover:text-white transition-all shadow-[2px_2px_0_0_#000] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2"
                            >
                              <Check size={14} />
                              {t("suspicious_activity.confirm_button")}
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] md:text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full border border-green-200 whitespace-nowrap">
                              <CheckCircle size={10} />
                              {t("suspicious_activity.resolved_badge")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
