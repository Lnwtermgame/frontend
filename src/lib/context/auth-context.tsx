"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { useLocalStorage } from '../hooks/use-local-storage';
import { authApi, User, AuthTokens } from '../services/auth-api';

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  oauthLogin: (code: string, provider: 'google' | 'discord') => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: { username?: string; email?: string }) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  isInitialized: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token expiration buffer (refresh 1 minute before expiry)
const TOKEN_REFRESH_BUFFER = 60 * 1000; // 1 minute in milliseconds

// Default token lifetime in seconds (15 minutes)
const DEFAULT_TOKEN_LIFETIME = 15 * 60;

/**
 * Decode JWT token to get expiration time
 * Returns null if token is invalid
 */
function decodeToken(token: string): { exp?: number } | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
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
const AUTH_STORAGE_VERSION = '2';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser, isInitialized] = useLocalStorage<User | null>('mali-gamepass-user', null);
  const [token, setToken] = useLocalStorage<string | null>('auth_token', null);
  const [refreshToken, setRefreshToken] = useLocalStorage<string | null>('auth_refresh_token', null);
  const [storageVersion, setStorageVersion] = useLocalStorage<string | null>('auth_storage_version', null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCheckingSessionRef = useRef(false);
  const isAuthenticated = !!user && !!token;
  const isAdmin = user?.role === 'ADMIN';

  // Check and clear stale storage data
  useEffect(() => {
    if (isInitialized && storageVersion !== AUTH_STORAGE_VERSION) {
      console.log('[Auth] Clearing stale auth data due to version mismatch');
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      setStorageVersion(AUTH_STORAGE_VERSION);
    }
  }, [isInitialized, storageVersion, setUser, setToken, setRefreshToken, setStorageVersion]);

  // Debug logging for admin access issues
  useEffect(() => {
    if (isInitialized && user) {
      console.log('[Auth Debug] User:', user);
      console.log('[Auth Debug] Role:', user?.role);
      console.log('[Auth Debug] Is Admin:', isAdmin);
      console.log('[Auth Debug] Role type:', typeof user?.role);
    }
  }, [user, isAdmin, isInitialized]);

  // Clear all auth data
  const clearAuth = useCallback(() => {
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, [setToken, setRefreshToken, setUser]);

  // Schedule token refresh
  const scheduleTokenRefresh = useCallback((expiresIn: number) => {
    // Clear existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Schedule refresh before token expires
    const refreshDelay = (expiresIn * 1000) - TOKEN_REFRESH_BUFFER;
    if (refreshDelay > 0) {
      refreshTimeoutRef.current = setTimeout(() => {
        performTokenRefresh();
      }, refreshDelay);
    }
  }, []);

  // Perform token refresh
  const performTokenRefresh = useCallback(async () => {
    const currentRefreshToken = refreshToken;
    if (!currentRefreshToken) {
      console.log('[Auth] No refresh token available');
      return;
    }

    // Prevent concurrent refresh attempts
    if (isCheckingSessionRef.current) {
      console.log('[Auth] Token refresh already in progress');
      return;
    }

    isCheckingSessionRef.current = true;
    console.log('[Auth] Performing token refresh...');

    try {
      const response = await authApi.refreshToken(currentRefreshToken);

      if (response.success) {
        console.log('[Auth] Token refresh successful');
        setToken(response.data.accessToken);
        setRefreshToken(response.data.refreshToken);
        scheduleTokenRefresh(response.data.expiresIn);
      } else {
        console.log('[Auth] Token refresh failed');
        // Don't clear auth immediately - let the user continue until token actually expires
        toast.error('เซสชั่นหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง');
        clearAuth();
      }
    } catch (err) {
      console.log('[Auth] Token refresh error:', err);
      // Only clear auth on 401 errors from refresh endpoint
      if ((err as any)?.response?.status === 401) {
        toast.error('เซสชั่นหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง');
        clearAuth();
      }
      // On other errors (network, etc.), don't clear - the user might still have valid session
    } finally {
      isCheckingSessionRef.current = false;
    }
  }, [refreshToken, setToken, setRefreshToken, clearAuth, scheduleTokenRefresh]);

  // Hydration check
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Check for existing session on initial load
  useEffect(() => {
    const checkSession = async () => {
      // Prevent concurrent session checks
      if (isCheckingSessionRef.current) {
        console.log('[Auth] Session check already in progress, skipping');
        return;
      }

      // Only check if we have a token but no user data
      if (!token || user) {
        // If we have both user and token, just schedule refresh
        if (token && refreshToken && user) {
          const remainingTime = getTokenRemainingTime(token);
          if (remainingTime > 60) { // Only schedule if token has more than 1 minute left
            scheduleTokenRefresh(remainingTime);
          }
        }
        return;
      }

      isCheckingSessionRef.current = true;
      console.log('[Auth] Checking existing session...');

      try {
        const response = await authApi.getProfile();
        if (response.success) {
          console.log('[Auth] Session valid, restoring user');
          setUser(response.data);
          // Schedule token refresh if we have a refresh token
          if (refreshToken) {
            const remainingTime = getTokenRemainingTime(token);
            if (remainingTime > 60) { // Only schedule if token has more than 1 minute left
              scheduleTokenRefresh(remainingTime);
            } else if (remainingTime > 0) {
              // Token expiring soon, refresh now
              console.log('[Auth] Token expiring soon, refreshing...');
              await performTokenRefresh();
            }
          }
        }
      } catch (err) {
        console.log('[Auth] Session check failed:', err);
        // Only clear auth if we get a 401 (unauthorized)
        // Don't clear on network errors or other issues
        if ((err as any)?.response?.status === 401) {
          clearAuth();
        }
      } finally {
        isCheckingSessionRef.current = false;
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

  // Track if login is in progress
  const isLoggingInRef = useRef(false);

  // Login with API
  const login = async (email: string, password: string): Promise<boolean> => {
    // Prevent duplicate login attempts
    if (isLoggingInRef.current) {
      console.log('[Auth] Login already in progress, skipping');
      return false;
    }

    isLoggingInRef.current = true;
    console.log('[Auth] Login started for:', email);
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
        console.log('[Auth] Login successful, setting up session');
        setUser(response.data.user);
        setToken(response.data.tokens.accessToken);
        setRefreshToken(response.data.tokens.refreshToken);
        scheduleTokenRefresh(response.data.tokens.expiresIn);
        toast.success('เข้าสู่ระบบสำเร็จ!');
        return true;
      } else {
        toast.error(response.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        return false;
      }
    } catch (err) {
      const message = authApi.getErrorMessage(err);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
      isLoggingInRef.current = false;
      console.log('[Auth] Login completed');
    }
  };

  // Register with API
  const register = async (username: string, email: string, password: string): Promise<boolean> => {
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
        console.log('[Auth] Register successful, setting up session');
        setUser(response.data.user);
        setToken(response.data.tokens.accessToken);
        setRefreshToken(response.data.tokens.refreshToken);
        scheduleTokenRefresh(response.data.tokens.expiresIn);
        toast.success('สร้างบัญชีสำเร็จ!');
        return true;
      } else {
        toast.error(response.message || 'ไม่สามารถสร้างบัญชีได้');
        return false;
      }
    } catch (err) {
      const message = authApi.getErrorMessage(err);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout with API
  const logout = async () => {
    try {
      if (token && refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // Ignore logout errors
    } finally {
      clearAuth();
      toast.success('ออกจากระบบสำเร็จ');
    }
  };

  // Update profile
  const updateProfile = async (data: { username?: string; email?: string }): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response = await authApi.updateProfile(data);

      if (response.success) {
        setUser(response.data);
        toast.success('อัปเดตโปรไฟล์สำเร็จ');
        return true;
      } else {
        toast.error(response.message || 'ไม่สามารถอัปเดตโปรไฟล์ได้');
        return false;
      }
    } catch (err) {
      const message = authApi.getErrorMessage(err);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Change password
  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      console.log('[AuthContext] Sending change password request...');
      const response = await authApi.changePassword({ currentPassword, newPassword });
      console.log('[AuthContext] Change password response:', response);
      toast.success('เปลี่ยนรหัสผ่านสำเร็จ');
      return true;
    } catch (err) {
      console.error('[AuthContext] Change password error:', err);
      const message = authApi.getErrorMessage(err);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // OAuth login with Google or Discord
  const oauthLogin = async (code: string, provider: 'google' | 'discord'): Promise<boolean> => {
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
        console.log('[Auth] OAuth login successful, setting up session');
        setUser(response.data.user);
        setToken(response.data.tokens.accessToken);
        setRefreshToken(response.data.tokens.refreshToken);
        scheduleTokenRefresh(response.data.tokens.expiresIn);
        toast.success(response.data.isNewUser ? 'สร้างบัญชีสำเร็จ!' : 'เข้าสู่ระบบสำเร็จ!');
        return true;
      } else {
        toast.error(response.message || 'ไม่สามารถเข้าสู่ระบบได้');
        return false;
      }
    } catch (err) {
      const message = authApi.getErrorMessage(err);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
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
      isInitialized: isInitialized && isHydrated
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Re-export User type for convenience
export type { User } from '../services/auth-api';
