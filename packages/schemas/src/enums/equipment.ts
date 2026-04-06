import { z } from 'zod';
import { optionalUuid } from '../utils/fields';

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
// ✅ 팀 ID는 UUID 형식의 문자열 (HTML 폼 빈 문자열 안전)
export const TeamIdSchema = optionalUuid();

export type TeamId = z.infer<typeof TeamIdSchema>;

/**
 * 위치 값 배열 (LocationEnum SSOT — 중복 선언 금지)
 */
export const LOCATION_VALUES = LocationEnum.options;
