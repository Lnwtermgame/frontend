"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { motion } from "@/lib/framer-exports";
import { User, Lock, ArrowRight, Info, Zap, Shield, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("session_expired") === "true";
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await login(email, password);
    if (success) {
      router.push("/dashboard/account");
    }
  };

  return (
    <div className="min-h-screen bg-mali-dark flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <motion.div
          className="hidden lg:flex flex-col space-y-6"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-button-gradient flex items-center justify-center shadow-lg">
              <Zap className="w-6 h-6 text-white" fill="currentColor" />
            </div>
            <span className="text-2xl font-bold text-white thai-font">MaliGamePass</span>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight thai-font">
            เติมเกม <span className="text-mali-blue-accent">รวดเร็ว</span><br />
            ปลอดภัย <span className="text-mali-purple">ราคาคุ้ม</span>
          </h1>

          <p className="text-mali-text-secondary text-lg thai-font">
            เข้าสู่ระบบเพื่อเข้าถึงบัญชีของคุณและเริ่มเติมเงินเกมได้ทันที
          </p>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 gap-4 pt-4">
            <motion.div
              className="flex items-center space-x-4 p-4 rounded-xl bg-mali-card border border-mali-blue/20"
              whileHover={{ scale: 1.02, borderColor: "rgba(255, 107, 0, 0.3)" }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-10 h-10 rounded-lg bg-mali-blue-accent/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-mali-blue-accent" />
              </div>
              <div>
                <h3 className="text-white font-medium thai-font">สะสมแต้ม VIP</h3>
                <p className="text-mali-text-secondary text-sm">รับสิทธิพิเศษและส่วนลดเพิ่ม</p>
              </div>
            </motion.div>

            <motion.div
              className="flex items-center space-x-4 p-4 rounded-xl bg-mali-card border border-mali-blue/20"
              whileHover={{ scale: 1.02, borderColor: "rgba(0, 255, 148, 0.3)" }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-10 h-10 rounded-lg bg-mali-purple/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-mali-purple" />
              </div>
              <div>
                <h3 className="text-white font-medium thai-font">ปลอดภัย 100%</h3>
                <p className="text-mali-text-secondary text-sm">ระบบความปลอดภัยระดับสูง</p>
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
          <div className="bg-mali-card rounded-2xl border border-mali-blue/20 p-8 shadow-xl">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-button-gradient flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              <span className="text-xl font-bold text-white thai-font">MaliGamePass</span>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2 thai-font">
                เข้าสู่ระบบ
              </h2>
              <p className="text-mali-text-secondary thai-font">
                ยินดีต้อนรับกลับมา! กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบ
              </p>
            </div>

            {sessionExpired && (
              <motion.div
                className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Info className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-200 thai-font">
                  เซสชั่นหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-mali-text-secondary thai-font" htmlFor="email">
                  อีเมล
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <User className="h-5 w-5 text-mali-text-muted" />
                  </div>
                  <input
                    id="email"
                    className="flex h-12 w-full rounded-xl border border-mali-blue bg-mali-dark/50 pl-12 pr-4 text-sm text-white placeholder:text-mali-text-muted focus:outline-none focus:ring-2 focus:ring-mali-blue-accent/50 focus:border-mali-blue-accent transition-all"
                    type="email"
                    autoComplete="email"
                    spellCheck="false"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-mali-text-secondary thai-font" htmlFor="password">
                    รหัสผ่าน
                  </label>
                  <Link href="#" className="text-xs text-mali-blue-accent hover:text-mali-blue-accent/80 transition-colors thai-font">
                    ลืมรหัสผ่าน?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Lock className="h-5 w-5 text-mali-text-muted" />
                  </div>
                  <input
                    id="password"
                    className="flex h-12 w-full rounded-xl border border-mali-blue bg-mali-dark/50 pl-12 pr-4 text-sm text-white placeholder:text-mali-text-muted focus:outline-none focus:ring-2 focus:ring-mali-blue-accent/50 focus:border-mali-blue-accent transition-all"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 rounded border-mali-blue bg-mali-dark text-mali-blue-accent focus:ring-mali-blue-accent/50"
                />
                <label htmlFor="remember" className="text-sm text-mali-text-secondary thai-font">
                  จดจำฉันไว้
                </label>
              </div>

              <motion.button
                className="w-full rounded-xl bg-button-gradient px-4 py-3.5 text-sm font-bold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center thai-font"
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  <>
                    เข้าสู่ระบบ <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </motion.button>
            </form>

            {/* OAuth Login */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-mali-blue/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-mali-card text-mali-text-secondary thai-font">หรือเข้าสู่ระบบด้วย</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {/* Google Login */}
                <motion.button
                  type="button"
                  onClick={() => toast.error('Google OAuth ยังไม่ได้ตั้งค่า')}
                  className="flex items-center justify-center px-4 py-3 rounded-xl border border-mali-blue/20 bg-mali-dark/50 text-white hover:bg-mali-dark transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-sm font-medium thai-font">Google</span>
                </motion.button>

                {/* Discord Login */}
                <motion.button
                  type="button"
                  onClick={() => toast.error('Discord OAuth ยังไม่ได้ตั้งค่า')}
                  className="flex items-center justify-center px-4 py-3 rounded-xl border border-mali-blue/20 bg-mali-dark/50 text-white hover:bg-mali-dark transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  <span className="text-sm font-medium thai-font">Discord</span>
                </motion.button>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-mali-blue/20 text-center">
              <p className="text-mali-text-secondary thai-font">
                ยังไม่มีบัญชี?{" "}
                <Link href="/register" className="text-mali-blue-accent hover:text-mali-blue-accent/80 font-medium transition-colors">
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
    <Suspense fallback={
      <div className="min-h-screen bg-mali-dark flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-mali-card rounded-2xl border border-mali-blue/20 p-8 animate-pulse">
            <div className="h-8 bg-mali-blue/20 rounded-xl mb-6"></div>
            <div className="h-4 bg-mali-blue/20 rounded-lg mb-8"></div>
            <div className="space-y-5">
              <div className="h-12 bg-mali-blue/20 rounded-xl"></div>
              <div className="h-12 bg-mali-blue/20 rounded-xl"></div>
              <div className="h-12 bg-mali-blue-accent/20 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
