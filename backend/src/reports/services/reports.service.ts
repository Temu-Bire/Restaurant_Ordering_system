import { Injectable } from '@nestjs/common';
import { ReportFilterDto } from '../dto/report-filter.dto.js';
import { AdminDashboardService } from './admin-dashboard.service.js';
import { AnalyticsService } from './analytics.service.js';
import { SalesReportService } from './sales-report.service.js';
import { StaffDashboardService } from './staff-dashboard.service.js';

@Injectable()
export class ReportsService {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly adminDashboardService: AdminDashboardService,
    private readonly staffDashboardService: StaffDashboardService,
    private readonly salesReportService: SalesReportService,
  ) {}

  async getAnalytics(filters: ReportFilterDto) {
    return this.analyticsService.getAnalytics(filters);
  }

  async admin(period = 'weekly') {
    return this.adminDashboardService.admin(period);
  }

  async staff() {
    return this.staffDashboardService.staff();
  }

  async report(period: 'daily' | 'weekly' | 'monthly' = 'daily') {
    return this.salesReportService.report(period);
  }
}
