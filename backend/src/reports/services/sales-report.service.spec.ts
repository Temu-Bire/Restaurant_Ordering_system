import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SalesReportService } from './sales-report.service.js';

describe('SalesReportService', () => {
  let service: SalesReportService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      order: {
        findMany: vi.fn(),
        aggregate: vi.fn(),
      },
    };
    service = new SalesReportService(prisma as unknown as PrismaService);
  });

  it('should calculate revenue, trend, and popular dishes', async () => {
    const mockCurrentOrders = [
      {
        total: new Prisma.Decimal(100),
        createdAt: new Date(),
        items: [{ name: 'Pizza', quantity: 2 }, { name: 'Burger', quantity: 1 }],
      },
      {
        total: new Prisma.Decimal(50),
        createdAt: new Date(),
        items: [{ name: 'Pizza', quantity: 1 }],
      },
    ];

    prisma.order.findMany.mockResolvedValueOnce(mockCurrentOrders);
    prisma.order.aggregate.mockResolvedValueOnce({
      _sum: { total: new Prisma.Decimal(100) },
      _count: 1,
    });

    const result = await service.report('daily');

    expect(result.orders).toBe(2);
    expect(result.revenueTrend).toBe(50); // (150 - 100) / 100 * 100 = 50%
    expect(result.ordersTrend).toBe(100); // (2 - 1) / 1 * 100 = 100%
    expect(result.popular[0]).toEqual({ name: 'Pizza', sold: 3 });
    expect(result.popular[1]).toEqual({ name: 'Burger', sold: 1 });
  });
});
