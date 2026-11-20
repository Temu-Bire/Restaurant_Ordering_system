import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { OrderType, PaymentMethod } from '@prisma/client';
import { parseOrderType, parsePaymentMethod } from '../../common/api-enums.js';

export class CreateOrderItemDto {
  @IsUUID()
  foodId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  quantity: number;
}

export class CreateOrderDto {
  @Transform(({ value }) => parseOrderType(value))
  @IsEnum(OrderType)
  type: OrderType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  partySize?: number;

  @IsOptional()
  @IsUUID()
  addressId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  pickupInstructions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  table?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentProvider?: string;

  @Transform(({ value }) => parsePaymentMethod(value))
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
