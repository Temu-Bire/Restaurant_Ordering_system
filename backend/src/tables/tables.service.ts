import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RestaurantTable, TableStatus } from '@prisma/client';
import { parseTableStatus, toApiTableStatus } from '../common/api-enums.js';
import { isPrismaError } from '../common/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ChangeTableStatusDto, SaveTableDto } from './dto/save-table.dto.js';

export const toTableResponse = (table: RestaurantTable) => ({
  id: table.id,
  name: table.name,
  seats: table.seats,
  status: toApiTableStatus(table.status),
  section: table.section ?? undefined,
  activeOrderId: table.activeOrderId ?? undefined,
});

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    // Release any holds that have expired past their heldUntil time
    const now = new Date();
    await this.prisma.restaurantTable.updateMany({
      where: {
        status: TableStatus.RESERVED,
        heldUntil: { lt: now },
        activeOrderId: null,
      },
      data: {
        status: TableStatus.AVAILABLE,
        heldUntil: null,
      },
    });

    const tables = await this.prisma.restaurantTable.findMany({
      orderBy: [{ section: 'asc' }, { name: 'asc' }],
    });
    return tables.map(toTableResponse);
  }

  async findAvailableForParty(partySize: number) {
    const now = new Date();
    const candidateTables = await this.prisma.restaurantTable.findMany({
      where: {
        seats: { gte: partySize },
        OR: [
          { status: TableStatus.AVAILABLE },
          { status: TableStatus.FREE },
          {
            status: TableStatus.RESERVED,
            heldUntil: { lt: now },
            activeOrderId: null,
          },
        ],
      },
      orderBy: { seats: 'asc' },
    });

    if (candidateTables.length === 0) {
      throw new BadRequestException(
        `No available table can accommodate a party of ${partySize}. Please wait or try a smaller party size.`,
      );
    }

    // Prefer exact capacity match first, otherwise smallest suitable
    const exact = candidateTables.find((t) => t.seats === partySize);
    return exact ?? candidateTables[0];
  }

  async create(dto: SaveTableDto) {
    try {
      const initialStatus = dto.status
        ? (parseTableStatus(dto.status) as TableStatus)
        : TableStatus.AVAILABLE;

      const table = await this.prisma.restaurantTable.create({
        data: {
          name: dto.name.trim(),
          seats: dto.seats,
          section: dto.section?.trim() || null,
          status: initialStatus,
        },
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
      const status = dto.status ? (parseTableStatus(dto.status) as TableStatus) : undefined;
      const table = await this.prisma.restaurantTable.update({
        where: { id },
        data: {
          name: dto.name.trim(),
          seats: dto.seats,
          ...(dto.section !== undefined && { section: dto.section?.trim() || null }),
          ...(status && { status }),
        },
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

  async updateStatus(id: string, dto: ChangeTableStatusDto) {
    const targetStatus = parseTableStatus(dto.status) as TableStatus;
    const table = await this.prisma.restaurantTable.findUnique({ where: { id } });
    if (!table) throw new NotFoundException('Table not found');

    const updated = await this.prisma.restaurantTable.update({
      where: { id },
      data: {
        status: targetStatus,
        ...(targetStatus === TableStatus.AVAILABLE && {
          activeOrderId: null,
          heldUntil: null,
        }),
      },
    });

    return toTableResponse(updated);
  }

  async remove(id: string) {
    try {
      const table = await this.prisma.restaurantTable.findUnique({ where: { id } });
      if (!table) throw new NotFoundException('Table not found');
      if (table.status === TableStatus.OCCUPIED) {
        throw new BadRequestException('Cannot delete an occupied table.');
      }
      await this.prisma.restaurantTable.delete({ where: { id } });
    } catch (error) {
      if (isPrismaError(error, 'P2025')) throw new NotFoundException('Table not found');
      throw error;
    }
  }
}
