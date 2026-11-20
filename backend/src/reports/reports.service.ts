import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { orderInclude, toOrderResponse } from '../orders/order-response.js';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly';

const CLOSED: OrderStatus[] = [OrderStatus.CANCELLED];

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async report(period: ReportPeriod) {
    const range = this.range(period);
    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: range.start, lt: range.end } },
      include: { items: true },
    });
    const previous = await this.prisma.order.findMany({
      where: { createdAt: { gte: range.previousStart, lt: range.start } },
      select: { status: true, total: true },
    });

    const counted = orders.filter((order) => !CLOSED.includes(order.status));
    const previousCounted = previous.filter((order) => !CLOSED.includes(order.status));
    const revenue = counted.reduce((sum, order) => sum + order.total.toNumber(), 0);
    const previousRevenue = previousCounted.reduce(
      (sum, order) => sum + order.total.toNumber(),
      0,
    );
    const completed = counted.filter((order) => order.status === OrderStatus.COMPLETED).length;

    const sold = new Map<string, number>();
    for (const order of counted) {
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
        counted
          .filter((order) => order.createdAt >= bucket.start && order.createdAt < bucket.end)
          .reduce((sum, order) => sum + order.total.toNumber(), 0),
      ),
      orders: counted.length,
      completedPercent: counted.length ? Math.round((completed / counted.length) * 100) : 0,
      revenueTrend: this.trend(revenue, previousRevenue),
      ordersTrend: this.trend(counted.length, previousCounted.length),
      popular,
    };
  }

  async admin(period: ReportPeriod) {
    const [
      report,
      customers,
      pendingOrders,
      totalOrders,
      totalMenuItems,
      availableFoodItems,
      recentOrders,
      ingredients,
    ] = await Promise.all([
      this.report(period),
      this.prisma.user.count({ where: { role: Role.CUSTOMER } }),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.count(),
      this.prisma.food.count(),
      this.prisma.food.count({ where: { isAvailable: true } }),
      this.prisma.order.findMany({
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      this.prisma.ingredient.findMany({ orderBy: { name: 'asc' } }),
    ]);

    const unavailableFoodItems = totalMenuItems - availableFoodItems;

    const lowStock = ingredients
      .filter((item) => item.stock.lessThanOrEqualTo(item.minimum))
      .map((item) => ({
        id: item.id,
        name: item.name,
        stock: item.stock.toNumber(),
        minimum: item.minimum.toNumber(),
      }));

    return {
      report,
      customers,
      totalOrders,
      totalMenuItems,
      availableFoodItems,
      unavailableFoodItems,
      recentOrders: recentOrders.map(toOrderResponse),
      popularItems: report.popular.reduce((sum, item) => sum + item.sold, 0),
      pendingOrders,
      lowStock,
    };
  }

  async staff() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const [today, recent, tables] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['status'],
        where: { createdAt: { gte: start, lt: end } },
        _count: { _all: true },
      }),
      this.prisma.order.findMany({
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.restaurantTable.findMany({ orderBy: { name: 'asc' }, take: 6 }),
    ]);

    const count = (status: OrderStatus) =>
      today.find((row) => row.status === status)?._count._all ?? 0;

    const occupied = await this.prisma.restaurantTable.count({
      where: { status: 'OCCUPIED' },
    });

    return {
      pending: count(OrderStatus.PENDING),
      confirmed: count(OrderStatus.CONFIRMED),
      preparing: count(OrderStatus.PREPARING),
      ready: count(OrderStatus.READY),
      completed: count(OrderStatus.COMPLETED),
      occupiedTables: occupied,
      recentOrders: recent.map(toOrderResponse),
      tables: tables.map((table) => ({
        id: table.id,
        name: table.name,
        seats: table.seats,
        status: table.status.toLowerCase(),
      })),
    };
  }

  private trend(current: number, previous: number) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  private range(period: ReportPeriod) {
    const now = new Date();
    if (period === 'monthly') return this.monthlyRange(now);
    if (period === 'weekly') return this.monthWeeks(now);
    return this.weekDays(now);
  }

  private weekDays(now: Date) {
    const start = this.startOfDay(now);
    const day = start.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + mondayOffset);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const previousStart = new Date(start);
    previousStart.setDate(previousStart.getDate() - 7);
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return {
      chartTitle: 'Revenue by Day',
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
    while (cursor < end) {
      const bucketEnd = new Date(cursor);
      bucketEnd.setDate(bucketEnd.getDate() + 7);
      buckets.push({ start: new Date(cursor), end: bucketEnd < end ? bucketEnd : end });
      cursor.setDate(cursor.getDate() + 7);
    }
    return {
      chartTitle: 'Revenue by Week',
      labels: buckets.map((_, index) => `Wk ${index + 1}`),
      start,
      end,
      previousStart,
      buckets,
    };
  }

  private monthlyRange(now: Date) {
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const previousStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const buckets = Array.from({ length: 6 }, (_, index) => {
      const bucketStart = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      const bucketEnd = new Date(now.getFullYear(), now.getMonth() - 4 + index, 1);
      return { start: bucketStart, end: bucketEnd };
    });
    return {
      chartTitle: 'Revenue by Month',
      labels: buckets.map((bucket) =>
        bucket.start.toLocaleDateString('en-US', { month: 'short' }),
      ),
      start,
      end,
      previousStart,
      buckets,
    };
  }

  private startOfDay(date: Date) {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }
}

void Prisma.Decimal;
