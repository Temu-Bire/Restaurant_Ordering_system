import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateProfileDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @MaxLength(100)
  fullName: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Enter a valid email' })
  email: string;

  @IsOptional()
  @Transform(trim)
  @Matches(/^$|^\+?[0-9\s-]{7,20}$/, { message: 'Enter a valid phone number' })
  phone?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  address?: string;
}
