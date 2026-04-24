import type { EquipmentStatus, ManagementMethod, UserRole } from './equipment';
import { EquipmentStatusEnum, ManagementMethodEnum, UserRoleEnum } from './equipment';
import type { EquipmentClassification, InspectionJudgment } from './intermediate-inspection';
import type { SelfInspectionItemJudgment } from './self-inspection';
import type { CheckoutStatus, CheckoutPurpose, CheckoutType } from './checkout';
import type {
  CalibrationApprovalStatus,
  CalibrationFactorApprovalStatus,
  CalibrationFactorType,
  CalibrationResult,
} from './calibration';
import type { CalibrationPlanStatus } from './calibration-plan';
import type {
  NonConformanceStatus,
  NonConformanceType,
  ResolutionType,
  RepairResult,
} from './non-conformance';
import type { TestField, SoftwareAvailability, ValidationStatus } from './software';
import type { IncidentType } from './incident';
import type { TimelineEntryType } from '../equipment-history';
import type { NotificationPriority } from './notification';
import type {
  ReturnCondition,
  ConditionCheckStep,
  ConditionStatus,
  AccessoriesStatus,
} from './return-condition';
import type { UnifiedApprovalStatus } from './approval';
import type { DisposalReason, DisposalReviewStatus } from './disposal';
import type { EquipmentImportSource, EquipmentImportStatus } from './equipment-import';
import type { UserStatus, SharedSource } from './shared';

// ============================================================================
// LABELS 맵 정의 (서버 사이드 전용 — 백엔드 응답, 로그, 알림 등)
//
// ⚠️ 프론트엔드 UI에서는 이 라벨을 직접 import하지 마세요.
//    대신 lib/i18n/use-enum-labels.ts의 hook을 사용하세요:
//    - useSiteLabels()              → SITE_LABELS 대체
//    - useClassificationLabels()    → CLASSIFICATION_LABELS 대체
//    - useManagementMethodLabels() → MANAGEMENT_METHOD_LABELS 대체
//    i18n 메시지 키:
//    - equipment.siteLabel.*        / equipment.classification.*
//    - equipment.filters.managementMethodLabel.*
//    - checkouts.status.*           / calibration.planStatus.*
// ============================================================================

/**
 * 장비 상태 라벨 (UI 표시용)
 *
 * @remarks 서버 사이드 전용 — 프론트엔드 UI 표시에는 i18n 메시지(equipment.status.*)를 사용하세요.
 */
export const EQUIPMENT_STATUS_VALUES = EquipmentStatusEnum.options;
export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  available: '사용 가능',
  checked_out: '반출 중',
  non_conforming: '부적합',
  spare: '여분',
  pending_disposal: '폐기대기',
  disposed: '폐기완료',
  temporary: '임시등록',
  inactive: '비활성',
};

/**
 * UI 필터에 표시할 장비 상태 목록
 * - temporary, inactive: 내부 공용/렌탈 장비 워크플로 전용이므로 제외
 */
export const EQUIPMENT_STATUS_FILTER_OPTIONS: EquipmentStatus[] = [
  'available',
  'checked_out',
  'non_conforming',
  'spare',
  'pending_disposal',
  'disposed',
];

/**
 * UI 필터에 표시할 반출 상태 목록
 * - 모든 주요 상태를 포함하되, 사용자가 필터링할 수 있는 상태만 포함
 */
export const CHECKOUT_STATUS_FILTER_OPTIONS: CheckoutStatus[] = [
  'pending',
  'borrower_approved',
  'approved',
  'checked_out',
  'returned',
  'return_approved',
  'overdue',
  'rejected',
  'canceled',
  'lender_checked',
  'borrower_received',
  'in_use',
  'borrower_returned',
  'lender_received',
];

/**
 * 반출 상태 그룹 (Stat 카드 필터용 SSOT)
 *
 * 대시보드 Stat 카드에서 여러 상태를 묶어 필터링할 때 사용.
 * key = 그룹 식별자 (i18n statusGroup.{key}와 1:1 대응)
 * value = 해당 그룹에 속하는 CheckoutStatus 배열
 */
export const CHECKOUT_STATUS_GROUPS = {
  /** 진행 중 (반출~반입 전 모든 단계) */
  in_progress: [
    'borrower_approved',
    'checked_out',
    'lender_checked',
    'borrower_received',
    'in_use',
    'borrower_returned',
    'lender_received',
  ] as const satisfies readonly CheckoutStatus[],
  /** 반입 완료 (반입됨 + 반입 승인) */
  completed: ['returned', 'return_approved'] as const satisfies readonly CheckoutStatus[],
} as const;

export type CheckoutStatusGroupKey = keyof typeof CHECKOUT_STATUS_GROUPS;

/** 그룹 키 → 쉼표 구분 필터 값 변환 */
export function getCheckoutStatusGroupFilterValue(groupKey: CheckoutStatusGroupKey): string {
  return CHECKOUT_STATUS_GROUPS[groupKey].join(',');
}

/** 쉼표 구분 필터 값 → 그룹 키 역변환 (없으면 null) */
export function findCheckoutStatusGroupKey(filterValue: string): CheckoutStatusGroupKey | null {
  for (const [key, statuses] of Object.entries(CHECKOUT_STATUS_GROUPS)) {
    if (statuses.join(',') === filterValue) {
      return key as CheckoutStatusGroupKey;
    }
  }
  return null;
}

/**
 * 관리 방법 라벨 (UI 표시용)
 *
 * @remarks 서버 사이드 전용 — 프론트엔드 UI 표시에는 i18n 메시지(equipment.managementMethod.*)를 사용하세요.
 */
export const MANAGEMENT_METHOD_VALUES = ManagementMethodEnum.options;
export const MANAGEMENT_METHOD_LABELS: Record<ManagementMethod, string> = {
  external_calibration: '외부 교정',
  self_inspection: '자체 점검',
  not_applicable: '비대상',
};

/**
 * 사용자 역할 라벨 (UI 표시용)
 *
 * @remarks 서버 사이드 전용 — 프론트엔드 UI 표시에는 i18n 메시지(navigation.roles.*)를 사용하세요.
 */
export const USER_ROLE_VALUES = UserRoleEnum.options;
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  test_engineer: '시험실무자',
  technical_manager: '기술책임자',
  quality_manager: '품질책임자',
  lab_manager: '시험소장',
  system_admin: '시스템 관리자',
};

/**
 * 반출 상태 라벨 (UI 표시용)
 *
 * @remarks 서버 사이드 전용 — 프론트엔드 UI 표시에는 i18n 메시지(checkouts.status.*)를 사용하세요.
 */
export const CHECKOUT_STATUS_LABELS: Record<CheckoutStatus, string> = {
  pending: '승인 대기',
  borrower_approved: '1차 승인됨 (lender 승인 대기)',
  approved: '승인됨',
  rejected: '거절됨',
  checked_out: '반출 중',
  // 대여 목적 양측 확인 상태 라벨
  lender_checked: '반출 전 확인 완료',
  borrower_received: '인수 확인 완료',
  in_use: '사용 중',
  borrower_returned: '반납 전 확인 완료',
  lender_received: '반입 확인 완료',
  returned: '반입 완료',
  return_approved: '반입 승인됨',
  overdue: '기한 초과',
  canceled: '취소됨',
};

/**
 * 반출 목적 라벨 (UI 표시용)
 *
 * @remarks 서버 사이드 전용 — 프론트엔드 UI 표시에는 i18n 메시지(checkouts.purpose.*)를 사용하세요.
 */
export const CHECKOUT_PURPOSE_LABELS: Record<CheckoutPurpose, string> = {
  calibration: '교정',
  repair: '수리',
  rental: '대여',
  return_to_vendor: '렌탈 반납',
};

/**
 * 반출 유형 라벨 (마이그레이션 참고값 시트용)
 */
export const CHECKOUT_TYPE_LABELS: Record<CheckoutType, string> = {
  calibration: '교정',
  repair: '수리',
  rental: '대여',
};

/**
 * 공용장비 출처 라벨 (마이그레이션 참고값 시트용)
 */
export const SHARED_SOURCE_LABELS: Record<SharedSource, string> = {
  safety_lab: '시험소 공용',
  external: '외부 렌탈',
  internal_shared: '내부 공용',
};

/**
 * 부적합 상태 라벨 (UI 표시용)
 *
 * @remarks 서버 사이드 전용 — 프론트엔드 UI 표시에는 i18n 메시지(nonConformances.status.*)를 사용하세요.
 */
export const NON_CONFORMANCE_STATUS_LABELS: Record<NonConformanceStatus, string> = {
  open: '등록됨',
  corrected: '조치 완료',
  closed: '종료됨',
};

/**
 * 부적합 유형 라벨 (UI 표시용)
 *
 * @remarks 서버 사이드 전용 — 프론트엔드 UI 표시에는 i18n 메시지(nonConformances.type.*)를 사용하세요.
 */
export const NON_CONFORMANCE_TYPE_LABELS: Record<NonConformanceType, string> = {
  damage: '손상',
  malfunction: '오작동',
  calibration_failure: '교정 실패',
  calibration_overdue: '교정 기한 초과',
  measurement_error: '측정 오류',
  other: '기타',
};

/**
 * 해결 유형 라벨 (UI 표시용)
 *
 * @remarks 서버 사이드 전용 — 프론트엔드 UI 표시에는 i18n 메시지(nonConformances.resolutionType.*)를 사용하세요.
 */
export const RESOLUTION_TYPE_LABELS: Record<ResolutionType, string> = {
  repair: '수리',
  recalibration: '재교정',
  replacement: '교체',
  disposal: '폐기',
  other: '기타',
};

/**
 * 수리 결과 라벨 (UI 표시용)
 *
 * @remarks 서버 사이드 전용 — 프론트엔드 UI 표시에는 i18n 메시지(nonConformances.repairResult.*)를 사용하세요.
 */
export const REPAIR_RESULT_LABELS: Record<RepairResult, string> = {
  completed: '완료',
  partial: '부분 완료',
  failed: '실패',
};

/**
 * 사용자 상태 라벨 (UI 표시용)
 *
 * @remarks 서버 사이드 전용 — 프론트엔드 UI 표시에는 i18n 메시지를 사용하세요.
 */
export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: '활성',
  inactive: '비활성',
  pending: '승인 대기',
};

/**
 * 알림 우선순위 라벨 (UI 표시용)
 *
 * @remarks 서버 사이드 전용 — 프론트엔드 UI 표시에는 i18n 메시지(notifications.priority.*)를 사용하세요.
 */
export const NOTIFICATION_PRIORITY_LABELS: Record<NotificationPriority, string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
};

/**
 * 반납 상태 라벨 (UI 표시용)
 *
 * @remarks 서버 사이드 전용 — 프론트엔드 UI 표시에는 i18n 메시지(checkouts.returnCondition.*)를 사용하세요.
 */
export const RETURN_CONDITION_LABELS: Record<ReturnCondition, string> = {
  good: '양호',
  damaged: '손상',
  lost: '분실',
  needs_repair: '수리 필요',
  needs_calibration: '교정 필요',
};

/**
 * 보정계수 타입 라벨 (UI 표시용)
 *
 * @remarks 서버 사이드 전용 — 프론트엔드 UI 표시에는 i18n 메시지(calibrationFactors.type.*)를 사용하세요.
 */
export const CALIBRATION_FACTOR_TYPE_LABELS: Record<CalibrationFactorType, string> = {
  antenna_gain: '안테나 이득',
  cable_loss: '케이블 손실',
  path_loss: '경로 손실',
  amplifier_gain: '증폭기 이득',
  other: '기타',
};

/**
 * 시험분야 라벨 (UI 표시용)
 *
 * @remarks 서버 사이드 전용 — 프론트엔드 UI 표시에는 i18n 메시지(software.testField.*)를 사용하세요.
 */
export const TEST_FIELD_LABELS: Record<TestField, string> = {
  RF: 'RF 시험',
  SAR: 'SAR 시험',
  EMC: 'EMC 시험',
  RED: 'RED 시험',
  HAC: 'HAC 시험',
};

/**
 * 소프트웨어 가용 여부 라벨 (UI 표시용)
 */
export const SOFTWARE_AVAILABILITY_LABELS: Record<SoftwareAvailability, string> = {
  available: '가용',
  unavailable: '불가',
};

/**
 * 사고 유형 라벨 (UI 표시용)
 *
 * @remarks 서버 사이드 전용 — 프론트엔드 UI 표시에는 i18n 메시지(equipment.incidentType.*)를 사용하세요.
 */
export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  damage: '손상',
  malfunction: '오작동',
  change: '변경',
  repair: '수리',
  calibration_overdue: '교정 기한 초과',
};

/**
 * 통합 이력 엔트리 유형 라벨 (UL-QP-18-02 이력카드 "손상/오작동/변경/수리" 섹션용).
 *
 * IncidentType 5종 + 단독 레코드 2종을 합쳐 이력카드 행 prefix로 사용.
 * 예: `[수리] N-타입 커넥터 핀 교체` / `[부적합] 측정 오차 0.5dB 초과`
 *
 * @remarks 서버 사이드 전용 (docx 렌더링). 프론트엔드 UI는 i18n 메시지 사용.
 * @see packages/schemas/src/equipment-history.ts — TimelineEntryTypeEnum
 */
export const TIMELINE_ENTRY_TYPE_LABELS: Record<TimelineEntryType, string> = {
  damage: '손상',
  malfunction: '오작동',
  change: '변경',
  repair: '수리',
  calibration_overdue: '교정 기한 초과',
  repair_record: '수리',
  non_conformance: '부적합',
};

/**
 * 교정계획서 상태 라벨 (UI 표시용)
 *
 * 참고: pending_review 상태의 라벨이 "확인 대기"로 변경됨 (UX 단순화)
 * - 품질책임자의 "검토" 단계가 "확인" 단계로 단순화됨
 * - 다이얼로그 기반 3클릭 → 타임라인 내 원클릭 확인으로 개선
 *
 * @remarks 서버 사이드 전용 — 프론트엔드 UI 표시에는 i18n 메시지(calibrationPlans.status.*)를 사용하세요.
 */
export const CALIBRATION_PLAN_STATUS_LABELS: Record<CalibrationPlanStatus, string> = {
  draft: '작성 중',
  pending_review: '확인 대기',
  pending_approval: '승인 대기',
  approved: '승인됨',
  rejected: '반려됨',
};

/**
 * 교정 승인 상태 라벨 (UI 표시용)
 *
 * @remarks 서버 사이드 전용 — 프론트엔드 UI 표시에는 i18n 메시지(calibration.approvalStatus.*)를 사용하세요.
 */
export const CALIBRATION_APPROVAL_STATUS_LABELS: Record<CalibrationApprovalStatus, string> = {
  pending_approval: '승인 대기',
  approved: '승인됨',
  rejected: '반려됨',
};

/**
 * 교정 결과 라벨 (UI 표시용)
 *
 * @remarks 서버 사이드 전용 — 프론트엔드 UI 표시에는 i18n 메시지(calibration.result.*)를 사용하세요.
 */
export const CALIBRATION_RESULT_LABELS: Record<CalibrationResult, string> = {
  pass: '적합',
  fail: '부적합',
  conditional: '조건부 적합',
};

/**
 * 보정계수 승인 상태 라벨 (UI 표시용)
 *
 * @remarks 서버 사이드 전용 — 프론트엔드 UI 표시에는 i18n 메시지(calibrationFactors.approvalStatus.*)를 사용하세요.
 */
export const CALIBRATION_FACTOR_APPROVAL_STATUS_LABELS: Record<
  CalibrationFactorApprovalStatus,
  string
> = {
  pending: '승인 대기',
  approved: '승인됨',
  rejected: '반려됨',
};

/**
 * 유효성 확인 상태 라벨 (UI 표시용)
 *
 * @remarks 서버 사이드 전용 — 프론트엔드 UI 표시에는 i18n 메시지(software.validationStatus.*)를 사용하세요.
 */
export const VALIDATION_STATUS_LABELS: Record<ValidationStatus, string> = {
  draft: '초안',
  submitted: '제출됨',
  approved: '기술 승인',
  quality_approved: '최종 승인',
  rejected: '반려됨',
};

/**
 * 상태 확인 단계 라벨 (UI 표시용)
 *
 * @remarks 서버 사이드 전용 — 프론트엔드 UI 표시에는 i18n 메시지(checkouts.conditionCheckStep.*)를 사용하세요.
 */
export const CONDITION_CHECK_STEP_LABELS: Record<ConditionCheckStep, string> = {
  lender_checkout: '① 반출 전 확인 (빌려주는 측)',
  borrower_receive: '② 인수 시 확인 (빌리는 측)',
  borrower_return: '③ 반납 전 확인 (빌린 측)',
  lender_return: '④ 반입 시 확인 (빌려준 측)',
};

/**
 * 외관/작동 상태 라벨 (UI 표시용)
 *
 * @remarks 서버 사이드 전용 — 프론트엔드 UI 표시에는 i18n 메시지(checkouts.conditionStatus.*)를 사용하세요.
 */
export const CONDITION_STATUS_LABELS: Record<ConditionStatus, string> = {
  normal: '정상',
  abnormal: '이상',
};

/**
 * 부속품 상태 라벨 (UI 표시용)
 *
 * @remarks 서버 사이드 전용 — 프론트엔드 UI 표시에는 i18n 메시지(checkouts.accessoriesStatus.*)를 사용하세요.
 */
export const ACCESSORIES_STATUS_LABELS: Record<AccessoriesStatus, string> = {
  complete: '완전',
  incomplete: '불완전',
};

/**
 * 통합 승인 상태 라벨 (UI 표시용)
 *
 * @remarks 서버 사이드 전용 — 프론트엔드 UI 표시에는 i18n 메시지(approvals.status.*)를 사용하세요.
 */
export const UNIFIED_APPROVAL_STATUS_LABELS: Record<UnifiedApprovalStatus, string> = {
  pending: '대기',
  pending_review: '검토 대기',
  reviewed: '검토 완료',
  approved: '승인 완료',
  rejected: '반려',
};

/**
 * 폐기 사유 라벨 (UI 표시용)
 *
 * @remarks 서버 사이드 전용 — 프론트엔드 UI 표시에는 i18n 메시지(disposal.reason.*)를 사용하세요.
 */
export const DISPOSAL_REASON_LABELS: Record<DisposalReason, string> = {
  obsolete: '노후화',
  broken: '고장 (수리 불가)',
  inaccurate: '정밀도/정확도 미보장',
  other: '기타',
};

/**
 * 폐기 검토 상태 라벨 (UI 표시용)
 *
 * @remarks 서버 사이드 전용 — 프론트엔드 UI 표시에는 i18n 메시지(disposal.reviewStatus.*)를 사용하세요.
 */
export const DISPOSAL_REVIEW_STATUS_LABELS: Record<DisposalReviewStatus, string> = {
  pending: '검토 대기',
  reviewed: '검토 완료',
  approved: '승인 완료',
  rejected: '반려됨',
};

/**
 * 장비 반입 출처 라벨 (UI 표시용)
 *
 * @remarks 서버 사이드 전용 — 프론트엔드 UI 표시에는 i18n 메시지(equipmentImports.source.*)를 사용하세요.
 */
export const EQUIPMENT_IMPORT_SOURCE_LABELS: Record<EquipmentImportSource, string> = {
  rental: '외부 렌탈',
  internal_shared: '내부 공용',
};

/**
 * 장비 반입 상태 라벨 (UI 표시용)
 *
 * @remarks 서버 사이드 전용 — 프론트엔드 UI 표시에는 i18n 메시지(equipmentImports.status.*)를 사용하세요.
 */
export const EQUIPMENT_IMPORT_STATUS_LABELS: Record<EquipmentImportStatus, string> = {
  pending: '승인 대기',
  approved: '승인됨',
  rejected: '거절됨',
  received: '수령 완료',
  return_requested: '반납 진행 중',
  returned: '반납 완료',
  canceled: '취소됨',
};

// ============================================================================
// UL-QP-18 양식 전용 라벨 SSOT (서버 사이드 렌더러 전용)
//
// 프론트엔드 UI 사용 금지 — i18n 메시지(equipment.classification.*, ...) 사용.
// 양식 원본 참조: docs/procedure/template/UL-QP-18-0{1,3,5}*.{docx,xlsx}
// ============================================================================

/**
 * 장비 분류 라벨 — UL-QP-18-03/18-05 양식 헤더 "분류" 셀 출력용.
 *
 * 값: 교정기기 / 비교정기기 (양식 원본 T0 R0 C1 선택지 고정).
 * 이 라벨은 양식 원본 텍스트와 동일해야 하므로 i18n 번역 대상이 아님.
 */
export const QP18_CLASSIFICATION_LABELS: Record<
  EquipmentClassification,
  '교정기기' | '비교정기기'
> = {
  calibrated: '교정기기',
  non_calibrated: '비교정기기',
};

/**
 * 중간점검 판정 라벨 — UL-QP-18-03 양식 T0 R5 C4 "판정 (합격/불합격)" 출력용.
 *
 * 양식 원본 표기: "합격" / "불합격" 고정. 빈 값은 '-'로 표시.
 */
export const INSPECTION_JUDGMENT_LABELS: Record<InspectionJudgment, '합격' | '불합격'> = {
  pass: '합격',
  fail: '불합격',
};

/**
 * 자체점검 항목 판정 라벨 — UL-QP-18-05 양식 T0 R5+ "점검 결과" 출력용.
 *
 * 양식 원본 표기: "이상 없음" / "부적합" / "N/A" 고정.
 * SELF_INSPECTION_ITEM_JUDGMENT_VALUES ('pass', 'fail', 'na')와 1:1 매핑.
 */
export const SELF_INSPECTION_RESULT_LABELS: Record<
  SelfInspectionItemJudgment,
  '이상 없음' | '부적합' | 'N/A'
> = {
  pass: '이상 없음',
  fail: '부적합',
  na: 'N/A',
};

/**
 * UL-QP-18-01 시험설비 관리대장 "가용 여부" 컬럼 라벨.
 *
 * 양식 원본 선택지: 사용 / 고장 / 여분 (3종). 시스템 상태가 더 세분화되어 있어
 * 양식 렌더 시 축약 매핑 필요:
 * - 'available' | 'checked_out' | 'temporary' → '사용'
 * - 'non_conforming' → '고장'
 * - 'spare' | 'inactive' → '여분'
 * - 'pending_disposal' | 'disposed' → '불용' (양식 원본에 없으나 showRetired=true 시 표시)
 */
export const EQUIPMENT_AVAILABILITY_LABELS: Record<EquipmentStatus, string> = {
  available: '사용',
  checked_out: '사용',
  non_conforming: '고장',
  spare: '여분',
  pending_disposal: '불용',
  disposed: '불용',
  temporary: '사용',
  inactive: '여분',
};

/**
 * UL-QP-18-01 시험설비 관리대장 "중간점검 대상" 컬럼 라벨.
 *
 * 양식 원본 선택지: O / X 고정. boolean → 한글 O/X 매핑.
 * Record<string, ...> 대신 명시 튜플로 타입 안전성 확보.
 */
export const INTERMEDIATE_CHECK_YESNO_LABELS = {
  true: 'O',
  false: 'X',
} as const satisfies Record<'true' | 'false', 'O' | 'X'>;
