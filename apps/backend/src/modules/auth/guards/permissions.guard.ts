import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Permission } from '../rbac/permissions.enum';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { SKIP_PERMISSIONS_KEY } from '../decorators/skip-permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLE_PERMISSIONS } from '../rbac/role-permissions';
import { USER_ROLE_VALUES } from '../rbac/roles.enum';
import { JwtUser } from '../../../types/auth';

/**
 * 역할 문자열이 유효한 UserRole인지 검증하는 타입 가드
 *
 * @param role - 검증할 역할 문자열
 * @returns role이 유효한 역할 값인지 여부
 */
function isValidUserRole(role: string): boolean {
  return (USER_ROLE_VALUES as readonly string[]).includes(role);
}

/**
 * Default-Deny Permissions Guard
 *
 * 모드:
 * - AUDIT: @RequirePermissions 누락 시 WARN 로그만 기록하고 통과 (기본값, 1주 운영)
 * - DENY: @RequirePermissions 누락 시 403 Forbidden (프로덕션 전환 후)
 *
 * 환경변수: PERMISSIONS_GUARD_MODE=AUDIT|DENY
 *
 * 권한 검사 생략 우선순위:
 * 1. @Public() → JWT 인증도 생략
 * 2. @SkipPermissions() → JWT 인증 필요, 권한 검사만 생략
 * 3. @RequirePermissions(...) → 명시적 권한 검사
 * 4. 위 데코레이터 없음 → 모드에 따라 AUDIT(로그)/DENY(403)
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);
  private readonly mode: 'AUDIT' | 'DENY';

  constructor(
    private reflector: Reflector,
    private configService: ConfigService
  ) {
    // 환경변수로 모드 설정 (기본: DENY — Secure by Default)
    const modeEnv = this.configService.get<string>('PERMISSIONS_GUARD_MODE', 'DENY');
    this.mode = modeEnv === 'AUDIT' ? 'AUDIT' : 'DENY';
    this.logger.log(`PermissionsGuard initialized in ${this.mode} mode`);

    if (this.mode === 'AUDIT') {
      this.logger.error('[SECURITY] AUDIT 모드 활성화됨 — 프로덕션에서는 DENY 모드를 사용하세요');
    }
  }

  canActivate(context: ExecutionContext): boolean {
    // 1. @Public() 체크 → JWT 인증도 생략되므로 권한 검사도 생략
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // 2. @SkipPermissions() 체크 → 권한 검사만 생략
    const skipPermissions = this.reflector.getAllAndOverride<boolean>(SKIP_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipPermissions) {
      return true;
    }

    // 3. @RequirePermissions() 체크
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 4. @RequirePermissions 없는 경우 → Default-Deny 정책
    if (!requiredPermissions) {
      const request = context.switchToHttp().getRequest();
      const endpoint = `${request.method} ${request.url}`;

      if (this.mode === 'AUDIT') {
        // Audit 모드: WARN 로그만 기록하고 통과
        this.logger.warn(`[SECURITY-AUDIT] Missing @RequirePermissions on ${endpoint}`);
        return true;
      } else {
        // Deny 모드: 403 Forbidden
        this.logger.error(
          `[SECURITY-DENY] Blocked access to ${endpoint} (missing @RequirePermissions)`
        );
        throw new ForbiddenException({
          code: 'AUTH_PERMISSIONS_NOT_CONFIGURED',
          message: 'Permissions are not configured for this endpoint.',
        });
      }
    }

    const { user } = context.switchToHttp().getRequest() as { user?: JwtUser };

    if (!user || !user.roles) {
      throw new ForbiddenException({
        code: 'AUTH_REQUIRED',
        message: 'Authentication is required.',
      });
    }

    // ✅ 타입 안전한 역할 기반 권한 확인
    // 유효하지 않은 역할은 무시하고 유효한 역할만 처리
    const userPermissions = user.roles
      .filter((role: string) => isValidUserRole(role))
      .flatMap((validRole: string) => ROLE_PERMISSIONS[validRole] || []);

    const hasAllRequiredPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasAllRequiredPermissions) {
      throw new ForbiddenException({
        code: 'AUTH_INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to perform this action.',
      });
    }

    return true;
  }
}
