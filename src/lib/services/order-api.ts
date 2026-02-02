import { orderClient } from '@/lib/client/gateway';

// Order type definition
export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  items: OrderItem[];
  user?: {
    id: string;
    email: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  priceAtPurchase: number;
  price?: number; // For backward compatibility
  playerInfo?: Record<string, string>;
  fulfillStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
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
  async getOrders(page = 1, limit = 20, status?: string): Promise<OrdersListResponse> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (status) params.append('status', status);

    const response = await orderClient.get<OrdersListResponse>(`/api/orders?${params}`);
    return response.data;
  }

  async getOrderById(orderId: string): Promise<OrderResponse> {
    const response = await orderClient.get<OrderResponse>(`/api/orders/${orderId}`);
    return response.data;
  }

  async createOrder(data: {
    items: { productId: string; quantity: number; playerInfo?: Record<string, string> }[];
  }): Promise<OrderResponse> {
    const response = await orderClient.post<OrderResponse>('/api/orders', data);
    return response.data;
  }

  async cancelOrder(orderId: string): Promise<OrderResponse> {
    const response = await orderClient.put<OrderResponse>(`/api/orders/${orderId}/cancel`);
    return response.data;
  }

  // Admin methods
  async getAllOrders(page = 1, limit = 20, status?: string): Promise<OrdersListResponse> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (status) params.append('status', status);

    const response = await orderClient.get<OrdersListResponse>(`/api/admin/orders?${params}`);
    return response.data;
  }

  async updateOrderStatus(orderId: string, status: string): Promise<OrderResponse> {
    const response = await orderClient.put<OrderResponse>(`/api/admin/orders/${orderId}/status`, { status });
    return response.data;
  }

  async fulfillOrder(orderId: string): Promise<OrderResponse> {
    const response = await orderClient.post<OrderResponse>(`/api/admin/orders/${orderId}/fulfill`);
    return response.data;
  }

  getErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { error?: { message?: string } } } };
      return axiosError.response?.data?.error?.message || 'An error occurred';
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }
}

export const orderApi = new OrderApiService();
