import { SetMetadata, type CustomDecorator } from '@nestjs/common';
import { type UserRole } from '../rbac/roles.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]): CustomDecorator<string> =>
  SetMetadata(ROLES_KEY, roles);
