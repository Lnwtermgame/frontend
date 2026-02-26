import { authClient } from "@/lib/client/gateway";

export interface OAuthProvider {
  id: string;
  name: string;
  displayName: string;
  isEnabled: boolean;
  clientId: string | null;
  clientSecret: string | null;
  authorizationUrl: string | null;
  tokenUrl: string | null;
  userInfoUrl: string | null;
  scope: string | null;
  iconUrl: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOAuthProviderData {
  name: string;
  displayName: string;
  isEnabled?: boolean;
  clientId?: string;
  clientSecret?: string;
  authorizationUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
  scope?: string;
  iconUrl?: string;
  sortOrder?: number;
}

export interface UpdateOAuthProviderData {
  name?: string;
  displayName?: string;
  isEnabled?: boolean;
  clientId?: string;
  clientSecret?: string;
  authorizationUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
  scope?: string;
  iconUrl?: string;
  sortOrder?: number;
}

export interface OAuthProviderListResponse {
  success: boolean;
  data: OAuthProvider[];
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

// Default OAuth provider configurations
export const DEFAULT_OAUTH_CONFIGS: Record<string, Partial<OAuthProvider>> = {
  google: {
    name: "google",
    displayName: "Google",
    authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
    scope: "openid email profile",
    iconUrl: "/brand-icons/google.svg",
  },
  discord: {
    name: "discord",
    displayName: "Discord",
    authorizationUrl: "https://discord.com/api/oauth2/authorize",
    tokenUrl: "https://discord.com/api/oauth2/token",
    userInfoUrl: "https://discord.com/api/users/@me",
    scope: "identify email",
    iconUrl: "/brand-icons/discord.svg",
  },
  facebook: {
    name: "facebook",
    displayName: "Facebook",
    authorizationUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    userInfoUrl: "https://graph.facebook.com/me?fields=id,name,email",
    scope: "email public_profile",
    iconUrl: "/brand-icons/facebook.svg",
  },
};

class OAuthProviderApiService {
  // Get all OAuth providers (admin)
  async getProviders(
    params: { page?: number; limit?: number } = {},
  ): Promise<OAuthProviderListResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", String(params.page));
    if (params.limit) queryParams.append("limit", String(params.limit));

    const response = await authClient.get(
      `/auth/admin/oauth-providers?${queryParams.toString()}`,
    );
    return response.data;
  }

  // Get enabled OAuth providers (public)
  async getEnabledProviders(): Promise<OAuthProviderListResponse> {
    const response = await authClient.get("/auth/oauth-providers");
    return response.data;
  }

  // Get single OAuth provider
  async getProvider(
    id: string,
  ): Promise<{ success: boolean; data: OAuthProvider }> {
    const response = await authClient.get(`/auth/admin/oauth-providers/${id}`);
    return response.data;
  }

  // Create OAuth provider
  async createProvider(
    data: CreateOAuthProviderData,
  ): Promise<{ success: boolean; data: OAuthProvider }> {
    const response = await authClient.post("/auth/admin/oauth-providers", data);
    return response.data;
  }

  // Update OAuth provider
  async updateProvider(
    id: string,
    data: UpdateOAuthProviderData,
  ): Promise<{ success: boolean; data: OAuthProvider }> {
    const response = await authClient.put(
      `/auth/admin/oauth-providers/${id}`,
      data,
    );
    return response.data;
  }

  // Delete OAuth provider
  async deleteProvider(
    id: string,
  ): Promise<{ success: boolean; data: { message: string } }> {
    const response = await authClient.delete(
      `/auth/admin/oauth-providers/${id}`,
    );
    return response.data;
  }

  // Toggle OAuth provider enabled status
  async toggleProvider(
    id: string,
  ): Promise<{ success: boolean; data: OAuthProvider }> {
    const response = await authClient.patch(
      `/auth/admin/oauth-providers/${id}/toggle`,
    );
    return response.data;
  }

  // Create default providers (Google, Discord, Facebook)
  async createDefaultProviders(): Promise<void> {
    for (const [name, config] of Object.entries(DEFAULT_OAUTH_CONFIGS)) {
      try {
        await this.createProvider({
          name,
          displayName: config.displayName || name,
          isEnabled: false,
          authorizationUrl: config.authorizationUrl ?? undefined,
          tokenUrl: config.tokenUrl ?? undefined,
          userInfoUrl: config.userInfoUrl ?? undefined,
          scope: config.scope ?? undefined,
          iconUrl: config.iconUrl ?? undefined,
        });
      } catch (error) {
        console.log(`Provider ${name} might already exist`);
      }
    }
  }
}

export const oauthProviderApi = new OAuthProviderApiService();
