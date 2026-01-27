/**
 * 관리번호 체계 관련 상수 및 헬퍼
 * 관리번호 형식: XXX-XYYYY
 * - XXX: 시험소코드 (3자리) - SUW(수원), UIW(의왕), PYT(평택)
 * - X: 분류코드 (1자리) - E, R, W, S, A, P
 * - YYYY: 일련번호 (4자리) - 0001~9999
 *
 * @example 'SUW-E0001' (수원 FCC EMC/RF 첫 번째 장비)
 */

import type { Site, Classification, SiteCode } from '@equipment-management/schemas';

// ============================================================================
// 사이트 관련 상수
// ============================================================================

/**
 * 사이트명 → 시험소코드 매핑
 */
export const SITE_TO_CODE: Record<Site, SiteCode> = {
  suwon: 'SUW',
  uiwang: 'UIW',
  pyeongtaek: 'PYT',
};

/**
 * 시험소코드 → 사이트명 매핑
 */
export const CODE_TO_SITE: Record<SiteCode, Site> = {
  SUW: 'suwon',
  UIW: 'uiwang',
  PYT: 'pyeongtaek',
};

/**
 * 사이트 선택 옵션 (UI용)
 */
export const SITE_OPTIONS: Array<{ value: Site; label: string; code: SiteCode }> = [
  { value: 'suwon', label: '수원', code: 'SUW' },
  { value: 'uiwang', label: '의왕', code: 'UIW' },
  { value: 'pyeongtaek', label: '평택', code: 'PYT' },
];

// ============================================================================
// 분류 관련 상수
// ============================================================================

/**
 * 분류 → 분류코드 매핑
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
 * 분류코드 → 분류 매핑
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
 * 분류 선택 옵션 (UI용)
 * ✅ 팀 이름 = 분류 이름 (통일)
 */
export const CLASSIFICATION_OPTIONS: Array<{
  value: Classification;
  label: string;
  code: string;
  description: string;
}> = [
  {
    value: 'fcc_emc_rf',
    label: 'FCC EMC/RF',
    code: 'E',
    description: 'FCC 규격 EMC/RF 시험 장비',
  },
  {
    value: 'general_emc',
    label: 'General EMC',
    code: 'R',
    description: '일반 EMC 시험 장비',
  },
  {
    value: 'general_rf',
    label: 'General RF',
    code: 'W',
    description: '일반 RF 시험 장비 (의왕)',
  },
  {
    value: 'sar',
    label: 'SAR',
    code: 'S',
    description: '전자파 흡수율(SAR) 시험 장비',
  },
  {
    value: 'automotive_emc',
    label: 'Automotive EMC',
    code: 'A',
    description: '차량용 EMC 시험 장비',
  },
  {
    value: 'software',
    label: 'Software Program',
    code: 'P',
    description: '측정/분석 소프트웨어',
  },
];

// ============================================================================
// 관리번호 헬퍼 함수
// ============================================================================

/**
 * 관리번호 정규식 패턴
 * 분류코드: E(FCC EMC/RF), R(General EMC), W(General RF), S(SAR), A(Automotive EMC), P(Software)
 */
export const MANAGEMENT_NUMBER_PATTERN = /^(SUW|UIW|PYT)-[ERWSAP]\d{4}$/;

/**
 * 관리번호 생성
 * @param site 사이트명
 * @param classification 분류
 * @param serialNumber 일련번호 (4자리 숫자 문자열 또는 숫자)
 * @returns 관리번호 (예: 'SUW-E0001')
 */
export function generateManagementNumber(
  site: Site,
  classification: Classification,
  serialNumber: string | number
): string {
  const siteCode = SITE_TO_CODE[site];
  const classificationCode = CLASSIFICATION_TO_CODE[classification];
  const serial = typeof serialNumber === 'number' ? serialNumber.toString().padStart(4, '0') : serialNumber;
  return `${siteCode}-${classificationCode}${serial}`;
}

/**
 * 관리번호 파싱
 * @param managementNumber 관리번호
 * @returns 파싱 결과 또는 null
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

/**
 * 관리번호 유효성 검사
 * @param managementNumber 관리번호
 * @returns 유효 여부
 */
export function isValidManagementNumber(managementNumber: string): boolean {
  return MANAGEMENT_NUMBER_PATTERN.test(managementNumber);
}

/**
 * 일련번호 포맷팅 (4자리 앞자리 0 채움)
 * @param serialNumber 일련번호 (숫자 또는 문자열)
 * @returns 4자리 문자열
 */
export function formatSerialNumber(serialNumber: string | number): string {
  const num = typeof serialNumber === 'string' ? parseInt(serialNumber, 10) : serialNumber;
  if (isNaN(num) || num < 1 || num > 9999) {
    return '';
  }
  return num.toString().padStart(4, '0');
}
