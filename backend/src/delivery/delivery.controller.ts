import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { DeliveryService } from './delivery.service.js';
import { CreateDeliveryTierDto } from './dto/tier.dto.js';
import { UpdateDeliveryTierDto } from './dto/update-tier.dto.js';
import { UpdateDeliveryConfigDto } from './dto/delivery-config.dto.js';
import { DeliveryQuoteDto } from './dto/quote.dto.js';

@ApiTags('delivery')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly delivery: DeliveryService) {}

  @Public()
  @Get('config')
  getConfig() {
    return this.delivery.getConfig();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch('config')
  updateConfig(@Body() dto: UpdateDeliveryConfigDto) {
    return this.delivery.updateConfig(dto);
  }

  @Public()
  @Get('tiers')
  getTiers() {
    return this.delivery.getTiers();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post('tiers')
  createTier(@Body() dto: CreateDeliveryTierDto) {
    return this.delivery.createTier(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch('tiers/:id')
  updateTier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeliveryTierDto,
  ) {
    return this.delivery.updateTier(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('tiers/:id')
  deleteTier(@Param('id', ParseUUIDPipe) id: string) {
    return this.delivery.deleteTier(id);
  }

  @Public()
  @Post('quote')
  quote(@Body() dto: DeliveryQuoteDto) {
    return this.delivery.calculateQuote(dto);
  }
}
