import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum.js';

export const ROLES_KEY = 'roles';

// Usage: @Roles(Role.ADMIN) or @Roles(Role.ADMIN, Role.STAFF)
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);