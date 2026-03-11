/**
 * ============================================================================
 * 🔴 SSOT: DataScope Policy Pattern
 * ============================================================================
 *
 * 역할별 데이터 접근 범위(스코프)를 정책 객체로 선언합니다.
 * 백엔드/프론트엔드 모두 이 파일에서 import하여 사용합니다.
 *
 * 기존 문제: 백엔드 7곳에서 역할→스코프 매핑을 인라인 하드코딩
 * 해결: 정책(Policy) + 해석기(Resolver) 분리 → switch/if 제거
 *
 * 확장: 향후 EQUIPMENT_DATA_SCOPE, CHECKOUT_DATA_SCOPE 등 추가 가능
 * ============================================================================
 */

import type { UserRole } from '@equipment-management/schemas';

/**
 * 데이터 스코프 타입
 * - none: 접근 불가
 * - team: 소속 팀 데이터만
 * - site: 소속 사이트 데이터만
 * - all: 전체 데이터
 */
export type DataScopeType = 'none' | 'team' | 'site' | 'all';

/**
 * 단일 역할의 스코프 정책
 */
export interface DataScopePolicy {
  type: DataScopeType;
  /** 한국어 라벨 — 프론트엔드 UI 표시용 */
  label: string;
}

/**
 * 기능별 전체 역할 스코프 정책
 */
export type FeatureScopePolicy = Record<UserRole, DataScopePolicy>;

/**
 * 감사 로그 스코프 정책
 *
 * 감사 로그는 "누가(WHO) 무엇을(WHAT) 했는가" → 행위자(actor) 기준 필터링
 * - test_engineer: 접근 불가 (감사 로그 열람 권한 없음)
 * - technical_manager: 소속 팀 활동 기록만 조회
 * - quality_manager: 전체 활동 기록 조회 (교정계획서 검토 역할)
 * - lab_manager: 소속 사이트 활동 기록 조회
 * - system_admin: 전체 활동 기록 조회
 */
export const AUDIT_LOG_SCOPE: FeatureScopePolicy = {
  test_engineer: { type: 'none', label: '접근 불가' },
  technical_manager: { type: 'team', label: '소속 팀 활동 기록' },
  quality_manager: { type: 'all', label: '전체 활동 기록' },
  lab_manager: { type: 'site', label: '소속 사이트 활동 기록' },
  system_admin: { type: 'all', label: '전체 활동 기록' },
};

/**
 * 장비(Equipment) 데이터 스코프 정책
 *
 * 장비는 사이트 단위로 관리됩니다 (UL-QP-18 관리번호 체계).
 * - test_engineer: 소속 사이트 장비만 조회 (사이트 간 접근 불가)
 * - technical_manager: 전체 사이트 장비 조회 (크로스 사이트 승인/반려 필요)
 * - quality_manager: 전체 사이트 장비 조회 (교정계획서 검토 역할)
 * - lab_manager: 전체 사이트 장비 조회 (시험소장은 자기 사이트 관리)
 * - system_admin: 전체 사이트 장비 조회
 */
export const EQUIPMENT_DATA_SCOPE: FeatureScopePolicy = {
  test_engineer: { type: 'site', label: '소속 사이트 장비' },
  technical_manager: { type: 'all', label: '전체 장비' },
  quality_manager: { type: 'all', label: '전체 장비' },
  lab_manager: { type: 'all', label: '전체 장비' },
  system_admin: { type: 'all', label: '전체 장비' },
};

/**
 * 반출(Checkout) 데이터 스코프 정책
 *
 * 반출은 팀 단위로 관리됩니다. 크로스 사이트 반출(렌탈) 지원.
 * - test_engineer: 소속 팀 반출만 조회 (팀 ⊂ 사이트이므로 사이트 필터 불필요)
 * - technical_manager: 소속 팀 반출만 조회 (자기 팀 장비 승인/관리)
 * - quality_manager: 소속 사이트 반출 조회 (사이트 전체 가시성 필요)
 * - lab_manager: 소속 사이트 반출 조회 (사이트 전체 관리)
 * - system_admin: 전체 반출 조회
 *
 * ⚠️ 크로스 사이트 렌탈: 반출 레코드의 borrowerSite는 사이트 필터와 별개.
 * 팀 필터 적용 시 반출 요청한 팀 기준으로 조회됨.
 */
export const CHECKOUT_DATA_SCOPE: FeatureScopePolicy = {
  test_engineer: { type: 'team', label: '소속 팀 반출' },
  technical_manager: { type: 'team', label: '소속 팀 반출' },
  quality_manager: { type: 'site', label: '소속 사이트 반출' },
  lab_manager: { type: 'site', label: '소속 사이트 반출' },
  system_admin: { type: 'all', label: '전체 반출' },
};

/**
 * 부적합(NonConformance) 데이터 스코프 정책
 *
 * 부적합은 사이트 단위로 관리됩니다.
 * - test_engineer: 소속 사이트 부적합만 조회
 * - technical_manager: 소속 사이트 부적합 조회 (자기 사이트 장비 관리)
 * - quality_manager: 소속 사이트 부적합 조회
 * - lab_manager: 전체 부적합 조회 (시험소장은 전체 부적합 가시성 필요)
 * - system_admin: 전체 부적합 조회
 */
export const NON_CONFORMANCE_DATA_SCOPE: FeatureScopePolicy = {
  test_engineer: { type: 'site', label: '소속 사이트 부적합' },
  technical_manager: { type: 'site', label: '소속 사이트 부적합' },
  quality_manager: { type: 'site', label: '소속 사이트 부적합' },
  lab_manager: { type: 'all', label: '전체 부적합' },
  system_admin: { type: 'all', label: '전체 부적합' },
};

/**
 * 교정(Calibration) 데이터 스코프 정책
 *
 * 교정 기록은 사이트 단위 장비에 종속됩니다.
 * - test_engineer: 소속 사이트 교정 기록 조회 (직접 등록하는 역할)
 * - technical_manager: 소속 사이트 교정 기록 조회/승인
 * - quality_manager: 전체 교정 기록 조회 (교정계획서 검토 역할)
 * - lab_manager: 전체 교정 기록 조회
 * - system_admin: 전체 교정 기록 조회
 */
export const CALIBRATION_DATA_SCOPE: FeatureScopePolicy = {
  test_engineer: { type: 'site', label: '소속 사이트 교정 기록' },
  technical_manager: { type: 'site', label: '소속 사이트 교정 기록' },
  quality_manager: { type: 'all', label: '전체 교정 기록' },
  lab_manager: { type: 'all', label: '전체 교정 기록' },
  system_admin: { type: 'all', label: '전체 교정 기록' },
};

/**
 * 장비 반입(EquipmentImport) 데이터 스코프 정책
 *
 * 장비 반입은 수신 사이트 기준으로 관리됩니다.
 * - test_engineer: 소속 사이트 반입 기록만 조회
 * - technical_manager: 소속 사이트 반입 기록 조회/승인
 * - quality_manager: 소속 사이트 반입 기록 조회
 * - lab_manager: 전체 반입 기록 조회 (크로스 사이트 반입 관리)
 * - system_admin: 전체 반입 기록 조회
 */
export const EQUIPMENT_IMPORT_DATA_SCOPE: FeatureScopePolicy = {
  test_engineer: { type: 'site', label: '소속 사이트 반입 기록' },
  technical_manager: { type: 'site', label: '소속 사이트 반입 기록' },
  quality_manager: { type: 'site', label: '소속 사이트 반입 기록' },
  lab_manager: { type: 'all', label: '전체 반입 기록' },
  system_admin: { type: 'all', label: '전체 반입 기록' },
};

/**
 * 교정계획서(CalibrationPlan) 데이터 스코프 정책
 *
 * 교정계획서는 사이트 단위로 작성됩니다 (UL-QP-18 3단계 승인: TM → QM → LM).
 * - test_engineer: 소속 사이트 계획서 조회 (계획서에 따라 교정 실행)
 * - technical_manager: 소속 사이트 계획서 조회/작성/제출
 * - quality_manager: 전체 계획서 조회 (검토 역할 — 크로스 사이트 가시성 필요)
 * - lab_manager: 전체 계획서 조회/최종 승인
 * - system_admin: 전체 계획서 조회
 *
 * ⚠️ 주의: CalibrationPlanQueryInput이 `site` 대신 `siteId` 필드를 사용하므로
 * `@SiteScoped({ policy: CALIBRATION_PLAN_DATA_SCOPE, siteField: 'siteId' })`로 사용합니다.
 */
export const CALIBRATION_PLAN_DATA_SCOPE: FeatureScopePolicy = {
  test_engineer: { type: 'site', label: '소속 사이트 교정계획서' },
  technical_manager: { type: 'site', label: '소속 사이트 교정계획서' },
  quality_manager: { type: 'all', label: '전체 교정계획서' },
  lab_manager: { type: 'all', label: '전체 교정계획서' },
  system_admin: { type: 'all', label: '전체 교정계획서' },
};

/**
 * 소프트웨어(Software) 데이터 스코프 정책
 *
 * 소프트웨어 변경 이력은 장비에 종속되므로 장비와 동일한 사이트 기준.
 * - test_engineer: 소속 사이트 소프트웨어 이력만 조회
 * - technical_manager: 전체 소프트웨어 이력 조회/승인 (크로스 사이트 승인 필요)
 * - quality_manager: 전체 소프트웨어 이력 조회
 * - lab_manager: 전체 소프트웨어 이력 조회
 * - system_admin: 전체 소프트웨어 이력 조회
 */
export const SOFTWARE_DATA_SCOPE: FeatureScopePolicy = {
  test_engineer: { type: 'site', label: '소속 사이트 소프트웨어' },
  technical_manager: { type: 'all', label: '전체 소프트웨어' },
  quality_manager: { type: 'all', label: '전체 소프트웨어' },
  lab_manager: { type: 'all', label: '전체 소프트웨어' },
  system_admin: { type: 'all', label: '전체 소프트웨어' },
};

/**
 * 사용자(User) 데이터 스코프 정책
 *
 * 사용자 목록 조회 범위를 역할별로 명시합니다.
 * - test_engineer: 소속 사이트 사용자만 조회 (동료 조회, 팀 편성 등)
 * - technical_manager: 소속 사이트 사용자 조회 (사이트 내 팀 관리)
 * - quality_manager: 전체 사용자 조회 (교정계획서 검토 — 크로스 사이트 가시성 필요)
 * - lab_manager: 전체 사용자 조회 (시험소 전체 인원 관리)
 * - system_admin: 전체 사용자 조회
 *
 * ⚠️ bypassRoles 레거시 모드에서 마이그레이션:
 * 기존에 quality_manager는 bypassRoles에 없어 암묵적으로 site 필터를 받았으나,
 * 교정계획서 검토 역할상 전체 가시성이 필요하므로 `all`로 명시 변경.
 */
export const USER_DATA_SCOPE: FeatureScopePolicy = {
  test_engineer: { type: 'site', label: '소속 사이트 사용자' },
  technical_manager: { type: 'site', label: '소속 사이트 사용자' },
  quality_manager: { type: 'all', label: '전체 사용자' },
  lab_manager: { type: 'all', label: '전체 사용자' },
  system_admin: { type: 'all', label: '전체 사용자' },
};

/**
 * 알림(Notification) 관리자 스코프 정책
 *
 * 사용자 대면 엔드포인트에는 적용하지 않음 (사용자는 역할 무관하게 자신의 알림 조회).
 * 관리자 "사이트별 전체 알림 현황" 엔드포인트에만 적용.
 * recipientSite 컬럼 기반 필터링.
 *
 * - test_engineer: 접근 불가 (관리자 기능)
 * - technical_manager: 소속 사이트 알림 현황
 * - quality_manager: 소속 사이트 알림 현황
 * - lab_manager: 소속 사이트 알림 현황
 * - system_admin: 전체 알림 현황
 *
 * ⚠️ TM에 'team' 대신 'site' 사용하는 이유:
 * 디스패처가 per-user 알림 생성 시 notifications.teamId = null로 설정.
 * 즉 team 필터링하면 결과 0건. recipientSite 기반 site 필터가 의미론적으로 정확.
 */
export const NOTIFICATION_DATA_SCOPE: FeatureScopePolicy = {
  test_engineer: { type: 'none', label: '접근 불가' },
  technical_manager: { type: 'site', label: '소속 사이트 알림' },
  quality_manager: { type: 'site', label: '소속 사이트 알림' },
  lab_manager: { type: 'site', label: '소속 사이트 알림' },
  system_admin: { type: 'all', label: '전체 알림' },
};

/**
 * 사용자 스코프 컨텍스트 (해석기 입력)
 */
export interface UserScopeContext {
  role: UserRole;
  site?: string;
  teamId?: string;
}

/**
 * 해석된 데이터 스코프 (필터 조건으로 사용)
 */
export interface ResolvedDataScope {
  type: DataScopeType;
  site?: string;
  teamId?: string;
  label: string;
}

/**
 * 정책 + 사용자 컨텍스트 → 실제 필터 조건 (순수 함수)
 *
 * @param user - 현재 사용자의 역할/사이트/팀 정보
 * @param policy - 기능별 스코프 정책 객체
 * @returns 해석된 스코프 (type + 필터 값 + UI 라벨)
 *
 * @example
 * ```typescript
 * const scope = resolveDataScope(
 *   { role: 'lab_manager', site: 'SUW', teamId: 'team-1' },
 *   AUDIT_LOG_SCOPE
 * );
 * // → { type: 'site', site: 'SUW', label: '소속 사이트 활동 기록' }
 * ```
 */
export function resolveDataScope(
  user: UserScopeContext,
  policy: FeatureScopePolicy
): ResolvedDataScope {
  const p = policy[user.role];
  if (!p || p.type === 'none') {
    return { type: 'none', label: p?.label ?? '접근 불가' };
  }

  switch (p.type) {
    case 'team':
      return { type: 'team', teamId: user.teamId, label: p.label };
    case 'site':
      return { type: 'site', site: user.site, label: p.label };
    case 'all':
      return { type: 'all', label: p.label };
  }
}
