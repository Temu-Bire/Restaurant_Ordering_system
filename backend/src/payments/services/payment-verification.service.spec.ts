import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus, OrderType, PaymentStatus, TableStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StockManagementService } from '../../inventory/services/stock-management.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PaymentVerificationOutcome } from '../dto/verify-payment.dto.js';
import { PaymentVerificationService } from './payment-verification.service.js';
import { ReceiptService } from './receipt.service.js';

describe('PaymentVerificationService', () => {
  let service: PaymentVerificationService;
  let prisma: any;
  let stockManagement: { adjustOrderStock: ReturnType<typeof vi.fn> };
  let receiptService: { nextReceipt: ReturnType<typeof vi.fn> };

  const mockPayment = {
    id: 'pay-uuid-1',
    receipt: null,
    orderId: 'ord-uuid-1',
    amount: { toNumber: () => 150 },
    method: 'MOBILE',
    status: PaymentStatus.PENDING,
    paid: false,
    provider: 'Telebirr',
    transactionId: 'TXN-123',
    verifiedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    order: {
      id: 'ord-uuid-1',
      number: 301,
      type: OrderType.DINE_IN,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      stockAdjusted: false,
      tableId: 'table-1',
      items: [
        {
          id: 'item-1',
          name: 'Pasta',
          quantity: 2,
          unitPrice: { toNumber: () => 75 },
          food: { id: 'food-1', name: 'Pasta', recipes: [] },
        },
      ],
      table: { id: 'table-1', name: 'T1' },
    },
  };

  beforeEach(() => {
    stockManagement = { adjustOrderStock: vi.fn().mockResolvedValue(undefined) };
    receiptService = { nextReceipt: vi.fn().mockResolvedValue('R-1005') };

    const mockTx = {
      payment: {
        findFirst: vi.fn().mockResolvedValue(mockPayment),
        update: vi.fn().mockImplementation(({ data }) => ({
          ...mockPayment,
          ...data,
          order: { number: 301 },
        })),
      },
      order: {
        update: vi.fn().mockResolvedValue({ id: 'ord-uuid-1' }),
      },
      restaurantTable: {
        update: vi.fn().mockResolvedValue({ id: 'table-1' }),
      },
    };

    prisma = {
      $transaction: vi.fn().mockImplementation(async (cb) => cb(mockTx)),
      mockTx,
    };

    service = new PaymentVerificationService(
      prisma as unknown as PrismaService,
      stockManagement as unknown as StockManagementService,
      receiptService as unknown as ReceiptService,
    );
  });

  it('should verify payment successfully: allocate receipt, deduct stock, confirm table', async () => {
    const result = await service.verify('pay-uuid-1', {
      outcome: PaymentVerificationOutcome.SUCCESS,
      transactionRef: 'REF-999',
    });

    expect(receiptService.nextReceipt).toHaveBeenCalledWith(prisma.mockTx);
    expect(stockManagement.adjustOrderStock).toHaveBeenCalledWith(
      prisma.mockTx,
      expect.any(Array),
      'deduct',
    );
    expect(prisma.mockTx.restaurantTable.update).toHaveBeenCalledWith({
      where: { id: 'table-1' },
      data: {
        status: TableStatus.OCCUPIED,
        activeOrderId: 'ord-uuid-1',
        heldUntil: null,
      },
    });
    expect(prisma.mockTx.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pay-uuid-1' },
        data: expect.objectContaining({
          status: PaymentStatus.PAID,
          paid: true,
          receipt: 'R-1005',
          transactionId: 'REF-999',
        }),
      }),
    );
    expect(prisma.mockTx.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ord-uuid-1' },
        data: expect.objectContaining({
          status: OrderStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PAID,
          stockAdjusted: true,
        }),
      }),
    );
    expect(result.success).toBe(true);
    expect(result.orderStatus).toBe('confirmed');
    expect(result.paymentStatus).toBe('paid');
  });

  it('should be idempotent on repeated SUCCESS verification for already PAID payment', async () => {
    prisma.mockTx.payment.findFirst.mockResolvedValueOnce({
      ...mockPayment,
      status: PaymentStatus.PAID,
      paid: true,
      receipt: 'R-1005',
      order: {
        ...mockPayment.order,
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        stockAdjusted: true,
      },
    });

    const result = await service.verify('pay-uuid-1', {
      outcome: PaymentVerificationOutcome.SUCCESS,
    });

    expect(receiptService.nextReceipt).not.toHaveBeenCalled();
    expect(stockManagement.adjustOrderStock).not.toHaveBeenCalled();
    expect(prisma.mockTx.payment.update).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.payment.receipt).toBe('R-1005');
  });

  it('should reject conflicting FAILED callback on already PAID payment', async () => {
    prisma.mockTx.payment.findFirst.mockResolvedValueOnce({
      ...mockPayment,
      status: PaymentStatus.PAID,
      paid: true,
    });

    await expect(
      service.verify('pay-uuid-1', {
        outcome: PaymentVerificationOutcome.FAILED,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should handle payment failure: cancel order and release table hold', async () => {
    const result = await service.verify('pay-uuid-1', {
      outcome: PaymentVerificationOutcome.FAILED,
    });

    expect(prisma.mockTx.restaurantTable.update).toHaveBeenCalledWith({
      where: { id: 'table-1' },
      data: {
        status: TableStatus.AVAILABLE,
        heldUntil: null,
        activeOrderId: null,
      },
    });
    expect(prisma.mockTx.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.FAILED,
        }),
      }),
    );
    expect(result.success).toBe(false);
    expect(result.orderStatus).toBe('cancelled');
    expect(result.paymentStatus).toBe('failed');
  });

  it('should throw NotFoundException if payment is not found', async () => {
    prisma.mockTx.payment.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.verify('non-existent', { outcome: PaymentVerificationOutcome.SUCCESS }),
    ).rejects.toThrow(NotFoundException);
  });
});
