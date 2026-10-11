import { keepPreviousData, useQuery, useQueries } from "@tanstack/react-query";
import * as productsApi from "@/lib/api/products";
import * as dashApi from "@/lib/api/dashboard";
import * as supportApi from "@/lib/api/support";
import * as accountApi from "@/lib/api/account";
import { getPaymentMethods } from "@/lib/api/payments";
import { qk } from "./keys";

/* รายการที่มี page/filter: เปลี่ยนหน้า/ตัวกรอง = คงข้อมูลชุดก่อนไว้ (isPlaceholderData) ให้หน้าจางลง
   ระหว่างโหลด แทน isLoading=true ที่ทำให้กลับไปเป็น skeleton + Pager หายแล้วโผล่ทุกครั้ง
   (ไม่ใช้กับ query รายชิ้นตาม id — จะโชว์ข้อมูลผิดชิ้นระหว่างโหลด) */
const keepList = { placeholderData: keepPreviousData } as const;

export function useProducts(
  params: productsApi.ListProductsParams = {},
  /** keepPrevious — true: หน้า catalog (sort/ค้นหา) · "typeahead": nav-search คงผลค้นหาคำก่อน
   *  ระหว่างพิมพ์ต่อ แต่ไม่ยืมผลชุดไม่มีคำค้น (สินค้าทั่วไป) มาแสดงเป็น "ผลการค้นหา" */
  options: { keepPrevious?: boolean | "typeahead" } = {},
) {
  return useQuery({
    queryKey: qk.products(params),
    queryFn: () => productsApi.listProducts(params),
    staleTime: 5 * 60_000,
    placeholderData:
      options.keepPrevious === "typeahead"
        ? (prev, prevQuery) =>
            (prevQuery?.queryKey[1] as productsApi.ListProductsParams | undefined)?.search
              ? prev
              : undefined
        : options.keepPrevious
          ? keepPreviousData
          : undefined,
  });
}

export function useFeatured(limit = 8) {
  return useQuery({
    queryKey: qk.featured(limit),
    // ใช้ list endpoint แทน /featured เพราะ serializer ของ /featured ไม่ใส่
    // types (packages) กลับมา — หน้าแรกต้องใช้ราคาจริงจาก displayPrice
    queryFn: async () => {
      const curated = await productsApi.listProducts({ isFeatured: true, limit });
      // prod ยังไม่มีสินค้าที่ mark isFeatured (ไม่มีหลังบ้านไว้ติด flag)
      // → fallback เป็น "เกม" ล่าสุด (ชั้นชื่อเกมยอดนิยม) — API ไม่รองรับ
      //   กรอง productType จึงกรองฝั่ง client จาก pool ล่าสุด แทน
      if (!curated.length) {
        const pool = await productsApi.listProducts({
          sortBy: "createdAt",
          sortOrder: "desc",
          limit: 100,
        });
        return pool
          .filter((p) => p.productType === "DIRECT_TOPUP")
          .slice(0, limit);
      }
      return curated;
    },
    staleTime: 5 * 60_000,
  });
}

export function useBestsellers(limit = 8) {
  return useQuery({
    queryKey: qk.bestsellers(limit),
    queryFn: async () => {
      const curated = await productsApi.listProducts({
        isBestseller: true,
        limit,
        sortBy: "salesCount",
        sortOrder: "desc",
      });
      // เช่นเดียวกับ featured — ยังไม่มี flag ในระบบที่ยังไม่มีข้อมูลขาย
      // → fallback เรียงตาม salesCount จริง (ตอนนี้ 0 ทั้งหมด = ลำดับปกติของร้าน)
      if (!curated.length) {
        return productsApi.listProducts({
          sortBy: "salesCount",
          sortOrder: "desc",
          limit,
        });
      }
      return curated;
    },
    staleTime: 5 * 60_000,
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
    ...keepList,
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
    ...keepList,
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
    ...keepList,
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
    ...keepList,
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

export function useFaqArticles(params: { categoryId?: string; page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: qk.faqArticles(params),
    queryFn: () => supportApi.getFaqArticles(params),
    staleTime: 5 * 60_000,
    ...keepList,
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
    ...keepList,
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: qk.notificationPreferences(),
    queryFn: accountApi.getNotificationPreferences,
    staleTime: 60_000,
  });
}
