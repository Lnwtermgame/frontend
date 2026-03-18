import { notificationClient } from "@/lib/client/gateway";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "ORDER" | "PAYMENT" | "PROMOTION" | "SYSTEM";
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

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface VapidKeyResponse {
  success: boolean;
  data: { publicKey: string };
}

export interface TestPushResponse {
  success: boolean;
  data: { message: string; result: { success: number; failed: number } };
}

class NotificationApiService {
  async getNotifications(
    page = 1,
    limit = 20,
    unreadOnly = false,
    signal?: AbortSignal,
  ): Promise<NotificationsListResponse> {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("limit", String(limit));
    if (unreadOnly) params.append("unreadOnly", "true");

    const response = await notificationClient.get<NotificationsListResponse>(
      `/api/notifications?${params}`,
      { signal },
    );
    return response.data;
  }

  async markAsRead(notificationId: string): Promise<NotificationResponse> {
    const response = await notificationClient.put<NotificationResponse>(
      `/api/notifications/${notificationId}/read`,
    );
    return response.data;
  }

  async markAllAsRead(): Promise<NotificationResponse> {
    const response = await notificationClient.put<NotificationResponse>(
      "/api/notifications/read-all",
    );
    return response.data;
  }

  async deleteNotification(
    notificationId: string,
  ): Promise<NotificationResponse> {
    const response = await notificationClient.delete<NotificationResponse>(
      `/api/notifications/${notificationId}`,
    );
    return response.data;
  }

  async getPreferences(
    signal?: AbortSignal,
  ): Promise<NotificationPreferencesResponse> {
    const response =
      await notificationClient.get<NotificationPreferencesResponse>(
        "/api/notifications/preferences",
        { signal },
      );
    return response.data;
  }

  async updatePreferences(
    preferences: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferencesResponse> {
    const response =
      await notificationClient.put<NotificationPreferencesResponse>(
        "/api/notifications/preferences",
        preferences,
      );
    return response.data;
  }

  // ==================== Push Notification APIs ====================

  async getVapidPublicKey(): Promise<string | null> {
    try {
      const response = await notificationClient.get<VapidKeyResponse>(
        "/api/push/vapid-key",
      );
      return response.data.data.publicKey;
    } catch {
      return null;
    }
  }

  async subscribePush(
    subscription: PushSubscriptionData,
  ): Promise<NotificationResponse> {
    const response = await notificationClient.post<NotificationResponse>(
      "/api/push/subscribe",
      { subscription },
    );
    return response.data;
  }

  async unsubscribePush(endpoint: string): Promise<NotificationResponse> {
    const response = await notificationClient.post<NotificationResponse>(
      "/api/push/unsubscribe",
      { endpoint },
    );
    return response.data;
  }

  async unsubscribeAllPush(): Promise<NotificationResponse> {
    const response = await notificationClient.post<NotificationResponse>(
      "/api/push/unsubscribe-all",
    );
    return response.data;
  }

  async testPush(): Promise<TestPushResponse> {
    const response =
      await notificationClient.post<TestPushResponse>("/api/push/test");
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

export const notificationApi = new NotificationApiService();

// ==================== WebSocket ====================

const WS_URL =
  process.env.NEXT_PUBLIC_NOTIFICATION_WS_URL ||
  "ws://localhost:3006/ws/notifications";

export class NotificationWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private token: string | null = null;
  private pingInterval: NodeJS.Timeout | null = null;

  onNotification?: (notification: Notification, unreadCount: number) => void;
  onNotificationRead?: (notificationId: string) => void;
  onAllNotificationsRead?: () => void;
  onUnreadCountChange?: (count: number) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;

  private isConnecting = false;

  connect(token: string): void {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      console.log("[WebSocket] Connection already in progress, skipping");
      return;
    }

    // Don't reconnect if already connected
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log("[WebSocket] Already connected");
      return;
    }

    this.token = token;
    this.reconnectAttempts = 0;
    console.log("[WebSocket] Connecting with token...");
    this.connectInternal();
  }

  private connectInternal(): void {
    if (!this.token || typeof window === "undefined") {
      console.log("[WebSocket] Cannot connect - no token or not in browser");
      return;
    }

    // Prevent multiple connection attempts
    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      console.log("[WebSocket] Connecting to:", WS_URL);
      this.ws = new WebSocket(WS_URL, ["bearer", this.token]);

      this.ws.onopen = () => {
        console.log("[WebSocket] Connected to notification server");
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startPingInterval();
        this.onConnect?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error("[WebSocket] Failed to parse message:", error);
        }
      };

      this.ws.onclose = () => {
        console.log("[WebSocket] Disconnected");
        this.isConnecting = false;
        this.stopPingInterval();
        this.onDisconnect?.();
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.warn("[WebSocket] Error:", error);
        this.isConnecting = false;
        this.onError?.(error);
      };
    } catch (error) {
      console.error("[WebSocket] Failed to connect:", error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      this.ping();
    }, 30000);
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("[WebSocket] Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
    );

    setTimeout(() => {
      this.connectInternal();
    }, delay);
  }

  private handleMessage(message: { type: string; data: any }): void {
    switch (message.type) {
      case "initial":
        this.onUnreadCountChange?.(message.data.unreadCount);
        break;

      case "new_notification":
        this.onNotification?.(
          message.data.notification,
          message.data.unreadCount,
        );
        this.onUnreadCountChange?.(message.data.unreadCount);
        break;

      case "notification_read":
        this.onNotificationRead?.(message.data.notificationId);
        break;

      case "all_notifications_read":
        this.onAllNotificationsRead?.();
        break;

      case "pong":
        // Keep-alive response
        break;

      default:
        console.warn("[WebSocket] Unknown message type:", message.type);
    }
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    this.send({ type: "mark_as_read", data: { notificationId } });
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    this.send({ type: "mark_all_read", data: {} });
  }

  /**
   * Send ping to keep connection alive
   */
  ping(): void {
    this.send({ type: "ping", data: {} });
  }

  private send(message: { type: string; data: any }): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    this.token = null;
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const notificationWebSocket = new NotificationWebSocket();
