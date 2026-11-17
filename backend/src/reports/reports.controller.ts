import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator.js';
import { ReportPeriod, ReportsService } from './reports.service.js';

const PERIODS: ReportPeriod[] = ['daily', 'weekly', 'monthly'];

@ApiTags('reports')
@ApiBearerAuth()
@Controller()
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Roles(Role.ADMIN)
  @Get('reports')
  report(@Query('period') period = 'daily') {
    if (!PERIODS.includes(period as ReportPeriod)) {
      throw new BadRequestException('Period must be daily, weekly, or monthly');
    }
    return this.reports.report(period as ReportPeriod);
  }

  @Roles(Role.ADMIN)
  @Get('dashboard/admin')
  admin(@Query('period') period = 'weekly') {
    if (!PERIODS.includes(period as ReportPeriod)) {
      throw new BadRequestException('Period must be daily, weekly, or monthly');
    }
    return this.reports.admin(period as ReportPeriod);
  }

  @Roles(Role.STAFF)
  @Get('dashboard/staff')
  staff() {
    return this.reports.staff();
  }
}
