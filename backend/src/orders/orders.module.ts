import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module.js';
import { DeliveryModule } from '../delivery/delivery.module.js';
import { TablesModule } from '../tables/tables.module.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
  imports: [SettingsModule, DeliveryModule, TablesModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
