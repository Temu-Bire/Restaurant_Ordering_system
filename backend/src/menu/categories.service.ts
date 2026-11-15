import { ConflictException, Injectable } from '@nestjs/common';
import { isPrismaError } from '../common/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';

const select = { id: true, name: true };

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      select,
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(dto: CreateCategoryDto) {
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
      // Two requests at the same moment: the database constraint still protects us
      if (isPrismaError(error, 'P2002')) {
        throw new ConflictException('That category already exists');
      }
      throw error;
    }
  }
}