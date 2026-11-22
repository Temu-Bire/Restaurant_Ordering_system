import { Injectable } from '@nestjs/common';
import {
  MovementType,
  OrderStatus,
  OrderType,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ReportFilterDto } from '../dto/report-filter.dto.js';
import { getDateRange } from '../helpers/date-range.helper.js';
import {
  COMPLETED_STATUS_GROUP,
  PENDING_STATUS_GROUP,
  roundTwoDecimals,
} from '../helpers/report-calculation.helper.js';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalytics(filters: ReportFilterDto) {
    const { start, end } = getDateRange(filters);

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
    const averageOrderValue = ordersCount > 0 ? roundTwoDecimals(paidRevenue / ordersCount) : 0;

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
      revenue: roundTwoDecimals(stats.revenue),
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
      revenue: roundTwoDecimals(stats.revenue),
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
        totalValue: roundTwoDecimals(val),
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
        totalSales: roundTwoDecimals(totalSales),
        paidRevenue: roundTwoDecimals(paidRevenue),
        foodSales: roundTwoDecimals(foodSales),
        deliveryFeesCollected: roundTwoDecimals(deliveryFeesCollected),
        taxCollected: roundTwoDecimals(taxCollected),
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
        totalInventoryValue: roundTwoDecimals(totalInventoryValue),
        lowStockCount,
        outOfStockCount,
        stockReceivedQty: roundTwoDecimals(stockReceivedQty),
        stockReceivedValue: roundTwoDecimals(stockReceivedValue),
        ingredientConsumedQty: roundTwoDecimals(ingredientConsumedQty),
        wasteQty: roundTwoDecimals(wasteQty),
        wasteValue: roundTwoDecimals(wasteValue),
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
        deliveryFeesCollected: roundTwoDecimals(deliveryFeesTotal),
        byStatus: Object.entries(deliveryStatusCounts).map(([status, count]) => ({ status, count })),
        averageDistanceKm: countDist > 0 ? Math.round((totalDist / countDist) * 10) / 10 : 0,
      },
    };
  }
}
