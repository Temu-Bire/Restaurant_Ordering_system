import { Transform } from 'class-transformer';
import { IsEnum } from 'class-validator';
import { OrderStatus } from '@prisma/client';
import { parseOrderStatus } from '../../common/api-enums.js';

export class UpdateOrderStatusDto {
  @Transform(({ value }) => parseOrderStatus(value))
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
