import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsString, Max, Min } from 'class-validator';
import { PaymentMethod } from '@prisma/client';
import { parsePaymentMethod } from '../../common/api-enums.js';

export class RecordPaymentDto {
  @IsString()
  orderId: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(1000000)
  amount: number;

  @Transform(({ value }) => parsePaymentMethod(value))
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsBoolean()
  paid: boolean;
}
