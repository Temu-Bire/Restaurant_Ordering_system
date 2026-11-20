import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { PublicUser } from '../users/public-user.js';
import { RecordPaymentDto } from './dto/record-payment.dto.js';
import { VerifyPaymentDto } from './dto/verify-payment.dto.js';
import { PaymentsService } from './payments.service.js';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Roles(Role.STAFF, Role.ADMIN)
  @Get()
  findAll() {
    return this.payments.findAll();
  }

  @Roles(Role.STAFF, Role.ADMIN)
  @Post()
  record(@Body() dto: RecordPaymentDto, @CurrentUser() user: PublicUser) {
    return this.payments.record(dto, user.id);
  }

  @Post(':id/verify')
  verify(
    @Param('id') id: string,
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.payments.verify(id, dto);
  }

  @Post('order/:orderId/initiate')
  initiate(
    @Param('orderId') orderId: string,
    @Body('provider') provider?: string,
  ) {
    return this.payments.initiate(orderId, provider);
  }
}
