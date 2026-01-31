import { authClient } from '@/lib/client/gateway';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'ORDER' | 'PAYMENT' | 'PROMOTION' | 'SYSTEM';
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: string;
  readAt?: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  orderUpdates: boolean;
  promotions: boolean;
}

export interface NotificationsListResponse {
  success: boolean;
  data: Notification[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount?: number;
}

export interface NotificationResponse {
  success: boolean;
  data: { message: string };
  message?: string;
}

export interface NotificationPreferencesResponse {
  success: boolean;
  data: NotificationPreferences;
  message?: string;
}

class NotificationApiService {
  async getNotifications(page = 1, limit = 20, unreadOnly = false): Promise<NotificationsListResponse> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (unreadOnly) params.append('unreadOnly', 'true');

    const response = await authClient.get<NotificationsListResponse>(`/api/notifications?${params}`);
    return response.data;
  }

  async markAsRead(notificationId: string): Promise<NotificationResponse> {
    const response = await authClient.put<NotificationResponse>(`/api/notifications/${notificationId}/read`);
    return response.data;
  }

  async markAllAsRead(): Promise<NotificationResponse> {
    const response = await authClient.put<NotificationResponse>('/api/notifications/read-all');
    return response.data;
  }

  async deleteNotification(notificationId: string): Promise<NotificationResponse> {
    const response = await authClient.delete<NotificationResponse>(`/api/notifications/${notificationId}`);
    return response.data;
  }

  async getPreferences(): Promise<NotificationPreferencesResponse> {
    const response = await authClient.get<NotificationPreferencesResponse>('/api/notifications/preferences');
    return response.data;
  }

  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferencesResponse> {
    const response = await authClient.put<NotificationPreferencesResponse>('/api/notifications/preferences', preferences);
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

export const notificationApi = new NotificationApiService();
