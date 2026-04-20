/**
 * UL-QP-19-01 연간 교정계획서 XLSX 레이아웃 SSOT (backend-local).
 *
 * 원본 양식의 시트명/제목/컬럼 구조를 SSOT로 분리하여 양식 개정 시 surgical update 가능.
 *
 * ⚠️ 컬럼 헤더 문자열은 **원본 xlsx 실측값**과 1:1 일치해야 한다.
 *    양식 개정 시 ExcelJS로 워크시트를 로드해 `sheet.getRow(5).values`로 실측.
 *
 * @see docs/procedure/template/UL-QP-19-01 연간교정계획서.xlsx — 원본 양식
 *
 * 프론트엔드 미참조: 양식 셀 레이아웃은 UI에 노출되지 않음.
 */

/** 양식 번호 (에러 메시지 prefix, 파일명 등에 사용) */
export const FORM_NUMBER = 'UL-QP-19-01' as const;

/**
 * 허용되는 워크시트명 — 양식 변종(띄어쓰기 차이) 대응.
 *
 * 매칭 순서대로 탐색하며, 처음 일치하는 시트를 반환.
 */
export const SHEET_NAMES = ['연간 교정계획서', '교정계획서', 'Sheet1'] as const;

/**
 * 데이터 주입 시작 행 (1-based).
 *
 * - Row 1~3: 병합 제목 (A1:J3) — 연도/사이트 정보
 * - Row 4~5: 컬럼 헤더 (유지)
 * - Row 6+: 데이터 (덮어쓰기)
 */
export const DATA_START_ROW = 6 as const;

/** 총 컬럼 수 (A~J = 10열) — 스타일 복제/클리어 시 사용 */
export const COLUMN_COUNT = 10 as const;

/**
 * 컬럼 정의 — 각 행 주입 시 key 순서대로 값 배열 생성.
 *
 * 양식 원본 Row 4~5 실측:
 * A:순번 / B:관리번호 / C:장비명 / D:현황-유효일자 / E:현황-교정주기
 * F:현황-교정기관 / G:계획-교정일자 / H:계획-교정기관 / I:계획-확인 / J:비고
 */
export const COLUMNS = [
  { key: 'sequenceNumber', header: '순번' },
  { key: 'managementNumber', header: '관리번호' },
  { key: 'equipmentName', header: '장비명' },
  { key: 'snapshotValidityDate', header: '현황-유효일자' },
  { key: 'snapshotCalibrationCycle', header: '현황-교정주기' },
  { key: 'snapshotCalibrationAgency', header: '현황-교정기관' },
  { key: 'plannedCalibrationDate', header: '계획-교정일자' },
  { key: 'plannedCalibrationAgency', header: '계획-교정기관' },
  { key: 'confirmed', header: '계획-확인' },
  { key: 'notes', header: '비고' },
] as const satisfies readonly { key: string; header: string }[];

export type CalibrationPlanColumnKey = (typeof COLUMNS)[number]['key'];
