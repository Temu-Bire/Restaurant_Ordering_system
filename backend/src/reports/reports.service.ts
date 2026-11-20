import { Injectable } from '@nestjs/common';
import {
  InventoryStatus,
  MovementType,
  OrderStatus,
  OrderType,
  PaymentStatus,
  Prisma,
  Role,
  TableStatus,
} from '@prisma/client';
import { orderInclude, toOrderResponse } from '../orders/order-response.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReportFilterDto } from './dto/report-filter.dto.js';

const COMPLETED_STATUS_GROUP: OrderStatus[] = [
  OrderStatus.COMPLETED,
  OrderStatus.SERVED,
  OrderStatus.PICKED_UP,
  OrderStatus.DELIVERED,
];

const PENDING_STATUS_GROUP: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
];

const ACTIVE_DELIVERY_STATUS_GROUP: OrderStatus[] = [
  OrderStatus.READY,
  OrderStatus.OUT_FOR_DELIVERY,
];

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private getDateRange(filters?: ReportFilterDto) {
    const now = new Date();
    const period = filters?.period ?? 'week';

    if (period === 'custom' && filters?.startDate) {
      const start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0);
      const end = filters.endDate ? new Date(filters.endDate) : new Date();
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    if (period === 'today' || period === 'daily') {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    if (period === 'yesterday') {
      const start = new Date(now);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    if (period === 'month' || period === 'monthly') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }

    if (period === 'year') {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { start, end };
    }

    // Default: 'week' or 'weekly' (past 7 days from Monday or today)
    const start = new Date(now);
    const day = start.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + mondayOffset);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end };
  }

  // ───────────────────────── 1. Admin Comprehensive Reports Page ─────────────────────────
  async getAnalytics(filters: ReportFilterDto) {
    const { start, end } = this.getDateRange(filters);

    // Build base order filters
    const orderWhere: Prisma.OrderWhereInput = {
      createdAt: { gte: start, lte: end },
    };

    if (filters.orderType && filters.orderType !== 'all') {
      const upper = filters.orderType.toUpperCase().replace('-', '_');
      if (upper in OrderType) orderWhere.type = upper as OrderType;
    }

    if (filters.orderStatus && filters.orderStatus !== 'all') {
      const upper = filters.orderStatus.toUpperCase();
      if (upper in OrderStatus) orderWhere.status = upper as OrderStatus;
    }

    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
      const upper = filters.paymentStatus.toUpperCase();
      if (upper in PaymentStatus) orderWhere.paymentStatus = upper as PaymentStatus;
    }

    const [orders, ingredients, stockMovements, foods, categories] = await Promise.all([
      this.prisma.order.findMany({
        where: orderWhere,
        include: {
          items: { include: { food: { include: { category: true } } } },
          payment: true,
          table: true,
          address: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ingredient.findMany({
        where: {
          ...(filters.category && filters.category !== 'all'
            ? { category: filters.category.toUpperCase() as any }
            : {}),
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.stockMovement.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: { ingredient: true, user: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.food.findMany({
        include: { category: true },
      }),
      this.prisma.category.findMany(),
    ]);

    // Only paid and non-cancelled orders count as revenue
    const paidOrders = orders.filter(
      (o) => o.paymentStatus === PaymentStatus.PAID && o.status !== OrderStatus.CANCELLED,
    );

    const totalSales = orders.reduce((acc, o) => acc + o.total.toNumber(), 0);
    const paidRevenue = paidOrders.reduce((acc, o) => acc + o.total.toNumber(), 0);
    const deliveryFeesCollected = paidOrders.reduce((acc, o) => acc + o.deliveryFee.toNumber(), 0);
    const taxCollected = paidOrders.reduce((acc, o) => acc + o.tax.toNumber(), 0);
    const foodSales = paidRevenue - deliveryFeesCollected - taxCollected;
    const ordersCount = paidOrders.length;
    const averageOrderValue = ordersCount > 0 ? Math.round((paidRevenue / ordersCount) * 100) / 100 : 0;

    // Sales by Order Type
    const typeTotals: Record<string, { count: number; revenue: number }> = {
      'dine-in': { count: 0, revenue: 0 },
      takeaway: { count: 0, revenue: 0 },
      delivery: { count: 0, revenue: 0 },
    };
    for (const o of paidOrders) {
      const key = o.type === OrderType.DINE_IN ? 'dine-in' : o.type === OrderType.TAKEAWAY ? 'takeaway' : 'delivery';
      typeTotals[key].count += 1;
      typeTotals[key].revenue += o.total.toNumber();
    }
    const salesByOrderType = Object.entries(typeTotals).map(([type, stats]) => ({
      type,
      count: stats.count,
      revenue: Math.round(stats.revenue * 100) / 100,
    }));

    // Sales by Category
    const categoryTotals = new Map<string, { count: number; revenue: number }>();
    for (const cat of categories) {
      categoryTotals.set(cat.name, { count: 0, revenue: 0 });
    }
    for (const o of paidOrders) {
      for (const item of o.items) {
        const catName = item.food.category?.name ?? 'Other';
        const entry = categoryTotals.get(catName) ?? { count: 0, revenue: 0 };
        entry.count += item.quantity;
        entry.revenue += item.unitPrice.toNumber() * item.quantity;
        categoryTotals.set(catName, entry);
      }
    }
    const salesByCategory = [...categoryTotals.entries()].map(([category, stats]) => ({
      category,
      count: stats.count,
      revenue: Math.round(stats.revenue * 100) / 100,
    }));

    // ── Order Reports ──
    const totalOrdersCount = orders.length;
    const completedOrders = orders.filter((o) =>
      COMPLETED_STATUS_GROUP.includes(o.status),
    ).length;
    const cancelledOrders = orders.filter((o) => o.status === OrderStatus.CANCELLED).length;
    const pendingOrders = orders.filter((o) =>
      PENDING_STATUS_GROUP.includes(o.status),
    ).length;

    const statusCounts: Record<string, number> = {};
    for (const o of orders) {
      statusCounts[o.status.toLowerCase()] = (statusCounts[o.status.toLowerCase()] ?? 0) + 1;
    }
    const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

    // ── Popular Items Reports ──
    const itemSales = new Map<string, { name: string; category: string; quantity: number; revenue: number }>();
    for (const f of foods) {
      itemSales.set(f.id, {
        name: f.name,
        category: f.category.name,
        quantity: 0,
        revenue: 0,
      });
    }
    for (const o of paidOrders) {
      for (const item of o.items) {
        const entry = itemSales.get(item.foodId) ?? {
          name: item.name,
          category: 'Menu',
          quantity: 0,
          revenue: 0,
        };
        entry.quantity += item.quantity;
        entry.revenue += item.unitPrice.toNumber() * item.quantity;
        itemSales.set(item.foodId, entry);
      }
    }
    const allItemRankings = [...itemSales.values()].sort((a, b) => b.quantity - a.quantity);
    const bestSelling = allItemRankings.slice(0, 10);
    const leastSelling = allItemRankings.filter((i) => i.quantity >= 0).slice(-5).reverse();

    // ── Inventory Reports ──
    let totalInventoryValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const currentStockLevels = ingredients.map((i) => {
      const stock = i.stock.toNumber();
      const min = i.minimum.toNumber();
      const unitCost = i.unitCost.toNumber();
      const val = stock * unitCost;
      totalInventoryValue += val;

      if (stock <= 0) outOfStockCount++;
      else if (stock <= min) lowStockCount++;

      return {
        id: i.id,
        name: i.name,
        sku: i.sku,
        category: i.category.toLowerCase(),
        stock,
        minimum: min,
        unit: i.unit,
        unitCost,
        totalValue: Math.round(val * 100) / 100,
        status: i.status.toLowerCase(),
      };
    });

    let stockReceivedQty = 0;
    let stockReceivedValue = 0;
    let ingredientConsumedQty = 0;
    let wasteQty = 0;
    let wasteValue = 0;

    for (const m of stockMovements) {
      const qty = Math.abs(m.quantityChanged.toNumber());
      const cost = m.ingredient.unitCost.toNumber();
      if (m.type === MovementType.RECEIVE) {
        stockReceivedQty += qty;
        stockReceivedValue += qty * cost;
      } else if (m.type === MovementType.ORDER_CONSUMPTION) {
        ingredientConsumedQty += qty;
      } else if (m.type === MovementType.WASTE) {
        wasteQty += qty;
        wasteValue += qty * cost;
      }
    }

    // ── Delivery Reports ──
    const deliveryOrders = orders.filter((o) => o.type === OrderType.DELIVERY);
    const deliveryFeesTotal = deliveryOrders
      .filter((o) => o.paymentStatus === PaymentStatus.PAID)
      .reduce((sum, o) => sum + o.deliveryFee.toNumber(), 0);

    const deliveryStatusCounts: Record<string, number> = {};
    let totalDist = 0;
    let countDist = 0;
    for (const o of deliveryOrders) {
      deliveryStatusCounts[o.status.toLowerCase()] = (deliveryStatusCounts[o.status.toLowerCase()] ?? 0) + 1;
      if (o.deliveryDistanceKm) {
        totalDist += o.deliveryDistanceKm.toNumber();
        countDist++;
      }
    }

    return {
      period: filters.period ?? 'week',
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      sales: {
        totalSales: Math.round(totalSales * 100) / 100,
        paidRevenue: Math.round(paidRevenue * 100) / 100,
        foodSales: Math.round(foodSales * 100) / 100,
        deliveryFeesCollected: Math.round(deliveryFeesCollected * 100) / 100,
        taxCollected: Math.round(taxCollected * 100) / 100,
        ordersCount,
        averageOrderValue,
        salesByOrderType,
        salesByCategory,
      },
      orders: {
        totalOrders: totalOrdersCount,
        completedOrders,
        cancelledOrders,
        pendingOrders,
        byStatus: ordersByStatus,
        byType: salesByOrderType.map((s) => ({ type: s.type, count: s.count })),
      },
      inventory: {
        totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
        lowStockCount,
        outOfStockCount,
        stockReceivedQty: Math.round(stockReceivedQty * 100) / 100,
        stockReceivedValue: Math.round(stockReceivedValue * 100) / 100,
        ingredientConsumedQty: Math.round(ingredientConsumedQty * 100) / 100,
        wasteQty: Math.round(wasteQty * 100) / 100,
        wasteValue: Math.round(wasteValue * 100) / 100,
        items: currentStockLevels,
        recentMovements: stockMovements.slice(0, 15).map((m) => ({
          id: m.id,
          ingredientName: m.ingredient.name,
          type: m.type,
          delta: m.quantityChanged.toNumber(),
          unit: m.ingredient.unit,
          reason: m.reason ?? '',
          userName: m.user?.fullName ?? 'System',
          date: m.createdAt.toISOString(),
        })),
      },
      popularItems: {
        bestSelling,
        leastSelling,
      },
      delivery: {
        totalDeliveryOrders: deliveryOrders.length,
        deliveryFeesCollected: Math.round(deliveryFeesTotal * 100) / 100,
        byStatus: Object.entries(deliveryStatusCounts).map(([status, count]) => ({ status, count })),
        averageDistanceKm: countDist > 0 ? Math.round((totalDist / countDist) * 10) / 10 : 0,
      },
    };
  }

  // ───────────────────────── 2. Admin Overview Dashboard ─────────────────────────
  async admin(period = 'weekly') {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

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
    const reportData = await this.report(period as any);

    return {
      today: {
        totalOrders: todayOrders.length,
        paidRevenue: Math.round(todayRevenue * 100) / 100,
        activeOrders: activeOrdersCount,
        completedOrders: completedOrdersCount,
        ordersByType,
      },
      inventory: {
        lowStockCount: lowStockList.length,
        outOfStockCount: outOfStockList.length,
        lowStockItems: lowStockList.map((i) => ({ id: i.id, name: i.name, stock: i.stock.toNumber(), min: i.minimum.toNumber(), unit: i.unit })),
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

  // ───────────────────────── 3. Staff Operational Dashboard ─────────────────────────
  async staff() {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const [
      activeOrders,
      completedTodayCount,
      tables,
      lowStockList,
      outOfStockList,
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
      this.prisma.ingredient.findMany({
        where: {
          status: InventoryStatus.ACTIVE,
          stock: { gt: 0 },
        },
        select: { id: true, name: true, stock: true, minimum: true, unit: true },
      }),
      this.prisma.ingredient.findMany({
        where: {
          status: InventoryStatus.ACTIVE,
          stock: { lte: 0 },
        },
        select: { id: true, name: true, unit: true },
      }),
      this.prisma.stockMovement.findMany({
        include: { ingredient: true, user: true },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
    ]);

    const lowStockFiltered = lowStockList.filter((i) => i.stock.lessThanOrEqualTo(i.minimum));

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

  // Legacy chart generator helper for backwards compatibility
  async report(period: 'daily' | 'weekly' | 'monthly' = 'daily') {
    const range = this.range(period);
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: range.start, lt: range.end },
        paymentStatus: PaymentStatus.PAID,
        status: { not: OrderStatus.CANCELLED },
      },
      include: { items: true },
    });
    const previous = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: range.previousStart, lt: range.start },
        paymentStatus: PaymentStatus.PAID,
        status: { not: OrderStatus.CANCELLED },
      },
      select: { total: true },
    });

    const revenue = orders.reduce((sum, order) => sum + order.total.toNumber(), 0);
    const previousRevenue = previous.reduce((sum, order) => sum + order.total.toNumber(), 0);

    const sold = new Map<string, number>();
    for (const order of orders) {
      for (const item of order.items) {
        sold.set(item.name, (sold.get(item.name) ?? 0) + item.quantity);
      }
    }
    const popular = [...sold.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, quantity]) => ({ name, sold: quantity }));

    return {
      chartTitle: range.chartTitle,
      labels: range.labels,
      values: range.buckets.map((bucket) =>
        orders
          .filter((order) => order.createdAt >= bucket.start && order.createdAt < bucket.end)
          .reduce((sum, order) => sum + order.total.toNumber(), 0),
      ),
      orders: orders.length,
      revenueTrend: this.trend(revenue, previousRevenue),
      ordersTrend: this.trend(orders.length, previous.length),
      popular,
    };
  }

  private trend(current: number, previous: number) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  private range(period: 'daily' | 'weekly' | 'monthly') {
    const now = new Date();
    if (period === 'monthly') return this.monthWeeks(now);
    return this.weekDays(now);
  }

  private weekDays(now: Date) {
    const start = new Date(now);
    const day = start.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + mondayOffset);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const previousStart = new Date(start);
    previousStart.setDate(previousStart.getDate() - 7);
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return {
      chartTitle: 'Revenue by Day (ETB)',
      labels,
      start,
      end,
      previousStart,
      buckets: labels.map((_, index) => {
        const bucketStart = new Date(start);
        bucketStart.setDate(start.getDate() + index);
        const bucketEnd = new Date(bucketStart);
        bucketEnd.setDate(bucketEnd.getDate() + 1);
        return { start: bucketStart, end: bucketEnd };
      }),
    };
  }

  private monthWeeks(now: Date) {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const buckets: { start: Date; end: Date }[] = [];
    const cursor = new Date(start);
    let index = 1;
    const labels: string[] = [];
    while (cursor < end) {
      const bucketEnd = new Date(cursor);
      bucketEnd.setDate(bucketEnd.getDate() + 7);
      buckets.push({ start: new Date(cursor), end: bucketEnd > end ? end : bucketEnd });
      labels.push(`Week ${index++}`);
      cursor.setDate(cursor.getDate() + 7);
    }
    return {
      chartTitle: 'Revenue by Week (ETB)',
      labels,
      start,
      end,
      previousStart,
      buckets,
    };
  }
}
