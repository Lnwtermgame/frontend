import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import { authConfig } from "./auth.config";

interface CustomToken extends JWT {
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

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (!account || !profile) return false;
      const internalApiKey = process.env.INTERNAL_API_KEY;
      if (!internalApiKey) {
        console.error("[NextAuth] INTERNAL_API_KEY is not configured");
        return false;
      }
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_GATEWAY_URL}/api/auth/oauth/callback`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-internal-api-key": internalApiKey,
            },
            body: JSON.stringify({
              provider: account.provider as "google" | "discord",
              providerAccountId: account.providerAccountId,
              email: user.email || "",
              name: user.name || "",
              image: user.image ?? null,
              accessToken: account.access_token,
              refreshToken: account.refresh_token,
              expiresAt: account.expires_at,
            }),
          },
        );
        if (!response.ok) {
          console.error("[NextAuth] Backend OAuth error:", await response.json());
          return false;
        }
        const data = await response.json();
        (user as { backendTokens?: unknown }).backendTokens = {
          accessToken: data.data.tokens.accessToken,
          expiresIn: data.data.tokens.expiresIn,
        };
        (user as { backendUser?: unknown }).backendUser = data.data.user;
        return true;
      } catch (error) {
        console.error("[NextAuth] signIn error:", error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      const customToken = token as CustomToken;
      if (user && account) {
        customToken.backendTokens = (user as { backendTokens?: CustomToken["backendTokens"] }).backendTokens;
        customToken.backendUser = (user as { backendUser?: CustomToken["backendUser"] }).backendUser;
        customToken.provider = account.provider;
      }
      return customToken;
    },
    async session({ session, token }) {
      const customToken = token as CustomToken;
      session.backendTokens = customToken.backendTokens;
      session.backendUser = customToken.backendUser;
      session.provider = customToken.provider;
      return session;
    },
  },
});
