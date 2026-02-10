import { orderClient } from "@/lib/client/gateway";

// Delivery Status Enum
export enum DeliveryStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

// Delivery Item Detail
export interface DeliveryItemDetail {
  id: string;
  productId: string;
  productName: string;
  productType: "CARD" | "DIRECT_TOPUP";
  quantity: number;
  status: DeliveryStatus;
  seagmOrderId?: string;
  pinCodes?: Array<{
    code?: string;
    pin?: string;
    serial?: string;
    validDate?: string;
  }>;
  playerInfo?: Record<string, any>;
  errorMessage?: string;
  deliveredAt?: string;
  resentAt?: string;
  resentCount: number;
}

// Order Delivery Status
export interface OrderDeliveryStatus {
  orderId: string;
  orderNumber: string;
  status: DeliveryStatus;
  items: DeliveryItemDetail[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  estimatedDelivery?: string;
}

// Delivery History Entry
export interface DeliveryHistoryEntry {
  id: string;
  timestamp: string;
  status: DeliveryStatus;
  message: string;
  metadata?: Record<string, any>;
}

// Delivery History Response
export interface DeliveryHistoryResponse {
  orderId: string;
  history: DeliveryHistoryEntry[];
  totalEntries: number;
}

// Resend Result
export interface ResendResult {
  success: boolean;
  itemId: string;
  message: string;
  newPinCodes?: Array<{
    code?: string;
    pin?: string;
    serial?: string;
    validDate?: string;
  }>;
  error?: string;
}

// Cancel Result
export interface CancelResult {
  success: boolean;
  orderId: string;
  message: string;
  itemsCancelled: number;
  itemsAlreadyCompleted: number;
}

/**
 * Delivery API Service
 * Handles order delivery status, history, resend, and cancellation
 */
class DeliveryApiService {
  /**
   * Get user's delivery list
   */
  async getUserDeliveries(params?: {
    status?: DeliveryStatus;
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    data: OrderDeliveryStatus[];
    meta?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append("status", params.status);
    if (params?.page) searchParams.append("page", String(params.page));
    if (params?.limit) searchParams.append("limit", String(params.limit));

    const query = searchParams.toString();
    const response = await orderClient.get(
      `/api/deliveries${query ? `?${query}` : ""}`
    );
    return response.data;
  }

  /**
   * Get delivery status for a specific order
   */
  async getDeliveryStatus(orderId: string): Promise<OrderDeliveryStatus> {
    const response = await orderClient.get(
      `/api/deliveries/${orderId}/status`
    );
    return response.data.data;
  }

  /**
   * Get delivery history for an order
   */
  async getDeliveryHistory(
    orderId: string
  ): Promise<DeliveryHistoryResponse> {
    const response = await orderClient.get(
      `/api/deliveries/${orderId}/history`
    );
    return response.data.data;
  }

  /**
   * Resend delivery for an order item
   */
  async resendDelivery(orderId: string, itemId: string): Promise<ResendResult> {
    const response = await orderClient.post(
      `/api/deliveries/${orderId}/resend`,
      { itemId }
    );
    return response.data.data;
  }

  /**
   * Cancel pending delivery for an order
   */
  async cancelDelivery(orderId: string): Promise<CancelResult> {
    const response = await orderClient.post(
      `/api/deliveries/${orderId}/cancel`
    );
    return response.data.data;
  }

  /**
   * Admin: Get all deliveries
   */
  async getAllDeliveries(params?: {
    status?: DeliveryStatus;
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    data: OrderDeliveryStatus[];
    meta?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append("status", params.status);
    if (params?.userId) searchParams.append("userId", params.userId);
    if (params?.page) searchParams.append("page", String(params.page));
    if (params?.limit) searchParams.append("limit", String(params.limit));

    const query = searchParams.toString();
    const response = await orderClient.get(
      `/api/deliveries/admin/all${query ? `?${query}` : ""}`
    );
    return response.data;
  }

  getErrorMessage(error: unknown): string {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      return axiosError.response?.data?.error?.message || "An error occurred";
    }
    if (error instanceof Error) {
      return error.message;
    }
    return "An unexpected error occurred";
  }
}

export const deliveryApi = new DeliveryApiService();
