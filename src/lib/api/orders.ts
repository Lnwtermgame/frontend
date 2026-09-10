import { apiFetch } from "./client";

export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: OrderStatus;
  items: {
    id?: string;
    productId?: string;
    productTypeId?: string;
    product?: {
      id: string;
      name: string;
      slug: string;
      imageUrl?: string | null;
    } | null;
    productType?: {
      id: string;
      name: string;
      parValue: number;
      currency: string;
    } | null;
    quantity: number;
    priceAtPurchase?: number;
    playerInfo?: Record<string, unknown>;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  items: {
    productId: string;
    productTypeId?: string;
    quantity: number;
    playerInfo?: Record<string, string>;
  }[];
  paymentMethod: "PROMPTPAY" | "TRUEMONEY" | "LINEPAY" | "CREDIT_CARD" | "BANK_TRANSFER";
  paymentOptionCode?: string;
}

export function createOrder(input: CreateOrderInput): Promise<Order> {
  return apiFetch<Order>("/api/orders", { method: "POST", body: input });
}

export function cancelOrder(orderId: string): Promise<Order> {
  return apiFetch<Order>(`/api/orders/${orderId}/cancel`, { method: "PUT" });
}
