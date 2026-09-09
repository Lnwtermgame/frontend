import { useQuery } from "@tanstack/react-query";
import * as productsApi from "@/lib/api/products";
import * as dashApi from "@/lib/api/dashboard";
import * as supportApi from "@/lib/api/support";
import * as accountApi from "@/lib/api/account";
import { getPaymentMethods } from "@/lib/api/payments";
import { qk } from "./keys";

export function useProducts(params: productsApi.ListProductsParams = {}) {
  return useQuery({
    queryKey: qk.products(params),
    queryFn: () => productsApi.listProducts(params),
    staleTime: 5 * 60_000,
  });
}

export function useFeatured(limit = 8) {
  return useQuery({
    queryKey: qk.featured(limit),
    queryFn: () => productsApi.getFeatured(limit),
    staleTime: 5 * 60_000,
  });
}

export function useBestsellers(limit = 8) {
  return useQuery({
    queryKey: qk.bestsellers(limit),
    queryFn: () => productsApi.getBestsellers(limit),
    staleTime: 5 * 60_000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: qk.categories(),
    queryFn: () => productsApi.getCategories(),
    staleTime: 10 * 60_000,
  });
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: qk.product(slug),
    queryFn: () => productsApi.getProductBySlug(slug),
    staleTime: 60_000,
  });
}

// Auth-gated: pass enabled=false for guests to avoid a doomed 401.
export function usePaymentMethods(enabled: boolean) {
  return useQuery({
    queryKey: qk.paymentMethods(),
    queryFn: getPaymentMethods,
    enabled,
    staleTime: 5 * 60_000,
  });
}

// ── Dashboard (all user-scoped, short staleness) ──

export function useOrders(params: dashApi.ListParams = {}) {
  return useQuery({
    queryKey: qk.orders(params),
    queryFn: () => dashApi.listOrders(params),
    staleTime: 30_000,
  });
}

export function useOrderDetail(id: string) {
  return useQuery({
    queryKey: qk.order(id),
    queryFn: () => dashApi.getOrderDetail(id),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useDeliveries(params: dashApi.ListParams = {}) {
  return useQuery({
    queryKey: qk.deliveries(params),
    queryFn: () => dashApi.listDeliveries(params),
    staleTime: 30_000,
  });
}

export function useInvoices(params: dashApi.ListParams = {}) {
  return useQuery({
    queryKey: qk.invoices(params),
    queryFn: () => dashApi.listInvoices(params),
    staleTime: 30_000,
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: qk.invoice(id),
    queryFn: () => dashApi.getInvoice(id),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCoupons(params: dashApi.ListParams = {}) {
  return useQuery({
    queryKey: qk.coupons(params),
    queryFn: () => dashApi.listCoupons(params),
    staleTime: 30_000,
  });
}

export function useMyCoupons() {
  return useQuery({
    queryKey: qk.myCoupons(),
    queryFn: dashApi.listMyCoupons,
    staleTime: 30_000,
  });
}

export function useFavorites(params: dashApi.ListParams = {}) {
  return useQuery({
    queryKey: qk.favorites(params),
    queryFn: () => dashApi.listFavorites(params),
    staleTime: 30_000,
  });
}

export function useCreditBalance() {
  return useQuery({
    queryKey: qk.creditBalance(),
    queryFn: dashApi.getCreditBalance,
    staleTime: 30_000,
  });
}

export function useCreditTransactions(params: dashApi.ListParams = {}) {
  return useQuery({
    queryKey: qk.creditTransactions(params),
    queryFn: () => dashApi.listCreditTransactions(params),
    staleTime: 30_000,
  });
}

// ── Support & CMS ──

export function useFaqCategories() {
  return useQuery({
    queryKey: qk.faqCategories(),
    queryFn: supportApi.getFaqCategories,
    staleTime: 10 * 60_000,
  });
}

export function useFaqCategoryBySlug(slug: string) {
  return useQuery({
    queryKey: qk.faqCategory(slug),
    queryFn: () => supportApi.getFaqCategoryBySlug(slug),
    enabled: Boolean(slug),
    staleTime: 10 * 60_000,
  });
}

export function useFaqArticles(params: { categoryId?: string; page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: qk.faqArticles(params),
    queryFn: () => supportApi.getFaqArticles(params),
    staleTime: 5 * 60_000,
  });
}

export function useFaqArticleBySlug(slug: string) {
  return useQuery({
    queryKey: qk.faqArticle(slug),
    queryFn: () => supportApi.getFaqArticleBySlug(slug),
    enabled: Boolean(slug),
    staleTime: 5 * 60_000,
  });
}

export function useTickets(params: { status?: string; page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: qk.tickets(params),
    queryFn: () => supportApi.listTickets(params),
    staleTime: 30_000,
  });
}

export function useTicketDetail(id: string) {
  return useQuery({
    queryKey: qk.ticket(id),
    queryFn: () => supportApi.getTicketDetail(id),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCmsPage(slug: string) {
  return useQuery({
    queryKey: qk.cmsPage(slug),
    queryFn: () => supportApi.getCmsPage(slug),
    enabled: Boolean(slug),
    staleTime: 10 * 60_000,
  });
}

export function useNews(params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: qk.news(params),
    queryFn: () => supportApi.listNews(params),
    staleTime: 5 * 60_000,
  });
}

export function useNewsArticle(slug: string) {
  return useQuery({
    queryKey: qk.newsArticle(slug),
    queryFn: () => supportApi.getNewsBySlug(slug),
    enabled: Boolean(slug),
    staleTime: 5 * 60_000,
  });
}

// ── Account, Security & Notifications ──

export function useUserDevices() {
  return useQuery({
    queryKey: qk.devices(),
    queryFn: accountApi.getUserDevices,
    staleTime: 30_000,
  });
}

export function useSecuritySettings() {
  return useQuery({
    queryKey: qk.securitySettings(),
    queryFn: accountApi.getSecuritySettings,
    staleTime: 30_000,
  });
}

export function useSecurityActivities() {
  return useQuery({
    queryKey: qk.securityActivities(),
    queryFn: accountApi.getSecurityActivities,
    staleTime: 30_000,
  });
}

export function useNotifications(params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: qk.notifications(params),
    queryFn: () => accountApi.listNotifications(params),
    staleTime: 10_000,
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: qk.notificationPreferences(),
    queryFn: accountApi.getNotificationPreferences,
    staleTime: 60_000,
  });
}
