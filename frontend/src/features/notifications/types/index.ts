export type NotificationType =
  | 'ORDER_CONFIRMATION'
  | 'ORDER_STATUS_UPDATE'
  | 'ORDER_CANCELLED'
  | 'NEW_ORDER'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILURE'
  | 'PAYMENT_ISSUE'
  | 'NEW_USER'
  | 'SYSTEM_EVENT';

export interface AppNotification {
  id: string;
  recipientUserId: string;
  title: string;
  message: string;
  type: NotificationType | string;
  relatedEntityId?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface PaginatedNotifications {
  items: AppNotification[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
