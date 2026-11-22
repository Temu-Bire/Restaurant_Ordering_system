import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MovementType, Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../prisma/prisma.service.js';
import { FoodAvailabilityService } from './food-availability.service.js';
import { StockManagementService } from './stock-management.service.js';
import { StockMovementService } from './stock-movement.service.js';

describe('StockManagementService', () => {
  let service: StockManagementService;
  let prisma: any;
  let stockMovement: { record: ReturnType<typeof vi.fn> };
  let foodAvailability: {
    recalculateForIngredient: ReturnType<typeof vi.fn>;
    recalculateForIngredients: ReturnType<typeof vi.fn>;
  };

  const mockIngredient = {
    id: 'ing-1',
    name: 'Tomato',
    stock: new Prisma.Decimal(10),
    minimum: new Prisma.Decimal(5),
    unit: 'kg',
    unitCost: new Prisma.Decimal(2.5),
    category: 'INGREDIENTS',
    sku: 'ING-TOMATO',
    expiryDate: null,
    storageLocation: 'Fridge',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    stockMovement = {
      record: vi.fn().mockResolvedValue({ id: 'sm-1' }),
    };
    foodAvailability = {
      recalculateForIngredient: vi.fn().mockResolvedValue(undefined),
      recalculateForIngredients: vi.fn().mockResolvedValue(undefined),
    };

    const mockTx = {
      ingredient: {
        findUnique: vi.fn().mockResolvedValue(mockIngredient),
        update: vi.fn().mockImplementation(({ data }) => ({
          ...mockIngredient,
          stock: data.stock,
          unitCost: data.unitCost ?? mockIngredient.unitCost,
        })),
      },
    };

    prisma = {
      $transaction: vi.fn().mockImplementation(async (cb) => cb(mockTx)),
      mockTx,
    };

    service = new StockManagementService(
      prisma as unknown as PrismaService,
      stockMovement as unknown as StockMovementService,
      foodAvailability as unknown as FoodAvailabilityService,
    );
  });

  describe('receiveStock', () => {
    it('should increase stock, record movement, and recalculate food availability', async () => {
      const result = await service.receiveStock(
        'ing-1',
        { quantity: 5, notes: 'Supplier delivery' },
        'user-1',
      );

      expect(prisma.mockTx.ingredient.findUnique).toHaveBeenCalledWith({ where: { id: 'ing-1' } });
      expect(prisma.mockTx.ingredient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ing-1' },
          data: expect.objectContaining({
            stock: new Prisma.Decimal(15),
          }),
        }),
      );
      expect(stockMovement.record).toHaveBeenCalledWith(
        prisma.mockTx,
        expect.objectContaining({
          ingredientId: 'ing-1',
          type: MovementType.RECEIVE,
          quantityChanged: new Prisma.Decimal(5),
          previousQuantity: new Prisma.Decimal(10),
          newQuantity: new Prisma.Decimal(15),
          userId: 'user-1',
        }),
      );
      expect(foodAvailability.recalculateForIngredient).toHaveBeenCalledWith('ing-1', prisma.mockTx);
      expect(result.stock).toBe(15);
      expect(result.stockStatus).toBe('in_stock');
    });

    it('should throw NotFoundException if ingredient does not exist', async () => {
      prisma.mockTx.ingredient.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.receiveStock('unknown', { quantity: 5 }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('recordWaste', () => {
    it('should decrease stock and record waste movement', async () => {
      const result = await service.recordWaste(
        'ing-1',
        { quantity: 3, reason: 'Expired' },
        'user-1',
      );

      expect(prisma.mockTx.ingredient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ing-1' },
          data: { stock: new Prisma.Decimal(7) },
        }),
      );
      expect(stockMovement.record).toHaveBeenCalledWith(
        prisma.mockTx,
        expect.objectContaining({
          type: MovementType.WASTE,
          quantityChanged: new Prisma.Decimal(-3),
          previousQuantity: new Prisma.Decimal(10),
          newQuantity: new Prisma.Decimal(7),
        }),
      );
      expect(foodAvailability.recalculateForIngredient).toHaveBeenCalledWith('ing-1', prisma.mockTx);
      expect(result.stock).toBe(7);
    });

    it('should throw BadRequestException if waste quantity exceeds available stock', async () => {
      await expect(
        service.recordWaste('ing-1', { quantity: 15, reason: 'Spoiled' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('stockCount', () => {
    it('should update stock to counted value and record variance', async () => {
      const result = await service.stockCount(
        'ing-1',
        { countedStock: 12, notes: 'Weekly audit' },
        'user-1',
      );

      expect(prisma.mockTx.ingredient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ing-1' },
          data: { stock: new Prisma.Decimal(12) },
        }),
      );
      expect(stockMovement.record).toHaveBeenCalledWith(
        prisma.mockTx,
        expect.objectContaining({
          type: MovementType.COUNT,
          quantityChanged: new Prisma.Decimal(2),
          newQuantity: new Prisma.Decimal(12),
        }),
      );
      expect(result.stock).toBe(12);
    });
  });

  describe('manualAdjustment', () => {
    it('should update stock to target value and record adjustment', async () => {
      const result = await service.manualAdjustment(
        'ing-1',
        { newStock: 8, reason: 'Correcting typo' },
        'user-1',
      );

      expect(prisma.mockTx.ingredient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { stock: new Prisma.Decimal(8) },
        }),
      );
      expect(stockMovement.record).toHaveBeenCalledWith(
        prisma.mockTx,
        expect.objectContaining({
          type: MovementType.ADJUSTMENT,
          quantityChanged: new Prisma.Decimal(-2),
          newQuantity: new Prisma.Decimal(8),
        }),
      );
      expect(result.stock).toBe(8);
    });
  });

  describe('adjustOrderStock', () => {
    it('should deduct stock and record order consumption', async () => {
      const tx = prisma.mockTx;
      const lines = [
        {
          food: {
            name: 'Pizza',
            recipes: [{ ingredientId: 'ing-1', quantity: new Prisma.Decimal(2) }],
          },
          quantity: 3, // requires 2 * 3 = 6
        },
      ];

      await service.adjustOrderStock(tx, lines, 'deduct');

      expect(tx.ingredient.update).toHaveBeenCalledWith({
        where: { id: 'ing-1' },
        data: { stock: new Prisma.Decimal(4) }, // 10 - 6 = 4
      });
      expect(stockMovement.record).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({
          ingredientId: 'ing-1',
          type: MovementType.ORDER_CONSUMPTION,
          quantityChanged: new Prisma.Decimal(-6),
        }),
      );
      expect(foodAvailability.recalculateForIngredients).toHaveBeenCalledWith(['ing-1'], tx);
    });

    it('should throw BadRequestException if stock is insufficient for order deduction', async () => {
      const tx = prisma.mockTx;
      const lines = [
        {
          food: {
            name: 'Pizza',
            recipes: [{ ingredientId: 'ing-1', quantity: new Prisma.Decimal(5) }],
          },
          quantity: 3, // requires 5 * 3 = 15 > 10
        },
      ];

      await expect(service.adjustOrderStock(tx, lines, 'deduct')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should restore stock on cancellation', async () => {
      const tx = prisma.mockTx;
      const lines = [
        {
          food: {
            name: 'Pizza',
            recipes: [{ ingredientId: 'ing-1', quantity: new Prisma.Decimal(2) }],
          },
          quantity: 2, // 4 units
        },
      ];

      await service.adjustOrderStock(tx, lines, 'restore');

      expect(tx.ingredient.update).toHaveBeenCalledWith({
        where: { id: 'ing-1' },
        data: { stock: new Prisma.Decimal(14) }, // 10 + 4 = 14
      });
      expect(stockMovement.record).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({
          ingredientId: 'ing-1',
          type: MovementType.ADJUSTMENT,
          quantityChanged: new Prisma.Decimal(4),
          reason: 'Order cancellation: stock restored',
        }),
      );
      expect(foodAvailability.recalculateForIngredients).toHaveBeenCalledWith(['ing-1'], tx);
    });
  });
});
