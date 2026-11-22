import { OrderType, PaymentStatus, Prisma, TableStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AdminDashboardService } from './admin-dashboard.service.js';
import { SalesReportService } from './sales-report.service.js';

describe('AdminDashboardService', () => {
  let service: AdminDashboardService;
  let prisma: any;
  let salesReport: { report: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    salesReport = {
      report: vi.fn().mockResolvedValue({
        chartTitle: 'Revenue by Day',
        labels: ['Mon'],
        values: [100],
        orders: 1,
        revenueTrend: 10,
        ordersTrend: 5,
        popular: [],
      }),
    };

    prisma = {
      order: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
      food: {
        count: vi.fn(),
      },
      ingredient: {
        findMany: vi.fn(),
      },
      restaurantTable: {
        findMany: vi.fn(),
      },
      stockMovement: {
        findMany: vi.fn(),
      },
    };

    service = new AdminDashboardService(
      prisma as unknown as PrismaService,
      salesReport as unknown as SalesReportService,
    );
  });

  it('should compile admin dashboard with today summary, inventory, tables, and delivery stats', async () => {
    // 1. todayOrders
    prisma.order.findMany.mockResolvedValueOnce([
      {
        type: OrderType.DINE_IN,
        paymentStatus: PaymentStatus.PAID,
        status: 'CONFIRMED',
        total: new Prisma.Decimal(120),
        items: [{ foodId: 'f-1', name: 'Steak', quantity: 1, unitPrice: new Prisma.Decimal(120) }],
      },
    ]);
    // 2. activeOrdersCount
    prisma.order.count.mockResolvedValueOnce(3);
    // 3. completedOrdersCount
    prisma.order.count.mockResolvedValueOnce(8);
    // 4. totalMenuItems
    prisma.food.count.mockResolvedValueOnce(20);
    // 5. availableFoodItems
    prisma.food.count.mockResolvedValueOnce(18);
    // 6. recentOrders
    prisma.order.findMany.mockResolvedValueOnce([]);
    // 7. ingredients
    prisma.ingredient.findMany.mockResolvedValueOnce([
      { id: 'i-1', name: 'Cheese', stock: new Prisma.Decimal(2), minimum: new Prisma.Decimal(5), unit: 'kg' },
      { id: 'i-2', name: 'Flour', stock: new Prisma.Decimal(0), minimum: new Prisma.Decimal(5), unit: 'kg' },
    ]);
    // 8. tables
    prisma.restaurantTable.findMany.mockResolvedValueOnce([
      { id: 't-1', name: 'T1', seats: 4, status: TableStatus.AVAILABLE },
      { id: 't-2', name: 'T2', seats: 2, status: TableStatus.OCCUPIED },
    ]);
    // 9. deliveries
    prisma.order.findMany.mockResolvedValueOnce([
      {
        id: 'del-1',
        status: 'DELIVERED',
        paymentStatus: PaymentStatus.PAID,
        deliveryFee: new Prisma.Decimal(25),
      },
    ]);
    // 10. recentMovements
    prisma.stockMovement.findMany.mockResolvedValueOnce([]);

    const result = await service.admin('weekly');

    expect(result.today.totalOrders).toBe(1);
    expect(result.today.paidRevenue).toBe(120);
    expect(result.today.activeOrders).toBe(3);
    expect(result.inventory.lowStockCount).toBe(1);
    expect(result.inventory.outOfStockCount).toBe(1);
    expect(result.tables.total).toBe(2);
    expect(result.tables.available).toBe(1);
    expect(result.tables.occupied).toBe(1);
    expect(result.delivery.deliveredToday).toBe(1);
    expect(result.delivery.feesCollectedToday).toBe(25);
    expect(result.topSelling[0]).toEqual({ name: 'Steak', quantity: 1, revenue: 120 });
  });
});
