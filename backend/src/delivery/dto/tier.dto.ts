import { IsNumber, Min } from 'class-validator';

export class CreateDeliveryTierDto {
  @IsNumber()
  @Min(0)
  minDistance: number;

  @IsNumber()
  @Min(0.01)
  maxDistance: number;

  @IsNumber()
  @Min(0)
  fee: number;
}
