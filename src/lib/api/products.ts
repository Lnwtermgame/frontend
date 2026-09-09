import { apiFetch } from "./client";

// ── Types (mirror of the public product service responses) ──

export interface SeagmFieldOptionChild {
  name: string;
  label: string;
  prefix: string;
  options: { parent_value: string; child_options: { label: string; value: string }[] }[];
}
export interface SeagmFieldOption {
  label: string;
  value: string;
  child?: SeagmFieldOptionChild[];
}
export interface SeagmField {
  type: "text" | "input" | "select";
  label: string;
  label_zh?: string;
  multiline: boolean;
  name: string;
  placeholder: string;
  prefix?: string;
  position: number;
  required?: boolean;
  options?: SeagmFieldOption[];
}

export interface ProductTypePublic {
  id: string;
  productId: string;
  name: string;
  displayPrice: number;
  originPrice?: number;
  currency: string;
  hasStock: boolean;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
  discountRate?: number;
  fields?: SeagmField[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  categoryId: string;
  category?: { id: string; name: string; slug: string };
  imageUrl?: string;
  coverImageUrl?: string;
  productType: "CARD" | "DIRECT_TOPUP" | "MOBILE_RECHARGE";
  isActive: boolean;
  isFeatured?: boolean;
  isBestseller?: boolean;
  salesCount?: number;
  viewCount?: number;
  types?: ProductTypePublic[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  parentId?: string;
  sortOrder: number;
  productCount?: number;
}

export interface VerifyPlayerResult {
  valid: boolean;
  supported: boolean;
  message: string;
  accountInfo?: { username?: string; server?: string; region?: string };
  errorCode?: number;
}

export interface ListProductsParams {
  search?: string;
  isFeatured?: boolean;
  isBestseller?: boolean;
  sortBy?: "price" | "name" | "createdAt" | "salesCount" | "viewCount";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

function buildQuery(params: ListProductsParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) search.append(key, String(value));
  }
  const q = search.toString();
  return q ? `?${q}` : "";
}

// NOTE: the list envelope carries `meta` at the top level, which apiFetch drops
// by design — the catalog uses limit=100 without pagination (same as the old app).
export function listProducts(params: ListProductsParams = {}): Promise<Product[]> {
  return apiFetch<Product[]>(`/api/products${buildQuery(params)}`);
}

export function getProductBySlug(slug: string): Promise<Product> {
  return apiFetch<Product>(`/api/products/slug/${encodeURIComponent(slug)}`);
}

export function getFeatured(limit = 8): Promise<Product[]> {
  return apiFetch<Product[]>(`/api/products/featured?limit=${limit}`);
}

export function getBestsellers(limit = 8): Promise<Product[]> {
  return apiFetch<Product[]>(`/api/products/bestsellers?limit=${limit}`);
}

export function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/api/products/categories");
}

export function getProductFields(
  productId: string,
): Promise<{ fields: SeagmField[]; productType: "CARD" | "DIRECT_TOPUP" | null }> {
  return apiFetch(`/api/products/${productId}/fields`);
}

export function verifyPlayer(
  productId: string,
  playerInfo: Record<string, string>,
  productTypeId?: string,
): Promise<VerifyPlayerResult> {
  return apiFetch(`/api/products/${productId}/verify-player`, {
    method: "POST",
    body: { playerInfo, productTypeId },
  });
}

export function verifyMobileRecharge(
  productId: string,
  productTypeId: string,
  phoneNumber: string,
  callingCode?: string,
): Promise<VerifyPlayerResult> {
  return apiFetch("/api/mobile-recharge/verify", {
    method: "POST",
    body: { productId, productTypeId, phoneNumber, callingCode },
  });
}
