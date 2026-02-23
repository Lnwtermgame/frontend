"use client";

import { useState, useEffect } from "react";
import { motion } from "@/lib/framer-exports";
import { useSecurity } from "@/lib/context/security-context";
import { useAuth } from "@/lib/hooks/use-auth";
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

export default function SecurityPage() {
  const { user, changePassword } = useAuth();
  const {
    securitySettings,
    updateSecuritySettings,
    sendVerificationEmail,
    setupTwoFactor,
    verifyTwoFactorCode,
    disableTwoFactor,
    logoutAllDevices,
    removeDevice,
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
      toast.error("รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร");
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
      toast.error("เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col gap-6">
        <div className="relative mb-6">
          <motion.h2
            className="text-xl md:text-2xl font-bold text-black mb-1 relative flex items-center gap-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="w-1.5 h-5 md:h-6 bg-brutal-pink mr-2"></span>
            <Shield className="text-brutal-pink h-6 w-6 md:h-7 md:w-7" />
            Security Settings
          </motion.h2>
          <p className="text-gray-600 text-sm md:text-base relative thai-font pl-4 md:pl-0">
            จัดการความปลอดภัยของบัญชีและการตั้งค่าความเป็นส่วนตัวของคุณ
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Change Password */}
          <div
            className="bg-white border-[3px] border-black overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="p-4 bg-brutal-yellow border-b-[3px] border-black">
              <h2 className="text-lg font-bold text-black thai-font">
                เปลี่ยนรหัสผ่าน
              </h2>
            </div>

            <div className="p-4 md:p-6">
              {showChangePassword ? (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2 thai-font">
                      รหัสผ่านปัจจุบัน
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-2.5 bg-white border-[2px] border-gray-300 rounded-lg text-black focus:outline-none focus:border-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-2 thai-font">
                      รหัสผ่านใหม่
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-2.5 bg-white border-[2px] border-gray-300 rounded-lg text-black focus:outline-none focus:border-black"
                      required
                      minLength={8}
                    />
                    <p className="text-xs text-gray-500 mt-1 thai-font">
                      รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-2 thai-font">
                      ยืนยันรหัสผ่านใหม่
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-2.5 bg-white border-[2px] border-gray-300 rounded-lg text-black focus:outline-none focus:border-black"
                      required
                    />
                  </div>

                  <div className="flex flex-col md:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowChangePassword(false);
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                      className="flex-1 py-2.5 px-4 bg-gray-200 text-gray-700 border-[2px] border-gray-300 rounded-lg hover:bg-gray-300 transition-colors thai-font order-2 md:order-1"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={
                        isChangingPassword ||
                        !currentPassword ||
                        !newPassword ||
                        !confirmPassword
                      }
                      className="flex-1 py-2.5 px-4 bg-black text-white border-[3px] border-black font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 thai-font hover:-translate-y-0.5 transition-transform order-1 md:order-2"
                      style={{ boxShadow: "3px 3px 0 0 #000000" }}
                    >
                      {isChangingPassword ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          กำลังบันทึก...
                        </>
                      ) : (
                        "เปลี่ยนรหัสผ่าน"
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-brutal-blue border-[2px] border-black flex items-center justify-center">
                      <KeyRound className="text-black" size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-black mb-1 thai-font">
                        อัปเดตรหัสผ่าน
                      </h3>
                      <p className="text-sm text-gray-600 thai-font">
                        เปลี่ยนรหัสผ่านของคุณเพื่อความปลอดภัยที่ดีขึ้น
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowChangePassword(true)}
                    className="w-full py-2.5 px-4 bg-black text-white border-[3px] border-black font-bold hover:-translate-y-0.5 transition-transform thai-font"
                    style={{ boxShadow: "3px 3px 0 0 #000000" }}
                  >
                    เปลี่ยนรหัสผ่าน
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Two-Factor Authentication (Coming Soon) */}
          <div
            className="bg-white border-[3px] border-black overflow-hidden opacity-60"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="p-4 bg-brutal-green border-b-[3px] border-black flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-0">
              <h2 className="text-lg font-bold text-black thai-font">
                การยืนยันตัวตนสองขั้นตอน
              </h2>
              <span className="bg-gray-200 text-gray-600 border-[2px] border-black px-2 py-1 text-xs font-bold thai-font shadow-[2px_2px_0_0_#000]">
                เร็วๆ นี้
              </span>
            </div>

            <div className="p-4 md:p-6 pointer-events-none">
              <div>
                <p className="text-gray-600 mb-4 thai-font">
                  การยืนยันตัวตนสองขั้นตอนเพิ่มความปลอดภัยอีกชั้นให้กับบัญชีของคุณ
                  โดยต้องใช้รหัสยืนยันเสริมนอกเหนือจากรหัสผ่าน
                </p>
                <button
                  disabled
                  className="w-full py-2 px-4 bg-gray-400 text-white border-[3px] border-gray-500 font-bold cursor-not-allowed thai-font"
                  style={{ boxShadow: "3px 3px 0 0 #999" }}
                >
                  ตั้งค่าการยืนยันตัวตนสองขั้นตอน
                </button>
              </div>
            </div>
          </div>

          {/* Original Two-Factor Authentication (disabled) */}
          {false && (
            <div
              className="bg-white border-[3px] border-black overflow-hidden"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
            >
              <div className="p-4 bg-brutal-green border-b-[3px] border-black flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-0">
                <h2 className="text-lg font-bold text-black thai-font">
                  การยืนยันตัวตนสองขั้นตอน
                </h2>
                {securitySettings.twoFactorEnabled && (
                  <span className="bg-brutal-green text-black border-[2px] border-black px-2 py-1 text-xs font-bold thai-font shadow-[2px_2px_0_0_#000]">
                    เปิดใช้งานแล้ว
                  </span>
                )}
              </div>

              <div className="p-4 md:p-6">
                {securitySettings.twoFactorEnabled ? (
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row items-start gap-3 md:gap-4">
                      {securitySettings.twoFactorMethod === "2fa-app" && (
                        <Smartphone
                          className="text-brutal-blue mt-1 hidden md:block"
                          size={32}
                        />
                      )}
                      {securitySettings.twoFactorMethod === "sms" && (
                        <Phone
                          className="text-brutal-blue mt-1 hidden md:block"
                          size={32}
                        />
                      )}
                      {securitySettings.twoFactorMethod === "email" && (
                        <Mail
                          className="text-brutal-blue mt-1 hidden md:block"
                          size={32}
                        />
                      )}

                      {/* Mobile icon inline with title */}
                      <div className="w-full">
                        <h3 className="font-bold text-black mb-1 thai-font flex items-center gap-2">
                          <span className="md:hidden">
                            {securitySettings.twoFactorMethod === "2fa-app" && (
                              <Smartphone
                                className="text-brutal-blue"
                                size={20}
                              />
                            )}
                            {securitySettings.twoFactorMethod === "sms" && (
                              <Phone className="text-brutal-blue" size={20} />
                            )}
                            {securitySettings.twoFactorMethod === "email" && (
                              <Mail className="text-brutal-blue" size={20} />
                            )}
                          </span>
                          {securitySettings.twoFactorMethod === "2fa-app" &&
                            "แอพ Authenticator"}
                          {securitySettings.twoFactorMethod === "sms" &&
                            "ยืนยันผ่าน SMS"}
                          {securitySettings.twoFactorMethod === "email" &&
                            "ยืนยันผ่านอีเมล"}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 thai-font">
                          {securitySettings.twoFactorMethod === "2fa-app" &&
                            "คุณกำลังใช้งานแอพ Authenticator ในการสร้างรหัสยืนยัน"}
                          {securitySettings.twoFactorMethod === "sms" &&
                            "คุณกำลังรับข้อความ SMS พร้อมรหัสยืนยัน"}
                          {securitySettings.twoFactorMethod === "email" &&
                            "คุณกำลังรับอีเมลพร้อมรหัสยืนยัน"}
                        </p>

                        <div className="flex flex-col md:flex-row gap-3 md:gap-4 md:items-center">
                          <button
                            onClick={async () => {
                              const codes = await generateBackupCodes();
                              setBackupCodes(codes);
                              setShowBackupCodes(true);
                            }}
                            className="text-sm text-black underline font-medium thai-font text-left"
                          >
                            รับรหัสสำรอง
                          </button>
                          <span className="text-gray-400 hidden md:inline">
                            •
                          </span>
                          <button
                            onClick={() => setShowPasswordInput(true)}
                            className="text-sm text-red-600 underline font-medium thai-font text-left"
                          >
                            ปิดการใช้งาน 2FA
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Password input for disabling 2FA */}
                    {showPasswordInput && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border-[2px] border-red-500 bg-red-50 rounded-lg p-4 mt-4"
                      >
                        <h4 className="text-black font-bold mb-2 flex items-center gap-2 thai-font">
                          <AlertCircle size={18} className="text-red-600" />
                          ยืนยันด้วยรหัสผ่านของคุณ
                        </h4>
                        <p className="text-sm text-gray-600 mb-3 thai-font">
                          การปิดใช้งานการยืนยันตัวตนสองขั้นตอนจะทำให้บัญชีของคุณมีความปลอดภัยลดลง
                        </p>

                        <div className="flex flex-col gap-4">
                          <input
                            type="password"
                            value={disablePassword}
                            onChange={(e) => setDisablePassword(e.target.value)}
                            placeholder="กรอกรหัสผ่านของคุณ"
                            className="w-full p-2 bg-white border-[2px] border-gray-300 rounded-lg text-black focus:outline-none focus:border-black thai-font"
                          />

                          {verificationError && (
                            <p className="text-sm text-red-600">
                              {verificationError}
                            </p>
                          )}

                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setShowPasswordInput(false);
                                setDisablePassword("");
                                setVerificationError("");
                              }}
                              className="px-3 py-1.5 bg-gray-200 text-gray-700 border-[2px] border-gray-300 rounded-lg hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleDisable2FA}
                              disabled={!disablePassword || isLoadingSettings}
                              className="px-3 py-1.5 bg-red-600 text-white border-[2px] border-black rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              {isLoadingSettings ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                  Processing...
                                </>
                              ) : (
                                "Disable 2FA"
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : showTwoFactorSetup ? (
                  <div className="space-y-6">
                    {/* Step 1: Choose 2FA method */}
                    {!twoFactorSetupData.secret && (
                      <div>
                        <h3 className="font-bold text-black mb-3 thai-font">
                          เลือกวิธีการยืนยันตัวตน
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                          <button
                            onClick={() => setTwoFactorMethod("2fa-app")}
                            className={`p-3 border-[2px] flex flex-col items-center ${
                              twoFactorMethod === "2fa-app"
                                ? "border-black bg-brutal-blue"
                                : "border-gray-300 hover:border-black"
                            }`}
                          >
                            <Smartphone
                              size={24}
                              className={
                                twoFactorMethod === "2fa-app"
                                  ? "text-black"
                                  : "text-gray-600"
                              }
                            />
                            <span
                              className={`text-sm mt-2 thai-font ${twoFactorMethod === "2fa-app" ? "text-black font-bold" : "text-gray-600"}`}
                            >
                              แอพ Authenticator
                            </span>
                          </button>

                          <button
                            onClick={() => setTwoFactorMethod("sms")}
                            className={`p-3 border-[2px] flex flex-col items-center ${
                              twoFactorMethod === "sms"
                                ? "border-black bg-brutal-blue"
                                : "border-gray-300 hover:border-black"
                            }`}
                          >
                            <Phone
                              size={24}
                              className={
                                twoFactorMethod === "sms"
                                  ? "text-black"
                                  : "text-gray-600"
                              }
                            />
                            <span
                              className={`text-sm mt-2 thai-font ${twoFactorMethod === "sms" ? "text-black font-bold" : "text-gray-600"}`}
                            >
                              SMS
                            </span>
                          </button>

                          <button
                            onClick={() => setTwoFactorMethod("email")}
                            className={`p-3 border-[2px] flex flex-col items-center ${
                              twoFactorMethod === "email"
                                ? "border-black bg-brutal-blue"
                                : "border-gray-300 hover:border-black"
                            }`}
                          >
                            <Mail
                              size={24}
                              className={
                                twoFactorMethod === "email"
                                  ? "text-black"
                                  : "text-gray-600"
                              }
                            />
                            <span
                              className={`text-sm mt-2 thai-font ${twoFactorMethod === "email" ? "text-black font-bold" : "text-gray-600"}`}
                            >
                              อีเมล
                            </span>
                          </button>
                        </div>

                        <button
                          onClick={handleSetup2FA}
                          disabled={isLoadingSettings}
                          className="w-full py-2 px-4 bg-black text-white border-[3px] border-black font-bold hover:-translate-y-0.5 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 thai-font"
                          style={{ boxShadow: "3px 3px 0 0 #000000" }}
                        >
                          {isLoadingSettings ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              กำลังตั้งค่า...
                            </>
                          ) : (
                            "ดำเนินการต่อ"
                          )}
                        </button>
                      </div>
                    )}

                    {/* Step 2: Set up based on method */}
                    {twoFactorSetupData.secret &&
                      twoFactorMethod === "2fa-app" && (
                        <div>
                          <h3 className="font-bold text-black mb-3 thai-font">
                            ตั้งค่าแอพ Authenticator
                          </h3>
                          <ol className="space-y-4 mb-6">
                            <li className="flex gap-3">
                              <span className="flex-shrink-0 w-6 h-6 bg-brutal-blue border-[2px] border-black text-black flex items-center justify-center text-sm font-bold">
                                1
                              </span>
                              <div>
                                <p className="text-gray-600 thai-font">
                                  ติดตั้งแอพ Authenticator เช่น Google
                                  Authenticator, Authy หรือ Microsoft
                                  Authenticator
                                </p>
                              </div>
                            </li>

                            <li className="flex gap-3">
                              <span className="flex-shrink-0 w-6 h-6 bg-brutal-blue border-[2px] border-black text-black flex items-center justify-center text-sm font-bold">
                                2
                              </span>
                              <div>
                                <p className="text-gray-600 mb-3 thai-font">
                                  สแกน QR Code นี้ด้วยแอพ Authenticator ของคุณ
                                </p>
                                <div className="bg-white p-4 border-[2px] border-black inline-block">
                                  {twoFactorSetupData.qrCodeUrl && (
                                    <Image
                                      src={
                                        twoFactorSetupData.qrCodeUrl as string
                                      }
                                      alt="Two-Factor Authentication QR Code"
                                      width={150}
                                      height={150}
                                    />
                                  )}
                                </div>
                              </div>
                            </li>

                            <li className="flex gap-3">
                              <span className="flex-shrink-0 w-6 h-6 bg-brutal-blue border-[2px] border-black text-black flex items-center justify-center text-sm font-bold">
                                3
                              </span>
                              <div>
                                <p className="text-gray-600 thai-font">
                                  หรือกรอกรหัสนี้ลงในแอพของคุณด้วยตนเอง:
                                </p>
                                <div className="font-mono text-black bg-gray-100 border-[2px] border-black py-1 px-2 mt-1 text-center">
                                  {twoFactorSetupData.secret}
                                </div>
                              </div>
                            </li>

                            <li className="flex gap-3">
                              <span className="flex-shrink-0 w-6 h-6 bg-brutal-blue border-[2px] border-black text-black flex items-center justify-center text-sm font-bold">
                                4
                              </span>
                              <div>
                                <p className="text-gray-600 mb-2 thai-font">
                                  กรอกรหัส 6 หลักจากแอพ Authenticator ของคุณ
                                </p>
                                <input
                                  type="text"
                                  value={twoFactorCode}
                                  onChange={(e) =>
                                    setTwoFactorCode(
                                      e.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 6),
                                    )
                                  }
                                  placeholder="000000"
                                  className="w-full md:w-40 p-2 bg-white border-[2px] border-gray-300 rounded-lg text-black focus:outline-none focus:border-black text-center font-mono"
                                />

                                {verificationError && (
                                  <p className="text-sm text-red-600 mt-2">
                                    {verificationError}
                                  </p>
                                )}
                              </div>
                            </li>
                          </ol>
                        </div>
                      )}

                    {twoFactorSetupData.secret && twoFactorMethod === "sms" && (
                      <div>
                        <h3 className="font-bold text-black mb-3 thai-font">
                          ตั้งค่าการยืนยันผ่าน SMS
                        </h3>
                        <div className="space-y-4 mb-6">
                          <div>
                            <label className="block text-sm text-gray-600 mb-2 thai-font">
                              เบอร์โทรศัพท์ของคุณ
                            </label>
                            <input
                              type="tel"
                              placeholder="+66 XX XXX XXXX"
                              className="w-full p-2 bg-white border-[2px] border-gray-300 rounded-lg text-black focus:outline-none focus:border-black"
                              readOnly
                              value="+66 XX XXX XX89"
                            />
                            <p className="text-xs text-gray-500 mt-1 thai-font">
                              นี่คือเบอร์โทรศัพท์ที่ผูกกับบัญชีของคุณ
                            </p>
                          </div>

                          <div>
                            <p className="text-gray-600 mb-2 thai-font">
                              เราได้ส่งรหัส 6 หลักไปยังเบอร์โทรศัพท์ของคุณแล้ว
                              กรุณากรอกด้านล่าง:
                            </p>
                            <input
                              type="text"
                              value={twoFactorCode}
                              onChange={(e) =>
                                setTwoFactorCode(
                                  e.target.value.replace(/\D/g, "").slice(0, 6),
                                )
                              }
                              placeholder="000000"
                              className="w-full md:w-40 p-2 bg-white border-[2px] border-gray-300 rounded-lg text-black focus:outline-none focus:border-black text-center font-mono"
                            />

                            {verificationError && (
                              <p className="text-sm text-red-600 mt-2">
                                {verificationError}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {twoFactorSetupData.secret &&
                      twoFactorMethod === "email" && (
                        <div>
                          <h3 className="font-bold text-black mb-3 thai-font">
                            ตั้งค่าการยืนยันผ่านอีเมล
                          </h3>
                          <div className="space-y-4 mb-6">
                            <div>
                              <label className="block text-sm text-gray-600 mb-2 thai-font">
                                อีเมลของคุณ
                              </label>
                              <input
                                type="email"
                                placeholder="your.email@example.com"
                                className="w-full p-2 bg-white border-[2px] border-gray-300 rounded-lg text-black focus:outline-none focus:border-black"
                                readOnly
                                value={user?.email || "user@example.com"}
                              />
                              <p className="text-xs text-gray-500 mt-1 thai-font">
                                นี่คืออีเมลที่ผูกกับบัญชีของคุณ
                              </p>
                            </div>

                            <div>
                              <p className="text-gray-600 mb-2 thai-font">
                                เราได้ส่งรหัส 6 หลักไปยังอีเมลของคุณแล้ว
                                กรุณากรอกด้านล่าง:
                              </p>
                              <input
                                type="text"
                                value={twoFactorCode}
                                onChange={(e) =>
                                  setTwoFactorCode(
                                    e.target.value
                                      .replace(/\D/g, "")
                                      .slice(0, 6),
                                  )
                                }
                                placeholder="000000"
                                className="w-full md:w-40 p-2 bg-white border-[2px] border-gray-300 rounded-lg text-black focus:outline-none focus:border-black text-center font-mono"
                              />

                              {verificationError && (
                                <p className="text-sm text-red-600 mt-2">
                                  {verificationError}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Verification buttons */}
                    {twoFactorSetupData.secret && (
                      <div className="flex gap-3 justify-end">
                        <button
                          onClick={() => {
                            setShowTwoFactorSetup(false);
                            setTwoFactorSetupData({});
                            setTwoFactorCode("");
                            setVerificationError("");
                          }}
                          className="px-3 py-1.5 bg-gray-200 text-gray-700 border-[2px] border-gray-300 rounded-lg hover:bg-gray-300 thai-font"
                        >
                          ยกเลิก
                        </button>
                        <button
                          onClick={handleVerify2FA}
                          disabled={
                            twoFactorCode.length !== 6 || isLoadingSettings
                          }
                          className="px-3 py-1.5 bg-black text-white border-[2px] border-black rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 thai-font"
                        >
                          {isLoadingSettings ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              กำลังยืนยัน...
                            </>
                          ) : (
                            "ยืนยันและเปิดใช้งาน"
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-4 thai-font">
                      การยืนยันตัวตนสองขั้นตอนเพิ่มความปลอดภัยอีกชั้นให้กับบัญชีของคุณ
                      โดยต้องใช้รหัสยืนยันเสริมนอกเหนือจากรหัสผ่าน
                    </p>
                    <button
                      onClick={() => setShowTwoFactorSetup(true)}
                      className="w-full py-2 px-4 bg-black text-white border-[3px] border-black font-bold hover:-translate-y-0.5 transition-transform thai-font"
                      style={{ boxShadow: "3px 3px 0 0 #000000" }}
                    >
                      ตั้งค่าการยืนยันตัวตนสองขั้นตอน
                    </button>
                  </div>
                )}
              </div>

              {/* Backup codes dialog */}
              {showBackupCodes && (
                <div className="p-4 border-t-[3px] border-black bg-brutal-yellow/20">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-black thai-font">
                      รหัสสำรอง
                    </h3>
                    <button
                      onClick={() => setShowBackupCodes(false)}
                      className="text-gray-600 hover:text-black"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 thai-font">
                    บันทึกรหัสสำรองเหล่านี้ไว้ในที่ปลอดภัย
                    คุณสามารถใช้รหัสเหล่านี้เพื่อเข้าสู่ระบบหากคุณไม่สามารถเข้าถึงอุปกรณ์ยืนยันตัวตนได้
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {backupCodes.map((code, index) => (
                      <div
                        key={index}
                        className="bg-white border-[2px] border-black p-2 font-mono text-sm text-black text-center"
                      >
                        {code}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        const content = `Lnwtermgame - Backup Codes\n${"=".repeat(30)}\n\n${backupCodes.map((code, i) => `${i + 1}. ${code}`).join("\n")}\n\nเก็บรหัสเหล่านี้ไว้ในที่ปลอดภัย\nแต่ละรหัสใช้ได้เพียงครั้งเดียว`;
                        const blob = new Blob([content], {
                          type: "text/plain;charset=utf-8",
                        });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = "lnwtermgame-backup-codes.txt";
                        link.click();
                        URL.revokeObjectURL(url);
                        toast.success("ดาวน์โหลดรหัสสำรองสำเร็จ");
                      }}
                      className="px-3 py-1.5 bg-black text-white border-[2px] border-black rounded-lg hover:bg-gray-800 flex items-center gap-2 thai-font"
                    >
                      <Download size={16} />
                      ดาวน์โหลดรหัส
                    </button>
                    <button
                      onClick={() => setShowBackupCodes(false)}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 border-[2px] border-gray-300 rounded-lg hover:bg-gray-300 thai-font"
                    >
                      ปิด
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Email Verification */}
          <div
            className="bg-white border-[3px] border-black overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="p-4 bg-brutal-blue border-b-[3px] border-black">
              <h2 className="text-lg font-bold text-black thai-font">
                การยืนยันอีเมล
              </h2>
            </div>

            <div className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-start gap-3 md:gap-4">
                <div className="mt-1 flex items-center gap-2 md:block">
                  {securitySettings.emailVerified ? (
                    <Check className="text-brutal-green" size={24} />
                  ) : (
                    <AlertCircle className="text-brutal-pink" size={24} />
                  )}
                  <h3 className="font-bold text-black md:hidden thai-font">
                    {securitySettings.emailVerified
                      ? "ยืนยันอีเมลแล้ว"
                      : "ยังไม่ได้ยืนยันอีเมล"}
                  </h3>
                </div>

                <div className="w-full">
                  <h3 className="font-bold text-black mb-1 hidden md:block thai-font">
                    {securitySettings.emailVerified
                      ? "ยืนยันอีเมลแล้ว"
                      : "ยังไม่ได้ยืนยันอีเมล"}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 thai-font">
                    {securitySettings.emailVerified
                      ? "อีเมลของคุณได้รับการยืนยันแล้ว"
                      : "กรุณายืนยันอีเมลของคุณเพื่อเพิ่มความปลอดภัย"}
                  </p>

                  {!securitySettings.emailVerified && (
                    <button
                      onClick={() => sendVerificationEmail()}
                      disabled={isLoadingSettings}
                      className="w-full md:w-auto py-2 px-4 bg-black text-white border-[2px] border-black rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 thai-font shadow-[2px_2px_0_0_#000]"
                    >
                      {isLoadingSettings ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          กำลังส่ง...
                        </>
                      ) : (
                        "ส่งอีเมลยืนยัน"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Devices */}
        <div
          className="bg-white border-[3px] border-black"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
        >
          <div className="p-4 bg-brutal-pink border-b-[3px] border-black flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0">
            <h2 className="text-lg font-bold text-black thai-font">
              อุปกรณ์ที่ใช้งานล่าสุด
            </h2>
            <button
              onClick={logoutAllDevices}
              disabled={isLoadingSettings}
              className="w-full md:w-auto justify-center text-sm text-black hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 font-medium thai-font border-[2px] border-black md:border-0 p-2 md:p-0 bg-white md:bg-transparent shadow-[2px_2px_0_0_#000] md:shadow-none"
            >
              {isLoadingSettings ? (
                <>
                  <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                  กำลังดำเนินการ...
                </>
              ) : (
                <>
                  <LogOut size={14} />
                  ออกจากระบบทุกอุปกรณ์
                </>
              )}
            </button>
          </div>

          <div className="divide-y divide-gray-200">
            {securitySettings.recentDevices.map((device) => (
              <div
                key={device.id}
                className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="flex gap-3 w-full">
                  <div className="flex-shrink-0">
                    {device.os.toLowerCase().includes("windows") && (
                      <Laptop className="text-brutal-blue" size={24} />
                    )}
                    {device.os.toLowerCase().includes("ios") && (
                      <Smartphone className="text-brutal-blue" size={24} />
                    )}
                  </div>
                  <div className="w-full">
                    <h3 className="font-bold text-black">{device.name}</h3>
                    <div className="text-sm text-gray-600 flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                      <span>{device.browser}</span>
                      <span>•</span>
                      <span>{device.os}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-2 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Globe size={12} />
                        {device.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        Last active:{" "}
                        {new Date(device.lastActive).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="self-end md:self-center">
                  {device.isCurrent ? (
                    <span className="text-xs bg-brutal-green border-[2px] border-black text-black px-2 py-1 font-bold thai-font shadow-[2px_2px_0_0_#000]">
                      อุปกรณ์ปัจจุบัน
                    </span>
                  ) : (
                    <button
                      onClick={() => removeDevice(device.id)}
                      disabled={isLoadingSettings}
                      className="text-gray-600 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors"
                    >
                      {isLoadingSettings ? (
                        <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin"></div>
                      ) : (
                        <X size={20} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suspicious Activity */}
        {securitySettings.suspiciousActivities.length > 0 && (
          <div
            className="bg-white border-[3px] border-black"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="p-4 bg-red-100 border-b-[3px] border-black">
              <h2 className="text-lg font-bold text-black thai-font">
                กิจกรรมที่น่าสงสัย
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {securitySettings.suspiciousActivities.map((activity) => (
                <div key={activity.id} className="p-4">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="flex gap-3 w-full">
                      <div className="flex-shrink-0 mt-1">
                        {activity.suspicious ? (
                          <AlertTriangle className="text-red-600" size={24} />
                        ) : (
                          <CheckCircle
                            className="text-brutal-green"
                            size={24}
                          />
                        )}
                      </div>
                      <div className="w-full">
                        <h3 className="font-bold text-black">
                          {activity.description}
                        </h3>
                        <div className="text-sm text-gray-600 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                          <span>
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-1">
                            <Globe size={12} />
                            {activity.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <KeyRound size={12} />
                            IP: {activity.ip}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="self-end md:self-center">
                      {activity.suspicious && !activity.resolved && (
                        <button
                          onClick={() => resolveActivity(activity.id)}
                          className="text-xs bg-brutal-blue border-[2px] border-black text-black px-2 py-1 hover:bg-brutal-blue/80 thai-font shadow-[2px_2px_0_0_#000]"
                        >
                          ทำเครื่องหมายว่าตรวจสอบแล้ว
                        </button>
                      )}

                      {activity.resolved && (
                        <span className="text-xs bg-brutal-green border-[2px] border-black text-black px-2 py-1 thai-font shadow-[2px_2px_0_0_#000]">
                          ตรวจสอบแล้ว
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Settings */}
        <div
          className="bg-white border-[3px] border-black"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
        >
          <div className="p-4 bg-brutal-yellow border-b-[3px] border-black">
            <h2 className="text-lg font-bold text-black thai-font">
              การตั้งค่าเพิ่มเติม
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {/* Login Notifications */}
            <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-bold text-black thai-font">
                  แจ้งเตือนการเข้าสู่ระบบ
                </h3>
                <p className="text-sm text-gray-600 mt-1 thai-font">
                  รับการแจ้งเตือนเมื่อมีคนเข้าสู่ระบบบัญชีของคุณ
                </p>
              </div>
              <div className="self-end md:self-center">
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
                  <div className="relative w-14 h-8 bg-gray-200 border-[3px] border-black peer-checked:bg-brutal-green transition-colors after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-[3px] after:border-black after:h-6 after:w-6 after:transition-transform peer-checked:after:translate-x-6 shadow-[2px_2px_0_0_#000]"></div>
                </label>
              </div>
            </div>

            {/* Security Questions */}
            <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-bold text-black thai-font">
                  คำถามความปลอดภัย
                </h3>
                <p className="text-sm text-gray-600 mt-1 thai-font">
                  ตั้งค่าคำถามความปลอดภัยเพื่อยืนยันตัวตนของคุณ
                </p>
              </div>
              <div className="self-end md:self-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securitySettings.securityQuestions}
                    onChange={() =>
                      updateSecuritySettings({
                        securityQuestions: !securitySettings.securityQuestions,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="relative w-14 h-8 bg-gray-200 border-[3px] border-black peer-checked:bg-brutal-green transition-colors after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-[3px] after:border-black after:h-6 after:w-6 after:transition-transform peer-checked:after:translate-x-6 shadow-[2px_2px_0_0_#000]"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
