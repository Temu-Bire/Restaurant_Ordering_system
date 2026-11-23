import { Injectable } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { getPeriodRange } from '../helpers/date-range.helper.js';
import { calculateTrend } from '../helpers/report-calculation.helper.js';

export interface SalesReportResponse {
  chartTitle: string;
  labels: string[];
  values: number[];
  orders: number;
  revenueTrend: number;
  ordersTrend: number;
  popular: { name: string; sold: number }[];
}

@Injectable()
export class SalesReportService {
  constructor(private readonly prisma: PrismaService) {}

  async report(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<SalesReportResponse> {
    const range = getPeriodRange(period);

    const [orders, previousAggregate] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          createdAt: { gte: range.start, lt: range.end },
          paymentStatus: PaymentStatus.PAID,
          status: { not: OrderStatus.CANCELLED },
        },
        include: { items: true },
      }),
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: range.previousStart, lt: range.start },
          paymentStatus: PaymentStatus.PAID,
          status: { not: OrderStatus.CANCELLED },
        },
        _sum: { total: true },
        _count: true,
      }),
    ]);

    const revenue = orders.reduce((sum, order) => sum + order.total.toNumber(), 0);
    const previousRevenue = previousAggregate._sum.total?.toNumber() ?? 0;

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

    const values = range.buckets.map((bucket) =>
      orders
        .filter((order) => order.createdAt >= bucket.start && order.createdAt < bucket.end)
        .reduce((sum, order) => sum + order.total.toNumber(), 0),
    );

    return {
      chartTitle: range.chartTitle,
      labels: range.labels,
      values,
      orders: orders.length,
      revenueTrend: calculateTrend(revenue, previousRevenue),
      ordersTrend: calculateTrend(orders.length, previousAggregate._count),
      popular,
    };
  }
}
