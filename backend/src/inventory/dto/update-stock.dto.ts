import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class UpdateStockDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  stock: number;
}
