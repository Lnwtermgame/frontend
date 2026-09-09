import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
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
