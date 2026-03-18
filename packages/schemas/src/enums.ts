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
 * - retired: 사용 중지 (영구 폐기) - deprecated, disposed 사용 권장
 * - pending_disposal: 폐기 대기 (시험소장 승인 전)
 * - disposed: 폐기 완료 (retired 대체)
 * - temporary: 임시 등록 (공용/렌탈장비)
 * - inactive: 비활성 (임시등록 장비 사용 완료)
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
  'retired', // 사용 중지 (영구 폐기) - deprecated
  'pending_disposal', // 폐기 대기 (시험소장 승인 전)
  'disposed', // 폐기 완료
  'temporary', // 임시 등록 (공용/렌탈장비)
  'inactive', // 비활성 (임시등록 장비 사용 완료)
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
// 역할 계층: test_engineer(1) < technical_manager(2) < quality_manager(3) < lab_manager(4) < system_admin(5)
export const UserRoleEnum = z.enum([
  'test_engineer', // 시험실무자 (Test Engineer)
  'technical_manager', // 기술책임자 (Technical Manager)
  'quality_manager', // 품질책임자 (Quality Manager) - 교정계획서 검토
  'lab_manager', // 시험소장 (Lab Manager)
  'system_admin', // 시스템 관리자 (System Administrator)
]);

export type UserRole = z.infer<typeof UserRoleEnum>;

// 사이트 타입 열거형 (확장: 평택 추가)
export const SiteEnum = z.enum(['suwon', 'uiwang', 'pyeongtaek']);
export type Site = z.infer<typeof SiteEnum>;

/**
 * 사이트 값 배열 (SiteEnum SSOT — 중복 선언 금지)
 * @example SITE_VALUES.map(site => ({ value: site, label: ... }))
 */
export const SITE_VALUES: readonly Site[] = SiteEnum.options;

// 위치 타입 열거형
export const LocationEnum = z.enum(['수원랩', '의왕랩', '평택랩']);
export type Location = z.infer<typeof LocationEnum>;

/** Site → Location SSOT 매핑 (하드코딩 조건문 대신 사용) */
export const SITE_TO_LOCATION: Record<Site, Location> = {
  suwon: '수원랩',
  uiwang: '의왕랩',
  pyeongtaek: '평택랩',
};

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
 * 분류코드 (1자리: E, R, W, S, A, P)
 * ✅ SiteCodeEnum 패턴 미러링 — ClassificationCode의 SSOT
 */
export const ClassificationCodeEnum = z.enum(['E', 'R', 'W', 'S', 'A', 'P']);
export type ClassificationCode = z.infer<typeof ClassificationCodeEnum>;

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
export const CLASSIFICATION_TO_CODE: Record<Classification, ClassificationCode> = {
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
export const CODE_TO_CLASSIFICATION: Record<ClassificationCode, Classification> = {
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
 * 임시 관리번호 프리픽스 (공용/렌탈 장비용)
 *
 * 임시 장비(공용/렌탈)는 별도 관리번호 체계를 사용하여:
 * - 정규 장비와 명확히 구분
 * - 정규 일련번호 소진 방지
 * - 반납 후 번호 재사용 가능
 */
export const TEMPORARY_EQUIPMENT_PREFIX = 'TEMP-' as const;

/**
 * 임시 관리번호 정규식 패턴
 * 형식: TEMP-XXX-XYYYY (예: TEMP-SUW-E0001)
 */
export const TEMPORARY_MANAGEMENT_NUMBER_PATTERN = /^TEMP-(SUW|UIW|PYT)-[ERWSAP]\d{4}$/;

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
  classificationCode: ClassificationCode;
  classification: Classification;
  serialNumber: string;
} | null {
  const match = managementNumber.match(MANAGEMENT_NUMBER_PATTERN);
  if (!match) {
    return null;
  }

  const siteCode = managementNumber.substring(0, 3) as SiteCode;
  const classificationCode = managementNumber.charAt(4) as ClassificationCode;
  const serialNumber = managementNumber.substring(5);

  return {
    siteCode,
    site: CODE_TO_SITE[siteCode],
    classificationCode,
    classification: CODE_TO_CLASSIFICATION[classificationCode],
    serialNumber,
  };
}

/**
 * 임시 관리번호 생성 헬퍼 함수 (공용/렌탈 장비용)
 * @param site 사이트명 (suwon, uiwang, pyeongtaek)
 * @param classification 분류 (fcc_emc_rf, general_emc 등)
 * @param serialNumber 일련번호 (4자리 숫자 문자열, 예: '0001')
 * @returns 임시 관리번호 (예: 'TEMP-SUW-E0001')
 *
 * @example
 * generateTemporaryManagementNumber('suwon', 'fcc_emc_rf', '0001')
 * // returns 'TEMP-SUW-E0001'
 */
export function generateTemporaryManagementNumber(
  site: Site,
  classification: Classification,
  serialNumber: string
): string {
  const siteCode = SITE_TO_CODE[site];
  const classificationCode = CLASSIFICATION_TO_CODE[classification];
  return `${TEMPORARY_EQUIPMENT_PREFIX}${siteCode}-${classificationCode}${serialNumber}`;
}

/**
 * 임시 관리번호 파싱 헬퍼 함수
 * @param managementNumber 임시 관리번호 (예: 'TEMP-SUW-E0001')
 * @returns 파싱된 컴포넌트 또는 null (유효하지 않은 경우)
 */
export function parseTemporaryManagementNumber(managementNumber: string): {
  siteCode: SiteCode;
  site: Site;
  classificationCode: ClassificationCode;
  classification: Classification;
  serialNumber: string;
} | null {
  const match = managementNumber.match(TEMPORARY_MANAGEMENT_NUMBER_PATTERN);
  if (!match) {
    return null;
  }

  // "TEMP-SUW-E0001" → substring(5) = "SUW-E0001"
  const withoutPrefix = managementNumber.substring(5);
  const siteCode = withoutPrefix.substring(0, 3) as SiteCode;
  const classificationCode = withoutPrefix.charAt(4) as ClassificationCode;
  const serialNumber = withoutPrefix.substring(5);

  return {
    siteCode,
    site: CODE_TO_SITE[siteCode],
    classificationCode,
    classification: CODE_TO_CLASSIFICATION[classificationCode],
    serialNumber,
  };
}

/**
 * 관리번호가 임시 관리번호인지 확인
 * @param managementNumber 관리번호
 * @returns 임시 관리번호 여부
 */
export function isTemporaryManagementNumber(managementNumber: string): boolean {
  return managementNumber.startsWith(TEMPORARY_EQUIPMENT_PREFIX);
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
  'checked_out', // 반출 중 (교정/수리)
  // 대여 목적 양측 확인 상태 (시험소간 대여)
  'lender_checked', // ① 반출 전 확인 완료 (빌려주는 측)
  'borrower_received', // ② 인수 확인 완료 (빌리는 측)
  'in_use', // 사용 중 (대여)
  'borrower_returned', // ③ 반납 전 확인 완료 (빌린 측)
  'lender_received', // ④ 반입 확인 완료 (빌려준 측)
  'returned', // 반입 완료 (검사 완료)
  'return_approved', // 반입 최종 승인됨 (기술책임자 승인)
  'overdue', // 반입 기한 초과
  'canceled', // 취소됨
] as const;

export const CheckoutStatusEnum = z.enum(CHECKOUT_STATUS_VALUES);
export type CheckoutStatus = z.infer<typeof CheckoutStatusEnum>;

/**
 * ⚠️ SINGLE SOURCE OF TRUTH: 반출 목적 열거형
 */
// 반출 목적값 배열 (Zod enum과 동기화)
export const CHECKOUT_PURPOSE_VALUES = [
  'calibration', // 교정
  'repair', // 수리
  'rental', // 대여
  'return_to_vendor', // 렌탈 반납
] as const;

export const CheckoutPurposeEnum = z.enum(CHECKOUT_PURPOSE_VALUES);
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

export const CalibrationApprovalStatusEnum = z.enum(CALIBRATION_APPROVAL_STATUS_VALUES);
export type CalibrationApprovalStatus = z.infer<typeof CalibrationApprovalStatusEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 교정 등록자 역할 열거형
 */
export const CALIBRATION_REGISTERED_BY_ROLE_VALUES = [
  'test_engineer', // 시험실무자 (Test Engineer)
  'technical_manager', // 기술책임자 (Technical Manager)
] as const;

export const CalibrationRegisteredByRoleEnum = z.enum(CALIBRATION_REGISTERED_BY_ROLE_VALUES);
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

export const CalibrationResultEnum = z.enum(CALIBRATION_RESULT_VALUES);
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

export const CalibrationFactorTypeEnum = z.enum(CALIBRATION_FACTOR_TYPE_VALUES);
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
  CALIBRATION_FACTOR_APPROVAL_STATUS_VALUES
);
export type CalibrationFactorApprovalStatus = z.infer<typeof CalibrationFactorApprovalStatusEnum>;

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
 * SINGLE SOURCE OF TRUTH: 공용장비 출처 열거형
 *
 * 표준 값 (소문자 + 언더스코어):
 * - safety_lab: Safety Lab 등 사내 공용장비 (legacy)
 * - external: 외부 기관 보유 장비 (렌탈)
 * - internal_shared: 내부 공용장비 (통합 반입 프로세스용)
 */
export const SHARED_SOURCE_VALUES = [
  'safety_lab', // Safety Lab 등 사내 공용장비 (legacy)
  'external', // 외부 기관 보유 장비 (렌탈)
  'internal_shared', // 내부 공용장비 (통합 반입 프로세스용)
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

export const SoftwareApprovalStatusEnum = z.enum(SOFTWARE_APPROVAL_STATUS_VALUES);
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

/**
 * 교정계획서 상태 상수 객체 (코드에서 직접 비교용)
 * @example CalibrationPlanStatusValues.DRAFT === 'draft'
 */
export const CalibrationPlanStatusValues = {
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const CalibrationPlanStatusEnum = z.enum(CALIBRATION_PLAN_STATUS_VALUES);
export type CalibrationPlanStatus = z.infer<typeof CalibrationPlanStatusEnum>;

/**
 * ⚠️ SINGLE SOURCE OF TRUTH: 교정계획서 반려 단계 열거형
 *
 * - review: 품질책임자 검토 단계에서 반려
 * - approval: 시험소장 승인 단계에서 반려
 */
export const REJECTION_STAGE_VALUES = ['review', 'approval'] as const;
export const RejectionStageEnum = z.enum(REJECTION_STAGE_VALUES);
export type RejectionStage = z.infer<typeof RejectionStageEnum>;

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
  'close', // 종료 (부적합 종결)
  'reject_correction', // 조치 반려
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
  'rental_import', // 대여 반입 (legacy — equipment_import로 대체됨)
  'user', // 사용자
  'team', // 팀
  'calibration_factor', // 보정계수
  'non_conformance', // 부적합
  'software', // 소프트웨어
  'calibration_plan', // 교정계획서
  'repair_history', // 수리이력
  'equipment_import', // 장비 반입
  'location_history', // 위치 이력
  'maintenance_history', // 유지보수 이력
  'incident_history', // 사고 이력
  'settings', // 설정
] as const;

export const AuditEntityTypeEnum = z.enum(AUDIT_ENTITY_TYPE_VALUES);
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
  'calibration_overdue', // 교정 기한 초과
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

export const CalibrationRequiredEnum = z.enum(CALIBRATION_REQUIRED_VALUES);
export type CalibrationRequired = z.infer<typeof CalibrationRequiredEnum>;

// NOTE: CalibrationStatusEnum/CalibrationStatus는 calibration.ts에서 정의 (SSOT)
// 여기서 재정의 금지 — 중복 export 충돌 발생

/**
 * 위치 값 배열 (LocationEnum SSOT — 중복 선언 금지)
 */
export const LOCATION_VALUES = LocationEnum.options;

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
  'calibration_overdue', // 교정 기한 초과
  'measurement_error', // 측정 오류
  'other', // 기타
] as const;

export const NonConformanceTypeEnum = z.enum(NON_CONFORMANCE_TYPE_VALUES);
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

export const ResolutionTypeEnum = z.enum(RESOLUTION_TYPE_VALUES);
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
 * 이벤트명 기반 (eventName.replace(/\./g, '_'))
 */
export const NOTIFICATION_TYPE_VALUES = [
  // ─── 반출 (Checkout) ───
  'checkout_created', // 반출 요청
  'checkout_approved', // 반출 승인됨
  'checkout_rejected', // 반출 반려됨
  'checkout_started', // 반출 시작
  'checkout_returned', // 반입 요청
  'checkout_return_approved', // 반입 승인됨
  'checkout_overdue', // 반출 기한 초과

  // ─── 교정 (Calibration) ───
  'calibration_created', // 교정 등록 (승인 요청)
  'calibration_approved', // 교정 승인됨
  'calibration_rejected', // 교정 반려됨
  'calibration_due_soon', // 교정 예정 (D-day 알림)
  'calibration_overdue', // 교정 기한 초과

  // ─── 부적합 (Non-Conformance) ───
  'non_conformance_created', // 부적합 등록
  'non_conformance_corrected', // 부적합 조치 완료
  'non_conformance_closed', // 부적합 종료
  'non_conformance_correction_rejected', // 조치 반려

  // ─── 장비 요청 (Equipment Request) ───
  'equipment_request_created', // 장비 요청 등록
  'equipment_request_approved', // 장비 요청 승인됨
  'equipment_request_rejected', // 장비 요청 반려됨

  // ─── 폐기 (Disposal) ───
  'disposal_requested', // 폐기 요청
  'disposal_reviewed', // 폐기 검토 완료
  'disposal_approved', // 폐기 최종 승인
  'disposal_rejected', // 폐기 반려

  // ─── 장비 반입 (Equipment Import) ───
  'equipment_import_created', // 반입 요청
  'equipment_import_approved', // 반입 승인됨
  'equipment_import_rejected', // 반입 반려됨

  // ─── 시스템 ───
  'system_announcement', // 시스템 공지

  // ─── 레거시 호환 (기존 코드에서 참조) ───
  'calibration_due', // → calibration_due_soon 으로 대체 예정
  'calibration_completed', // → calibration_approved 으로 대체 예정
  'calibration_approval_pending', // → calibration_created 으로 대체 예정
  'intermediate_check_due', // 중간점검 예정
  'rental_request', // → checkout_created 으로 대체 예정
  'rental_approved', // → checkout_approved 으로 대체 예정
  'rental_rejected', // → checkout_rejected 으로 대체 예정
  'rental_completed', // 레거시
  'return_requested', // → checkout_returned 으로 대체 예정
  'return_approved', // → checkout_return_approved 으로 대체 예정
  'return_rejected', // 레거시
  'equipment_maintenance', // 레거시
  'system', // → system_announcement 으로 대체 예정
  'checkout', // → checkout_created 으로 대체 예정
  'maintenance', // 레거시
] as const;

export const NotificationTypeEnum = z.enum(NOTIFICATION_TYPE_VALUES);
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

export const NotificationPriorityEnum = z.enum(NOTIFICATION_PRIORITY_VALUES);
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

export const ReturnConditionEnum = z.enum(RETURN_CONDITION_VALUES);
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

export const ReturnApprovalStatusEnum = z.enum(RETURN_APPROVAL_STATUS_VALUES);
export type ReturnApprovalStatus = z.infer<typeof ReturnApprovalStatusEnum>;

// ============================================================================
// 대여 목적 양측 4단계 확인 관련 ENUM (시험소간 대여)
// ============================================================================

/**
 * SINGLE SOURCE OF TRUTH: 상태 확인 단계 열거형 (대여 목적)
 *
 * 대여 목적 반출 시 양측 4단계 확인을 위한 단계 구분:
 * - lender_checkout: ① 반출 전 확인 (빌려주는 측)
 * - borrower_receive: ② 인수 시 확인 (빌리는 측)
 * - borrower_return: ③ 반납 전 확인 (빌린 측)
 * - lender_return: ④ 반입 시 확인 (빌려준 측)
 */
export const CONDITION_CHECK_STEP_VALUES = [
  'lender_checkout', // ① 반출 전 (빌려주는 측)
  'borrower_receive', // ② 인수 시 (빌리는 측)
  'borrower_return', // ③ 반납 전 (빌린 측)
  'lender_return', // ④ 반입 시 (빌려준 측)
] as const;

export const ConditionCheckStepEnum = z.enum(CONDITION_CHECK_STEP_VALUES);
export type ConditionCheckStep = z.infer<typeof ConditionCheckStepEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 외관/작동 상태 열거형
 *
 * 상태 확인 시 외관 및 작동 상태를 기록하기 위한 열거형:
 * - normal: 정상
 * - abnormal: 이상
 */
export const CONDITION_STATUS_VALUES = ['normal', 'abnormal'] as const;

export const ConditionStatusEnum = z.enum(CONDITION_STATUS_VALUES);
export type ConditionStatus = z.infer<typeof ConditionStatusEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 부속품 상태 열거형
 *
 * 상태 확인 시 부속품 상태를 기록하기 위한 열거형:
 * - complete: 완전 (모든 부속품 확인)
 * - incomplete: 불완전 (일부 부속품 누락)
 */
export const ACCESSORIES_STATUS_VALUES = ['complete', 'incomplete'] as const;

export const AccessoriesStatusEnum = z.enum(ACCESSORIES_STATUS_VALUES);
export type AccessoriesStatus = z.infer<typeof AccessoriesStatusEnum>;

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
  retired: '폐기', // deprecated - disposed 사용 권장
  pending_disposal: '폐기대기',
  disposed: '폐기완료',
  temporary: '임시등록',
  inactive: '비활성',
};

/**
 * 장비 상태 i18n 키 맵 (Phase 1+: LABELS 대체 예정)
 *
 * 사용법:
 * ```tsx
 * const t = useTranslations('equipment');
 * <Badge>{t(EQUIPMENT_STATUS_LABEL_KEYS[status])}</Badge>
 * ```
 */
export const EQUIPMENT_STATUS_LABEL_KEYS: Record<EquipmentStatus, string> = {
  available: 'status.available',
  in_use: 'status.in_use',
  checked_out: 'status.checked_out',
  calibration_scheduled: 'status.calibration_scheduled',
  calibration_overdue: 'status.calibration_overdue',
  non_conforming: 'status.non_conforming',
  spare: 'status.spare',
  retired: 'status.retired',
  pending_disposal: 'status.pending_disposal',
  disposed: 'status.disposed',
  temporary: 'status.temporary',
  inactive: 'status.inactive',
};

/**
 * UI 필터에 표시할 장비 상태 목록
 * - deprecated, 시스템 생성, 내부 전용 상태는 제외
 * - retired: deprecated (disposed로 대체)
 * - calibration_scheduled: 시스템이 자동으로 생성하는 상태
 * - temporary, inactive: 내부 공용/렌탈 장비 워크플로 전용
 */
export const EQUIPMENT_STATUS_FILTER_OPTIONS: EquipmentStatus[] = [
  'available',
  'in_use',
  'checked_out',
  'calibration_overdue',
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
  system_admin: '시스템 관리자',
};

/**
 * 반출 상태 라벨 (UI 표시용)
 */
export const CHECKOUT_STATUS_LABELS: Record<CheckoutStatus, string> = {
  pending: '승인 대기',
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
 */
export const CHECKOUT_PURPOSE_LABELS: Record<CheckoutPurpose, string> = {
  calibration: '교정',
  repair: '수리',
  rental: '대여',
  return_to_vendor: '렌탈 반납',
};

/**
 * 부적합 상태 라벨 (UI 표시용)
 */
export const NON_CONFORMANCE_STATUS_LABELS: Record<NonConformanceStatus, string> = {
  open: '등록됨',
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
  calibration_overdue: '교정 기한 초과',
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
  calibration_overdue: '교정 기한 초과',
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
 * 교정 승인 상태 값 객체 (dot-notation 접근용)
 * @example CalibrationApprovalStatusValues.PENDING_APPROVAL // 'pending_approval'
 */
export const CalibrationApprovalStatusValues = {
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

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

/**
 * 상태 확인 단계 라벨 (UI 표시용)
 */
export const CONDITION_CHECK_STEP_LABELS: Record<ConditionCheckStep, string> = {
  lender_checkout: '① 반출 전 확인 (빌려주는 측)',
  borrower_receive: '② 인수 시 확인 (빌리는 측)',
  borrower_return: '③ 반납 전 확인 (빌린 측)',
  lender_return: '④ 반입 시 확인 (빌려준 측)',
};

/**
 * 외관/작동 상태 라벨 (UI 표시용)
 */
export const CONDITION_STATUS_LABELS: Record<ConditionStatus, string> = {
  normal: '정상',
  abnormal: '이상',
};

/**
 * 부속품 상태 라벨 (UI 표시용)
 */
export const ACCESSORIES_STATUS_LABELS: Record<AccessoriesStatus, string> = {
  complete: '완전',
  incomplete: '불완전',
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
 * @example NotificationTypeValues.CHECKOUT_CREATED // 'checkout_created'
 */
export const NotificationTypeValues = {
  // 신규 이벤트 기반 타입
  CHECKOUT_CREATED: 'checkout_created',
  CHECKOUT_APPROVED: 'checkout_approved',
  CHECKOUT_REJECTED: 'checkout_rejected',
  CHECKOUT_STARTED: 'checkout_started',
  CHECKOUT_RETURNED: 'checkout_returned',
  CHECKOUT_RETURN_APPROVED: 'checkout_return_approved',
  CHECKOUT_OVERDUE: 'checkout_overdue',
  CALIBRATION_CREATED: 'calibration_created',
  CALIBRATION_APPROVED: 'calibration_approved',
  CALIBRATION_REJECTED: 'calibration_rejected',
  CALIBRATION_DUE_SOON: 'calibration_due_soon',
  CALIBRATION_OVERDUE: 'calibration_overdue',
  NON_CONFORMANCE_CREATED: 'non_conformance_created',
  NON_CONFORMANCE_CORRECTED: 'non_conformance_corrected',
  NON_CONFORMANCE_CLOSED: 'non_conformance_closed',
  NON_CONFORMANCE_CORRECTION_REJECTED: 'non_conformance_correction_rejected',
  EQUIPMENT_REQUEST_CREATED: 'equipment_request_created',
  EQUIPMENT_REQUEST_APPROVED: 'equipment_request_approved',
  EQUIPMENT_REQUEST_REJECTED: 'equipment_request_rejected',
  DISPOSAL_REQUESTED: 'disposal_requested',
  DISPOSAL_REVIEWED: 'disposal_reviewed',
  DISPOSAL_APPROVED: 'disposal_approved',
  DISPOSAL_REJECTED: 'disposal_rejected',
  EQUIPMENT_IMPORT_CREATED: 'equipment_import_created',
  EQUIPMENT_IMPORT_APPROVED: 'equipment_import_approved',
  EQUIPMENT_IMPORT_REJECTED: 'equipment_import_rejected',
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
  // 레거시 호환
  CALIBRATION_DUE: 'calibration_due',
  CALIBRATION_COMPLETED: 'calibration_completed',
  CALIBRATION_APPROVAL_PENDING: 'calibration_approval_pending',
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
  CALIBRATION_OVERDUE: 'calibration_overdue',
} as const;

/**
 * 부적합 유형 값 객체 (dot-notation 접근용)
 * @example NonConformanceTypeValues.DAMAGE // 'damage'
 */
export const NonConformanceTypeValues = {
  DAMAGE: 'damage',
  MALFUNCTION: 'malfunction',
  CALIBRATION_FAILURE: 'calibration_failure',
  CALIBRATION_OVERDUE: 'calibration_overdue',
  MEASUREMENT_ERROR: 'measurement_error',
  OTHER: 'other',
} as const;

/**
 * 부적합 상태 값 객체 (dot-notation 접근용)
 * @example NonConformanceStatusValues.OPEN // 'open'
 */
export const NonConformanceStatusValues = {
  OPEN: 'open',
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
  RETIRED: 'retired', // deprecated - DISPOSED 사용 권장
  PENDING_DISPOSAL: 'pending_disposal',
  DISPOSED: 'disposed',
  TEMPORARY: 'temporary',
  INACTIVE: 'inactive',
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
  SYSTEM_ADMIN: 'system_admin',
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

/**
 * 반출 상태 값 객체 (dot-notation 접근용)
 * @example CheckoutStatusValues.PENDING // 'pending'
 */
export const CheckoutStatusValues = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CHECKED_OUT: 'checked_out',
  LENDER_CHECKED: 'lender_checked',
  BORROWER_RECEIVED: 'borrower_received',
  IN_USE: 'in_use',
  BORROWER_RETURNED: 'borrower_returned',
  LENDER_RECEIVED: 'lender_received',
  RETURNED: 'returned',
  RETURN_APPROVED: 'return_approved',
  OVERDUE: 'overdue',
  CANCELED: 'canceled',
} as const;

/**
 * 반출 목적 값 객체 (dot-notation 접근용)
 * @example CheckoutPurposeValues.CALIBRATION // 'calibration'
 */
export const CheckoutPurposeValues = {
  CALIBRATION: 'calibration',
  REPAIR: 'repair',
  RENTAL: 'rental',
  RETURN_TO_VENDOR: 'return_to_vendor',
} as const;

/**
 * 상태 확인 단계 값 객체 (dot-notation 접근용)
 * @example ConditionCheckStepValues.LENDER_CHECKOUT // 'lender_checkout'
 */
export const ConditionCheckStepValues = {
  LENDER_CHECKOUT: 'lender_checkout',
  BORROWER_RECEIVE: 'borrower_receive',
  BORROWER_RETURN: 'borrower_return',
  LENDER_RETURN: 'lender_return',
} as const;

/**
 * 외관/작동 상태 값 객체 (dot-notation 접근용)
 * @example ConditionStatusValues.NORMAL // 'normal'
 */
export const ConditionStatusValues = {
  NORMAL: 'normal',
  ABNORMAL: 'abnormal',
} as const;

/**
 * 부속품 상태 값 객체 (dot-notation 접근용)
 * @example AccessoriesStatusValues.COMPLETE // 'complete'
 */
export const AccessoriesStatusValues = {
  COMPLETE: 'complete',
  INCOMPLETE: 'incomplete',
} as const;

// ============================================================================
// 통합 승인 상태 (승인 관리 통합 페이지용)
// ============================================================================

/**
 * SINGLE SOURCE OF TRUTH: 통합 승인 상태 열거형
 *
 * 승인 관리 통합 페이지에서 사용하는 표준 승인 상태입니다.
 * 다단계 승인 프로세스를 지원합니다.
 *
 * ⚠️ 주의: equipment-request.ts의 ApprovalStatus와 구분하기 위해
 * "UnifiedApprovalStatus"로 명명합니다.
 *
 * 표준 상태값 (소문자 + 언더스코어):
 * - pending: 대기 (1단계 승인용)
 * - pending_review: 검토 대기 (다단계 1단계)
 * - reviewed: 검토 완료 (다단계 2단계 대기)
 * - approved: 승인 완료
 * - rejected: 반려
 *
 * 상태 전이 예시:
 * - 1단계 승인: pending → approved/rejected
 * - 2단계 승인 (폐기): pending_review → reviewed → approved/rejected
 * - 3단계 승인 (교정계획서): pending_review → reviewed → approved/rejected
 *
 * @see docs/development/FRONTEND_UI_PROMPTS(UI-3: 승인 관리 통합 페이지_수정O).md
 */
export const UNIFIED_APPROVAL_STATUS_VALUES = [
  'pending', // 대기 (1단계 승인용)
  'pending_review', // 검토 대기 (다단계 1단계)
  'reviewed', // 검토 완료 (다단계 2단계 대기)
  'approved', // 승인 완료
  'rejected', // 반려
] as const;

export const UnifiedApprovalStatusEnum = z.enum(UNIFIED_APPROVAL_STATUS_VALUES);
export type UnifiedApprovalStatus = z.infer<typeof UnifiedApprovalStatusEnum>;

/**
 * 통합 승인 상태 라벨 (UI 표시용)
 */
export const UNIFIED_APPROVAL_STATUS_LABELS: Record<UnifiedApprovalStatus, string> = {
  pending: '대기',
  pending_review: '검토 대기',
  reviewed: '검토 완료',
  approved: '승인 완료',
  rejected: '반려',
};

/**
 * 통합 승인 상태 값 객체 (dot-notation 접근용)
 * @example UnifiedApprovalStatusValues.PENDING // 'pending'
 */
export const UnifiedApprovalStatusValues = {
  PENDING: 'pending',
  PENDING_REVIEW: 'pending_review',
  REVIEWED: 'reviewed',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// Disposal reason enum
export const DISPOSAL_REASON_VALUES = ['obsolete', 'broken', 'inaccurate', 'other'] as const;
export const DisposalReasonEnum = z.enum(DISPOSAL_REASON_VALUES);
export type DisposalReason = z.infer<typeof DisposalReasonEnum>;

export const DISPOSAL_REASON_LABELS: Record<DisposalReason, string> = {
  obsolete: '노후화',
  broken: '고장 (수리 불가)',
  inaccurate: '정밀도/정확도 미보장',
  other: '기타',
};

// Disposal review status enum
export const DISPOSAL_REVIEW_STATUS_VALUES = [
  'pending',
  'reviewed',
  'approved',
  'rejected',
] as const;
export const DisposalReviewStatusEnum = z.enum(DISPOSAL_REVIEW_STATUS_VALUES);
export type DisposalReviewStatus = z.infer<typeof DisposalReviewStatusEnum>;

export const DISPOSAL_REVIEW_STATUS_LABELS: Record<DisposalReviewStatus, string> = {
  pending: '검토 대기',
  reviewed: '검토 완료',
  approved: '승인 완료',
  rejected: '반려됨',
};

/**
 * 폐기 검토 상태 값 객체 (dot-notation 접근용)
 * @example DisposalReviewStatusValues.PENDING // 'pending'
 */
export const DisposalReviewStatusValues = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// ============================================================================
// 장비 반입 관련 ENUM (렌탈 + 내부 공용 통합)
// ============================================================================

/**
 * SINGLE SOURCE OF TRUTH: 장비 반입 출처 타입 열거형
 *
 * 장비 반입 시스템은 두 가지 출처를 지원합니다:
 * - rental: 외부 렌탈 업체 (vendor 정보 필수)
 * - internal_shared: 내부 공용장비 (ownerDepartment 정보 필수)
 *
 * 이 필드는 discriminator로 사용되어 조건부 validation을 제어합니다.
 */
export const EQUIPMENT_IMPORT_SOURCE_VALUES = [
  'rental', // 외부 렌탈 업체
  'internal_shared', // 내부 공용장비
] as const;

export const EquipmentImportSourceEnum = z.enum(EQUIPMENT_IMPORT_SOURCE_VALUES);
export type EquipmentImportSource = z.infer<typeof EquipmentImportSourceEnum>;

/**
 * 장비 반입 출처 라벨 (UI 표시용)
 */
export const EQUIPMENT_IMPORT_SOURCE_LABELS: Record<EquipmentImportSource, string> = {
  rental: '외부 렌탈',
  internal_shared: '내부 공용',
};

/**
 * SINGLE SOURCE OF TRUTH: 장비 반입 상태 열거형
 *
 * 통합 반입 워크플로우 상태 (렌탈 + 내부 공용):
 * - pending: 반입 신청 (승인 대기)
 * - approved: 승인됨 (장비 도착 대기)
 * - rejected: 거절됨
 * - received: 수령 완료 (장비 자동 등록됨)
 * - return_requested: 반납 진행 중 (checkout 생성됨)
 * - returned: 반납 완료 (장비 비활성화)
 * - canceled: 취소됨
 */
export const EQUIPMENT_IMPORT_STATUS_VALUES = [
  'pending', // 반입 신청 (승인 대기)
  'approved', // 승인됨 (장비 도착 대기)
  'rejected', // 거절됨
  'received', // 수령 완료 (장비 자동 등록됨)
  'return_requested', // 반납 진행 중 (checkout 생성됨)
  'returned', // 반납 완료 (장비 비활성화)
  'canceled', // 취소됨
] as const;

export const EquipmentImportStatusEnum = z.enum(EQUIPMENT_IMPORT_STATUS_VALUES);
export type EquipmentImportStatus = z.infer<typeof EquipmentImportStatusEnum>;

/**
 * 장비 반입 상태 라벨 (UI 표시용)
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

/**
 * 장비 반입 상태 값 객체 (dot-notation 접근용)
 * @example EquipmentImportStatusValues.PENDING // 'pending'
 */
export const EquipmentImportStatusValues = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  RECEIVED: 'received',
  RETURN_REQUESTED: 'return_requested',
  RETURNED: 'returned',
  CANCELED: 'canceled',
} as const;

// ============================================================================
// Notification Frequency
// ============================================================================

export const NotificationFrequencyEnum = z.enum(['immediate', 'daily', 'weekly']);
export type NotificationFrequency = z.infer<typeof NotificationFrequencyEnum>;
export const NOTIFICATION_FREQUENCY_VALUES = NotificationFrequencyEnum.options;

// ============================================================================
// 승인 액션 (approve/reject — 공통)
// ============================================================================

export const APPROVAL_ACTION_VALUES = ['approve', 'reject'] as const;
export const ApprovalActionEnum = z.enum(APPROVAL_ACTION_VALUES);
export type ApprovalAction = z.infer<typeof ApprovalActionEnum>;

// ============================================================================
// 보고서 형식/기간
// ============================================================================

export const REPORT_FORMAT_VALUES = ['excel', 'csv', 'pdf'] as const;
export const ReportFormatEnum = z.enum(REPORT_FORMAT_VALUES);
export type ReportFormat = z.infer<typeof ReportFormatEnum>;

export const REPORT_PERIOD_VALUES = ['week', 'month', 'quarter', 'year'] as const;
export const ReportPeriodEnum = z.enum(REPORT_PERIOD_VALUES);
export type ReportPeriod = z.infer<typeof ReportPeriodEnum>;

// ============================================================================
// 정렬 순서 (공통)
// ============================================================================

export const SORT_ORDER_VALUES = ['asc', 'desc'] as const;
export const SortOrderEnum = z.enum(SORT_ORDER_VALUES);
export type SortOrder = z.infer<typeof SortOrderEnum>;

// ============================================================================
// 반출 방향 (outbound/inbound)
// ============================================================================

export const CHECKOUT_DIRECTION_VALUES = ['outbound', 'inbound'] as const;
export const CheckoutDirectionEnum = z.enum(CHECKOUT_DIRECTION_VALUES);
export type CheckoutDirection = z.infer<typeof CheckoutDirectionEnum>;

// ============================================================================
// DEPRECATED: Legacy rental import types (backward compatibility)
// ============================================================================
