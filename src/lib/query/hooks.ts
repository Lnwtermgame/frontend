import { useQuery } from "@tanstack/react-query";
import * as productsApi from "@/lib/api/products";
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
