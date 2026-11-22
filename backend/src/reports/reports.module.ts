import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module.js';
import { ReportsController } from './reports.controller.js';
import { AdminDashboardService } from './services/admin-dashboard.service.js';
import { AnalyticsService } from './services/analytics.service.js';
import { ReportsService } from './services/reports.service.js';
import { SalesReportService } from './services/sales-report.service.js';
import { StaffDashboardService } from './services/staff-dashboard.service.js';

@Module({
  imports: [OrdersModule],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    AnalyticsService,
    AdminDashboardService,
    StaffDashboardService,
    SalesReportService,
  ],
  exports: [
    ReportsService,
    AnalyticsService,
    AdminDashboardService,
    StaffDashboardService,
    SalesReportService,
  ],
})
export class ReportsModule {}
