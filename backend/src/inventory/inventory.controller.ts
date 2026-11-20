import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MovementType, Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { PublicUser } from '../users/public-user.js';
import { CreateInventoryItemDto } from './dto/create-item.dto.js';
import { SaveRecipeDto } from './dto/save-recipe.dto.js';
import {
  ManualAdjustmentDto,
  ReceiveStockDto,
  RecordWasteDto,
  StockCountDto,
} from './dto/stock-action.dto.js';
import { UpdateInventoryItemDto } from './dto/update-item.dto.js';
import { InventoryService } from './inventory.service.js';

@ApiTags('inventory')
@ApiBearerAuth()
@Roles(Role.STAFF, Role.ADMIN)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('stockStatus') stockStatus?: string,
    @Query('status') status?: string,
  ) {
    return this.inventory.findAll({ search, category, stockStatus, status });
  }

  @Get('movements')
  movements(
    @Query('ingredientId') ingredientId?: string,
    @Query('type') type?: MovementType,
    @Query('limit') limit?: number,
  ) {
    return this.inventory.movements({ ingredientId, type, limit: limit ? Number(limit) : undefined });
  }

  @Get('recipes')
  recipes() {
    return this.inventory.recipes();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventory.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateInventoryItemDto, @CurrentUser() user: PublicUser) {
    return this.inventory.create(dto, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryItemDto,
    @CurrentUser() user: PublicUser,
  ) {
    return this.inventory.update(id, dto, user.role);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/status')
  toggleStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventory.toggleStatus(id);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventory.remove(id);
  }

  @Post(':id/receive')
  receiveStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReceiveStockDto,
    @CurrentUser() user: PublicUser,
  ) {
    return this.inventory.receiveStock(id, dto, user.id);
  }

  @Post(':id/waste')
  recordWaste(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordWasteDto,
    @CurrentUser() user: PublicUser,
  ) {
    return this.inventory.recordWaste(id, dto, user.id);
  }

  @Post(':id/count')
  stockCount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StockCountDto,
    @CurrentUser() user: PublicUser,
  ) {
    return this.inventory.stockCount(id, dto, user.id);
  }

  @Roles(Role.ADMIN)
  @Post(':id/adjust')
  manualAdjustment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ManualAdjustmentDto,
    @CurrentUser() user: PublicUser,
  ) {
    return this.inventory.manualAdjustment(id, dto, user.id);
  }

  @Roles(Role.ADMIN)
  @Put('recipes/:foodId')
  saveRecipe(
    @Param('foodId', ParseUUIDPipe) foodId: string,
    @Body() dto: SaveRecipeDto,
  ) {
    return this.inventory.saveRecipe(foodId, dto);
  }
}
