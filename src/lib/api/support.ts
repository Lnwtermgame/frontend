import { apiFetch, apiFetchWithMeta, type PageMeta } from "./client";

// ============ FAQ Types ============

export interface FaqCategory {
  id: string;
  name: string;
  slug: string;
  locale: string;
  description?: string;
  sortOrder: number;
  articleCount?: number;
  articles?: FaqArticle[];
}

export interface FaqArticle {
  id: string;
  categoryId: string;
  title: string;
  slug: string;
  locale: string;
  content: string;
  excerpt?: string;
  isPinned?: boolean;
  helpfulCount: number;
  unhelpfulCount: number;
  viewCount: number;
  category?: FaqCategory;
  createdAt: string;
  updatedAt: string;
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
  ticketId: string;
  userId?: string | null;
  content: string;
  isInternal: boolean;
  attachments?: string[] | null;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    role: string;
  } | null;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  userId: string;
  category: TicketCategory;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  orderId?: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: TicketMessage[];
}

export interface CreateTicketInput {
  category: TicketCategory;
  subject: string;
  description: string;
  orderId?: string;
}

// ============ CMS & News Types ============

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  updatedAt: string;
}

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category: string;
  tags: string[];
  isFeatured: boolean;
  viewCount: number;
  publishedAt: string;
}

// ============ API Functions ============

// FAQ
export function getFaqCategories(): Promise<FaqCategory[]> {
  return apiFetch("/api/support/faq/categories");
}

export function getFaqCategoryBySlug(slug: string): Promise<FaqCategory> {
  return apiFetch(`/api/support/faq/categories/${encodeURIComponent(slug)}`);
}

export function getFaqArticles(params: { categoryId?: string; page?: number; limit?: number } = {}) {
  const search = new URLSearchParams();
  if (params.categoryId) search.append("categoryId", params.categoryId);
  if (params.page) search.append("page", String(params.page));
  if (params.limit) search.append("limit", String(params.limit));
  const q = search.toString();
  return apiFetchWithMeta<FaqArticle[]>(`/api/support/faq/articles${q ? `?${q}` : ""}`);
}

export function getFaqArticleBySlug(slug: string): Promise<FaqArticle> {
  return apiFetch(`/api/support/faq/articles/${encodeURIComponent(slug)}`);
}

export function markFaqHelpful(articleId: string, isHelpful: boolean): Promise<{ helpfulCount: number }> {
  return apiFetch(`/api/support/faq/articles/${articleId}/helpful`, {
    method: "POST",
    body: { isHelpful },
  });
}

export function searchFaq(q: string): Promise<FaqArticle[]> {
  return apiFetch(`/api/support/faq/search?q=${encodeURIComponent(q)}`);
}

// Tickets (Auth-gated)
export function listTickets(params: { status?: string; page?: number; limit?: number } = {}) {
  const search = new URLSearchParams();
  if (params.status) search.append("status", params.status);
  if (params.page) search.append("page", String(params.page));
  if (params.limit) search.append("limit", String(params.limit));
  const q = search.toString();
  return apiFetchWithMeta<Ticket[]>(`/api/support/tickets${q ? `?${q}` : ""}`);
}

export function getTicketDetail(id: string): Promise<Ticket> {
  return apiFetch(`/api/support/tickets/${id}`);
}

export function createTicket(input: CreateTicketInput): Promise<Ticket> {
  return apiFetch("/api/support/tickets", {
    method: "POST",
    body: input,
  });
}

export function replyTicket(ticketId: string, content: string): Promise<TicketMessage> {
  return apiFetch(`/api/support/tickets/${ticketId}/reply`, {
    method: "POST",
    body: { content },
  });
}

export function closeTicket(ticketId: string): Promise<Ticket> {
  return apiFetch(`/api/support/tickets/${ticketId}/close`, {
    method: "PUT",
  });
}

// CMS Pages (Public)
export function getCmsPage(slug: string): Promise<CmsPage> {
  return apiFetch(`/api/cms/pages/${encodeURIComponent(slug)}`);
}

// News (Public)
export function listNews(params: { page?: number; limit?: number } = {}) {
  const search = new URLSearchParams();
  if (params.page) search.append("page", String(params.page));
  if (params.limit) search.append("limit", String(params.limit));
  const q = search.toString();
  return apiFetchWithMeta<NewsArticle[]>(`/api/cms/news${q ? `?${q}` : ""}`);
}

export function getNewsBySlug(slug: string): Promise<NewsArticle> {
  return apiFetch(`/api/cms/news/${encodeURIComponent(slug)}`);
}
