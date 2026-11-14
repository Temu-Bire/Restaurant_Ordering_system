import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PublicUser } from '../../users/public-user.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PublicUser =>
    ctx.switchToHttp().getRequest<{ user: PublicUser }>().user,
);