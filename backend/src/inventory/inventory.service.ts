import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Ingredient,
  InventoryCategory,
  InventoryStatus,
  MovementType,
  Prisma,
  RecipeLine,
  Role,
} from '@prisma/client';
import { parseInventoryCategory, toApiInventoryCategory } from '../common/api-enums.js';
import { isPrismaError } from '../common/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateInventoryItemDto } from './dto/create-item.dto.js';
import { SaveRecipeDto } from './dto/save-recipe.dto.js';
import {
  ManualAdjustmentDto,
  ReceiveStockDto,
  RecordWasteDto,
  StockCountDto,
} from './dto/stock-action.dto.js';
import { UpdateInventoryItemDto } from './dto/update-item.dto.js';

export function calculateStockStatus(stock: number, minimum: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
  if (stock <= 0) return 'out_of_stock';
  if (stock <= minimum) return 'low_stock';
  return 'in_stock';
}

export const toInventoryResponse = (item: Ingredient) => {
  const stock = item.stock.toNumber();
  const minimum = item.minimum.toNumber();
  return {
    id: item.id,
    name: item.name,
    category: toApiInventoryCategory(item.category),
    sku: item.sku ?? `ING-${item.id.slice(0, 6).toUpperCase()}`,
    stock,
    minimum,
    unit: item.unit,
    unitCost: item.unitCost.toNumber(),
    expiryDate: item.expiryDate?.toISOString() ?? null,
    storageLocation: item.storageLocation ?? null,
    status: item.status.toLowerCase(),
    stockStatus: calculateStockStatus(stock, minimum),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
};

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query?: {
    search?: string;
    category?: string;
    stockStatus?: string;
    status?: string;
  }) {
    const where: Prisma.IngredientWhereInput = {};

    if (query?.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { storageLocation: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (query?.category && query.category !== 'all') {
      const cat = parseInventoryCategory(query.category) as InventoryCategory;
      if (cat) where.category = cat;
    }

    if (query?.status && query.status !== 'all') {
      where.status =
        query.status.toUpperCase() === 'INACTIVE'
          ? InventoryStatus.INACTIVE
          : InventoryStatus.ACTIVE;
    }

    const items = await this.prisma.ingredient.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    const mapped = items.map(toInventoryResponse);

    if (query?.stockStatus && query.stockStatus !== 'all') {
      return mapped.filter((i) => i.stockStatus === query.stockStatus);
    }

    return mapped;
  }

  async findOne(id: string) {
    const item = await this.prisma.ingredient.findUnique({
      where: { id },
    });
    if (!item) throw new NotFoundException('Inventory item not found');
    return toInventoryResponse(item);
  }

  async create(dto: CreateInventoryItemDto, actorId?: string) {
    const sku =
      dto.sku?.trim() ||
      `ING-${Date.now().toString(36).toUpperCase()}`;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const item = await tx.ingredient.create({
          data: {
            name: dto.name.trim(),
            category: dto.category ?? InventoryCategory.INGREDIENTS,
            sku,
            stock: dto.stock !== undefined ? new Prisma.Decimal(dto.stock) : new Prisma.Decimal(0),
            minimum: dto.minimum !== undefined ? new Prisma.Decimal(dto.minimum) : new Prisma.Decimal(5),
            unit: dto.unit?.trim() || 'kg',
            unitCost: dto.unitCost !== undefined ? new Prisma.Decimal(dto.unitCost) : new Prisma.Decimal(0),
            expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
            storageLocation: dto.storageLocation?.trim() || null,
            status: dto.status ?? InventoryStatus.ACTIVE,
          },
        });

        if (dto.stock && dto.stock > 0) {
          await tx.stockMovement.create({
            data: {
              ingredientId: item.id,
              type: MovementType.RECEIVE,
              quantityChanged: new Prisma.Decimal(dto.stock),
              previousQuantity: new Prisma.Decimal(0),
              newQuantity: new Prisma.Decimal(dto.stock),
              reason: 'Initial stock on item registration',
              userId: actorId ?? null,
            },
          });
        }

        return toInventoryResponse(item);
      });
    } catch (error) {
      if (isPrismaError(error, 'P2002')) {
        throw new ConflictException('An inventory item with this name or SKU already exists');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateInventoryItemDto, actorRole: Role) {
    const existing = await this.prisma.ingredient.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Inventory item not found');

    // Role check: Staff cannot edit unitCost or minimum stock thresholds
    if (actorRole === Role.STAFF) {
      if (dto.unitCost !== undefined || dto.minimum !== undefined) {
        throw new ForbiddenException('Staff members cannot edit unit cost or minimum stock thresholds');
      }
    }

    try {
      const updated = await this.prisma.ingredient.update({
        where: { id },
        data: {
          ...(dto.name && { name: dto.name.trim() }),
          ...(dto.category && { category: dto.category }),
          ...(dto.sku !== undefined && { sku: dto.sku.trim() || null }),
          ...(dto.unit && { unit: dto.unit.trim() }),
          ...(dto.minimum !== undefined && { minimum: new Prisma.Decimal(dto.minimum) }),
          ...(dto.unitCost !== undefined && { unitCost: new Prisma.Decimal(dto.unitCost) }),
          ...(dto.expiryDate !== undefined && {
            expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
          }),
          ...(dto.storageLocation !== undefined && {
            storageLocation: dto.storageLocation.trim() || null,
          }),
          ...(dto.status && { status: dto.status }),
        },
      });

      return toInventoryResponse(updated);
    } catch (error) {
      if (isPrismaError(error, 'P2002')) {
        throw new ConflictException('An inventory item with this name or SKU already exists');
      }
      throw error;
    }
  }

  async receiveStock(id: string, dto: ReceiveStockDto, actorId: string) {
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

      await tx.stockMovement.create({
        data: {
          ingredientId: id,
          type: MovementType.RECEIVE,
          quantityChanged: qty,
          previousQuantity: prevStock,
          newQuantity: newStock,
          reason: dto.notes?.trim() || 'Stock received',
          userId: actorId,
        },
      });

      return toInventoryResponse(updated);
    });
  }

  async recordWaste(id: string, dto: RecordWasteDto, actorId: string) {
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

      await tx.stockMovement.create({
        data: {
          ingredientId: id,
          type: MovementType.WASTE,
          quantityChanged: qty.negated(),
          previousQuantity: prevStock,
          newQuantity: newStock,
          reason: `${dto.reason.trim()}${dto.notes?.trim() ? ` - ${dto.notes.trim()}` : ''}`,
          userId: actorId,
        },
      });

      // If stock drops below recipe requirements, disable affected foods
      await this.disableFoodsWithInsufficientStock(tx, id, newStock);

      return toInventoryResponse(updated);
    });
  }

  async stockCount(id: string, dto: StockCountDto, actorId: string) {
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

      await tx.stockMovement.create({
        data: {
          ingredientId: id,
          type: MovementType.COUNT,
          quantityChanged: variance,
          previousQuantity: prevStock,
          newQuantity: counted,
          reason: `Physical stock count (Variance: ${variance.toNumber() >= 0 ? '+' : ''}${variance.toNumber()})${dto.notes?.trim() ? ` - ${dto.notes.trim()}` : ''}`,
          userId: actorId,
        },
      });

      await this.disableFoodsWithInsufficientStock(tx, id, counted);

      return toInventoryResponse(updated);
    });
  }

  async manualAdjustment(id: string, dto: ManualAdjustmentDto, actorId: string) {
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

      await tx.stockMovement.create({
        data: {
          ingredientId: id,
          type: MovementType.ADJUSTMENT,
          quantityChanged: delta,
          previousQuantity: prevStock,
          newQuantity: target,
          reason: dto.reason.trim() || 'Admin manual stock correction',
          userId: actorId,
        },
      });

      await this.disableFoodsWithInsufficientStock(tx, id, target);

      return toInventoryResponse(updated);
    });
  }

  async toggleStatus(id: string) {
    const item = await this.prisma.ingredient.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Inventory item not found');

    const nextStatus =
      item.status === InventoryStatus.ACTIVE
        ? InventoryStatus.INACTIVE
        : InventoryStatus.ACTIVE;

    const updated = await this.prisma.ingredient.update({
      where: { id },
      data: { status: nextStatus },
    });

    return toInventoryResponse(updated);
  }

  async remove(id: string) {
    const existing = await this.prisma.ingredient.findUnique({
      where: { id },
      include: { recipes: { include: { food: true } } },
    });
    if (!existing) throw new NotFoundException('Inventory item not found');

    if (existing.recipes.length > 0) {
      const dishNames = existing.recipes.map((r) => r.food.name).join(', ');
      throw new BadRequestException(
        `Cannot delete ${existing.name} because it is used in active recipes (${dishNames}).`,
      );
    }

    await this.prisma.ingredient.delete({ where: { id } });
  }

  async movements(query?: {
    ingredientId?: string;
    type?: MovementType;
    limit?: number;
  }) {
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

    return movements.map((m) => ({
      id: m.id,
      ingredientId: m.ingredientId,
      ingredientName: m.ingredient.name,
      sku: m.ingredient.sku,
      unit: m.ingredient.unit,
      type: m.type,
      quantityChanged: m.quantityChanged.toNumber(),
      previousQuantity: m.previousQuantity.toNumber(),
      newQuantity: m.newQuantity.toNumber(),
      reason: m.reason ?? '',
      userName: m.user?.fullName ?? 'System / Automatic Order',
      userRole: m.user?.role?.toLowerCase() ?? 'system',
      date: m.createdAt.toISOString(),
    }));
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
    return { foodId, lines: lines.map((line) => ({ ingredientId: line.ingredientId, quantity: line.quantity.toNumber() })) };
  }

  private async disableFoodsWithInsufficientStock(
    tx: Prisma.TransactionClient,
    ingredientId: string,
    currentStock: Prisma.Decimal,
  ) {
    // Find recipes that need more of this ingredient than what is currently in stock
    const recipes = await tx.recipeLine.findMany({
      where: {
        ingredientId,
        quantity: { gt: currentStock },
      },
      select: { foodId: true },
    });

    if (recipes.length > 0) {
      const foodIds = recipes.map((r) => r.foodId);
      await tx.food.updateMany({
        where: { id: { in: foodIds } },
        data: { isAvailable: false },
      });
    }
  }

  private groupRecipes(lines: RecipeLine[]) {
    const grouped: Record<string, { ingredientId: string; quantity: number }[]> = {};
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
