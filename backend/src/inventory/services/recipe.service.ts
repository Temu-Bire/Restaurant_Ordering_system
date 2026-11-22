import { Injectable, NotFoundException } from '@nestjs/common';
import { RecipeLine } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SaveRecipeDto } from '../dto/save-recipe.dto.js';
import { FoodAvailabilityService } from './food-availability.service.js';

export interface GroupedRecipeResponse {
  [foodId: string]: { ingredientId: string; quantity: number }[];
}

@Injectable()
export class RecipeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly foodAvailability: FoodAvailabilityService,
  ) {}

  async findAll(): Promise<GroupedRecipeResponse> {
    const lines = await this.prisma.recipeLine.findMany({
      orderBy: { food: { name: 'asc' } },
    });
    return this.groupRecipes(lines);
  }

  async saveRecipe(foodId: string, dto: SaveRecipeDto) {
    const food = await this.prisma.food.findUnique({ where: { id: foodId } });
    if (!food) throw new NotFoundException('Food item not found');

    if (dto.lines.length > 0) {
      const found = await this.prisma.ingredient.count({
        where: { id: { in: dto.lines.map((line) => line.ingredientId) } },
      });
      if (found !== dto.lines.length) {
        throw new NotFoundException('One or more ingredients were not found');
      }
    }

    const lines = await this.prisma.$transaction(async (tx) => {
      await tx.recipeLine.deleteMany({ where: { foodId } });

      if (dto.lines.length > 0) {
        await tx.recipeLine.createMany({
          data: dto.lines.map((line) => ({
            foodId,
            ingredientId: line.ingredientId,
            quantity: line.quantity,
          })),
        });
      }

      const updatedLines = await tx.recipeLine.findMany({ where: { foodId } });

      // Recalculate availability for this food based on its new recipe lines
      await this.foodAvailability.recalculateForFoods([foodId], tx);

      return updatedLines;
    });

    return {
      foodId,
      lines: lines.map((line) => ({
        ingredientId: line.ingredientId,
        quantity: line.quantity.toNumber(),
      })),
    };
  }

  private groupRecipes(lines: RecipeLine[]): GroupedRecipeResponse {
    const grouped: GroupedRecipeResponse = {};
    for (const line of lines) {
      grouped[line.foodId] ??= [];
      grouped[line.foodId].push({
        ingredientId: line.ingredientId,
        quantity: line.quantity.toNumber(),
      });
    }
    return grouped;
  }
}
