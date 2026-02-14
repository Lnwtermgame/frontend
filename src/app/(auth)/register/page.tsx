"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { motion } from "@/lib/framer-exports";
import { User, Mail, Lock, ArrowRight, CheckCircle, Zap, Gift, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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
            <div className="w-12 h-12 bg-brutal-yellow border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0_0_#000]">
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
              className="flex items-center space-x-4 p-4 bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000]"
              whileHover={{ scale: 1.02, x: -2, y: -2, boxShadow: '6px 6px 0 0 #000000' }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-10 h-10 bg-brutal-pink border-[2px] border-black flex items-center justify-center">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-black font-bold thai-font">โบนัสต้อนรับ</h3>
                <p className="text-gray-500 text-sm">รับแต้มสะสมฟรีเมื่อสมัครครั้งแรก</p>
              </div>
            </motion.div>

            <motion.div
              className="flex items-center space-x-4 p-4 bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000]"
              whileHover={{ scale: 1.02, x: -2, y: -2, boxShadow: '6px 6px 0 0 #000000' }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-10 h-10 bg-brutal-blue border-[2px] border-black flex items-center justify-center">
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
          <div className="bg-white border-[3px] border-black p-6 md:p-8 shadow-[6px_6px_0_0_#000]">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-brutal-yellow border-[3px] border-black flex items-center justify-center shadow-[3px_3px_0_0_#000]">
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
              <Input
                id="username"
                label="ชื่อผู้ใช้"
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
                label="อีเมล"
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
                  label="รหัสผ่าน"
                  type="password"
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                  disabled={isLoading}
                  icon={<Lock className="h-5 w-5" />}
                  autoComplete="new-password"
                />
                <p className="text-xs text-gray-500">รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร</p>
              </div>

              <div className="space-y-1.5">
                <Input
                  id="confirmPassword"
                  label="ยืนยันรหัสผ่าน"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  icon={
                    <CheckCircle
                      className={`h-5 w-5 transition-colors ${
                        password && confirmPassword && password === confirmPassword
                          ? 'text-brutal-green'
                          : 'text-gray-400'
                      }`}
                    />
                  }
                  errorText={passwordError}
                  className={passwordError ? "border-brutal-pink bg-brutal-pink/10" : ""}
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
                    สมัครสมาชิก <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
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
