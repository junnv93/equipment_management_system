import { ForbiddenException } from '@nestjs/common';
import type { ResolvedDataScope } from '@equipment-management/shared-constants';

/**
 * 스코프 enforcement 결과 — 실제 WHERE 조건/req.query 주입에 사용할 값.
 *
 * 이 타입을 만족하는 두 소비자:
 * - `SiteScopeInterceptor`: req.query 에 부수효과로 주입
 * - `enforceReportScope` (reports/utils): exporter 가 직접 사용
 */
export interface EnforcedScope {
  site?: string;
  teamId?: string;
}

/**
 * 데이터 스코프 강제 (Single Source of Truth — cross-site/cross-team 차단 정책)
 *
 * ## 정책 (OWASP IDOR fail-loud / CLAUDE.md Rule 2)
 * 클라이언트가 보낸 `params.site` / `params.teamId` 는 **서버 스코프 안에서만** 유효.
 * 스코프 경계를 넘는 명시 요청은 403 ForbiddenException (감사 가능, audit interceptor
 * 의 access_denied 경로와 자동 통합).
 *
 * | scope.type | 동작 |
 * |---|---|
 * | `none` | 항상 거부 (접근 권한 자체가 없음) |
 * | `team` | `teamId = scope.teamId` 강제. 다른 teamId 명시 → 403. `params.site` 는 **무시**하고 `undefined` — team 경계는 teamId 가 결정하고 site-only 리소스(예: software validation) 우회 차단 |
 * | `site` | `site = scope.site` 강제. 다른 site 명시 → 403. `params.teamId` 는 같은 사이트 내 팀 필터로 허용 |
 * | `all`  | 모든 `params` pass-through (admin / 전체 권한) |
 *
 * ## 왜 함수 한 곳에 모았는가
 * 동일 정책을 두 곳 (`SiteScopeInterceptor`, `enforceReportScope`) 이 별도로 구현해
 * drift 위험이 있었음. 본 함수가 SSOT 가 되고 두 소비자는 결과 형태만 다름:
 * - SiteScopeInterceptor: 결과를 `req.query` 에 mutate 주입
 * - enforceReportScope: 결과를 그대로 반환 (exporter 가 SQL WHERE 에 바인딩)
 *
 * @throws ForbiddenException 스코프 경계 위반 (none / cross-team / cross-site)
 *                            또는 스코프 객체에 필수 필드 누락 (fail-closed)
 */
export function enforceScope(
  params: { site?: string; teamId?: string },
  scope: ResolvedDataScope
): EnforcedScope {
  switch (scope.type) {
    case 'none':
      throw new ForbiddenException({
        code: 'SCOPE_DENIED',
        message: `리소스 접근 권한 없음: ${scope.label}`,
      });

    case 'team': {
      if (!scope.teamId) {
        // data-scope 해석기 버그 — fail closed
        throw new ForbiddenException({
          code: 'SCOPE_DENIED',
          message: `팀 스코프에 teamId 누락: ${scope.label}`,
        });
      }
      if (params.teamId && params.teamId !== scope.teamId) {
        throw new ForbiddenException({
          code: 'CROSS_TEAM_DENIED',
          message: `Cross-team access denied: scope=${scope.teamId}, requested=${params.teamId}`,
        });
      }
      return {
        teamId: scope.teamId,
        // team 경계는 teamId JOIN 으로 결정. params.site 는 무시 (site-only 리소스 우회 차단).
        site: undefined,
      };
    }

    case 'site': {
      if (!scope.site) {
        throw new ForbiddenException({
          code: 'SCOPE_DENIED',
          message: `사이트 스코프에 site 누락: ${scope.label}`,
        });
      }
      if (params.site && params.site !== scope.site) {
        throw new ForbiddenException({
          code: 'CROSS_SITE_DENIED',
          message: `Cross-site access denied: scope=${scope.site}, requested=${params.site}`,
        });
      }
      return {
        site: scope.site,
        // 같은 사이트 내 팀 필터는 자유
        teamId: params.teamId || undefined,
      };
    }

    case 'all':
      return {
        site: params.site || undefined,
        teamId: params.teamId || undefined,
      };
  }
}
