import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import {
  OrderStatus,
  OrderType,
  PaymentStatus,
  Role,
  TableStatus,
} from '@prisma/client';
import { StockManagementService } from '../../inventory/services/stock-management.service.js';
import { NotificationService } from '../../notifications/notifications.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { HandoverOrderDto } from '../dto/handover-order.dto.js';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto.js';
import {
  CUSTOMER_CANCELLABLE_STATUSES,
} from '../helpers/order-items.helper.js';
import {
  orderInclude,
  OrderResponse,
  toOrderResponse,
} from '../helpers/order-response.mapper.js';
import { OrderQueryService } from './order-query.service.js';

export const PERMITTED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.SERVED, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [
    OrderStatus.SERVED,
    OrderStatus.PICKED_UP,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.SERVED]: [OrderStatus.COMPLETED],
  [OrderStatus.PICKED_UP]: [OrderStatus.COMPLETED],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

@Injectable()
export class OrderLifecycleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderLifecycleService.name);
  private cleanupIntervalRef?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly orderQuery: OrderQueryService,
    private readonly stockManagement: StockManagementService,
    @Optional() private readonly notifications?: NotificationService,
  ) {}

  onModuleInit() {
    // Automatically poll and release expired holds every 2 minutes
    this.cleanupIntervalRef = setInterval(() => {
      this.cleanupExpiredHolds().catch((err) => {
        this.logger.error(`Automated expired holds cleanup failed: ${err.message}`, err.stack);
      });
    }, 120_000);
    this.logger.log('Automated expired holds cleanup scheduler initialized (2m interval)');
  }

  onModuleDestroy() {
    if (this.cleanupIntervalRef) {
      clearInterval(this.cleanupIntervalRef);
      this.cleanupIntervalRef = undefined;
    }
  }

  /**
   * Release expired inventory and table holds for abandoned checkouts
   */
  async cleanupExpiredHolds(): Promise<number> {
    const now = new Date();
    const expiredOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        heldUntil: { lt: now },
      },
      select: { id: true, number: true },
    });

    let cleaned = 0;
    for (const order of expiredOrders) {
      try {
        await this.changeStatus(order.id, OrderStatus.CANCELLED);
        this.logger.log(`Released expired reservation for order #${order.number}`);
        cleaned++;
      } catch (err) {
        this.logger.warn(`Failed to release expired hold for order #${order.number}: ${String(err)}`);
      }
    }
    return cleaned;
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    actor: { id: string; role: Role },
  ): Promise<OrderResponse> {
    if (actor.role !== Role.STAFF) {
      throw new ForbiddenException('Only staff can update order status');
    }
    const order = await this.orderQuery.findRecord(id);
    return this.changeStatus(order.id, dto.status);
  }

  async handover(
    id: string,
    actor: { id: string; role: Role },
    dto: HandoverOrderDto,
  ): Promise<OrderResponse> {
    if (actor.role !== Role.STAFF) {
      throw new ForbiddenException('Only staff can process order handover');
    }

    const order = await this.orderQuery.findRecord(id);

    let nextStatus: OrderStatus;
    if (order.type === OrderType.DINE_IN) {
      if (order.status !== OrderStatus.READY && order.status !== OrderStatus.PREPARING) {
        throw new BadRequestException('Order must be ready or preparing to confirm serving');
      }
      nextStatus = OrderStatus.SERVED;
    } else if (order.type === OrderType.TAKEAWAY) {
      if (order.status !== OrderStatus.READY) {
        throw new BadRequestException('Order must be ready before customer pickup');
      }
      nextStatus = OrderStatus.PICKED_UP;
    } else {
      // DELIVERY
      if (order.status === OrderStatus.READY) {
        nextStatus = OrderStatus.OUT_FOR_DELIVERY;
      } else if (order.status === OrderStatus.OUT_FOR_DELIVERY) {
        nextStatus = OrderStatus.DELIVERED;
      } else {
        throw new BadRequestException('Order must be ready or out for delivery to confirm handover');
      }
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: nextStatus,
        handoverStaffId: actor.id,
        handoverAt: new Date(),
        handoverNotes: dto.notes?.trim() || null,
      },
      include: orderInclude,
    });

    return toOrderResponse(updated);
  }

  async cancel(id: string, customerId: string): Promise<OrderResponse> {
    const order = await this.orderQuery.findRecord(id);
    if (order.customerId !== customerId) {
      throw new ForbiddenException('You can only cancel your own orders');
    }
    if (!CUSTOMER_CANCELLABLE_STATUSES.includes(order.status)) {
      throw new BadRequestException('This order can no longer be cancelled');
    }
    return this.changeStatus(order.id, OrderStatus.CANCELLED);
  }

  async changeStatus(id: string, targetStatus: OrderStatus): Promise<OrderResponse> {
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: { include: { food: { include: { recipes: true } } } } },
      });
      if (!order) throw new NotFoundException('Order not found');

      if (order.status === targetStatus) {
        const current = await tx.order.findUnique({ where: { id }, include: orderInclude });
        return current!;
      }

      // Validate allowed transitions
      const allowed = PERMITTED_STATUS_TRANSITIONS[order.status] ?? [];
      if (!allowed.includes(targetStatus)) {
        throw new BadRequestException(
          `Cannot transition order status from ${order.status} to ${targetStatus}`,
        );
      }

      if (targetStatus === OrderStatus.CANCELLED) {
        // Restore inventory stock only if it was previously deducted
        if (order.stockAdjusted) {
          await this.stockManagement.adjustOrderStock(
            tx,
            order.items.map((item) => ({
              food: item.food,
              quantity: item.quantity,
            })),
            'restore',
          );
        }

        // Release table hold or reservation
        if (order.tableId) {
          await tx.restaurantTable.update({
            where: { id: order.tableId },
            data: {
              status: TableStatus.AVAILABLE,
              heldUntil: null,
              activeOrderId: null,
            },
          });
        }
      }

      const updated = await tx.order.update({
        where: { id },
        data: {
          status: targetStatus,
          stockAdjusted: targetStatus === OrderStatus.CANCELLED ? false : order.stockAdjusted,
        },
        include: orderInclude,
      });

      return updated;
    });

    // Post-commit notifications
    if (this.notifications && result?.customerId) {
      void this.notifications.createForUser({
        recipientUserId: result.customerId,
        title: 'Order Status Update',
        message: `Your order #${result.number} is now ${targetStatus}.`,
        type: 'ORDER_STATUS_UPDATE' as any,
        relatedEntityId: result.id,
        idempotencyKey: `notif_status_${result.id}_${targetStatus}`,
      });
    }

    if (this.notifications && targetStatus === OrderStatus.CANCELLED) {
      void this.notifications.createForRole(Role.STAFF, {
        title: 'Order Cancelled',
        message: `Order #${result.number} was cancelled.`,
        type: 'ORDER_CANCELLED' as any,
        relatedEntityId: result.id,
        idempotencyKey: `notif_cancel_staff_${result.id}`,
      });
    }

    return toOrderResponse(result);
  }
}
