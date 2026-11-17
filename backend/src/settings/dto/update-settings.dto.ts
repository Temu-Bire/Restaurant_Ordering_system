import { Transform, Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { parseOrderType, parsePaymentMethod } from '../../common/api-enums.js';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @IsOptional()
  @IsIn(['USD', 'ETB'])
  currency?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  taxRate?: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((item) => parseOrderType(item)) : value,
  )
  @IsIn(['DINE_IN', 'TAKEAWAY', 'DELIVERY'], { each: true })
  orderTypes?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((item) => parsePaymentMethod(item)) : value,
  )
  @IsIn(['CASH', 'CARD', 'MOBILE'], { each: true })
  paymentMethods?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10000)
  deliveryFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(100000)
  lowStockMinimum?: number;
}
