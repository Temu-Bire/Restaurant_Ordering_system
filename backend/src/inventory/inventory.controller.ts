import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator.js';
import { SaveRecipeDto } from './dto/save-recipe.dto.js';
import { UpdateStockDto } from './dto/update-stock.dto.js';
import { InventoryService } from './inventory.service.js';

@ApiTags('inventory')
@ApiBearerAuth()
@Roles(Role.STAFF, Role.ADMIN)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  findAll() {
    return this.inventory.findAll();
  }

  @Patch(':id')
  updateStock(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStockDto) {
    return this.inventory.updateStock(id, dto);
  }

  @Get('recipes')
  recipes() {
    return this.inventory.recipes();
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
