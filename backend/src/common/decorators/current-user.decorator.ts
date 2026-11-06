import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Usage: me(@CurrentUser() user) gives the logged-in user (req.user)
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest().user;
  },
);