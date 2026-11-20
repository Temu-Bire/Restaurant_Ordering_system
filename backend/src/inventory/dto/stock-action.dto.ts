import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';

export class ReceiveStockDto {
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costPerUnit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}

export class RecordWasteDto {
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsString()
  @MaxLength(100)
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}

export class StockCountDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  countedStock: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}

export class ManualAdjustmentDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  newStock: number;

  @IsString()
  @MaxLength(200)
  reason: string;
}
