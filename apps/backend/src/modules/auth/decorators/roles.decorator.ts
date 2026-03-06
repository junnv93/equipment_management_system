import { SetMetadata } from '@nestjs/common';
import { type UserRole } from '../rbac/roles.enum';

export const ROLES_KEY = 'roles';
export const Roles = (
  ...roles: UserRole[]
): import('/home/kmjkds/equipment_management_system/node_modules/@nestjs/common/decorators/core/set-metadata.decorator').CustomDecorator<string> =>
  SetMetadata(ROLES_KEY, roles);
