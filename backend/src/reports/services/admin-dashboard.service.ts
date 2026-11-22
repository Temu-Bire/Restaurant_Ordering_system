import { Injectable } from '@nestjs/common';
import {
  InventoryStatus,
  OrderStatus,
  OrderType,
  PaymentStatus,
  TableStatus,
} from '@prisma/client';
import {
  orderInclude,
  toOrderResponse,
} from '../../orders/helpers/order-response.mapper.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { getTodayRange } from '../helpers/date-range.helper.js';
import {
  ACTIVE_DELIVERY_STATUS_GROUP,
  roundTwoDecimals,
} from '../helpers/report-calculation.helper.js';
import { SalesReportService } from './sales-report.service.js';

@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly salesReportService: SalesReportService,
  ) {}

  async admin(period = 'weekly') {
    const { start: todayStart, end: todayEnd } = getTodayRange();

    const [
      todayOrders,
      activeOrdersCount,
      completedOrdersCount,
      totalMenuItems,
      availableFoodItems,
      recentOrders,
      ingredients,
      tables,
      deliveries,
      recentMovements,
    ] = await Promise.all([
      this.prisma.order.findMany({
        where: { createdAt: { gte: todayStart, lte: todayEnd } },
        include: { payment: true, items: true },
      }),
      this.prisma.order.count({
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
      }),
      this.prisma.order.count({
        where: {
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
      this.prisma.food.count(),
      this.prisma.food.count({ where: { isAvailable: true } }),
      this.prisma.order.findMany({
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      this.prisma.ingredient.findMany({
        where: { status: InventoryStatus.ACTIVE },
        orderBy: { name: 'asc' },
      }),
      this.prisma.restaurantTable.findMany({
        orderBy: { name: 'asc' },
      }),
      this.prisma.order.findMany({
        where: { type: OrderType.DELIVERY, createdAt: { gte: todayStart, lte: todayEnd } },
        include: { payment: true },
      }),
      this.prisma.stockMovement.findMany({
        include: { ingredient: true, user: true },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
    ]);

    // Today's paid orders ONLY
    const paidToday = todayOrders.filter(
      (o) => o.paymentStatus === PaymentStatus.PAID && o.status !== OrderStatus.CANCELLED,
    );
    const todayRevenue = paidToday.reduce((sum, o) => sum + o.total.toNumber(), 0);

    // Stock thresholds
    const lowStockList = ingredients.filter(
      (i) => i.stock.greaterThan(0) && i.stock.lessThanOrEqualTo(i.minimum),
    );
    const outOfStockList = ingredients.filter((i) => i.stock.lessThanOrEqualTo(0));

    // Today's orders by type
    const ordersByType = {
      dineIn: todayOrders.filter((o) => o.type === OrderType.DINE_IN).length,
      takeaway: todayOrders.filter((o) => o.type === OrderType.TAKEAWAY).length,
      delivery: todayOrders.filter((o) => o.type === OrderType.DELIVERY).length,
    };

    // Table statistics
    const tableStats = {
      total: tables.length,
      available: tables.filter((t) => t.status === TableStatus.AVAILABLE || t.status === TableStatus.FREE).length,
      occupied: tables.filter((t) => t.status === TableStatus.OCCUPIED).length,
      reserved: tables.filter((t) => t.status === TableStatus.RESERVED).length,
      cleaning: tables.filter((t) => t.status === TableStatus.CLEANING).length,
    };

    // Delivery stats
    const deliveryStats = {
      totalToday: deliveries.length,
      activeDeliveries: deliveries.filter((d) => ACTIVE_DELIVERY_STATUS_GROUP.includes(d.status)).length,
      deliveredToday: deliveries.filter((d) => d.status === OrderStatus.DELIVERED).length,
      feesCollectedToday: deliveries
        .filter((d) => d.paymentStatus === PaymentStatus.PAID)
        .reduce((sum, d) => sum + d.deliveryFee.toNumber(), 0),
    };

    // Top selling items from today
    const soldMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    for (const o of paidToday) {
      for (const item of o.items) {
        const entry = soldMap.get(item.foodId) ?? { name: item.name, quantity: 0, revenue: 0 };
        entry.quantity += item.quantity;
        entry.revenue += item.unitPrice.toNumber() * item.quantity;
        soldMap.set(item.foodId, entry);
      }
    }
    const topSelling = [...soldMap.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5);

    // Standard chart report
    const reportData = await this.salesReportService.report(period as any);

    return {
      today: {
        totalOrders: todayOrders.length,
        paidRevenue: roundTwoDecimals(todayRevenue),
        activeOrders: activeOrdersCount,
        completedOrders: completedOrdersCount,
        ordersByType,
      },
      inventory: {
        lowStockCount: lowStockList.length,
        outOfStockCount: outOfStockList.length,
        lowStockItems: lowStockList.map((i) => ({
          id: i.id,
          name: i.name,
          stock: i.stock.toNumber(),
          min: i.minimum.toNumber(),
          unit: i.unit,
        })),
        outOfStockItems: outOfStockList.map((i) => ({ id: i.id, name: i.name, unit: i.unit })),
      },
      menu: {
        totalMenuItems,
        availableFoodItems,
        unavailableFoodItems: totalMenuItems - availableFoodItems,
      },
      tables: tableStats,
      delivery: deliveryStats,
      topSelling,
      recentOrders: recentOrders.map(toOrderResponse),
      recentActivity: recentMovements.map((m) => ({
        id: m.id,
        item: m.ingredient.name,
        type: m.type,
        delta: m.quantityChanged.toNumber(),
        user: m.user?.fullName ?? 'System',
        time: m.createdAt.toISOString(),
      })),
      report: reportData,
    };
  }
}
