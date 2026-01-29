/**
 * 관리번호 체계 관련 상수 및 헬퍼
 *
 * ⚠️ SSOT: 핵심 로직은 @equipment-management/schemas에서 import
 * 이 파일에서는 프론트엔드 전용 UI 옵션만 정의
 *
 * 관리번호 형식: XXX-XYYYY
 * - XXX: 시험소코드 (3자리) - SUW(수원), UIW(의왕), PYT(평택)
 * - X: 분류코드 (1자리) - E, R, W, S, A, P
 * - YYYY: 일련번호 (4자리) - 0001~9999
 *
 * @example 'SUW-E0001' (수원 FCC EMC/RF 첫 번째 장비)
 */

// ============================================================================
// SSOT: @equipment-management/schemas에서 핵심 로직 re-export
// ============================================================================
export {
  // 타입
  type Site,
  type SiteCode,
  type Classification,
  // 상수 매핑
  SITE_TO_CODE,
  CODE_TO_SITE,
  CLASSIFICATION_TO_CODE,
  CODE_TO_CLASSIFICATION,
  CLASSIFICATION_LABELS,
  SITE_LABELS,
  // 정규식
  MANAGEMENT_NUMBER_PATTERN,
  // 헬퍼 함수
  generateManagementNumber,
  parseManagementNumber,
} from '@equipment-management/schemas';

import type { Site, SiteCode, Classification } from '@equipment-management/schemas';

// ============================================================================
// 프론트엔드 전용: UI 선택 옵션
// ============================================================================

/**
 * 사이트 선택 옵션 (UI용)
 * 드롭다운, 라디오 버튼 등에 사용
 */
export const SITE_OPTIONS: Array<{ value: Site; label: string; code: SiteCode }> = [
  { value: 'suwon', label: '수원', code: 'SUW' },
  { value: 'uiwang', label: '의왕', code: 'UIW' },
  { value: 'pyeongtaek', label: '평택', code: 'PYT' },
];

/**
 * 분류 선택 옵션 (UI용)
 * 드롭다운, 라디오 버튼 등에 사용
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
// 프론트엔드 전용: 추가 유틸리티 함수
// ============================================================================

/**
 * 관리번호 유효성 검사
 * @param managementNumber 관리번호
 * @returns 유효 여부
 */
export function isValidManagementNumber(managementNumber: string): boolean {
  const { MANAGEMENT_NUMBER_PATTERN } = require('@equipment-management/schemas');
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
