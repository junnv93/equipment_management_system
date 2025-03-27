import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '../rbac/permissions.enum';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ROLE_PERMISSIONS } from '../rbac/role-permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    
    if (!requiredPermissions) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    
    if (!user || !user.roles) {
      throw new ForbiddenException('인증이 필요합니다.');
    }
    
    // 사용자 역할 기반으로 권한 확인
    const userPermissions = user.roles?.flatMap(
      (role) => ROLE_PERMISSIONS[role] || []
    ) || [];
    
    const hasAllRequiredPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );
    
    if (!hasAllRequiredPermissions) {
      throw new ForbiddenException('이 작업을 수행할 권한이 없습니다.');
    }
    
    return true;
  }
} 