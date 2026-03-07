/**
 * Dashboard Scope — 대시보드 데이터 범위 SSOT
 *
 * 해결하는 문제:
 *   대시보드 KPI 숫자와 클릭 후 장비 목록이 서로 다른 범위를 참조하는 일관성 결함.
 *
 * 설계 원칙:
 *   - DashboardScope 단일 객체가 API 호출, queryKey, 링크 URL 세 곳의 범위를 결정
 *   - 범위 결정 로직(requiresTeamScope)은 dashboard-config.ts(SSOT)가 담당
 *   - 이 파일은 config를 그대로 따르는 파생자(derive) 역할만 수행
 *
 * Cross-site 설계:
 *   - site는 scope에 항상 포함 → 장비 목록 링크에 ?site= 자동 삽입
 *   - 비bypass 역할(@SiteScoped 적용): URL ?site=는 백엔드가 JWT site로 override → 무해
 *   - bypass 역할(lab_manager, system_admin): URL ?site=로 대시보드와 동일한 범위 보장
 *   - 따라서 모든 역할에서 KPI 숫자 = 클릭 후 목록 범위가 항상 일치
 */

import type { EquipmentStatus } from '@equipment-management/schemas';
import type { ControlCenterConfig } from '@/lib/config/dashboard-config';

// ─── 타입 ────────────────────────────────────────────────────

/**
 * 대시보드가 현재 보여주는 데이터 범위.
 *
 * API queryKey, queryFn, 장비 목록 링크 URL이 모두 이 객체에서 파생된다.
 */
export interface DashboardScope {
  /**
   * 해결된 팀 필터 ID.
   * undefined = 팀 필터 없음 (site 전체, 백엔드 JWT site 격리 적용)
   */
  teamId: string | undefined;
  /**
   * 사용자의 시험소 코드 (session.user.site).
   * 장비 목록 링크에 ?site=로 포함하여 @SiteScoped bypass 역할도 범위 일치 보장.
   */
  site: string | undefined;
  /** KPI 총계 레이블 모드 */
  displayMode: ControlCenterConfig['kpiDisplay'];
}

// ─── 핵심 함수 ────────────────────────────────────────────────

/**
 * dashboard-config의 설정값 + 세션 정보 + URL 파라미터로 스코프를 결정.
 *
 * 범위 결정 책임: dashboard-config.ts의 requiresTeamScope 플래그
 * (유틸리티가 kpiDisplay 문자열을 직접 해석하지 않음)
 *
 * 우선순위 (높음 → 낮음):
 *   1. URL ?teamId= — 관리자의 팀 드릴다운 (명시적 선택 최우선)
 *   2. requiresTeamScope === true → session.user.teamId 자동 적용
 *   3. requiresTeamScope === false → teamId 없음 (사이트 전체)
 */
export function resolveDashboardScope(
  kpiDisplay: ControlCenterConfig['kpiDisplay'],
  requiresTeamScope: boolean,
  userSite: string | undefined,
  userTeamId: string | undefined,
  urlTeamId?: string | null
): DashboardScope {
  // 1. URL override — 명시적 팀 선택이 항상 우선
  if (urlTeamId) {
    return { teamId: urlTeamId, site: userSite, displayMode: kpiDisplay };
  }

  // 2. config가 팀 범위를 요구하면 세션 teamId 자동 적용
  const teamId = requiresTeamScope ? userTeamId : undefined;
  return { teamId, site: userSite, displayMode: kpiDisplay };
}

// ─── URL 빌더 ────────────────────────────────────────────────

/**
 * 장비 목록 URL을 현재 대시보드 스코프에 맞게 생성.
 *
 * - status: EquipmentStatus 타입으로 타입 안전성 보장 (SSOT 준수)
 * - teamId: scope에서 자동 포함
 * - site: scope에서 자동 포함 (@SiteScoped bypass 역할의 범위 일치)
 */
export function buildScopedEquipmentUrl(
  scope: DashboardScope,
  basePath: string,
  status?: EquipmentStatus
): string {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (scope.teamId) params.set('teamId', scope.teamId);
  if (scope.site) params.set('site', scope.site);
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
