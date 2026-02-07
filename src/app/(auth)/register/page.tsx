"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { motion } from "@/lib/framer-exports";
import { User, Mail, Lock, ArrowRight, CheckCircle, Zap, Gift, Clock } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Validate password match
  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setPasswordError("รหัสผ่านไม่ตรงกัน");
    } else {
      setPasswordError("");
    }
  }, [password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
            <div className="w-12 h-12 rounded-xl bg-brutal-yellow border-[3px] border-black flex items-center justify-center"
              style={{ boxShadow: '4px 4px 0 0 #000000' }}
            >
              <Zap className="w-6 h-6 text-black" fill="currentColor" />
            </div>
            <span className="text-2xl font-black text-black thai-font">MaliGamePass</span>
          </div>

          <h1 className="text-4xl font-black text-black leading-tight thai-font">
            สมัครสมาชิกวันนี้<br />
            รับสิทธิ์ <span className="text-brutal-pink">พิเศษมากมาย</span>
          </h1>

          <p className="text-gray-600 text-lg thai-font">
            สร้างบัญชีเพื่อเริ่มต้นเติมเกมและรับสิทธิประโยชน์สุดคุ้ม
          </p>

          {/* Benefits */}
          <div className="grid grid-cols-1 gap-4 pt-4">
            <motion.div
              className="flex items-center space-x-4 p-4 rounded-xl bg-white border-[3px] border-black"
              style={{ boxShadow: '4px 4px 0 0 #000000' }}
              whileHover={{ scale: 1.02, x: -2, y: -2, boxShadow: '6px 6px 0 0 #000000' }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-10 h-10 rounded-lg bg-brutal-pink border-[2px] border-black flex items-center justify-center">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-black font-bold thai-font">โบนัสต้อนรับ</h3>
                <p className="text-gray-500 text-sm">รับแต้มสะสมฟรีเมื่อสมัครครั้งแรก</p>
              </div>
            </motion.div>

            <motion.div
              className="flex items-center space-x-4 p-4 rounded-xl bg-white border-[3px] border-black"
              style={{ boxShadow: '4px 4px 0 0 #000000' }}
              whileHover={{ scale: 1.02, x: -2, y: -2, boxShadow: '6px 6px 0 0 #000000' }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-10 h-10 rounded-lg bg-brutal-blue border-[2px] border-black flex items-center justify-center">
                <Clock className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="text-black font-bold thai-font">เติมไว 24/7</h3>
                <p className="text-gray-500 text-sm">บริการตลอด 24 ชั่วโมง ไม่มีวันหยุด</p>
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
          <div className="bg-white rounded-2xl border-[3px] border-black p-8"
            style={{ boxShadow: '6px 6px 0 0 #000000' }}
          >
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brutal-yellow border-[3px] border-black flex items-center justify-center"
                style={{ boxShadow: '3px 3px 0 0 #000000' }}
              >
                <Zap className="w-5 h-5 text-black" fill="currentColor" />
              </div>
              <span className="text-xl font-black text-black thai-font">MaliGamePass</span>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-black mb-2 thai-font">
                สมัครสมาชิก
              </h2>
              <p className="text-gray-500 thai-font">
                กรอกข้อมูลด้านล่างเพื่อสร้างบัญชีใหม่
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 thai-font" htmlFor="username">
                  ชื่อผู้ใช้
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    className="flex h-12 w-full rounded-xl border-[2px] border-gray-300 bg-white pl-12 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black transition-all"
                    type="text"
                    autoComplete="username"
                    spellCheck="false"
                    placeholder="yourname"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    minLength={3}
                    maxLength={50}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 thai-font" htmlFor="email">
                  อีเมล
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    className="flex h-12 w-full rounded-xl border-[2px] border-gray-300 bg-white pl-12 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black transition-all"
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
                <label className="text-sm font-bold text-gray-700 thai-font" htmlFor="password">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    className="flex h-12 w-full rounded-xl border-[2px] border-gray-300 bg-white pl-12 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black transition-all"
                    type="password"
                    autoComplete="new-password"
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-gray-500">รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 thai-font" htmlFor="confirmPassword">
                  ยืนยันรหัสผ่าน
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <CheckCircle className={`h-5 w-5 transition-colors ${password && confirmPassword && password === confirmPassword ? 'text-brutal-green' : 'text-gray-400'}`} />
                  </div>
                  <input
                    id="confirmPassword"
                    className={`flex h-12 w-full rounded-xl border-[2px] pl-12 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black transition-all ${
                      passwordError
                        ? 'border-brutal-pink bg-brutal-pink/10'
                        : password && confirmPassword && password === confirmPassword
                        ? 'border-gray-300 bg-white'
                        : 'border-gray-300 bg-white'
                    }`}
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                {passwordError && (
                  <p className="text-xs text-brutal-pink font-medium thai-font">{passwordError}</p>
                )}
              </div>

              <motion.button
                className="w-full rounded-xl bg-black px-4 py-3.5 text-sm font-bold text-white border-[3px] border-black disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center thai-font"
                style={{ boxShadow: '4px 4px 0 0 #000000' }}
                type="submit"
                disabled={isLoading || !!passwordError}
                whileHover={{ scale: isLoading ? 1 : 1.02, x: -2, y: -2, boxShadow: '6px 6px 0 0 #000000' }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังสร้างบัญชี...
                  </>
                ) : (
                  <>
                    สมัครสมาชิก <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-500 thai-font">
                มีบัญชีอยู่แล้ว?{" "}
                <Link href="/login" className="text-brutal-pink hover:text-brutal-pink/80 font-bold transition-colors">
                  เข้าสู่ระบบ
                </Link>
              </p>
            </div>

            <div className="mt-6 text-center text-xs text-gray-500 thai-font">
              การสมัครสมาชิกแสดงว่าคุณยอมรับ{" "}
              <Link href="/terms" className="text-gray-700 hover:text-black font-bold transition-colors">
                เงื่อนไขการใช้งาน
              </Link>{" "}
              และ{" "}
              <Link href="/privacy" className="text-gray-700 hover:text-black font-bold transition-colors">
                นโยบายความเป็นส่วนตัว
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
