import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller.js';
import { FoodAvailabilityService } from './services/food-availability.service.js';
import { InventoryService } from './services/inventory.service.js';
import { RecipeService } from './services/recipe.service.js';
import { StockManagementService } from './services/stock-management.service.js';
import { StockMovementService } from './services/stock-movement.service.js';

@Module({
  controllers: [InventoryController],
  providers: [
    InventoryService,
    StockManagementService,
    StockMovementService,
    RecipeService,
    FoodAvailabilityService,
  ],
  exports: [
    InventoryService,
    StockManagementService,
    StockMovementService,
    RecipeService,
    FoodAvailabilityService,
  ],
})
export class InventoryModule {}
