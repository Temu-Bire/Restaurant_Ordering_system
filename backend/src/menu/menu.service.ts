import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { isPrismaError } from '../common/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateFoodDto } from './dto/create-food.dto.js';
import { UpdateFoodDto } from './dto/update-food.dto.js';
import { FoodWithCategory, toFoodResponse } from './food-response.js';

@Injectable()
export class MenuService {
  private readonly appUrl: string;
  private cachedFoods: ReturnType<typeof toFoodResponse>[] | null = null;
  private cacheExpiresAt = 0;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.appUrl = config.getOrThrow<string>('APP_URL').replace(/\/$/, '');
  }

  private invalidateCache() {
    this.cachedFoods = null;
    this.cacheExpiresAt = 0;
  }

  private respond(
    food: FoodWithCategory,
    stats?: { rating: number; reviewCount: number },
  ) {
    return toFoodResponse(food, this.appUrl, stats);
  }

  async findAll() {
    const now = Date.now();
    if (this.cachedFoods && this.cacheExpiresAt > now) {
      return this.cachedFoods;
    }

    const [foods, statsRaw] = await Promise.all([
      this.prisma.food.findMany({
        include: { category: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.review.groupBy({
        by: ['foodId'],
        where: { isHidden: false },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    const statsMap = new Map(
      statsRaw.map((s) => [
        s.foodId,
        {
          rating: s._avg.rating ? Math.round(s._avg.rating * 10) / 10 : 0,
          reviewCount: s._count.rating ?? 0,
        },
      ]),
    );

    const result = foods.map((food) => this.respond(food, statsMap.get(food.id)));
    this.cachedFoods = result;
    this.cacheExpiresAt = now + 30_000; // 30-second cache
    return result;
  }

  async findOne(id: string) {
    const [food, stats] = await Promise.all([
      this.prisma.food.findUnique({
        where: { id },
        include: { category: true },
      }),
      this.prisma.review.aggregate({
        where: { foodId: id, isHidden: false },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);
    if (!food) throw new NotFoundException('Food item not found');
    return this.respond(food, {
      rating: stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : 0,
      reviewCount: stats._count.rating ?? 0,
    });
  }

  async create(dto: CreateFoodDto) {
    this.invalidateCache();
    try {
      const food = await this.prisma.food.create({
        data: {
          name: dto.name,
          description: dto.description,
          price: dto.price,
          categoryId: dto.categoryId,
          isAvailable: true,
        },
        include: { category: true },
      });
      return this.respond(food);
    } catch (error) {
      throw this.translate(error);
    }
  }

  async update(id: string, dto: UpdateFoodDto) {
    this.invalidateCache();
    try {
      const food = await this.prisma.food.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.price !== undefined && { price: dto.price }),
          ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        },
        include: { category: true },
      });
      return this.respond(food);
    } catch (error) {
      throw this.translate(error);
    }
  }

  async setAvailability(id: string, isAvailable: boolean) {
    this.invalidateCache();
    try {
      const food = await this.prisma.food.update({
        where: { id },
        data: { isAvailable },
        include: { category: true },
      });
      return this.respond(food);
    } catch (error) {
      if (isPrismaError(error, 'P2025')) {
        throw new NotFoundException('Food item not found');
      }
      throw this.translate(error);
    }
  }

  async remove(id: string) {
    this.invalidateCache();
    try {
      const food = await this.prisma.food.delete({ where: { id } });
      await this.deleteImageFile(food.imagePath);
    } catch (error) {
      if (isPrismaError(error, 'P2025')) {
        throw new NotFoundException('Food item not found');
      }
      // Becomes possible once orders reference dishes (next modules)
      if (isPrismaError(error, 'P2003')) {
        throw new ConflictException(
          'This dish is part of past orders. Mark it unavailable instead of deleting it.',
        );
      }
      throw error;
    }
  }

  async setImage(id: string, file: Express.Multer.File) {
    this.invalidateCache();
    const imagePath = `/uploads/menu/${file.filename}`;

    try {
      const existing = await this.prisma.food.findUnique({
        where: { id },
        select: { imagePath: true },
      });
      if (!existing) throw new NotFoundException('Food item not found');

      const food = await this.prisma.food.update({
        where: { id },
        data: { imagePath },
        include: { category: true },
      });

      await this.deleteImageFile(existing.imagePath); // replaced image
      return this.respond(food);
    } catch (error) {
      await this.deleteImageFile(imagePath); // don't leave an orphan file behind
      throw error;
    }
  }

  /* ---------- helpers ---------- */
  private translate(error: unknown): Error {
    if (isPrismaError(error, 'P2002')) {
      return new ConflictException('A dish with this name already exists');
    }
    if (isPrismaError(error, 'P2003')) {
      return new BadRequestException('Category not found');
    }
    if (isPrismaError(error, 'P2025')) {
      return new NotFoundException('Food item not found');
    }
    return error instanceof Error ? error : new InternalServerErrorException();
  }

  private async deleteImageFile(imagePath: string | null) {
    if (!imagePath) return;
    await unlink(join(process.cwd(), imagePath)).catch(() => undefined);
  }
}