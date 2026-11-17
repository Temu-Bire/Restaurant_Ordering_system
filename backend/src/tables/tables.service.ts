import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RestaurantTable } from '@prisma/client';
import { toApiTableStatus } from '../common/api-enums.js';
import { isPrismaError } from '../common/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SaveTableDto } from './dto/save-table.dto.js';

export const toTableResponse = (table: RestaurantTable) => ({
  id: table.id,
  name: table.name,
  seats: table.seats,
  status: toApiTableStatus(table.status),
});

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const tables = await this.prisma.restaurantTable.findMany({
      orderBy: { name: 'asc' },
    });
    return tables.map(toTableResponse);
  }

  async create(dto: SaveTableDto) {
    try {
      const table = await this.prisma.restaurantTable.create({
        data: { name: dto.name.trim(), seats: dto.seats },
      });
      return toTableResponse(table);
    } catch (error) {
      if (isPrismaError(error, 'P2002')) {
        throw new ConflictException('A table with that name already exists');
      }
      throw error;
    }
  }

  async update(id: string, dto: SaveTableDto) {
    try {
      const table = await this.prisma.restaurantTable.update({
        where: { id },
        data: { name: dto.name.trim(), seats: dto.seats },
      });
      return toTableResponse(table);
    } catch (error) {
      if (isPrismaError(error, 'P2025')) throw new NotFoundException('Table not found');
      if (isPrismaError(error, 'P2002')) {
        throw new ConflictException('A table with that name already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.restaurantTable.delete({ where: { id } });
    } catch (error) {
      if (isPrismaError(error, 'P2025')) throw new NotFoundException('Table not found');
      throw error;
    }
  }
}
