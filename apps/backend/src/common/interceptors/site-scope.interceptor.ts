import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { SITE_SCOPED_KEY, SiteScopedOptions } from '../decorators/site-scoped.decorator';
import { resolveDataScope } from '@equipment-management/shared-constants';
import type { UserRole } from '@equipment-management/schemas';
import type { AuthenticatedRequest } from '../../types/auth';
import { enforceScope } from '../scope/scope-enforcer';

/**
 * SiteScopeInterceptor (전역 APP_INTERCEPTOR)
 *
 * @SiteScoped() 데코레이터가 적용된 엔드포인트에서
 * 사용자의 역할/사이트/팀에 따라 req.query를 자동 주입하여
 * 데이터 격리를 보장합니다.
 *
 * **동작 방식:**
 * - `policy` 모드: `resolveDataScope()`로 역할별 스코프 결정
 *   - all  → 필터 없음 (전체 접근)
 *   - site → req.query.site = user.site
 *   - team → req.query.teamId = user.teamId
 *   - none → ForbiddenException
 * - `bypassRoles` 모드 (레거시): bypassRoles 역할은 site 주입 건너뜀
 *
 * 데코레이터 없는 엔드포인트는 이 인터셉터가 완전히 무시합니다.
 */
@Injectable()
export class SiteScopeInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SiteScopeInterceptor.name);

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // @SiteScoped() 메타데이터 확인 — 없으면 즉시 스킵
    const options = this.reflector.getAllAndOverride<SiteScopedOptions | undefined>(
      SITE_SCOPED_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    // 인증되지 않은 요청은 스킵 (JwtAuthGuard가 먼저 처리)
    if (!user) {
      return next.handle();
    }

    const userRole = user.roles?.[0] as UserRole | undefined;

    // ─── policy 모드 (권장) ───────────────────────────────────────────────
    if (options.policy && userRole) {
      const scope = resolveDataScope(
        { role: userRole, site: user.site, teamId: user.teamId },
        options.policy
      );

      if (scope.type === 'all') {
        return next.handle();
      }

      const siteField = options.siteField ?? 'site';
      const teamField = options.teamField ?? 'teamId';

      if (!request.query) {
        request.query = {};
      }
      const query = request.query as Record<string, string>;

      // SSOT: enforceScope 가 cross-site/cross-team mismatch 시 ForbiddenException throw.
      // throw 는 AuditInterceptor 의 access_denied 경로로 자동 흡수됨 (단일 정책 엔진).
      // 정상 경로에서는 결과를 alias field 로 주입 (silent enforcement, backward compat).
      try {
        const enforced = enforceScope({ site: query[siteField], teamId: query[teamField] }, scope);
        if (enforced.site !== undefined) query[siteField] = enforced.site;
        if (enforced.teamId !== undefined) query[teamField] = enforced.teamId;
      } catch (err) {
        // teamId 누락 폴백: 계정 설정 불완전한 경우 보수적으로 site 필터로 강등.
        // (기존 동작 유지 — scope.type === 'team' && !scope.teamId 만 해당)
        if (scope.type === 'team' && !scope.teamId && user.site) {
          query[siteField] = user.site;
          return next.handle();
        }
        this.logger.warn(
          `[SECURITY] User ${user.userId} role=${userRole} — ${err instanceof ForbiddenException ? err.message : String(err)}`
        );
        throw err;
      }

      return next.handle();
    }

    // ─── bypassRoles 모드 (레거시) ───────────────────────────────────────
    if (options.bypassRoles && userRole && options.bypassRoles.includes(userRole as never)) {
      return next.handle();
    }

    // 사용자의 site가 없으면 차단 (사이트 미할당 비관리자)
    if (!user.site) {
      this.logger.warn(`[SECURITY] User ${user.userId} has no site — blocking access`);
      throw new ForbiddenException(
        '사이트가 할당되지 않은 사용자는 이 리소스에 접근할 수 없습니다.'
      );
    }

    // req.query.site에 사용자 사이트 강제 주입
    if (!request.query) {
      request.query = {};
    }
    (request.query as Record<string, string>).site = user.site;

    return next.handle();
  }
}
