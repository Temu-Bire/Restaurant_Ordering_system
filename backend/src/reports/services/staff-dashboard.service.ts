import { Injectable } from '@nestjs/common';
import {
  InventoryStatus,
  OrderStatus,
  OrderType,
  TableStatus,
} from '@prisma/client';
import {
  orderInclude,
  toOrderResponse,
} from '../../orders/helpers/order-response.mapper.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { getTodayRange } from '../helpers/date-range.helper.js';

@Injectable()
export class StaffDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async staff() {
    const { start: todayStart, end: todayEnd } = getTodayRange();

    const [
      activeOrders,
      completedTodayCount,
      tables,
      activeIngredients,
      recentMovements,
    ] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          status: {
            in: [
              OrderStatus.PENDING,
              OrderStatus.CONFIRMED,
              OrderStatus.PREPARING,
              OrderStatus.READY,
              OrderStatus.OUT_FOR_DELIVERY,
            ],
          },
        },
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({
        where: {
          createdAt: { gte: todayStart, lte: todayEnd },
          status: {
            in: [
              OrderStatus.COMPLETED,
              OrderStatus.SERVED,
              OrderStatus.PICKED_UP,
              OrderStatus.DELIVERED,
            ],
          },
        },
      }),
      this.prisma.restaurantTable.findMany({
        orderBy: { name: 'asc' },
      }),
      // Unified query for active ingredients to avoid redundant table scans
      this.prisma.ingredient.findMany({
        where: { status: InventoryStatus.ACTIVE },
        select: { id: true, name: true, stock: true, minimum: true, unit: true },
      }),
      this.prisma.stockMovement.findMany({
        include: { ingredient: true, user: true },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
    ]);

    const lowStockFiltered = activeIngredients.filter(
      (i) => i.stock.greaterThan(0) && i.stock.lessThanOrEqualTo(i.minimum),
    );
    const outOfStockList = activeIngredients.filter((i) => i.stock.lessThanOrEqualTo(0));

    // Group active orders by operational step
    const pendingOrders = activeOrders.filter((o) => o.status === OrderStatus.PENDING);
    const confirmedOrders = activeOrders.filter((o) => o.status === OrderStatus.CONFIRMED);
    const preparingOrders = activeOrders.filter((o) => o.status === OrderStatus.PREPARING);
    const readyOrders = activeOrders.filter((o) => o.status === OrderStatus.READY);
    const outForDeliveryOrders = activeOrders.filter((o) => o.status === OrderStatus.OUT_FOR_DELIVERY);

    return {
      operationalCounts: {
        actionRequired: pendingOrders.length + confirmedOrders.length,
        preparing: preparingOrders.length,
        readyForServingOrPickup: readyOrders.length,
        awaitingDeliveryHandover: outForDeliveryOrders.length + readyOrders.filter((o) => o.type === OrderType.DELIVERY).length,
        completedToday: completedTodayCount,
      },
      orders: {
        pending: pendingOrders.map(toOrderResponse),
        preparing: preparingOrders.map(toOrderResponse),
        ready: readyOrders.map(toOrderResponse),
        outForDelivery: outForDeliveryOrders.map(toOrderResponse),
        recent: activeOrders.slice(0, 8).map(toOrderResponse),
      },
      tables: {
        total: tables.length,
        available: tables.filter((t) => t.status === TableStatus.AVAILABLE || t.status === TableStatus.FREE).length,
        occupied: tables.filter((t) => t.status === TableStatus.OCCUPIED).length,
        cleaning: tables.filter((t) => t.status === TableStatus.CLEANING).length,
        reserved: tables.filter((t) => t.status === TableStatus.RESERVED).length,
        list: tables.map((t) => ({
          id: t.id,
          name: t.name,
          seats: t.seats,
          status: t.status.toLowerCase(),
          section: t.section ?? undefined,
        })),
      },
      stockAlerts: {
        lowStock: lowStockFiltered.map((i) => ({
          id: i.id,
          name: i.name,
          stock: i.stock.toNumber(),
          min: i.minimum.toNumber(),
          unit: i.unit,
        })),
        outOfStock: outOfStockList.map((i) => ({
          id: i.id,
          name: i.name,
          unit: i.unit,
        })),
      },
      recentActivity: recentMovements.map((m) => ({
        id: m.id,
        item: m.ingredient.name,
        type: m.type,
        delta: m.quantityChanged.toNumber(),
        user: m.user?.fullName ?? 'System',
        time: m.createdAt.toISOString(),
      })),
    };
  }
}
