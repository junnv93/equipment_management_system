import { SetMetadata } from '@nestjs/common';
import { Permission } from '../rbac/permissions.enum';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (
  ...permissions: Permission[]
): import('/home/kmjkds/equipment_management_system/node_modules/@nestjs/common/decorators/core/set-metadata.decorator').CustomDecorator<string> =>
  SetMetadata(PERMISSIONS_KEY, permissions);
