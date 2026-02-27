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
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { usePublicSettings } from "@/lib/context/public-settings-context";
import {
  oauthProviderApi,
  OAuthProvider,
} from "@/lib/services/oauth-provider-api";
import { signIn } from "next-auth/react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("session_expired") === "true";
  const redirect = searchParams.get("redirect");
  const error = searchParams.get("error");
  const { login, isLoading, isAuthenticated } = useAuth();
  const { settings: publicSettings } = usePublicSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [oauthProviders, setOAuthProviders] = useState<OAuthProvider[]>([]);
  const [oauthLoading, setOAuthLoading] = useState(true);
  const isSubmittingRef = useRef(false);
  const siteName = publicSettings?.general.siteName || "Lnwtermgame";

  // Handle OAuth errors from URL
  useEffect(() => {
    if (error === "OAuthCallback") {
      toast.error("การเข้าสู่ระบบด้วย OAuth ล้มเหลว กรุณาลองใหม่อีกครั้ง");
    } else if (error === "OAuthSignin") {
      toast.error("ไม่สามารถเริ่มการเข้าสู่ระบบด้วย OAuth ได้");
    } else if (error === "Callback") {
      toast.error("การ callback จาก OAuth ล้มเหลว");
    }
  }, [error]);

  // Fetch OAuth providers
  useEffect(() => {
    const fetchOAuthProviders = async () => {
      try {
        const response = await oauthProviderApi.getEnabledProviders();
        setOAuthProviders(response.data || []);
      } catch (error) {
        console.error("Failed to fetch OAuth providers:", error);
        // Silently fail - user can still login with email/password
      } finally {
        setOAuthLoading(false);
      }
    };

    fetchOAuthProviders();
  }, []);

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

  // Handle OAuth login with NextAuth
  const handleOAuthLogin = async (provider: OAuthProvider) => {
    // Check if provider is enabled
    if (!provider.isEnabled) {
      toast.error(`${provider.displayName} ยังไม่ได้เปิดใช้งาน`);
      return;
    }

    try {
      console.log(`[Login] Starting OAuth sign in with ${provider.name}`);

      // Use NextAuth's signIn function
      await signIn(provider.name as "discord" | "google", {
        callbackUrl: redirect || "/dashboard/account",
        redirect: true,
      });
    } catch (error) {
      console.error("[Login] OAuth sign in exception:", error);
      toast.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    }
  };

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
                <p className="text-gray-500 text-sm">
                  ระบบความปลอดภัยมาตรฐานสากล
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white border-[3px] border-black shadow-[8px_8px_0_0_#000] p-8">
            {/* Session Expired Warning */}
            {sessionExpired && (
              <div className="mb-6 p-4 bg-yellow-100 border-[2px] border-yellow-500">
                <div className="flex items-center space-x-2">
                  <Info className="w-5 h-5 text-yellow-700" />
                  <span className="text-yellow-800 font-bold thai-font">
                    เซสชันหมดอายุ
                  </span>
                </div>
                <p className="text-yellow-700 text-sm mt-1 thai-font">
                  กรุณาเข้าสู่ระบบอีกครั้งเพื่อดำเนินการต่อ
                </p>
              </div>
            )}

            <h2 className="text-3xl font-black text-black mb-2 thai-font">
              เข้าสู่ระบบ
            </h2>
            <p className="text-gray-600 mb-8 thai-font">
              ยังไม่มีบัญชี?{" "}
              <Link
                href="/register"
                className="text-brutal-blue font-bold hover:underline"
              >
                สมัครสมาชิก
              </Link>
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-black mb-2 thai-font">
                  อีเมล
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="your@email.com"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-2 thai-font">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="flex justify-end mt-2">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-brutal-blue font-bold hover:underline thai-font"
                  >
                    ลืมรหัสผ่าน?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                isLoading={isLoading}
              >
                {!isLoading && (
                  <>
                    เข้าสู่ระบบ
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            {/* OAuth Section */}
            {oauthProviders.length > 0 && (
              <>
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500 thai-font">
                      หรือเข้าสู่ระบบด้วย
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {oauthLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    oauthProviders.map((provider) => (
                      <Button
                        key={provider.id}
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleOAuthLogin(provider)}
                      >
                        {provider.iconUrl && (
                          <img
                            src={provider.iconUrl}
                            alt={provider.name}
                            className="w-5 h-5 mr-2"
                          />
                        )}
                        {provider.displayName}
                      </Button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
