import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator.js';
import { SaveTableDto } from './dto/save-table.dto.js';
import { TablesService } from './tables.service.js';

@ApiTags('tables')
@ApiBearerAuth()
@Roles(Role.STAFF, Role.ADMIN)
@Controller('tables')
export class TablesController {
  constructor(private readonly tables: TablesService) {}

  @Roles(Role.CUSTOMER, Role.STAFF, Role.ADMIN)
  @Get()
  findAll() {
    return this.tables.findAll();
  }

  @Post()
  create(@Body() dto: SaveTableDto) {
    return this.tables.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SaveTableDto) {
    return this.tables.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tables.remove(id);
  }
}
