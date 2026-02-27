import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import { authConfig } from "./auth.config";

// Define our custom token type
interface CustomToken extends JWT {
  backendTokens?: {
    accessToken: string;
    refreshToken: string;
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

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      console.log("[NextAuth] signIn callback", {
        provider: account?.provider,
      });

      if (!account || !profile) {
        console.error("[NextAuth] Missing account or profile");
        return false;
      }

      try {
        // Exchange OAuth tokens with our backend
        const oauthData = {
          provider: account.provider as "google" | "discord",
          providerAccountId: account.providerAccountId,
          email: user.email || "",
          name: user.name || "",
          image: user.image,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
        };

        // Call our backend to create/link user and get our tokens
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_GATEWAY_URL}/api/auth/oauth/callback`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(oauthData),
          },
        );

        if (!response.ok) {
          const error = await response.json();
          console.error("[NextAuth] Backend OAuth error:", error);
          return false;
        }

        const data = await response.json();

        // Store our backend tokens in the user object for the session
        (user as any).backendTokens = data.data.tokens;
        (user as any).backendUser = data.data.user;

        return true;
      } catch (error) {
        console.error("[NextAuth] signIn error:", error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      const customToken = token as CustomToken;

      // Initial sign in
      if (user && account) {
        customToken.backendTokens = (user as any).backendTokens;
        customToken.backendUser = (user as any).backendUser;
        customToken.provider = account.provider;
      }

      return customToken;
    },
    async session({ session, token }) {
      const customToken = token as CustomToken;

      // Send backend tokens to the client
      (session as any).backendTokens = customToken.backendTokens;
      (session as any).backendUser = customToken.backendUser;
      (session as any).provider = customToken.provider;

      return session;
    },
  },
  events: {
    async signOut() {
      // Optionally notify backend about signout
      console.log("[NextAuth] User signed out");
    },
  },
});
