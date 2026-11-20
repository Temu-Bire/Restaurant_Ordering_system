import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { PublicUser } from '../users/public-user.js';
import { AssignTableDto } from './dto/assign-table.dto.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { HandoverOrderDto } from './dto/handover-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { OrdersService } from './orders.service.js';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Roles(Role.STAFF, Role.ADMIN)
  @Get()
  findAll() {
    return this.orders.findAll();
  }

  @Roles(Role.CUSTOMER)
  @Get('mine')
  mine(@CurrentUser() user: PublicUser) {
    return this.orders.findMine(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: PublicUser) {
    return this.orders.findOne(id, user);
  }

  @Roles(Role.CUSTOMER)
  @Post()
  create(@CurrentUser() user: PublicUser, @Body() dto: CreateOrderDto) {
    return this.orders.create(user.id, dto);
  }

  @Roles(Role.STAFF)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: PublicUser,
  ) {
    return this.orders.updateStatus(id, dto, user);
  }

  @Roles(Role.STAFF)
  @Patch(':id/handover')
  handover(
    @Param('id') id: string,
    @Body() dto: HandoverOrderDto,
    @CurrentUser() user: PublicUser,
  ) {
    return this.orders.handover(id, user, dto);
  }

  @Roles(Role.CUSTOMER)
  @Post(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: PublicUser) {
    return this.orders.cancel(id, user.id);
  }

  @Roles(Role.STAFF)
  @Patch(':id/table')
  assignTable(@Param('id') id: string, @Body() dto: AssignTableDto) {
    return this.orders.assignTable(id, dto);
  }
}
