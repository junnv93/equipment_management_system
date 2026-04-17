/**
 * UL-QP-18-01 시험설비 관리대장 XLSX 레이아웃 SSOT (backend-local).
 *
 * 원본 양식의 시트명/제목/컬럼 구조를 SSOT로 분리하여 양식 개정 시 surgical update 가능.
 *
 * ⚠️ 컬럼 헤더 문자열은 **원본 xlsx 실측값**과 1:1 일치해야 한다.
 *    양식 개정 시 ExcelJS로 워크시트를 로드해 `sheet.getRow(2).values`로 실측.
 *
 * @see docs/procedure/template/UL-QP-18-01(02) 시험설비 관리대장.xlsx — 원본 양식
 * @see docs/procedure/양식/QP-18-01_시험설비관리대장.md — 양식 사양
 * @see docs/manual/report-export-mapping.md §3.1 — 현재 매핑 문서
 *
 * 프론트엔드 미참조: 양식 셀 레이아웃은 UI에 노출되지 않음.
 */

/** 양식 번호 (에러 메시지 prefix, 파일명 등에 사용) */
export const FORM_NUMBER = 'UL-QP-18-01' as const;

/**
 * 허용되는 워크시트명 — 양식 변종(띄어쓰기 차이) 대응.
 *
 * 매칭 순서대로 탐색하며, 처음 일치하는 시트를 반환.
 * 양식 원본 텍스트가 우선 (인덱스 0), 대체 시트명은 legacy 호환.
 */
export const SHEET_NAMES = ['시험설비 관리대장', '시험설비 관리 대장'] as const;

/** Row 1 헤더 셀의 제목 prefix — `(전체) 시험설비 관리대장` 형태로 조립 */
export const TITLE_PREFIX = '시험설비 관리대장' as const;

/** teamId 필터가 없을 때(전사 범위) 제목 앞에 붙는 접미사 */
export const TITLE_ALL_SUFFIX = '(전체)' as const;

/**
 * Row 1의 "최종 업데이트 일자" 셀 위치 (1-based — ExcelJS 컨벤션).
 *
 * 양식 원본: Row 1, Column 14 (N열).
 */
export const UPDATE_DATE_CELL = { row: 1, col: 14 } as const;

/**
 * 데이터 주입 시작 행 (1-based).
 *
 * - Row 1: 제목+날짜 헤더 (유지)
 * - Row 2: 컬럼 헤더 (유지)
 * - Row 3+: 데이터 (덮어쓰기)
 */
export const DATA_START_ROW = 3 as const;

/** 총 컬럼 수 (A~P = 16열) — 스타일 복제/클리어 시 사용 */
export const COLUMN_COUNT = 16 as const;

/**
 * 컬럼 정의 — 각 행 주입 시 key 순서대로 값 배열 생성.
 *
 * key: renderer가 데이터 객체에서 추출할 논리 이름 (렌더러 내부에서 분기)
 * header: 원본 양식 Row 2 헤더 텍스트 (참조용 주석)
 *
 * 양식 원본 Row 2 실측:
 * A:관리번호 / B:자산번호 / C:장비명 / D:관리방법 / E:최종교정일 / F:교정기관
 * G:교정주기(개월) / H:차기교정일 / I:제조사 / J:구입년도 / K:모델명 / L:일련번호
 * M:장비사양 / N:위치 / O:중간점검 대상 / P:가용 여부
 */
export const COLUMNS = [
  { key: 'managementNumber', header: '관리번호' },
  { key: 'assetNumber', header: '자산번호' },
  { key: 'name', header: '장비명' },
  { key: 'managementMethod', header: '관리방법' },
  { key: 'lastCalibrationDate', header: '최종교정일' },
  { key: 'calibrationAgency', header: '교정기관' },
  { key: 'calibrationCycle', header: '교정주기(개월)' },
  { key: 'nextCalibrationDate', header: '차기교정일' },
  { key: 'manufacturer', header: '제조사' },
  { key: 'purchaseYear', header: '구입년도' },
  { key: 'modelName', header: '모델명' },
  { key: 'serialNumber', header: '일련번호' },
  { key: 'description', header: '장비사양' },
  { key: 'location', header: '위치' },
  { key: 'needsIntermediateCheck', header: '중간점검 대상' },
  { key: 'availability', header: '가용 여부' },
] as const satisfies readonly { key: string; header: string }[];

export type EquipmentRegistryColumnKey = (typeof COLUMNS)[number]['key'];
