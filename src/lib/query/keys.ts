import type { ListProductsParams } from "@/lib/api/products";
import type { ListParams } from "@/lib/api/dashboard";

export const qk = {
  products: (params: ListProductsParams) => ["products", params] as const,
  featured: (limit: number) => ["products", "featured", limit] as const,
  bestsellers: (limit: number) => ["products", "bestsellers", limit] as const,
  categories: () => ["categories"] as const,
  product: (slug: string) => ["product", slug] as const,
  paymentMethods: () => ["payment-methods"] as const,
  orders: (params: ListParams) => ["orders", params] as const,
  order: (id: string) => ["order", id] as const,
  deliveries: (params: ListParams) => ["deliveries", params] as const,
  invoices: (params: ListParams) => ["invoices", params] as const,
  invoice: (id: string) => ["invoice", id] as const,
  coupons: (params: ListParams) => ["coupons", params] as const,
  myCoupons: () => ["coupons", "my"] as const,
  favorites: (params: ListParams) => ["favorites", params] as const,
  creditBalance: () => ["credit-balance"] as const,
  creditTransactions: (params: ListParams) => ["credit-transactions", params] as const,
};
