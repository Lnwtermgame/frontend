import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as authApi from "@/lib/api/auth";
import {
  configureAuthSync,
  getAccessToken,
  refreshAccessToken,
  setAccessToken,
} from "@/lib/api/client";

export const AUTH_STORAGE_KEY = "gtp-new-user";

export type AuthStatus = "bootstrapping" | "authenticated" | "guest";

interface OAuthSessionPayload {
  backendTokens?: { accessToken: string; expiresIn: number } | null;
  backendUser?: authApi.AuthUser | null;
}

interface AuthState {
  user: authApi.AuthUser | null;
  status: AuthStatus;
  bootstrap: () => Promise<void>;
  loginWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  registerWithPassword: (
    username: string,
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  applyOAuthSession: (payload: OAuthSessionPayload) => boolean;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      status: "bootstrapping",

      bootstrap: async () => {
        if (!get().user) {
          set({ status: "guest" });
          return;
        }
        const token = await refreshAccessToken();
        if (!token) {
          setAccessToken(null);
          set({ user: null, status: "guest" });
          return;
        }
        set({ status: "authenticated" });
      },

      loginWithPassword: async (email, password) => {
        try {
          const result = await authApi.login(email, password);
          setAccessToken(result.tokens.accessToken);
          set({ user: result.user, status: "authenticated" });
          return { ok: true };
        } catch (error) {
          set({ status: "guest" });
          const message =
            error instanceof Error ? error.message : "เข้าสู่ระบบไม่สำเร็จ";
          return { ok: false, message };
        }
      },

      registerWithPassword: async (username, email, password) => {
        try {
          const result = await authApi.register(username, email, password);
          setAccessToken(result.tokens.accessToken);
          set({ user: result.user, status: "authenticated" });
          return { ok: true };
        } catch (error) {
          set({ status: "guest" });
          const message =
            error instanceof Error ? error.message : "สมัครสมาชิกไม่สำเร็จ";
          return { ok: false, message };
        }
      },

      applyOAuthSession: ({ backendTokens, backendUser }) => {
        if (!backendTokens?.accessToken || !backendUser) return false;
        // Same user already applied and the API client holds a token: the
        // client token is by definition same-or-newer than the NextAuth JWT
        // token (written once at OAuth sign-in), so never clobber it.
        if (get().user?.id === backendUser.id && getAccessToken()) {
          return true;
        }
        setAccessToken(backendTokens.accessToken);
        set({ user: backendUser, status: "authenticated" });
        return true;
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // best-effort — clear local state regardless
        }
        setAccessToken(null);
        set({ user: null, status: "guest" });
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({ user: state.user }),
    },
  ),
);

if (typeof window !== "undefined") {
  configureAuthSync({
    hasStoredUser: () => Boolean(useAuthStore.getState().user),
    onSessionExpired: () => {
      setAccessToken(null);
      useAuthStore.setState({ user: null, status: "guest" });
      import("next-auth/react")
        .then(({ signOut }) => signOut({ redirect: false }))
        .catch(() => {});
      if (!window.location.pathname.includes("/login")) {
        sessionStorage.setItem("session_expired", "true");
        window.location.href = "/login?session_expired=true";
      }
    },
  });
}
