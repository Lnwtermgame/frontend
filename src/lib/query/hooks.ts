import { useQuery, useQueries } from "@tanstack/react-query";
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
    // ใช้ list endpoint แทน /featured เพราะ serializer ของ /featured ไม่ใส่
    // types (packages) กลับมา — หน้าแรกต้องใช้ราคาจริงจาก displayPrice
    queryFn: () => productsApi.listProducts({ isFeatured: true, limit }),
    staleTime: 5 * 60_000,
  });
}

export function useBestsellers(limit = 8) {
  return useQuery({
    queryKey: qk.bestsellers(limit),
    queryFn: () =>
      productsApi.listProducts({
        isBestseller: true,
        limit,
        sortBy: "salesCount",
        sortOrder: "desc",
      }),
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

/** นับออเดอร์แยกตามสถานะ (limit:1 อ่านแค่ meta.total) สำหรับ filter pills หน้าคำสั่งซื้อ */
export function useOrderCounts() {
  const statuses = ["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"] as const;
  const results = useQueries({
    queries: [
      {
        queryKey: qk.orders({ page: 1, limit: 1 }),
        queryFn: () => dashApi.listOrders({ page: 1, limit: 1 }),
        staleTime: 30_000,
      },
      ...statuses.map((status) => ({
        queryKey: qk.orders({ page: 1, limit: 1, status }),
        queryFn: () => dashApi.listOrders({ page: 1, limit: 1, status }),
        staleTime: 30_000,
      })),
    ],
  });
  const total = (r: (typeof results)[number]) => r.data?.meta?.total;
  return {
    all: total(results[0]),
    PENDING: total(results[1]),
    PROCESSING: total(results[2]),
    COMPLETED: total(results[3]),
    CANCELLED: total(results[4]),
  };
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

/* 404 = ออเดอร์นี้ยังไม่มีบล็อกการจัดส่ง (เช่น ยังไม่ชำระ/ถูกยกเลิกก่อนส่ง) — ถือเป็นสถานะ ไม่ใช่ error */
export function useDeliveryStatus(orderId: string) {
  return useQuery({
    queryKey: qk.deliveryStatus(orderId),
    queryFn: () => dashApi.getDeliveryStatus(orderId),
    enabled: Boolean(orderId),
    staleTime: 30_000,
    retry: false,
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
