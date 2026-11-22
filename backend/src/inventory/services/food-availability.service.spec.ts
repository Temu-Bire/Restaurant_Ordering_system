import { InventoryStatus, Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../prisma/prisma.service.js';
import { FoodAvailabilityService } from './food-availability.service.js';

describe('FoodAvailabilityService', () => {
  let service: FoodAvailabilityService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      recipeLine: {
        findMany: vi.fn(),
      },
      food: {
        findMany: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    service = new FoodAvailabilityService(prisma as unknown as PrismaService);
  });

  it('should disable a food item when any required ingredient has insufficient stock', async () => {
    prisma.recipeLine.findMany.mockResolvedValueOnce([{ foodId: 'food-1' }]);
    prisma.food.findMany.mockResolvedValueOnce([
      {
        id: 'food-1',
        isAvailable: true,
        recipes: [
          {
            quantity: new Prisma.Decimal(2),
            ingredient: {
              id: 'ing-1',
              stock: new Prisma.Decimal(1), // Insufficient: 1 < 2
              status: InventoryStatus.ACTIVE,
            },
          },
        ],
      },
    ]);

    await service.recalculateForIngredient('ing-1');

    expect(prisma.food.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['food-1'] } },
      data: { isAvailable: false },
    });
  });

  it('should re-enable a food item when all ingredients become sufficient and active', async () => {
    prisma.recipeLine.findMany.mockResolvedValueOnce([{ foodId: 'food-1' }]);
    prisma.food.findMany.mockResolvedValueOnce([
      {
        id: 'food-1',
        isAvailable: false,
        recipes: [
          {
            quantity: new Prisma.Decimal(2),
            ingredient: {
              id: 'ing-1',
              stock: new Prisma.Decimal(10), // Sufficient: 10 >= 2
              status: InventoryStatus.ACTIVE,
            },
          },
        ],
      },
    ]);

    await service.recalculateForIngredient('ing-1');

    expect(prisma.food.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['food-1'] } },
      data: { isAvailable: true },
    });
  });
});
