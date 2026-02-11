import { orderClient } from "@/lib/client/gateway";

// Dashboard Stats Types
export interface DashboardStats {
  sales: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    percent: number;
    isUp: boolean;
  };
  orders: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    percent: number;
    isUp: boolean;
    byStatus: Record<string, number>;
  };
  products: {
    total: number;
    active: number;
    lowStock: number;
    outOfStock: number;
    percent: number;
    isUp: boolean;
  };
  users: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    percent: number;
    isUp: boolean;
  };
}

export interface RevenueData {
  daily: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  weekly: Array<{
    week: string;
    revenue: number;
    orders: number;
  }>;
  monthly: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
}

export interface SalesAnalytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  revenueGrowth: number;
  orderGrowth: number;
  period: string;
}

export interface UserAnalytics {
  totalUsers: number;
  newUsers: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  activeUsers: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  userGrowth: Array<{
    date: string;
    count: number;
  }>;
  topUsers: Array<{
    id: string;
    username: string;
    email: string;
    totalOrders: number;
    totalSpent: number;
  }>;
}

export interface ProductAnalytics {
  bestsellers: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    salesCount: number;
    revenue: number;
  }>;
  mostViewed: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    viewCount: number;
  }>;
  lowStock: Array<{
    id: string;
    name: string;
    stockQuantity: number;
    imageUrl: string | null;
  }>;
  categoryPerformance: Array<{
    categoryId: string;
    categoryName: string;
    salesCount: number;
    revenue: number;
  }>;
}

export interface OrderAnalytics {
  totalOrders: number;
  ordersByStatus: Record<string, number>;
  ordersByPaymentMethod: Record<string, number>;
  averageOrderValue: number;
  orderTrend: Array<{
    date: string;
    count: number;
    revenue: number;
  }>;
  fulfillmentRate: number;
  cancellationRate: number;
}

export interface ConversionAnalytics {
  cartToOrder: number;
  orderToPayment: number;
  paymentToFulfillment: number;
  overallConversion: number;
  abandonedCarts: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  totalAmount: number;
  finalAmount: number;
  status: string;
  items: Array<{
    id: string;
    productName: string;
    productImage: string | null;
    quantity: number;
    priceAtPurchase: number;
  }>;
  paymentStatus: string | null;
  createdAt: string;
}

export interface PopularProduct {
  id: string;
  name: string;
  imageUrl: string | null;
  salesCount: number;
  // Prices are in seagmTypes
  seagmTypes?: {
    unitPrice: number;
    originPrice?: number;
    sellingPrice?: number;
  }[];
}

export interface ChartData {
  revenue: RevenueData;
  sales: SalesAnalytics;
  users: {
    growth: Array<{ date: string; count: number }>;
    topUsers: Array<{
      id: string;
      username: string;
      email: string;
      totalOrders: number;
      totalSpent: number;
    }>;
    total: number;
  };
  products: {
    bestsellers: ProductAnalytics["bestsellers"];
    mostViewed: ProductAnalytics["mostViewed"];
    categoryPerformance: ProductAnalytics["categoryPerformance"];
  };
  orders: {
    trend: OrderAnalytics["orderTrend"];
    byStatus: Record<string, number>;
    byPaymentMethod: Record<string, number>;
  };
}

class AnalyticsApiService {
  // Dashboard Statistics
  async getDashboardStats(): Promise<{
    success: boolean;
    data: DashboardStats;
  }> {
    const response = await orderClient.get("/api/admin/dashboard/stats");
    return response.data;
  }

  async getRevenueData(
    days = 30,
  ): Promise<{ success: boolean; data: RevenueData }> {
    const response = await orderClient.get(
      `/api/admin/dashboard/revenue?days=${days}`,
    );
    return response.data;
  }

  async getRecentOrders(
    limit = 10,
  ): Promise<{ success: boolean; data: RecentOrder[] }> {
    const response = await orderClient.get(
      `/api/admin/dashboard/recent-orders?limit=${limit}`,
    );
    return response.data;
  }

  async getPopularProducts(
    limit = 5,
  ): Promise<{ success: boolean; data: PopularProduct[] }> {
    const response = await orderClient.get(
      `/api/admin/dashboard/popular-products?limit=${limit}`,
    );
    return response.data;
  }

  async getChartData(
    days = 30,
  ): Promise<{ success: boolean; data: ChartData }> {
    const response = await orderClient.get(
      `/api/admin/dashboard/charts?days=${days}`,
    );
    return response.data;
  }

  // Analytics Endpoints
  async getSalesAnalytics(
    period = "30d",
  ): Promise<{ success: boolean; data: SalesAnalytics }> {
    const response = await orderClient.get(
      `/api/admin/analytics/sales?period=${period}`,
    );
    return response.data;
  }

  async getUserAnalytics(): Promise<{ success: boolean; data: UserAnalytics }> {
    const response = await orderClient.get("/api/admin/analytics/users");
    return response.data;
  }

  async getProductAnalytics(): Promise<{
    success: boolean;
    data: ProductAnalytics;
  }> {
    const response = await orderClient.get("/api/admin/analytics/products");
    return response.data;
  }

  async getOrderAnalytics(): Promise<{
    success: boolean;
    data: OrderAnalytics;
  }> {
    const response = await orderClient.get("/api/admin/analytics/orders");
    return response.data;
  }

  async getConversionAnalytics(): Promise<{
    success: boolean;
    data: ConversionAnalytics;
  }> {
    const response = await orderClient.get("/api/admin/analytics/conversion");
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

export const analyticsApi = new AnalyticsApiService();
