import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator.js';
import { ReportFilterDto } from './dto/report-filter.dto.js';
import { ReportsService } from './reports.service.js';

@ApiTags('reports')
@ApiBearerAuth()
@Controller()
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Roles(Role.ADMIN)
  @Get('reports/analytics')
  analytics(@Query() filters: ReportFilterDto) {
    return this.reports.getAnalytics(filters);
  }

  @Roles(Role.ADMIN)
  @Get('reports')
  report(@Query('period') period = 'daily') {
    return this.reports.report(period as any);
  }

  @Roles(Role.ADMIN)
  @Get('dashboard/admin')
  admin(@Query('period') period = 'weekly') {
    return this.reports.admin(period);
  }

  @Roles(Role.STAFF, Role.ADMIN)
  @Get('dashboard/staff')
  staff() {
    return this.reports.staff();
  }
}
