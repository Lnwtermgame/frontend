/* import นี้จำเป็น — ทำให้ไฟล์เป็น module เพื่อที่ declare module จะเป็น
   "augmentation" (merge กับ type ของ next-auth) ไม่ใช่ ambient override */
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    backendTokens?: { accessToken: string; expiresIn: number };
    backendUser?: {
      id: string;
      username: string;
      email: string;
      role: string;
      isActive: boolean;
      emailVerified?: boolean;
    };
    provider?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    backendTokens?: { accessToken: string; expiresIn: number };
    backendUser?: {
      id: string;
      username: string;
      email: string;
      role: string;
      isActive: boolean;
      emailVerified?: boolean;
    };
    provider?: string;
  }
}
