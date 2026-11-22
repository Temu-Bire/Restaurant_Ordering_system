import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MovementType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  ManualAdjustmentDto,
  ReceiveStockDto,
  RecordWasteDto,
  StockCountDto,
} from '../dto/stock-action.dto.js';
import {
  InventoryItemResponse,
  toInventoryResponse,
} from '../helpers/inventory-response.mapper.js';
import { FoodAvailabilityService } from './food-availability.service.js';
import { StockMovementService } from './stock-movement.service.js';

export interface OrderStockAdjustmentLine {
  food: {
    name: string;
    recipes: {
      ingredientId: string;
      quantity: Prisma.Decimal;
    }[];
  };
  quantity: number;
}

@Injectable()
export class StockManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockMovement: StockMovementService,
    private readonly foodAvailability: FoodAvailabilityService,
  ) {}

  async receiveStock(
    id: string,
    dto: ReceiveStockDto,
    actorId: string,
  ): Promise<InventoryItemResponse> {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.ingredient.findUnique({ where: { id } });
      if (!item) throw new NotFoundException('Inventory item not found');

      const qty = new Prisma.Decimal(dto.quantity);
      const prevStock = item.stock;
      const newStock = prevStock.add(qty);

      const updated = await tx.ingredient.update({
        where: { id },
        data: {
          stock: newStock,
          ...(dto.costPerUnit !== undefined && {
            unitCost: new Prisma.Decimal(dto.costPerUnit),
          }),
        },
      });

      await this.stockMovement.record(tx, {
        ingredientId: id,
        type: MovementType.RECEIVE,
        quantityChanged: qty,
        previousQuantity: prevStock,
        newQuantity: newStock,
        reason: dto.notes?.trim() || 'Stock received',
        userId: actorId,
      });

      // Stock increase might restore availability for dishes that were previously unavailable
      await this.foodAvailability.recalculateForIngredient(id, tx);

      return toInventoryResponse(updated);
    });
  }

  async recordWaste(
    id: string,
    dto: RecordWasteDto,
    actorId: string,
  ): Promise<InventoryItemResponse> {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.ingredient.findUnique({ where: { id } });
      if (!item) throw new NotFoundException('Inventory item not found');

      const qty = new Prisma.Decimal(dto.quantity);
      if (item.stock.lessThan(qty)) {
        throw new BadRequestException(
          `Cannot record waste of ${qty} ${item.unit}. Current stock is only ${item.stock} ${item.unit}.`,
        );
      }

      const prevStock = item.stock;
      const newStock = prevStock.sub(qty);

      const updated = await tx.ingredient.update({
        where: { id },
        data: { stock: newStock },
      });

      await this.stockMovement.record(tx, {
        ingredientId: id,
        type: MovementType.WASTE,
        quantityChanged: qty.negated(),
        previousQuantity: prevStock,
        newQuantity: newStock,
        reason: `${dto.reason.trim()}${dto.notes?.trim() ? ` - ${dto.notes.trim()}` : ''}`,
        userId: actorId,
      });

      await this.foodAvailability.recalculateForIngredient(id, tx);

      return toInventoryResponse(updated);
    });
  }

  async stockCount(
    id: string,
    dto: StockCountDto,
    actorId: string,
  ): Promise<InventoryItemResponse> {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.ingredient.findUnique({ where: { id } });
      if (!item) throw new NotFoundException('Inventory item not found');

      const counted = new Prisma.Decimal(dto.countedStock);
      const prevStock = item.stock;
      const variance = counted.sub(prevStock);

      const updated = await tx.ingredient.update({
        where: { id },
        data: { stock: counted },
      });

      await this.stockMovement.record(tx, {
        ingredientId: id,
        type: MovementType.COUNT,
        quantityChanged: variance,
        previousQuantity: prevStock,
        newQuantity: counted,
        reason: `Physical stock count (Variance: ${variance.toNumber() >= 0 ? '+' : ''}${variance.toNumber()})${dto.notes?.trim() ? ` - ${dto.notes.trim()}` : ''}`,
        userId: actorId,
      });

      await this.foodAvailability.recalculateForIngredient(id, tx);

      return toInventoryResponse(updated);
    });
  }

  async manualAdjustment(
    id: string,
    dto: ManualAdjustmentDto,
    actorId: string,
  ): Promise<InventoryItemResponse> {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.ingredient.findUnique({ where: { id } });
      if (!item) throw new NotFoundException('Inventory item not found');

      const target = new Prisma.Decimal(dto.newStock);
      const prevStock = item.stock;
      const delta = target.sub(prevStock);

      const updated = await tx.ingredient.update({
        where: { id },
        data: { stock: target },
      });

      await this.stockMovement.record(tx, {
        ingredientId: id,
        type: MovementType.ADJUSTMENT,
        quantityChanged: delta,
        previousQuantity: prevStock,
        newQuantity: target,
        reason: dto.reason.trim() || 'Admin manual stock correction',
        userId: actorId,
      });

      await this.foodAvailability.recalculateForIngredient(id, tx);

      return toInventoryResponse(updated);
    });
  }

  /**
   * Concurrency-safe, transactional stock adjustment for customer orders.
   * Can deduct or restore stock and updates food availability accordingly.
   */
  async adjustOrderStock(
    tx: Prisma.TransactionClient,
    lines: OrderStockAdjustmentLine[],
    direction: 'deduct' | 'restore',
  ): Promise<void> {
    const needed = new Map<string, Prisma.Decimal>();
    for (const line of lines) {
      for (const recipe of line.food.recipes) {
        const amount = new Prisma.Decimal(recipe.quantity).mul(line.quantity);
        needed.set(
          recipe.ingredientId,
          (needed.get(recipe.ingredientId) ?? new Prisma.Decimal(0)).add(amount),
        );
      }
    }

    const modifiedIngredientIds: string[] = [];

    for (const [ingredientId, amount] of needed) {
      const ingredient = await tx.ingredient.findUnique({ where: { id: ingredientId } });
      if (!ingredient) continue;

      const prevStock = ingredient.stock;

      if (direction === 'restore') {
        const newStock = prevStock.add(amount);
        await tx.ingredient.update({
          where: { id: ingredientId },
          data: { stock: newStock },
        });

        await this.stockMovement.record(tx, {
          ingredientId,
          type: MovementType.ADJUSTMENT,
          quantityChanged: amount,
          previousQuantity: prevStock,
          newQuantity: newStock,
          reason: 'Order cancellation: stock restored',
        });
        modifiedIngredientIds.push(ingredientId);
        continue;
      }

      if (prevStock.lessThan(amount)) {
        throw new BadRequestException(
          `Not enough ${ingredient.name} in stock (requires ${amount.toNumber()} ${ingredient.unit}, available: ${prevStock.toNumber()} ${ingredient.unit})`,
        );
      }

      const newStock = prevStock.sub(amount);
      await tx.ingredient.update({
        where: { id: ingredientId },
        data: { stock: newStock },
      });

      await this.stockMovement.record(tx, {
        ingredientId,
        type: MovementType.ORDER_CONSUMPTION,
        quantityChanged: amount.negated(),
        previousQuantity: prevStock,
        newQuantity: newStock,
        reason: 'Order preparation consumption',
      });
      modifiedIngredientIds.push(ingredientId);
    }

    if (modifiedIngredientIds.length > 0) {
      await this.foodAvailability.recalculateForIngredients(modifiedIngredientIds, tx);
    }
  }
}
