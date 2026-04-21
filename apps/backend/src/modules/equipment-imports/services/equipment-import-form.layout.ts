/**
 * UL-QP-18-10 공용 장비 사용/반납 확인서 DOCX 레이아웃 SSOT (backend-local).
 *
 * 단일 테이블 25행 구조 (Part1: 사용 확인서 R0~R13, Part2: 반납 확인서 R14~R24).
 *
 * ⚠️ 셀 좌표는 원본 docx 실측값이어야 한다. 양식 개정 시 docx XML 덤프 후 재측정.
 *
 * @see docs/procedure/template/UL-QP-18-10 공용장비 사용반납 확인서.docx — 원본 양식
 */

/** 양식 번호 */
export const FORM_NUMBER = 'UL-QP-18-10' as const;

/**
 * T0 단일 테이블 행 인덱스 SSOT.
 *
 * Part1 (사용 확인서):
 * R1 : 결재란 — Part1 (C1=작성자서명, C2=승인자서명)
 * R2 : 사용부서(C1) / 사용자(C3)
 * R3 : 사용장소(C1) / 사용기간(C3)
 * R4 : 사용목적(C1)
 * R5 : 사용 확인 문장(C0)
 * R9~R13: 장비 데이터 행 5개
 *
 * Part2 (반납 확인서):
 * R15: 결재란 — Part2 (C1=작성자서명, C2=승인자서명)
 * R18~R22: 반납 데이터 행 5개
 * R23: 특기사항(C1)
 * R24: 반납 확인 문장(C0)
 */
export const ROWS = {
  part1SignOff: 1,
  usageDepartment: 2,
  usageLocation: 3,
  usagePurpose: 4,
  usageConfirmText: 5,
  part1ItemsStart: 9,
  part1ItemsCount: 5,
  part2SignOff: 15,
  part2ItemsStart: 18,
  part2ItemsCount: 5,
  remarks: 23,
  returnConfirmText: 24,
} as const;

/** 사용부서/사용자 행 열 인덱스 */
export const USAGE_ROW_COLS = {
  department: 1,
  user: 3,
} as const;

/** 사용장소/사용기간 행 열 인덱스 */
export const LOCATION_PERIOD_ROW_COLS = {
  location: 1,
  period: 3,
} as const;

/** 장비 목록 행 열 인덱스 (0-based) */
export const ITEM_COLS = {
  name: 1,
  model: 2,
  quantity: 3,
  managementNumber: 4,
  conditionBefore: 5,
  conditionAfter: 6,
} as const;

/** 결재란 열 인덱스 */
export const SIGN_OFF_COLS = {
  requester: 1,
  approver: 2,
} as const;

/** 단일 데이터 셀 행(사용목적/특기사항 등)의 열 인덱스 */
export const TEXT_COL = 1 as const;

/**
 * 병합된 전체 너비 셀의 셀 인덱스.
 * 확인 문장 행(R5 사용확인, R24 반납확인)은 원본 docx에서 모든 컬럼이 병합된 단일 셀.
 */
export const MERGED_TEXT_COL = 0 as const;

/**
 * QP-18-10 공용 날짜 형식 (QP-18-06과 동일 "YYYY . MM . DD .").
 */
export function formatQp1810Date(d: Date | string | null | undefined): string {
  if (!d) return '-';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '-';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y} . ${m} . ${day} .`;
}

/**
 * jsonb enum → 한국어 변환 SSOT.
 *
 * `condition` jsonb 필드의 appearance/operation/abnormality 값을 한국어로 변환.
 */
export function koConditionLabel(v: string | undefined): string {
  const map: Record<string, string> = {
    normal: '정상',
    abnormal: '이상',
    none: '없음',
    complete: '완비',
    incomplete: '불완전',
  };
  return map[v ?? ''] ?? v ?? '-';
}
