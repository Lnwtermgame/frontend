"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
} from "react";
import toast from "react-hot-toast";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { authApi, User } from "../services/auth-api";
import {
  setAccessToken,
  refreshAccessToken,
  RefreshResult,
} from "../client/gateway";

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<boolean>;
  oauthLogin: (
    code: string,
    provider: "google" | "discord",
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: {
    username?: string;
    email?: string;
  }) => Promise<boolean>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<boolean>;
  isInitialized: boolean;
  isSessionChecked: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

// Token expiration buffer (refresh 1 minute before expiry)
const TOKEN_REFRESH_BUFFER = 60 * 1000; // 1 minute in milliseconds

// Default token lifetime in seconds (1 day)
const DEFAULT_TOKEN_LIFETIME = 24 * 60 * 60;

/**
 * Decode JWT token to get expiration time
 * Returns null if token is invalid
 */
function decodeToken(token: string): { exp?: number } | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Calculate remaining time until token expires
 * Returns seconds until expiration, or default lifetime if can't decode
 */
function getTokenRemainingTime(token: string): number {
  const decoded = decodeToken(token);
  if (!decoded?.exp) {
    return DEFAULT_TOKEN_LIFETIME;
  }
  const now = Math.floor(Date.now() / 1000);
  const remaining = decoded.exp - now;
  return remaining > 0 ? remaining : 0;
}

// Storage version - bump this when auth structure changes to force clear stale data
const AUTH_STORAGE_VERSION = "3";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [storageVersion, setStorageVersion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSessionChecked, setIsSessionChecked] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCheckingSessionRef = useRef(false);
  const isAuthenticated = !!user && !!token;
  const isAdmin = isAuthenticated && user?.role === "ADMIN";

  useEffect(() => {
    if (typeof window === "undefined") {
      setIsInitialized(true);
      setIsSessionChecked(true);
      return;
    }
    const storedUser = localStorage.getItem("mali-gamepass-user");
    const storedVersion = localStorage.getItem("auth_storage_version");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as User);
      } catch {
        localStorage.removeItem("mali-gamepass-user");
      }
    }
    setStorageVersion(storedVersion);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (user) {
      localStorage.setItem("mali-gamepass-user", JSON.stringify(user));
    } else {
      localStorage.removeItem("mali-gamepass-user");
    }
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (storageVersion) {
      localStorage.setItem("auth_storage_version", storageVersion);
    }
  }, [storageVersion]);

  // Check and clear stale storage data
  useEffect(() => {
    if (isInitialized && storageVersion !== AUTH_STORAGE_VERSION) {
      console.log("[Auth] Clearing stale auth data due to version mismatch");
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
      }
      setStorageVersion(AUTH_STORAGE_VERSION);
    }
  }, [isInitialized, storageVersion, setUser, setStorageVersion]);

  // Debug logging for admin access issues (dev only)
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && isInitialized && user) {
      console.log("[Auth Debug] User:", user);
      console.log("[Auth Debug] Role:", user?.role);
      console.log("[Auth Debug] Is Admin:", isAdmin);
      console.log("[Auth Debug] Role type:", typeof user?.role);
    }
  }, [user, isAdmin, isInitialized]);

  // ============================================
  // NextAuth Session Sync
  // Sync NextAuth session with our auth context
  // ============================================
  const { data: nextAuthSession, status: nextAuthStatus } = useSession();
  const hasSyncedNextAuthRef = useRef(false);

  // Clear all auth data
  const clearAuth = useCallback(() => {
    setToken(null);
    setUser(null);
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    setAccessToken(null);
    // Keep isSessionChecked = true so the UI shows the logged-out state
    // (login button) instead of being stuck on a loading spinner.
    setIsSessionChecked(true);
  }, [setToken, setUser, setIsSessionChecked]);

  // Schedule token refresh
  const scheduleTokenRefresh = useCallback((expiresIn: number) => {
    // Clear existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Schedule refresh before token expires
    const refreshDelay = expiresIn * 1000 - TOKEN_REFRESH_BUFFER;
    if (refreshDelay > 0) {
      refreshTimeoutRef.current = setTimeout(() => {
        performTokenRefresh();
      }, refreshDelay);
    }
  }, []);

  // Perform token refresh
  const performTokenRefresh = useCallback(async () => {
    // Don't attempt refresh if no stored user (user was never logged in)
    const hasStoredUser = localStorage.getItem("mali-gamepass-user");
    if (!hasStoredUser) {
      console.log("[Auth] No stored user, skipping token refresh");
      return;
    }

    console.log("[Auth] Performing token refresh...");

    try {
      const result = await refreshAccessToken();

      if (result) {
        console.log("[Auth] Token refresh successful");
        setToken(result.accessToken);
        scheduleTokenRefresh(result.expiresIn);
      } else {
        console.log("[Auth] Token refresh failed");
        clearAuth();
        // Redirect to login so user isn't stuck on a broken page
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          toast.error("เซสชั่นหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง");
          sessionStorage.setItem("session_expired", "true");
          window.location.href = "/login?session_expired=true";
        }
      }
    } catch (err) {
      console.log("[Auth] Token refresh error:", err);
      clearAuth();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        toast.error("เซสชั่นหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง");
        sessionStorage.setItem("session_expired", "true");
        window.location.href = "/login?session_expired=true";
      }
    }
  }, [setToken, clearAuth, scheduleTokenRefresh]);

  // Hydration check
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Check for existing session on initial load
  useEffect(() => {
    const checkSession = async () => {
      // Prevent concurrent session checks
      if (isCheckingSessionRef.current) {
        console.log("[Auth] Session check already in progress, skipping");
        return;
      }

      if (user && token) {
        const remainingTime = getTokenRemainingTime(token);
        if (remainingTime > 60) {
          scheduleTokenRefresh(remainingTime);
        } else if (remainingTime > 0) {
          await performTokenRefresh();
        }
        setIsSessionChecked(true);
        return;
      }

      if (token && !user) {
        isCheckingSessionRef.current = true;
        console.log("[Auth] Checking existing session...");
        try {
          const response = await authApi.getProfile();
          if (response.success) {
            console.log("[Auth] Session valid, restoring user");
            setUser(response.data);
            const remainingTime = getTokenRemainingTime(token);
            if (remainingTime > 60) {
              scheduleTokenRefresh(remainingTime);
            } else if (remainingTime > 0) {
              await performTokenRefresh();
            }
          }
        } catch (err) {
          console.log("[Auth] Session check failed:", err);
          if ((err as any)?.response?.status === 401) {
            clearAuth();
          }
        } finally {
          isCheckingSessionRef.current = false;
          setIsSessionChecked(true);
        }
        return;
      }

      // Only attempt cookie-based refresh if there's a stored user (indicating previous login)
      const hasStoredUser = localStorage.getItem("mali-gamepass-user");
      if (!hasStoredUser) {
        console.log(
          "[Auth] No stored user data, skipping refresh cookie check",
        );
        setIsSessionChecked(true);
        return;
      }

      isCheckingSessionRef.current = true;
      console.log("[Auth] Restoring session from refresh cookie...");
      try {
        const refreshResult = await refreshAccessToken();
        if (refreshResult) {
          setToken(refreshResult.accessToken);
          scheduleTokenRefresh(refreshResult.expiresIn);
          const profileResponse = await authApi.getProfile();
          if (profileResponse.success) {
            setUser(profileResponse.data);
          } else {
            // Profile fetch failed (e.g., user deleted or banned)
            clearAuth();
            if (typeof window !== "undefined") {
              import("next-auth/react").then(({ signOut }) => signOut({ redirect: false }));
              sessionStorage.setItem("session_expired", "true");
              window.location.href = "/login?session_expired=true";
            }
          }
        } else {
          // Token refresh failed (e.g., expired cookie, logged out on another device)
          clearAuth();
          if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
            import("next-auth/react").then(({ signOut }) => signOut({ redirect: false }));
            sessionStorage.setItem("session_expired", "true");
            window.location.href = "/login?session_expired=true";
          }
        }
      } catch (err) {
        console.log("[Auth] Refresh cookie session failed:", err);
        clearAuth();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          import("next-auth/react").then(({ signOut }) => signOut({ redirect: false }));
          sessionStorage.setItem("session_expired", "true");
          window.location.href = "/login?session_expired=true";
        }
      } finally {
        isCheckingSessionRef.current = false;
        setIsSessionChecked(true);
      }
    };

    if (isHydrated && isInitialized) {
      checkSession();
    }

    // Cleanup on unmount
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [isHydrated, isInitialized]); // Only run on hydration and initialization

  // ============================================
  // NextAuth Session Sync Effect
  // Sync NextAuth session with auth context after functions are defined
  // ============================================
  useEffect(() => {
    // Sync NextAuth session with auth context
    if (nextAuthStatus === "authenticated" && nextAuthSession) {
      const backendTokens = (nextAuthSession as any).backendTokens;
      const backendUser = (nextAuthSession as any).backendUser;

      if (backendTokens && backendUser) {
        // Don't sync if the backend access token is already expired
        const remainingTime = getTokenRemainingTime(backendTokens.accessToken);
        if (remainingTime <= 0) {
          console.log("[Auth] NextAuth backend token is expired, skipping sync");
          return;
        }

        // Only sync if tokens are different or user is different
        const shouldSync =
          token !== backendTokens.accessToken ||
          user?.id !== backendUser.id ||
          !hasSyncedNextAuthRef.current;

        if (shouldSync) {
          console.log("[Auth] Syncing NextAuth session to auth context");
          setToken(backendTokens.accessToken);
          setAccessToken(backendTokens.accessToken);
          setUser({
            id: backendUser.id,
            username: backendUser.username,
            email: backendUser.email,
            role: backendUser.role as "USER" | "ADMIN",
            isActive: backendUser.isActive,
            emailVerified: backendUser.emailVerified,
            createdAt: new Date().toISOString(), // fallback
          });
          scheduleTokenRefresh(remainingTime);
          hasSyncedNextAuthRef.current = true;
          toast.success("เข้าสู่ระบบสำเร็จ!");
        }
      }
    } else if (
      nextAuthStatus === "unauthenticated" &&
      hasSyncedNextAuthRef.current
    ) {
      // User logged out from NextAuth
      console.log("[Auth] NextAuth session ended, clearing auth context");
      clearAuth();
      hasSyncedNextAuthRef.current = false;
    }
  }, [
    nextAuthSession,
    nextAuthStatus,
    token,
    user,
    clearAuth,
    scheduleTokenRefresh,
  ]);

  // Track if login is in progress
  const isLoggingInRef = useRef(false);

  // Login with API
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Prevent duplicate login attempts
    if (isLoggingInRef.current) {
      console.log("[Auth] Login already in progress, skipping");
      return false;
    }

    isLoggingInRef.current = true;
    console.log("[Auth] Login started for:", email);
    setIsLoading(true);

    // Clear any existing refresh timeout before login
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    // Reset checking flag
    isCheckingSessionRef.current = false;

    try {
      const response = await authApi.login({ email, password });

      if (response.success) {
        console.log("[Auth] Login successful, setting up session");
        setUser(response.data.user);
        setToken(response.data.tokens.accessToken);
        scheduleTokenRefresh(response.data.tokens.expiresIn);
        setAccessToken(response.data.tokens.accessToken);
        toast.success("เข้าสู่ระบบสำเร็จ!");
        return true;
      } else {
        toast.error(response.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        return false;
      }
    } catch (err) {
      const message = authApi.getErrorMessage(err);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
      isLoggingInRef.current = false;
      console.log("[Auth] Login completed");
    }
  }, [scheduleTokenRefresh]);

  // Register with API
  const register = useCallback(async (
    username: string,
    email: string,
    password: string,
  ): Promise<boolean> => {
    setIsLoading(true);

    // Clear any existing refresh timeout before register
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    // Reset checking flag
    isCheckingSessionRef.current = false;

    try {
      const response = await authApi.register({ username, email, password });

      if (response.success) {
        console.log("[Auth] Register successful, setting up session");
        setUser(response.data.user);
        setToken(response.data.tokens.accessToken);
        scheduleTokenRefresh(response.data.tokens.expiresIn);
        setAccessToken(response.data.tokens.accessToken);
        toast.success("สร้างบัญชีสำเร็จ!");
        return true;
      } else {
        toast.error(response.message || "ไม่สามารถสร้างบัญชีได้");
        return false;
      }
    } catch (err) {
      const message = authApi.getErrorMessage(err);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [scheduleTokenRefresh]);

  // Logout with API
  const logout = useCallback(async () => {
    try {
      if (token) {
        await authApi.logout();
      }
    } catch {
      // Ignore logout errors
    } finally {
      // Sign out from NextAuth as well
      if (nextAuthStatus === "authenticated") {
        await nextAuthSignOut({ redirect: false });
      }
      clearAuth();
      hasSyncedNextAuthRef.current = false;
      // Mark session as checked so UI doesn't get stuck in loading state
      setIsSessionChecked(true);
      toast.success("ออกจากระบบสำเร็จ");
      // Redirect to login page after logout
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }, [token, nextAuthStatus, clearAuth]);

  // Update profile
  const updateProfile = useCallback(async (data: {
    username?: string;
    email?: string;
  }): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response = await authApi.updateProfile(data);

      if (response.success) {
        setUser(response.data);
        toast.success("อัปเดตโปรไฟล์สำเร็จ");
        return true;
      } else {
        toast.error(response.message || "ไม่สามารถอัปเดตโปรไฟล์ได้");
        return false;
      }
    } catch (err) {
      const message = authApi.getErrorMessage(err);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Change password
  const changePassword = useCallback(async (
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      console.log("[AuthContext] Sending change password request...");
      const response = await authApi.changePassword({
        currentPassword,
        newPassword,
      });
      console.log("[AuthContext] Change password response:", response);
      toast.success("เปลี่ยนรหัสผ่านสำเร็จ");
      return true;
    } catch (err) {
      console.error("[AuthContext] Change password error:", err);
      const message = authApi.getErrorMessage(err);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * @deprecated Use NextAuth signIn() instead. Legacy OAuth flow is deprecated.
   */
  const oauthLogin = useCallback(async (
    code: string,
    provider: "google" | "discord",
  ): Promise<boolean> => {
    setIsLoading(true);

    // Clear any existing refresh timeout before OAuth login
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    // Reset checking flag
    isCheckingSessionRef.current = false;

    try {
      const response = await authApi.oauthLogin({ code, provider });

      if (response.success) {
        console.log("[Auth] OAuth login successful, setting up session");
        setUser(response.data.user);
        setToken(response.data.tokens.accessToken);
        scheduleTokenRefresh(response.data.tokens.expiresIn);
        setAccessToken(response.data.tokens.accessToken);
        toast.success(
          response.data.isNewUser ? "สร้างบัญชีสำเร็จ!" : "เข้าสู่ระบบสำเร็จ!",
        );
        return true;
      } else {
        toast.error(response.message || "ไม่สามารถเข้าสู่ระบบได้");
        return false;
      }
    } catch (err) {
      const message = authApi.getErrorMessage(err);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [scheduleTokenRefresh]);

  const contextValue = useMemo(() => ({
    user,
    token,
    isLoading,
    isAuthenticated,
    isAdmin,
    login,
    register,
    oauthLogin,
    logout,
    updateProfile,
    changePassword,
    // "Initialized" means hydration + session restore has completed.
    isInitialized: isInitialized && isHydrated && isSessionChecked,
    isSessionChecked,
  }), [
    user, token, isLoading, isAuthenticated, isAdmin,
    login, register, oauthLogin, logout, updateProfile, changePassword,
    isInitialized, isHydrated, isSessionChecked,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Re-export User type for convenience
export type { User } from "../services/auth-api";

