"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";
import {
  Lock,
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { authApi } from "@/lib/services/auth-api";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsInvalid(true);
    }
  }, [token]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
    }
    if (!/[A-Z]/.test(password)) {
      return "รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว";
    }
    if (!/[a-z]/.test(password)) {
      return "รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว";
    }
    if (!/[0-9]/.test(password)) {
      return "รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("ลิงก์ไม่ถูกต้อง");
      return;
    }

    // Validate password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    // Check confirm password
    if (newPassword !== confirmPassword) {
      toast.error("รหัสผ่านไม่ตรงกัน");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authApi.resetPassword(token, newPassword);

      if (response.success) {
        setIsSuccess(true);
        toast.success("รีเซ็ตรหัสผ่านสำเร็จ!");

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        toast.error(response.message || "ไม่สามารถรีเซ็ตรหัสผ่านได้");
      }
    } catch (error: any) {
      const errorMessage = authApi.getErrorMessage(error);

      if (
        errorMessage.includes("expired") ||
        errorMessage.includes("หมดอายุ")
      ) {
        toast.error("ลิงก์หมดอายุแล้ว กรุณาขอลิงก์ใหม่");
      } else if (
        errorMessage.includes("Invalid") ||
        errorMessage.includes("invalid")
      ) {
        toast.error("ลิงก์ไม่ถูกต้อง กรุณาขอลิงก์ใหม่");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const strengthLabels = ["อ่อน", "ปานกลาง", "ดี", "แข็งแรง", "ปลอดภัยมาก"];
  const strengthColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
    "bg-brutal-green",
  ];

  if (isInvalid) {
    return (
      <div className="min-h-screen bg-brutal-gray flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white border-[3px] border-black shadow-[6px_6px_0_0_#000]">
            <div className="bg-brutal-pink border-b-[3px] border-black p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-black border-[3px] border-black flex items-center justify-center">
                  <XCircle size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-black thai-font">
                    ลิงก์ไม่ถูกต้อง
                  </h1>
                </div>
              </div>
            </div>

            <div className="p-6 text-center">
              <p className="text-gray-600 mb-6 thai-font">
                ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือไม่สมบูรณ์
              </p>

              <Link
                href="/forgot-password"
                className="inline-flex items-center gap-2 bg-brutal-blue text-white px-6 py-3 border-[3px] border-black font-bold hover:bg-black transition-colors thai-font"
              >
                <ArrowLeft size={18} />
                ขอลิงก์ใหม่
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brutal-gray flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white border-[3px] border-black shadow-[6px_6px_0_0_#000]">
          {/* Header */}
          <div className="bg-brutal-yellow border-b-[3px] border-black p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-black border-[3px] border-black flex items-center justify-center">
                <Lock size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-black thai-font">
                  รีเซ็ตรหัสผ่าน
                </h1>
                <p className="text-sm text-gray-700">Reset Password</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {!isSuccess ? (
              <>
                <p className="text-gray-600 mb-6 thai-font">
                  สร้างรหัสผ่านใหม่ของคุณ
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label
                      className="text-sm font-bold text-gray-700 thai-font"
                      htmlFor="newPassword"
                    >
                      รหัสผ่านใหม่
                    </label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        disabled={isSubmitting}
                        icon={<Lock className="h-5 w-5" />}
                        autoComplete="new-password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>

                    {/* Password Strength */}
                    {newPassword && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 border border-black ${
                                i < passwordStrength
                                  ? strengthColors[passwordStrength - 1]
                                  : "bg-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 thai-font">
                          ความปลอดภัย:{" "}
                          {passwordStrength > 0
                            ? strengthLabels[passwordStrength - 1]
                            : "-"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label
                      className="text-sm font-bold text-gray-700 thai-font"
                      htmlFor="confirmPassword"
                    >
                      ยืนยันรหัสผ่าน
                    </label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isSubmitting}
                        icon={<ShieldCheck className="h-5 w-5" />}
                        autoComplete="new-password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>

                    {/* Password Match Indicator */}
                    {confirmPassword && (
                      <p
                        className={`text-xs mt-1 thai-font ${
                          newPassword === confirmPassword
                            ? "text-brutal-green"
                            : "text-brutal-pink"
                        }`}
                      >
                        {newPassword === confirmPassword
                          ? "✓ รหัสผ่านตรงกัน"
                          : "✗ รหัสผ่านไม่ตรงกัน"}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-brutal-blue text-white hover:bg-black"
                    disabled={
                      isSubmitting ||
                      newPassword !== confirmPassword ||
                      passwordStrength < 3
                    }
                    isLoading={isSubmitting}
                    size="lg"
                  >
                    {!isSubmitting && (
                      <>
                        รีเซ็ตรหัสผ่าน
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-brutal-green border-[3px] border-black flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-black" />
                </div>
                <h2 className="text-lg font-bold text-black mb-2 thai-font">
                  รีเซ็ตรหัสผ่านสำเร็จ!
                </h2>
                <p className="text-gray-600 mb-4 thai-font">
                  รหัสผ่านของคุณถูกเปลี่ยนแล้ว
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...
                </p>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-brutal-blue text-white px-6 py-3 border-[3px] border-black font-bold hover:bg-black transition-colors thai-font"
                >
                  เข้าสู่ระบบตอนนี้
                  <ArrowRight size={18} />
                </Link>
              </div>
            )}

            {!isSuccess && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-black transition-colors thai-font"
                >
                  <ArrowLeft size={18} />
                  กลับไปหน้าเข้าสู่ระบบ
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brutal-gray flex items-center justify-center">
          <div className="text-center">
            <Loader2
              size={48}
              className="animate-spin mx-auto mb-4 text-brutal-blue"
            />
            <p className="text-gray-600 thai-font">กำลังโหลด...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
