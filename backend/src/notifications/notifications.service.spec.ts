import { NotificationType, Role } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsGateway } from './notifications.gateway.js';
import { NotificationService } from './notifications.service.js';

describe('NotificationService', () => {
  let service: NotificationService;
  let prisma: any;
  let gateway: any;

  beforeEach(() => {
    prisma = {
      notification: {
        findUnique: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      user: {
        findMany: vi.fn(),
      },
    };

    gateway = {
      sendToUser: vi.fn(),
      sendToRole: vi.fn(),
      sendUnreadCount: vi.fn(),
    };

    service = new NotificationService(
      prisma as unknown as PrismaService,
      gateway as unknown as NotificationsGateway,
    );
  });

  it('should create notification permanently and dispatch via gateway', async () => {
    const mockNotif = {
      id: 'notif-1',
      recipientUserId: 'user-1',
      title: 'Order Confirmed',
      message: 'Your order #101 is confirmed',
      type: NotificationType.ORDER_CONFIRMATION,
      isRead: false,
      createdAt: new Date(),
    };

    prisma.notification.findUnique.mockResolvedValue(null);
    prisma.notification.create.mockResolvedValue(mockNotif);
    prisma.notification.count.mockResolvedValue(1);

    const result = await service.createForUser({
      recipientUserId: 'user-1',
      title: 'Order Confirmed',
      message: 'Your order #101 is confirmed',
      type: NotificationType.ORDER_CONFIRMATION,
      idempotencyKey: 'key-101',
    });

    expect(prisma.notification.create).toHaveBeenCalled();
    expect(gateway.sendToUser).toHaveBeenCalledWith('user-1', mockNotif);
    expect(gateway.sendUnreadCount).toHaveBeenCalledWith('user-1', 1);
    expect(result?.id).toBe('notif-1');
  });

  it('should prevent duplicate notifications when idempotencyKey matches existing', async () => {
    const existing = {
      id: 'existing-notif',
      recipientUserId: 'user-1',
      idempotencyKey: 'dup-key',
    };

    prisma.notification.findUnique.mockResolvedValue(existing);

    const result = await service.createForUser({
      recipientUserId: 'user-1',
      title: 'Repeated Webhook',
      message: 'Repeated',
      type: NotificationType.PAYMENT_SUCCESS,
      idempotencyKey: 'dup-key',
    });

    expect(result).toBe(existing);
    expect(prisma.notification.create).not.toHaveBeenCalled();
    expect(gateway.sendToUser).not.toHaveBeenCalled();
  });

  it('should create notifications for all active users of a role', async () => {
    prisma.user.findMany.mockResolvedValue([
      { id: 'staff-1' },
      { id: 'staff-2' },
    ]);
    prisma.notification.findUnique.mockResolvedValue(null);
    prisma.notification.create.mockImplementation(({ data }) => ({
      ...data,
      id: `notif-${data.recipientUserId}`,
    }));
    prisma.notification.count.mockResolvedValue(1);

    const notifs = await service.createForRole(Role.STAFF, {
      title: 'New Order',
      message: 'Order #200 placed',
      type: NotificationType.NEW_ORDER,
      idempotencyKey: 'order-200',
    });

    expect(notifs).toHaveLength(2);
    expect(gateway.sendToUser).toHaveBeenCalledTimes(2);
  });

  it('should mark an individual notification as read', async () => {
    const notif = {
      id: 'notif-1',
      recipientUserId: 'user-1',
      isRead: false,
    };
    prisma.notification.findUnique.mockResolvedValue(notif);
    prisma.notification.update.mockResolvedValue({ ...notif, isRead: true });
    prisma.notification.count.mockResolvedValue(0);

    const updated = await service.markAsRead('notif-1', 'user-1');

    expect(updated.isRead).toBe(true);
    expect(prisma.notification.update).toHaveBeenCalled();
    expect(gateway.sendUnreadCount).toHaveBeenCalledWith('user-1', 0);
  });
});
