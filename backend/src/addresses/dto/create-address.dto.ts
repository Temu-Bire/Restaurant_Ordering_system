import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateAddressDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  label: string; // Home, Work, Other

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  recipientName: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(25)
  phone: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  city: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  area: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  street: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(150)
  landmark?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(50)
  building?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(50)
  apartment?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(250)
  deliveryInstructions?: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
