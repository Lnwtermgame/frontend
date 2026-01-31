import { authClient } from '@/lib/client/gateway';

export interface FavoriteProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
}

export interface Favorite {
  id: string;
  userId: string;
  product: FavoriteProduct;
  createdAt: string;
}

export interface FavoritesListResponse {
  success: boolean;
  data: Favorite[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FavoriteResponse {
  success: boolean;
  data: Favorite;
  message?: string;
}

export interface RemoveFavoriteResponse {
  success: boolean;
  data: { message: string };
  message?: string;
}

class FavoriteApiService {
  async getFavorites(page = 1, limit = 20): Promise<FavoritesListResponse> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));

    const response = await authClient.get<FavoritesListResponse>(`/api/favorites?${params}`);
    return response.data;
  }

  async addFavorite(productId: string): Promise<FavoriteResponse> {
    const response = await authClient.post<FavoriteResponse>('/api/favorites', {
      productId,
    });
    return response.data;
  }

  async removeFavorite(favoriteId: string): Promise<RemoveFavoriteResponse> {
    const response = await authClient.delete<RemoveFavoriteResponse>(`/api/favorites/${favoriteId}`);
    return response.data;
  }

  getErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { error?: { message?: string } } } };
      return axiosError.response?.data?.error?.message || 'An error occurred';
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }
}

export const favoriteApi = new FavoriteApiService();
