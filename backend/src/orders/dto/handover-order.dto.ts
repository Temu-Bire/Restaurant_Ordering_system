import { IsOptional, IsString, MaxLength } from 'class-validator';

export class HandoverOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}
