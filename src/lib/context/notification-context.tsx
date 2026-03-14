"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import {
  notificationApi,
  notificationWebSocket,
  type Notification,
  type NotificationPreferences,
} from "../services/notification-api";
import { useAuth } from "./auth-context";

export type NotificationType = "info" | "success" | "warning" | "error";

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  preferences: NotificationPreferences | null;
  // WebSocket connection status
  isWebSocketConnected: boolean;
  // Actions
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  // Push notifications
  subscribePush: () => Promise<boolean>;
  unsubscribePush: () => Promise<void>;
  isPushSupported: boolean;
  isPushSubscribed: boolean;
  // Legacy compatibility
  addNotification: (notification: {
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
  }) => void;
  clearNotifications: () => void;
  dismissNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

const NOTIFICATIONS_PER_PAGE = 20;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, token, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const wsSetupRef = useRef(false);

  // Check push notification support - only once on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsPushSupported(
        "serviceWorker" in navigator && "PushManager" in window,
      );
    }
  }, []);

  // Fetch notifications from API
  const fetchNotifications = useCallback(
    async (page = 1, append = false) => {
      if (!isAuthenticated) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await notificationApi.getNotifications(
          page,
          NOTIFICATIONS_PER_PAGE,
        );

        if (response.success) {
          if (append) {
            setNotifications((prev) => [...prev, ...(response.data || [])]);
          } else {
            setNotifications(response.data || []);
          }
          setUnreadCount(response.unreadCount || 0);
          setHasMore((response.data?.length || 0) === NOTIFICATIONS_PER_PAGE);
        }
      } catch (err) {
        setError("Failed to load notifications");
        console.error("Failed to fetch notifications:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated],
  );

  // Load preferences
  const fetchPreferences = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await notificationApi.getPreferences();
      if (response.success) {
        setPreferences(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch preferences:", err);
    }
  }, [isAuthenticated]);

  // Initial fetch - with flag to prevent multiple calls
  useEffect(() => {
    let mounted = true;

    if (isAuthenticated && mounted) {
      fetchNotifications(1, false);
      fetchPreferences();
      setCurrentPage(1);
    } else if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setPreferences(null);
    }

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]); // Intentionally omit fetchNotifications and fetchPreferences

  // WebSocket connection - with cleanup
  useEffect(() => {
    if (!isAuthenticated || !token || typeof window === "undefined") {
      console.log(
        "[NotificationContext] WebSocket not connecting - auth:",
        isAuthenticated,
        "token:",
        !!token,
      );
      return;
    }

    // Prevent duplicate connection attempts from StrictMode
    if (wsSetupRef.current) {
      console.log(
        "[NotificationContext] WebSocket setup already in progress, skipping",
      );
      return;
    }

    wsSetupRef.current = true;
    console.log("[NotificationContext] Setting up WebSocket connection...");

    // Set up event handlers BEFORE connecting
    const handleNotification = (notification: Notification, count: number) => {
      console.log(
        "[NotificationContext] New notification received:",
        notification.title,
      );
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount(count);

      // Show browser notification if permitted
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          new Notification(notification.title, {
            body: notification.message,
            icon: "/icon-192x192.png",
          });
        } catch (e) {
          console.error(
            "[NotificationContext] Failed to show browser notification:",
            e,
          );
        }
      }
    };

    const handleNotificationRead = (notificationId: string) => {
      console.log(
        "[NotificationContext] Notification marked as read:",
        notificationId,
      );
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n,
        ),
      );
    };

    const handleAllNotificationsRead = () => {
      console.log("[NotificationContext] All notifications marked as read");
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
    };

    const handleUnreadCountChange = (count: number) => {
      setUnreadCount(count);
    };

    const handleConnect = () => {
      console.log("[NotificationContext] WebSocket connected successfully");
      setIsWebSocketConnected(true);
    };

    const handleDisconnect = () => {
      console.log("[NotificationContext] WebSocket disconnected");
      setIsWebSocketConnected(false);
    };

    const handleError = (error: Event) => {
      console.error("[NotificationContext] WebSocket error:", error);
    };

    // Assign handlers
    notificationWebSocket.onNotification = handleNotification;
    notificationWebSocket.onNotificationRead = handleNotificationRead;
    notificationWebSocket.onAllNotificationsRead = handleAllNotificationsRead;
    notificationWebSocket.onUnreadCountChange = handleUnreadCountChange;
    notificationWebSocket.onConnect = handleConnect;
    notificationWebSocket.onDisconnect = handleDisconnect;
    notificationWebSocket.onError = handleError;

    // Connect WebSocket
    notificationWebSocket.connect(token);

    return () => {
      console.log("[NotificationContext] Cleaning up WebSocket connection");
      wsSetupRef.current = false;
      notificationWebSocket.disconnect();
    };
  }, [isAuthenticated, token]);

  // Fallback polling when WebSocket is not connected
  useEffect(() => {
    if (!isAuthenticated || typeof window === "undefined") return;

    // Poll every 30 seconds if WebSocket is not connected
    const pollInterval = setInterval(() => {
      if (!isWebSocketConnected && !isLoading) {
        console.log(
          "[NotificationContext] Polling for new notifications (WebSocket not connected)",
        );
        fetchNotifications(1, false);
      }
    }, 30000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [isAuthenticated, isWebSocketConnected, isLoading, fetchNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Also notify via WebSocket for real-time sync
      notificationWebSocket.markAsRead(id);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString(),
        })),
      );
      setUnreadCount(0);

      // Also notify via WebSocket
      notificationWebSocket.markAllAsRead();
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(
    async (id: string) => {
      try {
        await notificationApi.deleteNotification(id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        // Recalculate unread count
        const deleted = notifications.find((n) => n.id === id);
        if (deleted && !deleted.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (err) {
        console.error("Failed to delete notification:", err);
      }
    },
    [notifications],
  );

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications(1, false);
    setCurrentPage(1);
  }, [fetchNotifications]);

  // Load more notifications
  const loadMoreNotifications = useCallback(async () => {
    if (!hasMore || isLoading) return;
    const nextPage = currentPage + 1;
    await fetchNotifications(nextPage, true);
    setCurrentPage(nextPage);
  }, [currentPage, hasMore, isLoading, fetchNotifications]);

  // Update preferences
  const updatePreferences = useCallback(
    async (prefs: Partial<NotificationPreferences>) => {
      try {
        const response = await notificationApi.updatePreferences(prefs);
        if (response.success) {
          setPreferences(response.data);
        }
      } catch (err) {
        console.error("Failed to update preferences:", err);
        throw err;
      }
    },
    [],
  );

  // Subscribe to push notifications
  const subscribePush = useCallback(async (): Promise<boolean> => {
    if (!isPushSupported || !isAuthenticated) return false;

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key
      const publicKey = await notificationApi.getVapidPublicKey();
      if (!publicKey) {
        console.warn("Push notifications not configured on server");
        return false;
      }

      // Subscribe
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          publicKey,
        ) as unknown as ArrayBuffer,
      });

      // Send subscription to server
      await notificationApi.subscribePush({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey("p256dh")!),
          auth: arrayBufferToBase64(subscription.getKey("auth")!),
        },
      });

      setIsPushSubscribed(true);
      return true;
    } catch (err) {
      console.error("Failed to subscribe to push notifications:", err);
      return false;
    }
  }, [isPushSupported, isAuthenticated]);

  // Unsubscribe from push notifications
  const unsubscribePush = useCallback(async () => {
    if (!isPushSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await notificationApi.unsubscribePush(subscription.endpoint);
        await subscription.unsubscribe();
      }

      setIsPushSubscribed(false);
    } catch (err) {
      console.error("Failed to unsubscribe from push notifications:", err);
    }
  }, [isPushSupported]);

  // Check push subscription status
  useEffect(() => {
    if (!isPushSupported || !isAuthenticated) return;

    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsPushSubscribed(!!subscription);
      } catch (err) {
        console.error("Failed to check push subscription:", err);
      }
    };

    checkSubscription();
  }, [isPushSupported, isAuthenticated]);

  // Legacy: add notification (local only, for compatibility)
  const addNotification = useCallback(
    (notification: {
      title: string;
      message: string;
      type: NotificationType;
      link?: string;
    }) => {
      // This is now handled by the backend, but kept for compatibility
      console.log("Legacy addNotification called:", notification);
    },
    [],
  );

  // Legacy: clear notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Legacy: dismiss notification
  const dismissNotification = useCallback(
    (id: string) => {
      deleteNotification(id);
    },
    [deleteNotification],
  );

  // Context value - memoized to prevent unnecessary re-renders
  const value: NotificationContextType = useMemo(() => ({
    notifications,
    unreadCount,
    isLoading,
    error,
    preferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    loadMoreNotifications,
    updatePreferences,
    subscribePush,
    unsubscribePush,
    isPushSupported,
    isPushSubscribed,
    isWebSocketConnected,
    addNotification,
    clearNotifications,
    dismissNotification,
  }), [
    notifications,
    unreadCount,
    isLoading,
    error,
    preferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    loadMoreNotifications,
    updatePreferences,
    subscribePush,
    unsubscribePush,
    isPushSupported,
    isPushSubscribed,
    isWebSocketConnected,
    addNotification,
    clearNotifications,
    dismissNotification,
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Custom hook to use the notification context
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}

// Helper functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
