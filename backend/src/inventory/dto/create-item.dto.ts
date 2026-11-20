import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { InventoryCategory, InventoryStatus } from '@prisma/client';
import { parseInventoryCategory } from '../../common/api-enums.js';

export class CreateInventoryItemDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @Transform(({ value }) => parseInventoryCategory(value))
  @IsEnum(InventoryCategory)
  category?: InventoryCategory;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  sku?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minimum?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  unit?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  storageLocation?: string;

  @IsOptional()
  @IsEnum(InventoryStatus)
  status?: InventoryStatus;
}
