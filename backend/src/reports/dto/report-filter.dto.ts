import { IsOptional, IsString } from 'class-validator';

export class ReportFilterDto {
  @IsOptional()
  @IsString()
  period?: 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom' | 'daily' | 'weekly' | 'monthly';

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  orderType?: string;

  @IsOptional()
  @IsString()
  orderStatus?: string;

  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @IsOptional()
  @IsString()
  category?: string;
}
