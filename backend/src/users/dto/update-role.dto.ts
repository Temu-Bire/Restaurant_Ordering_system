import { IsEnum } from 'class-validator';
import { Role } from '../../common/enums/role.enum.js';

export class UpdateRoleDto {
  @IsEnum(Role, { message: 'Role must be CUSTOMER, STAFF or ADMIN' })
  role: Role;
}