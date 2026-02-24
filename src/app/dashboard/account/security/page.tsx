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
    <div className="bg-brutal-gray min-h-full">
      {/* Page Header */}
      <div className="relative mb-4">
        <motion.h2
          className="text-lg md:text-xl font-bold text-black mb-1 relative flex items-center gap-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <span className="w-1.5 h-5 md:h-6 bg-brutal-pink mr-2"></span>
          <Shield className="text-brutal-pink h-6 w-6 md:h-7 md:w-7" />
          Security Settings
        </motion.h2>
        <p className="text-gray-600 text-xs md:text-sm relative thai-font pl-4 md:pl-0">
          จัดการความปลอดภัยของบัญชีและการตั้งค่าความเป็นส่วนตัวของคุณ
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
              <h2 className="text-base font-bold text-black thai-font">
                เปลี่ยนรหัสผ่าน
              </h2>
            </div>

            <div className="p-4">
              {showChangePassword ? (
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1.5 thai-font">
                      รหัสผ่านปัจจุบัน
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
                    <label className="block text-xs text-gray-600 mb-1.5 thai-font">
                      รหัสผ่านใหม่
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
                    <p className="text-[10px] text-gray-500 mt-1 thai-font">
                      รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1.5 thai-font">
                      ยืนยันรหัสผ่านใหม่
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
                      className="flex-1 py-2 px-3 bg-gray-200 text-gray-700 border-[2px] border-gray-300 rounded-lg hover:bg-gray-300 transition-colors thai-font order-2 md:order-1 text-xs font-bold"
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
                      className="flex-1 py-2 px-3 bg-black text-white border-[3px] border-black font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 thai-font hover:-translate-y-0.5 transition-transform order-1 md:order-2 text-xs"
                      style={{ boxShadow: "3px 3px 0 0 #000000" }}
                    >
                      {isChangingPassword ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-brutal-blue border-[2px] border-black flex items-center justify-center">
                      <KeyRound className="text-black" size={16} />
                    </div>
                    <div>
                      <h3 className="font-bold text-black mb-0.5 thai-font text-sm">
                        อัปเดตรหัสผ่าน
                      </h3>
                      <p className="text-xs text-gray-600 thai-font">
                        เปลี่ยนรหัสผ่านของคุณเพื่อความปลอดภัยที่ดีขึ้น
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowChangePassword(true)}
                    className="w-full py-2 px-3 bg-black text-white border-[3px] border-black font-bold hover:-translate-y-0.5 transition-transform thai-font text-xs"
                    style={{ boxShadow: "3px 3px 0 0 #000000" }}
                  >
                    เปลี่ยนรหัสผ่าน
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
              <h2 className="text-base font-bold text-black thai-font">
                การยืนยันตัวตนสองขั้นตอน
              </h2>
              <span className="bg-gray-200 text-gray-600 border-[2px] border-black px-1.5 py-0.5 text-[10px] font-bold thai-font shadow-[2px_2px_0 0 #000]">
                เร็วๆ นี้
              </span>
            </div>

            <div className="p-4 pointer-events-none">
              <div>
                <p className="text-gray-600 mb-3 thai-font text-xs">
                  การยืนยันตัวตนสองขั้นตอนเพิ่มความปลอดภัยอีกชั้นให้กับบัญชีของคุณ
                  โดยต้องใช้รหัสยืนยันเสริมนอกเหนือจากรหัสผ่าน
                </p>
                <button
                  disabled
                  className="w-full py-2 px-3 bg-gray-400 text-white border-[3px] border-gray-500 font-bold cursor-not-allowed thai-font text-xs"
                  style={{ boxShadow: "3px 3px 0 0 #999" }}
                >
                  ตั้งค่าการยืนยันตัวตนสองขั้นตอน
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
              <h2 className="text-base font-bold text-black thai-font">
                การยืนยันอีเมล
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
                  <h3 className="font-bold text-black md:hidden thai-font text-sm">
                    {securitySettings.emailVerified
                      ? "ยืนยันอีเมลแล้ว"
                      : "ยังไม่ได้ยืนยันอีเมล"}
                  </h3>
                </div>

                <div className="w-full">
                  <h3 className="font-bold text-black mb-1 hidden md:block thai-font text-sm">
                    {securitySettings.emailVerified
                      ? "ยืนยันอีเมลแล้ว"
                      : "ยังไม่ได้ยืนยันอีเมล"}
                  </h3>
                  <p className="text-xs text-gray-600 mb-3 thai-font">
                    {securitySettings.emailVerified
                      ? "อีเมลของคุณได้รับการยืนยันแล้ว"
                      : "กรุณายืนยันอีเมลของคุณเพื่อเพิ่มความปลอดภัย"}
                  </p>

                  {!securitySettings.emailVerified && (
                    <button
                      onClick={() => sendVerificationEmail()}
                      disabled={isLoadingSettings}
                      className="w-full md:w-auto py-1.5 px-3 bg-black text-white border-[2px] border-black rounded-lg text-xs hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 thai-font shadow-[2px_2px_0_0_#000]"
                    >
                      {isLoadingSettings ? (
                        <>
                          <div className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
              <h2 className="text-base font-bold text-black thai-font">
                การตั้งค่าเพิ่มเติม
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {/* Login Notifications */}
              <div className="p-3 flex flex-col justify-between items-start gap-3">
                <div>
                  <h3 className="font-bold text-black thai-font text-sm">
                    แจ้งเตือนการเข้าสู่ระบบ
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5 thai-font">
                    รับการแจ้งเตือนเมื่อมีคนเข้าสู่ระบบบัญชีของคุณ
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
              <h2 className="text-base font-bold text-black thai-font">
                อุปกรณ์ที่ใช้งานล่าสุด
              </h2>
              <button
                onClick={logoutAllDevices}
                disabled={isLoadingSettings}
                className="w-full justify-center text-xs text-black hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 font-medium thai-font border-[2px] border-black p-1.5 bg-white shadow-[2px_2px_0_0_#000]"
              >
                {isLoadingSettings ? (
                  <>
                    <div className="w-2.5 h-2.5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    กำลังดำเนินการ...
                  </>
                ) : (
                  <>
                    <LogOut size={12} />
                    ออกจากระบบทุกอุปกรณ์
                  </>
                )}
              </button>
            </div>

            <div className="divide-y divide-gray-200 max-h-[300px] overflow-y-auto">
              {securitySettings.recentDevices.map((device) => (
                <div
                  key={device.id}
                  className="p-3 flex flex-col gap-2"
                >
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
                        <h3 className="font-bold text-black text-sm">{device.name}</h3>
                        {device.isCurrent ? (
                          <span className="text-[10px] bg-brutal-green border-[1px] border-black text-black px-1.5 py-0.5 font-bold thai-font">
                            ปัจจุบัน
                          </span>
                        ) : (
                          <button
                            onClick={() => removeDevice(device.id)}
                            disabled={isLoadingSettings}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <X size={14} />
                          </button>
                        )}
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
              <h2 className="text-base font-bold text-black thai-font">
                กิจกรรมที่น่าสงสัย
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
                        className={`w-10 h-10 rounded-full border-[2px] border-black flex items-center justify-center ${
                          activity.suspicious && !activity.resolved
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
                          <h3 className="font-bold text-black text-sm md:text-base break-words thai-font leading-tight">
                            {activity.description}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-xs text-gray-600 thai-font">
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {new Date(activity.timestamp).toLocaleString(
                                "th-TH",
                                {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                },
                              )}
                            </span>
                            <span className="flex items-center gap-1">
                              <Globe size={14} />
                              {activity.location === "Admin Panel"
                                ? "ผู้ดูแลระบบ"
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
                              className="w-full md:w-auto text-xs font-bold bg-white text-black border-[2px] border-black px-3 py-1.5 hover:bg-brutal-blue hover:text-white transition-all shadow-[2px_2px_0_0_#000] active:translate-y-[2px] active:shadow-none thai-font flex items-center justify-center gap-2"
                            >
                              <Check size={14} />
                              ยืนยัน
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] md:text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full border border-green-200 thai-font whitespace-nowrap">
                              <CheckCircle size={10} />
                              ตรวจสอบแล้ว
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
