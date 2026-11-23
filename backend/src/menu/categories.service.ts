import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isPrismaError } from '../common/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

const select = { id: true, name: true };

@Injectable()
export class CategoriesService {
  private cachedCategories: { id: string; name: string }[] | null = null;
  private cacheExpiresAt = 0;

  constructor(private readonly prisma: PrismaService) {}

  private invalidateCache() {
    this.cachedCategories = null;
    this.cacheExpiresAt = 0;
  }

  async findAll() {
    const now = Date.now();
    if (this.cachedCategories && this.cacheExpiresAt > now) {
      return this.cachedCategories;
    }

    const categories = await this.prisma.category.findMany({
      select,
      orderBy: { createdAt: 'asc' },
    });
    this.cachedCategories = categories;
    this.cacheExpiresAt = now + 60_000; // 60s cache
    return categories;
  }

  async create(dto: CreateCategoryDto) {
    this.invalidateCache();
    // "pizza" and "Pizza" count as the same category
    const existing = await this.prisma.category.findFirst({
      where: { name: { equals: dto.name, mode: 'insensitive' } },
    });
    if (existing) throw new ConflictException('That category already exists');

    try {
      return await this.prisma.category.create({
        data: { name: dto.name },
        select,
      });
    } catch (error) {
      if (isPrismaError(error, 'P2002')) {
        throw new ConflictException('That category already exists');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateCategoryDto) {
    this.invalidateCache();
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found');

    if (dto.name && dto.name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await this.prisma.category.findFirst({
        where: {
          name: { equals: dto.name, mode: 'insensitive' },
          id: { not: id },
        },
      });
      if (duplicate) throw new ConflictException('That category already exists');
    }

    try {
      return await this.prisma.category.update({
        where: { id },
        data: { ...(dto.name && { name: dto.name }) },
        select,
      });
    } catch (error) {
      if (isPrismaError(error, 'P2002')) {
        throw new ConflictException('That category already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    this.invalidateCache();
    const existing = await this.prisma.category.findUnique({
      where: { id },
      include: { foods: { select: { id: true } } },
    });
    if (!existing) throw new NotFoundException('Category not found');

    if (existing.foods.length > 0) {
      throw new ConflictException(
        `Cannot delete category "${existing.name}" because it contains ${existing.foods.length} food item(s). Reassign or delete the items first.`,
      );
    }

    try {
      await this.prisma.category.delete({ where: { id } });
    } catch (error) {
      if (isPrismaError(error, 'P2025')) {
        throw new NotFoundException('Category not found');
      }
      throw error;
    }
  }
}
