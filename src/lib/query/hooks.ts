import { useQuery } from "@tanstack/react-query";
import * as productsApi from "@/lib/api/products";
import * as dashApi from "@/lib/api/dashboard";
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
