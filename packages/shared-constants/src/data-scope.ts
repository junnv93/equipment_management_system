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
