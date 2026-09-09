import { apiFetch } from "./client";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
  isActive: boolean;
  emailVerified?: boolean;
}

export interface AuthResult {
  user: AuthUser;
  tokens: { accessToken: string; refreshToken?: string; expiresIn: number };
}

export interface OAuthProviderInfo {
  name: string;
  displayName: string;
  iconUrl?: string | null;
}

export function login(email: string, password: string) {
  return apiFetch<AuthResult>("/api/auth/login", {
    method: "POST",
    body: { email, password },
    skipAuth: true,
  });
}

export function register(username: string, email: string, password: string) {
  return apiFetch<AuthResult>("/api/auth/register", {
    method: "POST",
    body: { username, email, password },
    skipAuth: true,
  });
}

export function logout() {
  return apiFetch<{ message?: string }>("/api/auth/logout", { method: "POST" });
}

export function getProfile() {
  return apiFetch<AuthUser>("/api/auth/profile");
}

export function getOAuthProviders() {
  return apiFetch<OAuthProviderInfo[]>("/api/auth/oauth-providers", { skipAuth: true });
}

// ============ Password Recovery & Email Verification ============

export function requestPasswordReset(email: string): Promise<{ message: string }> {
  return apiFetch("/api/auth/request-password-reset", {
    method: "POST",
    body: { email },
    skipAuth: true,
  });
}

export function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  return apiFetch("/api/auth/reset-password", {
    method: "POST",
    body: { token, newPassword },
    skipAuth: true,
  });
}

export function verifyEmail(email: string, token: string): Promise<{ message: string }> {
  return apiFetch("/api/auth/verify-email", {
    method: "POST",
    body: { email, token },
    skipAuth: true,
  });
}

export function resendVerification(email: string): Promise<{ message: string }> {
  return apiFetch("/api/auth/resend-verification", {
    method: "POST",
    body: { email },
    skipAuth: true,
  });
}
