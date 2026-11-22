import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PaymentInitiationService } from './payment-initiation.service.js';

describe('PaymentInitiationService', () => {
  let service: PaymentInitiationService;
  let prisma: any;

  const mockOrder = {
    id: 'ord-1',
    number: 401,
    total: new Prisma.Decimal(250),
    paymentStatus: PaymentStatus.PENDING,
    status: OrderStatus.PENDING,
    payment: null,
  };

  beforeEach(() => {
    prisma = {
      order: {
        findUnique: vi.fn().mockResolvedValue(mockOrder),
      },
      payment: {
        upsert: vi.fn().mockImplementation(({ create }) => ({
          id: 'pay-new',
          amount: create.amount,
          method: create.method,
          status: create.status,
          provider: create.provider,
          transactionId: create.transactionId,
          paid: false,
          receipt: null,
          verifiedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          order: { number: 401 },
        })),
      },
    };

    service = new PaymentInitiationService(prisma as unknown as PrismaService);
  });

  it('should initialize payment and return payment response', async () => {
    const result = await service.initiate('ORD-401', 'CBE Birr');

    expect(prisma.order.findUnique).toHaveBeenCalledWith({
      where: { number: 401 },
      include: { payment: true },
    });
    expect(prisma.payment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          orderId: 'ord-1',
          method: PaymentMethod.MOBILE,
          status: PaymentStatus.PENDING,
          provider: 'CBE Birr',
        }),
      }),
    );
    expect(result.amount).toBe(250);
    expect(result.orderId).toBe('ORD-401');
    expect(result.provider).toBe('CBE Birr');
  });

  it('should reject initiation if order is already paid', async () => {
    prisma.order.findUnique.mockResolvedValueOnce({
      ...mockOrder,
      paymentStatus: PaymentStatus.PAID,
    });

    await expect(service.initiate('ord-1')).rejects.toThrow(BadRequestException);
  });

  it('should reject initiation if order is cancelled', async () => {
    prisma.order.findUnique.mockResolvedValueOnce({
      ...mockOrder,
      status: OrderStatus.CANCELLED,
    });

    await expect(service.initiate('ord-1')).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException if order does not exist', async () => {
    prisma.order.findUnique.mockResolvedValueOnce(null);

    await expect(service.initiate('unknown')).rejects.toThrow(NotFoundException);
  });
});
