import { ForbiddenException } from '@nestjs/common';
import type { ResolvedDataScope } from '@equipment-management/shared-constants';

/**
 * 리포트 export 시 실제 Drizzle WHERE 조건에 적용할 필터 값.
 *
 * `scopeToEquipmentConditions()` (reports.service.ts)가 등가 SQL 패턴을
 * 내부적으로 조립하는 반면, form-template-export는 장비/소프트웨어/케이블 등
 * 여러 테이블에 각기 다른 컬럼을 바인딩해야 하므로 **값만** 돌려주는 형태가
 * 필요하다. 적용 책임은 exporter 각자에게 있다.
 */
export interface EnforcedReportFilter {
  site?: string;
  teamId?: string;
}

/**
 * 리포트 export용 클라이언트 쿼리 파라미터를 서버 스코프로 강제한다.
 *
 * ## 정책 (OWASP IDOR fail-loud / CLAUDE.md Rule 2)
 * 클라이언트가 보낸 `?site=`, `?teamId=`는 **서버 스코프 안에서만** 유효.
 * 스코프 경계를 넘는 요청은 403 ForbiddenException (감사 가능).
 *
 * | scope.type | 동작 |
 * |---|---|
 * | `none`     | 항상 거부 (접근 권한 자체가 없음) |
 * | `team`     | `teamId = scope.teamId` 강제. 다른 teamId 요청 → 403. `params.site`는 **무시**하고 `undefined` 반환 — team 경계는 teamId JOIN이 결정하고, site-only 리소스(예: software validation)에 대한 우회 경로를 차단한다 |
 * | `site`     | `site = scope.site` 강제. 다른 site 요청 → 403. `params.teamId`는 같은 사이트 내 팀 필터로 허용 |
 * | `all`      | 모든 `params` 허용 (admin / 전체 권한) |
 *
 * ## 배경
 * 이전 구현 (`params.site || scope?.site`)은 클라이언트가 서버 스코프를
 * 덮어쓰는 단락평가 버그였다. 2026-04-08 커밋 23192fd8에서 site만 부분
 * 수정되었으나 team-scoped 역할(TE/TM) + teamId 경로가 여전히 bypass.
 * 본 유틸리티는 `ResolvedDataScope` SSOT를 직접 소비하여 4개 type을
 * 일관되게 처리함으로써 local `UserScope` 타입 드리프트를 제거한다.
 */
export function enforceReportScope(
  params: Record<string, string>,
  scope: ResolvedDataScope
): EnforcedReportFilter {
  switch (scope.type) {
    case 'none':
      throw new ForbiddenException({
        code: 'REPORT_SCOPE_DENIED',
        message: `리포트 접근 권한 없음: ${scope.label}`,
      });

    case 'team': {
      // 스코프 객체가 teamId 없이 전달되는 것은 data-scope 해석기 버그 — fail closed
      if (!scope.teamId) {
        throw new ForbiddenException({
          code: 'REPORT_SCOPE_DENIED',
          message: `팀 스코프에 teamId 누락: ${scope.label}`,
        });
      }
      if (params.teamId && params.teamId !== scope.teamId) {
        throw new ForbiddenException({
          code: 'CROSS_TEAM_EXPORT_DENIED',
          message: `Cross-team export denied: scope=${scope.teamId}, requested=${params.teamId}`,
        });
      }
      return {
        teamId: scope.teamId,
        // team 경계는 teamId JOIN이 결정. params.site는 무시한다 — 그렇지 않으면
        // site-only 리소스(software validation 등)가 params.site 우회에 노출된다.
        site: undefined,
      };
    }

    case 'site': {
      if (!scope.site) {
        throw new ForbiddenException({
          code: 'REPORT_SCOPE_DENIED',
          message: `사이트 스코프에 site 누락: ${scope.label}`,
        });
      }
      if (params.site && params.site !== scope.site) {
        throw new ForbiddenException({
          code: 'CROSS_SITE_EXPORT_DENIED',
          message: `Cross-site export denied: scope=${scope.site}, requested=${params.site}`,
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
