import { authClient } from "@/lib/client/gateway";

// User type matching backend UserResponse with optional frontend fields
export interface User {
  id: string;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
  isActive: boolean;
  emailVerified?: boolean; // Email verification status from backend
  authProvider?: "local" | "google" | "discord" | "hybrid"; // Authentication provider
  createdAt: string;
  // Optional frontend-only fields (not provided by backend yet)
  name?: string; // Alias for username (backward compatibility)
  avatar?: string;
  credits?: number;
  isPremium?: boolean;
}

// Auth tokens from backend
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Login/Register response
export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    tokens: AuthTokens;
  };
  message?: string;
}

// Profile response (just user data)
export interface ProfileResponse {
  success: boolean;
  data: User;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  username?: string;
  email?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface OAuthLoginData {
  code: string;
  provider: "google" | "discord";
}

export interface OAuthResponse {
  success: boolean;
  data: {
    user: User;
    tokens: AuthTokens;
    isNewUser: boolean;
  };
  message?: string;
}

class AuthApiService {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await authClient.post<AuthResponse>(
      "/api/auth/register",
      data,
    );
    return response.data;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await authClient.post<AuthResponse>(
      "/api/auth/login",
      data,
    );
    return response.data;
  }

  async refreshToken(
    refreshToken?: string,
  ): Promise<{ success: boolean; data: AuthTokens }> {
    const payload = refreshToken ? { refreshToken } : {};
    const response = await authClient.post("/api/auth/refresh-token", payload);
    return response.data;
  }

  async logout(refreshToken?: string): Promise<void> {
    const payload = refreshToken ? { refreshToken } : {};
    await authClient.post("/api/auth/logout", payload);
  }

  async getProfile(): Promise<ProfileResponse> {
    const response = await authClient.get<ProfileResponse>("/api/auth/profile");
    return response.data;
  }

  async updateProfile(data: UpdateProfileData): Promise<ProfileResponse> {
    const response = await authClient.put<ProfileResponse>(
      "/api/auth/profile",
      data,
    );
    return response.data;
  }

  async changePassword(
    data: ChangePasswordData,
  ): Promise<{ success: boolean; data: { message: string } }> {
    const response = await authClient.put("/api/auth/change-password", data);
    return response.data;
  }

  /**
   * @deprecated Use NextAuth signIn() instead. This legacy OAuth flow is deprecated.
   */
  async oauthLogin(data: OAuthLoginData): Promise<OAuthResponse> {
    const response = await authClient.post<OAuthResponse>(
      "/api/auth/oauth",
      data,
    );
    return response.data;
  }

  async verifyEmail(
    email: string,
    token: string,
  ): Promise<{
    success: boolean;
    data: { success: boolean; message: string };
    message?: string;
  }> {
    const response = await authClient.post("/api/auth/verify-email", {
      email,
      token,
    });
    return response.data;
  }

  async resendVerificationEmail(
    email: string,
  ): Promise<{ success: boolean; message?: string }> {
    const response = await authClient.post("/api/auth/resend-verification", {
      email,
    });
    return response.data;
  }

  async requestPasswordReset(
    email: string,
  ): Promise<{ success: boolean; message?: string }> {
    const response = await authClient.post("/api/auth/request-password-reset", {
      email,
    });
    return response.data;
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{
    success: boolean;
    data: { message: string };
    message?: string;
  }> {
    const response = await authClient.post("/api/auth/reset-password", {
      token,
      newPassword,
    });
    return response.data;
  }

  // Request OTP for password setup (OAuth users)
  async requestPasswordSetupOTP(
    email: string,
  ): Promise<{ success: boolean; message?: string }> {
    const response = await authClient.post(
      "/api/auth/request-password-setup-otp",
      { email },
    );
    return response.data;
  }

  // Verify OTP and set password (OAuth users)
  async verifyPasswordSetupOTP(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<{
    success: boolean;
    data: { message: string; authProvider: string };
    message?: string;
  }> {
    const response = await authClient.post(
      "/api/auth/verify-password-setup-otp",
      { email, otp, newPassword },
    );
    return response.data;
  }

  // Helper to get error message from API error
  getErrorMessage(error: unknown): string {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { data?: ApiError } };
      return axiosError.response?.data?.error?.message || "An error occurred";
    }
    if (error instanceof Error) {
      return error.message;
    }
    return "An unexpected error occurred";
  }
}

export const authApi = new AuthApiService();
