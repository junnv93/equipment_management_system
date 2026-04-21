/**
 * 공용 장비 양식 DOCX 셀 인덱스 SSOT.
 *
 * UL-QP-18-06, UL-QP-18-10 등 동일한 열 구조를 사용하는 양식들의
 * 셀 인덱스를 단일 소스로 관리한다.
 *
 * ⚠️ 인덱스 값은 원본 docx XML 실측값이어야 한다.
 *   양식 개정으로 열 구조가 바뀌면 docx XML 덤프 후 재측정.
 */

/** 2열(레이블·데이터) 테이블에서 데이터 셀의 열 인덱스 (0-based) */
export const TEXT_COL = 1 as const;

/**
 * 전체 너비로 병합된 셀의 열 인덱스 (0-based).
 * 확인 문장 행처럼 모든 컬럼이 병합된 단일 셀에 사용.
 */
export const MERGED_TEXT_COL = 0 as const;
