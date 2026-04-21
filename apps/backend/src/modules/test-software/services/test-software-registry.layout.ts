/**
 * UL-QP-18-07 시험용 소프트웨어 관리대장 DOCX 레이아웃 SSOT (backend-local).
 *
 * 원본 양식의 테이블 구조 + 열 순서를 SSOT로 분리.
 * 양식 개정 시 본 파일만 수정하면 renderer는 수정 불필요.
 *
 * ⚠️ 셀 구조는 원본 docx 실측값이어야 한다. 양식 개정 시 docx XML 덤프 후 재측정.
 *
 * @see docs/procedure/template/UL-QP-18-07 시험용 소프트웨어 관리대장.docx — 원본 양식
 */

/** 양식 번호 (에러 메시지 prefix, 파일명 등에 사용) */
export const FORM_NUMBER = 'UL-QP-18-07' as const;

/**
 * T0 테이블 구조 — 10열 단일 테이블.
 *
 * - R0: 헤더행 (보존)
 * - R1: 템플릿 데이터행 (복제 기준 — setDataRows 원본)
 * - R2~R21: 빈 행 20개 (setDataRows 제거 대상)
 *
 * 10열 순서 (0-based):
 * 0. 관리번호
 * 1. SW명
 * 2. 버전
 * 3. 시험분야
 * 4. 담당자(정,부)
 * 5. 설치일자
 * 6. 제작사
 * 7. 위치
 * 8. 가용여부
 * 9. 유효성확인대상
 */
export const TABLE = {
  tableIndex: 0,
  headerRow: 0,
  templateDataRow: 1,
  emptyRows: 20,
  columnCount: 10,
} as const;

/** 열 인덱스 SSOT (0-based) */
export const COL = {
  managementNumber: 0,
  name: 1,
  softwareVersion: 2,
  testField: 3,
  managers: 4,
  installedAt: 5,
  manufacturer: 6,
  location: 7,
  availability: 8,
  requiresValidation: 9,
} as const;
