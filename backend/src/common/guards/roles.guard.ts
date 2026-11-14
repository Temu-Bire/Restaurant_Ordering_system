import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PublicUser } from '../../users/public-user.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @Roles() on the route: any logged-in user may enter
    if (!roles || roles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<{ user?: PublicUser }>();
    return !!user && roles.includes(user.role); // false becomes 403 Forbidden
  }
}