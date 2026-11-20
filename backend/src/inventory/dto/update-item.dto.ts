import { PartialType } from '@nestjs/swagger';
import { CreateInventoryItemDto } from './create-item.dto.js';

export class UpdateInventoryItemDto extends PartialType(CreateInventoryItemDto) {}
