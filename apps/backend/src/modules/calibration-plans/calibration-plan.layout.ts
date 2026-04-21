/**
 * UL-QP-19-01 연간 교정계획서 XLSX 레이아웃 SSOT (backend-local).
 *
 * 원본 양식의 시트명/제목/컬럼 구조를 SSOT로 분리하여 양식 개정 시 surgical update 가능.
 *
 * ⚠️ 컬럼 헤더 문자열은 **원본 xlsx 실측값**과 1:1 일치해야 한다.
 *    양식 개정 시 ExcelJS로 워크시트를 로드해 `sheet.getRow(5).values`로 실측.
 *
 * @see docs/procedure/template/UL-QP-19-01(00) 연간 교정계획서.xlsx — 원본 양식 (2026-04-20 교체)
 *
 * 프론트엔드 미참조: 양식 셀 레이아웃은 UI에 노출되지 않음.
 */

import type ExcelJS from 'exceljs';

/** 양식 번호 (에러 메시지 prefix, 파일명 등에 사용) */
export const FORM_NUMBER = 'UL-QP-19-01' as const;

/** 셀 alignment 토큰 — 양식 개정 시 이 위치만 수정 */
export const ALIGNMENT = {
  /** 제목 행 / 일반 중앙 정렬 */
  CENTER_MIDDLE: {
    horizontal: 'center',
    vertical: 'middle',
  } as Partial<ExcelJS.Alignment>,
  /** 확인란 / 서명 칸 — 긴 텍스트 수축 허용 */
  CENTER_MIDDLE_SHRINK: {
    horizontal: 'center',
    vertical: 'middle',
    shrinkToFit: true,
  } as Partial<ExcelJS.Alignment>,
} as const;

/**
 * 허용되는 워크시트명 — 양식 변종(시트명 차이) 대응.
 *
 * 매칭 순서대로 탐색하며, 처음 일치하는 시트를 반환.
 * UL-QP-19-01(00) 양식은 시트명이 'Sheet1'이므로 최우선 후보에 배치.
 */
export const SHEET_NAMES = ['Sheet1', '연간 교정계획서', '교정계획서'] as const;

/**
 * 데이터 주입 시작 행 (1-based).
 *
 * - Row 1~3: 병합 제목 (A1:J3) — 연도/사이트 정보
 * - Row 4~5: 컬럼 헤더 (유지)
 * - Row 6+: 데이터 (덮어쓰기)
 */
export const DATA_START_ROW = 6 as const;

/**
 * 데이터 영역 마지막 행 (1-based, 포함).
 *
 * UL-QP-19-01(01) 양식 기준:
 * - Row 6~32: 데이터 영역 (최대 27개 항목)
 * - Row 33: 빈 구분 행
 * - Row 34+: 특기사항/작성·검토·승인 서명란 (clearTrailingRows 보호 필요)
 *
 * ⚠️ clearTrailingRows 호출 시 반드시 이 값을 상한으로 사용할 것.
 *    sheet.rowCount를 상한으로 쓰면 서명란이 파괴됨.
 */
export const DATA_END_ROW = 32 as const;

/** 총 컬럼 수 (A~J = 10열) — 스타일 복제/클리어 시 사용 */
export const COLUMN_COUNT = 10 as const;

/**
 * 확인란 열 위치 (1-based, I열 = 9).
 *
 * 렌더러에서 확인자 서명 주입 및 shrinkToFit 적용 시 이 상수를 참조.
 * 양식 개정으로 열 위치가 바뀌면 여기만 수정.
 */
export const CONFIRMED_COL = 9 as const;

/**
 * 템플릿이 사전 서식(pre-formatted)한 데이터 행 수.
 *
 * = DATA_END_ROW - DATA_START_ROW + 1 = 27행.
 * 항목 수가 이 값을 초과하면 렌더러가 서명란 이전에 빈 행을 동적으로 삽입한다.
 * 항목 수 상한은 없으며, 서명란은 항상 마지막 데이터 행 아래에 위치한다.
 */
export const TEMPLATE_DATA_ROW_COUNT = DATA_END_ROW - DATA_START_ROW + 1; // 27

/**
 * 서명란 이름 행 (1-based).
 *
 * Row 34: 레이블 (특기사항 / 작성 / 검토 / 승인)
 * Row 35: 서명 이름 — E35:F35(작성), G35:H35(검토), I35:J35(승인) 병합
 * Row 37: 날짜 — E37:F37(작성일), G37:H37(검토일), I37:J37(승인일) 병합
 */
export const SIGNATURE_NAME_ROW = 35 as const;
export const SIGNATURE_DATE_ROW = 37 as const;

/** 서명란 컬럼 위치 (1-based) — 병합 셀 최상단 좌측 */
export const SIGNATURE_COLS = {
  author: 5, // E열 (E35:F35, E37:F37)
  reviewer: 7, // G열 (G35:H35, G37:H37)
  approver: 9, // I열 (I35:J35, I37:J37)
} as const;

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
