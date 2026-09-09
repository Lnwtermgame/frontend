import type { ListProductsParams } from "@/lib/api/products";

export const qk = {
  products: (params: ListProductsParams) => ["products", params] as const,
  featured: (limit: number) => ["products", "featured", limit] as const,
  bestsellers: (limit: number) => ["products", "bestsellers", limit] as const,
  categories: () => ["categories"] as const,
  product: (slug: string) => ["product", slug] as const,
  paymentMethods: () => ["payment-methods"] as const,
};
