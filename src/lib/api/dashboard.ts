import { apiFetch, apiFetchWithMeta } from "./client";
import type { Order, OrderStatus } from "./orders";
import type { Product } from "./products";

export interface OrderDetail {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: {
    id?: string;
    productId?: string;
    productTypeId?: string;
    product?: Product | null;
    quantity: number;
    priceAtPurchase?: number;
    playerInfo?: Record<string, unknown> | null;
    pinCodes?: { pin?: string; serial?: string; [k: string]: unknown }[] | null;
    fulfillStatus?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  }[];
  payment?: {
    id: string;
    status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED";
    paymentMethod: string;
    amount?: number;
    providerReference?: string | null;
  } | null;
}

export type DeliveryState = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface DeliveryItemDetail {
  id: string;
  productId: string;
  productName: string;
  productType: "CARD" | "DIRECT_TOPUP" | "MOBILE_RECHARGE";
  quantity: number;
  status: DeliveryState;
  pinCodes?: { pin?: string; serial?: string; [k: string]: unknown }[] | null;
  playerInfo?: Record<string, unknown> | null;
  errorMessage?: string;
  deliveredAt?: string;
  resentCount: number;
}

export interface DeliveryStatus {
  orderId: string;
  orderNumber: string;
  status: DeliveryState;
  items: DeliveryItemDetail[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  issuedAt: string;
  paidAt?: string;
  items: {
    productName: string;
    imageUrl?: string | null;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountPercentage: number;
  discountAmount?: number;
  minPurchase?: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isClaimed?: boolean;
  isUsed?: boolean;
  userCouponId?: string;
}

export interface FavoriteItem {
  id: string;
  product: Product;
  createdAt: string;
}

export interface CreditTransaction {
  id: string;
  amount: number;
  type: "TOPUP" | "PURCHASE" | "REFUND" | "BONUS";
  description?: string;
  createdAt: string;
}

export interface ListParams {
  status?: string;
  page?: number;
  limit?: number;
}

function query(params: ListParams): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) search.append(k, String(v));
  }
  const q = search.toString();
  return q ? `?${q}` : "";
}

export function listOrders(params: ListParams = {}) {
  return apiFetchWithMeta<Order[]>(`/api/orders${query(params)}`);
}

export function getOrderDetail(id: string): Promise<OrderDetail> {
  return apiFetch<OrderDetail>(`/api/orders/${id}`);
}

export function cancelOrderById(id: string): Promise<Order> {
  return apiFetch<Order>(`/api/orders/${id}/cancel`, { method: "PUT" });
}

export function listDeliveries(params: ListParams = {}) {
  return apiFetchWithMeta<DeliveryStatus[]>(`/api/deliveries${query(params)}`);
}

export function getDeliveryStatus(orderId: string): Promise<DeliveryStatus> {
  return apiFetch<DeliveryStatus>(`/api/deliveries/${orderId}/status`);
}

export function resendDelivery(orderId: string, itemId: string): Promise<unknown> {
  return apiFetch(`/api/deliveries/${orderId}/resend`, {
    method: "POST",
    body: { itemId },
  });
}

export function listInvoices(params: ListParams = {}) {
  return apiFetchWithMeta<Invoice[]>(`/api/invoices${query(params)}`);
}

export function getInvoice(id: string): Promise<Invoice> {
  return apiFetch<Invoice>(`/api/invoices/${id}`);
}

export function listCoupons(params: ListParams = {}) {
  return apiFetchWithMeta<Coupon[]>(`/api/coupons${query(params)}`);
}

export function listMyCoupons(): Promise<Coupon[]> {
  return apiFetch<Coupon[]>("/api/coupons/my");
}

export function claimCoupon(id: string): Promise<Coupon> {
  return apiFetch<Coupon>(`/api/coupons/${id}/claim`, { method: "POST" });
}

export function listFavorites(params: ListParams = {}) {
  return apiFetchWithMeta<FavoriteItem[]>(`/api/favorites${query(params)}`);
}

export function removeFavorite(id: string): Promise<unknown> {
  return apiFetch(`/api/favorites/${id}`, { method: "DELETE" });
}

export function getCreditBalance(): Promise<{ balance: number; currency: string }> {
  return apiFetch("/api/credits/balance");
}

export function listCreditTransactions(params: ListParams = {}) {
  return apiFetchWithMeta<CreditTransaction[]>(`/api/credits/transactions${query(params)}`);
}
