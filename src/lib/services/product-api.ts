import { productClient } from "@/lib/client/gateway";

// ============ Product Types ============

export interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  price?: number;
  stockQuantity: number;
  isActive: boolean;
  sortOrder: number;
  options: VariantOption[];
  createdAt: string;
}

export interface VariantOption {
  id: string;
  name: string;
  value: string;
}

export interface ProductAttribute {
  id: string;
  name: string;
  value: string;
  sortOrder: number;
  createdAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  content: string;
  isVerified: boolean;
  isApproved: boolean;
  helpfulCount: number;
  user?: {
    id: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSummary {
  averageRating: number;
  reviewCount: number;
  ratingBreakdown: Record<number, number>;
}

export interface GameDetails {
  developer?: string;
  publisher?: string;
  platforms?: string[];
  region?: string;
  autoDelivery?: boolean;
  mode?: "directtopup" | "card";
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  imageUrl?: string;
  coverImageUrl?: string;
  images?: ProductImage[];
  productType: "CARD" | "DIRECT_TOPUP";
  requiredFields?: SeagmField[];
  isActive: boolean;
  isFeatured?: boolean;
  isBestseller?: boolean;
  salesCount?: number;
  viewCount?: number;
  averageRating?: number;
  reviewCount?: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  gameDetails?: GameDetails;
  // Product types/denominations - public response (sanitized)
  types?: ProductType[];
  variants?: ProductVariant[];
  attributes?: ProductAttribute[];
  tags?: Tag[];
  reviews?: Review[];
  createdAt: string;
  updatedAt: string;
}

// ============ Request/Response Types ============

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductResponse {
  success: boolean;
  data: Product;
}

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VariantsResponse {
  success: boolean;
  data: ProductVariant[];
}

export interface AttributesResponse {
  success: boolean;
  data: ProductAttribute[];
}

export interface ImagesResponse {
  success: boolean;
  data: ProductImage[];
}

export interface TagsResponse {
  success: boolean;
  data: Tag[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ReviewsResponse {
  success: boolean;
  data: Review[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  averageRating: number;
  ratingBreakdown: Record<number, number>;
}

export interface RelatedProductsResponse {
  success: boolean;
  data: Product[];
}

// ============ Category Types ============

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  parentId?: string;
  sortOrder: number;
  productCount?: number;
  children?: Category[];
}

// ============ Product Fields Types ============

export interface SeagmField {
  type: "text" | "input" | "select";
  label: string;
  label_zh?: string;
  multiline: boolean;
  name: string;
  placeholder: string;
  prefix: string;
  position: number;
  required?: boolean;
  options?: {
    label: string;
    value: string;
    child?: {
      name: string;
      label: string;
      prefix: string;
      options: {
        parent_value: string;
        child_options: {
          label: string;
          value: string;
        }[];
      }[];
    }[];
  }[];
}

export interface ProductFieldsResult {
  fields: SeagmField[];
  productType: "CARD" | "DIRECT_TOPUP" | null;
  fromCache: boolean;
}

export interface ValidateFieldsResult {
  valid: boolean;
  missing: string[];
  fields: SeagmField[];
}

export interface SyncResult {
  productsCreated: number;
  productsUpdated: number;
  productTypesCreated: number;
  productTypesUpdated: number;
  errors: string[];
}

// ============ External Supplier Product Types ============

// Renaming SeagmProduct to Product as we migrated
export type SeagmProduct = Product;

/**
 * Public ProductType - sanitized for customer-facing API
 * Only contains displayPrice, no cost/supplier pricing data
 */
export interface ProductType {
  id: string;
  productId: string;
  name: string;
  displayPrice: number;
  currency: string;
  hasStock: boolean;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
  fields?: SeagmField[];
}

/**
 * Admin ProductType - full data with all pricing and supplier info
 * Used only in admin pages (fetched via /api/admin/products)
 */
export interface AdminProductType {
  id: string;
  productId: string;
  seagmProductId?: string;
  seagmProductNumericId?: number;
  seagmTypeId: number;
  name: string;
  parValue: number;
  parValueCurrency: string;
  unitPrice: number;
  originPrice?: number;
  sellingPrice?: number;
  displayPrice: number;
  discountRate?: number;
  currency: string;
  hasStock: boolean;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
  fields?: SeagmField[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Admin Product - full data with supplier info for admin pages
 */
export interface AdminProduct extends Omit<Product, "types"> {
  seagmProductId?: string;
  seagmId?: number;
  seagmTypes?: AdminProductType[];
}

// ============ DTOs ============

export interface CreateReviewDTO {
  rating: number;
  title?: string;
  content: string;
}

export interface UpdateReviewDTO {
  rating?: number;
  title?: string;
  content?: string;
}

export interface MarkHelpfulDTO {
  isHelpful: boolean;
}

// ============ Product API Service ============

class ProductApiService {
  // ============ Products ============

  async getProducts(params?: {
    categoryId?: string;
    tagId?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    isFeatured?: boolean;
    isBestseller?: boolean;
    inStock?: boolean;
    isActive?: boolean;
    sortBy?: "price" | "name" | "createdAt" | "salesCount" | "viewCount";
    sortOrder?: "asc" | "desc";
    page?: number;
    limit?: number;
    signal?: AbortSignal;
  }): Promise<ProductsResponse> {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== "signal") {
          searchParams.append(key, String(value));
        }
      });
    }

    const query = searchParams.toString();
    const response = await productClient.get<ProductsResponse>(
      `/api/products${query ? `?${query}` : ""}`,
      { signal: params?.signal },
    );
    return response.data;
  }

  async getProductById(id: string): Promise<ProductResponse> {
    const response = await productClient.get<ProductResponse>(
      `/api/products/${id}`,
    );
    return response.data;
  }

  async getProductBySlug(slug: string): Promise<ProductResponse> {
    const response = await productClient.get<ProductResponse>(
      `/api/products/slug/${slug}`,
    );
    return response.data;
  }

  async searchProducts(
    query: string,
    page = 1,
    limit = 20,
  ): Promise<ProductsResponse> {
    const response = await productClient.get<ProductsResponse>(
      `/api/products/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
    );
    return response.data;
  }

  // ============ Featured / Bestsellers / New Arrivals ============

  async getFeaturedProducts(
    limit = 8,
  ): Promise<{ success: boolean; data: Product[] }> {
    const response = await productClient.get(
      `/api/products/featured?limit=${limit}`,
    );
    return response.data;
  }

  async getBestsellerProducts(
    limit = 8,
  ): Promise<{ success: boolean; data: Product[] }> {
    const response = await productClient.get(
      `/api/products/bestsellers?limit=${limit}`,
    );
    return response.data;
  }

  async getNewArrivals(
    limit = 8,
  ): Promise<{ success: boolean; data: Product[] }> {
    const response = await productClient.get(
      `/api/products/new-arrivals?limit=${limit}`,
    );
    return response.data;
  }

  // ============ Variants ============

  async getProductVariants(productId: string): Promise<VariantsResponse> {
    const response = await productClient.get<VariantsResponse>(
      `/api/products/${productId}/variants`,
    );
    return response.data;
  }

  // ============ Attributes ============

  async getProductAttributes(productId: string): Promise<AttributesResponse> {
    const response = await productClient.get<AttributesResponse>(
      `/api/products/${productId}/attributes`,
    );
    return response.data;
  }

  // ============ Images ============

  async getProductImages(productId: string): Promise<ImagesResponse> {
    const response = await productClient.get<ImagesResponse>(
      `/api/products/${productId}/images`,
    );
    return response.data;
  }

  // ============ Tags ============

  async getTags(page = 1, limit = 20): Promise<TagsResponse> {
    const response = await productClient.get<TagsResponse>(
      `/api/products/tags?page=${page}&limit=${limit}`,
    );
    return response.data;
  }

  async getTagById(id: string): Promise<{ success: boolean; data: Tag }> {
    const response = await productClient.get(`/api/products/tags/${id}`);
    return response.data;
  }

  async getTagBySlug(slug: string): Promise<{ success: boolean; data: Tag }> {
    const response = await productClient.get(`/api/products/tags/slug/${slug}`);
    return response.data;
  }

  async getProductTags(productId: string): Promise<TagsResponse> {
    const response = await productClient.get<TagsResponse>(
      `/api/products/${productId}/tags`,
    );
    return response.data;
  }

  // ============ Reviews ============

  async getProductReviews(
    productId: string,
    params?: {
      isApproved?: boolean;
      isVerified?: boolean;
      sortBy?: "rating" | "helpfulCount" | "createdAt";
      sortOrder?: "asc" | "desc";
      page?: number;
      limit?: number;
    },
  ): Promise<ReviewsResponse> {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }

    const query = searchParams.toString();
    const response = await productClient.get<ReviewsResponse>(
      `/api/products/${productId}/reviews${query ? `?${query}` : ""}`,
    );
    return response.data;
  }

  async createReview(
    productId: string,
    data: CreateReviewDTO,
  ): Promise<{ success: boolean; data: Review }> {
    const response = await productClient.post(
      `/api/products/${productId}/reviews`,
      data,
    );
    return response.data;
  }

  async updateReview(
    reviewId: string,
    data: UpdateReviewDTO,
  ): Promise<{ success: boolean; data: Review }> {
    const response = await productClient.put(`/api/reviews/${reviewId}`, data);
    return response.data;
  }

  async deleteReview(
    reviewId: string,
  ): Promise<{ success: boolean; data: { message: string } }> {
    const response = await productClient.delete(`/api/reviews/${reviewId}`);
    return response.data;
  }

  async markReviewHelpful(
    reviewId: string,
    isHelpful: boolean,
  ): Promise<{ success: boolean; data: { message: string } }> {
    const response = await productClient.post(
      `/api/reviews/${reviewId}/helpful`,
      { isHelpful },
    );
    return response.data;
  }

  // ============ Related Products ============

  async getRelatedProducts(
    productId: string,
    limit = 8,
  ): Promise<RelatedProductsResponse> {
    const response = await productClient.get<RelatedProductsResponse>(
      `/api/products/${productId}/related?limit=${limit}`,
    );
    return response.data;
  }

  // ============ Categories ============

  async getCategories(
    signal?: AbortSignal,
  ): Promise<{ success: boolean; data: Category[] }> {
    const response = await productClient.get(`/api/products/categories`, {
      signal,
    });
    return response.data;
  }

  async getCategoryTree(): Promise<{ success: boolean; data: Category[] }> {
    const response = await productClient.get(`/api/products/categories/tree`);
    return response.data;
  }

  async getCategoryById(
    id: string,
  ): Promise<{ success: boolean; data: Category }> {
    const response = await productClient.get(`/api/products/categories/${id}`);
    return response.data;
  }

  async getCategoryBySlug(
    slug: string,
  ): Promise<{ success: boolean; data: Category }> {
    const response = await productClient.get(
      `/api/products/categories/slug/${slug}`,
    );
    return response.data;
  }

  // ============ Product Fields ============

  async getProductFields(
    productId: string,
  ): Promise<{ success: boolean; data: ProductFieldsResult }> {
    const response = await productClient.get(
      `/api/products/${productId}/fields`,
    );
    return response.data;
  }

  async validateProductFields(
    productId: string,
    values: Record<string, string>,
  ): Promise<{ success: boolean; data: ValidateFieldsResult }> {
    const response = await productClient.post(
      `/api/products/${productId}/fields/validate`,
      values,
    );
    return response.data;
  }

  // ============ Favorites ============

  async getFavorites(): Promise<{ success: boolean; data: Product[] }> {
    const response = await productClient.get("/api/favorites");
    return response.data;
  }

  async addFavorite(
    productId: string,
  ): Promise<{ success: boolean; data: { message: string } }> {
    const response = await productClient.post("/api/favorites", { productId });
    return response.data;
  }

  async removeFavorite(
    favoriteId: string,
  ): Promise<{ success: boolean; data: { message: string } }> {
    const response = await productClient.delete(`/api/favorites/${favoriteId}`);
    return response.data;
  }

  async findFavoriteId(productId: string): Promise<string | null> {
    try {
      const response = await productClient.get("/api/favorites");
      if (response.data.success) {
        const favorite = response.data.data.find(
          (f: any) => f.product?.id === productId,
        );
        return favorite?.id || null;
      }
      return null;
    } catch {
      return null;
    }
  }

  async checkIsFavorite(productId: string): Promise<boolean> {
    try {
      const response = await productClient.get("/api/favorites");
      if (response.data.success) {
        // Favorites API returns { id, product: { id, name, ... } } structure
        return response.data.data.some((f: any) => f.product?.id === productId);
      }
      return false;
    } catch {
      return false;
    }
  }

  // ============ Admin: Category CRUD ============

  async createCategory(
    data: Partial<Category>,
  ): Promise<{ success: boolean; data: Category }> {
    const response = await productClient.post("/api/admin/categories", data);
    return response.data;
  }

  async updateCategory(
    categoryId: string,
    data: Partial<Category>,
  ): Promise<{ success: boolean; data: Category }> {
    const response = await productClient.put(
      `/api/admin/categories/${categoryId}`,
      data,
    );
    return response.data;
  }

  async deleteCategory(
    categoryId: string,
  ): Promise<{ success: boolean; data: { message: string } }> {
    const response = await productClient.delete(
      `/api/admin/categories/${categoryId}`,
    );
    return response.data;
  }

  async reorderCategories(
    categoryIds: string[],
  ): Promise<{ success: boolean; data: { message: string } }> {
    const response = await productClient.post("/api/admin/categories/reorder", {
      categoryIds,
    });
    return response.data;
  }

  // ============ Admin: Product CRUD ============

  async updateProduct(
    productId: string,
    data: Partial<Product>,
  ): Promise<{ success: boolean; data: Product }> {
    const response = await productClient.put(
      `/api/admin/products/${productId}`,
      data,
    );
    return response.data;
  }

  async deleteProduct(
    productId: string,
  ): Promise<{ success: boolean; data: { message: string } }> {
    const response = await productClient.delete(
      `/api/admin/products/${productId}`,
    );
    return response.data;
  }

  async createProduct(
    data: Partial<Product>,
  ): Promise<{ success: boolean; data: Product }> {
    const response = await productClient.post("/api/admin/products", data);
    return response.data;
  }

  // ============ Admin: Product Sync ============

  /**
   * Get all products for admin with full pricing/supplier data
   */
  async getProductsAdmin(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<AdminProduct>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", String(params.page));
    if (params?.limit) searchParams.append("limit", String(params.limit));
    if (params?.search) searchParams.append("search", params.search);
    const query = searchParams.toString();
    const response = await productClient.get(
      `/api/admin/products${query ? `?${query}` : ""}`,
    );
    return response.data;
  }

  async syncAll(): Promise<{ success: boolean; data: SyncResult }> {
    const response = await productClient.post("/api/admin/sync/all");
    return response.data;
  }

  async syncCards(): Promise<{ success: boolean; data: SyncResult }> {
    const response = await productClient.post("/api/admin/sync/cards");
    return response.data;
  }

  async syncDirectTopUp(): Promise<{ success: boolean; data: SyncResult }> {
    const response = await productClient.post("/api/admin/sync/direct-topup");
    return response.data;
  }

  // ============ Games API ============

  /**
   * Get all games/products
   * Returns products with mode: 'directtopup' | 'card' and region info
   */
  async getGames(params?: {
    mode?: "directtopup" | "card";
    region?: string;
  }): Promise<{ success: boolean; data: Product[] }> {
    const searchParams = new URLSearchParams();
    if (params?.mode) searchParams.append("mode", params.mode);
    if (params?.region) searchParams.append("region", params.region);
    const query = searchParams.toString();
    const response = await productClient.get(
      `/games${query ? `?${query}` : ""}`,
    );
    return response.data;
  }

  /**
   * Get a specific game by its code/slug
   * Example: getGame('pubg-mobile-uc-top-up')
   * Returns game with all available types (denominations)
   */
  async getGame(
    gameCode: string,
  ): Promise<{ success: boolean; data: Product }> {
    const response = await productClient.get(`/games/${gameCode}`);
    return response.data;
  }

  /**
   * Get product types (denominations) for a specific game
   * Example: getGameTypes('pubg-mobile-uc-top-up') -> [60 UC, 325 UC, ...]
   */
  async getGameTypes(
    gameCode: string,
  ): Promise<{ success: boolean; data: ProductType[] }> {
    const response = await productClient.get(`/games/${gameCode}/types`);
    return response.data;
  }

  /**
   * Get supplier product by internal database ID
   * Example: getGameById('clj234...') -> Product
   */
  async getGameById(
    seagmProductId: string,
  ): Promise<{ success: boolean; data: Product }> {
    const response = await productClient.get(`/games/id/${seagmProductId}`);
    return response.data;
  }

  /**
   * Get product types by internal supplier product ID
   * Example: getGameTypesById('clj234...') -> [60 UC, 325 UC, ...]
   */
  async getGameTypesById(
    seagmProductId: string,
  ): Promise<{ success: boolean; data: ProductType[] }> {
    const response = await productClient.get(
      `/games/id/${seagmProductId}/types`,
    );
    return response.data;
  }

  /**
   * Search SEAGM games
   */
  async searchGames(
    query: string,
  ): Promise<{ success: boolean; data: Product[] }> {
    const response = await productClient.get(
      `/games/search?q=${encodeURIComponent(query)}`,
    );
    return response.data;
  }

  /**
   * Get games by region
   * Example: getGamesByRegion('th') -> Thai games
   */
  async getGamesByRegion(
    region: string,
  ): Promise<{ success: boolean; data: Product[] }> {
    const response = await productClient.get(`/games/region/${region}`);
    return response.data;
  }

  // ============ Admin: Product Fields Management ============

  async refreshProductFields(productId: string): Promise<{
    success: boolean;
    data: ProductFieldsResult & { message: string };
  }> {
    const response = await productClient.post(
      `/api/admin/products/${productId}/fields/refresh`,
    );
    return response.data;
  }

  async clearProductFieldsCache(
    productId: string,
  ): Promise<{ success: boolean; data: { message: string } }> {
    const response = await productClient.post(
      `/api/admin/products/${productId}/fields/clear-cache`,
    );
    return response.data;
  }

  async getBatchProductFields(productIds: string[]): Promise<{
    success: boolean;
    data: (ProductFieldsResult & { productId: string; error?: string })[];
  }> {
    const response = await productClient.post(
      "/api/admin/products/fields/batch",
      { productIds },
    );
    return response.data;
  }

  async getCacheStats(): Promise<{ success: boolean; data: { size: number } }> {
    const response = await productClient.get("/api/admin/cache/stats");
    return response.data;
  }

  // ============ Admin: Product Types Pricing ============

  async updateSellingPrices(
    prices: Record<string, string>,
  ): Promise<{ success: boolean; data: { message: string } }> {
    const response = await productClient.put(
      "/api/admin/product-types/prices",
      {
        prices,
      },
    );
    return response.data;
  }

  async bulkUpdateSellingPrices(
    strategy: "mid" | "nearSeagm" | "smallProfit" | "seagm" | "custom",
    customPercent?: number,
  ): Promise<{
    success: boolean;
    data: { message: string; strategy: string; affectedCount: number };
  }> {
    const response = await productClient.post(
      "/api/admin/product-types/prices/bulk",
      { strategy, customPercent },
    );
    return response.data;
  }

  // ============ Player Verification ============

  async verifyPlayer(
    productId: string,
    playerInfo: Record<string, string>,
  ): Promise<{
    valid: boolean;
    supported: boolean;
    message: string;
    accountInfo?: {
      username?: string;
      server?: string;
      region?: string;
      [key: string]: any;
    };
    errorCode?: number;
  }> {
    const response = await productClient.post<{
      success: boolean;
      data: {
        valid: boolean;
        supported: boolean;
        message: string;
        accountInfo?: {
          username?: string;
          server?: string;
          region?: string;
          [key: string]: any;
        };
        errorCode?: number;
      };
    }>(`/api/products/${productId}/verify-player`, { playerInfo });
    return response.data.data;
  }

  // ============ Helper Methods ============

  getErrorMessage(error: unknown): string {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      return axiosError.response?.data?.error?.message || "An error occurred";
    }
    if (error instanceof Error) {
      return error.message;
    }
    return "An unexpected error occurred";
  }
}

export const productApi = new ProductApiService();
