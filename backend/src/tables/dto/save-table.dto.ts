import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';

export class SaveTableDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  name: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  seats: number;
}
