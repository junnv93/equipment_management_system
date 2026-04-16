/**
 * Excel 스타일 상수 (SSOT)
 *
 * excel-parser.service.ts에서 사용하는 모든 색상, 페이지 설정을 중앙화.
 * 매직 넘버(ARGB 코드) 인라인 사용 금지 — 반드시 이 상수를 참조.
 */

/** ARGB 색상 상수 */
export const EXCEL_COLORS = {
  /** 흰색 폰트 */
  WHITE: 'FFFFFFFF',
  /** 진한 남색 (에러 리포트 헤더 배경) */
  NAVY_HEADER: 'FF1E3A5F',
  /** 연한 빨강 (에러 행 배경) */
  ERROR_FILL: 'FFFEE2E2',
  /** 연한 노랑 (중복 행 배경) */
  DUPLICATE_FILL: 'FFFEF9C3',
  /** 회색 (셀 테두리) */
  BORDER: 'FFE5E7EB',
  /** 진한 파랑 (필수 컬럼 헤더) */
  REQUIRED_HEADER: 'FF1D4ED8',
  /** 파랑 (선택 컬럼 헤더) */
  OPTIONAL_HEADER: 'FF2563EB',
} as const;

/** 공통 페이지 설정 (A4 가로) */
export const EXCEL_PAGE_SETUP = {
  paperSize: 9,
  orientation: 'landscape' as const,
};

/** 공통 헤더 행 높이 */
export const EXCEL_HEADER_ROW_HEIGHT = 28;
