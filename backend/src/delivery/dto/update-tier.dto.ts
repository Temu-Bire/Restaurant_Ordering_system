import { PartialType } from '@nestjs/swagger';
import { CreateDeliveryTierDto } from './tier.dto.js';

export class UpdateDeliveryTierDto extends PartialType(CreateDeliveryTierDto) {}
