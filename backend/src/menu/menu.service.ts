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

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.appUrl = config.getOrThrow<string>('APP_URL').replace(/\/$/, '');
  }

  private respond(food: FoodWithCategory) {
    return toFoodResponse(food, this.appUrl);
  }

  async findAll() {
    const foods = await this.prisma.food.findMany({
      include: { category: true },
      orderBy: { createdAt: 'asc' },
    });
    return foods.map((food) => this.respond(food));
  }

  async findOne(id: string) {
    const food = await this.prisma.food.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!food) throw new NotFoundException('Food item not found');
    return this.respond(food);
  }

  async create(dto: CreateFoodDto) {
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