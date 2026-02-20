"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { authApi, User } from '../services/auth-api';
import { setAccessToken } from '../client/gateway';

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
const AUTH_STORAGE_VERSION = '3';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [storageVersion, setStorageVersion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCheckingSessionRef = useRef(false);
  const isAuthenticated = !!user && !!token;
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsInitialized(true);
      return;
    }
    const storedUser = localStorage.getItem('mali-gamepass-user');
    const storedVersion = localStorage.getItem('auth_storage_version');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as User);
      } catch {
        localStorage.removeItem('mali-gamepass-user');
      }
    }
    setStorageVersion(storedVersion);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem('mali-gamepass-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('mali-gamepass-user');
    }
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (storageVersion) {
      localStorage.setItem('auth_storage_version', storageVersion);
    }
  }, [storageVersion]);

  // Check and clear stale storage data
  useEffect(() => {
    if (isInitialized && storageVersion !== AUTH_STORAGE_VERSION) {
      console.log('[Auth] Clearing stale auth data due to version mismatch');
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_refresh_token');
      }
      setStorageVersion(AUTH_STORAGE_VERSION);
    }
  }, [isInitialized, storageVersion, setUser, setStorageVersion]);

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
    setUser(null);
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    setAccessToken(null);
  }, [setToken, setUser]);

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
    // Prevent concurrent refresh attempts
    if (isCheckingSessionRef.current) {
      console.log('[Auth] Token refresh already in progress');
      return;
    }

    isCheckingSessionRef.current = true;
    console.log('[Auth] Performing token refresh...');

    try {
      const response = await authApi.refreshToken();

      if (response.success) {
        console.log('[Auth] Token refresh successful');
        setToken(response.data.accessToken);
        scheduleTokenRefresh(response.data.expiresIn);
        setAccessToken(response.data.accessToken);
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
        console.log('[Auth] Session check already in progress, skipping');
        return;
      }

      if (user && token) {
        const remainingTime = getTokenRemainingTime(token);
        if (remainingTime > 60) {
          scheduleTokenRefresh(remainingTime);
        } else if (remainingTime > 0) {
          await performTokenRefresh();
        }
        return;
      }

      if (token && !user) {
        isCheckingSessionRef.current = true;
        console.log('[Auth] Checking existing session...');
        try {
          const response = await authApi.getProfile();
          if (response.success) {
            console.log('[Auth] Session valid, restoring user');
            setUser(response.data);
            const remainingTime = getTokenRemainingTime(token);
            if (remainingTime > 60) {
              scheduleTokenRefresh(remainingTime);
            } else if (remainingTime > 0) {
              await performTokenRefresh();
            }
          }
        } catch (err) {
          console.log('[Auth] Session check failed:', err);
          if ((err as any)?.response?.status === 401) {
            clearAuth();
          }
        } finally {
          isCheckingSessionRef.current = false;
        }
        return;
      }

      isCheckingSessionRef.current = true;
      console.log('[Auth] Restoring session from refresh cookie...');
      try {
        const refreshResponse = await authApi.refreshToken();
        if (refreshResponse.success) {
          setToken(refreshResponse.data.accessToken);
          setAccessToken(refreshResponse.data.accessToken);
          scheduleTokenRefresh(refreshResponse.data.expiresIn);
          const profileResponse = await authApi.getProfile();
          if (profileResponse.success) {
            setUser(profileResponse.data);
          }
        }
      } catch (err) {
        console.log('[Auth] Refresh cookie session failed:', err);
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
        scheduleTokenRefresh(response.data.tokens.expiresIn);
        setAccessToken(response.data.tokens.accessToken);
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
        scheduleTokenRefresh(response.data.tokens.expiresIn);
        setAccessToken(response.data.tokens.accessToken);
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
      if (token) {
        await authApi.logout();
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
        scheduleTokenRefresh(response.data.tokens.expiresIn);
        setAccessToken(response.data.tokens.accessToken);
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
