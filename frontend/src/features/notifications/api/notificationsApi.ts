import { api } from "../../../lib/apiClient";
import type { AppNotification, PaginatedNotifications } from "../types";

export async function getNotifications(params?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}): Promise<PaginatedNotifications> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.unreadOnly) query.set("unreadOnly", "true");
  const qs = query.toString() ? `?${query.toString()}` : "";
  return api.get<PaginatedNotifications>(`/notifications${qs}`);
}

export async function getUnreadNotificationCount(): Promise<number> {
  const res = await api.get<{ unreadCount: number }>("/notifications/unread-count");
  return res.unreadCount;
}

export async function markNotificationAsRead(id: string): Promise<AppNotification> {
  return api.patch<AppNotification>(`/notifications/${id}/read`);
}

export async function markAllNotificationsAsRead(): Promise<{ updated: number }> {
  return api.patch<{ updated: number }>("/notifications/mark-all-read");
}
