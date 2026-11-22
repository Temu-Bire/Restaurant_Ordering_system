import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrderStatus, OrderType, Role } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StockManagementService } from '../../inventory/services/stock-management.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { OrderLifecycleService } from './order-lifecycle.service.js';
import { OrderQueryService } from './order-query.service.js';

describe('OrderLifecycleService', () => {
  let service: OrderLifecycleService;
  let prisma: any;
  let orderQuery: { findRecord: ReturnType<typeof vi.fn> };
  let stockManagement: { adjustOrderStock: ReturnType<typeof vi.fn> };

  const mockOrderRecord = {
    id: 'ord-uuid-1',
    number: 101,
    customerId: 'cust-1',
    type: OrderType.DINE_IN,
    status: OrderStatus.PENDING,
    paymentStatus: 'PENDING',
    stockAdjusted: true,
    tableId: 'table-1',
    subtotal: { toNumber: () => 100 },
    deliveryFee: { toNumber: () => 0 },
    tax: { toNumber: () => 15 },
    total: { toNumber: () => 115 },
    items: [
      {
        id: 'item-1',
        name: 'Burger',
        unitPrice: { toNumber: () => 50 },
        quantity: 2,
        food: { id: 'food-1', name: 'Burger', recipes: [] },
      },
    ],
    table: { name: 'Table 1', seats: 4 },
    payment: { id: 'pay-1', method: 'MOBILE', status: 'PENDING', paid: false },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    orderQuery = {
      findRecord: vi.fn().mockResolvedValue(mockOrderRecord),
    };
    stockManagement = {
      adjustOrderStock: vi.fn().mockResolvedValue(undefined),
    };

    const mockTx = {
      order: {
        findUnique: vi.fn().mockResolvedValue(mockOrderRecord),
        update: vi.fn().mockImplementation(({ data }) => ({
          ...mockOrderRecord,
          status: data.status,
          stockAdjusted: data.stockAdjusted ?? mockOrderRecord.stockAdjusted,
        })),
      },
      restaurantTable: {
        update: vi.fn().mockResolvedValue({ id: 'table-1', status: 'AVAILABLE' }),
      },
    };

    prisma = {
      $transaction: vi.fn().mockImplementation(async (cb) => cb(mockTx)),
      order: {
        update: vi.fn().mockResolvedValue(mockOrderRecord),
      },
      mockTx,
    };

    service = new OrderLifecycleService(
      prisma as unknown as PrismaService,
      orderQuery as unknown as OrderQueryService,
      stockManagement as unknown as StockManagementService,
    );
  });

  describe('updateStatus', () => {
    it('should reject status update if actor is not STAFF', async () => {
      await expect(
        service.updateStatus(
          'ord-uuid-1',
          { status: OrderStatus.CONFIRMED },
          { id: 'user-1', role: Role.CUSTOMER },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow valid transition from PENDING to CONFIRMED', async () => {
      const result = await service.updateStatus(
        'ord-uuid-1',
        { status: OrderStatus.CONFIRMED },
        { id: 'staff-1', role: Role.STAFF },
      );

      expect(prisma.mockTx.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord-uuid-1' },
          data: expect.objectContaining({ status: OrderStatus.CONFIRMED }),
        }),
      );
      expect(result.status).toBe('confirmed');
    });

    it('should reject invalid transition from PENDING to COMPLETED', async () => {
      await expect(
        service.updateStatus(
          'ord-uuid-1',
          { status: OrderStatus.COMPLETED },
          { id: 'staff-1', role: Role.STAFF },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('should allow customer to cancel order in PENDING status and restore stock', async () => {
      const result = await service.cancel('ord-uuid-1', 'cust-1');

      expect(stockManagement.adjustOrderStock).toHaveBeenCalledWith(
        prisma.mockTx,
        expect.any(Array),
        'restore',
      );
      expect(prisma.mockTx.restaurantTable.update).toHaveBeenCalledWith({
        where: { id: 'table-1' },
        data: {
          status: 'AVAILABLE',
          heldUntil: null,
          activeOrderId: null,
        },
      });
      expect(prisma.mockTx.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord-uuid-1' },
          data: { status: OrderStatus.CANCELLED, stockAdjusted: false },
        }),
      );
      expect(result.status).toBe('cancelled');
    });

    it('should not restore stock if stockAdjusted was false', async () => {
      prisma.mockTx.order.findUnique.mockResolvedValueOnce({
        ...mockOrderRecord,
        stockAdjusted: false,
      });

      await service.cancel('ord-uuid-1', 'cust-1');

      expect(stockManagement.adjustOrderStock).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if customer tries to cancel someone elses order', async () => {
      await expect(service.cancel('ord-uuid-1', 'other-customer')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if order is in non-cancellable state (e.g. SERVED)', async () => {
      orderQuery.findRecord.mockResolvedValueOnce({
        ...mockOrderRecord,
        status: OrderStatus.SERVED,
      });

      await expect(service.cancel('ord-uuid-1', 'cust-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('handover', () => {
    it('should update status to SERVED for DINE_IN order when READY', async () => {
      orderQuery.findRecord.mockResolvedValueOnce({
        ...mockOrderRecord,
        type: OrderType.DINE_IN,
        status: OrderStatus.READY,
      });

      prisma.order.update.mockResolvedValueOnce({
        ...mockOrderRecord,
        status: OrderStatus.SERVED,
        handoverStaffId: 'staff-1',
        handoverAt: new Date(),
      });

      const result = await service.handover(
        'ord-uuid-1',
        { id: 'staff-1', role: Role.STAFF },
        { notes: 'Served at Table 1' },
      );

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord-uuid-1' },
          data: expect.objectContaining({
            status: OrderStatus.SERVED,
            handoverStaffId: 'staff-1',
            handoverNotes: 'Served at Table 1',
          }),
        }),
      );
      expect(result.status).toBe('served');
    });
  });
});
