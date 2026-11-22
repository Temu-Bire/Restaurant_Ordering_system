import { Injectable } from '@nestjs/common';
import { MovementType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  StockMovementResponse,
  toStockMovementResponse,
} from '../helpers/inventory-response.mapper.js';

export interface RecordMovementParams {
  ingredientId: string;
  type: MovementType;
  quantityChanged: Prisma.Decimal;
  previousQuantity: Prisma.Decimal;
  newQuantity: Prisma.Decimal;
  reason?: string | null;
  userId?: string | null;
}

@Injectable()
export class StockMovementService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    tx: Prisma.TransactionClient,
    params: RecordMovementParams,
  ) {
    return tx.stockMovement.create({
      data: {
        ingredientId: params.ingredientId,
        type: params.type,
        quantityChanged: params.quantityChanged,
        previousQuantity: params.previousQuantity,
        newQuantity: params.newQuantity,
        reason: params.reason ?? null,
        userId: params.userId ?? null,
      },
    });
  }

  async findMovements(query?: {
    ingredientId?: string;
    type?: MovementType;
    limit?: number;
  }): Promise<StockMovementResponse[]> {
    const where: Prisma.StockMovementWhereInput = {};
    if (query?.ingredientId) where.ingredientId = query.ingredientId;
    if (query?.type) where.type = query.type;

    const movements = await this.prisma.stockMovement.findMany({
      where,
      include: {
        ingredient: { select: { id: true, name: true, unit: true, sku: true } },
        user: { select: { id: true, fullName: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: query?.limit ?? 100,
    });

    return movements.map(toStockMovementResponse);
  }
}
