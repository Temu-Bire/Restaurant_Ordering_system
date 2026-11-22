import { BadRequestException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      notification: {
        deleteMany: vi.fn(),
      },
      address: {
        deleteMany: vi.fn(),
      },
      order: {
        findMany: vi.fn().mockResolvedValue([]),
        updateMany: vi.fn(),
        deleteMany: vi.fn(),
      },
      orderItem: {
        deleteMany: vi.fn(),
      },
      payment: {
        updateMany: vi.fn(),
        deleteMany: vi.fn(),
      },
      stockMovement: {
        updateMany: vi.fn(),
      },
      $transaction: vi.fn(async (cb) => cb(prisma)),
    };

    service = new UsersService(prisma as unknown as PrismaService);
  });

  it('should prevent admin from deleting their own account', async () => {
    await expect(service.remove('admin-1', 'admin-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should prevent deleting another administrator account', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'admin-2',
      role: Role.ADMIN,
    });

    await expect(service.remove('admin-2', 'admin-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should successfully delete customer and cascade related entities', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'cust-1',
      role: Role.CUSTOMER,
      avatarUrl: null,
    });

    prisma.order.findMany.mockResolvedValue([{ id: 'ord-101' }]);

    await service.remove('cust-1', 'admin-1');

    expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
      where: { recipientUserId: 'cust-1' },
    });
    expect(prisma.address.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'cust-1' },
    });
    expect(prisma.orderItem.deleteMany).toHaveBeenCalledWith({
      where: { orderId: { in: ['ord-101'] } },
    });
    expect(prisma.payment.deleteMany).toHaveBeenCalledWith({
      where: { orderId: { in: ['ord-101'] } },
    });
    expect(prisma.order.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['ord-101'] } },
    });
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: 'cust-1' },
    });
  });
});
