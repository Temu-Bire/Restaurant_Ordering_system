import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ModerateReviewDto {
  @IsBoolean()
  isHidden: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  moderationReason?: string;
}
