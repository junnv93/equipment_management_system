/**
 * UL-QP-18-06 장비 반·출입 확인서 DOCX 레이아웃 SSOT (backend-local).
 *
 * 원본 양식의 셀 좌표 + 행 인덱스를 SSOT로 분리.
 * checkout(반출) variant와 rental-import variant가 동일한 QP-18-06 템플릿을 공유.
 *
 * ⚠️ 셀 좌표는 원본 docx 실측값이어야 한다. 양식 개정 시 docx XML 덤프 후 재측정.
 *
 * @see docs/procedure/template/UL-QP-18-06 장비 반출입 확인서.docx — 원본 양식
 */

/** 양식 번호 */
export const FORM_NUMBER = 'UL-QP-18-06' as const;

/**
 * T0 단일 테이블 행 인덱스 SSOT.
 *
 * 양식 구조 (행 순서):
 * R1  : 결재란 — 반출 시점 (C1=작성자서명, C2=승인자서명)
 * R2  : 반출지(C1) / 전화번호(C3)
 * R3  : 반출주소(C1)
 * R4  : 반출사유(C1)
 * R5  : 반출 확인 문장(C0)
 * R6~R8 : 장비 목록 헤더 (보존)
 * R9~R22: 장비 목록 데이터 14행
 * R23 : 특기사항(C1)
 * R24 : 반입 확인 문장(C0)
 * R25 : 결재란 — 반입 시점 (C1=작성자서명, C2=승인자서명)
 */
export const ROWS = {
  checkoutSignOff: 1,
  destination: 2,
  address: 3,
  reason: 4,
  checkoutConfirmText: 5,
  itemsStart: 9,
  itemsCount: 14,
  remarks: 23,
  returnConfirmText: 24,
  returnSignOff: 25,
} as const;

/** 반출지 행 열 인덱스 */
export const DESTINATION_ROW_COLS = {
  destination: 1,
  phoneNumber: 3,
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

/**
 * QP-18-06 전용 날짜 형식: "YYYY . MM . DD ."
 *
 * 원본 양식의 날짜 필드 형식에 맞춰 공백을 포함한 점 구분자를 사용.
 */
export function formatQp1806Date(d: Date | string | null | undefined): string {
  if (!d) return '-';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '-';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y} . ${m} . ${day} .`;
}
