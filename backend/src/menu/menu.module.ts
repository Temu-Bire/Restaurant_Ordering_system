import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller.js';
import { CategoriesService } from './categories.service.js';
import { MenuController } from './menu.controller.js';
import { MenuService } from './menu.service.js';

@Module({
  controllers: [CategoriesController, MenuController],
  providers: [CategoriesService, MenuService],
})
export class MenuModule {}