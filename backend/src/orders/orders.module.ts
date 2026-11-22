import { Module } from '@nestjs/common';
import { DeliveryModule } from '../delivery/delivery.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { TablesModule } from '../tables/tables.module.js';
import { OrdersController } from './orders.controller.js';
import { OrderCheckoutService } from './services/order-checkout.service.js';
import { OrderLifecycleService } from './services/order-lifecycle.service.js';
import { OrderQueryService } from './services/order-query.service.js';
import { OrderTableService } from './services/order-table.service.js';
import { OrdersService } from './services/orders.service.js';

@Module({
  imports: [SettingsModule, DeliveryModule, TablesModule, InventoryModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrderQueryService,
    OrderCheckoutService,
    OrderLifecycleService,
    OrderTableService,
  ],
  exports: [
    OrdersService,
    OrderQueryService,
    OrderCheckoutService,
    OrderLifecycleService,
    OrderTableService,
  ],
})
export class OrdersModule {}
