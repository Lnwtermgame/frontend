"use client";

import { useState, Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { motion } from "@/lib/framer-exports";
import {
  User,
  Lock,
  ArrowRight,
  Info,
  Zap,
  Shield,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { usePublicSettings } from "@/lib/context/public-settings-context";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("session_expired") === "true";
  const redirect = searchParams.get("redirect");
  const { login, isLoading, isAuthenticated } = useAuth();
  const { settings: publicSettings } = usePublicSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isSubmittingRef = useRef(false);
  const siteName = publicSettings?.general.siteName || "Lnwtermgame";

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (redirect) {
        router.push(redirect);
      } else {
        router.push("/dashboard/account");
      }
    }
  }, [isAuthenticated, redirect, router]);

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
    <div className="min-h-screen bg-brutal-gray flex items-center justify-center px-4 py-12">
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
            <span className="text-2xl font-black text-black thai-font">
              {siteName}
            </span>
          </div>

          <h1 className="text-4xl font-black text-black leading-tight thai-font">
            เติมเกม <span className="text-brutal-pink">รวดเร็ว</span>
            <br />
            ปลอดภัย <span className="text-brutal-blue">ราคาคุ้ม</span>
          </h1>

          <p className="text-gray-600 text-lg thai-font">
            เข้าสู่ระบบเพื่อเข้าถึงบัญชีของคุณและเริ่มเติมเงินเกมได้ทันที
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
                <h3 className="text-black font-bold thai-font">สะสมแต้ม VIP</h3>
                <p className="text-gray-500 text-sm">
                  รับสิทธิพิเศษและส่วนลดเพิ่ม
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
                <h3 className="text-black font-bold thai-font">ปลอดภัย 100%</h3>
                <p className="text-gray-500 text-sm">ระบบความปลอดภัยระดับสูง</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Side - Login Form */}
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
              <span className="text-xl font-black text-black thai-font">
                {siteName}
              </span>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-black mb-2 thai-font">
                เข้าสู่ระบบ
              </h2>
              <p className="text-gray-500 thai-font">
                ยินดีต้อนรับกลับมา! กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบ
              </p>
            </div>

            {sessionExpired && (
              <motion.div
                className="mb-6 p-4 bg-brutal-yellow/20 border-[2px] border-brutal-yellow flex items-start gap-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Info className="h-5 w-5 text-black flex-shrink-0 mt-0.5" />
                <div className="text-sm text-black font-medium thai-font">
                  เซสชั่นหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                id="email"
                type="email"
                label="อีเมล"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                icon={<User className="h-5 w-5" />}
                autoComplete="email"
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between mb-1">
                  <label
                    className="text-sm font-bold text-gray-700 thai-font"
                    htmlFor="password"
                  >
                    รหัสผ่าน
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-brutal-pink hover:text-brutal-pink/80 font-bold transition-colors thai-font"
                  >
                    ลืมรหัสผ่าน?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  icon={<Lock className="h-5 w-5" />}
                  autoComplete="current-password"
                  className="mt-0"
                />
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 border-gray-300 bg-white text-brutal-pink focus:ring-brutal-pink rounded-none border-2"
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-gray-600 font-medium thai-font"
                >
                  จดจำฉันไว้
                </label>
              </div>

              <Button
                type="submit"
                className="w-full sm:w-full bg-black text-white hover:bg-gray-800"
                disabled={isLoading}
                isLoading={isLoading}
                size="lg"
              >
                {!isLoading && (
                  <>
                    เข้าสู่ระบบ <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            {/* OAuth Login */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500 font-medium thai-font">
                    หรือเข้าสู่ระบบด้วย
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {/* Google Login */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => toast.error("Google OAuth ยังไม่ได้ตั้งค่า")}
                  className="bg-white"
                  disabled={isLoading}
                >
                  <svg
                    className="h-7 w-7 sm:h-6 sm:w-6 md:h-5 md:w-5 mr-2 flex-shrink-0"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-sm sm:text-base">Google</span>
                </Button>

                {/* Discord Login */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => toast.error("Discord OAuth ยังไม่ได้ตั้งค่า")}
                  className="bg-white"
                  disabled={isLoading}
                >
                  <svg
                    className="h-7 w-7 sm:h-6 sm:w-6 md:h-5 md:w-5 mr-2 flex-shrink-0"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="#5865F2"
                      d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
                    />
                  </svg>
                  <span className="text-sm sm:text-base">Discord</span>
                </Button>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-500 thai-font">
                ยังไม่มีบัญชี?{" "}
                <Link
                  href="/register"
                  className="text-brutal-pink hover:text-brutal-pink/80 font-bold transition-colors"
                >
                  สมัครสมาชิก
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brutal-gray flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            <div className="bg-white border-[3px] border-black p-8 animate-pulse shadow-[6px_6px_0_0_#000]">
              <div className="h-8 bg-gray-200 mb-6"></div>
              <div className="h-4 bg-gray-200 mb-8"></div>
              <div className="space-y-5">
                <div className="h-12 bg-gray-200"></div>
                <div className="h-12 bg-gray-200"></div>
                <div className="h-12 bg-black"></div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
