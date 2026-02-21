import { authClient } from "@/lib/client/gateway";

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
  isActive: boolean;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserDetail {
  id: string;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
  isActive: boolean;
  creditBalance: number;
  orderCount: number;
  totalSpent: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface UserAuditActivity {
  id: string;
  type: string;
  description: string;
  ip: string;
  location: string;
  timestamp: string;
  suspicious: boolean;
  resolved: boolean;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role?: "USER" | "ADMIN";
  isActive?: boolean;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  role?: "USER" | "ADMIN";
  isActive?: boolean;
}

export interface UserListResponse {
  success: boolean;
  data: {
    users: AdminUser[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface UserStats {
  totalUsers: number;
  totalAdmins: number;
  activeUsers: number;
  inactiveUsers: number;
  newToday: number;
  newThisWeek: number;
  newThisMonth: number;
}

class AdminUserApiService {
  // Get all users with filters
  async getUsers(
    params: {
      page?: number;
      limit?: number;
      role?: string;
      isActive?: boolean;
      search?: string;
    } = {},
  ): Promise<UserListResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", String(params.page));
    if (params.limit) queryParams.append("limit", String(params.limit));
    if (params.role) queryParams.append("role", params.role);
    if (params.isActive !== undefined)
      queryParams.append("isActive", String(params.isActive));
    if (params.search) queryParams.append("search", params.search);

    const response = await authClient.get(`/api/admin/users?${queryParams}`);
    return response.data;
  }

  // Get single user
  async getUserById(
    userId: string,
  ): Promise<{ success: boolean; data: AdminUserDetail }> {
    const response = await authClient.get(`/api/admin/users/${userId}`);
    return response.data;
  }

  // Create new user
  async createUser(
    data: CreateUserData,
  ): Promise<{ success: boolean; data: AdminUser }> {
    const response = await authClient.post("/api/admin/users", data);
    return response.data;
  }

  // Update user
  async updateUser(
    userId: string,
    data: UpdateUserData,
  ): Promise<{ success: boolean; data: AdminUser }> {
    const response = await authClient.put(`/api/admin/users/${userId}`, data);
    return response.data;
  }

  // Delete user
  async deleteUser(
    userId: string,
  ): Promise<{ success: boolean; message?: string }> {
    const response = await authClient.delete(`/api/admin/users/${userId}`);
    return response.data;
  }

  // Update user role
  async updateUserRole(
    userId: string,
    role: "USER" | "ADMIN",
  ): Promise<{ success: boolean; data: AdminUser }> {
    const response = await authClient.put(`/api/admin/users/${userId}/role`, {
      role,
    });
    return response.data;
  }

  async updateUserRoleWithReason(
    userId: string,
    role: "USER" | "ADMIN",
    reason?: string,
  ): Promise<{ success: boolean; data: AdminUser }> {
    const response = await authClient.put(`/api/admin/users/${userId}/role`, {
      role,
      reason,
    });
    return response.data;
  }

  // Update user status
  async updateUserStatus(
    userId: string,
    isActive: boolean,
    reason?: string,
  ): Promise<{ success: boolean; data: AdminUser }> {
    const response = await authClient.put(`/api/admin/users/${userId}/status`, {
      isActive,
      reason,
    });
    return response.data;
  }

  async suspendUser(
    userId: string,
    reason: string,
  ): Promise<{ success: boolean; data: AdminUser }> {
    const response = await authClient.post(
      `/api/admin/users/${userId}/suspend`,
      { reason },
    );
    return response.data;
  }

  async getUserAuditTrail(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      type?: string;
      resolved?: boolean;
      fromDate?: string;
      toDate?: string;
    } = {},
  ): Promise<{
    success: boolean;
    data: {
      activities: UserAuditActivity[];
      meta: { total: number; page: number; limit: number; totalPages: number };
    };
  }> {
    const params = new URLSearchParams();
    params.append("page", String(options.page ?? 1));
    params.append("limit", String(options.limit ?? 20));
    if (options.type) params.append("type", options.type);
    if (typeof options.resolved === "boolean") {
      params.append("resolved", String(options.resolved));
    }
    if (options.fromDate) params.append("fromDate", options.fromDate);
    if (options.toDate) params.append("toDate", options.toDate);

    const response = await authClient.get(
      `/api/admin/users/${userId}/audit-trail?${params.toString()}`,
    );
    return response.data;
  }

  async resolveUserAuditActivity(
    userId: string,
    activityId: string,
    reason?: string,
  ): Promise<{ success: boolean; data: UserAuditActivity }> {
    const response = await authClient.put(
      `/api/admin/users/${userId}/audit-trail/${activityId}/resolve`,
      { reason },
    );
    return response.data;
  }

  // Get user statistics
  async getUserStats(): Promise<{ success: boolean; data: UserStats }> {
    const response = await authClient.get("/api/admin/users/stats/overview");
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

export const adminUserApi = new AdminUserApiService();
