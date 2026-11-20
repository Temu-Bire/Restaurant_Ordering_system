import { IsBoolean, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateDeliveryConfigDto {
  @IsOptional()
  @IsBoolean()
  deliveryEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  restaurantLat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  restaurantLng?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  maxDeliveryDistanceKm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minDeliveryOrderAmount?: number;
}
