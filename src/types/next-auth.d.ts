import { DefaultSession } from "next-auth";

// Extend NextAuth types to include our backend tokens

declare module "next-auth" {
  interface User {
    backendTokens?: {
      accessToken: string;
      expiresIn: number;
    };
    backendUser?: {
      id: string;
      username: string;
      email: string;
      role: string;
      isActive: boolean;
      emailVerified?: boolean;
    };
  }

  interface Session {
    backendTokens?: {
      accessToken: string;
      expiresIn: number;
    };
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

  interface JWT {
    backendTokens?: {
      accessToken: string;
      expiresIn: number;
    };
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
    backendTokens?: {
      accessToken: string;
      expiresIn: number;
    };
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
