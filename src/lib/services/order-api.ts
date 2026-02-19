import { orderClient } from "@/lib/client/gateway";

// Payment info
export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: "CREDIT_CARD" | "PROMPTPAY" | "TRUEMONEY" | "BANK_TRANSFER";
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  transactionId?: string;
  createdAt: string;
}

// Product info in order item
export interface OrderProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  productType: "CARD" | "DIRECT_TOPUP";
}

// Product type info (e.g., "60 UC", "325 UC")
export interface OrderProductType {
  id: string;
  name: string;
  parValue: number;
  currency: string;
}

// Pin code for card products
export interface PinCode {
  id?: number;
  code?: string;
  pin?: string;
  serial?: string;
  validDate?: string;
  // SEAGM response fields
  card_number?: string;
  card_pin?: string;
  expired?: string;
}

// Order type definition
export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status:
    | "PENDING"
    | "PROCESSING"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED"
    | "REFUNDED";
  items: OrderItem[];
  user?: {
    id: string;
    email: string;
    username: string;
  };
  payment?: Payment;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName?: string;
  product?: OrderProduct;
  productTypeId?: string;
  productType?: OrderProductType;
  quantity: number;
  priceAtPurchase: number;
  price?: number; // For backward compatibility
  playerInfo?: Record<string, any>;
  fulfillStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  pinCodes?: PinCode[];
  seagmOrderId?: string;
}

export interface OrderResponse {
  success: boolean;
  data: Order;
  message?: string;
}

export interface OrdersListResponse {
  success: boolean;
  data: Order[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class OrderApiService {
  async getOrders(
    page = 1,
    limit = 20,
    status?: string,
    signal?: AbortSignal,
  ): Promise<OrdersListResponse> {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("limit", String(limit));
    if (status) params.append("status", status);

    const response = await orderClient.get<OrdersListResponse>(
      `/api/orders?${params}`,
      { signal },
    );
    return response.data;
  }

  async getOrderById(orderId: string): Promise<OrderResponse> {
    const response = await orderClient.get<OrderResponse>(
      `/api/orders/${orderId}`,
    );
    return response.data;
  }

  async createOrder(data: {
    items: {
      productId: string;
      productTypeId?: string; // Specific product type (e.g., 60 UC, 325 UC)
      quantity: number;
      playerInfo?: Record<string, string>;
    }[];
    paymentMethod?: "CREDIT_CARD" | "PROMPTPAY" | "TRUEMONEY" | "BANK_TRANSFER";
    paymentOptionCode?: string;
    skipPayment?: boolean;
  }): Promise<OrderResponse> {
    const response = await orderClient.post<OrderResponse>("/api/orders", data);
    return response.data;
  }

  async cancelOrder(orderId: string): Promise<OrderResponse> {
    const response = await orderClient.put<OrderResponse>(
      `/api/orders/${orderId}/cancel`,
    );
    return response.data;
  }

  // Admin methods
  async getAllOrders(
    page = 1,
    limit = 20,
    status?: string,
    userId?: string,
  ): Promise<OrdersListResponse> {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("limit", String(limit));
    if (status) params.append("status", status);
    if (userId) params.append("userId", userId);

    const response = await orderClient.get<OrdersListResponse>(
      `/api/admin/orders?${params}`,
    );
    return response.data;
  }

  async updateOrderStatus(
    orderId: string,
    status: string,
  ): Promise<OrderResponse> {
    const response = await orderClient.put<OrderResponse>(
      `/api/admin/orders/${orderId}/status`,
      { status: status.toUpperCase() },
    );
    return response.data;
  }

  async fulfillOrder(orderId: string): Promise<OrderResponse> {
    const response = await orderClient.post<OrderResponse>(
      `/api/admin/orders/${orderId}/fulfill`,
    );
    return response.data;
  }

  async getAdminOrderById(orderId: string): Promise<OrderResponse> {
    const response = await orderClient.get<OrderResponse>(
      `/api/admin/orders/${orderId}`,
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

export const orderApi = new OrderApiService();
