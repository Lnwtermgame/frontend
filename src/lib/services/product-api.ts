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

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  stockQuantity: number;
  imageUrl?: string;
  images?: ProductImage[];
  productType: "CARD" | "DIRECT_TOPUP";
  seagmProductId?: string;
  seagmId?: number; // SEAGM API numeric product ID (e.g., 756)
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

// ============ Stock Management Types ============

export interface StockAlert {
  id: string;
  productId: string;
  variantId?: string;
  threshold: number;
  isActive: boolean;
  lastAlertAt?: string;
  product: {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string;
    stockQuantity: number;
  };
  variant?: {
    id: string;
    name: string;
    stockQuantity: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StockHistory {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  reason: "sale" | "restock" | "adjustment" | "return" | "initial";
  referenceId?: string;
  notes?: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
  };
  variant?: {
    id: string;
    name: string;
  };
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

// ============ SEAGM Product Types (Redesigned) ============

export interface SeagmProduct {
  id: string;
  seagmId: number;
  name: string;
  code: string;
  mode: "directtopup" | "card";
  region?: string;
  autoDelivery: boolean;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  types?: ProductType[];
}

export interface ProductType {
  id: string;
  seagmProductId: string;
  seagmProductNumericId?: number; // SEAGM API product/category id (e.g., 756)
  seagmTypeId: number;
  name: string;
  parValue: number;
  parValueCurrency: string;
  unitPrice: number;
  originPrice?: number;
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
  }): Promise<ProductsResponse> {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }

    const query = searchParams.toString();
    const response = await productClient.get<ProductsResponse>(
      `/api/products${query ? `?${query}` : ""}`,
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

  async getCategories(): Promise<{ success: boolean; data: Category[] }> {
    const response = await productClient.get(`/api/products/categories`);
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

  // ============ Admin: Stock Management ============

  async getStockAlerts(params?: {
    isActive?: boolean;
    productId?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    data: StockAlert[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    const response = await productClient.get(
      `/api/admin/inventory/alerts${query ? `?${query}` : ""}`,
    );
    return response.data;
  }

  async getTriggeredAlerts(): Promise<{
    success: boolean;
    data: StockAlert[];
  }> {
    const response = await productClient.get(
      `/api/admin/inventory/alerts/triggered`,
    );
    return response.data;
  }

  async getLowStockProducts(): Promise<{ success: boolean; data: any[] }> {
    const response = await productClient.get(`/api/admin/inventory/low-stock`);
    return response.data;
  }

  async createStockAlert(data: {
    productId: string;
    variantId?: string;
    threshold: number;
  }): Promise<{ success: boolean; data: StockAlert }> {
    const response = await productClient.post(
      `/api/admin/inventory/alerts`,
      data,
    );
    return response.data;
  }

  async updateStockAlert(
    alertId: string,
    data: { threshold?: number; isActive?: boolean },
  ): Promise<{ success: boolean; data: StockAlert }> {
    const response = await productClient.put(
      `/api/admin/inventory/alerts/${alertId}`,
      data,
    );
    return response.data;
  }

  async deleteStockAlert(
    alertId: string,
  ): Promise<{ success: boolean; data: { message: string } }> {
    const response = await productClient.delete(
      `/api/admin/inventory/alerts/${alertId}`,
    );
    return response.data;
  }

  async getStockHistory(params?: {
    productId?: string;
    reason?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    data: StockHistory[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    const response = await productClient.get(
      `/api/admin/inventory/history${query ? `?${query}` : ""}`,
    );
    return response.data;
  }

  async getProductStockHistory(
    productId: string,
    params?: { page?: number; limit?: number },
  ): Promise<{
    success: boolean;
    data: StockHistory[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { page = 1, limit = 20 } = params || {};
    const response = await productClient.get(
      `/api/admin/products/${productId}/stock-history?page=${page}&limit=${limit}`,
    );
    return response.data;
  }

  async restock(data: {
    productId: string;
    variantId?: string;
    quantity: number;
    notes?: string;
  }): Promise<{ success: boolean; data: StockHistory }> {
    const response = await productClient.post(
      `/api/admin/inventory/restock`,
      data,
    );
    return response.data;
  }

  async adjustStock(data: {
    productId: string;
    variantId?: string;
    quantity: number;
    notes?: string;
  }): Promise<{ success: boolean; data: StockHistory }> {
    const response = await productClient.post(
      `/api/admin/inventory/adjust`,
      data,
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

  // ============ Admin: SEAGM Sync ============

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

  // ============ SEAGM Games (Redesigned Structure) ============

  /**
   * Get all SEAGM games/products
   * Returns products with mode: 'directtopup' | 'card' and region info
   */
  async getGames(params?: {
    mode?: "directtopup" | "card";
    region?: string;
  }): Promise<{ success: boolean; data: SeagmProduct[] }> {
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
  ): Promise<{ success: boolean; data: SeagmProduct }> {
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
   * Search SEAGM games
   */
  async searchGames(
    query: string,
  ): Promise<{ success: boolean; data: SeagmProduct[] }> {
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
  ): Promise<{ success: boolean; data: SeagmProduct[] }> {
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
