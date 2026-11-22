import { Injectable } from '@nestjs/common';
import { InventoryStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class FoodAvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recalculates food availability for all dishes affected by a single ingredient stock/status change.
   */
  async recalculateForIngredient(
    ingredientId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    await this.recalculateForIngredients([ingredientId], tx);
  }

  /**
   * Recalculates food availability for all dishes affected by a list of ingredients.
   * Can be executed within a transactional boundary or standalone.
   */
  async recalculateForIngredients(
    ingredientIds: string[],
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    if (!ingredientIds.length) return;

    const db = tx ?? this.prisma;

    // Find all distinct foodIds that include any of these ingredients
    const affectedLines = await db.recipeLine.findMany({
      where: { ingredientId: { in: ingredientIds } },
      select: { foodId: true },
      distinct: ['foodId'],
    });

    if (!affectedLines.length) return;

    const foodIds = affectedLines.map((l) => l.foodId);
    await this.recalculateForFoods(foodIds, db);
  }

  /**
   * Recalculates availability for specific foods by checking all their recipe ingredients against current stock.
   */
  async recalculateForFoods(
    foodIds: string[],
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    if (!foodIds.length) return;

    const db = tx ?? this.prisma;

    // Retrieve all foods and their complete recipes with current ingredient stock
    const foods = await db.food.findMany({
      where: { id: { in: foodIds } },
      include: {
        recipes: {
          include: {
            ingredient: {
              select: {
                id: true,
                stock: true,
                status: true,
              },
            },
          },
        },
      },
    });

    const toEnable: string[] = [];
    const toDisable: string[] = [];

    for (const food of foods) {
      if (food.recipes.length === 0) {
        continue;
      }

      // Check if every recipe line has sufficient stock and is active
      const allSufficient = food.recipes.every((line) => {
        const ing = line.ingredient;
        if (!ing || ing.status !== InventoryStatus.ACTIVE) {
          return false;
        }
        return ing.stock.greaterThanOrEqualTo(line.quantity);
      });

      if (allSufficient && !food.isAvailable) {
        toEnable.push(food.id);
      } else if (!allSufficient && food.isAvailable) {
        toDisable.push(food.id);
      }
    }

    if (toEnable.length > 0) {
      await db.food.updateMany({
        where: { id: { in: toEnable } },
        data: { isAvailable: true },
      });
    }

    if (toDisable.length > 0) {
      await db.food.updateMany({
        where: { id: { in: toDisable } },
        data: { isAvailable: false },
      });
    }
  }
}
