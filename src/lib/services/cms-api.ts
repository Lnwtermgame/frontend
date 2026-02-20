import { supportClient } from "@/lib/client/gateway";

// ============ CMS Page Types ============

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  version: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCmsPageData {
  slug: string;
  title: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  isPublished?: boolean;
}

export interface UpdateCmsPageData {
  slug?: string;
  title?: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  isPublished?: boolean;
}

// ============ News Article Types ============

export type NewsCategory = "general" | "promotion" | "update" | "event";

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  category: NewsCategory;
  tags: string[];
  isPublished: boolean;
  isFeatured: boolean;
  viewCount: number;
  publishedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewsArticleListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  category: NewsCategory;
  tags: string[];
  isFeatured: boolean;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
}

export interface CreateNewsArticleData {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category?: NewsCategory;
  tags?: string[];
  isPublished?: boolean;
  isFeatured?: boolean;
  publishedAt?: string;
}

export interface UpdateNewsArticleData {
  title?: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  category?: NewsCategory;
  tags?: string[];
  isPublished?: boolean;
  isFeatured?: boolean;
  publishedAt?: string;
}

// ============ API Response Types ============

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============ CMS API Service ============

class CmsApiService {
  // ============ Public Methods ============

  async getPageBySlug(slug: string): Promise<ApiResponse<CmsPage>> {
    const response = await supportClient.get<ApiResponse<CmsPage>>(
      `/api/cms/pages/${slug}`,
    );
    return response.data;
  }

  async getNewsArticles(
    page = 1,
    limit = 20,
    category?: NewsCategory,
    search?: string,
  ): Promise<ApiResponse<NewsArticleListItem[]>> {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("limit", String(limit));
    if (category) params.append("category", category);
    if (search) params.append("search", search);

    const response = await supportClient.get<
      ApiResponse<NewsArticleListItem[]>
    >(`/api/cms/news?${params}`);
    return response.data;
  }

  async getNewsArticleBySlug(slug: string): Promise<ApiResponse<NewsArticle>> {
    const response = await supportClient.get<ApiResponse<NewsArticle>>(
      `/api/cms/news/${slug}`,
    );
    return response.data;
  }

  async getFeaturedNews(limit = 5): Promise<ApiResponse<NewsArticle[]>> {
    const response = await supportClient.get<ApiResponse<NewsArticle[]>>(
      `/api/cms/news/featured?limit=${limit}`,
    );
    return response.data;
  }

  async getRecentNews(limit = 10): Promise<ApiResponse<NewsArticle[]>> {
    const response = await supportClient.get<ApiResponse<NewsArticle[]>>(
      `/api/cms/news/recent?limit=${limit}`,
    );
    return response.data;
  }

  // ============ Admin Methods ============

  // CMS Pages
  async getPages(
    page = 1,
    limit = 20,
    search?: string,
    isPublished?: boolean,
  ): Promise<ApiResponse<CmsPage[]>> {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("limit", String(limit));
    if (search) params.append("search", search);
    if (isPublished !== undefined)
      params.append("isPublished", String(isPublished));

    const response = await supportClient.get<ApiResponse<CmsPage[]>>(
      `/api/admin/cms/pages?${params}`,
    );
    return response.data;
  }

  async getPageById(id: string): Promise<ApiResponse<CmsPage>> {
    const response = await supportClient.get<ApiResponse<CmsPage>>(
      `/api/admin/cms/pages/${id}`,
    );
    return response.data;
  }

  async createPage(data: CreateCmsPageData): Promise<ApiResponse<CmsPage>> {
    const response = await supportClient.post<ApiResponse<CmsPage>>(
      "/api/admin/cms/pages",
      data,
    );
    return response.data;
  }

  async updatePage(
    id: string,
    data: UpdateCmsPageData,
  ): Promise<ApiResponse<CmsPage>> {
    const response = await supportClient.put<ApiResponse<CmsPage>>(
      `/api/admin/cms/pages/${id}`,
      data,
    );
    return response.data;
  }

  async deletePage(id: string): Promise<ApiResponse<{ success: boolean }>> {
    const response = await supportClient.delete<
      ApiResponse<{ success: boolean }>
    >(`/api/admin/cms/pages/${id}`);
    return response.data;
  }

  // News Articles
  async getAllNewsArticles(
    page = 1,
    limit = 20,
    filters?: {
      search?: string;
      category?: NewsCategory;
      isPublished?: boolean;
      isFeatured?: boolean;
    },
  ): Promise<ApiResponse<NewsArticle[]>> {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("limit", String(limit));
    if (filters?.search) params.append("search", filters.search);
    if (filters?.category) params.append("category", filters.category);
    if (filters?.isPublished !== undefined)
      params.append("isPublished", String(filters.isPublished));
    if (filters?.isFeatured !== undefined)
      params.append("isFeatured", String(filters.isFeatured));

    const response = await supportClient.get<ApiResponse<NewsArticle[]>>(
      `/api/admin/cms/news?${params}`,
    );
    return response.data;
  }

  async getNewsArticleById(id: string): Promise<ApiResponse<NewsArticle>> {
    const response = await supportClient.get<ApiResponse<NewsArticle>>(
      `/api/admin/cms/news/${id}`,
    );
    return response.data;
  }

  async createNewsArticle(
    data: CreateNewsArticleData,
  ): Promise<ApiResponse<NewsArticle>> {
    const response = await supportClient.post<ApiResponse<NewsArticle>>(
      "/api/admin/cms/news",
      data,
    );
    return response.data;
  }

  async updateNewsArticle(
    id: string,
    data: UpdateNewsArticleData,
  ): Promise<ApiResponse<NewsArticle>> {
    const response = await supportClient.put<ApiResponse<NewsArticle>>(
      `/api/admin/cms/news/${id}`,
      data,
    );
    return response.data;
  }

  async deleteNewsArticle(
    id: string,
  ): Promise<ApiResponse<{ success: boolean }>> {
    const response = await supportClient.delete<
      ApiResponse<{ success: boolean }>
    >(`/api/admin/cms/news/${id}`);
    return response.data;
  }

  // ============ Error Handling ============

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

export const cmsApi = new CmsApiService();
