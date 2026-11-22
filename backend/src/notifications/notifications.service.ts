import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Notification, NotificationType, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationFilterDto } from './dto/notification-filter.dto.js';
import { NotificationsGateway } from './notifications.gateway.js';

export interface CreateNotificationInput {
  recipientUserId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedEntityId?: string | null;
  idempotencyKey?: string;
}

export interface CreateRoleNotificationInput {
  title: string;
  message: string;
  type: NotificationType;
  relatedEntityId?: string | null;
  idempotencyKey?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  /**
   * Permanently create notification for a specific user and deliver real-time.
   * Guaranteed idempotent via idempotencyKey.
   */
  async createForUser(
    input: CreateNotificationInput,
  ): Promise<Notification | null> {
    if (input.idempotencyKey) {
      const existing = await this.prisma.notification.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (existing) {
        this.logger.debug(
          `Skipping duplicate notification with idempotencyKey: ${input.idempotencyKey}`,
        );
        return existing;
      }
    }

    try {
      const notification = await this.prisma.notification.create({
        data: {
          recipientUserId: input.recipientUserId,
          title: input.title,
          message: input.message,
          type: input.type,
          relatedEntityId: input.relatedEntityId,
          idempotencyKey: input.idempotencyKey,
        },
      });

      // Deliver via WebSocket only AFTER DB persistence succeeds
      this.gateway.sendToUser(input.recipientUserId, notification);

      const unreadCount = await this.getUnreadCount(input.recipientUserId);
      this.gateway.sendUnreadCount(input.recipientUserId, unreadCount);

      return notification;
    } catch (err) {
      // If concurrent request created with same idempotencyKey, return existing gracefully
      if (input.idempotencyKey) {
        const existing = await this.prisma.notification.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
        });
        if (existing) return existing;
      }
      this.logger.error('Failed to create user notification', err);
      throw err;
    }
  }

  /**
   * Persist notifications for all active users of a role and broadcast via WebSocket.
   */
  async createForRole(
    role: Role,
    input: CreateRoleNotificationInput,
  ): Promise<Notification[]> {
    const users = await this.prisma.user.findMany({
      where: { role, isActive: true },
      select: { id: true },
    });

    if (users.length === 0) return [];

    const createdNotifications: Notification[] = [];

    for (const user of users) {
      const userKey = input.idempotencyKey
        ? `${input.idempotencyKey}:${user.id}`
        : undefined;

      const notif = await this.createForUser({
        recipientUserId: user.id,
        title: input.title,
        message: input.message,
        type: input.type,
        relatedEntityId: input.relatedEntityId,
        idempotencyKey: userKey,
      });

      if (notif) createdNotifications.push(notif);
    }

    return createdNotifications;
  }

  /**
   * Get paginated notifications for the current user
   */
  async getPaginated(userId: string, filter: NotificationFilterDto) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      recipientUserId: userId,
      ...(filter.unreadOnly ? { isRead: false } : {}),
    };

    const [total, data] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        recipientUserId: userId,
        isRead: false,
      },
    });
  }

  /**
   * Mark individual notification as read
   */
  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.recipientUserId !== userId) {
      throw new ForbiddenException('Cannot access another user notification');
    }

    if (notification.isRead) {
      return notification;
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    const unreadCount = await this.getUnreadCount(userId);
    this.gateway.sendUnreadCount(userId, unreadCount);

    return updated;
  }

  /**
   * Mark all notifications as read for current user
   */
  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        recipientUserId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    this.gateway.sendUnreadCount(userId, 0);

    return { count: result.count };
  }
}
