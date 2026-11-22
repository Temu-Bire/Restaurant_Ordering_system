import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InventoryCategory,
  InventoryStatus,
  MovementType,
  Prisma,
  Role,
} from '@prisma/client';
import { parseInventoryCategory } from '../../common/api-enums.js';
import { isPrismaError } from '../../common/prisma-errors.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateInventoryItemDto } from '../dto/create-item.dto.js';
import { SaveRecipeDto } from '../dto/save-recipe.dto.js';
import {
  ManualAdjustmentDto,
  ReceiveStockDto,
  RecordWasteDto,
  StockCountDto,
} from '../dto/stock-action.dto.js';
import { UpdateInventoryItemDto } from '../dto/update-item.dto.js';
import {
  InventoryItemResponse,
  toInventoryResponse,
} from '../helpers/inventory-response.mapper.js';
import { RecipeService } from './recipe.service.js';
import { StockManagementService } from './stock-management.service.js';
import { StockMovementService } from './stock-movement.service.js';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockManagement: StockManagementService,
    private readonly stockMovement: StockMovementService,
    private readonly recipeService: RecipeService,
  ) {}

  async findAll(query?: {
    search?: string;
    category?: string;
    stockStatus?: string;
    status?: string;
  }): Promise<InventoryItemResponse[]> {
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

  async findOne(id: string): Promise<InventoryItemResponse> {
    const item = await this.prisma.ingredient.findUnique({
      where: { id },
    });
    if (!item) throw new NotFoundException('Inventory item not found');
    return toInventoryResponse(item);
  }

  async create(dto: CreateInventoryItemDto, actorId?: string): Promise<InventoryItemResponse> {
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
          await this.stockMovement.record(tx, {
            ingredientId: item.id,
            type: MovementType.RECEIVE,
            quantityChanged: new Prisma.Decimal(dto.stock),
            previousQuantity: new Prisma.Decimal(0),
            newQuantity: new Prisma.Decimal(dto.stock),
            reason: 'Initial stock on item registration',
            userId: actorId ?? null,
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

  async update(id: string, dto: UpdateInventoryItemDto, actorRole: Role): Promise<InventoryItemResponse> {
    const existing = await this.prisma.ingredient.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Inventory item not found');

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

  async toggleStatus(id: string): Promise<InventoryItemResponse> {
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

  async remove(id: string): Promise<void> {
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

  // Stock operations delegated to StockManagementService
  async receiveStock(id: string, dto: ReceiveStockDto, actorId: string) {
    return this.stockManagement.receiveStock(id, dto, actorId);
  }

  async recordWaste(id: string, dto: RecordWasteDto, actorId: string) {
    return this.stockManagement.recordWaste(id, dto, actorId);
  }

  async stockCount(id: string, dto: StockCountDto, actorId: string) {
    return this.stockManagement.stockCount(id, dto, actorId);
  }

  async manualAdjustment(id: string, dto: ManualAdjustmentDto, actorId: string) {
    return this.stockManagement.manualAdjustment(id, dto, actorId);
  }

  // Movements delegated to StockMovementService
  async movements(query?: {
    ingredientId?: string;
    type?: MovementType;
    limit?: number;
  }) {
    return this.stockMovement.findMovements(query);
  }

  // Recipes delegated to RecipeService
  async recipes() {
    return this.recipeService.findAll();
  }

  async saveRecipe(foodId: string, dto: SaveRecipeDto) {
    return this.recipeService.saveRecipe(foodId, dto);
  }
}
