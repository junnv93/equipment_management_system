/**
 * 스코프 SQL predicate 빌더 (SSOT — query 계층용)
 *
 * `SiteScopeInterceptor` / `enforceScope` 가 **요청 경계**에서 사용자 입력을
 * scope 로 강제한다면, 본 함수는 **쿼리 계층** (count / KPI / 집계 / 내부 조회) 에서
 * 같은 정책 상태기계를 SQL WHERE 술어로 emit 한다. 두 진입점이 같은
 * `resolveDataScope()` SSOT 를 통과하므로 drift 가 발생하지 않는다.
 *
 * ## 정책 매핑 (enforceScope 와 1:1)
 *
 * | scope.type | 반환 |
 * |---|---|
 * | `all`  | `undefined` (필터 없음 — 호출자는 JOIN 자체를 생략 가능) |
 * | `site` | `callbacks.site(scope.site)` SQL — site 콜백 필수 |
 * | `team` | `callbacks.team(scope.teamId)` SQL — team 콜백 없으면 site 폴백 (team ⊂ site 정책) |
 * | `none` | `sql\`false\`` — `ROLE_CATEGORIES` gating 우회 시 안전망 (행 0건) |
 *
 * ## 콜백 패턴이 필요한 이유
 *
 * 호출자마다 어떤 테이블/JOIN 으로 site/team 을 매칭할지 다르다:
 * - 단일 테이블: `(s) => eq(equipmentImports.site, s)`
 * - users 경유: `(s) => eq(users.site, s)` (checkouts 등)
 * - equipment 서브쿼리 경유: `(s) => equipmentBelongsToSite(nc.equipmentId, s)` (NC, 소프트웨어)
 *
 * 정책 상태기계는 본 함수가 책임지고, JOIN 컬럼 결정만 호출자에게 위임한다.
 *
 * ## fail-closed 보장
 *
 * - `site` 스코프인데 `scope.site` 가 비어 있으면 403 (resolver 버그 방어)
 * - `site` 스코프인데 `callbacks.site` 미제공 → 403 `SCOPE_FILTER_UNAVAILABLE`
 * - `team` 스코프인데 `scope.teamId` 도 `scope.site` 도 없으면 403
 *
 * @example
 * // 단일 테이블 — equipment-imports 카운트
 * const condition = buildScopePredicate(EQUIPMENT_IMPORT_DATA_SCOPE, userCtx, {
 *   site: (s) => eq(schema.equipmentImports.site, s),
 *   team: (t) => eq(schema.equipmentImports.teamId, t),
 * });
 * if (condition) conditions.push(condition);
 *
 * @example
 * // equipment 서브쿼리 경유 — NC
 * const condition = buildScopePredicate(NON_CONFORMANCE_DATA_SCOPE, userCtx, {
 *   site: (s) => equipmentBelongsToSite(schema.nonConformances.equipmentId, s),
 *   team: (t) => equipmentBelongsToTeam(schema.nonConformances.equipmentId, t),
 * });
 *
 * @throws ForbiddenException 정책 위반 / 필수 콜백 누락 / resolver 인코헌스
 */

import { ForbiddenException } from '@nestjs/common';
import { sql, type SQL } from 'drizzle-orm';
import {
  resolveDataScope,
  type FeatureScopePolicy,
  type UserScopeContext,
} from '@equipment-management/shared-constants';

export interface ScopePredicateCallbacks {
  /** 단일 site 값으로 SQL WHERE 단편 생성 */
  site?: (siteValue: string) => SQL;
  /** 단일 team UUID 로 SQL WHERE 단편 생성. 미제공 시 site 로 폴백 (team ⊂ site) */
  team?: (teamIdValue: string) => SQL;
}

export function buildScopePredicate(
  policy: FeatureScopePolicy,
  userCtx: UserScopeContext,
  callbacks: ScopePredicateCallbacks
): SQL | undefined {
  const scope = resolveDataScope(userCtx, policy);

  switch (scope.type) {
    case 'all':
      return undefined;

    case 'site':
      if (!scope.site) {
        throw new ForbiddenException({
          code: 'SCOPE_ACCESS_DENIED',
          message: 'No site assigned to user',
        });
      }
      if (!callbacks.site) {
        throw new ForbiddenException({
          code: 'SCOPE_FILTER_UNAVAILABLE',
          message: 'Site scope filter is not available for this resource',
        });
      }
      return callbacks.site(scope.site);

    case 'team':
      // SiteScopeInterceptor / enforceScope 와 동일: teamId 없으면 site 폴백, 둘 다 없으면 차단
      if (!scope.teamId) {
        if (scope.site && callbacks.site) {
          return callbacks.site(scope.site);
        }
        throw new ForbiddenException({
          code: 'SCOPE_ACCESS_DENIED',
          message: 'No team or site assigned to user',
        });
      }
      // team 콜백 우선, 없으면 site 폴백 (team ⊂ site 정책 — drift 방지)
      if (callbacks.team) {
        return callbacks.team(scope.teamId);
      }
      if (scope.site && callbacks.site) {
        return callbacks.site(scope.site);
      }
      throw new ForbiddenException({
        code: 'SCOPE_FILTER_UNAVAILABLE',
        message: 'Team/site scope filter is not available for this resource',
      });

    case 'none':
      // ROLE_CATEGORIES gating 에서 이미 제외되어야 하지만 안전망 — 0행 보장
      return sql`false`;
  }
}
