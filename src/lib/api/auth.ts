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
