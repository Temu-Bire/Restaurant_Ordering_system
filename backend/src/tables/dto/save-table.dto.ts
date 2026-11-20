import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

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

  @IsOptional()
  @IsString()
  @MaxLength(60)
  section?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class ChangeTableStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string; // available, reserved, occupied, cleaning
}
