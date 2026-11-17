import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module.js';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';

@Module({
  imports: [OrdersModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
