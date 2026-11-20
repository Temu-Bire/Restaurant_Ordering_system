import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum PaymentVerificationOutcome {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export class VerifyPaymentDto {
  @IsEnum(PaymentVerificationOutcome)
  outcome: PaymentVerificationOutcome;

  @IsOptional()
  @IsString()
  transactionRef?: string;
}
