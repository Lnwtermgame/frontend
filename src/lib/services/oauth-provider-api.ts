import { authClient } from "@/lib/client/gateway";

export interface OAuthProvider {
  id: string;
  name: string;
  displayName: string;
  isEnabled: boolean;
  // Credentials moved to .env - these fields are no longer stored
  iconUrl: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOAuthProviderData {
  name: string;
  displayName: string;
  isEnabled?: boolean;
  // Credentials moved to .env - no longer sent in API
  iconUrl?: string;
  sortOrder?: number;
}

export interface UpdateOAuthProviderData {
  name?: string;
  displayName?: string;
  isEnabled?: boolean;
  // Credentials moved to .env - no longer sent in API
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

// Default OAuth provider configurations (display only - credentials in .env)
export const DEFAULT_OAUTH_CONFIGS: Record<string, Partial<OAuthProvider>> = {
  google: {
    name: "google",
    displayName: "Google",
    iconUrl: "/brand-icons/google.svg",
  },
  discord: {
    name: "discord",
    displayName: "Discord",
    iconUrl: "/brand-icons/discord.svg",
  },
  facebook: {
    name: "facebook",
    displayName: "Facebook",
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
    const response = await authClient.get("/api/auth/oauth-providers");
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
  // Credentials are configured in .env, this just creates the database entries
  async createDefaultProviders(): Promise<void> {
    for (const [name, config] of Object.entries(DEFAULT_OAUTH_CONFIGS)) {
      try {
        await this.createProvider({
          name,
          displayName: config.displayName || name,
          isEnabled: false,
          iconUrl: config.iconUrl ?? undefined,
        });
      } catch (error) {
        console.log(`Provider ${name} might already exist`);
      }
    }
  }
}

export const oauthProviderApi = new OAuthProviderApiService();
