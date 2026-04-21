/**
 * UL-QP-18-08 Cable and Path Loss 관리대장 XLSX 레이아웃 SSOT (backend-local).
 *
 * 시트 구조 + 열 정의 + 열 너비를 SSOT로 분리.
 * 양식 개정 시 본 파일만 수정하면 renderer는 수정 불필요.
 *
 * ⚠️ 시트명, 열 순서는 원본 xlsx 실측값이어야 한다.
 *
 * @see docs/procedure/template/UL-QP-18-08 Cable and Path Loss.xlsx — 원본 양식
 */

/** 양식 번호 */
export const FORM_NUMBER = 'UL-QP-18-08' as const;

/** 시트 이름 SSOT */
export const SHEET_NAMES = {
  /** 시트1: 케이블 목록 */
  list: 'RF Conducted',
} as const;

/**
 * 케이블 목록 시트 열 인덱스 (1-based — ExcelJS 규약).
 *
 * 열 순서: No | 관리번호 | Length(M) | TYPE | 사용 주파수 범위 | S/N | 위치
 */
export const LIST_SHEET_COLS = {
  no: 1,
  managementNumber: 2,
  length: 3,
  type: 4,
  frequencyRange: 5,
  serialNumber: 6,
  location: 7,
} as const;

export const LIST_SHEET_HEADERS = [
  'No',
  '관리번호',
  'Length (M)',
  'TYPE',
  '사용 주파수 범위',
  'S/N',
  '위치',
] as const;

/** 열 너비 배열 (1-based 순서와 동일, 0-based 배열) */
export const LIST_SHEET_COLUMN_WIDTHS = [5, 14, 12, 8, 24, 14, 18] as const;

/** 목록 시트 데이터 시작 행 (1=헤더, 2=첫 데이터) */
export const LIST_DATA_START_ROW = 2;

/**
 * 개별 케이블 Path Loss 시트 구조.
 *
 * 시트명: 케이블 관리번호 (슬래시/특수문자 → '_', 31자 이하)
 *
 * R1: Cable: {관리번호}
 * R2: Measured: {측정일}
 * R4: 헤더 (Freq(MHz) | Data(dB))
 * R5+: 데이터 포인트
 */
export const DETAIL_SHEET = {
  infoRow: 1,
  dateRow: 2,
  headerRow: 4,
  dataStartRow: 5,
  freqCol: 1,
  lossCol: 2,
  columnWidths: [14, 14],
  freqNumFmt: '#,##0',
  lossNumFmt: '0.000',
} as const;

/** Excel 시트명 최대 길이 (Excel 규격) */
export const EXCEL_SHEET_NAME_MAX = 31;

/** 시트명에 허용되지 않는 문자 (Excel 규격) */
export const EXCEL_SHEET_NAME_INVALID_CHARS_RE = /[:\\/?*[\]]/g;
