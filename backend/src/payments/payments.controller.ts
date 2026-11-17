import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { PublicUser } from '../users/public-user.js';
import { RecordPaymentDto } from './dto/record-payment.dto.js';
import { PaymentsService } from './payments.service.js';

@ApiTags('payments')
@ApiBearerAuth()
@Roles(Role.STAFF, Role.ADMIN)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  findAll() {
    return this.payments.findAll();
  }

  @Post()
  record(@Body() dto: RecordPaymentDto, @CurrentUser() user: PublicUser) {
    return this.payments.record(dto, user.id);
  }
}
