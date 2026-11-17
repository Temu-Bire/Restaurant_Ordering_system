import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../../common/enums/role.enum.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateUserDto {
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
  @Matches(/^\+?[0-9\s-]{7,20}$/, { message: 'Enter a valid phone number' })
  phone?: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(72)
  password: string;

  @IsEnum(Role, { message: 'Role must be CUSTOMER, STAFF or ADMIN' })
  role: Role;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
