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
 * ============================================================================
 * 역할별 스코프 원칙 (UL-QP-18 + 비즈니스 확인 2026-03-19)
 * ============================================================================
 *
 * TE (시험실무자): 기본 team. 장비 목록만 all (타 사이트 대여 장비 탐색용)
 * TM (기술책임자): 기본 team. 장비 목록만 all (타 사이트 장비 대여 관리용)
 * QM (품질책임자): 회사 1명 → 전체 all
 * LM (시험소장):   자기 사이트 관리 → 전체 site
 * SA (시스템관리자): 전체 all
 * ============================================================================
 */

/** 감사 로그: 행위자(actor) 기준 필터링 */
export const AUDIT_LOG_SCOPE: FeatureScopePolicy = {
  test_engineer: { type: 'none', label: '접근 불가' },
  technical_manager: { type: 'team', label: '소속 팀 활동 기록' },
  quality_manager: { type: 'all', label: '전체 활동 기록' },
  lab_manager: { type: 'site', label: '소속 사이트 활동 기록' },
  system_admin: { type: 'all', label: '전체 활동 기록' },
};

/** 장비 목록: TE/TM 모두 all (타 사이트 장비 대여 확인용) */
export const EQUIPMENT_DATA_SCOPE: FeatureScopePolicy = {
  test_engineer: { type: 'all', label: '전체 장비' },
  technical_manager: { type: 'all', label: '전체 장비' },
  quality_manager: { type: 'all', label: '전체 장비' },
  lab_manager: { type: 'site', label: '소속 사이트 장비' },
  system_admin: { type: 'all', label: '전체 장비' },
};

/** 반출: 팀 단위 관리. 크로스 사이트 렌탈 지원. */
export const CHECKOUT_DATA_SCOPE: FeatureScopePolicy = {
  test_engineer: { type: 'team', label: '소속 팀 반출' },
  technical_manager: { type: 'team', label: '소속 팀 반출' },
  quality_manager: { type: 'all', label: '전체 반출' },
  lab_manager: { type: 'site', label: '소속 사이트 반출' },
  system_admin: { type: 'all', label: '전체 반출' },
};

/** 부적합: 팀 장비 기준 관리 */
export const NON_CONFORMANCE_DATA_SCOPE: FeatureScopePolicy = {
  test_engineer: { type: 'team', label: '소속 팀 부적합' },
  technical_manager: { type: 'team', label: '소속 팀 부적합' },
  quality_manager: { type: 'all', label: '전체 부적합' },
  lab_manager: { type: 'site', label: '소속 사이트 부적합' },
  system_admin: { type: 'all', label: '전체 부적합' },
};

/** 교정 기록: 팀 장비 기준 관리 */
export const CALIBRATION_DATA_SCOPE: FeatureScopePolicy = {
  test_engineer: { type: 'team', label: '소속 팀 교정 기록' },
  technical_manager: { type: 'team', label: '소속 팀 교정 기록' },
  quality_manager: { type: 'all', label: '전체 교정 기록' },
  lab_manager: { type: 'site', label: '소속 사이트 교정 기록' },
  system_admin: { type: 'all', label: '전체 교정 기록' },
};

/** 장비 반입: 팀 장비 기준 관리 */
export const EQUIPMENT_IMPORT_DATA_SCOPE: FeatureScopePolicy = {
  test_engineer: { type: 'team', label: '소속 팀 반입 기록' },
  technical_manager: { type: 'team', label: '소속 팀 반입 기록' },
  quality_manager: { type: 'all', label: '전체 반입 기록' },
  lab_manager: { type: 'site', label: '소속 사이트 반입 기록' },
  system_admin: { type: 'all', label: '전체 반입 기록' },
};

/** 중간점검: 팀 장비 기준 관리 */
export const INTERMEDIATE_CHECK_DATA_SCOPE: FeatureScopePolicy = {
  test_engineer: { type: 'team', label: '소속 팀 중간점검' },
  technical_manager: { type: 'team', label: '소속 팀 중간점검' },
  quality_manager: { type: 'all', label: '전체 중간점검' },
  lab_manager: { type: 'site', label: '소속 사이트 중간점검' },
  system_admin: { type: 'all', label: '전체 중간점검' },
};

/**
 * 교정계획서: 팀 장비 기준 관리
 *
 * 3단계 승인: TM 제출 → QM 검토 → LM 승인
 * ⚠️ CalibrationPlanQueryInput이 `site` 대신 `siteId` 필드를 사용하므로
 * `@SiteScoped({ policy: CALIBRATION_PLAN_DATA_SCOPE, siteField: 'siteId' })`로 사용
 */
export const CALIBRATION_PLAN_DATA_SCOPE: FeatureScopePolicy = {
  test_engineer: { type: 'team', label: '소속 팀 교정계획서' },
  technical_manager: { type: 'team', label: '소속 팀 교정계획서' },
  quality_manager: { type: 'all', label: '전체 교정계획서' },
  lab_manager: { type: 'site', label: '소속 사이트 교정계획서' },
  system_admin: { type: 'all', label: '전체 교정계획서' },
};

/** 소프트웨어: 팀 장비에 종속된 소프트웨어 유효성 확인 */
export const SOFTWARE_DATA_SCOPE: FeatureScopePolicy = {
  test_engineer: { type: 'team', label: '소속 팀 소프트웨어' },
  technical_manager: { type: 'team', label: '소속 팀 소프트웨어' },
  quality_manager: { type: 'all', label: '전체 소프트웨어' },
  lab_manager: { type: 'site', label: '소속 사이트 소프트웨어' },
  system_admin: { type: 'all', label: '전체 소프트웨어' },
};

/** 사용자 목록: 팀 내 동료 조회 기준 */
export const USER_DATA_SCOPE: FeatureScopePolicy = {
  test_engineer: { type: 'team', label: '소속 팀 사용자' },
  technical_manager: { type: 'site', label: '소속 사이트 사용자' },
  quality_manager: { type: 'all', label: '전체 사용자' },
  lab_manager: { type: 'site', label: '소속 사이트 사용자' },
  system_admin: { type: 'all', label: '전체 사용자' },
};

/** 알림 (관리자 뷰): 개인 알림은 역할 무관 — 관리자 현황 조회에만 적용 */
export const NOTIFICATION_DATA_SCOPE: FeatureScopePolicy = {
  test_engineer: { type: 'team', label: '소속 팀 알림' },
  technical_manager: { type: 'site', label: '소속 사이트 알림' },
  quality_manager: { type: 'all', label: '전체 알림' },
  lab_manager: { type: 'site', label: '소속 사이트 알림' },
  system_admin: { type: 'all', label: '전체 알림' },
};

/**
 * 폐기: 2단계 승인 (TM 검토 → LM 최종 승인)
 *
 * ⚠️ TM=team, LM=site로 스코프가 다르지만 단일 정책으로 관리.
 * ROLE_CATEGORIES에서 TM은 disposal_review만, LM은 disposal_final만 접근하므로
 * resolveDataScope()가 각 역할에 맞는 스코프를 자동 적용합니다.
 */
export const DISPOSAL_DATA_SCOPE: FeatureScopePolicy = {
  test_engineer: { type: 'team', label: '소속 팀 폐기 요청' },
  technical_manager: { type: 'team', label: '소속 팀 폐기 요청' },
  quality_manager: { type: 'all', label: '전체 폐기 요청' },
  lab_manager: { type: 'site', label: '소속 사이트 폐기 요청' },
  system_admin: { type: 'all', label: '전체 폐기 요청' },
};

/**
 * 대시보드: 복합 엔티티(장비/교정/반출) 중 가장 제한적 스코프 적용
 *
 * 대시보드는 장비(TE=all), 교정(TE=team), 반출(TE=team) 데이터를 혼합 표시.
 * 클라이언트 teamId 파라미터 검증에 사용 — 가장 제한적 정책(team)을 기준으로 함.
 * TE/TM=team이므로 자기 팀 데이터만, LM=site이므로 사이트 내 데이터만 표시.
 */
export const DASHBOARD_DATA_SCOPE: FeatureScopePolicy = {
  test_engineer: { type: 'team', label: '소속 팀 대시보드' },
  technical_manager: { type: 'team', label: '소속 팀 대시보드' },
  quality_manager: { type: 'all', label: '전체 대시보드' },
  lab_manager: { type: 'site', label: '소속 사이트 대시보드' },
  system_admin: { type: 'all', label: '전체 대시보드' },
};

/**
 * 장비 요청: 장비 등록/수정/삭제 요청의 승인 워크플로우
 *
 * ⚠️ EQUIPMENT_DATA_SCOPE(장비 목록 조회)와 별개.
 * 장비 조회는 TE/TM=all이지만, 요청 승인은 TM=team(직무분리).
 * JOIN 경로: equipmentRequests → users (requestedBy) → users.teamId
 */
export const EQUIPMENT_REQUEST_DATA_SCOPE: FeatureScopePolicy = {
  test_engineer: { type: 'team', label: '소속 팀 장비 요청' },
  technical_manager: { type: 'team', label: '소속 팀 장비 요청' },
  quality_manager: { type: 'all', label: '전체 장비 요청' },
  lab_manager: { type: 'site', label: '소속 사이트 장비 요청' },
  system_admin: { type: 'all', label: '전체 장비 요청' },
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
      // 팀 미배정 사용자는 데이터 접근 차단 (전체 노출 방지)
      if (!user.teamId) {
        return { type: 'none', label: '팀 미배정 — 접근 불가' };
      }
      return { type: 'team', teamId: user.teamId, label: p.label };
    case 'site':
      // 사이트 미배정 사용자는 데이터 접근 차단
      if (!user.site) {
        return { type: 'none', label: '사이트 미배정 — 접근 불가' };
      }
      return { type: 'site', site: user.site, label: p.label };
    case 'all':
      return { type: 'all', label: p.label };
  }
}
