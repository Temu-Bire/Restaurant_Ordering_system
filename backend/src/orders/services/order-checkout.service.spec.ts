import { BadRequestException, ConflictException } from '@nestjs/common';
import { OrderStatus, OrderType, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeliveryService } from '../../delivery/delivery.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SettingsService } from '../../settings/settings.service.js';
import { TablesService } from '../../tables/tables.service.js';
import { OrderCheckoutService } from './order-checkout.service.js';

describe('OrderCheckoutService', () => {
  let service: OrderCheckoutService;
  let prisma: any;
  let settings: { get: ReturnType<typeof vi.fn> };
  let delivery: { calculateQuote: ReturnType<typeof vi.fn> };
  let tables: { findAvailableForParty: ReturnType<typeof vi.fn> };

  const mockSettings = {
    orderTypes: ['dine-in', 'takeaway', 'delivery'],
    taxRate: 15,
  };

  const mockFood = {
    id: 'food-1',
    name: 'Burger',
    price: new Prisma.Decimal(50),
    isAvailable: true,
    recipes: [],
  };

  beforeEach(() => {
    settings = { get: vi.fn().mockResolvedValue(mockSettings) };
    delivery = { calculateQuote: vi.fn() };
    tables = { findAvailableForParty: vi.fn().mockResolvedValue({ id: 'table-1', name: 'T1', seats: 2 }) };

    const mockTx = {
      food: {
        findMany: vi.fn().mockResolvedValue([mockFood]),
      },
      restaurantTable: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      address: {
        findFirst: vi.fn(),
      },
      order: {
        create: vi.fn().mockImplementation(({ data }) => ({
          id: 'ord-1',
          number: 201,
          customerId: data.customerId,
          type: data.type,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          subtotal: data.subtotal,
          deliveryFee: data.deliveryFee,
          tax: data.tax,
          total: data.total,
          tableLabel: data.tableLabel,
          items: [
            {
              id: 'oi-1',
              name: 'Burger',
              unitPrice: new Prisma.Decimal(50),
              quantity: 2,
            },
          ],
          payment: {
            id: 'pay-1',
            method: 'MOBILE',
            status: 'PENDING',
            paid: false,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      },
    };

    prisma = {
      $transaction: vi.fn().mockImplementation(async (cb) => cb(mockTx)),
      mockTx,
    };

    service = new OrderCheckoutService(
      prisma as unknown as PrismaService,
      settings as unknown as SettingsService,
      delivery as unknown as DeliveryService,
      tables as unknown as TablesService,
    );
  });

  describe('create - Dine In', () => {
    it('should create a dine-in order and atomically reserve a table', async () => {
      const result = await service.create('cust-1', {
        type: OrderType.DINE_IN,
        partySize: 2,
        paymentMethod: PaymentMethod.MOBILE,
        paymentProvider: 'Telebirr',
        items: [{ foodId: 'food-1', quantity: 2 }],
      });

      expect(tables.findAvailableForParty).toHaveBeenCalledWith(2);
      expect(prisma.mockTx.restaurantTable.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'table-1' }),
          data: expect.objectContaining({ status: 'RESERVED' }),
        }),
      );
      expect(result.subtotal).toBe(100);
      expect(result.tax).toBe(15);
      expect(result.total).toBe(115);
    });

    it('should throw ConflictException if table reservation fails due to concurrency', async () => {
      prisma.mockTx.restaurantTable.updateMany.mockResolvedValueOnce({ count: 0 });

      await expect(
        service.create('cust-1', {
          type: OrderType.DINE_IN,
          partySize: 2,
          paymentMethod: PaymentMethod.MOBILE,
          items: [{ foodId: 'food-1', quantity: 1 }],
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('create - Delivery', () => {
    it('should check address by userId and apply delivery quote', async () => {
      prisma.mockTx.address.findFirst.mockResolvedValueOnce({
        id: 'addr-1',
        userId: 'cust-1',
        recipientName: 'Alice',
        phone: '12345678',
        street: 'Main St',
        area: 'Downtown',
        city: 'Cityville',
        latitude: { toNumber: () => 9.0 },
        longitude: { toNumber: () => 38.7 },
      });

      delivery.calculateQuote.mockResolvedValueOnce({
        eligible: true,
        distanceKm: 3.5,
        fee: 30,
      });

      const result = await service.create('cust-1', {
        type: OrderType.DELIVERY,
        addressId: 'addr-1',
        paymentMethod: PaymentMethod.MOBILE,
        items: [{ foodId: 'food-1', quantity: 2 }],
      });

      expect(prisma.mockTx.address.findFirst).toHaveBeenCalledWith({
        where: { id: 'addr-1', userId: 'cust-1' },
      });
      expect(result.deliveryFee).toBe(30);
    });
  });

  describe('create - Validations', () => {
    it('should throw BadRequestException if food item is unavailable', async () => {
      prisma.mockTx.food.findMany.mockResolvedValueOnce([
        { ...mockFood, isAvailable: false },
      ]);

      await expect(
        service.create('cust-1', {
          type: OrderType.TAKEAWAY,
          paymentMethod: PaymentMethod.MOBILE,
          items: [{ foodId: 'food-1', quantity: 1 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if payment method is not MOBILE', async () => {
      await expect(
        service.create('cust-1', {
          type: OrderType.TAKEAWAY,
          paymentMethod: PaymentMethod.CASH,
          items: [{ foodId: 'food-1', quantity: 1 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
