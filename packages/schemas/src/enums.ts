import { z } from 'zod';

/**
 * ⚠️ SINGLE SOURCE OF TRUTH: 장비 상태 열거형
 *
 * 이 파일이 모든 상태값의 기준입니다.
 * - 데이터베이스 스키마는 이 값과 반드시 일치해야 함
 * - 백엔드/프론트엔드는 이 파일에서 import하여 사용
 * - 새로운 상태값 추가 시 이 파일만 수정하고 마이그레이션 필요
 *
 * 표준 상태값 (소문자 + 언더스코어):
 * - available: 사용 가능
 * - in_use: 사용 중 (대여 중 포함)
 * - checked_out: 반출 중 (교정/수리/대여는 checkout_type으로 구분)
 * - calibration_scheduled: 교정 예정
 * - calibration_overdue: 교정 기한 초과
 * - non_conforming: 부적합 (임시적, 수리 후 복귀 가능)
 * - spare: 여분 (보유하고 있지만 상시 관리하지 않음)
 * - retired: 사용 중지 (영구 폐기)
 *
 * @see docs/development/API_STANDARDS.md
 */
export const EquipmentStatusEnum = z.enum([
  'available', // 사용 가능
  'in_use', // 사용 중 (대여 중 포함)
  'checked_out', // 반출 중
  'calibration_scheduled', // 교정 예정
  'calibration_overdue', // 교정 기한 초과
  'non_conforming', // 부적합 (임시, 수리 후 복귀 가능)
  'spare', // 여분
  'retired', // 사용 중지 (영구 폐기)
]);

export type EquipmentStatus = z.infer<typeof EquipmentStatusEnum>;

// 교정 방법 열거형
export const CalibrationMethodEnum = z.enum([
  'external_calibration', // 외부 교정
  'self_inspection', // 자체 점검
  'not_applicable', // 비대상
]);

export type CalibrationMethod = z.infer<typeof CalibrationMethodEnum>;

// 사용자 역할 열거형 (UL-QP-18 절차서 영문 명칭 기준)
// 역할 계층: test_engineer(1) < technical_manager(2) < quality_manager(3) < lab_manager(4)
export const UserRoleEnum = z.enum([
  'test_engineer', // 시험실무자 (Test Engineer)
  'technical_manager', // 기술책임자 (Technical Manager)
  'quality_manager', // 품질책임자 (Quality Manager) - 교정계획서 검토
  'lab_manager', // 시험소장 (Lab Manager)
]);

export type UserRole = z.infer<typeof UserRoleEnum>;

// 사이트 타입 열거형 (확장: 평택 추가)
export const SiteEnum = z.enum(['suwon', 'uiwang', 'pyeongtaek']);
export type Site = z.infer<typeof SiteEnum>;

// 위치 타입 열거형
export const LocationEnum = z.enum(['수원랩', '의왕랩', '평택랩']);
export type Location = z.infer<typeof LocationEnum>;

// ============================================================================
// 관리번호 체계 관련 타입 및 상수 (UL-QP-18)
// ============================================================================

/**
 * 시험소 코드 (내부용 - 관리번호 프리픽스)
 * 관리번호 형식: XXX-XYYYY (시험소코드 3자리 - 분류코드 1자리 + 일련번호 4자리)
 */
export const SiteCodeEnum = z.enum(['SUW', 'UIW', 'PYT']);
export type SiteCode = z.infer<typeof SiteCodeEnum>;

/**
 * 장비 분류 (팀과 1:1 매핑)
 * ✅ 팀이 분류를 결정함:
 * - fcc_emc_rf: FCC EMC/RF (E)
 * - general_emc: General EMC (R)
 * - general_rf: General RF (W) - 의왕 사이트
 * - sar: SAR (S)
 * - automotive_emc: Automotive EMC (A)
 * - software: Software Program (P)
 */
export const ClassificationEnum = z.enum([
  'fcc_emc_rf', // FCC EMC/RF → E
  'general_emc', // General EMC → R
  'general_rf', // General RF → W (의왕)
  'sar', // SAR → S
  'automotive_emc', // Automotive EMC → A
  'software', // Software Program → P
]);
export type Classification = z.infer<typeof ClassificationEnum>;

/**
 * 사이트명 → 시험소코드 매핑
 * @example 'suwon' → 'SUW'
 */
export const SITE_TO_CODE: Record<Site, SiteCode> = {
  suwon: 'SUW',
  uiwang: 'UIW',
  pyeongtaek: 'PYT',
};

/**
 * 시험소코드 → 사이트명 역매핑
 * @example 'SUW' → 'suwon'
 */
export const CODE_TO_SITE: Record<SiteCode, Site> = {
  SUW: 'suwon',
  UIW: 'uiwang',
  PYT: 'pyeongtaek',
};

/**
 * 분류 → 분류코드 매핑 (1자리)
 * @example 'fcc_emc_rf' → 'E'
 */
export const CLASSIFICATION_TO_CODE: Record<Classification, string> = {
  fcc_emc_rf: 'E',
  general_emc: 'R',
  general_rf: 'W',
  sar: 'S',
  automotive_emc: 'A',
  software: 'P',
};

/**
 * 분류코드 → 분류 역매핑
 * @example 'E' → 'fcc_emc_rf'
 */
export const CODE_TO_CLASSIFICATION: Record<string, Classification> = {
  E: 'fcc_emc_rf',
  R: 'general_emc',
  W: 'general_rf',
  S: 'sar',
  A: 'automotive_emc',
  P: 'software',
};

/**
 * 분류 라벨 (UI 표시용)
 * @example 'fcc_emc_rf' → 'FCC EMC/RF'
 */
export const CLASSIFICATION_LABELS: Record<Classification, string> = {
  fcc_emc_rf: 'FCC EMC/RF',
  general_emc: 'General EMC',
  general_rf: 'General RF',
  sar: 'SAR',
  automotive_emc: 'Automotive EMC',
  software: 'Software Program',
};

/**
 * 사이트 라벨 (UI 표시용)
 * @example 'suwon' → '수원'
 */
export const SITE_LABELS: Record<Site, string> = {
  suwon: '수원',
  uiwang: '의왕',
  pyeongtaek: '평택',
};

/**
 * 관리번호 정규식 패턴
 * 형식: XXX-XYYYY (예: SUW-E0001)
 * 분류코드: E(FCC EMC/RF), R(General EMC), W(General RF), S(SAR), A(Automotive EMC), P(Software)
 */
export const MANAGEMENT_NUMBER_PATTERN = /^(SUW|UIW|PYT)-[ERWSAP]\d{4}$/;

/**
 * 관리번호 생성 헬퍼 함수
 * @param site 사이트명 (suwon, uiwang, pyeongtaek)
 * @param classification 분류 (fcc_emc_rf, general_emc 등)
 * @param serialNumber 일련번호 (4자리 숫자 문자열, 예: '0001')
 * @returns 관리번호 (예: 'SUW-E0001')
 */
export function generateManagementNumber(
  site: Site,
  classification: Classification,
  serialNumber: string
): string {
  const siteCode = SITE_TO_CODE[site];
  const classificationCode = CLASSIFICATION_TO_CODE[classification];
  return `${siteCode}-${classificationCode}${serialNumber}`;
}

/**
 * 관리번호 파싱 헬퍼 함수
 * @param managementNumber 관리번호 (예: 'SUW-E0001')
 * @returns 파싱된 컴포넌트 또는 null (유효하지 않은 경우)
 */
export function parseManagementNumber(managementNumber: string): {
  siteCode: SiteCode;
  site: Site;
  classificationCode: string;
  classification: Classification;
  serialNumber: string;
} | null {
  const match = managementNumber.match(MANAGEMENT_NUMBER_PATTERN);
  if (!match) {
    return null;
  }

  const siteCode = managementNumber.substring(0, 3) as SiteCode;
  const classificationCode = managementNumber.charAt(4);
  const serialNumber = managementNumber.substring(5);

  return {
    siteCode,
    site: CODE_TO_SITE[siteCode],
    classificationCode,
    classification: CODE_TO_CLASSIFICATION[classificationCode],
    serialNumber,
  };
}

// 팀 ID 스키마 (UUID 형식)
// ✅ 팀 ID는 UUID 형식의 문자열
export const TeamIdSchema = z.string().uuid().optional();

export type TeamId = z.infer<typeof TeamIdSchema>;

/**
 * ⚠️ SINGLE SOURCE OF TRUTH: 반출 상태 열거형
 *
 * 표준 상태값 (소문자 + 언더스코어):
 * - pending: 반출 신청 (승인 대기)
 * - approved: 승인됨 (반출 가능)
 * - rejected: 거절됨
 * - checked_out: 반출 중
 * - returned: 반입 완료
 * - return_approved: 반입 최종 승인됨 (기술책임자 승인)
 * - overdue: 반입 기한 초과
 * - canceled: 취소됨
 */
// 반출 상태값 배열 (Zod enum과 동기화)
export const CHECKOUT_STATUS_VALUES = [
  'pending', // 반출 신청 (승인 대기)
  'approved', // 승인됨 (반출 가능)
  'rejected', // 거절됨
  'checked_out', // 반출 중
  'returned', // 반입 완료 (검사 완료)
  'return_approved', // 반입 최종 승인됨 (기술책임자 승인)
  'overdue', // 반입 기한 초과
  'canceled', // 취소됨
] as const;

export const CheckoutStatusEnum = z.enum(
  CHECKOUT_STATUS_VALUES as unknown as [string, ...string[]]
);
export type CheckoutStatus = z.infer<typeof CheckoutStatusEnum>;

/**
 * ⚠️ SINGLE SOURCE OF TRUTH: 반출 목적 열거형
 */
// 반출 목적값 배열 (Zod enum과 동기화)
export const CHECKOUT_PURPOSE_VALUES = [
  'calibration', // 교정
  'repair', // 수리
  'rental', // 대여
] as const;

export const CheckoutPurposeEnum = z.enum(
  CHECKOUT_PURPOSE_VALUES as unknown as [string, ...string[]]
);
export type CheckoutPurpose = z.infer<typeof CheckoutPurposeEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 교정 승인 상태 열거형
 *
 * 표준 상태값 (소문자 + 언더스코어):
 * - pending_approval: 승인 대기 (시험실무자가 등록)
 * - approved: 승인됨 (기술책임자가 승인)
 * - rejected: 반려됨
 */
export const CALIBRATION_APPROVAL_STATUS_VALUES = [
  'pending_approval', // 승인 대기
  'approved', // 승인됨
  'rejected', // 반려됨
] as const;

export const CalibrationApprovalStatusEnum = z.enum(
  CALIBRATION_APPROVAL_STATUS_VALUES as unknown as [string, ...string[]]
);
export type CalibrationApprovalStatus = z.infer<typeof CalibrationApprovalStatusEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 교정 등록자 역할 열거형
 */
export const CALIBRATION_REGISTERED_BY_ROLE_VALUES = [
  'test_engineer', // 시험실무자 (Test Engineer)
  'technical_manager', // 기술책임자 (Technical Manager)
] as const;

export const CalibrationRegisteredByRoleEnum = z.enum(
  CALIBRATION_REGISTERED_BY_ROLE_VALUES as unknown as [string, ...string[]]
);
export type CalibrationRegisteredByRole = z.infer<typeof CalibrationRegisteredByRoleEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 교정 결과 열거형
 *
 * 표준 결과값 (소문자):
 * - pass: 적합 (PASS)
 * - fail: 부적합 (FAIL)
 * - conditional: 조건부 적합 (CONDITIONAL)
 */
export const CALIBRATION_RESULT_VALUES = [
  'pass', // 적합
  'fail', // 부적합
  'conditional', // 조건부 적합
] as const;

export const CalibrationResultEnum = z.enum(
  CALIBRATION_RESULT_VALUES as unknown as [string, ...string[]]
);
export type CalibrationResult = z.infer<typeof CalibrationResultEnum>;

export const CALIBRATION_RESULT_LABELS: Record<CalibrationResult, string> = {
  pass: '적합',
  fail: '부적합',
  conditional: '조건부 적합',
};

/**
 * ⚠️ SINGLE SOURCE OF TRUTH: 반출 유형 열거형
 *
 * 모든 반출 유형은 1단계 승인으로 통합됨 (기술책임자 승인):
 * - calibration: 교정 목적 반출 (외부 교정기관)
 * - repair: 수리 목적 반출 (외부 수리업체)
 * - rental: 대여 목적 반출 (시험소 간 대여)
 */
export const CHECKOUT_TYPE_VALUES = [
  'calibration', // 교정 목적 반출
  'repair', // 수리 목적 반출
  'rental', // 대여 목적 반출
] as const;

export const CheckoutTypeEnum = z.enum(CHECKOUT_TYPE_VALUES as unknown as [string, ...string[]]);
export type CheckoutType = z.infer<typeof CheckoutTypeEnum>;

/**
 * ⚠️ SINGLE SOURCE OF TRUTH: 보정계수 타입 열거형
 *
 * 표준 타입값 (소문자 + 언더스코어):
 * - antenna_gain: 안테나 이득
 * - cable_loss: 케이블 손실
 * - path_loss: 경로 손실
 * - amplifier_gain: 증폭기 이득
 * - other: 기타
 */
export const CALIBRATION_FACTOR_TYPE_VALUES = [
  'antenna_gain', // 안테나 이득
  'cable_loss', // 케이블 손실
  'path_loss', // 경로 손실
  'amplifier_gain', // 증폭기 이득
  'other', // 기타
] as const;

export const CalibrationFactorTypeEnum = z.enum(
  CALIBRATION_FACTOR_TYPE_VALUES as unknown as [string, ...string[]]
);
export type CalibrationFactorType = z.infer<typeof CalibrationFactorTypeEnum>;

/**
 * ⚠️ SINGLE SOURCE OF TRUTH: 보정계수 승인 상태 열거형
 *
 * 표준 상태값 (소문자):
 * - pending: 승인 대기 (시험실무자가 변경 요청)
 * - approved: 승인됨 (기술책임자가 승인)
 * - rejected: 반려됨
 */
export const CALIBRATION_FACTOR_APPROVAL_STATUS_VALUES = [
  'pending', // 승인 대기
  'approved', // 승인됨
  'rejected', // 반려됨
] as const;

export const CalibrationFactorApprovalStatusEnum = z.enum(
  CALIBRATION_FACTOR_APPROVAL_STATUS_VALUES as unknown as [string, ...string[]]
);
export type CalibrationFactorApprovalStatus = z.infer<typeof CalibrationFactorApprovalStatusEnum>;

/**
 * ⚠️ SINGLE SOURCE OF TRUTH: 부적합 상태 열거형
 *
 * 표준 상태값 (소문자 + 언더스코어):
 * - open: 부적합 등록 (발견됨)
 * - analyzing: 원인 분석 중
 * - corrected: 조치 완료 (종료 승인 대기)
 * - closed: 종료됨 (기술책임자 승인)
 */
export const NON_CONFORMANCE_STATUS_VALUES = [
  'open', // 부적합 등록 (발견됨)
  'analyzing', // 원인 분석 중
  'corrected', // 조치 완료 (종료 승인 대기)
  'closed', // 종료됨 (기술책임자 승인)
] as const;

export const NonConformanceStatusEnum = z.enum(
  NON_CONFORMANCE_STATUS_VALUES as unknown as [string, ...string[]]
);
export type NonConformanceStatus = z.infer<typeof NonConformanceStatusEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 공용장비 출처 열거형
 *
 * 표준 값 (소문자 + 언더스코어):
 * - safety_lab: Safety Lab 등 사내 공용장비
 * - external: 외부 기관 보유 장비
 */
export const SHARED_SOURCE_VALUES = [
  'safety_lab', // Safety Lab 등 사내 공용장비
  'external', // 외부 기관 보유 장비
] as const;

export const SharedSourceEnum = z.enum(SHARED_SOURCE_VALUES as unknown as [string, ...string[]]);
export type SharedSource = z.infer<typeof SharedSourceEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 소프트웨어 타입 열거형
 *
 * 표준 타입값 (소문자 + 언더스코어):
 * - measurement: 측정 소프트웨어 (EMC32, DASY6 SAR 등)
 * - analysis: 분석 소프트웨어
 * - control: 제어 소프트웨어
 * - other: 기타
 */
export const SOFTWARE_TYPE_VALUES = [
  'measurement', // 측정 소프트웨어
  'analysis', // 분석 소프트웨어
  'control', // 제어 소프트웨어
  'other', // 기타
] as const;

export const SoftwareTypeEnum = z.enum(SOFTWARE_TYPE_VALUES as unknown as [string, ...string[]]);
export type SoftwareType = z.infer<typeof SoftwareTypeEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 소프트웨어 변경 승인 상태 열거형
 *
 * 표준 상태값 (소문자):
 * - pending: 승인 대기 (변경 요청)
 * - approved: 승인됨 (기술책임자가 승인)
 * - rejected: 반려됨
 */
export const SOFTWARE_APPROVAL_STATUS_VALUES = [
  'pending', // 승인 대기
  'approved', // 승인됨
  'rejected', // 반려됨
] as const;

export const SoftwareApprovalStatusEnum = z.enum(
  SOFTWARE_APPROVAL_STATUS_VALUES as unknown as [string, ...string[]]
);
export type SoftwareApprovalStatus = z.infer<typeof SoftwareApprovalStatusEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 교정계획서 상태 열거형
 *
 * 3단계 승인 워크플로우:
 * - draft: 작성 중 (기술책임자가 계획서 작성 중)
 * - pending_review: 검토 대기 (품질책임자에게 검토 요청됨) ← 신규
 * - pending_approval: 승인 대기 (시험소장에게 승인 요청됨)
 * - approved: 승인됨 (시험소장이 승인 완료)
 * - rejected: 반려됨 (품질책임자 또는 시험소장이 반려, 사유 필수)
 *
 * 상태 전이:
 * draft → pending_review → pending_approval → approved
 *    ↑__________________________|__________________|
 *                    rejected
 *
 * @see docs/development/API_STANDARDS.md
 */
export const CALIBRATION_PLAN_STATUS_VALUES = [
  'draft', // 작성 중
  'pending_review', // 검토 대기 (품질책임자)
  'pending_approval', // 승인 대기 (시험소장)
  'approved', // 승인됨
  'rejected', // 반려됨
] as const;

export const CalibrationPlanStatusEnum = z.enum(
  CALIBRATION_PLAN_STATUS_VALUES as unknown as [string, ...string[]]
);
export type CalibrationPlanStatus = z.infer<typeof CalibrationPlanStatusEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 감사 로그 액션 열거형
 *
 * 표준 액션값 (소문자 + 언더스코어):
 * - create: 생성
 * - update: 수정
 * - delete: 삭제
 * - approve: 승인
 * - reject: 반려
 * - checkout: 반출
 * - return: 반입/반납
 * - cancel: 취소
 * - login: 로그인
 * - logout: 로그아웃
 *
 * @see docs/development/API_STANDARDS.md
 */
export const AUDIT_ACTION_VALUES = [
  'create', // 생성
  'update', // 수정
  'delete', // 삭제
  'approve', // 승인
  'reject', // 반려
  'checkout', // 반출
  'return', // 반입/반납
  'cancel', // 취소
  'login', // 로그인
  'logout', // 로그아웃
] as const;

export const AuditActionEnum = z.enum(AUDIT_ACTION_VALUES as unknown as [string, ...string[]]);
export type AuditAction = z.infer<typeof AuditActionEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 감사 로그 엔티티 타입 열거형
 *
 * 표준 엔티티 타입값 (소문자 + 언더스코어):
 * - equipment: 장비
 * - calibration: 교정
 * - checkout: 반출
 * - rental: 대여
 * - user: 사용자
 * - team: 팀
 * - calibration_factor: 보정계수
 * - non_conformance: 부적합
 * - software: 소프트웨어
 * - calibration_plan: 교정계획서
 * - repair_history: 수리이력
 *
 * @see docs/development/API_STANDARDS.md
 */
export const AUDIT_ENTITY_TYPE_VALUES = [
  'equipment', // 장비
  'calibration', // 교정
  'checkout', // 반출
  'rental', // 대여
  'user', // 사용자
  'team', // 팀
  'calibration_factor', // 보정계수
  'non_conformance', // 부적합
  'software', // 소프트웨어
  'calibration_plan', // 교정계획서
  'repair_history', // 수리이력
] as const;

export const AuditEntityTypeEnum = z.enum(
  AUDIT_ENTITY_TYPE_VALUES as unknown as [string, ...string[]]
);
export type AuditEntityType = z.infer<typeof AuditEntityTypeEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 장비 사고/이벤트 유형 열거형
 *
 * 표준 유형값 (소문자 + 언더스코어):
 * - damage: 손상
 * - malfunction: 오작동
 * - change: 변경
 * - repair: 수리
 */
export const INCIDENT_TYPE_VALUES = [
  'damage', // 손상
  'malfunction', // 오작동
  'change', // 변경
  'repair', // 수리
] as const;

export const IncidentTypeEnum = z.enum(INCIDENT_TYPE_VALUES as unknown as [string, ...string[]]);
export type IncidentType = z.infer<typeof IncidentTypeEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 시방일치 여부 열거형
 *
 * 표준 값 (소문자):
 * - match: 일치
 * - mismatch: 불일치
 */
export const SPEC_MATCH_VALUES = [
  'match', // 일치
  'mismatch', // 불일치
] as const;

export const SpecMatchEnum = z.enum(SPEC_MATCH_VALUES as unknown as [string, ...string[]]);
export type SpecMatch = z.infer<typeof SpecMatchEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 교정 필요 여부 열거형
 *
 * 표준 값 (소문자):
 * - required: 필요
 * - not_required: 불필요
 */
export const CALIBRATION_REQUIRED_VALUES = [
  'required', // 필요
  'not_required', // 불필요
] as const;

export const CalibrationRequiredEnum = z.enum(
  CALIBRATION_REQUIRED_VALUES as unknown as [string, ...string[]]
);
export type CalibrationRequired = z.infer<typeof CalibrationRequiredEnum>;

// ============================================================================
// Phase 1: 추가 ENUM 정의 (SSOT 통합)
// ============================================================================

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
  'measurement_error', // 측정 오류
  'other', // 기타
] as const;

export const NonConformanceTypeEnum = z.enum(
  NON_CONFORMANCE_TYPE_VALUES as unknown as [string, ...string[]]
);
export type NonConformanceType = z.infer<typeof NonConformanceTypeEnum>;

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

export const ResolutionTypeEnum = z.enum(
  RESOLUTION_TYPE_VALUES as unknown as [string, ...string[]]
);
export type ResolutionType = z.infer<typeof ResolutionTypeEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 사용자 상태 열거형
 *
 * 표준 상태값 (소문자):
 * - active: 활성
 * - inactive: 비활성
 * - pending: 승인 대기
 */
export const USER_STATUS_VALUES = ['active', 'inactive', 'pending'] as const;

export const UserStatusEnum = z.enum(USER_STATUS_VALUES as unknown as [string, ...string[]]);
export type UserStatus = z.infer<typeof UserStatusEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 수리 결과 열거형
 *
 * 표준 결과값 (소문자):
 * - completed: 완료
 * - partial: 부분 완료
 * - failed: 실패
 */
export const REPAIR_RESULT_VALUES = ['completed', 'partial', 'failed'] as const;

export const RepairResultEnum = z.enum(REPAIR_RESULT_VALUES as unknown as [string, ...string[]]);
export type RepairResult = z.infer<typeof RepairResultEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 알림 유형 열거형
 *
 * 표준 유형값 (소문자 + 언더스코어):
 */
export const NOTIFICATION_TYPE_VALUES = [
  'calibration_due', // 교정 예정
  'calibration_completed', // 교정 완료
  'calibration_approval_pending', // 교정 승인 대기
  'calibration_approved', // 교정 승인됨
  'calibration_rejected', // 교정 반려됨
  'intermediate_check_due', // 중간점검 예정
  'rental_request', // 대여 요청
  'rental_approved', // 대여 승인됨
  'rental_rejected', // 대여 반려됨
  'rental_completed', // 대여 완료
  'return_requested', // 반납 요청
  'return_approved', // 반납 승인됨
  'return_rejected', // 반납 반려됨
  'equipment_maintenance', // 장비 유지보수
  'system', // 시스템
  'checkout', // 반출
  'maintenance', // 유지보수
] as const;

export const NotificationTypeEnum = z.enum(
  NOTIFICATION_TYPE_VALUES as unknown as [string, ...string[]]
);
export type NotificationType = z.infer<typeof NotificationTypeEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 알림 우선순위 열거형
 *
 * 표준 우선순위값 (소문자):
 * - low: 낮음
 * - medium: 보통
 * - high: 높음
 */
export const NOTIFICATION_PRIORITY_VALUES = ['low', 'medium', 'high'] as const;

export const NotificationPriorityEnum = z.enum(
  NOTIFICATION_PRIORITY_VALUES as unknown as [string, ...string[]]
);
export type NotificationPriority = z.infer<typeof NotificationPriorityEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 반납 상태 열거형
 *
 * 표준 상태값 (소문자 + 언더스코어):
 * - good: 양호
 * - damaged: 손상
 * - lost: 분실
 * - needs_repair: 수리 필요
 * - needs_calibration: 교정 필요
 */
export const RETURN_CONDITION_VALUES = [
  'good', // 양호
  'damaged', // 손상
  'lost', // 분실
  'needs_repair', // 수리 필요
  'needs_calibration', // 교정 필요
] as const;

export const ReturnConditionEnum = z.enum(
  RETURN_CONDITION_VALUES as unknown as [string, ...string[]]
);
export type ReturnCondition = z.infer<typeof ReturnConditionEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 반납 승인 상태 열거형
 *
 * 표준 상태값 (소문자):
 * - pending: 승인 대기
 * - approved: 승인됨
 * - rejected: 반려됨
 */
export const RETURN_APPROVAL_STATUS_VALUES = ['pending', 'approved', 'rejected'] as const;

export const ReturnApprovalStatusEnum = z.enum(
  RETURN_APPROVAL_STATUS_VALUES as unknown as [string, ...string[]]
);
export type ReturnApprovalStatus = z.infer<typeof ReturnApprovalStatusEnum>;

// ============================================================================
// LABELS 맵 정의 (UI 표시용 한글 라벨)
// ============================================================================

/**
 * 장비 상태 라벨 (UI 표시용)
 */
export const EQUIPMENT_STATUS_VALUES = EquipmentStatusEnum.options;
export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  available: '사용 가능',
  in_use: '사용 중',
  checked_out: '반출 중',
  calibration_scheduled: '교정 예정',
  calibration_overdue: '교정 기한 초과',
  non_conforming: '부적합',
  spare: '여분',
  retired: '폐기',
};

/**
 * 교정 방법 라벨 (UI 표시용)
 */
export const CALIBRATION_METHOD_VALUES = CalibrationMethodEnum.options;
export const CALIBRATION_METHOD_LABELS: Record<CalibrationMethod, string> = {
  external_calibration: '외부 교정',
  self_inspection: '자체 점검',
  not_applicable: '비대상',
};

/**
 * 사용자 역할 라벨 (UI 표시용)
 */
export const USER_ROLE_VALUES = UserRoleEnum.options;
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  test_engineer: '시험실무자',
  technical_manager: '기술책임자',
  quality_manager: '품질책임자',
  lab_manager: '시험소장',
};

/**
 * 반출 상태 라벨 (UI 표시용)
 */
export const CHECKOUT_STATUS_LABELS: Record<CheckoutStatus, string> = {
  pending: '승인 대기',
  approved: '승인됨',
  rejected: '거절됨',
  checked_out: '반출 중',
  returned: '반입 완료',
  return_approved: '반입 승인됨',
  overdue: '기한 초과',
  canceled: '취소됨',
};

/**
 * 반출 목적 라벨 (UI 표시용)
 */
export const CHECKOUT_PURPOSE_LABELS: Record<CheckoutPurpose, string> = {
  calibration: '교정',
  repair: '수리',
  rental: '대여',
};

/**
 * 부적합 상태 라벨 (UI 표시용)
 */
export const NON_CONFORMANCE_STATUS_LABELS: Record<NonConformanceStatus, string> = {
  open: '등록됨',
  analyzing: '분석 중',
  corrected: '조치 완료',
  closed: '종료됨',
};

/**
 * 부적합 유형 라벨 (UI 표시용)
 */
export const NON_CONFORMANCE_TYPE_LABELS: Record<NonConformanceType, string> = {
  damage: '손상',
  malfunction: '오작동',
  calibration_failure: '교정 실패',
  measurement_error: '측정 오류',
  other: '기타',
};

/**
 * 해결 유형 라벨 (UI 표시용)
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
 */
export const REPAIR_RESULT_LABELS: Record<RepairResult, string> = {
  completed: '완료',
  partial: '부분 완료',
  failed: '실패',
};

/**
 * 사용자 상태 라벨 (UI 표시용)
 */
export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: '활성',
  inactive: '비활성',
  pending: '승인 대기',
};

/**
 * 알림 우선순위 라벨 (UI 표시용)
 */
export const NOTIFICATION_PRIORITY_LABELS: Record<NotificationPriority, string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
};

/**
 * 반납 상태 라벨 (UI 표시용)
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
 */
export const CALIBRATION_FACTOR_TYPE_LABELS: Record<CalibrationFactorType, string> = {
  antenna_gain: '안테나 이득',
  cable_loss: '케이블 손실',
  path_loss: '경로 손실',
  amplifier_gain: '증폭기 이득',
  other: '기타',
};

/**
 * 소프트웨어 타입 라벨 (UI 표시용)
 */
export const SOFTWARE_TYPE_LABELS: Record<SoftwareType, string> = {
  measurement: '측정 소프트웨어',
  analysis: '분석 소프트웨어',
  control: '제어 소프트웨어',
  other: '기타',
};

/**
 * 사고 유형 라벨 (UI 표시용)
 */
export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  damage: '손상',
  malfunction: '오작동',
  change: '변경',
  repair: '수리',
};

/**
 * 교정계획서 상태 라벨 (UI 표시용)
 *
 * 참고: pending_review 상태의 라벨이 "확인 대기"로 변경됨 (UX 단순화)
 * - 품질책임자의 "검토" 단계가 "확인" 단계로 단순화됨
 * - 다이얼로그 기반 3클릭 → 타임라인 내 원클릭 확인으로 개선
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
 */
export const CALIBRATION_APPROVAL_STATUS_LABELS: Record<CalibrationApprovalStatus, string> = {
  pending_approval: '승인 대기',
  approved: '승인됨',
  rejected: '반려됨',
};

/**
 * 보정계수 승인 상태 라벨 (UI 표시용)
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
 * 소프트웨어 승인 상태 라벨 (UI 표시용)
 */
export const SOFTWARE_APPROVAL_STATUS_LABELS: Record<SoftwareApprovalStatus, string> = {
  pending: '승인 대기',
  approved: '승인됨',
  rejected: '반려됨',
};

// ============================================================================
// CONST VALUE OBJECTS (TypeScript enum 스타일 접근용)
// Zod enum은 .VALUE 형식 접근이 불가능하므로, 기존 코드 호환성을 위해 제공
// ============================================================================

/**
 * 알림 우선순위 값 객체 (dot-notation 접근용)
 * @example NotificationPriorityValues.MEDIUM // 'medium'
 */
export const NotificationPriorityValues = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

/**
 * 알림 유형 값 객체 (dot-notation 접근용)
 * @example NotificationTypeValues.CALIBRATION_DUE // 'calibration_due'
 */
export const NotificationTypeValues = {
  CALIBRATION_DUE: 'calibration_due',
  CALIBRATION_COMPLETED: 'calibration_completed',
  CALIBRATION_APPROVAL_PENDING: 'calibration_approval_pending',
  CALIBRATION_APPROVED: 'calibration_approved',
  CALIBRATION_REJECTED: 'calibration_rejected',
  INTERMEDIATE_CHECK_DUE: 'intermediate_check_due',
  RENTAL_REQUEST: 'rental_request',
  RENTAL_APPROVED: 'rental_approved',
  RENTAL_REJECTED: 'rental_rejected',
  RENTAL_COMPLETED: 'rental_completed',
  RETURN_REQUESTED: 'return_requested',
  RETURN_APPROVED: 'return_approved',
  RETURN_REJECTED: 'return_rejected',
  EQUIPMENT_MAINTENANCE: 'equipment_maintenance',
  SYSTEM: 'system',
  CHECKOUT: 'checkout',
  MAINTENANCE: 'maintenance',
} as const;

/**
 * 반납 상태 값 객체 (dot-notation 접근용)
 * @example ReturnConditionValues.GOOD // 'good'
 */
export const ReturnConditionValues = {
  GOOD: 'good',
  DAMAGED: 'damaged',
  LOST: 'lost',
  NEEDS_REPAIR: 'needs_repair',
  NEEDS_CALIBRATION: 'needs_calibration',
} as const;

/**
 * 반납 승인 상태 값 객체 (dot-notation 접근용)
 * @example ReturnApprovalStatusValues.APPROVED // 'approved'
 */
export const ReturnApprovalStatusValues = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

/**
 * 수리 결과 값 객체 (dot-notation 접근용)
 * @example RepairResultValues.COMPLETED // 'completed'
 */
export const RepairResultValues = {
  COMPLETED: 'completed',
  PARTIAL: 'partial',
  FAILED: 'failed',
} as const;

/**
 * 소프트웨어 승인 상태 값 객체 (dot-notation 접근용)
 * @example SoftwareApprovalStatusValues.PENDING // 'pending'
 */
export const SoftwareApprovalStatusValues = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

/**
 * 보정계수 타입 값 객체 (dot-notation 접근용)
 * @example CalibrationFactorTypeValues.ANTENNA_GAIN // 'antenna_gain'
 */
export const CalibrationFactorTypeValues = {
  ANTENNA_GAIN: 'antenna_gain',
  CABLE_LOSS: 'cable_loss',
  PATH_LOSS: 'path_loss',
  AMPLIFIER_GAIN: 'amplifier_gain',
  OTHER: 'other',
} as const;

/**
 * 사고 유형 값 객체 (dot-notation 접근용)
 * @example IncidentTypeValues.DAMAGE // 'damage'
 */
export const IncidentTypeValues = {
  DAMAGE: 'damage',
  MALFUNCTION: 'malfunction',
  CHANGE: 'change',
  REPAIR: 'repair',
} as const;

/**
 * 부적합 유형 값 객체 (dot-notation 접근용)
 * @example NonConformanceTypeValues.DAMAGE // 'damage'
 */
export const NonConformanceTypeValues = {
  DAMAGE: 'damage',
  MALFUNCTION: 'malfunction',
  CALIBRATION_FAILURE: 'calibration_failure',
  MEASUREMENT_ERROR: 'measurement_error',
  OTHER: 'other',
} as const;

/**
 * 부적합 상태 값 객체 (dot-notation 접근용)
 * @example NonConformanceStatusValues.OPEN // 'open'
 */
export const NonConformanceStatusValues = {
  OPEN: 'open',
  ANALYZING: 'analyzing',
  CORRECTED: 'corrected',
  CLOSED: 'closed',
} as const;

/**
 * 장비 상태 값 객체 (dot-notation 접근용)
 * @example EquipmentStatusValues.AVAILABLE // 'available'
 */
export const EquipmentStatusValues = {
  AVAILABLE: 'available',
  IN_USE: 'in_use',
  CHECKED_OUT: 'checked_out',
  CALIBRATION_SCHEDULED: 'calibration_scheduled',
  CALIBRATION_OVERDUE: 'calibration_overdue',
  NON_CONFORMING: 'non_conforming',
  SPARE: 'spare',
  RETIRED: 'retired',
} as const;

/**
 * 사용자 역할 값 객체 (dot-notation 접근용)
 * @example UserRoleValues.LAB_MANAGER // 'lab_manager'
 */
export const UserRoleValues = {
  TEST_ENGINEER: 'test_engineer',
  TECHNICAL_MANAGER: 'technical_manager',
  QUALITY_MANAGER: 'quality_manager',
  LAB_MANAGER: 'lab_manager',
} as const;

/**
 * 사용자 상태 값 객체 (dot-notation 접근용)
 * @example UserStatusValues.ACTIVE // 'active'
 */
export const UserStatusValues = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
} as const;

/**
 * 보정계수 승인 상태 값 객체 (dot-notation 접근용)
 * @example CalibrationFactorApprovalStatusValues.PENDING // 'pending'
 */
export const CalibrationFactorApprovalStatusValues = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;
