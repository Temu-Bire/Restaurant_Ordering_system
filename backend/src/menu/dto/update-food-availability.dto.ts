import { IsBoolean } from 'class-validator';

export class UpdateFoodAvailabilityDto {
  @IsBoolean()
  isAvailable: boolean;
}
