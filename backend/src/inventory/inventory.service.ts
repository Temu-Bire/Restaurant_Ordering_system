import { Injectable, NotFoundException } from '@nestjs/common';
import { Ingredient, RecipeLine } from '@prisma/client';
import { isPrismaError } from '../common/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SaveRecipeDto } from './dto/save-recipe.dto.js';
import { UpdateStockDto } from './dto/update-stock.dto.js';

const toIngredient = (ingredient: Ingredient) => ({
  id: ingredient.id,
  name: ingredient.name,
  stock: ingredient.stock.toNumber(),
  minimum: ingredient.minimum.toNumber(),
});

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const ingredients = await this.prisma.ingredient.findMany({
      orderBy: { name: 'asc' },
    });
    return ingredients.map(toIngredient);
  }

  async updateStock(id: string, dto: UpdateStockDto) {
    try {
      const ingredient = await this.prisma.ingredient.update({
        where: { id },
        data: { stock: dto.stock },
      });
      return toIngredient(ingredient);
    } catch (error) {
      if (isPrismaError(error, 'P2025')) {
        throw new NotFoundException('Ingredient not found');
      }
      throw error;
    }
  }

  async recipes() {
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

    await this.prisma.$transaction([
      this.prisma.recipeLine.deleteMany({ where: { foodId } }),
      ...(dto.lines.length
        ? [
            this.prisma.recipeLine.createMany({
              data: dto.lines.map((line) => ({
                foodId,
                ingredientId: line.ingredientId,
                quantity: line.quantity,
              })),
            }),
          ]
        : []),
    ]);

    const lines = await this.prisma.recipeLine.findMany({ where: { foodId } });
    return { foodId, lines: lines.map((line) => this.toLine(line)) };
  }

  private groupRecipes(lines: RecipeLine[]) {
    const grouped: Record<string, { ingredientId: string; quantity: number }[]> = {};
    for (const line of lines) {
      grouped[line.foodId] ??= [];
      grouped[line.foodId].push(this.toLine(line));
    }
    return grouped;
  }

  private toLine(line: RecipeLine) {
    return { ingredientId: line.ingredientId, quantity: line.quantity.toNumber() };
  }
}
