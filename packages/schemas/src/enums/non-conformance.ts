import { z } from 'zod';

import type { IncidentType } from './incident';

/**
 * ⚠️ SINGLE SOURCE OF TRUTH: 부적합 상태 열거형
 *
 * 3단계 워크플로우: open → corrected → closed
 * - open: 부적합 등록 (발견됨)
 * - corrected: 조치 완료 (종결 승인 대기)
 * - closed: 종료됨 (기술책임자 승인)
 */
export const NON_CONFORMANCE_STATUS_VALUES = [
  'open', // 부적합 등록 (발견됨)
  'corrected', // 조치 완료 (종결 승인 대기)
  'closed', // 종료됨 (기술책임자 승인)
] as const;

export const NonConformanceStatusEnum = z.enum(NON_CONFORMANCE_STATUS_VALUES);
export type NonConformanceStatus = z.infer<typeof NonConformanceStatusEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 부적합 유형 열거형
 *
 * 표준 유형값 (소문자 + 언더스코어):
 * - damage: 손상
 * - malfunction: 오작동
 * - calibration_failure: 교정 실패
 * - measurement_error: 측정 오류
 * - other: 기타
 */
export const NON_CONFORMANCE_TYPE_VALUES = [
  'damage', // 손상
  'malfunction', // 오작동
  'calibration_failure', // 교정 실패
  'calibration_overdue', // 교정 기한 초과
  'measurement_error', // 측정 오류
  'other', // 기타
] as const;

export const NonConformanceTypeEnum = z.enum(NON_CONFORMANCE_TYPE_VALUES);
export type NonConformanceType = z.infer<typeof NonConformanceTypeEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 수리 기록이 필수인 부적합 유형
 *
 * damage(손상), malfunction(오작동) 유형은 종결 전 수리 이력 연결 필수
 * (UL-QP-18: 손상/오작동은 수리 완료 후에만 시정 조치 인정)
 *
 * @deprecated NC_CORRECTION_PREREQUISITES 사용 권장 — 유형별 전제조건을 통합 관리
 */
export const REPAIR_REQUIRING_NC_TYPES: readonly NonConformanceType[] = [
  'damage',
  'malfunction',
] as const;

// ============================================================================
// 부적합 유형별 조치 완료 전제조건 레지스트리 (SSOT)
// ============================================================================

/**
 * SINGLE SOURCE OF TRUTH: 부적합 유형별 조치 완료(open→corrected) 전제조건
 *
 * - 'repair': 수리 이력 연결 필수 (repairHistoryId)
 * - 'recalibration': 승인된 교정 기록 연결 필수 (calibrationId)
 * - null: 전제조건 없음 (수동 조치 가능)
 *
 * UL-QP-18 근거:
 * - damage/malfunction: 수리 완료 후에만 시정 조치 인정
 * - calibration_overdue: 재교정 완료가 유일한 해소 방법
 * - calibration_failure/measurement_error/other: 원인 분석 후 자유 조치
 */
export type NCPrerequisiteType = 'repair' | 'recalibration';

export const NC_CORRECTION_PREREQUISITES: Readonly<
  Record<NonConformanceType, NCPrerequisiteType | null>
> = {
  damage: 'repair',
  malfunction: 'repair',
  calibration_overdue: 'recalibration',
  calibration_failure: null,
  measurement_error: null,
  other: null,
} as const;

/** 특정 전제조건이 필요한 NC 유형 목록 조회 */
export function getNCTypesRequiring(prerequisite: NCPrerequisiteType): NonConformanceType[] {
  return (
    Object.entries(NC_CORRECTION_PREREQUISITES) as [NonConformanceType, NCPrerequisiteType | null][]
  )
    .filter(([, req]) => req === prerequisite)
    .map(([type]) => type);
}

/** NC 유형의 전제조건 조회 */
export function getNCPrerequisite(ncType: string): NCPrerequisiteType | null {
  return NC_CORRECTION_PREREQUISITES[ncType as NonConformanceType] ?? null;
}

/**
 * SINGLE SOURCE OF TRUTH: 해결 유형 열거형
 *
 * 표준 유형값 (소문자 + 언더스코어):
 * - repair: 수리
 * - recalibration: 재교정
 * - replacement: 교체
 * - disposal: 폐기
 * - other: 기타
 */
export const RESOLUTION_TYPE_VALUES = [
  'repair', // 수리
  'recalibration', // 재교정
  'replacement', // 교체
  'disposal', // 폐기
  'other', // 기타
] as const;

export const ResolutionTypeEnum = z.enum(RESOLUTION_TYPE_VALUES);
export type ResolutionType = z.infer<typeof ResolutionTypeEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 수리 결과 열거형
 *
 * 표준 결과값 (소문자):
 * - completed: 완료
 * - partial: 부분 완료
 * - failed: 실패
 */
export const REPAIR_RESULT_VALUES = ['completed', 'partial', 'failed'] as const;

export const RepairResultEnum = z.enum(REPAIR_RESULT_VALUES);
export type RepairResult = z.infer<typeof RepairResultEnum>;

// ============================================================================
// 부적합 등록이 가능한 사고 유형 (damage, malfunction만 NC 생성 가능)
// ============================================================================

/** 사고 이력에서 부적합(NC)을 생성할 수 있는 유형 */
export const NC_CREATING_INCIDENT_TYPES: readonly IncidentType[] = [
  'damage',
  'malfunction',
] as const;

/** 주어진 사고 유형이 NC 생성 가능한 유형인지 확인하는 타입 가드 */
export function isNcCreatingIncidentType(type: string): type is IncidentType {
  return (NC_CREATING_INCIDENT_TYPES as readonly string[]).includes(type);
}

// ============================================================================
// 사고이력/수리이력에서 수리 필요 표시가 필요한 부적합 유형
// ============================================================================

/** REPAIR_REQUIRING_NC_TYPES(2개)의 확장 — 사고이력/수리이력 탭에서 "수리 필요" 아이콘 표시 대상 */
export const INCIDENT_REPAIR_NC_TYPES: readonly NonConformanceType[] = [
  'damage',
  'malfunction',
  'calibration_failure',
  'measurement_error',
] as const;
