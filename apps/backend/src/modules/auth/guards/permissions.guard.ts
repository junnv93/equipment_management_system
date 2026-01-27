import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '../rbac/permissions.enum';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ROLE_PERMISSIONS } from '../rbac/role-permissions';
import { UserRole } from '../rbac/roles.enum';
import { JwtUser } from '../../../types/auth';

/**
 * 역할 문자열이 유효한 UserRole인지 검증하는 타입 가드
 *
 * @param role - 검증할 역할 문자열
 * @returns role이 UserRole enum 값인지 여부
 */
function isValidUserRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest() as { user?: JwtUser };

    if (!user || !user.roles) {
      throw new ForbiddenException('인증이 필요합니다.');
    }

    // ✅ 타입 안전한 역할 기반 권한 확인
    // 유효하지 않은 역할은 무시하고 유효한 역할만 처리
    const userPermissions = user.roles
      .filter((role: string): role is UserRole => isValidUserRole(role))
      .flatMap((validRole: UserRole) => ROLE_PERMISSIONS[validRole] || []);

    const hasAllRequiredPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasAllRequiredPermissions) {
      throw new ForbiddenException('이 작업을 수행할 권한이 없습니다.');
    }

    return true;
  }
}
