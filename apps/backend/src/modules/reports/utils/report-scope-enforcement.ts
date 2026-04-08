import type { ResolvedDataScope } from '@equipment-management/shared-constants';
import { enforceScope, type EnforcedScope } from '../../../common/scope/scope-enforcer';

/**
 * 리포트 export 시 실제 Drizzle WHERE 조건에 적용할 필터 값.
 *
 * @deprecated 신규 코드는 `EnforcedScope` (common/scope/scope-enforcer) 직접 사용 권장.
 *             타입 호환성을 위해 alias 로 유지.
 */
export type EnforcedReportFilter = EnforcedScope;

/**
 * 리포트 export 용 클라이언트 쿼리 파라미터를 서버 스코프로 강제한다.
 *
 * 본 함수는 SSOT `enforceScope` (common/scope/scope-enforcer.ts) 의 wrapper.
 * report 도메인 특화 호출 컨텍스트만 보존하고, 정책 자체는 단일 진실 원천에서 결정.
 *
 * @see common/scope/scope-enforcer.ts — 정책 정의 (none/team/site/all)
 * @see common/interceptors/site-scope.interceptor.ts — 동일 정책의 list-route 소비자
 */
export function enforceReportScope(
  params: Record<string, string>,
  scope: ResolvedDataScope
): EnforcedReportFilter {
  return enforceScope({ site: params.site, teamId: params.teamId }, scope);
}
