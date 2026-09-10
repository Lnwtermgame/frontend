import { apiFetch, apiFetchWithMeta } from "./client";
import type { AuthUser } from "./auth";

// ============ Account & Profile Types ============

export interface UpdateProfileInput {
  username?: string;
  email?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

// ============ Notification Types ============

export type NotificationType = "ORDER" | "PAYMENT" | "PROMOTION" | "SYSTEM";

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  data?: Record<string, unknown> | null;
  createdAt: string;
  readAt?: string | null;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  orderUpdates: boolean;
  promotions: boolean;
}

// ============ API Functions ============

// Profile & Account
export function updateProfile(data: UpdateProfileInput): Promise<AuthUser> {
  return apiFetch("/api/auth/profile", {
    method: "PUT",
    body: data,
  });
}

export function changePassword(data: ChangePasswordInput): Promise<{ message: string }> {
  return apiFetch("/api/auth/change-password", {
    method: "PUT",
    body: data,
  });
}

// Notifications
export function listNotifications(params: { page?: number; limit?: number } = {}) {
  const search = new URLSearchParams();
  if (params.page) search.append("page", String(params.page));
  if (params.limit) search.append("limit", String(params.limit));
  const q = search.toString();
  return apiFetchWithMeta<NotificationItem[]>(`/api/notifications${q ? `?${q}` : ""}`);
}

export function markNotificationRead(id: string): Promise<{ message: string }> {
  return apiFetch(`/api/notifications/${id}/read`, {
    method: "PUT",
  });
}

export function markAllNotificationsRead(): Promise<{ message: string }> {
  return apiFetch("/api/notifications/read-all", {
    method: "PUT",
  });
}

export function deleteNotification(id: string): Promise<{ message: string }> {
  return apiFetch(`/api/notifications/${id}`, {
    method: "DELETE",
  });
}

export function getNotificationPreferences(): Promise<NotificationPreferences> {
  return apiFetch("/api/notifications/preferences");
}

export function updateNotificationPreferences(
  data: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  return apiFetch("/api/notifications/preferences", {
    method: "PUT",
    body: data,
  });
}
