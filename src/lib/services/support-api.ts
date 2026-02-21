import { supportClient } from "@/lib/client/gateway";

// ============ FAQ Types ============

export interface FaqCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  articleCount: number;
  createdAt: string;
}

export interface FaqArticle {
  id: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  isActive: boolean;
  isPinned: boolean;
  helpfulCount: number;
  unhelpfulCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FaqArticleListItem {
  id: string;
  categoryId: string;
  categoryName: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  isPinned: boolean;
  viewCount: number;
  createdAt: string;
  helpfulCount?: number;
  unhelpfulCount?: number;
}

export interface FaqCategoryWithArticles extends FaqCategory {
  articles: FaqArticleListItem[];
}

export interface FaqHelpfulResponse {
  success: boolean;
  data: {
    helpfulCount: number;
    unhelpfulCount: number;
    userVote: boolean | null;
  };
}

// ============ Ticket Types ============

export type TicketCategory =
  | "ORDER_ISSUE"
  | "PAYMENT_ISSUE"
  | "PRODUCT_ISSUE"
  | "ACCOUNT_ISSUE"
  | "TECHNICAL_SUPPORT"
  | "REFUND_REQUEST"
  | "GENERAL_INQUIRY";

export type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_USER"
  | "WAITING_ADMIN"
  | "RESOLVED"
  | "CLOSED";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface TicketMessage {
  id: string;
  content: string;
  sender: "user" | "admin" | "system";
  senderName?: string;
  isInternal: boolean;
  attachments?: string[];
  createdAt: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  category: TicketCategory;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  orderId?: string;
  assignedTo?: string;
  userId: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
  messageCount: number;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface TicketDetail extends Ticket {
  messages: TicketMessage[];
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  waitingUser: number;
  waitingAdmin: number;
  resolved: number;
  closed: number;
}

// ============ Request Types ============

export interface CreateTicketData {
  category: TicketCategory;
  subject: string;
  description: string;
  orderId?: string;
}

export interface TicketReplyData {
  content: string;
  attachments?: string[];
}

export interface UpdateTicketData {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedTo?: string | null;
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

// ============ Support API Service ============

class SupportApiService {
  // ============ FAQ Methods ============

  async getFaqCategories(): Promise<ApiResponse<FaqCategory[]>> {
    const response = await supportClient.get<ApiResponse<FaqCategory[]>>(
      "/api/support/faq/categories",
    );
    return response.data;
  }

  async getFaqCategoryBySlug(
    slug: string,
  ): Promise<ApiResponse<FaqCategoryWithArticles>> {
    const response = await supportClient.get<
      ApiResponse<FaqCategoryWithArticles>
    >(`/api/support/faq/categories/${slug}`);
    return response.data;
  }

  async getFaqArticles(
    page = 1,
    limit = 20,
    categoryId?: string,
    search?: string,
    isPinned?: boolean,
  ): Promise<ApiResponse<FaqArticleListItem[]>> {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("limit", String(limit));
    if (categoryId) params.append("categoryId", categoryId);
    if (search) params.append("search", search);
    if (isPinned !== undefined) params.append("isPinned", String(isPinned));

    const response = await supportClient.get<ApiResponse<FaqArticleListItem[]>>(
      `/api/support/faq/articles?${params}`,
    );
    return response.data;
  }

  async getFaqArticleBySlug(slug: string): Promise<ApiResponse<FaqArticle>> {
    const response = await supportClient.get<ApiResponse<FaqArticle>>(
      `/api/support/faq/articles/${slug}`,
    );
    return response.data;
  }

  async searchFaqArticles(
    query: string,
    limit = 10,
  ): Promise<ApiResponse<FaqArticleListItem[]>> {
    const response = await supportClient.get<ApiResponse<FaqArticleListItem[]>>(
      `/api/support/faq/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    );
    return response.data;
  }

  async markArticleHelpful(
    articleId: string,
    isHelpful: boolean,
  ): Promise<FaqHelpfulResponse> {
    const response = await supportClient.post<FaqHelpfulResponse>(
      `/api/support/faq/articles/${articleId}/helpful`,
      {
        isHelpful,
      },
    );
    return response.data;
  }

  // ============ Admin FAQ Methods ============

  async createFaqCategory(
    data: Omit<FaqCategory, "id" | "articleCount" | "createdAt">,
  ): Promise<ApiResponse<FaqCategory>> {
    const response = await supportClient.post<ApiResponse<FaqCategory>>(
      "/api/admin/support/faq/categories",
      data,
    );
    return response.data;
  }

  async updateFaqCategory(
    categoryId: string,
    data: Partial<Omit<FaqCategory, "id" | "articleCount" | "createdAt">>,
  ): Promise<ApiResponse<FaqCategory>> {
    const response = await supportClient.put<ApiResponse<FaqCategory>>(
      `/api/admin/support/faq/categories/${categoryId}`,
      data,
    );
    return response.data;
  }

  async deleteFaqCategory(
    categoryId: string,
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await supportClient.delete<
      ApiResponse<{ message: string }>
    >(`/api/admin/support/faq/categories/${categoryId}`);
    return response.data;
  }

  async createFaqArticle(data: {
    categoryId: string;
    title: string;
    slug?: string;
    content: string;
    excerpt?: string;
    isActive?: boolean;
    isPinned?: boolean;
  }): Promise<ApiResponse<FaqArticle>> {
    const response = await supportClient.post<ApiResponse<FaqArticle>>(
      "/api/admin/support/faq/articles",
      data,
    );
    return response.data;
  }

  async updateFaqArticle(
    articleId: string,
    data: {
      title?: string;
      slug?: string;
      content?: string;
      excerpt?: string;
      isActive?: boolean;
      isPinned?: boolean;
    },
  ): Promise<ApiResponse<FaqArticle>> {
    const response = await supportClient.put<ApiResponse<FaqArticle>>(
      `/api/admin/support/faq/articles/${articleId}`,
      data,
    );
    return response.data;
  }

  async deleteFaqArticle(
    articleId: string,
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await supportClient.delete<
      ApiResponse<{ message: string }>
    >(`/api/admin/support/faq/articles/${articleId}`);
    return response.data;
  }

  // ============ Ticket Methods ============

  async getUserTickets(
    page = 1,
    limit = 20,
    status?: TicketStatus,
  ): Promise<ApiResponse<Ticket[]>> {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("limit", String(limit));
    if (status) params.append("status", status);

    const response = await supportClient.get<ApiResponse<Ticket[]>>(
      `/api/support/tickets?${params}`,
    );
    return response.data;
  }

  async createTicket(data: CreateTicketData): Promise<ApiResponse<Ticket>> {
    const response = await supportClient.post<ApiResponse<Ticket>>(
      "/api/support/tickets",
      data,
    );
    return response.data;
  }

  async getTicketDetail(ticketId: string): Promise<ApiResponse<TicketDetail>> {
    const response = await supportClient.get<ApiResponse<TicketDetail>>(
      `/api/support/tickets/${ticketId}`,
    );
    return response.data;
  }

  async addReply(
    ticketId: string,
    data: TicketReplyData,
  ): Promise<ApiResponse<TicketMessage>> {
    const response = await supportClient.post<ApiResponse<TicketMessage>>(
      `/api/support/tickets/${ticketId}/reply`,
      data,
    );
    return response.data;
  }

  async closeTicket(
    ticketId: string,
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await supportClient.put<ApiResponse<{ message: string }>>(
      `/api/support/tickets/${ticketId}/close`,
    );
    return response.data;
  }

  // ============ Admin Methods ============

  async getAllTickets(
    page = 1,
    limit = 20,
    filters?: {
      status?: TicketStatus;
      priority?: TicketPriority;
      category?: TicketCategory;
      assignedTo?: string;
      unassignedOnly?: boolean;
      userId?: string;
      search?: string;
      sortBy?: "createdAt" | "updatedAt" | "priority" | "status";
      sortOrder?: "asc" | "desc";
      createdFrom?: string;
      createdTo?: string;
      slaHours?: number;
    },
  ): Promise<ApiResponse<Ticket[]>> {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("limit", String(limit));
    if (filters?.status) params.append("status", filters.status);
    if (filters?.priority) params.append("priority", filters.priority);
    if (filters?.category) params.append("category", filters.category);
    if (filters?.assignedTo) params.append("assignedTo", filters.assignedTo);
    if (filters?.unassignedOnly) params.append("unassignedOnly", "true");
    if (filters?.userId) params.append("userId", filters.userId);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.sortBy) params.append("sortBy", filters.sortBy);
    if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);
    if (filters?.createdFrom) params.append("createdFrom", filters.createdFrom);
    if (filters?.createdTo) params.append("createdTo", filters.createdTo);
    if (filters?.slaHours) params.append("slaHours", String(filters.slaHours));

    const response = await supportClient.get<ApiResponse<Ticket[]>>(
      `/api/support/tickets/admin/all?${params}`,
    );
    return response.data;
  }

  async updateTicket(
    ticketId: string,
    data: UpdateTicketData,
  ): Promise<ApiResponse<Ticket>> {
    const response = await supportClient.put<ApiResponse<Ticket>>(
      `/api/support/tickets/admin/${ticketId}`,
      data,
    );
    return response.data;
  }

  async getTicketStats(): Promise<ApiResponse<TicketStats>> {
    const response = await supportClient.get<ApiResponse<TicketStats>>(
      "/api/support/tickets/admin/stats",
    );
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

export const supportApi = new SupportApiService();
