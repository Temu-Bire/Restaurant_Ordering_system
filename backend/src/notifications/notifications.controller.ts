import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { PublicUser } from '../users/public-user.js';
import { NotificationFilterDto } from './dto/notification-filter.dto.js';
import { NotificationService } from './notifications.service.js';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationService) {}

  @Get()
  getPaginated(
    @CurrentUser() user: PublicUser,
    @Query() filter: NotificationFilterDto,
  ) {
    return this.notifications.getPaginated(user.id, filter);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: PublicUser) {
    const count = await this.notifications.getUnreadCount(user.id);
    return { unreadCount: count };
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: PublicUser,
  ) {
    return this.notifications.markAsRead(id, user.id);
  }

  @Patch('mark-all-read')
  markAllAsRead(@CurrentUser() user: PublicUser) {
    return this.notifications.markAllAsRead(user.id);
  }
}
