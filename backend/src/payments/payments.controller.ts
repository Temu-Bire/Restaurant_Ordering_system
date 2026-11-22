import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { PublicUser } from '../users/public-user.js';
import { RecordPaymentDto } from './dto/record-payment.dto.js';
import { PaymentVerificationOutcome, VerifyPaymentDto } from './dto/verify-payment.dto.js';
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

  @Get('verify/:txRef')
  verifyByTxRef(@Param('txRef') txRef: string) {
    return this.payments.verify(txRef, {
      outcome: PaymentVerificationOutcome.SUCCESS,
      transactionRef: txRef,
    });
  }

  @Post('order/:orderId/initiate')
  initiate(
    @Param('orderId') orderId: string,
    @Body('provider') provider?: string,
  ) {
    return this.payments.initiate(orderId, provider);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('webhook/chapa')
  handleChapaWebhook(
    @Body() body: any,
    @Headers('x-chapa-signature') xSignature?: string,
    @Headers('chapa-signature') chapaSignature?: string,
  ) {
    const signature = xSignature || chapaSignature;
    return this.payments.handleWebhook(body, signature);
  }
}
